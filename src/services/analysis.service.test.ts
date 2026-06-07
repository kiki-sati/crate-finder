import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadPlaylist, parseXml, runMatch } from "@/services/analysis.service";
import type {
  YouTubePlaylistResponse,
  RekordboxParseResponse,
} from "@/types/api";

function jsonResponse(
  body: unknown,
  init?: { ok?: boolean; status?: number },
): Response {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("analysis.service", () => {
  it("loadPlaylist: 유효 URL이면 라우트 호출 후 data를 언랩한다", async () => {
    const data: YouTubePlaylistResponse = {
      playlistId: "PL1",
      tracks: [],
      unavailableCount: 0,
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ ok: true, data }));
    const res = await loadPlaylist(
      "https://www.youtube.com/playlist?list=PL1",
    );
    expect(res).toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/youtube/playlist",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("loadPlaylist: 유효하지 않은 URL이면 fetch 전에 throw", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(loadPlaylist("not-a-url")).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loadPlaylist: 라우트가 ok:false면 error.message로 throw", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        { ok: false, error: { code: "youtube_error", message: "쿼터 초과" } },
        { ok: false, status: 400 },
      ),
    );
    await expect(
      loadPlaylist("https://www.youtube.com/playlist?list=PL1"),
    ).rejects.toThrow("쿼터 초과");
  });

  it("봉투가 아닌 HTTP 오류 응답이면 throw한다", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ message: "Internal Server Error" }, { ok: false, status: 500 }),
    );
    await expect(
      loadPlaylist("https://www.youtube.com/playlist?list=PL1"),
    ).rejects.toThrow();
  });

  it("parseXml: 비-xml 파일이면 fetch 전에 throw", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const file = new File(["x"], "library.txt", { type: "text/plain" });
    await expect(parseXml(file)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("parseXml: .xml이면 FormData로 라우트 호출 후 언랩", async () => {
    const data: RekordboxParseResponse = {
      trackCount: 0,
      tracks: [],
      warnings: [],
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ ok: true, data }));
    const file = new File(["<xml/>"], "library.xml", { type: "text/xml" });
    const res = await parseXml(file);
    expect(res).toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/rekordbox/parse",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("runMatch: 입력 YouTube 트랙당 MatchResult 1개를 반환한다(matcher 배선)", async () => {
    const playlist: YouTubePlaylistResponse = {
      playlistId: "PL1",
      tracks: [
        {
          id: "yt_1",
          videoId: "v1",
          rawTitle: "Daft Punk - One More Time",
          parseStatus: "parsed",
          parsedArtist: "Daft Punk",
          parsedTitle: "One More Time",
        },
      ],
      unavailableCount: 0,
    };
    const library: RekordboxParseResponse = {
      trackCount: 1,
      tracks: [
        {
          id: "rb_1",
          title: "One More Time",
          artist: "Daft Punk",
          normalizedTitle: "one more time",
          normalizedArtist: "daft punk",
        },
      ],
      warnings: [],
    };
    const results = await runMatch(playlist, library);
    expect(results).toHaveLength(1);
    expect(results[0].youtubeTrackId).toBe("yt_1");
    expect(results[0].matchedRekordboxTrackId).toBe("rb_1");
  });
});
