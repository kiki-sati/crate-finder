import { describe, it, expect } from "vitest";
import {
  sampleYouTubeTracks,
  sampleRekordboxTracks,
} from "@/mocks/sample-data";
import { matchTracks } from "@/lib/matcher/match";

describe("matchTracks (sample-data 통합)", () => {
  const results = matchTracks(sampleYouTubeTracks, sampleRekordboxTracks);

  it("YouTube 트랙 수만큼 결과를 낸다", () => {
    expect(results).toHaveLength(sampleYouTubeTracks.length);
  });

  it("yt_1(Daft Punk - One More Time)은 정확일치 owned", () => {
    const r = results.find((x) => x.youtubeTrackId === "yt_1")!;
    expect(r.status).toBe("owned");
    expect(r.confidence).toBe("high");
    expect(r.matchedRekordboxTrackId).toBe("rb_1");
  });

  it("파싱 불가/검토필요 트랙(yt_3, yt_4)은 needs_review, 매칭 id 없음", () => {
    for (const id of ["yt_3", "yt_4"]) {
      const r = results.find((x) => x.youtubeTrackId === id)!;
      expect(r.status).toBe("needs_review");
      expect(r.matchedRekordboxTrackId).toBeUndefined();
      expect(r.candidates).toEqual([]);
    }
  });

  it("모든 결과는 유효한 status/confidence를 가진다", () => {
    const statuses = ["owned", "missing", "needs_review"];
    const confidences = ["high", "medium", "low"];
    for (const r of results) {
      expect(statuses).toContain(r.status);
      expect(confidences).toContain(r.confidence);
    }
  });
});
