import type { TrackStatus } from "@/types/track";

const MAP: Record<TrackStatus, { label: string; cls: string }> = {
  owned: { label: "Owned", cls: "text-owned bg-owned-bg owned" },
  missing: { label: "Missing", cls: "text-missing bg-missing-bg missing" },
  needs_review: { label: "Needs Review", cls: "text-review bg-review-bg review" },
};

export function StatusBadge({ status }: { status: TrackStatus }) {
  const { label, cls } = MAP[status];
  return (
    <span className={`inline-block border border-strong px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
