import { useSyncExternalStore } from "react";
import axios from "axios";
import { toast } from "sonner";

/**
 * Background download manager for the Manage Users stat-card reports
 * (`/crm/admin/user_societies.xlsx`).
 *
 * Large reports are generated asynchronously: the endpoint answers with
 * `{ status: "processing", report_id }` and must be polled on
 * `/crm/admin/user_societies_report_status` until it has a `download_url`.
 *
 * Polling lives here at module level, not inside a page component, so it keeps
 * running when the user navigates to another route. Pending report ids are also
 * persisted to localStorage, so after a full reload `resumePendingUserReportDownloads()`
 * (called once from App) picks polling back up and still delivers the file.
 */

export interface ExportReportResponse {
  status: string;
  report_id?: number | string;
  message?: string;
  download_url?: string;
}

export const isExportReportResponse = (
  value: unknown
): value is ExportReportResponse => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("status" in value) ||
    typeof value.status !== "string"
  ) {
    return false;
  }

  return (
    (!("report_id" in value) ||
      typeof value.report_id === "string" ||
      typeof value.report_id === "number") &&
    (!("message" in value) || typeof value.message === "string") &&
    (!("download_url" in value) || typeof value.download_url === "string")
  );
};

interface PendingReport {
  reportId: number | string;
  fileName: string;
  baseUrl: string;
  startedAt: number;
}

const STORAGE_KEY = "pendingUserReportDownloads";
const POLL_INTERVAL_MS = 5000;
// Reports older than this are assumed abandoned and are not resumed
const MAX_REPORT_AGE_MS = 6 * 60 * 60 * 1000;
// Tolerate brief network blips before giving up on a report
const MAX_CONSECUTIVE_POLL_ERRORS = 3;

// ---------- active-download store (drives the stat-card spinners) ----------

const activeFiles = new Set<string>();
let activeSnapshot: string[] = [];
const listeners = new Set<() => void>();

const emitChange = () => {
  activeSnapshot = [...activeFiles];
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => activeSnapshot;

/** File names of reports currently being generated/downloaded. */
export const useActiveUserReportDownloads = (): string[] =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

const runWhileActive = async (fileName: string, task: () => Promise<void>) => {
  activeFiles.add(fileName);
  emitChange();
  try {
    await task();
  } finally {
    activeFiles.delete(fileName);
    emitChange();
  }
};

// ---------- persisted pending reports ----------

const readPending = (): PendingReport[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PendingReport[]) : [];
  } catch {
    return [];
  }
};

const writePending = (reports: PendingReport[]) => {
  try {
    if (reports.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage unavailable: polling still works for this session
  }
};

const savePending = (report: PendingReport) => {
  writePending([
    ...readPending().filter((r) => r.fileName !== report.fileName),
    report,
  ]);
};

const removePending = (fileName: string) => {
  writePending(readPending().filter((r) => r.fileName !== fileName));
};

// ---------- download helpers ----------

const toastIdFor = (fileName: string) => `user-report-${fileName}`;

const triggerDownload = (href: string, fileName: string) => {
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const finishReport = (report: ExportReportResponse, fileName: string) => {
  const toastId = toastIdFor(fileName);

  if (report.status === "completed") {
    if (!report.download_url) {
      throw new Error("Missing download URL in completed response");
    }
    triggerDownload(report.download_url, fileName);
    toast.success(report.message ?? `${fileName} downloaded successfully.`, {
      id: toastId,
    });
    return;
  }

  if (report.status === "failed" || report.status === "not_started") {
    toast.error(report.message ?? "Failed to download file. Please try again.", {
      id: toastId,
    });
    return;
  }

  throw new Error(`Unexpected report status: ${report.status}`);
};

const pollUntilDone = async (pending: PendingReport) => {
  let consecutiveErrors = 0;

  for (;;) {
    await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));

    // Read the token on every poll: the user may have logged out or re-logged in
    const token = localStorage.getItem("token");
    if (!token) {
      // Logged out — keep the report pending so it resumes after next login
      return;
    }

    let report: ExportReportResponse;
    try {
      const response = await axios.get<unknown>(
        `https://${pending.baseUrl}/crm/admin/user_societies_report_status`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { report_id: pending.reportId },
        }
      );
      if (!isExportReportResponse(response.data)) {
        throw new Error("Invalid report status response");
      }
      report = response.data;
      consecutiveErrors = 0;
    } catch (error) {
      consecutiveErrors += 1;
      if (consecutiveErrors >= MAX_CONSECUTIVE_POLL_ERRORS) {
        removePending(pending.fileName);
        throw error;
      }
      continue;
    }

    if (report.status === "processing") continue;

    removePending(pending.fileName);
    finishReport(report, pending.fileName);
    return;
  }
};

// ---------- public API ----------

/**
 * Requests a user_societies report and delivers the file, either directly or
 * after background generation. Safe to fire-and-forget: it outlives the page.
 */
export const startUserReportDownload = async (
  endpoint: string,
  fileName: string
): Promise<void> => {
  if (activeFiles.has(fileName)) {
    toast.info(`${fileName} is already being generated.`);
    return;
  }

  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");
  if (!baseUrl || !token) {
    toast.error("Missing authentication details. Please login again.");
    return;
  }

  const toastId = toastIdFor(fileName);

  await runWhileActive(fileName, async () => {
    try {
      // Request as blob: the endpoint returns either the xlsx itself or a JSON
      // report status, and only the content-type tells which.
      const response = await axios.get<Blob>(`https://${baseUrl}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const contentType = String(response.headers["content-type"] ?? "");

      if (!contentType.includes("json")) {
        const url = window.URL.createObjectURL(response.data);
        triggerDownload(url, fileName);
        window.URL.revokeObjectURL(url);
        toast.success(`${fileName} downloaded successfully.`, { id: toastId });
        return;
      }

      const responseData: unknown = JSON.parse(await response.data.text());
      if (!isExportReportResponse(responseData)) {
        throw new Error("Invalid report response");
      }

      if (responseData.status !== "processing") {
        finishReport(responseData, fileName);
        return;
      }

      const reportId = responseData.report_id;
      if (reportId === undefined || reportId === "") {
        throw new Error("Missing report ID in processing response");
      }

      const pending: PendingReport = {
        reportId,
        fileName,
        baseUrl,
        startedAt: Date.now(),
      };
      savePending(pending);

      await pollUntilDone(pending);
    } catch (error) {
      console.error(`Error downloading ${fileName}:`, error);
      toast.error("Failed to download file. Please try again.", { id: toastId });
    }
  });
};

/**
 * Resumes polling for reports that were still generating when the app was
 * last closed or reloaded. Call once after the user is authenticated.
 */
export const resumePendingUserReportDownloads = () => {
  const now = Date.now();
  const pending = readPending();
  const fresh = pending.filter((r) => now - r.startedAt < MAX_REPORT_AGE_MS);
  if (fresh.length !== pending.length) writePending(fresh);

  fresh
    .filter((report) => !activeFiles.has(report.fileName))
    .forEach((report) => {
      const toastId = toastIdFor(report.fileName);
      void runWhileActive(report.fileName, async () => {
        try {
          await pollUntilDone(report);
        } catch (error) {
          console.error(`Error resuming ${report.fileName}:`, error);
          toast.error("Failed to download file. Please try again.", {
            id: toastId,
          });
        }
      });
    });
};
