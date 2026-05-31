import type { MatchConfidence } from "@/types/track";

const LABEL: Record<MatchConfidence, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function ConfidenceBadge({ confidence }: { confidence: MatchConfidence }) {
  return (
    <span className="inline-block px-2 py-0.5 text-xs text-[color:var(--color-text-secondary)]">
      {LABEL[confidence]}
    </span>
  );
}
