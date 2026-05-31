import {
  sampleMatchResults,
  sampleYouTubeTracks,
  sampleRekordboxTracks,
} from "@/mocks/sample-data";
import type { MatchRow } from "@/components/results/match-row";

// 통합 시 교체 지점: mock 대신 /api/analysis 결과를 받아 동일한 MatchRow[]를 만든다.
export function loadMatchRows(): MatchRow[] {
  return sampleMatchResults.map((result) => ({
    result,
    youtubeTrack: sampleYouTubeTracks.find((t) => t.id === result.youtubeTrackId)!,
    matchedTrack: sampleRekordboxTracks.find(
      (t) => t.id === result.matchedRekordboxTrackId,
    ),
  }));
}
