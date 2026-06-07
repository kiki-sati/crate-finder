import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// 패널 내부의 fetch 로직과 분리: 펼침 배선만 검증하기 위해 패널을 스텁으로 대체.
// (CandidateReviewPanel은 후보 표시까지 확인하므로 실제 컴포넌트 그대로 사용한다.)
vi.mock("@/components/price/PriceComparePanel", () => ({
  PriceComparePanel: ({ title }: { title: string }) => (
    <div data-testid="price-panel">panel:{title}</div>
  ),
}));

import { MatchResultTable } from "@/components/results/MatchResultTable";
import type { MatchRow } from "@/components/results/match-row";
import type { MatchCandidate } from "@/types/match";
import type { RekordboxTrack } from "@/types/track";

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

function needsReviewRow(
  id: string,
  title: string,
  candidates: MatchCandidate[],
  candidateTracks: Record<string, RekordboxTrack>,
): MatchRow {
  return {
    result: {
      id,
      youtubeTrackId: `yt_${id}`,
      status: "needs_review",
      confidence: "medium",
      score: 0.6,
      candidates,
    },
    youtubeTrack: {
      id: `yt_${id}`,
      videoId: id,
      rawTitle: title,
      parsedArtist: "Daft Punk",
      parsedTitle: title,
      parseStatus: "needs_review",
    },
    candidateTracks,
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

  it("needs_review 행에는 확인 버튼이 있다", () => {
    render(
      <MatchResultTable
        rows={[
          needsReviewRow(
            "mr_nr",
            "Something About Us",
            [{ rekordboxTrackId: "rb_1", score: 0.8, reason: "similar_title" }],
            {
              rb_1: {
                id: "rb_1",
                title: "Something About Us",
                artist: "Daft Punk",
                normalizedTitle: "something about us",
              },
            },
          ),
        ]}
      />,
    );
    expect(
      screen.getByRole("button", { name: "확인" }),
    ).toBeInTheDocument();
  });

  it("확인 클릭 시 후보 검토 패널을 펼치고 후보를 표시한다", async () => {
    render(
      <MatchResultTable
        rows={[
          needsReviewRow(
            "mr_nr",
            "Something About Us",
            [{ rekordboxTrackId: "rb_1", score: 0.8, reason: "similar_title" }],
            {
              rb_1: {
                id: "rb_1",
                title: "Something",
                artist: "Daft Punk",
                normalizedTitle: "something",
              },
            },
          ),
        ]}
      />,
    );
    expect(screen.queryByText("이 곡으로 확정")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "확인" }));
    expect(screen.getByText("이 곡으로 확정")).toBeInTheDocument();
    // 후보 표시는 candidateTracks(tracksById)로 조회한다.
    expect(screen.getByText("Something — Daft Punk")).toBeInTheDocument();
  });

  it("'이 곡으로 확정' 클릭 시 onConfirm을 (resultId, rekordboxTrackId)로 호출한다", async () => {
    const onConfirm = vi.fn();
    render(
      <MatchResultTable
        rows={[
          needsReviewRow(
            "mr_nr",
            "Something About Us",
            [{ rekordboxTrackId: "rb_1", score: 0.8, reason: "similar_title" }],
            {
              rb_1: {
                id: "rb_1",
                title: "Something",
                normalizedTitle: "something",
              },
            },
          ),
        ]}
        onConfirm={onConfirm}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "확인" }));
    await userEvent.click(screen.getByRole("button", { name: "이 곡으로 확정" }));
    expect(onConfirm).toHaveBeenCalledWith("mr_nr", "rb_1");
  });

  it("'누락으로 표시' 클릭 시 onReject를 (resultId)로 호출한다", async () => {
    const onReject = vi.fn();
    render(
      <MatchResultTable
        rows={[
          needsReviewRow(
            "mr_nr",
            "Something About Us",
            [{ rekordboxTrackId: "rb_1", score: 0.8, reason: "similar_title" }],
            {
              rb_1: {
                id: "rb_1",
                title: "Something",
                normalizedTitle: "something",
              },
            },
          ),
        ]}
        onReject={onReject}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "확인" }));
    await userEvent.click(screen.getByRole("button", { name: "누락으로 표시" }));
    expect(onReject).toHaveBeenCalledWith("mr_nr");
  });
});
