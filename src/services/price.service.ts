// 클라이언트 전용 fetch 헬퍼 — /api/price/search 호출. (analysis.service 패턴)
import type { PriceSearchRequest, PriceSearchResponse } from "@/types/api";
import { readApiResult } from "@/services/http";

export async function searchPrices(
  req: PriceSearchRequest,
): Promise<PriceSearchResponse> {
  const res = await fetch("/api/price/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return readApiResult<PriceSearchResponse>(res, "가격 조회에 실패했습니다");
}
