"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { WindowPanel } from "@/components/ui/WindowPanel";
import { Button } from "@/components/ui/Button";
import {
  listSessions,
  deleteSession,
  clearSessions,
} from "@/services/analysis-history";
import { setRerunUrl } from "@/services/rerun-handoff";
import type { AnalysisSession } from "@/types/analysis";

function formatDate(iso: string): string {
  // 로컬 표기. 파싱 실패 시 원문 유지.
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function HistoryPage() {
  const router = useRouter();
  // localStorage는 SSR에서 읽으면 hydration mismatch → mount 후 useEffect에서 채운다.
  const [sessions, setSessions] = useState<AnalysisSession[] | null>(null);

  useEffect(() => {
    setSessions(listSessions());
  }, []);

  function handleDelete(id: string) {
    if (!window.confirm("이 분석 내역을 삭제할까요? 되돌릴 수 없습니다.")) return;
    deleteSession(id);
    setSessions(listSessions());
  }

  function handleClear() {
    if (!window.confirm("모든 분석 내역을 삭제할까요? 되돌릴 수 없습니다.")) return;
    clearSessions();
    setSessions([]);
  }

  function handleRerun(url: string) {
    setRerunUrl(url);
    router.push("/");
  }

  if (sessions === null) {
    return (
      <AppShell statusText="내역 불러오는 중…">
        <WindowPanel title="Analysis History">
          <p className="p-4 text-sm text-[color:var(--color-text-muted)]">
            불러오는 중…
          </p>
        </WindowPanel>
      </AppShell>
    );
  }

  if (sessions.length === 0) {
    return (
      <AppShell statusText="내역 없음">
        <WindowPanel title="Analysis History">
          <div className="flex flex-col items-start gap-3 p-4">
            <p className="text-sm">분석 내역이 없습니다.</p>
            <Link href="/" className="text-sm underline">
              <span aria-hidden="true">→</span> 새 분석 시작
            </Link>
          </div>
        </WindowPanel>
      </AppShell>
    );
  }

  return (
    <AppShell statusText={`${sessions.length}개 내역`}>
      <WindowPanel title="Analysis History">
        <div className="flex items-center justify-between gap-2 p-2">
          <p className="text-xs text-[color:var(--color-text-muted)]">
            최근 분석 {sessions.length}건 (이 브라우저에만 저장됨)
          </p>
          <Button type="button" variant="danger" onClick={handleClear}>
            전체 삭제
          </Button>
        </div>
        <ul className="flex flex-col">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[color:var(--color-border-soft)] px-2 py-2 text-sm"
            >
              <span className="text-xs text-[color:var(--color-text-muted)]">
                {formatDate(s.createdAt)}
              </span>
              <span className="min-w-0 flex-1 truncate" title={s.playlistUrl}>
                {s.playlistUrl}
              </span>
              <span className="text-xs">
                {`전체 ${s.totalTrackCount} · 보유 ${s.ownedCount} · 누락 ${s.missingCount} · 확인필요 ${s.reviewCount}`}
              </span>
              <span className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleRerun(s.playlistUrl)}
                >
                  다시 분석
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => handleDelete(s.id)}
                >
                  삭제
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </WindowPanel>
    </AppShell>
  );
}
