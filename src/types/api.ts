// API 요청/응답 계약 — 정본: docs/ARCHITECTURE.md §7.
// Phase 2(Ingestion) 범위의 두 엔드포인트만 동결. analysis/price 등은 해당 Phase에서 확정.
// 변경 시 FE/BE 양 트랙에 영향 → main sync 커밋으로만 수정(임의 변경 금지).

import type { YouTubeTrack, RekordboxTrack } from "@/types/track";

// 공통 래퍼: 각 라우트는 data 페이로드를 ApiResult로 감싸 반환한다.
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: { code: string; message: string } };
export type ApiResult<T> = ApiOk<T> | ApiErr;

// --- 7.1 POST /api/youtube/playlist ---
// 유튜브 플레이리스트 URL 검증, playlistId 추출, 곡 목록 반환.
export type YouTubePlaylistRequest = {
  url: string;
};

export type YouTubePlaylistResponse = {
  playlistId: string;
  title?: string;
  tracks: YouTubeTrack[];
  unavailableCount: number;
};

// --- 7.2 POST /api/rekordbox/parse (multipart/form-data) ---
// XML 파일 검증 및 트랙 메타데이터 파싱. 원본 XML은 응답/로그에 포함하지 않는다.
export type RekordboxParseWarning = {
  code: string; // 예: "missing_artist" | "duplicate_location" | "unparsable_entry"
  message: string;
  trackId?: string;
};

export type RekordboxParseResponse = {
  trackCount: number;
  tracks: RekordboxTrack[];
  warnings: RekordboxParseWarning[];
};
