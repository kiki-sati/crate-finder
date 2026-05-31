// 계약 동결 검증 — Phase 2 엔드포인트 req/res 형태와 mock 데이터 적합성을 타입 레벨로 고정.
import { describe, it, expectTypeOf } from "vitest";
import type {
  ApiResult,
  YouTubePlaylistRequest,
  YouTubePlaylistResponse,
  RekordboxParseResponse,
} from "@/types/api";
import type { YouTubeTrack, RekordboxTrack } from "@/types/track";
import type { MatchResult } from "@/types/match";
import {
  sampleYouTubeTracks,
  sampleRekordboxTracks,
  sampleMatchResults,
  sampleYouTubePlaylistResponse,
  sampleRekordboxParseResponse,
} from "@/mocks/sample-data";

describe("API 계약 (Phase 2)", () => {
  it("youtube/playlist 요청·응답 형태", () => {
    expectTypeOf<YouTubePlaylistRequest["url"]>().toBeString();
    expectTypeOf<YouTubePlaylistResponse["tracks"]>().toEqualTypeOf<YouTubeTrack[]>();
    expectTypeOf<YouTubePlaylistResponse["unavailableCount"]>().toBeNumber();
  });
  it("rekordbox/parse 응답 형태", () => {
    expectTypeOf<RekordboxParseResponse["tracks"]>().toEqualTypeOf<RekordboxTrack[]>();
    expectTypeOf<RekordboxParseResponse["warnings"]>().toBeArray();
  });
  it("라우트는 ApiResult로 감싸 반환한다", () => {
    expectTypeOf<ApiResult<YouTubePlaylistResponse>>().not.toBeNever();
    expectTypeOf<ApiResult<RekordboxParseResponse>>().not.toBeNever();
  });
});

describe("mock 데이터 적합성", () => {
  it("도메인 타입을 만족한다", () => {
    expectTypeOf(sampleYouTubeTracks).toEqualTypeOf<YouTubeTrack[]>();
    expectTypeOf(sampleRekordboxTracks).toEqualTypeOf<RekordboxTrack[]>();
    expectTypeOf(sampleMatchResults).toEqualTypeOf<MatchResult[]>();
  });
  it("엔드포인트 응답 형태를 만족한다", () => {
    expectTypeOf(sampleYouTubePlaylistResponse).toEqualTypeOf<YouTubePlaylistResponse>();
    expectTypeOf(sampleRekordboxParseResponse).toEqualTypeOf<RekordboxParseResponse>();
  });
});
