const STEPS = ["플레이리스트", "XML 업로드", "분석"] as const;

export function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap gap-2 text-xs" aria-label="진행 단계">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className={`border-2 border-strong px-2 py-1 ${
              active ? "bg-accent text-white" : "bg-panel"
            }`}
          >
            {step}. {label}
          </li>
        );
      })}
    </ol>
  );
}
