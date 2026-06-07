import { describe, it, expect } from "vitest";
import type { MatchResult, MatchCandidate } from "@/types/match";
import { resolveMatch } from "@/lib/matcher/resolve";

function reviewResult(
  overrides: Partial<MatchResult> = {},
): MatchResult {
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

describe("resolveMatch - confirm", () => {
  it("선택 후보를 owned/high/score 1로 확정한다", () => {
    const out = resolveMatch(reviewResult(), {
      kind: "confirm",
      rekordboxTrackId: "rb_b",
    });
    expect(out.status).toBe("owned");
    expect(out.confidence).toBe("high");
    expect(out.score).toBe(1);
    expect(out.matchedRekordboxTrackId).toBe("rb_b");
  });

  it("선택한 rekordboxTrackId를 manual/score 1로 후보 맨 앞에 둔다", () => {
    const out = resolveMatch(reviewResult(), {
      kind: "confirm",
      rekordboxTrackId: "rb_b",
    });
    expect(out.candidates[0]).toEqual<MatchCandidate>({
      rekordboxTrackId: "rb_b",
      score: 1,
      reason: "manual",
    });
  });

  it("기존 후보는 뒤에 유지하되 선택 id의 중복은 제거한다", () => {
    const out = resolveMatch(reviewResult(), {
      kind: "confirm",
      rekordboxTrackId: "rb_b",
    });
    // 맨 앞 manual(rb_b) 1개 + 기존 rb_a. 기존 rb_b 는 중복 제거.
    expect(out.candidates).toHaveLength(2);
    const rbBEntries = out.candidates.filter(
      (c) => c.rekordboxTrackId === "rb_b",
    );
    expect(rbBEntries).toHaveLength(1);
    expect(rbBEntries[0].reason).toBe("manual");
    // 기존 rb_a 후보는 원본 reason/score 그대로 뒤에 유지
    expect(out.candidates[1]).toEqual<MatchCandidate>({
      rekordboxTrackId: "rb_a",
      score: 0.62,
      reason: "similar_title_artist",
    });
  });

  it("기존 candidates에 없던 rekordboxTrackId도 manual 후보로 추가한다", () => {
    const out = resolveMatch(reviewResult(), {
      kind: "confirm",
      rekordboxTrackId: "rb_new",
    });
    expect(out.candidates[0]).toEqual<MatchCandidate>({
      rekordboxTrackId: "rb_new",
      score: 1,
      reason: "manual",
    });
    // 기존 두 후보가 그대로 뒤에 유지 → 총 3개
    expect(out.candidates).toHaveLength(3);
    expect(out.candidates.map((c) => c.rekordboxTrackId)).toEqual([
      "rb_new",
      "rb_a",
      "rb_b",
    ]);
  });

  it("id 와 youtubeTrackId 를 보존한다", () => {
    const out = resolveMatch(reviewResult(), {
      kind: "confirm",
      rekordboxTrackId: "rb_b",
    });
    expect(out.id).toBe("match_yt1");
    expect(out.youtubeTrackId).toBe("yt1");
  });

  it("입력 객체를 변형하지 않는다(순수 함수)", () => {
    const input = reviewResult();
    const snapshotStatus = input.status;
    const snapshotCandidatesLen = input.candidates.length;
    const snapshotFirst = { ...input.candidates[0] };

    resolveMatch(input, { kind: "confirm", rekordboxTrackId: "rb_b" });

    expect(input.status).toBe(snapshotStatus);
    expect(input.candidates).toHaveLength(snapshotCandidatesLen);
    expect(input.candidates[0]).toEqual(snapshotFirst);
  });
});

describe("resolveMatch - reject", () => {
  it("missing/low/score 0 으로 거부한다", () => {
    const out = resolveMatch(reviewResult(), { kind: "reject" });
    expect(out.status).toBe("missing");
    expect(out.confidence).toBe("low");
    expect(out.score).toBe(0);
  });

  it("matchedRekordboxTrackId 를 제거하고 candidates 를 비운다", () => {
    const out = resolveMatch(reviewResult(), { kind: "reject" });
    expect(out.matchedRekordboxTrackId).toBeUndefined();
    expect(out.candidates).toEqual([]);
  });

  it("id 와 youtubeTrackId 를 보존한다", () => {
    const out = resolveMatch(reviewResult(), { kind: "reject" });
    expect(out.id).toBe("match_yt1");
    expect(out.youtubeTrackId).toBe("yt1");
  });

  it("입력 객체를 변형하지 않는다(순수 함수)", () => {
    const input = reviewResult();
    const snapshotStatus = input.status;
    const snapshotCandidatesLen = input.candidates.length;

    resolveMatch(input, { kind: "reject" });

    expect(input.status).toBe(snapshotStatus);
    expect(input.candidates).toHaveLength(snapshotCandidatesLen);
    expect(input.matchedRekordboxTrackId).toBe("rb_a");
  });
});

describe("resolveMatch - 현재 status 무관", () => {
  it("이미 owned 인 결과도 reject 로 missing 전환한다", () => {
    const owned = reviewResult({
      status: "owned",
      confidence: "high",
      score: 1,
    });
    const out = resolveMatch(owned, { kind: "reject" });
    expect(out.status).toBe("missing");
    expect(out.candidates).toEqual([]);
  });

  it("이미 missing 인 결과도 confirm 으로 owned 전환한다", () => {
    const missing = reviewResult({
      status: "missing",
      confidence: "low",
      score: 0,
      matchedRekordboxTrackId: undefined,
      candidates: [],
    });
    const out = resolveMatch(missing, {
      kind: "confirm",
      rekordboxTrackId: "rb_x",
    });
    expect(out.status).toBe("owned");
    expect(out.matchedRekordboxTrackId).toBe("rb_x");
    expect(out.candidates[0]).toEqual<MatchCandidate>({
      rekordboxTrackId: "rb_x",
      score: 1,
      reason: "manual",
    });
  });
});
