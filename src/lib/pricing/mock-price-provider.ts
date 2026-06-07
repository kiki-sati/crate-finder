import type { PriceProvider, PriceSearchInput } from "@/lib/pricing/price-provider";
import { buildQuery } from "@/lib/pricing/price-provider";
import type { PriceQuote } from "@/types/pricing";

const SITES = ["Beatport", "Juno Download", "Traxsource"];

// query에서 결정적 의사난수 시드 생성(테스트 안정성을 위해 Math.random 미사용).
function seedFrom(query: string): number {
  let h = 0;
  for (let i = 0; i < query.length; i++) {
    h = (h * 31 + query.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function createMockPriceProvider(
  now: () => string = () => new Date().toISOString(),
): PriceProvider {
  return {
    mode: "mock",
    search(input: PriceSearchInput): PriceQuote[] {
      const query = buildQuery(input);
      const seed = seedFrom(query);
      const fetchedAt = now();
      const quotes: PriceQuote[] = SITES.map((site, i) => ({
        site,
        // 1.49 ~ 3.48 범위의 결정적 가격
        price: (149 + ((seed + i * 37) % 200)) / 100,
        currency: "USD",
        url: `https://example.com/${encodeURIComponent(
          site.toLowerCase(),
        )}/${encodeURIComponent(query)}`,
        fetchedAt,
      }));
      const min = Math.min(...quotes.map((q) => q.price as number));
      let marked = false;
      return quotes.map((q) => {
        if (!marked && q.price === min) {
          marked = true;
          return { ...q, isLowest: true };
        }
        return q;
      });
    },
  };
}

export const mockPriceProvider = createMockPriceProvider();
