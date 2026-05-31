import { NextResponse } from "next/server";
import type { ApiResult, RekordboxParseResponse } from "@/types/api";
import { parseUploadedXml } from "@/services/rekordbox.service";

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
