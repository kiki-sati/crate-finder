import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MatchRow } from "@/components/results/match-row";

vi.mock("@/app/results/loader", () => ({ loadMatchRows: vi.fn() }));
import { loadMatchRows } from "@/app/results/loader";
import ResultsPage from "@/app/results/page";

const mockedLoad = vi.mocked(loadMatchRows);

function row(
  id: string,
  status: MatchRow["result"]["status"],
  title: string,
): MatchRow {
  return {
    result: {
      id,
      youtubeTrackId: `yt_${id}`,
      status,
      confidence: "high",
      score: 0.9,
      candidates: [],
    },
    youtubeTrack: {
      id: `yt_${id}`,
      videoId: id,
      rawTitle: title,
      parseStatus: "parsed",
      parsedArtist: "Artist",
      parsedTitle: title,
    },
  };
}

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
    mockedLoad.mockReturnValue([row("mr_1", "owned", "Owned Track")]);
    render(<ResultsPage />);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
    expect(screen.getByText("Owned Track")).toBeInTheDocument();
  });

  it("상태별 요약 카운트를 표시한다", async () => {
    mockedLoad.mockReturnValue([
      row("mr_1", "owned", "A"),
      row("mr_2", "missing", "B"),
      row("mr_3", "missing", "C"),
      row("mr_4", "needs_review", "D"),
    ]);
    render(<ResultsPage />);
    const summary = await screen.findByTestId("result-summary");
    expect(summary).toHaveTextContent("전체 4");
    expect(summary).toHaveTextContent("보유 1");
    expect(summary).toHaveTextContent("누락 2");
    expect(summary).toHaveTextContent("확인필요 1");
  });

  it("Missing 필터를 누르면 missing 행만 보인다", async () => {
    mockedLoad.mockReturnValue([
      row("mr_1", "owned", "Owned Track"),
      row("mr_2", "missing", "Missing Track"),
    ]);
    render(<ResultsPage />);
    await screen.findByText("Owned Track");
    await userEvent.click(screen.getByRole("button", { name: /^missing$/i }));
    expect(screen.getByText("Missing Track")).toBeInTheDocument();
    expect(screen.queryByText("Owned Track")).toBeNull();
  });

  it("필터 결과가 없으면 No results를 표시한다", async () => {
    mockedLoad.mockReturnValue([row("mr_1", "owned", "Owned Track")]);
    render(<ResultsPage />);
    await screen.findByText("Owned Track");
    await userEvent.click(screen.getByRole("button", { name: /^missing$/i }));
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });
});
