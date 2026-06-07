import { NextResponse } from "next/server";
import type {
  ApiResult,
  PriceSearchResponse,
  PriceSearchRequest,
} from "@/types/api";
import { searchOffers } from "@/services/price-provider.service";

export async function POST(
  req: Request,
): Promise<NextResponse<ApiResult<PriceSearchResponse>>> {
  try {
    const body = (await req.json()) as Partial<PriceSearchRequest>;
    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "missing_title", message: "title이 필요합니다." },
        },
        { status: 400 },
      );
    }
    const data = searchOffers({ title, artist: body.artist });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "가격 조회 중 오류가 발생했습니다.";
    return NextResponse.json(
      { ok: false, error: { code: "price_error", message } },
      { status: 400 },
    );
  }
}
