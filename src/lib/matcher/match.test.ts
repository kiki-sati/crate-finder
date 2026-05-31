import { describe, it, expect } from "vitest";
import type { YouTubeTrack, RekordboxTrack } from "@/types/track";
import { matchTracks } from "@/lib/matcher/match";

function rb(partial: Partial<RekordboxTrack> & { id: string }): RekordboxTrack {
  return {
    title: "",
    normalizedTitle: "",
    ...partial,
  };
}
function yt(partial: Partial<YouTubeTrack> & { id: string }): YouTubeTrack {
  return {
    videoId: "v_" + partial.id,
    rawTitle: "",
    parseStatus: "parsed",
    ...partial,
  };
}

const library: RekordboxTrack[] = [
  rb({
    id: "rb_strobe",
    title: "Strobe",
    artist: "deadmau5",
    normalizedTitle: "strobe",
    normalizedArtist: "deadmau5",
  }),
  rb({
    id: "rb_strobe_remix",
    title: "Strobe (Eric Prydz Remix)",
    artist: "deadmau5",
    normalizedTitle: "strobe (eric prydz remix)",
    normalizedArtist: "deadmau5",
  }),
];

describe("matchTracks", () => {
  it("정확일치는 owned/high/exact", () => {
    const [r] = matchTracks(
      [yt({ id: "1", parsedArtist: "deadmau5", parsedTitle: "Strobe" })],
      library,
    );
    expect(r.status).toBe("owned");
    expect(r.confidence).toBe("high");
    expect(r.matchedRekordboxTrackId).toBe("rb_strobe");
    expect(r.candidates[0].reason).toBe("exact");
  });

  it("리믹스는 원곡 후보로 owned 직행하지 않는다(버전 가드)", () => {
    // 플레이리스트는 remix, 라이브러리 최고 후보는 original("strobe")
    const onlyOriginal: RekordboxTrack[] = [library[0]];
    const [r] = matchTracks(
      [
        yt({
          id: "2",
          parsedArtist: "deadmau5",
          parsedTitle: "Strobe (Eric Prydz Remix)",
        }),
      ],
      onlyOriginal,
    );
    expect(r.status).not.toBe("owned");
  });

  it("아티스트 없는 트랙은 title-only(reason=similar_title)", () => {
    const [r] = matchTracks(
      [yt({ id: "3", parsedTitle: "Strobe" })],
      [library[0]],
    );
    // 같은 제목이지만 아티스트 정보가 없음 → 정확일치 키도 다름("|strobe")
    expect(r.candidates[0].reason).toBe("similar_title");
  });

  it("후보가 모두 낮으면 missing/low, 후보 비움", () => {
    const [r] = matchTracks(
      [yt({ id: "4", parsedArtist: "nobody", parsedTitle: "zzzzzzzz" })],
      library,
    );
    expect(r.status).toBe("missing");
    expect(r.confidence).toBe("low");
    expect(r.candidates).toEqual([]);
    expect(r.matchedRekordboxTrackId).toBeUndefined();
  });

  it("파싱 불가(unavailable) 트랙은 needs_review, 매칭 불가", () => {
    const [r] = matchTracks(
      [yt({ id: "5", parseStatus: "unavailable" })],
      library,
    );
    expect(r.status).toBe("needs_review");
    expect(r.candidates).toEqual([]);
    expect(r.matchedRekordboxTrackId).toBeUndefined();
  });

  it("YouTube 트랙 수만큼 결과를 반환한다", () => {
    const results = matchTracks(
      [
        yt({ id: "a", parsedArtist: "deadmau5", parsedTitle: "Strobe" }),
        yt({ id: "b", parseStatus: "unavailable" }),
      ],
      library,
    );
    expect(results).toHaveLength(2);
  });

  it("후보는 최대 3개로 제한한다", () => {
    const many: RekordboxTrack[] = Array.from({ length: 5 }, (_, i) =>
      rb({
        id: `m${i}`,
        title: "strobe",
        normalizedTitle: "strobe",
        normalizedArtist: "deadmau5",
        artist: "deadmau5",
      }),
    );
    const [r] = matchTracks(
      [yt({ id: "x", parsedArtist: "deadmau5", parsedTitle: "strob" })],
      many,
    );
    expect(r.candidates.length).toBeLessThanOrEqual(3);
  });
});
