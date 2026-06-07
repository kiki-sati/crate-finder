import { describe, it, expect } from "vitest";
import { diceCoefficient } from "@/lib/matcher/similarity";

describe("diceCoefficient", () => {
  it("동일 문자열은 1을 반환한다", () => {
    expect(diceCoefficient("strobe", "strobe")).toBe(1);
  });

  it("완전히 다른 문자열은 0을 반환한다", () => {
    expect(diceCoefficient("abc", "xyz")).toBe(0);
  });

  it("한 글자 이하 비교는 동일하면 1, 다르면 0", () => {
    expect(diceCoefficient("a", "a")).toBe(1);
    expect(diceCoefficient("a", "b")).toBe(0);
    expect(diceCoefficient("", "")).toBe(1);
  });

  it("오타가 하나 있으면 0.8 이상의 높은 유사도", () => {
    // "strobe"(st,tr,ro,ob,be) vs "strob"(st,tr,ro,ob) → 2*4/(5+4)=0.888
    expect(diceCoefficient("strobe", "strob")).toBeGreaterThan(0.8);
  });

  it("대칭이다: dice(a,b) === dice(b,a)", () => {
    expect(diceCoefficient("night", "nacht")).toBe(
      diceCoefficient("nacht", "night"),
    );
  });
});
