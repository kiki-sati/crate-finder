import { describe, it, expect } from "vitest";
import {
  diceCoefficient,
  prepareGrams,
  diceFromPrepared,
} from "@/lib/matcher/similarity";

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

describe("diceFromPrepared (사전계산 등가성)", () => {
  // 다양한 입력에서 diceFromPrepared가 diceCoefficient와 비트 동일한 값을 반환.
  const cases: Array<[string, string]> = [
    ["strobe", "strobe"], // 동일 문자열
    ["abc", "xyz"], // 완전 불일치
    ["a", "a"], // 한 글자 동일
    ["a", "b"], // 한 글자 다름
    ["", ""], // 빈 문자열 동일
    ["", "abc"], // 한쪽만 빈 문자열
    ["abc", ""], // 반대쪽 빈 문자열
    ["a", "abcdef"], // 한쪽만 1글자
    ["strobe", "strob"], // 오타 하나
    ["night", "nacht"], // 부분 일치
    ["nacht", "night"], // 대칭 확인
    ["aaaa", "aaa"], // 중복 bigram (aa 반복)
    ["banana", "ananab"], // 중복 bigram 다수
    ["strobe (eric prydz remix)", "strobe"], // 길이 비대칭 + 공백
    ["deadmau5", "deadmau5"], // 숫자 포함 동일
    ["aabbaabb", "abab"], // 중복 패턴
  ];

  it.each(cases)(
    "diceFromPrepared(%o, %o) === diceCoefficient",
    (a, b) => {
      const pa = prepareGrams(a);
      const pb = prepareGrams(b);
      expect(diceFromPrepared(pa, pb, a, b)).toBe(diceCoefficient(a, b));
    },
  );

  it("사전계산 Map은 비교 후에도 변형되지 않는다(공유 재사용 안전)", () => {
    const a = "aaaa"; // {aa:3}
    const b = "aaa"; // {aa:2}
    const pa = prepareGrams(a);
    const pb = prepareGrams(b);

    const snapshotA = new Map(pa.counts);
    const snapshotB = new Map(pb.counts);

    // 동일 prepared를 여러 번 비교에 재사용
    const first = diceFromPrepared(pa, pb, a, b);
    const second = diceFromPrepared(pa, pb, a, b);
    const reverse = diceFromPrepared(pb, pa, b, a);

    // 값이 안정적이고 대칭
    expect(second).toBe(first);
    expect(reverse).toBe(first);

    // counts Map이 그대로 보존되어야 함
    expect([...pa.counts.entries()]).toEqual([...snapshotA.entries()]);
    expect([...pb.counts.entries()]).toEqual([...snapshotB.entries()]);
  });

  it("하나의 prepared를 여러 상대와 비교해도 매번 diceCoefficient와 동일", () => {
    const query = prepareGrams("strobe");
    const targets = ["strobe", "strob", "probe", "xyz", "", "s"];
    for (const t of targets) {
      const pt = prepareGrams(t);
      expect(diceFromPrepared(query, pt, "strobe", t)).toBe(
        diceCoefficient("strobe", t),
      );
    }
  });

  it("prepareGrams.size 는 총 bigram 수(중복 포함)다", () => {
    expect(prepareGrams("aaaa").size).toBe(3); // aa,aa,aa
    expect(prepareGrams("abc").size).toBe(2); // ab,bc
    expect(prepareGrams("a").size).toBe(0); // 2글자 미만
    expect(prepareGrams("").size).toBe(0);
  });
});
