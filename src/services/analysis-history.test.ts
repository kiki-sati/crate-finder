import { describe, it, expect, beforeEach } from "vitest";
import {
  listSessions,
  addSession,
  deleteSession,
  clearSessions,
} from "@/services/analysis-history";

const base = {
  playlistUrl: "https://yt/p",
  playlistId: "p",
  totalTrackCount: 3,
  ownedCount: 1,
  missingCount: 1,
  reviewCount: 1,
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("analysis-history", () => {
  it("초기에는 빈 목록", () => {
    expect(listSessions()).toEqual([]);
  });

  it("add한 세션을 최신순으로 반환하고 id/createdAt을 채운다", () => {
    const a = addSession({ ...base, playlistUrl: "url-a" });
    addSession({ ...base, playlistUrl: "url-b" });
    expect(typeof a.id).toBe("string");
    expect(a.id.length).toBeGreaterThan(0);
    expect(typeof a.createdAt).toBe("string");
    expect(listSessions().map((s) => s.playlistUrl)).toEqual(["url-b", "url-a"]);
  });

  it("최대 20건만 유지하고 가장 오래된 것을 제거한다", () => {
    for (let i = 0; i < 21; i++) {
      addSession({ ...base, playlistUrl: `url-${i}` });
    }
    const list = listSessions();
    expect(list).toHaveLength(20);
    expect(list.some((s) => s.playlistUrl === "url-0")).toBe(false);
    expect(list.some((s) => s.playlistUrl === "url-20")).toBe(true);
  });

  it("deleteSession은 해당 id만 제거한다", () => {
    const a = addSession({ ...base, playlistUrl: "url-a" });
    const b = addSession({ ...base, playlistUrl: "url-b" });
    deleteSession(a.id);
    expect(listSessions().map((s) => s.id)).toEqual([b.id]);
  });

  it("clearSessions는 전체를 제거한다", () => {
    addSession(base);
    addSession(base);
    clearSessions();
    expect(listSessions()).toEqual([]);
  });

  it("손상된 JSON이면 빈 목록을 반환한다", () => {
    window.localStorage.setItem("crate-finder:history", "{not json");
    expect(listSessions()).toEqual([]);
  });
});
