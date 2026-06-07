import { describe, it, expect } from "vitest";
import { parseVideoTitle } from "@/lib/youtube/parse-video-title";

describe("parseVideoTitle", () => {
  it("'Artist - Title (Official Video)'에서 아티스트/곡명을 추출하고 노이즈를 제거한다", () => {
    expect(parseVideoTitle("Daft Punk - One More Time (Official Video)")).toEqual({
      parsedArtist: "Daft Punk",
      parsedTitle: "One More Time",
      parseStatus: "parsed",
    });
  });
  it("en dash 구분자도 처리한다", () => {
    expect(parseVideoTitle("Daft Punk – One More Time")).toEqual({
      parsedArtist: "Daft Punk",
      parsedTitle: "One More Time",
      parseStatus: "parsed",
    });
  });
  it("feat 절은 아티스트 원문에 보존한다(정규화는 매칭 단계 책임)", () => {
    expect(
      parseVideoTitle("Daft Punk feat. Romanthony - One More Time"),
    ).toEqual({
      parsedArtist: "Daft Punk feat. Romanthony",
      parsedTitle: "One More Time",
      parseStatus: "parsed",
    });
  });
  it("버전 괄호(Extended Mix)는 곡명에 보존한다", () => {
    expect(parseVideoTitle("Justice - Genesis (Extended Mix)")).toEqual({
      parsedArtist: "Justice",
      parsedTitle: "Genesis (Extended Mix)",
      parseStatus: "parsed",
    });
  });

  // 구분자 없는 제목(아티스트 미상) — DJ 플레이리스트에 흔함.
  // 전체를 곡명으로 보고 제목-단독 유사도 매칭을 타게 한다(이전: needs_review로 버림).
  it("구분자가 없으면 전체를 곡명으로 사용한다(아티스트 미상)", () => {
    expect(parseVideoTitle("Ondas Do Mar")).toEqual({
      parsedTitle: "Ondas Do Mar",
      parseStatus: "parsed",
    });
  });
  it("구분자 없는 제목의 버전 괄호도 보존한다", () => {
    expect(parseVideoTitle("Madan (Remix)")).toEqual({
      parsedTitle: "Madan (Remix)",
      parseStatus: "parsed",
    });
  });
  it("구분자 없는 제목에서도 끝의 노이즈는 제거한다", () => {
    expect(parseVideoTitle("Sol Clap (Official Audio)")).toEqual({
      parsedTitle: "Sol Clap",
      parseStatus: "parsed",
    });
  });
  it("빈 문자열/공백만이면 needs_review", () => {
    expect(parseVideoTitle("   ")).toEqual({ parseStatus: "needs_review" });
  });
});
