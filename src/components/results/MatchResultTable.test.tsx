import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// 패널 내부의 fetch 로직과 분리: 펼침 배선만 검증하기 위해 패널을 스텁으로 대체.
vi.mock("@/components/price/PriceComparePanel", () => ({
  PriceComparePanel: ({ title }: { title: string }) => (
    <div data-testid="price-panel">panel:{title}</div>
  ),
}));

import { MatchResultTable } from "@/components/results/MatchResultTable";
import type { MatchRow } from "@/components/results/match-row";

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
      score: 0.5,
      candidates: [],
    },
    youtubeTrack: {
      id: `yt_${id}`,
      videoId: id,
      rawTitle: title,
      parsedArtist: "Daft Punk",
      parsedTitle: title,
      parseStatus: "parsed",
    },
  };
}

const rows: MatchRow[] = [
  row("mr_1", "owned", "One More Time"),
  row("mr_2", "missing", "Da Funk"),
];
beforeEach(() => vi.clearAllMocks());

describe("MatchResultTable", () => {
  it("행의 곡명/아티스트와 상태 배지를 렌더한다", () => {
    render(<MatchResultTable rows={rows} />);
    expect(screen.getByText("One More Time")).toBeInTheDocument();
    expect(screen.getAllByText("Daft Punk").length).toBeGreaterThan(0);
  });

  it("빈 목록이면 안내 문구를 표시한다", () => {
    render(<MatchResultTable rows={[]} />);
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it("missing 행에만 구매 버튼이 있다", () => {
    render(<MatchResultTable rows={rows} />);
    const buttons = screen.getAllByRole("button", { name: "구매" });
    expect(buttons).toHaveLength(1);
  });

  it("구매 클릭 시 해당 곡의 가격 패널을 펼친다", async () => {
    render(<MatchResultTable rows={rows} />);
    expect(screen.queryByTestId("price-panel")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "구매" }));
    expect(screen.getByTestId("price-panel")).toHaveTextContent("panel:Da Funk");
  });
});
