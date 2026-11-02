import { toast } from "sonner";

// How long a request may run before we tell the user the network is slow
const SLOW_REQUEST_MS = 5000;
// Requested to confirm the connection really is down when an API call fails
const CONNECTION_CHECK_URL = "/favicon.ico";
const CONNECTION_CHECK_TIMEOUT_MS = 4000;
const CONNECTION_RECHECK_MS = 5000;

const SLOW_TOAST_ID = "network-slow";
const OFFLINE_TOAST_ID = "network-offline";
const ERROR_TOAST_ID = "network-error";

const SLOW_MESSAGE =
  "Your network seems slow. This is taking longer than usual, please wait...";
const OFFLINE_TITLE = "You're Offline";
const OFFLINE_MESSAGE =
  "It looks like your computer isn't connected to the internet. Please check your Wi-Fi, Ethernet, or network settings and try again.";
const BACK_ONLINE_MESSAGE = "You are back online.";
const TIMEOUT_MESSAGE =
  "The request timed out due to a slow network. Please try again.";

// Analytics traffic is invisible to the user, so it shouldn't raise toasts
const IGNORED_URL_PARTS = [
  import.meta.env.VITE_POSTHOG_HOST,
  "posthog",
].filter(Boolean) as string[];

const isIgnored = (url: string): boolean =>
  IGNORED_URL_PARTS.some((part) => url.includes(part));

const isOffline = (): boolean =>
  typeof navigator !== "undefined" && navigator.onLine === false;

// Shared across requests so several slow requests show a single toast
let slowRequestsInFlight = 0;

/** Starts the slow-request timer; returns a function that ends tracking. */
const trackRequest = (): (() => void) => {
  let isSlow = false;
  let finished = false;

  const timer = setTimeout(() => {
    isSlow = true;
    slowRequestsInFlight += 1;
    // The offline toast already explains the delay
    if (!isOffline()) {
      toast.warning(SLOW_MESSAGE, { id: SLOW_TOAST_ID, duration: Infinity });
    }
  }, SLOW_REQUEST_MS);

  return () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    if (isSlow) {
      slowRequestsInFlight -= 1;
      if (slowRequestsInFlight <= 0) {
        slowRequestsInFlight = 0;
        toast.dismiss(SLOW_TOAST_ID);
      }
    }
  };
};

const showOfflineToast = () => {
  toast.error(OFFLINE_TITLE, {
    id: OFFLINE_TOAST_ID,
    description: OFFLINE_MESSAGE,
    duration: Infinity,
  });
};

const showBackOnlineToast = () => {
  // Same id, so the offline toast turns into the "back online" one
  toast.success(BACK_ONLINE_MESSAGE, {
    id: OFFLINE_TOAST_ID,
    // Clear the offline body copy, which sonner keeps when updating by id
    description: undefined,
    duration: 3000,
  });
};

// Not patched, so connection checks never report themselves as failures
let nativeFetch: typeof window.fetch;
let connectionCheck: Promise<boolean> | null = null;

/** navigator.onLine stays true on Wi-Fi with no internet, so verify with a request. */
const hasConnection = (): Promise<boolean> => {
  if (isOffline()) return Promise.resolve(false);
  // The packaged desktop app has no web origin to check against
  if (!window.location.protocol.startsWith("http")) return Promise.resolve(true);

  if (!connectionCheck) {
    connectionCheck = nativeFetch(CONNECTION_CHECK_URL, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(CONNECTION_CHECK_TIMEOUT_MS),
    })
      .then(
        () => true,
        () => false
      )
      .finally(() => {
        connectionCheck = null;
      });
  }
  return connectionCheck;
};

let recoveryTimer: ReturnType<typeof setInterval> | null = null;

const stopRecoveryWatch = () => {
  if (recoveryTimer) clearInterval(recoveryTimer);
  recoveryTimer = null;
};

// No "online" event fires if navigator.onLine never changed, so poll for recovery
const watchForRecovery = () => {
  if (recoveryTimer) return;
  recoveryTimer = setInterval(async () => {
    if (await hasConnection()) {
      stopRecoveryWatch();
      showBackOnlineToast();
    }
  }, CONNECTION_RECHECK_MS);
};

/**
 * A failed request alone doesn't mean the internet is down (bad host, CORS,
 * server outage), so only a confirmed loss of connection raises a toast.
 */
const reportNetworkFailure = async () => {
  if (await hasConnection()) return;
  showOfflineToast();
  watchForRecovery();
};

const getRequestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
};

const patchFetch = () => {
  const originalFetch = window.fetch.bind(window);
  nativeFetch = originalFetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (isIgnored(getRequestUrl(input))) return originalFetch(input, init);

    const finish = trackRequest();
    try {
      return await originalFetch(input, init);
    } catch (error) {
      // A cancelled request is intentional, not a network problem
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        reportNetworkFailure();
      }
      throw error;
    } finally {
      finish();
    }
  };
};

const patchXhr = () => {
  const requestUrls = new WeakMap<XMLHttpRequest, string>();
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    ...args: Parameters<XMLHttpRequest["open"]>
  ) {
    requestUrls.set(this, String(args[1]));
    return (originalOpen as (...a: unknown[]) => void).apply(this, args);
  } as XMLHttpRequest["open"];

  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest,
    body?: Document | XMLHttpRequestBodyInit | null
  ) {
    if (!isIgnored(requestUrls.get(this) || "")) {
      const finish = trackRequest();
      this.addEventListener("loadend", finish);
      this.addEventListener("error", reportNetworkFailure);
      this.addEventListener("timeout", () => {
        toast.error(TIMEOUT_MESSAGE, { id: ERROR_TOAST_ID });
      });
    }
    return originalSend.call(this, body);
  };
};

const watchConnection = () => {
  window.addEventListener("offline", showOfflineToast);
  window.addEventListener("online", () => {
    stopRecoveryWatch();
    showBackOnlineToast();
  });
  if (isOffline()) showOfflineToast();
};

let installed = false;

/**
 * Shows toasts app-wide when requests are slow or time out, or the device
 * genuinely loses and regains its internet connection.
 */
export const installNetworkMonitor = () => {
  if (installed || typeof window === "undefined") return;
  installed = true;

  try {
    patchFetch();
    patchXhr();
    watchConnection();
  } catch (error) {
    // Never let the monitor block the app from rendering
    console.error("[networkMonitor] failed to install:", error);
  }
};
