import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorNotice } from "@/components/analysis/ErrorNotice";

describe("ErrorNotice", () => {
  it("role=alert로 message를 표시한다", () => {
    render(<ErrorNotice message="플레이리스트를 불러오지 못했습니다." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("플레이리스트를 불러오지 못했습니다.");
  });

  it("code별 한국어 해결 가이드를 함께 보여준다", () => {
    render(
      <ErrorNotice
        code="playlist_not_found"
        message="플레이리스트를 찾을 수 없습니다."
      />,
    );
    // 도메인 메시지(폴백)
    expect(screen.getByText(/플레이리스트를 찾을 수 없습니다/)).toBeInTheDocument();
    // code → 가이드
    expect(
      screen.getByText(/비공개·삭제된 플레이리스트일 수 있어요/),
    ).toBeInTheDocument();
  });

  it("invalid_playlist_url 가이드는 URL 형식 안내를 포함한다", () => {
    render(<ErrorNotice code="invalid_playlist_url" message="bad url" />);
    expect(screen.getByText(/youtube\.com\/playlist\?list=/)).toBeInTheDocument();
  });

  it("file_too_large 가이드는 20MB 안내를 포함한다", () => {
    render(<ErrorNotice code="file_too_large" message="too big" />);
    expect(screen.getByText(/20MB/)).toBeInTheDocument();
  });

  it("youtube_error(라우트 catch-all)에도 해결 가이드를 보여준다", () => {
    render(<ErrorNotice code="youtube_error" message="요청 실패" />);
    expect(screen.getByText("요청 실패")).toBeInTheDocument();
    expect(
      screen.getByText(/요청을 처리하지 못했어요\. URL을 확인하고/),
    ).toBeInTheDocument();
  });

  it("unknown(API 폴백) code에도 해결 가이드를 보여준다", () => {
    render(<ErrorNotice code="unknown" message="알 수 없음" />);
    expect(screen.getByText("알 수 없음")).toBeInTheDocument();
    expect(
      screen.getByText(/알 수 없는 오류가 발생했어요/),
    ).toBeInTheDocument();
  });

  it("알 수 없는 code면 전용 가이드를 표시하지 않는다", () => {
    render(<ErrorNotice code="totally_unknown_code" message="무언가 잘못됨" />);
    expect(screen.getByText("무언가 잘못됨")).toBeInTheDocument();
    // 등록된 code들의 고유 문구는 전혀 나타나면 안 된다.
    expect(screen.queryByText(/비공개·삭제된/)).not.toBeInTheDocument();
    expect(screen.queryByText(/20MB/)).not.toBeInTheDocument();
  });

  it("code가 없어도 message만 안전하게 표시한다", () => {
    render(<ErrorNotice message="일반 오류" />);
    expect(screen.getByText("일반 오류")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument();
  });

  it("onRetry가 있으면 '다시 시도' 버튼을 노출하고 클릭 시 호출한다", async () => {
    const onRetry = vi.fn();
    render(<ErrorNotice message="실패" onRetry={onRetry} />);
    const btn = screen.getByRole("button", { name: "다시 시도" });
    await userEvent.click(btn);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("onRetry가 없으면 '다시 시도' 버튼을 표시하지 않는다", () => {
    render(<ErrorNotice message="실패" />);
    expect(
      screen.queryByRole("button", { name: "다시 시도" }),
    ).not.toBeInTheDocument();
  });
});
