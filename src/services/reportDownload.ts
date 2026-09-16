import { toast } from 'sonner';

/**
 * Shared file-save helper for the Tickets Dashboard's CSV/XLSX export endpoints.
 *
 * These endpoints answer with a file on success but with JSON on failure — and,
 * for the incident per-card exports, JSON with a 200 when the filtered query is
 * empty (`{ success: 0, message: 'No data found' }`). Because the request asks for
 * a blob, that JSON would otherwise be saved as a .csv/.xlsx full of JSON, so both
 * cases are unwrapped here and surfaced as a toast instead of a junk file.
 *
 * Note these downloads go through `apiClient` rather than `window.open` /
 * an anchor href: the APIs authenticate with a Bearer token that the interceptor
 * attaches, which a plain browser navigation would not send.
 */

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/** Pulls `error` / `message` out of a JSON error body delivered as a Blob. */
const messageFromBlob = async (blob: Blob, fallback: string): Promise<string> => {
  try {
    const parsed = JSON.parse(await blob.text()) as { error?: string; message?: string };
    return parsed?.error || parsed?.message || fallback;
  } catch {
    return fallback;
  }
};

/**
 * Awaits a blob-typed axios request and saves the result as `filename`.
 * Throws (after toasting) when the server answered with JSON instead of a file,
 * so the calling button can reset without downloading anything.
 */
export const saveReportDownload = async (
  request: Promise<{ data: unknown }>,
  filename: string
): Promise<void> => {
  let blob: Blob;

  try {
    const response = await request;
    blob = response.data as Blob;
  } catch (error) {
    // A 4xx/5xx on a blob request carries its JSON error body as a Blob too.
    const body = (error as { response?: { data?: unknown } })?.response?.data;
    if (body instanceof Blob) {
      const message = await messageFromBlob(body, 'Download failed. Please try again.');
      toast.error(message);
      throw new Error(message);
    }
    throw error;
  }

  if (blob?.type?.includes('json')) {
    const message = await messageFromBlob(blob, 'No data found for the selected filters.');
    toast.info(message);
    throw new Error(message);
  }

  triggerDownload(blob, filename);
};
