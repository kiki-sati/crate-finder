import { InvalidPlaylistUrlError } from "@/lib/youtube/youtube-errors";

const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

/** YouTube URL에서 플레이리스트 ID(list 파라미터)를 추출한다. */
export function parsePlaylistUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new InvalidPlaylistUrlError();
  }
  if (!YT_HOSTS.has(parsed.hostname)) throw new InvalidPlaylistUrlError();
  const list = parsed.searchParams.get("list");
  if (!list) throw new InvalidPlaylistUrlError();
  return list;
}
