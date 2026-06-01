// 분석 내역 저장 — localStorage. 요약 지표(AnalysisSession)만 저장한다.
// 원본 XML·트랙 메타데이터는 저장하지 않는다(ADR-004). 결과 상세는 sessionStorage 핸드오프가 담당.
// 계층 규칙: service 계층, 도메인 타입만 의존(components import 금지).
import type { AnalysisSession } from "@/types/analysis";

const KEY = "crate-finder:history";
const MAX = 20; // 최근 N건만 유지(저장 최소화, PRD §6.9)

function read(): AnalysisSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AnalysisSession[]) : [];
  } catch {
    return [];
  }
}

function write(sessions: AnalysisSession[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(sessions));
  } catch {
    // 쿼터 등 저장 실패는 무시 — best-effort.
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // crypto.randomUUID 미지원 환경 폴백 — 같은 ms 충돌 방지용 무작위 접미사.
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export type NewSession = Omit<AnalysisSession, "id" | "createdAt">;

// 저장된 내역을 최신순(가장 최근 add가 앞)으로 반환한다.
export function listSessions(): AnalysisSession[] {
  return read();
}

export function addSession(input: NewSession): AnalysisSession {
  const session: AnalysisSession = {
    ...input,
    id: newId(),
    createdAt: new Date().toISOString(),
  };
  write([session, ...read()].slice(0, MAX));
  return session;
}

export function deleteSession(id: string): void {
  write(read().filter((s) => s.id !== id));
}

export function clearSessions(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}
