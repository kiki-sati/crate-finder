import { Button } from "@/components/ui/Button";
import type { MatchCandidate } from "@/types/match";
import type { RekordboxTrack } from "@/types/track";

const REASON_LABEL: Record<MatchCandidate["reason"], string> = {
  exact: "정확 일치",
  similar_title_artist: "제목·아티스트 유사",
  similar_title: "제목 유사",
  manual: "수동 확정",
};

export type CandidateReviewPanelProps = {
  /** 이미 score 내림차순 정렬되어 들어온다. 받은 순서대로 렌더. */
  candidates: MatchCandidate[];
  /** rekordboxTrackId -> RekordboxTrack 조회용 */
  tracksById: Record<string, RekordboxTrack>;
  onConfirm: (rekordboxTrackId: string) => void;
  onReject: () => void;
};

function trackLabel(
  candidate: MatchCandidate,
  tracksById: Record<string, RekordboxTrack>,
): string {
  const track = tracksById[candidate.rekordboxTrackId];
  if (!track) return candidate.rekordboxTrackId || "—";
  return track.artist ? `${track.title} — ${track.artist}` : track.title;
}

export function CandidateReviewPanel({
  candidates,
  tracksById,
  onConfirm,
  onReject,
}: CandidateReviewPanelProps) {
  const rejectButton = (
    <Button variant="secondary" onClick={onReject}>
      누락으로 표시
    </Button>
  );

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 p-3">
        <p className="text-xs text-[color:var(--color-text-muted)]">
          후보 없음 — 누락으로 표시
        </p>
        {rejectButton}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      <ul className="flex flex-col gap-1">
        {candidates.map((c, i) => (
          <li
            key={`${c.rekordboxTrackId}-${i}`}
            className="flex items-center gap-3 border-b border-[color:var(--color-border-soft)] py-1 text-sm last:border-b-0"
          >
            <span data-testid="candidate-title" className="flex-1">
              {trackLabel(c, tracksById)}
            </span>
            <span className="text-xs font-semibold text-[color:var(--color-text-secondary)]">
              {Math.round(c.score * 100)}%
            </span>
            <span className="text-xs text-[color:var(--color-text-muted)]">
              {REASON_LABEL[c.reason]}
            </span>
            <Button
              variant="primary"
              onClick={() => onConfirm(c.rekordboxTrackId)}
            >
              이 곡으로 확정
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex">{rejectButton}</div>
    </div>
  );
}
