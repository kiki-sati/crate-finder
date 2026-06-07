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
    // 보안(ADR-004, CLAUDE.md §보안): 도메인 에러(자체 code 보유)의 안전한 메시지만
    // 노출하고, 그 외(본문 파싱 에러 등)는 원시 메시지를 차단하고 고정 안내문으로
    // 치환한다. catch-all code는 기존 price_error를 유지한다.
    const hasCode = e !== null && typeof e === "object" && "code" in e;
    const code = hasCode ? String((e as { code: unknown }).code) : "price_error";
    const message =
      hasCode && e instanceof Error
        ? e.message
        : "가격 검색 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    return NextResponse.json(
      { ok: false, error: { code, message } },
      { status: 400 },
    );
  }
}
