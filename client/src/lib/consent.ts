import { readStorage, writeStorage } from "./storage";

export type Consent = "accepted" | "declined";
export const CONSENT_KEY = "baseline-cookie-consent";

export function readConsent(): Consent | null {
  const value = readStorage(CONSENT_KEY);
  return value === "accepted" || value === "declined" ? value : null;
}

export function writeConsent(consent: Consent) {
  writeStorage(CONSENT_KEY, consent);
  if (consent === "accepted") loadAnalytics();
}

/** Loads Umami only after consent, and only when it is configured. */
export function loadAnalytics() {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as
    | string
    | undefined;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID as
    | string
    | undefined;
  if (!endpoint || !websiteId) return;
  if (document.querySelector("script[data-baseline-analytics]")) return;
  const script = document.createElement("script");
  script.defer = true;
  script.src = `${endpoint.replace(/\/+$/, "")}/umami`;
  script.dataset.websiteId = websiteId;
  script.dataset.baselineAnalytics = "";
  document.body.appendChild(script);
}
