import type { MatchResult } from "@/types/match";
import type { YouTubeTrack, RekordboxTrack } from "@/types/track";

// 테이블 한 행에 필요한 데이터 묶음(도메인 타입 조합, UI 전용).
export type MatchRow = {
  result: MatchResult;
  youtubeTrack: YouTubeTrack;
  matchedTrack?: RekordboxTrack;
  // needs_review 후보 표시용. rekordboxTrackId -> RekordboxTrack. 없으면 빈 객체 취급.
  candidateTracks?: Record<string, RekordboxTrack>;
};
