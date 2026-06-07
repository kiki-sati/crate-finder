import { describe, it, expect } from "vitest";

import {
  buildMatchKey,
  normalizeArtist,
  normalizeString,
  normalizeTitle,
} from "@/lib/normalizer";

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

  describe("선행 트랙번호 제거 (Rekordbox 곡명)", () => {
    it("'숫자. ' 선행 트랙번호를 제거한다", () => {
      expect(normalizeTitle("3. KISSES")).toBe("kisses");
      expect(normalizeTitle("04. Track Name")).toBe("track name");
    });

    it("'숫자) ' 선행 트랙번호를 제거한다", () => {
      expect(normalizeTitle("3) Title")).toBe("title");
    });

    it("실데이터: 선행 트랙번호 제거와 기존 동작이 공존한다", () => {
      // 트랙번호 제거 + feat(=prod) 류 괄호 보존 동작 확인
      expect(normalizeTitle("3. KISSES (prod. by B.Bravo)")).toBe(
        "kisses (prod. by b.bravo)",
      );
    });

    it("선행 트랙번호 제거 후 feat 절도 함께 제거한다", () => {
      expect(normalizeTitle("12. Song (feat. Artist B)")).toBe("song");
    });

    // 제거하면 안 되는 케이스
    it("숫자 뒤 구분자 없이 단어면 제거하지 않는다", () => {
      expect(normalizeTitle("3 is the magic number")).toBe(
        "3 is the magic number",
      );
    });

    it("맨 앞이 아닌 숫자는 제거하지 않는다", () => {
      expect(normalizeTitle("track 3")).toBe("track 3");
    });

    it("구분자/공백 없는 숫자만(404)은 제거하지 않는다", () => {
      expect(normalizeTitle("404")).toBe("404");
    });

    it("3자리 초과 선행 숫자는 트랙번호로 보지 않는다", () => {
      expect(normalizeTitle("1234. Song")).toBe("1234. song");
    });

    it("제거하면 빈/숫자만 남는 경우는 원본을 유지한다(정보 손실 방지)", () => {
      expect(normalizeTitle("3.")).toBe("3.");
      expect(normalizeTitle("04) ")).toBe("04)");
    });
  });
});

describe("normalizeArtist", () => {
  it("undefined/공백 문자열은 undefined를 반환한다", () => {
    expect(normalizeArtist(undefined)).toBeUndefined();
    expect(normalizeArtist("   ")).toBeUndefined();
  });

  it("feat 절을 제거하고 정규화한다", () => {
    expect(normalizeArtist("Artist A feat. B")).toBe("artist a");
  });
});

describe("buildMatchKey", () => {
  it("정규화된 아티스트와 곡명을 결합한다", () => {
    expect(buildMatchKey("Artist A", "Song (Extended Mix)")).toBe(
      "artist a|song (extended mix)",
    );
  });

  it("아티스트가 없으면 빈 아티스트 + 곡명으로 key를 만든다", () => {
    expect(buildMatchKey(undefined, "Song")).toBe("|song");
  });
});
