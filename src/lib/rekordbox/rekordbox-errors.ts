// src/lib/rekordbox/rekordbox-errors.ts
export class InvalidXmlFileError extends Error {
  constructor(
    readonly code: "invalid_extension" | "file_too_large" | "empty_file",
    message: string,
  ) {
    super(message);
    this.name = "InvalidXmlFileError";
  }
}
