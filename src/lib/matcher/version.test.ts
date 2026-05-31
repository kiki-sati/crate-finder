import { describe, it, expect } from "vitest";
import { versionClass, versionsMatch } from "@/lib/matcher/version";

describe("versionClass", () => {
  it("버전 표기가 없으면 original 부류", () => {
    expect(versionClass("strobe")).toBe("original");
  });
  it("(original mix)는 original 부류", () => {
    expect(versionClass("strobe (original mix)")).toBe("original");
  });
  it("리믹스는 remix 부류", () => {
    expect(versionClass("strobe (eric prydz remix)")).toBe("remix");
  });
  it("(extended mix)는 extended 부류", () => {
    expect(versionClass("song (extended mix)")).toBe("extended");
  });
});

describe("versionsMatch", () => {
  it("미표기와 original mix는 같은 부류로 본다", () => {
    expect(versionsMatch("strobe", "strobe (original mix)")).toBe(true);
  });
  it("original과 remix는 다른 부류", () => {
    expect(
      versionsMatch("strobe (original mix)", "strobe (eric prydz remix)"),
    ).toBe(false);
  });
  it("extended와 radio edit은 다른 부류", () => {
    expect(versionsMatch("a (extended mix)", "a (radio edit)")).toBe(false);
  });
});
