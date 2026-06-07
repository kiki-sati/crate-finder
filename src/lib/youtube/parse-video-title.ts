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

  // 구분자(아티스트 - 제목)가 없으면 전체를 곡명으로 본다(아티스트 미상).
  // DJ 플레이리스트엔 제목만 있는 트랙이 흔하다. 매처가 제목-단독 유사도로
  // 매칭하므로(없으면 매칭 자체가 불가), 세트/믹스 등은 유사도가 낮아 자연히 missing.
  if (idx === -1) {
    const title = rawTitle.replace(NOISE, "").trim();
    return title ? { parsedTitle: title, parseStatus: "parsed" } : { parseStatus: "needs_review" };
  }

  const artist = rawTitle.slice(0, idx).trim();
  const title = rawTitle.slice(idx + 3).trim().replace(NOISE, "").trim();

  // 제목부가 비면 전체를 곡명으로 폴백(완전 실패 대신 매칭 기회 부여).
  if (!title) {
    const whole = rawTitle.replace(NOISE, "").trim();
    return whole ? { parsedTitle: whole, parseStatus: "parsed" } : { parseStatus: "needs_review" };
  }
  // 아티스트부가 비면 제목만(아티스트 미상)으로 처리.
  if (!artist) return { parsedTitle: title, parseStatus: "parsed" };

  return { parsedArtist: artist, parsedTitle: title, parseStatus: "parsed" };
}
