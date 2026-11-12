// Runwal Connect store listings and platform detection for the /app/* deep-link
// fallback (see src/pages/AppDeepLinkFallback.tsx).

export const STORE_URLS = {
  android: "https://play.google.com/store/apps/details?id=com.lockated.Runwal",
  ios: "https://apps.apple.com/in/app/runwal-connect/id1442532298",
} as const;

export type MobilePlatform = keyof typeof STORE_URLS;

/** Returns the mobile platform of the visitor, or null on desktop / unknown. */
export const detectMobilePlatform = (
  userAgent: string,
  platform = "",
  maxTouchPoints = 0
): MobilePlatform | null => {
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  // iPadOS 13+ in "desktop mode" sends a Mac user agent; the touch screen is the
  // only thing that tells it apart from a real Mac.
  if (platform === "MacIntel" && maxTouchPoints > 1) return "ios";
  return null;
};
