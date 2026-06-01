import type { PriceProvider, PriceSearchInput } from "@/lib/pricing/price-provider";
import { buildQuery } from "@/lib/pricing/price-provider";
import type { PriceQuote } from "@/types/pricing";

// 검색 링크 대상 사이트. baseUrl 뒤에 encodeURIComponent(query)를 붙인다.
// ARCHITECTURE §11.3. URL 형식은 사이트 정책 변경 시 조정 가능(저위험: 단순 링크).
const SITES: { site: string; baseUrl: string }[] = [
  { site: "Beatport", baseUrl: "https://www.beatport.com/search?q=" },
  {
    site: "Juno Download",
    baseUrl: "https://www.junodownload.com/search/?q%5Ball%5D%5B%5D=",
  },
  { site: "Traxsource", baseUrl: "https://www.traxsource.com/search?term=" },
];

export function createSearchLinkProvider(
  now: () => string = () => new Date().toISOString(),
): PriceProvider {
  return {
    mode: "search_link",
    search(input: PriceSearchInput): PriceQuote[] {
      const encoded = encodeURIComponent(buildQuery(input));
      const fetchedAt = now();
      return SITES.map(({ site, baseUrl }) => ({
        site,
        url: `${baseUrl}${encoded}`,
        fetchedAt,
      }));
    },
  };
}

export const searchLinkProvider = createSearchLinkProvider();
