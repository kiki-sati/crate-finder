import type { RekordboxParseResponse } from "@/types/api";
import { validateXmlFile } from "@/lib/rekordbox/validate-xml-file";
import { parseRekordboxXml } from "@/lib/rekordbox/parse-rekordbox-xml";

/** 업로드 메타 검증 → XML 파싱 → 응답 조립. 원본 xml은 반환/저장하지 않는다. */
export function parseUploadedXml(
  file: { name: string; size: number },
  xml: string,
): RekordboxParseResponse {
  validateXmlFile(file);
  const { tracks, warnings } = parseRekordboxXml(xml);
  return { trackCount: tracks.length, tracks, warnings };
}
