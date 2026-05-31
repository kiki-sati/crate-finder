import { InvalidXmlFileError } from "@/lib/rekordbox/rekordbox-errors";

export const MAX_XML_BYTES = 20 * 1024 * 1024; // 20MB

/** 업로드 XML 파일의 확장자/크기를 검증한다. 위반 시 InvalidXmlFileError. */
export function validateXmlFile(file: { name: string; size: number }): void {
  if (!/\.xml$/i.test(file.name)) {
    throw new InvalidXmlFileError(
      "invalid_extension",
      ".xml 파일만 업로드할 수 있습니다.",
    );
  }
  if (file.size <= 0) {
    throw new InvalidXmlFileError("empty_file", "빈 파일입니다(empty file).");
  }
  if (file.size > MAX_XML_BYTES) {
    throw new InvalidXmlFileError(
      "file_too_large",
      "파일 크기가 최대 20MB를 초과했습니다.",
    );
  }
}
