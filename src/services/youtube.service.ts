import type { YouTubeTrack } from "@/types/track";
import type { YouTubePlaylistResponse } from "@/types/api";
import { parsePlaylistUrl } from "@/lib/youtube/parse-playlist-url";
import { parseVideoTitle } from "@/lib/youtube/parse-video-title";
import { sampleYouTubeTracks } from "@/mocks/sample-data";

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

// 시연용 데모 playlist ID. 이 값으로 들어오면 샘플 곡 목록을 반환한다.
// 실제 YouTube API 연동(P1) 시 이 분기만 제거하면 된다(격리된 단일 지점).
export const DEMO_PLAYLIST_ID = "PLDEMO";

// 데모 fetcher: 공유 mock(sample-data)을 raw 형태로 변환해 반환한다.
// rawTitle을 그대로 담아 parseVideoTitle 파싱 흐름을 실제와 동일하게 탄다.
export const demoFetcher: PlaylistFetcher = async () => ({
  title: "Sample Crate (Demo)",
  items: sampleYouTubeTracks.map((t) => ({
    videoId: t.videoId,
    rawTitle: t.rawTitle,
    available: t.parseStatus !== "unavailable",
    channelTitle: t.channelTitle,
    publishedAt: t.publishedAt,
  })),
});

/** URL에서 playlistId를 추출하고, 주입된 fetcher로 곡 목록을 만든다. */
export async function fetchPlaylist(
  url: string,
  fetcher?: PlaylistFetcher,
): Promise<YouTubePlaylistResponse> {
  const playlistId = parsePlaylistUrl(url);
  // fetcher 미주입 시: 데모 ID면 샘플 데이터, 아니면 빈 스텁(실제 API 연동 전).
  const resolved =
    fetcher ?? (playlistId === DEMO_PLAYLIST_ID ? demoFetcher : stubFetcher);
  const { title, items } = await resolved(playlistId);
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
