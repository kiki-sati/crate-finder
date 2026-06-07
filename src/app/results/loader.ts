import { readAnalysis, type AnalysisHandoff } from "@/services/analysis-handoff";
import type { MatchRow } from "@/components/results/match-row";
import type { RekordboxTrack } from "@/types/track";

// 핸드오프(분석 결과) → 테이블 행 조립. 순수 함수(저장소 접근 없음).
// YouTube 트랙이 없는 결과 행은 방어적으로 제외한다(데이터 불일치 시 조용히 skip).
// needs_review 후보 표시용으로 result.candidates의 rekordboxTrackId를
// rekordboxTracks에서 찾아 candidateTracks(Record)로 채운다.
export function buildMatchRows(analysis: AnalysisHandoff): MatchRow[] {
  const { results, youtubeTracks, rekordboxTracks } = analysis;
  const trackById = new Map(rekordboxTracks.map((t) => [t.id, t]));

  return results.flatMap((result) => {
    const youtubeTrack = youtubeTracks.find(
      (t) => t.id === result.youtubeTrackId,
    );
    if (!youtubeTrack) return []; // 정상 플로우에선 도달하지 않음 — 데이터 불일치 시 조용히 제외
    const matchedTrack = result.matchedRekordboxTrackId
      ? trackById.get(result.matchedRekordboxTrackId)
      : undefined;

    const candidateTracks: Record<string, RekordboxTrack> = {};
    for (const c of result.candidates) {
      const track = trackById.get(c.rekordboxTrackId);
      if (track) candidateTracks[c.rekordboxTrackId] = track;
    }

    return [{ result, youtubeTrack, matchedTrack, candidateTracks }];
  });
}

// /results 데이터 진입점. 핸드오프(sessionStorage)에서 분석 결과를 읽어 행을 조립한다.
// 핸드오프가 없으면 빈 배열.
export function loadMatchRows(): MatchRow[] {
  const analysis = readAnalysis();
  if (!analysis) return [];
  return buildMatchRows(analysis);
}
