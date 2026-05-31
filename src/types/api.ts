// API 요청/응답 공통 래퍼 (초안) — 실제 형태는 각 라우트 구현 시 확정.
// 참고: docs/ARCHITECTURE.md §7 API 설계

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: { code: string; message: string } };
export type ApiResult<T> = ApiOk<T> | ApiErr;
