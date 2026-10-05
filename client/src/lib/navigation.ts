export type PublicView =
  | "home"
  | "book"
  | "account"
  | "openplay"
  | "news"
  | "signin";
export type AdminView =
  | "dashboard"
  | "schedule"
  | "resources"
  | "customers"
  | "settings";

export const publicViews: readonly PublicView[] = [
  "home",
  "book",
  "account",
  "openplay",
  "news",
  "signin",
];
export const adminViews: readonly AdminView[] = [
  "dashboard",
  "schedule",
  "resources",
  "customers",
  "settings",
];

export function parsePublicView(value: string | null): PublicView {
  return publicViews.includes(value as PublicView)
    ? (value as PublicView)
    : "home";
}

export function parseAdminView(value: string | null): AdminView {
  return adminViews.includes(value as AdminView)
    ? (value as AdminView)
    : "dashboard";
}

/** Where a link, menu item or search result should take the visitor. */
export type SiteTarget =
  | { area: "public"; view: PublicView; anchor?: string }
  | { area: "admin"; view: AdminView };

export function targetToUrl(target: SiteTarget): string {
  if (target.area === "admin") {
    return target.view === "dashboard"
      ? "/admin"
      : `/admin?view=${target.view}`;
  }
  const query = target.view === "home" ? "/" : `/?view=${target.view}`;
  return target.anchor ? `${query}#${target.anchor}` : query;
}

export function urlToTarget(
  pathname: string,
  search: string,
  hash: string
): SiteTarget {
  const view = new URLSearchParams(search).get("view");
  if (pathname.startsWith("/admin")) {
    return { area: "admin", view: parseAdminView(view) };
  }
  const anchor = safeDecode(hash.replace(/^#/, ""));
  return {
    area: "public",
    view: parsePublicView(view),
    ...(anchor ? { anchor } : {}),
  };
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value; // malformed escapes like "%E0" must not crash the page
  }
}

/** Fired on window by anything outside Home that needs to change the view. */
export const NAVIGATE_EVENT = "baseline:navigate";

/**
 * Asks the mounted Home page to show `target`. Home cancels the event when it
 * handles it; anywhere else (e.g. the 404 page) we fall back to a full URL change.
 */
export function navigateTo(target: SiteTarget) {
  const handled = !window.dispatchEvent(
    new CustomEvent<SiteTarget>(NAVIGATE_EVENT, {
      detail: target,
      cancelable: true,
    })
  );
  if (!handled) window.location.assign(targetToUrl(target));
}
