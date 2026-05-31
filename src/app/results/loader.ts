import { readAnalysis } from "@/services/analysis-handoff";
import type { MatchRow } from "@/components/results/match-row";

// /results 데이터 진입점. 핸드오프(sessionStorage)에서 분석 결과를 읽어 행을 조립한다.
// 핸드오프가 없으면 빈 배열. YouTube 트랙이 없는 결과 행은 방어적으로 제외한다.
export function loadMatchRows(): MatchRow[] {
  const analysis = readAnalysis();
  if (!analysis) return [];
  const { results, youtubeTracks, rekordboxTracks } = analysis;
  return results.flatMap((result) => {
    const youtubeTrack = youtubeTracks.find(
      (t) => t.id === result.youtubeTrackId,
    );
    if (!youtubeTrack) return []; // 정상 플로우에선 도달하지 않음 — 데이터 불일치 시 조용히 제외
    const matchedTrack = result.matchedRekordboxTrackId
      ? rekordboxTracks.find((t) => t.id === result.matchedRekordboxTrackId)
      : undefined;
    return [{ result, youtubeTrack, matchedTrack }];
  });
}
