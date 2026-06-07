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

  // 입력 강건성(Phase 6): 검색 질의 길이를 제한해 링크 위생을 유지한다.
  it("질의가 최대 길이를 넘으면 잘라낸다", () => {
    const longTitle = "a".repeat(500);
    const result = buildQuery({ title: longTitle });
    expect(result.length).toBeLessThanOrEqual(200);
  });

  it("길이 제한으로 잘라도 끝에 공백이 남지 않는다", () => {
    const title = "word ".repeat(100); // 단어+공백 반복
    const result = buildQuery({ title });
    expect(result).toBe(result.trimEnd());
  });
});
