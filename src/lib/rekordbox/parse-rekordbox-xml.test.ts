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

  // L2 UX: DJ_PLAYLISTS 루트가 없으면(=Rekordbox 내보내기 아님) 0곡으로 통과시키지
  // 않고 명확한 형식 오류로 throw한다. "왜 0곡이지?" 혼란을 방지한다.
  it("DJ_PLAYLISTS 루트가 없는 XML이면 형식 오류로 throw한다", () => {
    expect(() => parseRekordboxXml(`<foo><bar/></foo>`)).toThrow();
  });

  it("COLLECTION만 있고 DJ_PLAYLISTS 루트가 없으면 throw한다", () => {
    expect(() =>
      parseRekordboxXml(`<COLLECTION Entries="0"></COLLECTION>`),
    ).toThrow();
  });

  it("iTunes 등 다른 형식 XML(plist)이면 throw한다", () => {
    expect(() =>
      parseRekordboxXml(
        `<?xml version="1.0"?><plist version="1.0"><dict><key>Tracks</key></dict></plist>`,
      ),
    ).toThrow();
  });

  it("XML이 아닌 평범한 텍스트면 throw한다", () => {
    expect(() => parseRekordboxXml(`not xml at all, just text`)).toThrow();
  });

  // 보안(CLAUDE.md §보안): 형식 오류 메시지에 입력 원문/경로가 섞이면 안 된다.
  it("형식 오류 메시지에 입력 원문 조각을 담지 않는다", () => {
    const leaky = `<foo SECRET="LEAK_MARKER_QZ" location="file://localhost/Users/dj/x.mp3"/>`;
    try {
      parseRekordboxXml(leaky);
      throw new Error("throw 했어야 한다");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).not.toContain("LEAK_MARKER_QZ");
      expect(msg).not.toContain("file://");
      expect(msg).not.toContain("/Users/");
    }
  });

  // 회귀 방지(핵심): 유효한 DJ_PLAYLISTS 루트 + 빈 COLLECTION은 정상 0곡 유지.
  // 비-Rekordbox(루트 부재)와 "정상이지만 빈" 라이브러리를 구분하는 게 이 수정의 핵심.
  it("유효한 DJ_PLAYLISTS + 빈 COLLECTION은 throw하지 않고 0곡을 반환한다", () => {
    expect(() =>
      parseRekordboxXml(`<DJ_PLAYLISTS><COLLECTION Entries="0"></COLLECTION></DJ_PLAYLISTS>`),
    ).not.toThrow();
    const { tracks, warnings } = parseRekordboxXml(
      `<DJ_PLAYLISTS><COLLECTION Entries="0"></COLLECTION></DJ_PLAYLISTS>`,
    );
    expect(tracks).toEqual([]);
    expect(warnings.some((w) => w.code === "empty_collection")).toBe(true);
  });

  it("COLLECTION 자체가 없는 DJ_PLAYLISTS도 throw하지 않고 0곡을 반환한다", () => {
    expect(() =>
      parseRekordboxXml(`<DJ_PLAYLISTS Version="1.0.0"></DJ_PLAYLISTS>`),
    ).not.toThrow();
    const { tracks } = parseRekordboxXml(
      `<DJ_PLAYLISTS Version="1.0.0"></DJ_PLAYLISTS>`,
    );
    expect(tracks).toEqual([]);
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
