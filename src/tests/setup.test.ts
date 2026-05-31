import { describe, it, expect } from "vitest";

describe("test environment", () => {
  it("vitest가 동작한다", () => {
    expect(1 + 1).toBe(2);
  });
  it("jsdom DOM API를 쓸 수 있다", () => {
    const el = document.createElement("div");
    el.textContent = "crate-finder";
    expect(el.textContent).toBe("crate-finder");
  });
});
