import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnalysisSession } from "@/types/analysis";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/services/analysis-history", () => ({
  listSessions: vi.fn(),
  deleteSession: vi.fn(),
  clearSessions: vi.fn(),
}));
vi.mock("@/services/rerun-handoff", () => ({ setRerunUrl: vi.fn() }));

import {
  listSessions,
  deleteSession,
  clearSessions,
} from "@/services/analysis-history";
import { setRerunUrl } from "@/services/rerun-handoff";
import HistoryPage from "@/app/history/page";

const mockedList = vi.mocked(listSessions);
const mockedDelete = vi.mocked(deleteSession);
const mockedClear = vi.mocked(clearSessions);
const mockedSetRerun = vi.mocked(setRerunUrl);

function session(id: string, over: Partial<AnalysisSession> = {}): AnalysisSession {
  return {
    id,
    playlistUrl: `https://yt/${id}`,
    playlistId: id,
    createdAt: "2026-06-01T00:00:00.000Z",
    totalTrackCount: 10,
    ownedCount: 6,
    missingCount: 3,
    reviewCount: 1,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("HistoryPage", () => {
  it("내역이 없으면 빈 상태와 / 링크를 보여준다", async () => {
    mockedList.mockReturnValue([]);
    render(<HistoryPage />);
    expect(await screen.findByText(/분석 내역이 없습니다/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /새 분석/ })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("세션 목록을 누락 수와 함께 렌더한다", async () => {
    mockedList.mockReturnValue([session("s1")]);
    render(<HistoryPage />);
    expect(await screen.findByText(/https:\/\/yt\/s1/)).toBeInTheDocument();
    expect(screen.getByText(/누락 3/)).toBeInTheDocument();
  });

  it("삭제 확인 시 deleteSession 호출 후 목록에서 사라진다", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    let store: AnalysisSession[] = [session("s1")];
    mockedList.mockImplementation(() => [...store]);
    mockedDelete.mockImplementation((id: string) => {
      store = store.filter((s) => s.id !== id);
    });
    render(<HistoryPage />);
    await screen.findByText(/https:\/\/yt\/s1/);
    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(mockedDelete).toHaveBeenCalledWith("s1");
    await waitFor(() =>
      expect(screen.getByText(/분석 내역이 없습니다/)).toBeInTheDocument(),
    );
    confirmSpy.mockRestore();
  });

  it("삭제 취소 시 deleteSession을 호출하지 않는다", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    mockedList.mockReturnValue([session("s1")]);
    render(<HistoryPage />);
    await screen.findByText(/https:\/\/yt\/s1/);
    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(mockedDelete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("전체 삭제 확인 시 clearSessions 후 비워진다", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedList.mockReturnValue([session("s1"), session("s2")]);
    render(<HistoryPage />);
    await screen.findByText(/https:\/\/yt\/s1/);
    await userEvent.click(screen.getByRole("button", { name: "전체 삭제" }));
    expect(mockedClear).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByText(/분석 내역이 없습니다/)).toBeInTheDocument(),
    );
    confirmSpy.mockRestore();
  });

  it("다시 분석 시 setRerunUrl 후 /로 이동한다", async () => {
    mockedList.mockReturnValue([session("s1", { playlistUrl: "https://yt/re" })]);
    render(<HistoryPage />);
    await screen.findByText(/https:\/\/yt\/re/);
    await userEvent.click(screen.getByRole("button", { name: "다시 분석" }));
    expect(mockedSetRerun).toHaveBeenCalledWith("https://yt/re");
    expect(push).toHaveBeenCalledWith("/");
  });
});
