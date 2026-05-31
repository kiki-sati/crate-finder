"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { WindowPanel } from "@/components/ui/WindowPanel";
import { MatchResultTable } from "@/components/results/MatchResultTable";
import { loadMatchRows } from "@/app/results/loader";
import type { MatchRow } from "@/components/results/match-row";

export default function ResultsPage() {
  // sessionStorage는 SSR에서 읽으면 hydration mismatch → mount 후 useEffect에서 채운다.
  // 초기값을 []가 아닌 null로 두는 이유: 데이터가 있는 사용자에게 mount 직전
  // "결과 없음"을 깜빡여 보여주지 않도록 미로드(null) 상태를 명시적으로 구분한다.
  const [rows, setRows] = useState<MatchRow[] | null>(null);

  useEffect(() => {
    setRows(loadMatchRows());
  }, []);

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
            <p className="text-sm">
              분석 결과가 없습니다. 분석을 먼저 실행하세요.
            </p>
            <Link href="/" className="text-sm underline">
              <span aria-hidden="true">←</span> 새 분석 시작
            </Link>
          </div>
        </WindowPanel>
      </AppShell>
    );
  }

  return (
    <AppShell statusText={`${rows.length} tracks analyzed`}>
      <WindowPanel title="Match Results">
        <MatchResultTable rows={rows} />
      </WindowPanel>
    </AppShell>
  );
}
