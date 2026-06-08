import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CandidateReviewPanel } from "@/components/results/CandidateReviewPanel";
import type { MatchCandidate } from "@/types/match";
import type { RekordboxTrack } from "@/types/track";

// 계약 격리: @/mocks 대신 테스트 내부에서 최소 데이터만 인라인 생성.
function track(id: string, title: string, artist?: string): RekordboxTrack {
  return {
    id,
    title,
    artist,
    normalizedTitle: title.toLowerCase(),
    normalizedArtist: artist?.toLowerCase(),
  };
}

function candidate(
  rekordboxTrackId: string,
  score: number,
  reason: MatchCandidate["reason"],
): MatchCandidate {
  return { rekordboxTrackId, score, reason };
}

const tracksById: Record<string, RekordboxTrack> = {
  rb_1: track("rb_1", "One More Time", "Daft Punk"),
  rb_2: track("rb_2", "Da Funk", "Daft Punk"),
};

// score 내림차순으로 들어온다는 전제(컴포넌트는 받은 순서대로 렌더).
const candidates: MatchCandidate[] = [
  candidate("rb_1", 0.87, "similar_title_artist"),
  candidate("rb_2", 0.42, "similar_title"),
];

beforeEach(() => vi.clearAllMocks());

describe("CandidateReviewPanel", () => {
  it("candidates 개수만큼 행을 렌더하고 조회한 곡명·아티스트를 표시한다", () => {
    render(
      <CandidateReviewPanel
        candidates={candidates}
        tracksById={tracksById}
        onConfirm={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.getByText(/One More Time — Daft Punk/)).toBeInTheDocument();
    expect(screen.getByText(/Da Funk — Daft Punk/)).toBeInTheDocument();
    // 후보 행마다 확정 버튼이 하나씩.
    expect(
      screen.getAllByRole("button", { name: "이 곡으로 확정" }),
    ).toHaveLength(2);
  });

  it("받은 순서를 유지해 렌더한다(정렬하지 않음)", () => {
    render(
      <CandidateReviewPanel
        candidates={candidates}
        tracksById={tracksById}
        onConfirm={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    const titles = screen
      .getAllByTestId("candidate-title")
      .map((el) => el.textContent);
    expect(titles).toEqual([
      "One More Time — Daft Punk",
      "Da Funk — Daft Punk",
    ]);
  });

  it("score를 퍼센트로 반올림해 표시한다", () => {
    render(
      <CandidateReviewPanel
        candidates={candidates}
        tracksById={tracksById}
        onConfirm={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.getByText("87%")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("reason을 한국어 라벨로 렌더한다", () => {
    const all: MatchCandidate[] = [
      candidate("rb_1", 1, "exact"),
      candidate("rb_2", 0.9, "similar_title_artist"),
      candidate("rb_1", 0.8, "similar_title"),
      candidate("rb_2", 0.7, "manual"),
    ];
    render(
      <CandidateReviewPanel
        candidates={all}
        tracksById={tracksById}
        onConfirm={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.getByText("정확 일치")).toBeInTheDocument();
    expect(screen.getByText("제목·아티스트 유사")).toBeInTheDocument();
    expect(screen.getByText("제목 유사")).toBeInTheDocument();
    expect(screen.getByText("수동 확정")).toBeInTheDocument();
  });

  it("'이 곡으로 확정' 클릭 시 해당 rekordboxTrackId로 onConfirm을 호출한다", async () => {
    const onConfirm = vi.fn();
    render(
      <CandidateReviewPanel
        candidates={candidates}
        tracksById={tracksById}
        onConfirm={onConfirm}
        onReject={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole("button", { name: "이 곡으로 확정" });
    await userEvent.click(buttons[1]);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith("rb_2");
  });

  it("'누락으로 표시' 클릭 시 onReject를 호출한다", async () => {
    const onReject = vi.fn();
    render(
      <CandidateReviewPanel
        candidates={candidates}
        tracksById={tracksById}
        onConfirm={vi.fn()}
        onReject={onReject}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "미보유로 표시" }),
    );
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("조회 실패한 트랙은 rekordboxTrackId로 대체 표시한다", () => {
    render(
      <CandidateReviewPanel
        candidates={[candidate("rb_unknown", 0.5, "similar_title")]}
        tracksById={tracksById}
        onConfirm={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.getByTestId("candidate-title")).toHaveTextContent(
      "rb_unknown",
    );
  });

  it("빈 candidates면 안내 문구와 reject 버튼만 렌더한다", async () => {
    const onReject = vi.fn();
    render(
      <CandidateReviewPanel
        candidates={[]}
        tracksById={tracksById}
        onConfirm={vi.fn()}
        onReject={onReject}
      />,
    );
    expect(screen.getByText(/후보 없음/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "이 곡으로 확정" }),
    ).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "미보유로 표시" }),
    );
    expect(onReject).toHaveBeenCalledTimes(1);
  });
});
