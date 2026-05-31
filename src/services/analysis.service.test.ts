import { describe, it, expect } from "vitest";
import { loadPlaylist, parseXml, runMatch } from "@/services/analysis.service";

describe("analysis.service (mock)", () => {
  it("유효한 URL이면 playlist 응답을 반환한다", async () => {
    const res = await loadPlaylist("https://www.youtube.com/playlist?list=PL1");
    expect(res.tracks.length).toBeGreaterThan(0);
  });

  it("유효하지 않은 URL이면 에러를 던진다", async () => {
    await expect(loadPlaylist("not-a-url")).rejects.toThrow();
  });

  it(".xml이 아니면 에러를 던진다", async () => {
    const file = new File(["x"], "library.txt", { type: "text/plain" });
    await expect(parseXml(file)).rejects.toThrow();
  });

  it(".xml 파일이면 파싱 응답을 반환한다", async () => {
    const file = new File(["<xml/>"], "library.xml", { type: "text/xml" });
    const res = await parseXml(file);
    expect(res.trackCount).toBe(res.tracks.length);
  });

  it("runMatch는 MatchResult 배열을 반환한다", async () => {
    const playlist = await loadPlaylist(
      "https://www.youtube.com/playlist?list=PL1",
    );
    const library = await parseXml(
      new File(["<xml/>"], "library.xml", { type: "text/xml" }),
    );
    const results = await runMatch(playlist, library);
    expect(Array.isArray(results)).toBe(true);
  });
});
