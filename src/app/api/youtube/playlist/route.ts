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
    const code =
      e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "youtube_error";
    const message = e instanceof Error ? e.message : "처리 중 오류가 발생했습니다.";
    return NextResponse.json({ ok: false, error: { code, message } }, { status: 400 });
  }
}
