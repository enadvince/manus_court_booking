import { describe, expect, it } from "vitest";
import { addUtmParams } from "./utm";

const origin = "https://baseline.ph";

describe("addUtmParams", () => {
  it("tags outbound links and keeps existing query and hash", () => {
    const result = new URL(
      addUtmParams("https://maps.google.com/search?q=club#top", origin)
    );
    expect(result.searchParams.get("q")).toBe("club");
    expect(result.searchParams.get("utm_source")).toBe("baselinepickleclub");
    expect(result.searchParams.get("utm_medium")).toBe("referral");
    expect(result.searchParams.get("utm_campaign")).toBe("site");
    expect(result.hash).toBe("#top");
  });

  it("never overwrites UTM values already on the link", () => {
    const result = new URL(
      addUtmParams("https://example.com/?utm_source=partner", origin)
    );
    expect(result.searchParams.get("utm_source")).toBe("partner");
    expect(result.searchParams.get("utm_medium")).toBe("referral");
  });

  it("is idempotent", () => {
    const once = addUtmParams("https://example.com/a", origin);
    expect(addUtmParams(once, origin)).toBe(once);
  });

  it("leaves internal, relative and non-web links alone", () => {
    expect(addUtmParams("https://baseline.ph/?view=book", origin)).toBe(
      "https://baseline.ph/?view=book"
    );
    expect(addUtmParams("/?view=news", origin)).toBe("/?view=news");
    expect(addUtmParams("mailto:hello@baseline.ph", origin)).toBe(
      "mailto:hello@baseline.ph"
    );
    expect(addUtmParams("tel:+639170000000", origin)).toBe("tel:+639170000000");
    expect(addUtmParams("http://[bad", origin)).toBe("http://[bad");
  });
});
