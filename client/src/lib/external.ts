import { addUtmParams } from "./utm";

/** Opens an outbound URL in a new tab with UTM tracking applied. */
export function openExternal(url: string) {
  window.open(
    addUtmParams(url, window.location.origin),
    "_blank",
    "noopener,noreferrer"
  );
}
