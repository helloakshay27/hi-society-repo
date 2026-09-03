import posthog from "posthog-js";

export function initializePostHog() {
  const apiKey =
    (import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined) ??
    (import.meta.env.VITE_POSTHOG_PROJECT_TOKEN as string | undefined);
  const apiHost =
    (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) ??
    (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ??
    "https://posthog.lockated.com";

  if (!apiKey || apiKey === "phc_replace_me") {
    console.warn("[PostHog] Project key is missing or not configured");
    return;
  }

  posthog.init(apiKey, {
    api_host: apiHost,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage",
    disable_session_recording: true,
    advanced_disable_decide: true,
    disable_toolbar: true,
  });
}

export function identifyUser(user: {
  id: string | number;
  email?: string;
  name?: string;
  phone?: string;
  [key: string]: unknown;
}) {
  posthog.identify(String(user.id), {
    email: user.email,
    name: user.name,
    phone: user.phone,
    ...user,
  });
}

export function resetPostHogUser() {
  posthog.reset();
}

export default posthog;
