import { describe, it, expect } from "vitest";
import {
  TITLE_WEIGHT,
  ARTIST_WEIGHT,
  MAX_CANDIDATES,
  OWNED_MIN,
  REVIEW_MID_MIN,
  REVIEW_LOW_MIN,
} from "@/lib/matcher/matcher-config";

describe("matcher-config", () => {
  it("title/artist 가중치 합은 1", () => {
    expect(TITLE_WEIGHT + ARTIST_WEIGHT).toBeCloseTo(1);
  });
  it("임계값은 내림차순(ARCHITECTURE §10.4)", () => {
    expect(OWNED_MIN).toBeGreaterThan(REVIEW_MID_MIN);
    expect(REVIEW_MID_MIN).toBeGreaterThan(REVIEW_LOW_MIN);
  });
  it("후보 수는 3", () => {
    expect(MAX_CANDIDATES).toBe(3);
  });
});
