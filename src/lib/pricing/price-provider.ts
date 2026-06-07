import type { PriceProviderMode, PriceQuote } from "@/types/pricing";

export type PriceSearchInput = { title: string; artist?: string };

export type PriceProvider = {
  mode: PriceProviderMode;
  search(input: PriceSearchInput): PriceQuote[];
};

// 검색 질의 최대 길이. 입력 강건성(Phase 6): 비정상적으로 긴 입력이
// 그대로 구매 검색 링크 URL에 실리는 것을 막아 링크 위생을 유지한다.
const MAX_QUERY_LENGTH = 200;

// 비교/검색용 질의 문자열. artist가 있으면 "artist title", 없으면 "title".
// trim → 공백 단일화 → 소문자 → 길이 제한.
export function buildQuery(input: PriceSearchInput): string {
  const query = [input.artist, input.title]
    .filter((s): s is string => Boolean(s && s.trim()))
    .map((s) => s.trim())
    .join(" ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return query.length > MAX_QUERY_LENGTH
    ? query.slice(0, MAX_QUERY_LENGTH).trimEnd()
    : query;
}
