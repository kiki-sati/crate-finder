import { describe, it, expect, beforeEach } from "vitest";
import {
  saveAnalysis,
  readAnalysis,
  type AnalysisHandoff,
} from "@/services/analysis-handoff";

const sample: AnalysisHandoff = {
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
  rekordboxTracks: [
    { id: "rb_1", title: "B", artist: "A", normalizedTitle: "b", normalizedArtist: "a" },
  ],
};

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("analysis-handoff", () => {
  it("save 후 read하면 동일 페이로드를 돌려준다", () => {
    saveAnalysis(sample);
    expect(readAnalysis()).toEqual(sample);
  });

  it("저장된 게 없으면 null", () => {
    expect(readAnalysis()).toBeNull();
  });

  it("malformed JSON이면 null", () => {
    window.sessionStorage.setItem("crate-finder:analysis", "{not json");
    expect(readAnalysis()).toBeNull();
  });
});
