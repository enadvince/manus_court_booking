import { describe, expect, it } from "vitest";
import { buildSearchIndex, normalize, searchSite } from "./search";

const index = buildSearchIndex();

describe("searchSite", () => {
  it("returns nothing for an empty query", () => {
    expect(searchSite("   ", index)).toEqual([]);
  });

  it("finds FAQ answers by words that only appear in the answer", () => {
    const results = searchSite("refundable", index);
    expect(results[0]?.id).toBe("faq-cancellation");
  });

  it("finds news posts by body text and links to the post", () => {
    const results = searchSite("repainted", index);
    expect(results[0]?.target).toEqual({
      area: "public",
      view: "news",
      anchor: "post-court-resurfacing",
    });
  });

  it("requires every word and ranks title matches first", () => {
    const results = searchSite("court 03", index);
    expect(results[0]?.title).toBe("Court 03");
    expect(results.every(item => item.title !== "Court 01")).toBe(true);
  });

  it("ignores case and accents", () => {
    expect(normalize("Café ÓPEN")).toBe("cafe open");
    expect(searchSite("OPEN play", index)[0]?.title).toBe("Open Play");
  });

  it("indexes club ops screens", () => {
    expect(searchSite("customers", index)[0]?.target).toEqual({
      area: "admin",
      view: "customers",
    });
  });

  it("treats regex characters literally", () => {
    expect(() => searchSite("(court", index)).not.toThrow();
  });

  it("gives every item a unique id", () => {
    expect(new Set(index.map(item => item.id)).size).toBe(index.length);
  });
});

describe("FAQ keywords", () => {
  it("ranks the opening-hours FAQ first for 'hours'", () => {
    const top = searchSite("opening hours", index)[0];
    expect(top?.id).toBe("faq-hours");
  });
});
