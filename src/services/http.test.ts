import { describe, it, expect } from "vitest";
import { readApiResult, ApiError } from "@/services/http";

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

  it("ok:false면 ApiError로 throw하고 code/message를 보존한다", async () => {
    const promise = readApiResult(
      jsonResponse({
        ok: false,
        error: { code: "youtube_quota_exceeded", message: "쿼터 초과" },
      }),
    );
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toThrow("쿼터 초과");
    await expect(promise).rejects.toMatchObject({
      code: "youtube_quota_exceeded",
      message: "쿼터 초과",
    });
  });

  it("봉투가 아닌 HTTP 오류면 code=unknown인 ApiError로 throw한다", async () => {
    const promise = readApiResult(
      jsonResponse({ message: "err" }, { status: 500 }),
      "가격 조회에 실패했습니다",
    );
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toThrow("가격 조회에 실패했습니다");
    await expect(promise).rejects.toMatchObject({ code: "unknown" });
  });

  it("JSON 파싱 자체가 실패해도 code=unknown인 ApiError로 throw한다", async () => {
    const broken = {
      status: 502,
      json: async () => {
        throw new Error("invalid json");
      },
    } as unknown as Response;
    const promise = readApiResult(broken, "요청 실패");
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({ code: "unknown" });
  });
});
