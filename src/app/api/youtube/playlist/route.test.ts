import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/youtube/playlist/route";

// 정상 JSON 본문 요청 mock.
function makeJsonRequest(body: unknown): Request {
  return { json: async () => body } as unknown as Request;
}

// json() 파싱이 실패하는 요청 mock. 원시 SyntaxError 메시지에 본문 조각이
// 새는 상황(파서 내부 문구/요청 본문 노출)을 재현한다 — 회귀 방지용.
function makeBadJsonRequest(markerInMessage: string): Request {
  return {
    json: async () => {
      throw new SyntaxError(
        `Unexpected token in JSON at position 5 :: ${markerInMessage}`,
      );
    },
  } as unknown as Request;
}

describe("POST /api/youtube/playlist — 에러 메시지 누출 차단(ADR-004)", () => {
  it("본문 파싱 실패 시 원시 파서 메시지를 노출하지 않는다", async () => {
    const res = await POST(makeBadJsonRequest("LEAK_BODY_MARKER_J7Q"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    // catch-all code는 유지하되, 고정 안내문으로 치환한다.
    expect(body.error.code).toBe("youtube_error");
    expect(body.error.message).not.toContain("LEAK_BODY_MARKER_J7Q");
    expect(body.error.message).not.toContain("JSON");
    expect(body.error.message).not.toContain("position");
    expect(JSON.stringify(body)).not.toContain("LEAK_BODY_MARKER_J7Q");
  });

  it("도메인 에러(잘못된 URL)의 안전 메시지는 그대로 노출한다", async () => {
    const res = await POST(makeJsonRequest({ url: "not a real url" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    // InvalidPlaylistUrlError(code: invalid_playlist_url)의 안전 메시지 유지.
    expect(body.error.code).toBe("invalid_playlist_url");
    expect(body.error.message.length).toBeGreaterThan(0);
  });

  it("url 누락 시 기존 400 분기(missing_url)를 유지한다", async () => {
    const res = await POST(makeJsonRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("missing_url");
  });
});
