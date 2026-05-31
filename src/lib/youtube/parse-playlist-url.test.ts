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
});
