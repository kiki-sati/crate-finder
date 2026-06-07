// ApiResult 봉투를 언랩하는 공유 헬퍼. analysis.service / price.service가 공통 사용.
import type { ApiResult } from "@/types/api";

// 라우트가 ApiErr.error.code로 반환한 오류 분류를 클라이언트(FE)까지 보존한다.
// FE는 .code로 오류 종류별 안내를 분기한다(MVP #7 오류 처리 UX).
// 보안: code/message에 API Key·키 포함 URL·로컬 경로·XML 원문을 담지 않는다(CLAUDE.md §보안).
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function readApiResult<T>(
  res: Response,
  fallbackMessage = "요청 처리에 실패했습니다",
): Promise<T> {
  const body = (await res.json().catch(() => null)) as ApiResult<T> | null;
  if (body && body.ok === false) {
    throw new ApiError(body.error.code, body.error.message);
  }
  if (!body || body.ok !== true) {
    throw new ApiError("unknown", `${fallbackMessage} (HTTP ${res.status}).`);
  }
  return body.data;
}
