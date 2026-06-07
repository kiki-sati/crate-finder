// 서버 전용: YouTube Data API v3로 플레이리스트 곡 목록을 가져온다.
// route/service만 import한다(클라이언트 번들 미노출, ADR-003 / CLAUDE.md §보안).
// API Key는 process.env.YOUTUBE_API_KEY에서만 읽고, 키·키 포함 URL을 로그/에러에 노출하지 않는다.
import type { PlaylistFetcher, RawPlaylistItem } from "@/services/youtube.service";
import {
  PlaylistNotFoundError,
  YouTubeQuotaError,
  YouTubeApiError,
} from "@/lib/youtube/youtube-errors";

const API_BASE = "https://www.googleapis.com/youtube/v3";
const MAX_RESULTS = 50; // playlistItems.list 페이지 상한.
// 무한 루프 방지용 안전 상한(이상 응답이 토큰을 계속 돌려주는 경우 차단).
const MAX_PAGES = 40; // 40 * 50 = 2000곡.

// 주입식 HTTP: 기본은 전역 fetch. 테스트는 canned JSON 반환 함수를 주입한다.
export type YouTubeHttpGetJson = (url: string) => Promise<unknown>;

// 비공개/삭제 영상의 표준 제목. 이 경우 메타데이터가 없어 매칭 대상에서 제외한다.
const UNAVAILABLE_TITLES = new Set(["Private video", "Deleted video"]);

// HTTP 오류를 식별하기 위한 status 부착 에러(메시지에 URL/키를 담지 않는다).
function isStatusError(e: unknown): e is { status: number } {
  return (
    typeof e === "object" &&
    e !== null &&
    "status" in e &&
    typeof (e as { status: unknown }).status === "number"
  );
}

// status → 도메인 에러. 키/URL 미포함 안내 메시지만 사용한다.
function mapHttpError(e: unknown): Error {
  if (isStatusError(e)) {
    if (e.status === 403) return new YouTubeQuotaError();
    if (e.status === 404) return new PlaylistNotFoundError();
  }
  return new YouTubeApiError();
}

// 기본 HTTP 구현: fetch 후 비정상 응답은 status만 담아 throw(본문/URL 미노출).
const defaultHttpGetJson: YouTubeHttpGetJson = async (url) => {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    // 네트워크 오류 — URL/원인 메시지 미노출.
    throw new YouTubeApiError();
  }
  if (!res.ok) {
    throw Object.assign(new Error(`YouTube API responded ${res.status}`), {
      status: res.status,
    });
  }
  return res.json();
};

// --- 응답 형태(필요 필드만 좁게 정의) ---
type PlaylistItemSnippet = {
  title?: string;
  publishedAt?: string;
  channelTitle?: string;
  videoOwnerChannelTitle?: string;
  resourceId?: { videoId?: string };
};
type PlaylistItemsResponse = {
  nextPageToken?: string;
  items?: { snippet?: PlaylistItemSnippet }[];
};
type PlaylistsResponse = {
  items?: { snippet?: { title?: string } }[];
};

function toRawItem(snippet: PlaylistItemSnippet): RawPlaylistItem {
  const rawTitle = snippet.title ?? "";
  const videoId = snippet.resourceId?.videoId ?? "";
  return {
    videoId,
    rawTitle,
    channelTitle: snippet.videoOwnerChannelTitle ?? snippet.channelTitle,
    publishedAt: snippet.publishedAt,
    available: !UNAVAILABLE_TITLES.has(rawTitle),
  };
}

/**
 * 주입 가능한 YouTube Data API v3 fetcher 팩토리.
 * - playlistItems.list를 nextPageToken 따라 전체 페이지 수집.
 * - playlists.list로 제목을 best-effort 조회(실패해도 전체 fetch는 진행).
 */
export function createYouTubeApiFetcher(deps: {
  apiKey: string;
  httpGetJson?: YouTubeHttpGetJson;
}): PlaylistFetcher {
  const { apiKey } = deps;
  if (!apiKey) {
    // 호출자(youtube.service)가 키 유무로 분기하므로 여기 도달은 설정 오류.
    throw new YouTubeApiError("YouTube API 키가 설정되지 않았습니다.");
  }
  const httpGetJson = deps.httpGetJson ?? defaultHttpGetJson;

  return async (playlistId) => {
    const items = await fetchAllItems(playlistId, apiKey, httpGetJson);
    const title = await fetchTitleBestEffort(playlistId, apiKey, httpGetJson);
    return { title, items };
  };
}

async function fetchAllItems(
  playlistId: string,
  apiKey: string,
  httpGetJson: YouTubeHttpGetJson,
): Promise<RawPlaylistItem[]> {
  const collected: RawPlaylistItem[] = [];
  let pageToken: string | undefined;
  let sawItemsField = false;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(`${API_BASE}/playlistItems`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("maxResults", String(MAX_RESULTS));
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    let body: PlaylistItemsResponse;
    try {
      body = (await httpGetJson(url.toString())) as PlaylistItemsResponse;
    } catch (e) {
      throw mapHttpError(e);
    }

    const pageItems = body?.items;
    if (Array.isArray(pageItems)) {
      sawItemsField = true;
      for (const it of pageItems) {
        if (it?.snippet) collected.push(toRawItem(it.snippet));
      }
    }

    pageToken = body?.nextPageToken;
    if (!pageToken) break;
  }

  // 응답에 items 필드 자체가 없으면(빈 응답) 존재하지 않는 플레이리스트로 간주.
  if (!sawItemsField) throw new PlaylistNotFoundError();
  return collected;
}

// 제목은 부가 정보 — 실패/없음이면 undefined로 진행(전체 fetch 실패시키지 않음).
async function fetchTitleBestEffort(
  playlistId: string,
  apiKey: string,
  httpGetJson: YouTubeHttpGetJson,
): Promise<string | undefined> {
  const url = new URL(`${API_BASE}/playlists`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", playlistId);
  url.searchParams.set("key", apiKey);
  try {
    const body = (await httpGetJson(url.toString())) as PlaylistsResponse;
    return body?.items?.[0]?.snippet?.title;
  } catch {
    return undefined;
  }
}
