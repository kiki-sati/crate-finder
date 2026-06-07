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
