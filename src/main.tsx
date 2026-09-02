import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/product-pages.css";
import { initColorPatch } from "./utils/colorPatch.ts";
import { Provider } from "react-redux";
import { store } from "./store/store.ts";
import { BrowserRouter as Router } from "react-router-dom";
import { PostHogProvider } from "@posthog/react";
import { PostHogPageView } from "./components/PostHogPageView";
import posthog from "posthog-js";
import { getPostHogSuperProperties } from "./utils/posthogContext";
import { attachPostHogDebugLogger } from "./utils/posthogDebug";

// import { registerServiceWorker } from "./utils/pwa.ts";

// Register service worker for PWA
// registerServiceWorker();
// if (window.location.hostname === "fm-matrix.lockated.com" || window.location.hostname === "localhost" || window.location.hostname === "web.hisociety.lockated.com") {
  import("./styles/theme.css"); // Lockated Brand Theme - Edit this file for global color changes
  // Initialise runtime color patcher — overrides MUI inline styles and any
  // legacy #C72030 / #C62828 colors injected via sx props or inline styles.
  initColorPatch();
// }
// ── Stale chunk handler ─────────────────────────────────────────────────────
// After a new deployment, the browser may try to load old JS chunk filenames
// that no longer exist on the server. The server returns a 404 HTML page,
// causing a MIME-type error. We detect this and do a single hard reload so
// the browser fetches the latest index.html and the new chunk filenames.
window.addEventListener("vite:preloadError", () => {
  const reloaded = sessionStorage.getItem("chunk_reload");
  if (!reloaded) {
    sessionStorage.setItem("chunk_reload", "1");
    window.location.reload();
  }
});

// Fallback for browsers/bundlers that fire a generic unhandledrejection instead
window.addEventListener("unhandledrejection", (event) => {
  const msg = event?.reason?.message ?? "";
  if (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("error loading dynamically imported module")
  ) {
    event.preventDefault();
    const reloaded = sessionStorage.getItem("chunk_reload");
    if (!reloaded) {
      sessionStorage.setItem("chunk_reload", "1");
      window.location.reload();
    }
  }
});
// ────────────────────────────────────────────────────────────────────────────


import { initPostHogAutoCapture } from "./utils/posthogEvents";

const posthogToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

if (!posthogToken || posthogToken === "phc_replace_me") {
  console.error("[PostHog] VITE_POSTHOG_PROJECT_TOKEN is not set.");
} else {
  posthog.init(posthogToken, {
    api_host: posthogHost,
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
    advanced_disable_decide: true,
    disable_toolbar: true,
  });
  posthog.register(getPostHogSuperProperties());
  attachPostHogDebugLogger(posthog);
  initPostHogAutoCapture();
}

createRoot(document.getElementById("root")!).render(
  <PostHogProvider client={posthog}>
    <Provider store={store}>
      <Router>
        <PostHogPageView />
        <App />
              </Router>
    </Provider>
  </PostHogProvider>
);
