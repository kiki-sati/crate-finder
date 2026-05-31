// 트랙 정규화 — 정본: docs/ARCHITECTURE.md §10.1
// 순수 함수만. 외부/컴포넌트 의존 금지(CLAUDE.md 계층 규칙).

// en dash(–) em dash(—) horizontal bar(―) figure dash(‒) minus(−) → "-"
const DASH_PATTERN = /[‒–—―−]/g;

/**
 * 비교용 정규화 파이프라인.
 * trim → lowercase → unicode normalize(NFKC) → 특수 dash 통일
 */
export function normalizeString(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(DASH_PATTERN, "-");
}
