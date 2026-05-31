// 트랙 정규화 — 정본: docs/ARCHITECTURE.md §10.1
// 순수 함수만. 외부/컴포넌트 의존 금지(CLAUDE.md 계층 규칙).

// en dash(–) em dash(—) horizontal bar(―) figure dash(‒) minus(−) → "-"
const DASH_PATTERN = /[‒–—―−]/g;

/**
 * 비교용 정규화 파이프라인.
 * trim → lowercase → unicode normalize(NFKC) → 특수 dash 통일
 *   → 괄호 통일(보존: [ { → ( , ] } → )) → 공백 정리
 */
export function normalizeString(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(DASH_PATTERN, "-")
    .replace(/[[{]/g, "(")
    .replace(/[\]}]/g, ")")
    .replace(/\s+/g, " ")
    .trim();
}

// feat./ft./featuring 참여 아티스트 절. 괄호 유무 모두 처리하되,
// 버전 괄호(Extended Mix 등)는 건드리지 않도록 다음 "(" 또는 끝까지만 매칭.
const FEAT_PATTERN = /\(?\b(?:feat|ft|featuring)\b\.?\s[^)(]*\)?/g;

/**
 * 곡명 비교용 정규화.
 * normalizeString 파이프라인 + 참여 아티스트(feat) 절 제거.
 * 결정(2026-05-31): feat 절은 비교 key에서 제거(원본은 표시용 유지).
 */
export function normalizeTitle(raw: string): string {
  return normalizeString(normalizeString(raw).replace(FEAT_PATTERN, " "));
}
