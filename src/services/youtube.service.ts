import type { YouTubeTrack } from "@/types/track";
import type { YouTubePlaylistResponse } from "@/types/api";
import { parsePlaylistUrl } from "@/lib/youtube/parse-playlist-url";
import { parseVideoTitle } from "@/lib/youtube/parse-video-title";

export type RawPlaylistItem = {
  videoId: string;
  rawTitle: string;
  available: boolean;
  channelTitle?: string;
  publishedAt?: string;
};
export type PlaylistFetcher = (
  playlistId: string,
) => Promise<{ title?: string; items: RawPlaylistItem[] }>;

// 기본 스텁: 실제 YouTube API 키 연동(P1) 전까지 빈 결과를 반환한다.
// 라우트는 이 스텁 대신 환경에 따라 실제 fetcher를 주입할 수 있다.
const stubFetcher: PlaylistFetcher = async () => ({ title: undefined, items: [] });

/** URL에서 playlistId를 추출하고, 주입된 fetcher로 곡 목록을 만든다. */
export async function fetchPlaylist(
  url: string,
  fetcher: PlaylistFetcher = stubFetcher,
): Promise<YouTubePlaylistResponse> {
  const playlistId = parsePlaylistUrl(url);
  const { title, items } = await fetcher(playlistId);
  let unavailableCount = 0;
  const tracks: YouTubeTrack[] = items.map((item, i) => {
    if (!item.available) {
      unavailableCount += 1;
      return {
        id: `yt_${i + 1}`,
        videoId: item.videoId,
        rawTitle: item.rawTitle,
        channelTitle: item.channelTitle,
        publishedAt: item.publishedAt,
        parseStatus: "unavailable",
      };
    }
    const parsed = parseVideoTitle(item.rawTitle);
    return {
      id: `yt_${i + 1}`,
      videoId: item.videoId,
      rawTitle: item.rawTitle,
      channelTitle: item.channelTitle,
      publishedAt: item.publishedAt,
      ...parsed,
    };
  });
  return { playlistId, title, tracks, unavailableCount };
}
