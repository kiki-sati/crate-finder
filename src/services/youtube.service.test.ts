import { describe, it, expect } from "vitest";
import { fetchPlaylist } from "@/services/youtube.service";

describe("fetchPlaylist", () => {
  it("주입한 fetcher 결과를 YouTubePlaylistResponse로 매핑한다", async () => {
    const res = await fetchPlaylist(
      "https://www.youtube.com/playlist?list=PLtest",
      async () => ({
        title: "Test",
        items: [
          { videoId: "v1", rawTitle: "Daft Punk - One More Time", available: true },
          { videoId: "v2", rawTitle: "[Deleted video]", available: false },
        ],
      }),
    );
    expect(res.playlistId).toBe("PLtest");
    expect(res.title).toBe("Test");
    expect(res.tracks).toHaveLength(2);
    expect(res.tracks[0].parsedArtist).toBe("Daft Punk");
    expect(res.tracks[1].parseStatus).toBe("unavailable");
    expect(res.unavailableCount).toBe(1);
  });
});
