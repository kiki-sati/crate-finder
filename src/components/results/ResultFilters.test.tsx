import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultFilters } from "@/components/results/ResultFilters";

describe("ResultFilters", () => {
  it("필터 버튼 클릭 시 onChange로 해당 값을 전달한다", async () => {
    const onChange = vi.fn();
    render(<ResultFilters value="all" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /missing/i }));
    expect(onChange).toHaveBeenCalledWith("missing");
  });
});
