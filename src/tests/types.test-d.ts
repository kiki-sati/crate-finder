import { describe, it, expectTypeOf } from "vitest";
import type { TrackStatus, YouTubeTrack, RekordboxTrack } from "@/types/track";
import type { MatchResult, MatchCandidate } from "@/types/match";
import type { YouTubePlaylist } from "@/types/playlist";
import type { AnalysisSession } from "@/types/analysis";
import type { ApiResult } from "@/types/api";

describe("domain types", () => {
  it("TrackStatus는 세 상태만 허용", () => {
    expectTypeOf<TrackStatus>().toEqualTypeOf<
      "owned" | "missing" | "needs_review"
    >();
  });
  it("MatchResult.candidates는 MatchCandidate 배열", () => {
    expectTypeOf<MatchResult["candidates"]>().toEqualTypeOf<MatchCandidate[]>();
  });
  it("주요 엔티티 타입이 존재한다", () => {
    expectTypeOf<YouTubeTrack["videoId"]>().toBeString();
    expectTypeOf<RekordboxTrack["normalizedTitle"]>().toBeString();
    expectTypeOf<YouTubePlaylist["playlistId"]>().toBeString();
    expectTypeOf<AnalysisSession["totalTrackCount"]>().toBeNumber();
    expectTypeOf<ApiResult<number>>().not.toBeNever();
  });
});
