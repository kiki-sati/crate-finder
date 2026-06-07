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

// 곡명 맨 앞 트랙번호(예: "3. ", "04. ", "3) "). Rekordbox 곡명엔 흔하나
// YouTube 제목엔 없어 유사도를 떨어뜨린다 → 비교용으로만 제거(승인 2026-06-07).
// 보수적: 1~3자리 숫자 + 구분자([.)]) + 공백. "404"(구분자 없음),
// "3 is..."(공백뿐), "track 3"(맨 앞 아님), "1234. "(4자리)는 매칭 안 됨.
const LEADING_TRACK_NUMBER_PATTERN = /^\d{1,3}[.)]\s+/;

// 선행 트랙번호를 제거하되, 제거 후 빈 문자열/숫자만 남으면 정보 손실로 보고
// 원본을 유지한다(예: "3." 는 normalizeString 후 공백이 없어 애초에 매칭 안 됨).
function stripLeadingTrackNumber(normalized: string): string {
  if (!LEADING_TRACK_NUMBER_PATTERN.test(normalized)) return normalized;
  const stripped = normalized.replace(LEADING_TRACK_NUMBER_PATTERN, "").trim();
  if (stripped === "" || /^\d+$/.test(stripped)) return normalized;
  return stripped;
}

// feat./ft./featuring 참여 아티스트 절. 괄호 유무 모두 처리하되,
// 버전 괄호(Extended Mix 등)는 건드리지 않도록 다음 "(" 또는 끝까지만 매칭.
const FEAT_PATTERN = /\(?\b(?:feat|ft|featuring)\b\.?\s[^)(]*\)?/g;

// 정규화된 문자열에서 feat 절을 제거하고 다시 정규화(공백 정리)한다.
function stripFeat(normalized: string): string {
  return normalizeString(normalized.replace(FEAT_PATTERN, " "));
}

/**
 * 곡명 비교용 정규화.
 * normalizeString → 선행 트랙번호 제거 → 참여 아티스트(feat) 절 제거.
 * 결정(2026-05-31): feat 절은 비교 key에서 제거(원본은 표시용 유지).
 * 결정(2026-06-07): Rekordbox 곡명 선행 트랙번호 제거(매칭 정확도).
 * 트랙번호 제거는 곡명에만 적용한다(아티스트엔 무의미).
 */
export function normalizeTitle(raw: string): string {
  return stripFeat(stripLeadingTrackNumber(normalizeString(raw)));
}

/**
 * 아티스트 비교용 정규화.
 * 값이 없거나 정규화 결과가 비면 undefined를 반환한다.
 */
export function normalizeArtist(raw?: string): string | undefined {
  if (!raw) return undefined;
  const normalized = stripFeat(normalizeString(raw));
  return normalized === "" ? undefined : normalized;
}

/**
 * 비교용 최종 매칭 key. `정규화 아티스트|정규화 곡명` 형태.
 * 아티스트가 없으면 빈 문자열로 둔다(§10.2 정확 일치 기준).
 */
export function buildMatchKey(artist: string | undefined, title: string): string {
  return `${normalizeArtist(artist) ?? ""}|${normalizeTitle(title)}`;
}
