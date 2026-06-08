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
vi.mock("@/services/analysis-history", () => ({ addSession: vi.fn() }));
vi.mock("@/services/rerun-handoff", () => ({ takeRerunUrl: vi.fn(() => null) }));
// 수동 결정 적용은 서비스로 위임. 기본: 결정 없음·원본 그대로 반환(per-test 덮어쓰기).
vi.mock("@/services/manual-match-rules", () => ({
  loadManualDecisions: vi.fn(() => ({})),
  applyManualDecisions: vi.fn((results) => results),
}));

import { loadPlaylist, parseXml, runMatch } from "@/services/analysis.service";
import { saveAnalysis } from "@/services/analysis-handoff";
import { addSession } from "@/services/analysis-history";
import { takeRerunUrl } from "@/services/rerun-handoff";
import {
  loadManualDecisions,
  applyManualDecisions,
} from "@/services/manual-match-rules";
import { AnalysisFlow } from "@/components/analysis/AnalysisFlow";

const mockedLoad = vi.mocked(loadPlaylist);
const mockedParse = vi.mocked(parseXml);
const mockedRun = vi.mocked(runMatch);
const mockedSave = vi.mocked(saveAnalysis);
const mockedAddSession = vi.mocked(addSession);
const mockedTakeRerun = vi.mocked(takeRerunUrl);
const mockedLoadDecisions = vi.mocked(loadManualDecisions);
const mockedApplyDecisions = vi.mocked(applyManualDecisions);

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
  mockedTakeRerun.mockReturnValue(null); // 기본: rerun 없음
  // clearAllMocks가 factory 구현을 비우므로 기본 동작을 매 테스트 복원.
  mockedLoadDecisions.mockReturnValue({});
  mockedApplyDecisions.mockImplementation((results) => results);
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

  it("Run 성공 시 요약 세션을 내역에 저장한다", async () => {
    mockedLoad.mockResolvedValue(playlistRes(2));
    mockedParse.mockResolvedValue(parseRes(5));
    mockedRun.mockResolvedValue([
      { id: "mr_1", youtubeTrackId: "yt_1", status: "owned", confidence: "high", score: 1, candidates: [] },
      { id: "mr_2", youtubeTrackId: "yt_2", status: "missing", confidence: "low", score: 0, candidates: [] },
    ] as unknown as Awaited<ReturnType<typeof runMatch>>);

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
    await waitFor(() => expect(mockedAddSession).toHaveBeenCalledTimes(1));

    const session = mockedAddSession.mock.calls[0][0];
    expect(session.playlistUrl).toBe("https://www.youtube.com/playlist?list=PL1");
    expect(session.playlistId).toBe("PL1");
    expect(session.totalTrackCount).toBe(2);
    expect(session.ownedCount).toBe(1);
    expect(session.missingCount).toBe(1);
    expect(session.reviewCount).toBe(0);
  });

  it("rerun URL이 있으면 입력창에 프리필한다", async () => {
    mockedTakeRerun.mockReturnValue("https://yt/playlist?list=PLrerun");
    render(<AnalysisFlow />);
    expect(
      await screen.findByDisplayValue("https://yt/playlist?list=PLrerun"),
    ).toBeInTheDocument();
  });

  it("플레이리스트 로드 실패 시 code 기반 ErrorNotice 가이드를 표시한다", async () => {
    const err = Object.assign(new Error("플레이리스트를 찾을 수 없습니다."), {
      code: "playlist_not_found",
    });
    mockedLoad.mockRejectedValue(err);
    render(<AnalysisFlow />);
    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText("YouTube playlist URL"),
      "https://www.youtube.com/playlist?list=PLx",
    );
    await user.click(screen.getByRole("button", { name: "Load" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("플레이리스트를 찾을 수 없습니다.");
    expect(
      screen.getByText(/비공개·삭제된 플레이리스트일 수 있어요/),
    ).toBeInTheDocument();
  });

  it("Run 시 저장된 수동 결정을 결과에 적용한 뒤 저장한다", async () => {
    mockedLoad.mockResolvedValue(playlistRes(2));
    mockedParse.mockResolvedValue(parseRes(5));
    const rawResults = [
      { id: "mr_1", youtubeTrackId: "yt_1", status: "needs_review", confidence: "medium", score: 0.6, candidates: [] },
    ] as unknown as Awaited<ReturnType<typeof runMatch>>;
    mockedRun.mockResolvedValue(rawResults);
    // 규칙 적용 결과: needs_review → owned 1건으로 변환됐다고 가정.
    const ruledResults = [
      { id: "mr_1", youtubeTrackId: "yt_1", status: "owned", confidence: "high", score: 1, candidates: [] },
    ] as unknown as ReturnType<typeof applyManualDecisions>;
    const decisions = { vid_1: { kind: "confirm", rekordboxTrackId: "rb_1" } } as ReturnType<
      typeof loadManualDecisions
    >;
    mockedLoadDecisions.mockReturnValue(decisions);
    mockedApplyDecisions.mockReturnValue(ruledResults);

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
    await waitFor(() => expect(mockedSave).toHaveBeenCalledTimes(1));

    // applyManualDecisions(runMatch 결과, 플레이리스트 트랙, 로드된 결정)로 호출.
    expect(mockedLoadDecisions).toHaveBeenCalledTimes(1);
    expect(mockedApplyDecisions).toHaveBeenCalledTimes(1);
    const [appliedResults, appliedTracks, appliedRules] =
      mockedApplyDecisions.mock.calls[0];
    expect(appliedResults).toBe(rawResults);
    expect(appliedTracks).toHaveLength(2);
    expect(appliedRules).toBe(decisions);

    // 저장되는 results는 원본이 아니라 규칙 적용본(ruled).
    const saved = mockedSave.mock.calls[0][0];
    expect(saved.results).toBe(ruledResults);
  });

  it("Run 시 내역 카운트는 규칙 적용본(ruled) 기준으로 집계한다", async () => {
    mockedLoad.mockResolvedValue(playlistRes(2));
    mockedParse.mockResolvedValue(parseRes(5));
    // runMatch 원본: needs_review 2건.
    mockedRun.mockResolvedValue([
      { id: "mr_1", youtubeTrackId: "yt_1", status: "needs_review", confidence: "medium", score: 0.6, candidates: [] },
      { id: "mr_2", youtubeTrackId: "yt_2", status: "needs_review", confidence: "medium", score: 0.6, candidates: [] },
    ] as unknown as Awaited<ReturnType<typeof runMatch>>);
    // 규칙 적용 후: owned 1 / missing 1 / review 0.
    mockedApplyDecisions.mockReturnValue([
      { id: "mr_1", youtubeTrackId: "yt_1", status: "owned", confidence: "high", score: 1, candidates: [] },
      { id: "mr_2", youtubeTrackId: "yt_2", status: "missing", confidence: "low", score: 0, candidates: [] },
    ] as unknown as ReturnType<typeof applyManualDecisions>);

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
    await waitFor(() => expect(mockedAddSession).toHaveBeenCalledTimes(1));

    const session = mockedAddSession.mock.calls[0][0];
    expect(session.totalTrackCount).toBe(2);
    expect(session.ownedCount).toBe(1); // 규칙 적용본 기준(원본은 review 2건)
    expect(session.missingCount).toBe(1);
    expect(session.reviewCount).toBe(0);
  });

  it("ErrorNotice의 '다시 시도'가 플레이리스트 로드를 재시도한다", async () => {
    mockedLoad
      .mockRejectedValueOnce(
        Object.assign(new Error("일시적 오류"), { code: "youtube_api_error" }),
      )
      .mockResolvedValueOnce(playlistRes(3));
    render(<AnalysisFlow />);
    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText("YouTube playlist URL"),
      "https://www.youtube.com/playlist?list=PLx",
    );
    await user.click(screen.getByRole("button", { name: "Load" }));
    await screen.findByRole("alert");

    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    // 재시도 성공 → 곡 로드 표시, 오류 사라짐
    await screen.findByText("3곡 로드됨");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(mockedLoad).toHaveBeenCalledTimes(2);
  });
});
