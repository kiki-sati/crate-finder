import type { PriceProviderMode, PriceQuote } from "@/types/pricing";

export type PriceSearchInput = { title: string; artist?: string };

export type PriceProvider = {
  mode: PriceProviderMode;
  search(input: PriceSearchInput): PriceQuote[];
};

// 비교/검색용 질의 문자열. artist가 있으면 "artist title", 없으면 "title".
// trim → 공백 단일화 → 소문자.
export function buildQuery(input: PriceSearchInput): string {
  return [input.artist, input.title]
    .filter((s): s is string => Boolean(s && s.trim()))
    .map((s) => s.trim())
    .join(" ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}
