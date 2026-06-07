import { describe, it, expect } from "vitest";
import { validateXmlFile, MAX_XML_BYTES } from "@/lib/rekordbox/validate-xml-file";
import { InvalidXmlFileError } from "@/lib/rekordbox/rekordbox-errors";

describe("validateXmlFile", () => {
  it("정상 .xml 파일은 통과한다(반환 없음)", () => {
    expect(validateXmlFile({ name: "library.xml", size: 1024 })).toBeUndefined();
  });
  it("대문자 확장자도 허용한다", () => {
    expect(validateXmlFile({ name: "LIB.XML", size: 10 })).toBeUndefined();
  });
  it(".xml이 아니면 invalid_extension", () => {
    expect(() => validateXmlFile({ name: "a.txt", size: 10 })).toThrow(
      InvalidXmlFileError,
    );
  });
  it("빈 파일은 empty_file", () => {
    expect(() => validateXmlFile({ name: "a.xml", size: 0 })).toThrow(
      /empty/i,
    );
  });
  it("최대 크기 초과는 file_too_large", () => {
    expect(() =>
      validateXmlFile({ name: "a.xml", size: MAX_XML_BYTES + 1 }),
    ).toThrow(/too large|초과|larg/i);
  });
});
