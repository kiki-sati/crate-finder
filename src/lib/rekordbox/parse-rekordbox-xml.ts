import { XMLParser } from "fast-xml-parser";
import type { RekordboxTrack } from "@/types/track";
import type { RekordboxParseWarning } from "@/types/api";
import { normalizeTitle, normalizeArtist } from "@/lib/normalizer";

type RawTrack = Record<string, string | undefined>;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

/** Rekordbox XML → 트랙 메타데이터. 원본 문자열은 호출자가 폐기한다. */
export function parseRekordboxXml(xml: string): {
  tracks: RekordboxTrack[];
  warnings: RekordboxParseWarning[];
} {
  const warnings: RekordboxParseWarning[] = [];
  const doc = parser.parse(xml);
  const collection = doc?.DJ_PLAYLISTS?.COLLECTION;
  const rawTracks: RawTrack[] = collection?.TRACK
    ? Array.isArray(collection.TRACK)
      ? collection.TRACK
      : [collection.TRACK]
    : [];

  if (rawTracks.length === 0) {
    warnings.push({
      code: "empty_collection",
      message: "COLLECTION에 TRACK이 없습니다.",
    });
  }

  const tracks: RekordboxTrack[] = rawTracks.map((t) => {
    const id = t.TrackID ?? "";
    const title = t.Name ?? "";
    const artist = t.Artist?.trim() ? t.Artist : undefined;
    const totalTime = t.TotalTime ? Number(t.TotalTime) : undefined;
    if (!artist) {
      warnings.push({
        code: "missing_artist",
        message: "아티스트 정보가 없는 트랙",
        trackId: id,
      });
    }
    return {
      id,
      title,
      artist,
      album: t.Album?.trim() ? t.Album : undefined,
      durationMs:
        totalTime !== undefined && !Number.isNaN(totalTime)
          ? totalTime * 1000
          : undefined,
      location: t.Location,
      normalizedTitle: normalizeTitle(title),
      normalizedArtist: normalizeArtist(artist),
    };
  });

  return { tracks, warnings };
}
