// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({
  error: vi.fn(),
  warning: vi.fn(),
  success: vi.fn(),
  dismiss: vi.fn(),
}));
vi.mock("sonner", () => ({ toast }));

const setOnline = (value: boolean) =>
  Object.defineProperty(navigator, "onLine", { value, configurable: true });

const install = async (nativeFetch: typeof fetch) => {
  window.fetch = nativeFetch;
  vi.resetModules();
  const { installNetworkMonitor } = await import("./networkMonitor");
  installNetworkMonitor();
};

const failApiCall = () => window.fetch("https://.lockated.com/x").catch(() => undefined);
const failingApi = (probeWorks: boolean) =>
  vi.fn(async (input: RequestInfo | URL) => {
    if (input === "/favicon.ico" && probeWorks) return new Response(null);
    throw new TypeError("Failed to fetch");
  }) as unknown as typeof fetch;

describe("networkMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setOnline(true);
  });

  it("stays silent when an API call fails but the connection works", async () => {
    await install(failingApi(true));
    await failApiCall();
    await new Promise((r) => setTimeout(r));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows the offline toast when the connection check also fails", async () => {
    await install(failingApi(false));
    await failApiCall();
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(toast.error.mock.calls[0][0]).toBe("You're Offline");
  });

  it("shows the offline toast when the browser reports offline", async () => {
    await install(failingApi(true));
    setOnline(false);
    await failApiCall();
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith(
      "You're Offline",
      expect.objectContaining({ id: "network-offline" })
    ));
  });
});
