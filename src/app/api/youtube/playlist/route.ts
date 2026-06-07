import { NextResponse } from "next/server";
import type { ApiResult, YouTubePlaylistResponse } from "@/types/api";
import { fetchPlaylist } from "@/services/youtube.service";

export async function POST(
  req: Request,
): Promise<NextResponse<ApiResult<YouTubePlaylistResponse>>> {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url) {
      return NextResponse.json(
        { ok: false, error: { code: "missing_url", message: "url이 필요합니다." } },
        { status: 400 },
      );
    }
    const data = await fetchPlaylist(url);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    // 보안(ADR-004, CLAUDE.md §보안): 도메인 에러(자체 code 보유)의 안전한 메시지만
    // 노출한다. 본문(JSON) 파싱 에러 등 code 없는 에러는 원시 메시지에 요청 본문·
    // 내부 문구가 새므로 고정 안내문으로 치환한다(catch-all code는 유지).
    const hasCode = e !== null && typeof e === "object" && "code" in e;
    const code = hasCode ? String((e as { code: unknown }).code) : "youtube_error";
    const message =
      hasCode && e instanceof Error
        ? e.message
        : "요청을 처리하지 못했습니다. URL을 확인하고 다시 시도해 주세요.";
    return NextResponse.json({ ok: false, error: { code, message } }, { status: 400 });
  }
}
