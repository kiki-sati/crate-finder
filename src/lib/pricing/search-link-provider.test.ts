import { describe, it, expect } from "vitest";
import { createSearchLinkProvider } from "@/lib/pricing/search-link-provider";

const provider = createSearchLinkProvider(() => "2026-06-01T00:00:00.000Z");

describe("SearchLinkProvider", () => {
  it("mode는 search_link", () => {
    expect(provider.mode).toBe("search_link");
  });
  it("사이트당 1개씩 quote를 반환한다", () => {
    const quotes = provider.search({ title: "One More Time", artist: "Daft Punk" });
    const sites = quotes.map((q) => q.site);
    expect(sites).toEqual(["Beatport", "Juno Download", "Traxsource"]);
  });
  it("각 url은 인코딩된 query를 포함하고 가격은 없다", () => {
    const quotes = provider.search({ title: "One More Time", artist: "Daft Punk" });
    const encoded = encodeURIComponent("daft punk one more time");
    for (const q of quotes) {
      expect(q.url).toContain(encoded);
      expect(q.price).toBeUndefined();
      expect(q.fetchedAt).toBe("2026-06-01T00:00:00.000Z");
    }
  });
  it("Beatport url은 beatport 도메인으로 시작한다", () => {
    const [beatport] = provider.search({ title: "X" });
    expect(beatport.url.startsWith("https://www.beatport.com/")).toBe(true);
  });
});
