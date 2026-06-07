export type ParsedVideoTitle = {
  parsedArtist?: string;
  parsedTitle?: string;
  parseStatus: "parsed" | "needs_review";
};

const DASH = /\s[‒–—―−-]\s/; // 양쪽 공백을 가진 구분 대시
// 곡명 끝에 붙는 노이즈 괄호/대괄호 (대소문자 무시).
const NOISE =
  /\s*[([]\s*(?:official\s+(?:music\s+)?video|official\s+audio|official\s+video|lyric\s+video|lyrics?|audio|visualizer|m\/?v|hd|hq|4k)\s*[)\]]\s*$/i;

/** YouTube 영상 제목에서 아티스트/곡명을 추정한다. */
export function parseVideoTitle(rawTitle: string): ParsedVideoTitle {
  const idx = rawTitle.search(DASH);
  if (idx === -1) return { parseStatus: "needs_review" };
  const artist = rawTitle.slice(0, idx).trim();
  let title = rawTitle.slice(idx + 3).trim();
  title = title.replace(NOISE, "").trim();
  if (!artist || !title) return { parseStatus: "needs_review" };
  return { parsedArtist: artist, parsedTitle: title, parseStatus: "parsed" };
}
