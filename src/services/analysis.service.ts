// mock 분석 서비스 — sample-data를 인위적 지연과 함께 반환한다.
// 통합 시 이 파일의 함수 구현만 실제 fetch로 교체한다(단일 교체 지점).
// 계층 규칙(CLAUDE.md): 외부 API/Key 없음 → client 호출 가능. components import 금지.

import type {
  YouTubePlaylistResponse,
  RekordboxParseResponse,
} from "@/types/api";
import type { MatchResult } from "@/types/match";
import { parsePlaylistUrl } from "@/lib/youtube/parse-playlist-url";
import {
  sampleYouTubePlaylistResponse,
  sampleRekordboxParseResponse,
  sampleMatchResults,
} from "@/mocks/sample-data";

const MOCK_DELAY_MS = 300;

function delay<T>(value: T, ms = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function loadPlaylist(
  url: string,
): Promise<YouTubePlaylistResponse> {
  parsePlaylistUrl(url); // 유효하지 않으면 InvalidPlaylistUrlError throw
  return delay(sampleYouTubePlaylistResponse);
}

export async function parseXml(file: File): Promise<RekordboxParseResponse> {
  if (!file.name.toLowerCase().endsWith(".xml")) {
    throw new Error("XML 파일만 업로드할 수 있습니다.");
  }
  return delay(sampleRekordboxParseResponse);
}

export async function runMatch(
  _playlist: YouTubePlaylistResponse,
  _library: RekordboxParseResponse,
): Promise<MatchResult[]> {
  return delay(sampleMatchResults);
}
