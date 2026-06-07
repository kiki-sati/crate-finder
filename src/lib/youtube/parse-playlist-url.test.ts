import { describe, it, expect } from "vitest";
import { parsePlaylistUrl } from "@/lib/youtube/parse-playlist-url";
import { InvalidPlaylistUrlError } from "@/lib/youtube/youtube-errors";

describe("parsePlaylistUrl", () => {
  it("playlist?list= 형식에서 playlistId를 추출한다", () => {
    expect(
      parsePlaylistUrl("https://www.youtube.com/playlist?list=PL12345abcdef"),
    ).toBe("PL12345abcdef");
  });
  it("watch?v=…&list= 형식에서 playlistId를 추출한다", () => {
    expect(
      parsePlaylistUrl("https://www.youtube.com/watch?v=abc&list=PLxyz"),
    ).toBe("PLxyz");
  });
  it("youtu.be 단축 URL의 list 파라미터를 추출한다", () => {
    expect(parsePlaylistUrl("https://youtu.be/abc?list=PLshort")).toBe(
      "PLshort",
    );
  });
  it("list 파라미터가 없으면 InvalidPlaylistUrlError를 던진다", () => {
    expect(() =>
      parsePlaylistUrl("https://www.youtube.com/watch?v=abc"),
    ).toThrow(InvalidPlaylistUrlError);
  });
  it("YouTube 도메인이 아니면 InvalidPlaylistUrlError를 던진다", () => {
    expect(() => parsePlaylistUrl("https://vimeo.com/123")).toThrow(
      InvalidPlaylistUrlError,
    );
  });
  it("URL이 아니면 InvalidPlaylistUrlError를 던진다", () => {
    expect(() => parsePlaylistUrl("not a url")).toThrow(InvalidPlaylistUrlError);
  });

  // 입력 강건성(Phase 6): list 값의 형식/길이를 검증한다.
  // 실제 YouTube API fetcher 주입 전에 이상 입력이 외부 요청에 실리지 않게 한다.
  it("list 값에 허용되지 않는 문자가 있으면 거부한다", () => {
    expect(() =>
      parsePlaylistUrl("https://www.youtube.com/playlist?list=PL abc"),
    ).toThrow(InvalidPlaylistUrlError);
    expect(() =>
      parsePlaylistUrl("https://www.youtube.com/playlist?list=PL/../etc"),
    ).toThrow(InvalidPlaylistUrlError);
    expect(() =>
      parsePlaylistUrl(
        "https://www.youtube.com/playlist?list=PL<script>alert(1)</script>",
      ),
    ).toThrow(InvalidPlaylistUrlError);
  });

  it("list 값이 비정상적으로 길면 거부한다", () => {
    const longId = "PL" + "a".repeat(200);
    expect(() =>
      parsePlaylistUrl(`https://www.youtube.com/playlist?list=${longId}`),
    ).toThrow(InvalidPlaylistUrlError);
  });

  it("정상적인 영숫자/_/- 조합의 list는 허용한다", () => {
    expect(
      parsePlaylistUrl("https://www.youtube.com/playlist?list=PL-_09AZaz"),
    ).toBe("PL-_09AZaz");
  });
});
