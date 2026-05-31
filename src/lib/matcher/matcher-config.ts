// 매칭 엔진 튜닝 상수 한 곳. 정본: docs/ARCHITECTURE.md §10.4.
// 임계값은 테스트 데이터 축적 후 조정한다.

export const TITLE_WEIGHT = 0.65;
export const ARTIST_WEIGHT = 0.35;
export const MAX_CANDIDATES = 3;

// 점수 → status/confidence 임계값
export const OWNED_MIN = 0.95; // ≥ → owned/high
export const REVIEW_MID_MIN = 0.75; // ≥ → needs_review/medium
export const REVIEW_LOW_MIN = 0.55; // ≥ → needs_review/low ; < → missing/low
