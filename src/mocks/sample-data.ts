// 공유 mock fixture — Step 0(계약 동결)의 산출물.
// FE(MatchResultTable 등 렌더 placeholder)와 BE/FE 테스트가 함께 import 한다.
// 매칭 엔진(Phase 3)이 없어도 결과 UI를 끝까지 개발할 수 있게 MatchResult[]까지 포함.
//
// 읽기 전용 계약: 분기 후 두 트랙은 이 파일을 수정하지 않는다(필요 시 main sync 커밋).
// 참고: docs/PRD.md §8(도메인 모델), docs/ARCHITECTURE.md §6.2(매칭 테스트 케이스)

import type { YouTubeTrack, RekordboxTrack } from "@/types/track";
import type { MatchResult } from "@/types/match";
import type {
  YouTubePlaylistResponse,
  RekordboxParseResponse,
} from "@/types/api";

// --- YouTube 측: 플레이리스트에서 추출한 곡 ---
export const sampleYouTubeTracks: YouTubeTrack[] = [
  {
    id: "yt_1",
    videoId: "gAjR4_CbPpQ",
    rawTitle: "Daft Punk - One More Time (Official Video)",
    channelTitle: "Daft Punk",
    publishedAt: "2007-11-15T00:00:00Z",
    parsedArtist: "Daft Punk",
    parsedTitle: "One More Time",
    parseStatus: "parsed",
  },
  {
    id: "yt_2",
    videoId: "K0HSD_i2DvA",
    rawTitle: "Justice - D.A.N.C.E.",
    channelTitle: "Ed Banger Records",
    parsedArtist: "Justice",
    parsedTitle: "D.A.N.C.E.",
    parseStatus: "parsed",
  },
  {
    id: "yt_3",
    videoId: "lAYn93p2Ao0",
    rawTitle: "FULL SET @ Boiler Room London 2019",
    channelTitle: "Boiler Room",
    parseStatus: "needs_review",
  },
  {
    id: "yt_4",
    videoId: "deleted_01",
    rawTitle: "[Deleted video]",
    parseStatus: "unavailable",
  },
];

// --- Rekordbox 측: 라이브러리 XML에서 파싱한 곡 ---
export const sampleRekordboxTracks: RekordboxTrack[] = [
  {
    id: "rb_1",
    title: "One More Time",
    artist: "Daft Punk",
    album: "Discovery",
    durationMs: 320000,
    normalizedTitle: "one more time",
    normalizedArtist: "daft punk",
  },
  {
    id: "rb_2",
    title: "D.A.N.C.E.",
    artist: "Justice",
    album: "Cross",
    durationMs: 242000,
    normalizedTitle: "dance",
    normalizedArtist: "justice",
  },
];

// --- 매칭 결과 (Phase 3 엔진 대체용 고정 샘플) ---
// owned(high) / needs_review(medium) / missing(low) 세 상태를 모두 커버.
export const sampleMatchResults: MatchResult[] = [
  {
    id: "mr_1",
    youtubeTrackId: "yt_1",
    matchedRekordboxTrackId: "rb_1",
    status: "owned",
    confidence: "high",
    score: 0.98,
    candidates: [{ rekordboxTrackId: "rb_1", score: 0.98, reason: "exact" }],
  },
  {
    id: "mr_2",
    youtubeTrackId: "yt_2",
    matchedRekordboxTrackId: "rb_2",
    status: "needs_review",
    confidence: "medium",
    score: 0.82,
    candidates: [
      { rekordboxTrackId: "rb_2", score: 0.82, reason: "similar_title_artist" },
    ],
  },
  {
    id: "mr_3",
    youtubeTrackId: "yt_3",
    status: "missing",
    confidence: "low",
    score: 0.2,
    candidates: [],
  },
];

// --- 엔드포인트 응답 형태 그대로의 mock (FE 페이지 로더가 통합 전까지 사용) ---
export const sampleYouTubePlaylistResponse: YouTubePlaylistResponse = {
  playlistId: "PL_sample_crate",
  title: "Sample Crate",
  tracks: sampleYouTubeTracks,
  unavailableCount: 1,
};

export const sampleRekordboxParseResponse: RekordboxParseResponse = {
  trackCount: sampleRekordboxTracks.length,
  tracks: sampleRekordboxTracks,
  warnings: [
    { code: "missing_artist", message: "1 track has no artist field", trackId: "rb_2" },
  ],
};
