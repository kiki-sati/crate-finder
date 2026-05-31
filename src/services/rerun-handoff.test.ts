import { describe, it, expect, beforeEach } from "vitest";
import { setRerunUrl, takeRerunUrl } from "@/services/rerun-handoff";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("rerun-handoff", () => {
  it("비어 있으면 null", () => {
    expect(takeRerunUrl()).toBeNull();
  });

  it("set한 url을 take로 1회만 소비한다", () => {
    setRerunUrl("https://yt/p?list=PL1");
    expect(takeRerunUrl()).toBe("https://yt/p?list=PL1");
    expect(takeRerunUrl()).toBeNull();
  });
});
