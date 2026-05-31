import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/services/analysis.service", () => ({
  loadPlaylist: vi.fn(),
  parseXml: vi.fn(),
  runMatch: vi.fn(),
}));
vi.mock("@/services/analysis-handoff", () => ({ saveAnalysis: vi.fn() }));

import { loadPlaylist, parseXml, runMatch } from "@/services/analysis.service";
import { saveAnalysis } from "@/services/analysis-handoff";
import { AnalysisFlow } from "@/components/analysis/AnalysisFlow";

const mockedLoad = vi.mocked(loadPlaylist);
const mockedParse = vi.mocked(parseXml);
const mockedRun = vi.mocked(runMatch);
const mockedSave = vi.mocked(saveAnalysis);

function playlistRes(trackCount: number) {
  return {
    playlistId: "PL1",
    tracks: Array.from({ length: trackCount }, () => ({})),
    unavailableCount: 0,
  } as unknown as Awaited<ReturnType<typeof loadPlaylist>>;
}
function parseRes(trackCount: number) {
  return {
    trackCount,
    tracks: [],
    warnings: [],
  } as unknown as Awaited<ReturnType<typeof parseXml>>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AnalysisFlow", () => {
  it("초기에는 Run 버튼이 비활성화", () => {
    render(<AnalysisFlow />);
    expect(screen.getByRole("button", { name: "Run Match" })).toBeDisabled();
  });

  it("플레이리스트만 로드하면 Run은 여전히 비활성화", async () => {
    mockedLoad.mockResolvedValue(playlistRes(2));
    render(<AnalysisFlow />);
    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText("YouTube playlist URL"),
      "https://www.youtube.com/playlist?list=PL1",
    );
    await user.click(screen.getByRole("button", { name: "Load" }));
    await screen.findByText("2곡 로드됨");
    expect(screen.getByRole("button", { name: "Run Match" })).toBeDisabled();
  });

  it("XML 업로드 성공 시 파일명과 트랙 수를 표시한다", async () => {
    mockedParse.mockResolvedValue(parseRes(5));
    const { container } = render(<AnalysisFlow />);
    const user = userEvent.setup();
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["<xml/>"], "library.xml", { type: "text/xml" }),
    );
    expect(await screen.findByText(/library\.xml/)).toHaveTextContent("5곡");
  });

  it("둘 다 준비되면 Run 활성화, 클릭 시 /results로 이동", async () => {
    mockedLoad.mockResolvedValue(playlistRes(2));
    mockedParse.mockResolvedValue(parseRes(5));
    mockedRun.mockResolvedValue([]);
    const { container } = render(<AnalysisFlow />);
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText("YouTube playlist URL"),
      "https://www.youtube.com/playlist?list=PL1",
    );
    await user.click(screen.getByRole("button", { name: "Load" }));
    await screen.findByText("2곡 로드됨");

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["<xml/>"], "library.xml", { type: "text/xml" }),
    );
    await screen.findByText(/library\.xml/);

    const runBtn = screen.getByRole("button", { name: "Run Match" });
    expect(runBtn).toBeEnabled();
    await user.click(runBtn);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/results"));
  });

  it("URL 오류 시 에러 메시지를 즉시 표시한다", async () => {
    mockedLoad.mockRejectedValue(
      new Error("유효한 YouTube 플레이리스트 URL이 아닙니다."),
    );
    render(<AnalysisFlow />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("YouTube playlist URL"), "bad");
    await user.click(screen.getByRole("button", { name: "Load" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("유효한 YouTube");
  });

  it("Run 클릭 시 결과를 저장한 뒤 /results로 이동한다", async () => {
    mockedLoad.mockResolvedValue(playlistRes(2));
    mockedParse.mockResolvedValue(parseRes(5));
    const matchResults = [
      {
        id: "mr_1",
        youtubeTrackId: "yt_1",
        status: "missing",
        confidence: "low",
        score: 0,
        candidates: [],
      },
    ] as unknown as Awaited<ReturnType<typeof runMatch>>;
    mockedRun.mockResolvedValue(matchResults);

    const { container } = render(<AnalysisFlow />);
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText("YouTube playlist URL"),
      "https://www.youtube.com/playlist?list=PL1",
    );
    await user.click(screen.getByRole("button", { name: "Load" }));
    await screen.findByText("2곡 로드됨");

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["<xml/>"], "library.xml", { type: "text/xml" }),
    );
    await screen.findByText(/library\.xml/);

    await user.click(screen.getByRole("button", { name: "Run Match" }));
    await waitFor(() => {
      expect(mockedSave).toHaveBeenCalledTimes(1);
      expect(push).toHaveBeenCalledWith("/results");
    });

    // 저장된 페이로드: results + 트랙 배열이 올바른 슬롯에 배선됐는지 검증.
    // playlistRes(2) → youtubeTracks 길이 2, parseRes(5) → rekordboxTracks 길이 0.
    // (두 배열이 뒤바뀌면 길이가 0/2로 어긋나 실패한다)
    const saved = mockedSave.mock.calls[0][0];
    expect(saved.results).toBe(matchResults);
    expect(saved.youtubeTracks).toHaveLength(2);
    expect(saved.rekordboxTracks).toHaveLength(0);

    // 저장이 네비게이션보다 먼저 일어나야 한다.
    const saveOrder = mockedSave.mock.invocationCallOrder[0];
    const pushOrder = push.mock.invocationCallOrder[0];
    expect(saveOrder).toBeLessThan(pushOrder);
  });
});
