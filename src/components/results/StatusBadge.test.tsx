import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/results/StatusBadge";
import { ConfidenceBadge } from "@/components/results/ConfidenceBadge";

describe("StatusBadge", () => {
  it("owned 라벨과 색 클래스를 렌더한다", () => {
    render(<StatusBadge status="owned" />);
    const el = screen.getByText("Owned");
    expect(el).toBeInTheDocument();
    expect(el.className).toMatch(/owned/);
  });
  it("needs_review는 'Needs Review'로 표시한다", () => {
    render(<StatusBadge status="needs_review" />);
    expect(screen.getByText("Needs Review")).toBeInTheDocument();
  });
});

describe("ConfidenceBadge", () => {
  it("confidence 라벨을 렌더한다", () => {
    render(<ConfidenceBadge confidence="high" />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});
