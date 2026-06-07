import { describe, it, expect, beforeEach } from "vitest";
import { loadMatchRows } from "@/app/results/loader";
import { saveAnalysis } from "@/services/analysis-handoff";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("loadMatchRows", () => {
  it("핸드오프가 없으면 빈 배열", () => {
    expect(loadMatchRows()).toEqual([]);
  });

  it("저장된 분석에서 MatchRow[]를 조립한다", () => {
    saveAnalysis({
      results: [
        {
          id: "mr_1",
          youtubeTrackId: "yt_1",
          matchedRekordboxTrackId: "rb_1",
          status: "owned",
          confidence: "high",
          score: 0.98,
          candidates: [],
        },
        {
          id: "mr_2",
          youtubeTrackId: "yt_2",
          status: "missing",
          confidence: "low",
          score: 0,
          candidates: [],
        },
      ],
      youtubeTracks: [
        {
          id: "yt_1",
          videoId: "v1",
          rawTitle: "A - B",
          parseStatus: "parsed",
          parsedArtist: "A",
          parsedTitle: "B",
        },
        {
          id: "yt_2",
          videoId: "v2",
          rawTitle: "C - D",
          parseStatus: "parsed",
          parsedArtist: "C",
          parsedTitle: "D",
        },
      ],
      rekordboxTracks: [
        { id: "rb_1", title: "B", artist: "A", normalizedTitle: "b", normalizedArtist: "a" },
      ],
    });
    const rows = loadMatchRows();
    expect(rows).toHaveLength(2);
    expect(rows[0].youtubeTrack.id).toBe("yt_1");
    expect(rows[0].result.id).toBe("mr_1");
    expect(rows[0].matchedTrack?.id).toBe("rb_1");
    expect(rows[1].matchedTrack).toBeUndefined();
  });

  it("matchedRekordboxTrackId가 있어도 rekordboxTracks에 없으면 matchedTrack은 undefined", () => {
    saveAnalysis({
      results: [
        {
          id: "mr_1",
          youtubeTrackId: "yt_1",
          matchedRekordboxTrackId: "rb_gone",
          status: "owned",
          confidence: "high",
          score: 0.95,
          candidates: [],
        },
      ],
      youtubeTracks: [
        {
          id: "yt_1",
          videoId: "v1",
          rawTitle: "A - B",
          parseStatus: "parsed",
          parsedArtist: "A",
          parsedTitle: "B",
        },
      ],
      rekordboxTracks: [],
    });
    const rows = loadMatchRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].matchedTrack).toBeUndefined();
  });

  it("youtubeTrack이 누락된 결과 행은 skip한다", () => {
    saveAnalysis({
      results: [
        {
          id: "mr_1",
          youtubeTrackId: "yt_missing",
          status: "missing",
          confidence: "low",
          score: 0,
          candidates: [],
        },
      ],
      youtubeTracks: [],
      rekordboxTracks: [],
    });
    expect(loadMatchRows()).toEqual([]);
  });
});
