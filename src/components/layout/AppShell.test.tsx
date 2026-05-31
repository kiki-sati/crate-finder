import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "@/components/layout/AppShell";

describe("AppShell", () => {
  it("메뉴바 제목과 본문, 상태바를 렌더한다", () => {
    render(<AppShell statusText="Ready">body</AppShell>);
    expect(screen.getByText("Crate Finder")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });
});
