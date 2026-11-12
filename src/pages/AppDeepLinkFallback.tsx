import { useEffect } from "react";
import { STORE_URLS, detectMobilePlatform } from "@/utils/appLinks";

/**
 * Fallback for Runwal Connect deep links, e.g. https://runwal.lockated.com/app/payments-due
 *
 * With the app installed, Android App Links / iOS Universal Links open the app
 * directly (verified through public/.well-known/*) and this page is never loaded.
 * It is only reached when the app did not open: not installed, a desktop browser,
 * or the link was pasted into an address bar.
 *   - Android / iOS: sent straight to Google Play / the App Store.
 *   - Desktop: a message with both store links.
 * Public route (no login) and shows no customer data.
 */
const AppDeepLinkFallback = () => {
  const platform = detectMobilePlatform(
    navigator.userAgent,
    navigator.platform,
    navigator.maxTouchPoints
  );

  useEffect(() => {
    if (platform) window.location.replace(STORE_URLS[platform]);
  }, [platform]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="mb-3 text-2xl font-semibold text-gray-900">
          Open this link in Runwal Connect
        </h1>
        <p className="mb-6 text-gray-600">
          {platform
            ? "Install the Runwal Connect app to continue."
            : "Please open this link on your phone to continue in the Runwal Connect app."}
        </p>
        {platform !== "ios" && (
          <a
            href={STORE_URLS.android}
            className="mb-3 block rounded-lg bg-brand px-4 py-3 font-semibold text-white"
          >
            Get it on Google Play
          </a>
        )}
        {platform !== "android" && (
          <a
            href={STORE_URLS.ios}
            className="mb-3 block rounded-lg border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-900"
          >
            Download on the App Store
          </a>
        )}
        <p className="mt-4 text-sm text-gray-500">
          Already have the app? Open Runwal Connect and continue from there.
        </p>
      </div>
    </div>
  );
};

export default AppDeepLinkFallback;
