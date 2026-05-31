import { describe, it, expect } from "vitest";
import { readApiResult } from "@/services/http";

function jsonResponse(body: unknown, init?: { status?: number }): Response {
  return { status: init?.status ?? 200, json: async () => body } as Response;
}

describe("readApiResult", () => {
  it("ok:true면 data를 언랩한다", async () => {
    const data = { foo: 1 };
    await expect(
      readApiResult(jsonResponse({ ok: true, data })),
    ).resolves.toEqual(data);
  });
  it("ok:false면 error.message로 throw한다", async () => {
    await expect(
      readApiResult(
        jsonResponse({ ok: false, error: { code: "x", message: "실패함" } }),
      ),
    ).rejects.toThrow("실패함");
  });
  it("봉투가 아닌 HTTP 오류면 fallback 메시지로 throw한다", async () => {
    await expect(
      readApiResult(
        jsonResponse({ message: "err" }, { status: 500 }),
        "가격 조회에 실패했습니다",
      ),
    ).rejects.toThrow("가격 조회에 실패했습니다");
  });
});
