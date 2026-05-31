import type { MatchRow } from "@/components/results/match-row";
import { StatusBadge } from "@/components/results/StatusBadge";
import { ConfidenceBadge } from "@/components/results/ConfidenceBadge";

const HEADERS = ["#", "Track", "Artist", "Status", "Confidence", "Matched", "Action"];

export function MatchResultTable({ rows }: { rows: MatchRow[] }) {
  if (rows.length === 0) {
    return <p className="p-4 text-sm text-[color:var(--color-text-muted)]">No results</p>;
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
          return (
            <tr key={row.result.id} className="border-b border-[color:var(--color-border-soft)]">
              <td className="px-2 py-1">{i + 1}</td>
              <td className="px-2 py-1">{yt.parsedTitle ?? yt.rawTitle}</td>
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
                      row.matchedTrack.artist ? ` — ${row.matchedTrack.artist}` : ""
                    }`
                  : "—"}
              </td>
              <td className="px-2 py-1" />
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
