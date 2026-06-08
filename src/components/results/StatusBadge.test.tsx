import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/results/StatusBadge";
import { ConfidenceBadge } from "@/components/results/ConfidenceBadge";

describe("StatusBadge", () => {
  it("owned 라벨과 색 클래스를 렌더한다", () => {
    render(<StatusBadge status="owned" />);
    const el = screen.getByText("보유");
    expect(el).toBeInTheDocument();
    expect(el.className).toMatch(/owned/);
  });
  it("needs_review는 '확인필요'로 표시한다", () => {
    render(<StatusBadge status="needs_review" />);
    expect(screen.getByText("확인필요")).toBeInTheDocument();
  });
});

describe("ConfidenceBadge", () => {
  it("confidence 라벨을 렌더한다", () => {
    render(<ConfidenceBadge confidence="high" />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});
