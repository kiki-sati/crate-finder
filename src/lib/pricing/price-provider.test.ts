import { describe, it, expect } from "vitest";
import { buildQuery } from "@/lib/pricing/price-provider";

describe("buildQuery", () => {
  it("artist가 있으면 'artist title'을 소문자로 만든다", () => {
    expect(buildQuery({ title: "One More Time", artist: "Daft Punk" })).toBe(
      "daft punk one more time",
    );
  });
  it("artist가 없으면 title만 사용한다", () => {
    expect(buildQuery({ title: "One More Time" })).toBe("one more time");
  });
  it("공백을 단일화하고 trim한다", () => {
    expect(
      buildQuery({ title: "  One   More  Time ", artist: " Daft Punk " }),
    ).toBe("daft punk one more time");
  });
  it("빈 artist 문자열은 없는 것으로 취급한다", () => {
    expect(buildQuery({ title: "One More Time", artist: "   " })).toBe(
      "one more time",
    );
  });
});
