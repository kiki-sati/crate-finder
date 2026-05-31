// 분석 서비스 — 실제 API 라우트 호출 + 순수 matcher 엔진.
// 외부 API Key는 라우트(서버)에만 존재 → 이 모듈은 client에서 호출 가능.
// 계층 규칙(CLAUDE.md): services → lib(matcher) 허용. components import 금지.

import type {
  ApiResult,
  YouTubePlaylistResponse,
  RekordboxParseResponse,
} from "@/types/api";
import type { MatchResult } from "@/types/match";
import { parsePlaylistUrl } from "@/lib/youtube/parse-playlist-url";
import { matchTracks } from "@/lib/matcher/match";

// 라우트는 성공/실패 모두 ApiResult 봉투를 반환한다(ARCHITECTURE §7).
// 봉투가 아니거나 파싱 불가한 응답(프레임워크/프록시 레벨 오류 등)은 HTTP 상태로 실패 처리한다.
async function readResult<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as ApiResult<T> | null;
  if (body && body.ok === false) throw new Error(body.error.message);
  if (!body || body.ok !== true) {
    throw new Error(`요청 처리에 실패했습니다 (HTTP ${res.status}).`);
  }
  return body.data;
}

export async function loadPlaylist(
  url: string,
): Promise<YouTubePlaylistResponse> {
  parsePlaylistUrl(url); // 유효하지 않으면 네트워크 전에 즉시 throw
  const res = await fetch("/api/youtube/playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return readResult<YouTubePlaylistResponse>(res);
}

export async function parseXml(file: File): Promise<RekordboxParseResponse> {
  if (!file.name.toLowerCase().endsWith(".xml")) {
    throw new Error("XML 파일만 업로드할 수 있습니다.");
  }
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/rekordbox/parse", {
    method: "POST",
    body: form,
  });
  return readResult<RekordboxParseResponse>(res);
}

// 현재는 순수 동기 matcher를 직접 실행. 추후 서버 위임 시 시그니처 변경 없이 교체 가능.
export async function runMatch(
  playlist: YouTubePlaylistResponse,
  library: RekordboxParseResponse,
): Promise<MatchResult[]> {
  return matchTracks(playlist.tracks, library.tracks);
}
