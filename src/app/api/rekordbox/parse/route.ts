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
    // 보안(ADR-004, CLAUDE.md §보안): 우리가 정의한 도메인 에러(자체 code 보유)의
    // 메시지만 신뢰해 노출한다. 파서 내부 에러(fast-xml-parser 등)는 원시 메시지에
    // XML 원문 조각·로컬 경로가 박혀 누출되므로, 고정 안내문으로 치환한다.
    const hasCode = e !== null && typeof e === "object" && "code" in e;
    const code = hasCode ? String((e as { code: unknown }).code) : "rekordbox_error";
    const message =
      hasCode && e instanceof Error
        ? e.message
        : "XML 파일을 읽지 못했습니다. Rekordbox에서 내보낸 올바른 XML인지 확인해 주세요.";
    return NextResponse.json({ ok: false, error: { code, message } }, { status: 400 });
  }
}
