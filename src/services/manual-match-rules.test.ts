import { describe, it, expect, beforeEach } from "vitest";
import type { MatchResult } from "@/types/match";
import type { YouTubeTrack } from "@/types/track";
import type { ResolveDecision } from "@/lib/matcher/resolve";
import {
  saveManualDecision,
  loadManualDecisions,
  clearManualDecisions,
  applyManualDecisions,
} from "@/services/manual-match-rules";

const KEY = "crate-finder:manual-rules";

beforeEach(() => {
  window.localStorage.clear();
});

// ---- 픽스처 -------------------------------------------------------------

function ytTrack(overrides: Partial<YouTubeTrack> = {}): YouTubeTrack {
  return {
    id: "yt1",
    videoId: "vid1",
    rawTitle: "Some Artist - Some Title",
    parseStatus: "parsed",
    ...overrides,
  };
}

function reviewResult(overrides: Partial<MatchResult> = {}): MatchResult {
  return {
    id: "match_yt1",
    youtubeTrackId: "yt1",
    matchedRekordboxTrackId: "rb_a",
    status: "needs_review",
    confidence: "medium",
    score: 0.62,
    candidates: [
      { rekordboxTrackId: "rb_a", score: 0.62, reason: "similar_title_artist" },
      { rekordboxTrackId: "rb_b", score: 0.55, reason: "similar_title" },
    ],
    ...overrides,
  };
}

// ---- save / load 라운드트립 --------------------------------------------

describe("manual-match-rules: save/load", () => {
  it("초기에는 빈 맵을 반환한다", () => {
    expect(loadManualDecisions()).toEqual({});
  });

  it("저장한 결정을 videoId 기준으로 다시 읽는다", () => {
    const decision: ResolveDecision = {
      kind: "confirm",
      rekordboxTrackId: "rb_b",
    };
    saveManualDecision("vid1", decision);
    expect(loadManualDecisions()).toEqual({ vid1: decision });
  });

  it("여러 videoId의 결정을 머지해 보관한다", () => {
    saveManualDecision("vid1", { kind: "confirm", rekordboxTrackId: "rb_b" });
    saveManualDecision("vid2", { kind: "reject" });
    expect(loadManualDecisions()).toEqual({
      vid1: { kind: "confirm", rekordboxTrackId: "rb_b" },
      vid2: { kind: "reject" },
    });
  });

  it("같은 videoId를 다시 저장하면 최신 결정으로 갱신한다", () => {
    saveManualDecision("vid1", { kind: "confirm", rekordboxTrackId: "rb_a" });
    saveManualDecision("vid1", { kind: "reject" });
    expect(loadManualDecisions()).toEqual({ vid1: { kind: "reject" } });
  });

  it("저장 형태는 videoId/kind/rekordboxTrackId만 포함한다(메타데이터 없음)", () => {
    saveManualDecision("vid1", { kind: "confirm", rekordboxTrackId: "rb_b" });
    const raw = window.localStorage.getItem(KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual({
      vid1: { kind: "confirm", rekordboxTrackId: "rb_b" },
    });
  });

  it("clearManualDecisions는 전체를 제거한다", () => {
    saveManualDecision("vid1", { kind: "reject" });
    saveManualDecision("vid2", { kind: "reject" });
    clearManualDecisions();
    expect(loadManualDecisions()).toEqual({});
  });

  it("손상된 JSON이면 빈 맵을 반환한다", () => {
    window.localStorage.setItem(KEY, "{not json");
    expect(loadManualDecisions()).toEqual({});
  });
});

// ---- applyManualDecisions (순수) ---------------------------------------

describe("manual-match-rules: applyManualDecisions", () => {
  it("규칙이 없으면 원본 결과를 그대로 반환한다", () => {
    const results = [reviewResult()];
    const tracks = [ytTrack()];
    const out = applyManualDecisions(results, tracks, {});
    expect(out).toEqual(results);
  });

  it("confirm 규칙이 있는 result를 owned로 변환한다(resolveMatch 적용)", () => {
    const results = [reviewResult()];
    const tracks = [ytTrack({ id: "yt1", videoId: "vid1" })];
    const rules: Record<string, ResolveDecision> = {
      vid1: { kind: "confirm", rekordboxTrackId: "rb_b" },
    };
    const out = applyManualDecisions(results, tracks, rules);
    expect(out[0].status).toBe("owned");
    expect(out[0].confidence).toBe("high");
    expect(out[0].score).toBe(1);
    expect(out[0].matchedRekordboxTrackId).toBe("rb_b");
    expect(out[0].candidates[0]).toEqual({
      rekordboxTrackId: "rb_b",
      score: 1,
      reason: "manual",
    });
  });

  it("reject 규칙이 있는 result를 missing으로 변환한다", () => {
    const results = [reviewResult()];
    const tracks = [ytTrack({ id: "yt1", videoId: "vid1" })];
    const rules: Record<string, ResolveDecision> = {
      vid1: { kind: "reject" },
    };
    const out = applyManualDecisions(results, tracks, rules);
    expect(out[0].status).toBe("missing");
    expect(out[0].confidence).toBe("low");
    expect(out[0].score).toBe(0);
    expect(out[0].matchedRekordboxTrackId).toBeUndefined();
    expect(out[0].candidates).toEqual([]);
  });

  it("youtubeTrackId↔videoId 매핑으로 올바른 result에만 규칙을 적용한다", () => {
    const results = [
      reviewResult({ id: "m1", youtubeTrackId: "yt1" }),
      reviewResult({ id: "m2", youtubeTrackId: "yt2" }),
    ];
    const tracks = [
      ytTrack({ id: "yt1", videoId: "vid1" }),
      ytTrack({ id: "yt2", videoId: "vid2" }),
    ];
    // vid2에만 규칙 → yt2 result만 변환, yt1은 원본 유지.
    const rules: Record<string, ResolveDecision> = {
      vid2: { kind: "reject" },
    };
    const out = applyManualDecisions(results, tracks, rules);
    expect(out[0]).toEqual(results[0]); // yt1 원본 유지
    expect(out[1].status).toBe("missing"); // yt2 거부 적용
  });

  it("result에 대응하는 YouTubeTrack이 없으면 원본을 유지한다", () => {
    const results = [reviewResult({ youtubeTrackId: "yt_missing" })];
    const tracks = [ytTrack({ id: "yt1", videoId: "vid1" })];
    const rules: Record<string, ResolveDecision> = {
      vid1: { kind: "reject" },
    };
    const out = applyManualDecisions(results, tracks, rules);
    expect(out[0]).toEqual(results[0]);
  });

  it("입력 배열과 요소를 변형하지 않는다(불변)", () => {
    const original = reviewResult();
    const snapshot = structuredClone(original);
    const results = [original];
    const tracks = [ytTrack({ id: "yt1", videoId: "vid1" })];
    const rules: Record<string, ResolveDecision> = {
      vid1: { kind: "confirm", rekordboxTrackId: "rb_b" },
    };
    const out = applyManualDecisions(results, tracks, rules);
    // 원본 result는 그대로, 반환은 새 객체.
    expect(original).toEqual(snapshot);
    expect(out[0]).not.toBe(original);
    expect(out).not.toBe(results);
  });
});
