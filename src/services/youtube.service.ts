import type { YouTubeTrack } from "@/types/track";
import type { YouTubePlaylistResponse } from "@/types/api";
import { parsePlaylistUrl } from "@/lib/youtube/parse-playlist-url";
import { parseVideoTitle } from "@/lib/youtube/parse-video-title";
import { createYouTubeApiFetcher } from "@/services/youtube-api-fetcher";
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

// 유튜브 자동 아티스트 채널("아티스트명 - Topic")에서 아티스트를 복원한다.
// 제목만 있는(구분자 없는) 트랙의 아티스트 힌트로만 쓰인다(매칭 정확도 보강).
function artistFromChannel(channelTitle?: string): string | undefined {
  if (!channelTitle) return undefined;
  const m = channelTitle.match(/^(.+?)\s*-\s*Topic$/);
  return m ? m[1].trim() : undefined;
}

// 기본 스텁: YOUTUBE_API_KEY 미설정 시 빈 결과를 반환한다(키 없이도 앱이 깨지지 않게).
// 라우트는 이 스텁 대신 환경에 따라 실제 fetcher를 주입할 수 있다.
export const stubFetcher: PlaylistFetcher = async () => ({
  title: undefined,
  items: [],
});

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

/**
 * 기본 fetcher를 결정한다(우선순위: 주입 > 데모 > 실제 API > stub).
 * env 의존을 한 곳으로 격리하기 위해 apiKey를 인자로 받는다(테스트는 인자 주입).
 */
export function resolveFetcher(
  playlistId: string,
  apiKey: string | undefined,
  injected?: PlaylistFetcher,
): PlaylistFetcher {
  if (injected) return injected;
  if (playlistId === DEMO_PLAYLIST_ID) return demoFetcher;
  if (apiKey) return createYouTubeApiFetcher({ apiKey });
  return stubFetcher; // 키 미설정 — 빈 결과로 graceful 동작.
}

/** URL에서 playlistId를 추출하고, 결정된 fetcher로 곡 목록을 만든다. */
export async function fetchPlaylist(
  url: string,
  fetcher?: PlaylistFetcher,
): Promise<YouTubePlaylistResponse> {
  const playlistId = parsePlaylistUrl(url);
  // 키는 서버 환경변수에서만 읽는다(NEXT_PUBLIC_ 금지, CLAUDE.md §보안).
  const resolved = resolveFetcher(playlistId, process.env.YOUTUBE_API_KEY, fetcher);
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
    // 제목은 파싱됐는데 아티스트가 없을 때만 "- Topic" 채널명으로 보강한다.
    // 구분자로 이미 아티스트가 잡혔으면 원본 우선(채널 힌트 무시). parseStatus는 그대로.
    const channelArtist =
      parsed.parsedTitle && !parsed.parsedArtist
        ? artistFromChannel(item.channelTitle)
        : undefined;
    return {
      id: `yt_${i + 1}`,
      videoId: item.videoId,
      rawTitle: item.rawTitle,
      channelTitle: item.channelTitle,
      publishedAt: item.publishedAt,
      ...parsed,
      ...(channelArtist ? { parsedArtist: channelArtist } : {}),
    };
  });
  return { playlistId, title, tracks, unavailableCount };
}
