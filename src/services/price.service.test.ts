import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchPrices } from "@/services/price.service";
import type { PriceSearchResponse } from "@/types/api";

function jsonResponse(body: unknown, init?: { status?: number }): Response {
  return { status: init?.status ?? 200, json: async () => body } as Response;
}

beforeEach(() => vi.restoreAllMocks());

describe("price.service", () => {
  it("ok:true면 라우트 호출 후 data를 언랩한다", async () => {
    const data: PriceSearchResponse = {
      query: "daft punk one more time",
      offers: [],
      provider: "search_link",
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ ok: true, data }));
    const res = await searchPrices({ title: "One More Time", artist: "Daft Punk" });
    expect(res).toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/price/search",
      expect.objectContaining({ method: "POST" }),
    );
  });
  it("ok:false면 error.message로 throw", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        { ok: false, error: { code: "price_error", message: "조회 실패" } },
        { status: 400 },
      ),
    );
    await expect(searchPrices({ title: "X" })).rejects.toThrow("조회 실패");
  });
  it("봉투가 아닌 HTTP 오류면 throw", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ message: "ISE" }, { status: 500 }),
    );
    await expect(searchPrices({ title: "X" })).rejects.toThrow();
  });
});
