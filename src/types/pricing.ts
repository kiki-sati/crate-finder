// 가격 Provider 관련 타입 (초안) — 실제 형태는 Phase 5에서 확정.
// 참고: docs/ARCHITECTURE.md §11 가격 Provider 설계

export type PriceProviderMode = "mock" | "search_link" | "external";

export type PriceQuote = {
  site: string;
  price?: number;
  currency?: string;
  url: string;
  isLowest?: boolean;
  fetchedAt: string;
};
