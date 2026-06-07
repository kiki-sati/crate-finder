import { NextResponse } from "next/server";
import type { ApiResult, RekordboxParseResponse } from "@/types/api";
import { parseUploadedXml } from "@/services/rekordbox.service";
import { validateXmlFile } from "@/lib/rekordbox/validate-xml-file";

export async function POST(
  req: Request,
): Promise<NextResponse<ApiResult<RekordboxParseResponse>>> {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: { code: "missing_file", message: "file이 필요합니다." } },
        { status: 400 },
      );
    }
    // 본문을 메모리로 읽기 전에 확장자/크기를 먼저 검증한다.
    // 20MB 초과 파일을 file.text()로 통째로 올린 뒤 거부하면 메모리 선점
    // (경미한 DoS 표면)이 생기므로, 읽기 전에 차단한다.
    validateXmlFile({ name: file.name, size: file.size });
    const xml = await file.text();
    const data = parseUploadedXml({ name: file.name, size: file.size }, xml);
    // 원본 xml은 여기서 폐기(저장/로그 금지).
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "rekordbox_error";
    const message = e instanceof Error ? e.message : "파싱 중 오류가 발생했습니다.";
    return NextResponse.json({ ok: false, error: { code, message } }, { status: 400 });
  }
}
