"use client";
import { Button } from "@/components/ui/Button";

export type ResultFilter = "all" | "owned" | "missing" | "needs_review";
const FILTERS: { key: ResultFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "owned", label: "Owned" },
  { key: "missing", label: "Missing" },
  { key: "needs_review", label: "Needs Review" },
];

export function ResultFilters({
  value,
  onChange,
}: {
  value: ResultFilter;
  onChange: (f: ResultFilter) => void;
}) {
  return (
    <div className="flex gap-2">
      {FILTERS.map((f) => (
        <Button
          key={f.key}
          variant={value === f.key ? "primary" : "secondary"}
          aria-pressed={value === f.key}
          onClick={() => onChange(f.key)}
        >
          {f.label}
        </Button>
      ))}
    </div>
  );
}
