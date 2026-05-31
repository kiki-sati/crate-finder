import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { MatchRow } from "@/components/results/match-row";

vi.mock("@/app/results/loader", () => ({ loadMatchRows: vi.fn() }));
import { loadMatchRows } from "@/app/results/loader";
import ResultsPage from "@/app/results/page";

const mockedLoad = vi.mocked(loadMatchRows);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ResultsPage", () => {
  it("핸드오프가 없으면 빈 상태 안내와 / 링크를 보여준다", async () => {
    mockedLoad.mockReturnValue([]);
    render(<ResultsPage />);
    expect(await screen.findByText(/분석을 먼저 실행/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /새 분석/ })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("결과가 있으면 테이블을 렌더한다", async () => {
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
          rawTitle: "A - B",
          parseStatus: "parsed",
          parsedArtist: "A",
          parsedTitle: "B",
        },
        matchedTrack: {
          id: "rb_1",
          title: "B",
          artist: "A",
          normalizedTitle: "b",
          normalizedArtist: "a",
        },
      },
    ];
    mockedLoad.mockReturnValue(rows);
    render(<ResultsPage />);
    await waitFor(() =>
      expect(screen.getByRole("table")).toBeInTheDocument(),
    );
    // 행이 실제로 렌더됐는지(셀 내용) 확인 — 빈 테이블이 아님을 보장.
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
