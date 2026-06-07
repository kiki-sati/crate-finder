import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/rekordbox/parse/route";
import { MAX_XML_BYTES } from "@/lib/rekordbox/validate-xml-file";

// 실제 File을 만들어 instanceof File을 통과시키되, size는 덮어쓰고
// text()는 spy로 감싸 "본문을 읽었는지"를 검증할 수 있게 한다.
function makeFile(opts: { name: string; size: number; text?: string }): File {
  const file = new File([opts.text ?? ""], opts.name, { type: "text/xml" });
  Object.defineProperty(file, "size", { value: opts.size, configurable: true });
  const spy = vi.fn(async () => opts.text ?? "");
  Object.defineProperty(file, "text", { value: spy, configurable: true });
  return file;
}

function makeRequest(file: File): Request {
  const form = new FormData();
  form.append("file", file);
  return { formData: async () => form } as unknown as Request;
}

describe("POST /api/rekordbox/parse — 크기/확장자 사전 검증", () => {
  it("최대 크기를 초과하면 본문(text)을 읽기 전에 거부한다", async () => {
    const file = makeFile({ name: "big.xml", size: MAX_XML_BYTES + 1 });
    const res = await POST(makeRequest(file));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    // 핵심: 거대한 파일을 메모리로 올리지 않았어야 한다.
    expect((file.text as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it(".xml이 아니면 본문을 읽기 전에 거부한다", async () => {
    const file = makeFile({ name: "evil.txt", size: 100 });
    const res = await POST(makeRequest(file));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect((file.text as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it("정상 .xml은 본문을 읽어 파싱한다", async () => {
    const xml = `<DJ_PLAYLISTS><COLLECTION Entries="1"><TRACK TrackID="1" Name="A" Artist="B" TotalTime="10"/></COLLECTION></DJ_PLAYLISTS>`;
    const file = makeFile({ name: "ok.xml", size: xml.length, text: xml });
    const res = await POST(makeRequest(file));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.trackCount).toBe(1);
    expect(file.text).toHaveBeenCalledOnce();
  });
});

describe("POST /api/rekordbox/parse — 에러 메시지 누출 차단(ADR-004)", () => {
  it("손상 XML의 파서 원시 메시지(원문 조각)를 응답에 노출하지 않는다", async () => {
    // fast-xml-parser는 이 입력에서 throw하며, 원시 메시지에 XML 원문 조각
    // (여기선 SECRET 값 마커)을 그대로 담는다 — 회귀 방지용 누출 케이스.
    const leaky = `<DJ_PLAYLISTS><COLLECTION><TRACK SECRET="LEAK_MARKER_8F3K" <BROKEN`;
    const file = makeFile({ name: "evil.xml", size: leaky.length, text: leaky });
    const res = await POST(makeRequest(file));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    // catch-all code는 유지하되, 원시 파서 메시지가 아닌 고정 안내문이어야 한다.
    expect(body.error.code).toBe("rekordbox_error");
    expect(body.error.message).not.toContain("LEAK_MARKER_8F3K");
    expect(body.error.message).not.toContain("readTagExp");
    expect(body.error.message).not.toContain("position");
    // 응답 전체(직렬화)에도 마커/경로 흔적이 없어야 한다.
    expect(JSON.stringify(body)).not.toContain("LEAK_MARKER_8F3K");
    expect(JSON.stringify(body)).not.toContain("file://");
  });

  it("DJ_PLAYLISTS 루트가 없는 .xml은 rekordbox_error + 고정 안내문으로 처리한다", async () => {
    // L2 UX: Rekordbox 내보내기가 아닌 XML을 0곡으로 통과시키지 않고 형식 오류로 알린다.
    const notRekordbox = `<foo SECRET="LEAK_MARKER_RB"><bar location="file://localhost/Users/dj/x.mp3"/></foo>`;
    const file = makeFile({
      name: "itunes.xml",
      size: notRekordbox.length,
      text: notRekordbox,
    });
    const res = await POST(makeRequest(file));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    // 코드 없는 형식 오류 → 라우트가 rekordbox_error 폴백으로 변환(FE 가이드 존재).
    expect(body.error.code).toBe("rekordbox_error");
    // 입력 원문/경로가 응답에 새지 않는다.
    expect(body.error.message).not.toContain("LEAK_MARKER_RB");
    expect(JSON.stringify(body)).not.toContain("LEAK_MARKER_RB");
    expect(JSON.stringify(body)).not.toContain("file://");
  });

  it("유효 DJ_PLAYLISTS + 빈 COLLECTION은 200 + 0곡으로 유지한다(회귀 방지)", async () => {
    const empty = `<DJ_PLAYLISTS><COLLECTION Entries="0"></COLLECTION></DJ_PLAYLISTS>`;
    const file = makeFile({ name: "empty.xml", size: empty.length, text: empty });
    const res = await POST(makeRequest(file));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.trackCount).toBe(0);
  });

  it("도메인 에러(.txt 확장자)의 안전 메시지는 그대로 노출한다", async () => {
    const file = makeFile({ name: "evil.txt", size: 100 });
    const res = await POST(makeRequest(file));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    // InvalidXmlFileError(code: invalid_extension)의 안전한 한국어 메시지 유지.
    expect(body.error.code).toBe("invalid_extension");
    expect(body.error.message.length).toBeGreaterThan(0);
    expect(body.error.message).not.toContain("Error");
  });
});
