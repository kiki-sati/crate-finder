// 도메인 타입 — 정본: docs/PRD.md §8

export type TrackStatus = "owned" | "missing" | "needs_review";
export type MatchConfidence = "high" | "medium" | "low";

export type YouTubeTrack = {
  id: string;
  videoId: string;
  rawTitle: string;
  channelTitle?: string;
  publishedAt?: string;
  parsedArtist?: string;
  parsedTitle?: string;
  parseStatus: "parsed" | "needs_review" | "unavailable";
};

export type RekordboxTrack = {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  durationMs?: number;
  location?: string;
  normalizedTitle: string;
  normalizedArtist?: string;
};
