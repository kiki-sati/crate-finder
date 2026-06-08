// 수동 확정/거부 결정의 영속화 — localStorage. videoId(YouTube 전역 고유) 기준.
// 사용자가 확인필요 트랙을 확정/거부하면 그 결정을 저장하고, 같은 곡을 다시
// 분석할 때 자동 재적용해 재검토를 없앤다. 플레이리스트 구분은 불필요(videoId 전역 고유).
// 저장은 결정(IDs+kind)만 — 트랙 메타데이터·원본 XML 저장 금지(ADR-004 일관).
// 계층 규칙(CLAUDE.md): service 계층, 도메인 타입·lib 순수 함수만 의존(components import 금지).
import type { MatchResult } from "@/types/match";
import type { YouTubeTrack } from "@/types/track";
import { resolveMatch, type ResolveDecision } from "@/lib/matcher/resolve";

const KEY = "crate-finder:manual-rules";

// videoId → 결정. 저장에는 ResolveDecision(kind + rekordboxTrackId)만 담긴다.
export type ManualRules = Record<string, ResolveDecision>;

function read(): ManualRules {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as ManualRules)
      : {};
  } catch {
    return {};
  }
}

function write(rules: ManualRules): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rules));
  } catch {
    // 쿼터 등 저장 실패는 무시 — best-effort.
  }
}

// 해당 videoId의 결정을 저장/갱신한다(기존 맵을 읽어 머지).
export function saveManualDecision(
  videoId: string,
  decision: ResolveDecision,
): void {
  write({ ...read(), [videoId]: decision });
}

// 저장된 전체 결정 맵. 없으면 {}.
export function loadManualDecisions(): ManualRules {
  return read();
}

// 전체 결정 삭제(향후 삭제 기능용).
export function clearManualDecisions(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}

// 순수 함수: 각 result에 대해 대응 YouTubeTrack의 videoId 규칙이 있으면 적용.
// 규칙/대응 트랙이 없으면 원본 유지. 입력 불변(localStorage 접근 없음 — rules를 인자로 받음).
export function applyManualDecisions(
  results: MatchResult[],
  youtubeTracks: YouTubeTrack[],
  rules: ManualRules,
): MatchResult[] {
  const videoIdByTrackId = new Map(
    youtubeTracks.map((t) => [t.id, t.videoId]),
  );

  return results.map((result) => {
    const videoId = videoIdByTrackId.get(result.youtubeTrackId);
    if (videoId === undefined) return result;
    const decision = rules[videoId];
    if (decision === undefined) return result;
    return resolveMatch(result, decision);
  });
}
