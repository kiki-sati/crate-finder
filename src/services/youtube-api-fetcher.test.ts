import { describe, it, expect } from "vitest";
import { createYouTubeApiFetcher } from "@/services/youtube-api-fetcher";
import type { YouTubeHttpGetJson } from "@/services/youtube-api-fetcher";
import {
  PlaylistNotFoundError,
  YouTubeQuotaError,
  YouTubeApiError,
} from "@/lib/youtube/youtube-errors";

// playlistItems.list 응답 1개 item을 만드는 헬퍼.
function item(opts: {
  videoId: string;
  title: string;
  channelTitle?: string;
  videoOwnerChannelTitle?: string;
  publishedAt?: string;
}) {
  return {
    snippet: {
      title: opts.title,
      publishedAt: opts.publishedAt,
      channelTitle: opts.channelTitle,
      videoOwnerChannelTitle: opts.videoOwnerChannelTitle,
      resourceId: { kind: "youtube#video", videoId: opts.videoId },
    },
  };
}

// URL 패턴에 따라 canned JSON을 돌려주는 mock httpGetJson 빌더.
// playlistItems는 page별로(pageToken 유무) 다른 응답을 줄 수 있다.
function buildHttp(handlers: {
  playlistItemsByPage?: Record<string, unknown>; // key: pageToken ("" = 첫 페이지)
  playlistItems?: unknown; // 단일 페이지용 단축
  playlists?: unknown | (() => never);
}): { http: YouTubeHttpGetJson; calls: string[] } {
  const calls: string[] = [];
  const http: YouTubeHttpGetJson = async (url) => {
    calls.push(url);
    const u = new URL(url);
    if (u.pathname.endsWith("/playlistItems")) {
      if (handlers.playlistItemsByPage) {
        const token = u.searchParams.get("pageToken") ?? "";
        return handlers.playlistItemsByPage[token];
      }
      return handlers.playlistItems;
    }
    if (u.pathname.endsWith("/playlists")) {
      if (typeof handlers.playlists === "function") {
        return (handlers.playlists as () => never)();
      }
      return handlers.playlists;
    }
    throw new Error(`unexpected url path: ${u.pathname}`);
  };
  return { http, calls };
}

describe("createYouTubeApiFetcher", () => {
  it("단일 페이지 응답의 item을 RawPlaylistItem으로 매핑한다", async () => {
    const { http } = buildHttp({
      playlistItems: {
        items: [
          item({
            videoId: "v1",
            title: "Daft Punk - One More Time",
            videoOwnerChannelTitle: "Daft Punk - Topic",
            publishedAt: "2021-01-01T00:00:00Z",
          }),
        ],
      },
      playlists: { items: [{ snippet: { title: "My Crate" } }] },
    });
    const fetcher = createYouTubeApiFetcher({ apiKey: "k", httpGetJson: http });
    const { title, items } = await fetcher("PL123");

    expect(title).toBe("My Crate");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      videoId: "v1",
      rawTitle: "Daft Punk - One More Time",
      channelTitle: "Daft Punk - Topic", // videoOwnerChannelTitle 우선
      publishedAt: "2021-01-01T00:00:00Z",
      available: true,
    });
  });

  it("videoOwnerChannelTitle이 없으면 channelTitle로 폴백한다", async () => {
    const { http } = buildHttp({
      playlistItems: {
        items: [item({ videoId: "v1", title: "A - B", channelTitle: "Some Channel" })],
      },
      playlists: { items: [] },
    });
    const fetcher = createYouTubeApiFetcher({ apiKey: "k", httpGetJson: http });
    const { items } = await fetcher("PL123");
    expect(items[0].channelTitle).toBe("Some Channel");
  });

  it("nextPageToken을 따라 모든 페이지를 수집한다(50곡 초과)", async () => {
    const { http, calls } = buildHttp({
      playlistItemsByPage: {
        "": {
          nextPageToken: "PAGE2",
          items: [item({ videoId: "v1", title: "A - 1" })],
        },
        PAGE2: {
          nextPageToken: "PAGE3",
          items: [item({ videoId: "v2", title: "A - 2" })],
        },
        PAGE3: {
          items: [item({ videoId: "v3", title: "A - 3" })],
        },
      },
      playlists: { items: [{ snippet: { title: "T" } }] },
    });
    const fetcher = createYouTubeApiFetcher({ apiKey: "k", httpGetJson: http });
    const { items } = await fetcher("PL123");

    expect(items.map((i) => i.videoId)).toEqual(["v1", "v2", "v3"]);
    // 2·3페이지 요청에 pageToken이 실렸는지 확인.
    const itemCalls = calls.filter((c) => c.includes("/playlistItems"));
    expect(itemCalls).toHaveLength(3);
    expect(itemCalls[1]).toContain("pageToken=PAGE2");
    expect(itemCalls[2]).toContain("pageToken=PAGE3");
  });

  it("'Private video'/'Deleted video'는 available=false로 표시한다", async () => {
    const { http } = buildHttp({
      playlistItems: {
        items: [
          item({ videoId: "v1", title: "Private video" }),
          item({ videoId: "v2", title: "Deleted video" }),
          item({ videoId: "v3", title: "Real - Track" }),
        ],
      },
      playlists: { items: [] },
    });
    const fetcher = createYouTubeApiFetcher({ apiKey: "k", httpGetJson: http });
    const { items } = await fetcher("PL123");
    expect(items[0].available).toBe(false);
    expect(items[1].available).toBe(false);
    expect(items[2].available).toBe(true);
  });

  it("playlists.list가 성공하면 title을 채운다", async () => {
    const { http } = buildHttp({
      playlistItems: { items: [item({ videoId: "v1", title: "A - B" })] },
      playlists: { items: [{ snippet: { title: "Best Crate" } }] },
    });
    const fetcher = createYouTubeApiFetcher({ apiKey: "k", httpGetJson: http });
    const { title } = await fetcher("PL123");
    expect(title).toBe("Best Crate");
  });

  it("playlists.list가 실패해도 title undefined로 전체 fetch는 성공한다(best-effort)", async () => {
    const { http } = buildHttp({
      playlistItems: { items: [item({ videoId: "v1", title: "A - B" })] },
      playlists: () => {
        throw Object.assign(new Error("boom"), { status: 500 });
      },
    });
    const fetcher = createYouTubeApiFetcher({ apiKey: "k", httpGetJson: http });
    const { title, items } = await fetcher("PL123");
    expect(title).toBeUndefined();
    expect(items).toHaveLength(1);
  });

  it("playlists.list 응답에 항목이 없으면 title undefined", async () => {
    const { http } = buildHttp({
      playlistItems: { items: [item({ videoId: "v1", title: "A - B" })] },
      playlists: { items: [] },
    });
    const fetcher = createYouTubeApiFetcher({ apiKey: "k", httpGetJson: http });
    const { title } = await fetcher("PL123");
    expect(title).toBeUndefined();
  });

  describe("오류 매핑", () => {
    function failingHttp(status: number): YouTubeHttpGetJson {
      return async () => {
        throw Object.assign(new Error("http fail"), { status });
      };
    }

    it("403 → YouTubeQuotaError", async () => {
      const fetcher = createYouTubeApiFetcher({
        apiKey: "k",
        httpGetJson: failingHttp(403),
      });
      await expect(fetcher("PL123")).rejects.toBeInstanceOf(YouTubeQuotaError);
    });

    it("404 → PlaylistNotFoundError", async () => {
      const fetcher = createYouTubeApiFetcher({
        apiKey: "k",
        httpGetJson: failingHttp(404),
      });
      await expect(fetcher("PL123")).rejects.toBeInstanceOf(PlaylistNotFoundError);
    });

    it("빈 응답(items 없음) → PlaylistNotFoundError", async () => {
      const { http } = buildHttp({ playlistItems: {}, playlists: { items: [] } });
      const fetcher = createYouTubeApiFetcher({ apiKey: "k", httpGetJson: http });
      await expect(fetcher("PL123")).rejects.toBeInstanceOf(PlaylistNotFoundError);
    });

    it("기타 HTTP(500) → YouTubeApiError", async () => {
      const fetcher = createYouTubeApiFetcher({
        apiKey: "k",
        httpGetJson: failingHttp(500),
      });
      await expect(fetcher("PL123")).rejects.toBeInstanceOf(YouTubeApiError);
    });

    it("네트워크 오류(status 없음) → YouTubeApiError", async () => {
      const fetcher = createYouTubeApiFetcher({
        apiKey: "k",
        httpGetJson: async () => {
          throw new Error("network down");
        },
      });
      await expect(fetcher("PL123")).rejects.toBeInstanceOf(YouTubeApiError);
    });
  });

  it("apiKey가 비어 있으면 생성 시 throw한다", () => {
    expect(() => createYouTubeApiFetcher({ apiKey: "" })).toThrow();
  });
});
