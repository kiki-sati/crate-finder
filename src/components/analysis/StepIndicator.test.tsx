import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepIndicator } from "@/components/analysis/StepIndicator";

describe("StepIndicator", () => {
  it("세 단계를 렌더한다", () => {
    render(<StepIndicator current={1} />);
    expect(screen.getByText(/플레이리스트/)).toBeInTheDocument();
    expect(screen.getByText(/XML 업로드/)).toBeInTheDocument();
    expect(screen.getByText(/분석/)).toBeInTheDocument();
  });

  it("현재 단계에 aria-current=step을 부여한다", () => {
    render(<StepIndicator current={2} />);
    expect(screen.getByText(/XML 업로드/)).toHaveAttribute(
      "aria-current",
      "step",
    );
  });
});
