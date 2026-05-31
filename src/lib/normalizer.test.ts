import { describe, it, expect } from "vitest";

import { normalizeString } from "@/lib/normalizer";

describe("normalizeString", () => {
  it("앞뒤 공백을 제거하고 소문자로 변환한다", () => {
    expect(normalizeString("  Hello World  ")).toBe("hello world");
  });
});
