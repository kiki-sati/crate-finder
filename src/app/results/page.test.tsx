import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnalysisHandoff } from "@/services/analysis-handoff";
import type { MatchResult } from "@/types/match";
import type { YouTubeTrack, RekordboxTrack } from "@/types/track";

// 데이터 진입은 readAnalysis 기반. saveAnalysis 호출 검증을 위해 둘 다 mock.
// buildMatchRows(순수 조립)는 실제 동작을 그대로 사용한다.
vi.mock("@/services/analysis-handoff", () => ({
  readAnalysis: vi.fn(),
  saveAnalysis: vi.fn(),
}));
import { readAnalysis, saveAnalysis } from "@/services/analysis-handoff";
import ResultsPage from "@/app/results/page";

const mockedRead = vi.mocked(readAnalysis);
const mockedSave = vi.mocked(saveAnalysis);

function result(
  id: string,
  status: MatchResult["status"],
  extra: Partial<MatchResult> = {},
): MatchResult {
  return {
    id,
    youtubeTrackId: `yt_${id}`,
    status,
    confidence: "high",
    score: 0.9,
    candidates: [],
    ...extra,
  };
}

function ytTrack(id: string, title: string): YouTubeTrack {
  return {
    id: `yt_${id}`,
    videoId: id,
    rawTitle: title,
    parseStatus: "parsed",
    parsedArtist: "Artist",
    parsedTitle: title,
  };
}

// MatchResult[]와 곡명 매핑으로 AnalysisHandoff를 구성하는 헬퍼.
function handoff(
  pairs: Array<[MatchResult, string]>,
  rekordboxTracks: RekordboxTrack[] = [],
): AnalysisHandoff {
  return {
    results: pairs.map(([r]) => r),
    youtubeTracks: pairs.map(([r, title]) =>
      ytTrack(r.id, title),
    ),
    rekordboxTracks,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ResultsPage", () => {
  it("핸드오프가 없으면 빈 상태 안내와 / 링크를 보여준다", async () => {
    mockedRead.mockReturnValue(null);
    render(<ResultsPage />);
    expect(await screen.findByText(/분석을 먼저 실행/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /새 분석/ })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("결과가 있으면 테이블을 렌더한다", async () => {
    mockedRead.mockReturnValue(
      handoff([[result("mr_1", "owned"), "Owned Track"]]),
    );
    render(<ResultsPage />);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
    expect(screen.getByText("Owned Track")).toBeInTheDocument();
  });

  it("상태별 요약 카운트를 표시한다", async () => {
    mockedRead.mockReturnValue(
      handoff([
        [result("mr_1", "owned"), "A"],
        [result("mr_2", "missing"), "B"],
        [result("mr_3", "missing"), "C"],
        [result("mr_4", "needs_review"), "D"],
      ]),
    );
    render(<ResultsPage />);
    const summary = await screen.findByTestId("result-summary");
    expect(summary).toHaveTextContent("전체 4");
    expect(summary).toHaveTextContent("보유 1");
    expect(summary).toHaveTextContent("미보유 2");
    expect(summary).toHaveTextContent("확인필요 1");
  });

  it("Missing 필터를 누르면 missing 행만 보인다", async () => {
    mockedRead.mockReturnValue(
      handoff([
        [result("mr_1", "owned"), "Owned Track"],
        [result("mr_2", "missing"), "Missing Track"],
      ]),
    );
    render(<ResultsPage />);
    await screen.findByText("Owned Track");
    await userEvent.click(screen.getByRole("button", { name: /^미보유$/ }));
    expect(screen.getByText("Missing Track")).toBeInTheDocument();
    expect(screen.queryByText("Owned Track")).toBeNull();
  });

  it("필터 결과가 없으면 No results를 표시한다", async () => {
    mockedRead.mockReturnValue(
      handoff([[result("mr_1", "owned"), "Owned Track"]]),
    );
    render(<ResultsPage />);
    await screen.findByText("Owned Track");
    await userEvent.click(screen.getByRole("button", { name: /^미보유$/ }));
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it("needs_review 확정 시 owned로 바뀌어 요약이 갱신되고 saveAnalysis가 호출된다", async () => {
    const rb: RekordboxTrack = {
      id: "rb_1",
      title: "Reviewed Track",
      artist: "Artist",
      normalizedTitle: "reviewed track",
    };
    mockedRead.mockReturnValue(
      handoff(
        [
          [
            result("mr_1", "needs_review", {
              confidence: "medium",
              score: 0.6,
              candidates: [
                { rekordboxTrackId: "rb_1", score: 0.8, reason: "similar_title" },
              ],
            }),
            "Reviewed Track",
          ],
        ],
        [rb],
      ),
    );
    render(<ResultsPage />);

    const summary = await screen.findByTestId("result-summary");
    expect(summary).toHaveTextContent("보유 0");
    expect(summary).toHaveTextContent("확인필요 1");

    // 후보 패널 펼치기 → 확정.
    await userEvent.click(screen.getByRole("button", { name: "확인" }));
    await userEvent.click(screen.getByRole("button", { name: "이 곡으로 확정" }));

    // (1) 요약 갱신: 보유 +1 / 확인필요 -1
    expect(summary).toHaveTextContent("보유 1");
    expect(summary).toHaveTextContent("확인필요 0");
    // (2) 저장 호출, results[0].status === owned
    expect(mockedSave).toHaveBeenCalledTimes(1);
    const saved = mockedSave.mock.calls[0][0] as AnalysisHandoff;
    expect(saved.results[0].status).toBe("owned");
    expect(saved.results[0].matchedRekordboxTrackId).toBe("rb_1");
  });

  it("needs_review 거부 시 missing으로 바뀌고 saveAnalysis가 호출된다", async () => {
    const rb: RekordboxTrack = {
      id: "rb_1",
      title: "Reviewed Track",
      normalizedTitle: "reviewed track",
    };
    mockedRead.mockReturnValue(
      handoff(
        [
          [
            result("mr_1", "needs_review", {
              confidence: "medium",
              score: 0.6,
              candidates: [
                { rekordboxTrackId: "rb_1", score: 0.8, reason: "similar_title" },
              ],
            }),
            "Reviewed Track",
          ],
        ],
        [rb],
      ),
    );
    render(<ResultsPage />);

    const summary = await screen.findByTestId("result-summary");
    await userEvent.click(screen.getByRole("button", { name: "확인" }));
    await userEvent.click(screen.getByRole("button", { name: "미보유로 표시" }));

    expect(summary).toHaveTextContent("미보유 1");
    expect(summary).toHaveTextContent("확인필요 0");
    expect(mockedSave).toHaveBeenCalledTimes(1);
    const saved = mockedSave.mock.calls[0][0] as AnalysisHandoff;
    expect(saved.results[0].status).toBe("missing");
  });
});
