import { describe, it, expect } from "vitest";
import { loadMatchRows } from "@/app/results/loader";

describe("loadMatchRows", () => {
  it("mock에서 MatchResult를 YouTube/Rekordbox 트랙과 조인한다", () => {
    const rows = loadMatchRows();
    expect(rows.length).toBeGreaterThan(0);
    const owned = rows.find((r) => r.result.status === "owned");
    expect(owned?.youtubeTrack.id).toBe(owned?.result.youtubeTrackId);
    expect(owned?.matchedTrack?.id).toBe(owned?.result.matchedRekordboxTrackId);
  });
});
