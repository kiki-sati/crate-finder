"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { WindowPanel } from "@/components/ui/WindowPanel";
import { MatchResultTable } from "@/components/results/MatchResultTable";
import {
  ResultFilters,
  type ResultFilter,
} from "@/components/results/ResultFilters";
import { loadMatchRows } from "@/app/results/loader";
import type { MatchRow } from "@/components/results/match-row";

function summarize(rows: MatchRow[]) {
  return {
    total: rows.length,
    owned: rows.filter((r) => r.result.status === "owned").length,
    missing: rows.filter((r) => r.result.status === "missing").length,
    needs_review: rows.filter((r) => r.result.status === "needs_review").length,
  };
}

export default function ResultsPage() {
  // sessionStorage는 SSR에서 읽으면 hydration mismatch → mount 후 useEffect에서 채운다.
  // 초기값을 []가 아닌 null로 두는 이유: 데이터가 있는 사용자에게 mount 직전
  // "결과 없음"을 깜빡여 보여주지 않도록 미로드(null) 상태를 명시적으로 구분한다.
  const [rows, setRows] = useState<MatchRow[] | null>(null);
  const [filter, setFilter] = useState<ResultFilter>("all");

  useEffect(() => {
    setRows(loadMatchRows());
  }, []);

  // 요약은 필터와 무관하게 항상 전체 기준(PRD §4.1.4).
  const summary = useMemo(() => (rows ? summarize(rows) : null), [rows]);
  const visible = useMemo(
    () =>
      rows && filter !== "all"
        ? rows.filter((r) => r.result.status === filter)
        : (rows ?? []),
    [rows, filter],
  );

  if (rows === null) {
    return (
      <AppShell statusText="결과 불러오는 중…">
        <WindowPanel title="Match Results">
          <p className="p-4 text-sm text-[color:var(--color-text-muted)]">
            불러오는 중…
          </p>
        </WindowPanel>
      </AppShell>
    );
  }

  if (rows.length === 0) {
    return (
      <AppShell statusText="결과 없음">
        <WindowPanel title="Match Results">
          <div className="flex flex-col items-start gap-3 p-4">
            <p className="text-sm">분석 결과가 없습니다. 분석을 먼저 실행하세요.</p>
            <Link href="/" className="text-sm underline">
              <span aria-hidden="true">←</span> 새 분석 시작
            </Link>
          </div>
        </WindowPanel>
      </AppShell>
    );
  }

  return (
    <AppShell statusText={`${summary!.total} tracks analyzed`}>
      <WindowPanel title="Match Results">
        <div className="flex flex-col gap-3 p-2">
          <p
            data-testid="result-summary"
            className="text-xs text-[color:var(--color-text-secondary)]"
          >
            전체 {summary!.total} · 보유 {summary!.owned} · 누락 {summary!.missing} ·
            확인필요 {summary!.needs_review}
          </p>
          <ResultFilters value={filter} onChange={setFilter} />
        </div>
        <MatchResultTable rows={visible} />
      </WindowPanel>
    </AppShell>
  );
}
