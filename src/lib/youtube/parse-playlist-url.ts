import { InvalidPlaylistUrlError } from "@/lib/youtube/youtube-errors";

const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

// YouTube playlist ID는 base64url 문자(영숫자·_·-)로만 구성된다.
// 실제 길이는 ~34자이나 미래 호환 마진으로 상한을 보수적으로 100자로 둔다.
// 입력 강건성(Phase 6): 이상 입력이 실제 YouTube API 요청에 실리는 것을 차단.
const PLAYLIST_ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

/** YouTube URL에서 플레이리스트 ID(list 파라미터)를 추출·검증한다. */
export function parsePlaylistUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new InvalidPlaylistUrlError();
  }
  if (!YT_HOSTS.has(parsed.hostname)) throw new InvalidPlaylistUrlError();
  const list = parsed.searchParams.get("list");
  if (!list || !PLAYLIST_ID_PATTERN.test(list)) {
    throw new InvalidPlaylistUrlError();
  }
  return list;
}
