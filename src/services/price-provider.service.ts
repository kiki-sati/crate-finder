// 서버 전용: PRICE_PROVIDER_MODE env로 provider를 선택해 가격 후보를 조회한다.
// route만 import한다(클라이언트 번들 미노출, ADR-003).
import type { PriceSearchRequest, PriceSearchResponse } from "@/types/api";
import type { PriceProvider } from "@/lib/pricing/price-provider";
import { buildQuery } from "@/lib/pricing/price-provider";
import { searchLinkProvider } from "@/lib/pricing/search-link-provider";
import { mockPriceProvider } from "@/lib/pricing/mock-price-provider";

// env → provider. 미설정/미인식/external은 search_link로 fallback(ADR-017, 결정 D4).
export function resolveProvider(
  mode: string | undefined = process.env.PRICE_PROVIDER_MODE,
): PriceProvider {
  return mode === "mock" ? mockPriceProvider : searchLinkProvider;
}

export function searchOffers(
  req: PriceSearchRequest,
  provider: PriceProvider = resolveProvider(),
): PriceSearchResponse {
  const title = req.title?.trim();
  if (!title) throw new Error("title이 필요합니다.");
  const input = { title, artist: req.artist?.trim() || undefined };
  return {
    query: buildQuery(input),
    offers: provider.search(input),
    provider: provider.mode,
  };
}
