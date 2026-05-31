import { describe, it, expect } from "vitest";
import { parseUploadedXml } from "@/services/rekordbox.service";

const XML = `<DJ_PLAYLISTS><COLLECTION Entries="1"><TRACK TrackID="1" Name="A" Artist="B" TotalTime="100"/></COLLECTION></DJ_PLAYLISTS>`;

describe("parseUploadedXml", () => {
  it("검증 통과 후 파싱하여 RekordboxParseResponse를 만든다", () => {
    const res = parseUploadedXml({ name: "lib.xml", size: XML.length }, XML);
    expect(res.trackCount).toBe(1);
    expect(res.tracks[0].title).toBe("A");
    expect(Array.isArray(res.warnings)).toBe(true);
  });
  it("검증 실패 시 예외를 전파한다", () => {
    expect(() =>
      parseUploadedXml({ name: "bad.txt", size: 10 }, XML),
    ).toThrow();
  });
});
