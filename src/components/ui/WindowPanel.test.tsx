import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WindowPanel } from "@/components/ui/WindowPanel";

describe("WindowPanel", () => {
  it("제목과 자식을 렌더한다", () => {
    render(
      <WindowPanel title="Playlist">
        <p>inner</p>
      </WindowPanel>,
    );
    expect(screen.getByText("Playlist")).toBeInTheDocument();
    expect(screen.getByText("inner")).toBeInTheDocument();
  });
});
