// 도메인 타입 — 정본: docs/PRD.md §8

import type { TrackStatus, MatchConfidence } from "@/types/track";

export type MatchCandidate = {
  rekordboxTrackId: string;
  score: number;
  reason: "exact" | "similar_title_artist" | "similar_title" | "manual";
};

export type MatchResult = {
  id: string;
  youtubeTrackId: string;
  matchedRekordboxTrackId?: string;
  status: TrackStatus;
  confidence: MatchConfidence;
  score: number;
  candidates: MatchCandidate[];
};
