// "다시 분석" 전달 — /history → / 간 sessionStorage 1회 소비(consume-once) URL.
// URL 외 데이터 없음. 계층 규칙: service 계층, components import 금지.

const KEY = "crate-finder:rerun-url";

export function setRerunUrl(url: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, url);
  } catch {
    // 무시 — best-effort.
  }
}

// 저장된 rerun URL을 반환하고 즉시 제거한다(한 번만 프리필되도록).
export function takeRerunUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const url = window.sessionStorage.getItem(KEY);
    if (url) window.sessionStorage.removeItem(KEY);
    return url;
  } catch {
    return null;
  }
}
