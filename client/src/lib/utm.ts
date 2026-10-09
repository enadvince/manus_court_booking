export const DEFAULT_UTM = {
  utm_source: "baselinepickleclub",
  utm_medium: "referral",
  utm_campaign: "site",
} as const;

/**
 * Adds UTM parameters to an outbound http(s) link. Same-origin links,
 * non-web schemes (mailto:, tel:) and unparsable values are returned
 * unchanged, and UTM values already on the link are never overwritten.
 */
export function addUtmParams(
  href: string,
  currentOrigin: string,
  params: Record<string, string> = DEFAULT_UTM
): string {
  let url: URL;
  try {
    url = new URL(href, currentOrigin);
  } catch {
    return href;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return href;
  if (url.origin === currentOrigin) return href;
  let changed = false;
  for (const [key, value] of Object.entries(params)) {
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value);
      changed = true;
    }
  }
  return changed ? url.toString() : href;
}
