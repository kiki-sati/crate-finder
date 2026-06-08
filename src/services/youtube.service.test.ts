import { describe, it, expect } from "vitest";
import {
  fetchPlaylist,
  demoFetcher,
  resolveFetcher,
  stubFetcher,
  DEMO_PLAYLIST_ID,
} from "@/services/youtube.service";

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

describe("demoFetcher (시연용)", () => {
  it("데모 playlist ID로 호출하면 샘플 곡 목록을 반환한다", async () => {
    const { title, items } = await demoFetcher(DEMO_PLAYLIST_ID);
    expect(title).toBeTruthy();
    expect(items.length).toBeGreaterThan(0);
    // rawTitle을 담아 실제 파싱 흐름을 그대로 타게 한다.
    expect(items[0].rawTitle).toContain("Daft Punk");
    expect(items.some((i) => !i.available)).toBe(true); // unavailable 케이스 포함
  });

  it("demoFetcher로 fetchPlaylist를 돌리면 owned/missing 시연이 가능한 트랙이 나온다", async () => {
    const res = await fetchPlaylist(
      `https://www.youtube.com/playlist?list=${DEMO_PLAYLIST_ID}`,
      demoFetcher,
    );
    expect(res.tracks.length).toBeGreaterThanOrEqual(4);
    expect(res.tracks[0].parsedArtist).toBe("Daft Punk");
    expect(res.unavailableCount).toBeGreaterThan(0);
  });
});

describe("채널명 아티스트 힌트 (\"X - Topic\")", () => {
  const playlist = "https://www.youtube.com/playlist?list=PLtest";

  it("제목만 있는 트랙은 \"X - Topic\" 채널명에서 아티스트를 보강한다", async () => {
    const res = await fetchPlaylist(playlist, async () => ({
      items: [
        {
          videoId: "v1",
          rawTitle: "Ondas Do Mar",
          available: true,
          channelTitle: "Nu Guinea - Topic",
        },
      ],
    }));
    expect(res.tracks[0].parsedArtist).toBe("Nu Guinea");
    expect(res.tracks[0].parsedTitle).toBe("Ondas Do Mar");
    expect(res.tracks[0].parseStatus).toBe("parsed");
    expect(res.tracks[0].rawTitle).toBe("Ondas Do Mar"); // 원본 불변
  });

  it("non-Topic 채널이면 아티스트를 보강하지 않는다", async () => {
    const res = await fetchPlaylist(playlist, async () => ({
      items: [
        {
          videoId: "v1",
          rawTitle: "Ondas Do Mar",
          available: true,
          channelTitle: "Some Curator",
        },
      ],
    }));
    expect(res.tracks[0].parsedArtist).toBeUndefined();
    expect(res.tracks[0].parseStatus).toBe("parsed");
  });

  it("구분자로 아티스트가 이미 파싱되면 채널 힌트를 무시한다(원본 우선)", async () => {
    const res = await fetchPlaylist(playlist, async () => ({
      items: [
        {
          videoId: "v1",
          rawTitle: "Daft Punk - One More Time",
          available: true,
          channelTitle: "SomeoneElse - Topic",
        },
      ],
    }));
    expect(res.tracks[0].parsedArtist).toBe("Daft Punk");
  });

  it("channelTitle이 없으면 아티스트는 undefined로 유지된다", async () => {
    const res = await fetchPlaylist(playlist, async () => ({
      items: [{ videoId: "v1", rawTitle: "Ondas Do Mar", available: true }],
    }));
    expect(res.tracks[0].parsedArtist).toBeUndefined();
    expect(res.tracks[0].parseStatus).toBe("parsed");
  });

  it("unavailable 트랙엔 채널 힌트를 적용하지 않는다", async () => {
    const res = await fetchPlaylist(playlist, async () => ({
      items: [
        {
          videoId: "v1",
          rawTitle: "[Deleted video]",
          available: false,
          channelTitle: "Nu Guinea - Topic",
        },
      ],
    }));
    expect(res.tracks[0].parseStatus).toBe("unavailable");
    expect(res.tracks[0].parsedArtist).toBeUndefined();
  });
});

describe("resolveFetcher (기본 fetcher 결정)", () => {
  it("주입 fetcher가 있으면 그대로 사용한다(env/데모보다 우선)", () => {
    const injected = demoFetcher;
    expect(resolveFetcher(DEMO_PLAYLIST_ID, "any-key", injected)).toBe(injected);
  });

  it("데모 playlist ID면 demoFetcher를 쓴다", () => {
    expect(resolveFetcher(DEMO_PLAYLIST_ID, "any-key", undefined)).toBe(
      demoFetcher,
    );
  });

  it("API 키가 없으면 stubFetcher로 폴백한다", () => {
    expect(resolveFetcher("PLreal", undefined, undefined)).toBe(stubFetcher);
    expect(resolveFetcher("PLreal", "", undefined)).toBe(stubFetcher);
  });

  it("API 키가 있으면 실제 API fetcher를 생성한다(stub/demo 아님)", () => {
    const f = resolveFetcher("PLreal", "real-key", undefined);
    expect(f).not.toBe(stubFetcher);
    expect(f).not.toBe(demoFetcher);
    expect(typeof f).toBe("function");
  });
});
