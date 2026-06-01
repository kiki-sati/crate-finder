import { describe, it, expect } from "vitest";
import { resolveProvider, searchOffers } from "@/services/price-provider.service";

describe("price-provider.service", () => {
  it("PRICE_PROVIDER_MODE=mock 이면 mock provider", () => {
    expect(resolveProvider("mock").mode).toBe("mock");
  });
  it("search_link 이면 search-link provider", () => {
    expect(resolveProvider("search_link").mode).toBe("search_link");
  });
  it("미설정이면 기본 search_link", () => {
    expect(resolveProvider(undefined).mode).toBe("search_link");
  });
  it("external(미구현)이면 search_link로 fallback", () => {
    expect(resolveProvider("external").mode).toBe("search_link");
  });
  it("searchOffers는 query/offers/provider를 반환한다", () => {
    const res = searchOffers(
      { title: "One More Time", artist: "Daft Punk" },
      resolveProvider("mock"),
    );
    expect(res.query).toBe("daft punk one more time");
    expect(res.offers.length).toBeGreaterThan(0);
    expect(res.provider).toBe("mock");
  });
  it("title이 비어 있으면 throw한다", () => {
    expect(() => searchOffers({ title: "  " })).toThrow();
  });
});
