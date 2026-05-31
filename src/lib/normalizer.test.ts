import { describe, it, expect } from "vitest";

import { normalizeString, normalizeTitle } from "@/lib/normalizer";

describe("normalizeString", () => {
  it("앞뒤 공백을 제거하고 소문자로 변환한다", () => {
    expect(normalizeString("  Hello World  ")).toBe("hello world");
  });

  it("유니코드 호환 문자를 NFKC로 정규화한다", () => {
    // 전각 영문 → 반각
    expect(normalizeString("Ｒｅｍｉｘ")).toBe("remix");
  });

  it("다양한 특수 대시를 하이픈으로 통일한다", () => {
    // en dash, em dash, horizontal bar
    expect(normalizeString("artist – title")).toBe("artist - title");
    expect(normalizeString("a — b ― c")).toBe("a - b - c");
  });

  it("대괄호/중괄호를 소괄호로 통일하고 내용은 보존한다", () => {
    expect(normalizeString("track [extended mix]")).toBe("track (extended mix)");
    expect(normalizeString("track {original}")).toBe("track (original)");
  });

  it("연속 공백/탭을 한 칸으로 정리한다", () => {
    expect(normalizeString("a   b\t c")).toBe("a b c");
  });
});

describe("normalizeTitle", () => {
  it("feat./ft./featuring 절을 비교 대상에서 제거한다", () => {
    expect(normalizeTitle("Song (feat. Artist B)")).toBe("song");
    expect(normalizeTitle("Song ft Artist B")).toBe("song");
    expect(normalizeTitle("Song featuring Artist B")).toBe("song");
  });

  it("Remix/Extended 등 버전 괄호는 보존한다", () => {
    expect(normalizeTitle("Song (Extended Mix)")).toBe("song (extended mix)");
  });

  it("feat 절을 제거하되 뒤따르는 버전 괄호는 보존한다", () => {
    expect(normalizeTitle("Song feat. A & B (Extended Mix)")).toBe(
      "song (extended mix)",
    );
  });
});
