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
import { buildMatchRows } from "@/app/results/loader";
import {
  readAnalysis,
  saveAnalysis,
  type AnalysisHandoff,
} from "@/services/analysis-handoff";
import { saveManualDecision } from "@/services/manual-match-rules";
import { resolveMatch, type ResolveDecision } from "@/lib/matcher/resolve";
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
  // 단일 진실원본은 전체 핸드오프. rows는 여기서 파생(useMemo).
  // sessionStorage는 SSR에서 읽으면 hydration mismatch → mount 후 useEffect에서 채운다.
  // loaded 플래그로 미로드 상태를 명시 구분: 데이터가 있는 사용자에게 mount 직전
  // "결과 없음"을 깜빡여 보여주지 않는다(기존 rows===null 의도 보존).
  const [analysis, setAnalysis] = useState<AnalysisHandoff | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<ResultFilter>("all");

  useEffect(() => {
    setAnalysis(readAnalysis());
    setLoaded(true);
  }, []);

  const rows = useMemo(
    () => (analysis ? buildMatchRows(analysis) : []),
    [analysis],
  );

  // resultId → 해당 YouTube 트랙의 videoId(현재 analysis 클로저 기준).
  // 결정 영속화는 videoId(전역 고유) 기준이므로 매칭 변환 전에 미리 조회한다.
  function videoIdFor(resultId: string): string | undefined {
    if (!analysis) return undefined;
    const result = analysis.results.find((r) => r.id === resultId);
    if (!result) return undefined;
    return analysis.youtubeTracks.find((t) => t.id === result.youtubeTrackId)
      ?.videoId;
  }

  // 결정을 같은 곡 재분석 시 자동 재적용하도록 영속화한다.
  // side-effect는 setAnalysis updater(StrictMode 이중호출) 밖에서 1회만 호출.
  function persistDecision(resultId: string, decision: ResolveDecision) {
    const videoId = videoIdFor(resultId);
    if (videoId) saveManualDecision(videoId, decision);
  }

  // 후보 확정: 매칭 변환(resolveMatch)은 페이지에서 호출(계층 규칙) 후 저장.
  function handleConfirm(resultId: string, rekordboxTrackId: string) {
    persistDecision(resultId, { kind: "confirm", rekordboxTrackId });
    setAnalysis((prev) => {
      if (!prev) return prev;
      const results = prev.results.map((r) =>
        r.id === resultId
          ? resolveMatch(r, { kind: "confirm", rekordboxTrackId })
          : r,
      );
      const next = { ...prev, results };
      saveAnalysis(next);
      return next;
    });
  }

  // 후보 거부: 누락으로 표시.
  function handleReject(resultId: string) {
    persistDecision(resultId, { kind: "reject" });
    setAnalysis((prev) => {
      if (!prev) return prev;
      const results = prev.results.map((r) =>
        r.id === resultId ? resolveMatch(r, { kind: "reject" }) : r,
      );
      const next = { ...prev, results };
      saveAnalysis(next);
      return next;
    });
  }

  // 요약은 필터와 무관하게 항상 전체 기준(PRD §4.1.4).
  const summary = useMemo(() => summarize(rows), [rows]);
  const visible = useMemo(
    () =>
      filter !== "all"
        ? rows.filter((r) => r.result.status === filter)
        : rows,
    [rows, filter],
  );

  if (!loaded) {
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
    <AppShell statusText={`${summary.total} tracks analyzed`}>
      <WindowPanel title="Match Results">
        <div className="flex flex-col gap-3 p-2">
          <p
            data-testid="result-summary"
            className="text-xs text-[color:var(--color-text-secondary)]"
          >
            전체 {summary.total} · 보유 {summary.owned} · 미보유 {summary.missing} ·
            확인필요 {summary.needs_review}
          </p>
          <ResultFilters value={filter} onChange={setFilter} />
        </div>
        <MatchResultTable
          rows={visible}
          onConfirm={handleConfirm}
          onReject={handleReject}
        />
      </WindowPanel>
    </AppShell>
  );
}
