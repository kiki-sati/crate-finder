"use client";
import { Fragment, useState } from "react";
import type { MatchRow } from "@/components/results/match-row";
import { StatusBadge } from "@/components/results/StatusBadge";
import { ConfidenceBadge } from "@/components/results/ConfidenceBadge";
import { PriceComparePanel } from "@/components/price/PriceComparePanel";
import { CandidateReviewPanel } from "@/components/results/CandidateReviewPanel";

const HEADERS = ["#", "Track", "Artist", "Status", "Confidence", "Matched", "Action"];

// onConfirm/onReject는 옵셔널 — needs_review 후보 확정/거부를 상위로 올린다.
// 컴포넌트는 resolveMatch 등 매칭 로직을 직접 호출하지 않는다(콜백만 위임).
type MatchResultTableProps = {
  rows: MatchRow[];
  onConfirm?: (resultId: string, rekordboxTrackId: string) => void;
  onReject?: (resultId: string) => void;
};

export function MatchResultTable({
  rows,
  onConfirm,
  onReject,
}: MatchResultTableProps) {
  // missing(가격) / needs_review(후보) 공용: 한 번에 하나의 행만 펼친다.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="p-4 text-sm text-[color:var(--color-text-muted)]">No results</p>
    );
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b-2 border-strong text-left">
          {HEADERS.map((h) => (
            <th key={h} className="px-2 py-1 font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const yt = row.youtubeTrack;
          const title = yt.parsedTitle ?? yt.rawTitle;
          const isMissing = row.result.status === "missing";
          const isNeedsReview = row.result.status === "needs_review";
          const expanded = expandedId === row.result.id;
          const toggle = () =>
            setExpandedId(expanded ? null : row.result.id);
          return (
            <Fragment key={row.result.id}>
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="px-2 py-1">{i + 1}</td>
                <td className="px-2 py-1">{title}</td>
                <td className="px-2 py-1">{yt.parsedArtist ?? "—"}</td>
                <td className="px-2 py-1">
                  <StatusBadge status={row.result.status} />
                </td>
                <td className="px-2 py-1">
                  <ConfidenceBadge confidence={row.result.confidence} />
                </td>
                <td className="px-2 py-1">
                  {row.matchedTrack
                    ? `${row.matchedTrack.title}${
                        row.matchedTrack.artist
                          ? ` — ${row.matchedTrack.artist}`
                          : ""
                      }`
                    : "—"}
                </td>
                <td className="px-2 py-1">
                  {isMissing && (
                    <button
                      type="button"
                      onClick={toggle}
                      className="text-xs underline"
                    >
                      {expanded ? "닫기" : "구매"}
                    </button>
                  )}
                  {isNeedsReview && (
                    <button
                      type="button"
                      onClick={toggle}
                      className="text-xs underline"
                    >
                      {expanded ? "닫기" : "확인"}
                    </button>
                  )}
                </td>
              </tr>
              {isMissing && expanded && (
                <tr>
                  <td
                    colSpan={HEADERS.length}
                    className="bg-[color:var(--color-app-bg)] p-0"
                  >
                    <PriceComparePanel title={title} artist={yt.parsedArtist} />
                  </td>
                </tr>
              )}
              {isNeedsReview && expanded && (
                <tr>
                  <td
                    colSpan={HEADERS.length}
                    className="bg-[color:var(--color-app-bg)] p-0"
                  >
                    <CandidateReviewPanel
                      candidates={row.result.candidates}
                      tracksById={row.candidateTracks ?? {}}
                      onConfirm={(rbId) => onConfirm?.(row.result.id, rbId)}
                      onReject={() => onReject?.(row.result.id)}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
