import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/services/price.service", () => ({ searchPrices: vi.fn() }));
import { searchPrices } from "@/services/price.service";
import { PriceComparePanel } from "@/components/price/PriceComparePanel";

const mocked = vi.mocked(searchPrices);
beforeEach(() => vi.clearAllMocks());

describe("PriceComparePanel", () => {
  it("오퍼를 새 탭 링크로 렌더하고 최저가를 표시한다", async () => {
    mocked.mockResolvedValue({
      query: "daft punk one more time",
      provider: "mock",
      offers: [
        {
          site: "Beatport",
          price: 1.99,
          currency: "USD",
          url: "https://x/b",
          isLowest: true,
          fetchedAt: "t",
        },
        {
          site: "Traxsource",
          price: 2.49,
          currency: "USD",
          url: "https://x/t",
          fetchedAt: "t",
        },
      ],
    });
    render(<PriceComparePanel title="One More Time" artist="Daft Punk" />);
    const beatport = await screen.findByRole("link", { name: "Beatport" });
    expect(beatport).toHaveAttribute("target", "_blank");
    expect(beatport).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByLabelText("최저가")).toBeInTheDocument();
  });

  it("에러 시 alert과 다시 시도 버튼을 표시하고, 재시도 시 다시 호출한다", async () => {
    mocked.mockRejectedValueOnce(new Error("조회 실패"));
    render(<PriceComparePanel title="X" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("조회 실패");
    mocked.mockResolvedValueOnce({ query: "x", provider: "mock", offers: [] });
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(mocked).toHaveBeenCalledTimes(2));
  });

  it("오퍼가 없으면 안내 문구를 표시한다", async () => {
    mocked.mockResolvedValue({ query: "x", provider: "search_link", offers: [] });
    render(<PriceComparePanel title="X" />);
    expect(await screen.findByText(/찾지 못했습니다/)).toBeInTheDocument();
  });
});
