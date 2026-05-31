import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchResultTable } from "@/components/results/MatchResultTable";
import type { MatchRow } from "@/components/results/match-row";

const rows: MatchRow[] = [
  {
    result: {
      id: "mr_1",
      youtubeTrackId: "yt_1",
      matchedRekordboxTrackId: "rb_1",
      status: "owned",
      confidence: "high",
      score: 0.98,
      candidates: [],
    },
    youtubeTrack: {
      id: "yt_1",
      videoId: "v1",
      rawTitle: "Daft Punk - One More Time",
      parsedArtist: "Daft Punk",
      parsedTitle: "One More Time",
      parseStatus: "parsed",
    },
    matchedTrack: {
      id: "rb_1",
      title: "One More Time",
      artist: "Daft Punk",
      normalizedTitle: "one more time",
      normalizedArtist: "daft punk",
    },
  },
];

describe("MatchResultTable", () => {
  it("행의 곡명/아티스트와 상태 배지를 렌더한다", () => {
    render(<MatchResultTable rows={rows} />);
    expect(screen.getByText("One More Time")).toBeInTheDocument();
    expect(screen.getByText("Daft Punk")).toBeInTheDocument();
    expect(screen.getByText("Owned")).toBeInTheDocument();
  });
  it("빈 목록이면 안내 문구를 표시한다", () => {
    render(<MatchResultTable rows={[]} />);
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });
});
