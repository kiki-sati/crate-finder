// 분석 결과 핸드오프 — AnalysisFlow → /results 간 sessionStorage 전달.
// 저장 대상은 파싱된 메타데이터뿐(원본 XML·API Key 미포함 — ADR-004).
// 계층 규칙: components import 금지. lib/도메인 타입만 의존.

import type { MatchResult } from "@/types/match";
import type { YouTubeTrack, RekordboxTrack } from "@/types/track";

export type AnalysisHandoff = {
  results: MatchResult[];
  youtubeTracks: YouTubeTrack[];
  rekordboxTracks: RekordboxTrack[];
};

const KEY = "crate-finder:analysis";

export function saveAnalysis(payload: AnalysisHandoff): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // 저장 실패(쿼터 등)는 무시 — 핸드오프는 best-effort.
  }
}

export function readAnalysis(): AnalysisHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AnalysisHandoff;
  } catch {
    return null;
  }
}
