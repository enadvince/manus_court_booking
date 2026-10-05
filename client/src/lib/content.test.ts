import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDay } from "./dates";
import { isValidEmail, subscribeToNewsletter } from "./newsletter";
import {
  parseAdminView,
  parsePublicView,
  targetToUrl,
  urlToTarget,
} from "./navigation";
import { posts } from "./siteContent";

describe("formatDay", () => {
  it("formats calendar days without timezone drift", () => {
    expect(formatDay("2026-09-29")).toMatch(/^29 Sept? 2026$/);
    expect(formatDay("2026-01-01")).toMatch(/^1 Jan 2026$/);
  });

  it("rejects invalid dates", () => {
    expect(() => formatDay("not-a-date")).toThrow();
  });
});

describe("posts", () => {
  it("every post has a last-updated date on or after publishing", () => {
    for (const post of posts) {
      expect(post.updated >= post.published).toBe(true);
      expect(() => formatDay(post.updated)).not.toThrow();
    }
  });
});

describe("newsletter", () => {
  afterEach(() => vi.useRealTimers());

  it("validates email addresses", () => {
    expect(isValidEmail("alex@example.com")).toBe(true);
    expect(isValidEmail("  alex@mail.example.ph ")).toBe(true);
    expect(isValidEmail("alex@example")).toBe(false);
    expect(isValidEmail("alex example.com")).toBe(false);
    expect(isValidEmail("alex@.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects invalid addresses before sending", async () => {
    await expect(subscribeToNewsletter("nope")).resolves.toEqual({
      ok: false,
      message: "Enter a valid email address.",
    });
  });

  it("resolves in demo mode when no endpoint is configured", async () => {
    vi.useFakeTimers();
    const pending = subscribeToNewsletter("alex@example.com");
    await vi.advanceTimersByTimeAsync(700);
    await expect(pending).resolves.toEqual({ ok: true });
  });
});

describe("navigation parsing", () => {
  it("falls back to safe defaults for unknown views", () => {
    expect(parsePublicView("news")).toBe("news");
    expect(parsePublicView("<script>")).toBe("home");
    expect(parsePublicView(null)).toBe("home");
    expect(parseAdminView("settings")).toBe("settings");
    expect(parseAdminView("nope")).toBe("dashboard");
  });
});

describe("view URLs", () => {
  it("round-trips public, anchored and admin targets", () => {
    const targets = [
      { area: "public", view: "home" },
      { area: "public", view: "news", anchor: "post-player-caps" },
      { area: "public", view: "home", anchor: "faq-hours" },
      { area: "admin", view: "dashboard" },
      { area: "admin", view: "settings" },
    ] as const;
    for (const target of targets) {
      const url = new URL(targetToUrl(target), "https://baseline.ph");
      expect(urlToTarget(url.pathname, url.search, url.hash)).toEqual(target);
    }
  });

  it("keeps the original links working", () => {
    expect(targetToUrl({ area: "public", view: "book" })).toBe("/?view=book");
    expect(urlToTarget("/admin", "?view=customers", "")).toEqual({
      area: "admin",
      view: "customers",
    });
  });

  it("survives malformed fragments", () => {
    expect(urlToTarget("/", "", "#%E0")).toEqual({
      area: "public",
      view: "home",
      anchor: "%E0",
    });
  });
});
