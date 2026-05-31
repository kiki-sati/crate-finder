import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("라벨을 렌더하고 클릭 시 onClick을 호출한다", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Run</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Run" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
  it("variant=danger 클래스를 적용한다", () => {
    render(<Button variant="danger">Del</Button>);
    expect(screen.getByRole("button", { name: "Del" }).className).toMatch(/danger/);
  });
});
