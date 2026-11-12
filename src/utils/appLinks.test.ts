import { describe, expect, it } from "vitest";
import { STORE_URLS, detectMobilePlatform } from "./appLinks";

const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const IPAD_UA =
  "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";

describe("detectMobilePlatform", () => {
  it("detects Android", () => {
    expect(detectMobilePlatform(ANDROID_UA)).toBe("android");
  });

  it("detects iPhone and iPad", () => {
    expect(detectMobilePlatform(IPHONE_UA)).toBe("ios");
    expect(detectMobilePlatform(IPAD_UA)).toBe("ios");
  });

  it("detects iPadOS desktop mode (Mac user agent + touch screen)", () => {
    expect(detectMobilePlatform(MAC_UA, "MacIntel", 5)).toBe("ios");
  });

  it("treats a real Mac and other desktops as desktop", () => {
    expect(detectMobilePlatform(MAC_UA, "MacIntel", 0)).toBeNull();
    expect(detectMobilePlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Win32", 0)).toBeNull();
  });
});

describe("STORE_URLS", () => {
  it("points at the Runwal Connect listings", () => {
    expect(STORE_URLS.android).toBe("https://play.google.com/store/apps/details?id=com.lockated.Runwal");
    expect(STORE_URLS.ios).toBe("https://apps.apple.com/in/app/runwal-connect/id1442532298");
  });
});
