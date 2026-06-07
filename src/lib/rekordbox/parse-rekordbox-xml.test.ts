import { describe, it, expect } from "vitest";
import { parseRekordboxXml } from "@/lib/rekordbox/parse-rekordbox-xml";

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<DJ_PLAYLISTS Version="1.0.0">
  <COLLECTION Entries="2">
    <TRACK TrackID="1" Name="One More Time" Artist="Daft Punk" Album="Discovery" TotalTime="320" Location="file://localhost/Users/dj/one.mp3"/>
    <TRACK TrackID="2" Name="D.A.N.C.E." Artist="" Album="Cross" TotalTime="242" Location="file://localhost/Users/dj/dance.mp3"/>
  </COLLECTION>
</DJ_PLAYLISTS>`;

describe("parseRekordboxXml", () => {
  it("TRACK 노드를 RekordboxTrack[]로 변환한다", () => {
    const { tracks } = parseRekordboxXml(XML);
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toMatchObject({
      id: "1",
      title: "One More Time",
      artist: "Daft Punk",
      album: "Discovery",
      durationMs: 320000,
      normalizedTitle: "one more time",
      normalizedArtist: "daft punk",
    });
  });
  it("아티스트가 비면 artist/normalizedArtist를 생략한다", () => {
    const { tracks } = parseRekordboxXml(XML);
    expect(tracks[1].artist).toBeUndefined();
    expect(tracks[1].normalizedArtist).toBeUndefined();
  });
  it("TRACK이 없으면 빈 배열과 warning을 반환한다", () => {
    const { tracks, warnings } = parseRekordboxXml(
      `<DJ_PLAYLISTS><COLLECTION Entries="0"></COLLECTION></DJ_PLAYLISTS>`,
    );
    expect(tracks).toEqual([]);
    expect(warnings.some((w) => w.code === "empty_collection")).toBe(true);
  });

  // 보안(CLAUDE.md §보안): 로컬 파일 절대경로를 응답에 노출하지 않는다.
  // Rekordbox Location은 file://localhost/Users/<사용자명>/... 형태라
  // OS 계정명이 담긴 로컬 경로다. 어떤 소비처도 쓰지 않으므로 담지 않는다.
  it("로컬 파일 경로(Location)를 트랙에 담지 않는다", () => {
    const { tracks } = parseRekordboxXml(XML);
    expect(tracks[0].location).toBeUndefined();
    expect(tracks[1].location).toBeUndefined();
  });

  it("직렬화된 응답에 file:// 로컬 경로가 새지 않는다", () => {
    const { tracks } = parseRekordboxXml(XML);
    const serialized = JSON.stringify(tracks);
    expect(serialized).not.toContain("file://");
    expect(serialized).not.toContain("/Users/");
  });
});
