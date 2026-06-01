import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopMenuBar } from "@/components/layout/TopMenuBar";

describe("TopMenuBar", () => {
  it("New Analysis와 History 내비 링크를 제공한다", () => {
    render(<TopMenuBar />);
    expect(
      screen.getByRole("link", { name: /new analysis/i }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /history/i })).toHaveAttribute(
      "href",
      "/history",
    );
  });
});
