"use client";
import { Button } from "@/components/ui/Button";

export type ResultFilter = "all" | "owned" | "missing" | "needs_review";
const FILTERS: { key: ResultFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "owned", label: "보유" },
  { key: "missing", label: "미보유" },
  { key: "needs_review", label: "확인필요" },
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
