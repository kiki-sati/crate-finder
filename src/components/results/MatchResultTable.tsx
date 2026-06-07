"use client";
import { Fragment, useState } from "react";
import type { MatchRow } from "@/components/results/match-row";
import { StatusBadge } from "@/components/results/StatusBadge";
import { ConfidenceBadge } from "@/components/results/ConfidenceBadge";
import { PriceComparePanel } from "@/components/price/PriceComparePanel";

const HEADERS = ["#", "Track", "Artist", "Status", "Confidence", "Matched", "Action"];

export function MatchResultTable({ rows }: { rows: MatchRow[] }) {
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
          const expanded = expandedId === row.result.id;
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
                      onClick={() =>
                        setExpandedId(expanded ? null : row.result.id)
                      }
                      className="text-xs underline"
                    >
                      {expanded ? "닫기" : "구매"}
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
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
