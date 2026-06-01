import { describe, it, expect } from "vitest";
import { createMockPriceProvider } from "@/lib/pricing/mock-price-provider";

const provider = createMockPriceProvider(() => "2026-06-01T00:00:00.000Z");

describe("MockPriceProvider", () => {
  it("mode는 mock", () => {
    expect(provider.mode).toBe("mock");
  });
  it("가격과 통화가 있는 quote들을 반환한다", () => {
    const quotes = provider.search({ title: "One More Time", artist: "Daft Punk" });
    expect(quotes.length).toBeGreaterThan(0);
    for (const q of quotes) {
      expect(typeof q.price).toBe("number");
      expect(q.currency).toBe("USD");
    }
  });
  it("정확히 1개만 isLowest=true이고 그것이 최저가다", () => {
    const quotes = provider.search({ title: "One More Time", artist: "Daft Punk" });
    const lowest = quotes.filter((q) => q.isLowest);
    expect(lowest).toHaveLength(1);
    const min = Math.min(...quotes.map((q) => q.price as number));
    expect(lowest[0].price).toBe(min);
  });
  it("동일 입력에 대해 결정적 가격을 반환한다", () => {
    const a = provider.search({ title: "One More Time", artist: "Daft Punk" });
    const b = provider.search({ title: "One More Time", artist: "Daft Punk" });
    expect(a.map((q) => q.price)).toEqual(b.map((q) => q.price));
  });
});
