// ApiResult 봉투를 언랩하는 공유 헬퍼. analysis.service / price.service가 공통 사용.
import type { ApiResult } from "@/types/api";

export async function readApiResult<T>(
  res: Response,
  fallbackMessage = "요청 처리에 실패했습니다",
): Promise<T> {
  const body = (await res.json().catch(() => null)) as ApiResult<T> | null;
  if (body && body.ok === false) throw new Error(body.error.message);
  if (!body || body.ok !== true) {
    throw new Error(`${fallbackMessage} (HTTP ${res.status}).`);
  }
  return body.data;
}
