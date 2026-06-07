import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/price/search/route";

function makeJsonRequest(body: unknown): Request {
  return { json: async () => body } as unknown as Request;
}

// json() 파싱이 실패하는 요청 mock — 원시 메시지에 본문 조각이 새는 상황 재현.
function makeBadJsonRequest(markerInMessage: string): Request {
  return {
    json: async () => {
      throw new SyntaxError(
        `Unexpected token in JSON at position 3 :: ${markerInMessage}`,
      );
    },
  } as unknown as Request;
}

describe("POST /api/price/search — 에러 메시지 누출 차단(ADR-004)", () => {
  it("본문 파싱 실패 시 원시 파서 메시지를 노출하지 않는다", async () => {
    const res = await POST(makeBadJsonRequest("LEAK_BODY_MARKER_P2X"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    // catch-all code는 유지하되, 고정 안내문으로 치환한다.
    expect(body.error.code).toBe("price_error");
    expect(body.error.message).not.toContain("LEAK_BODY_MARKER_P2X");
    expect(body.error.message).not.toContain("JSON");
    expect(body.error.message).not.toContain("position");
    expect(JSON.stringify(body)).not.toContain("LEAK_BODY_MARKER_P2X");
  });

  it("title 누락 시 기존 400 분기(missing_title)를 유지한다", async () => {
    const res = await POST(makeJsonRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("missing_title");
  });

  it("정상 입력은 가격 후보를 반환한다", async () => {
    const res = await POST(makeJsonRequest({ title: "Some Track" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.offers)).toBe(true);
  });
});
