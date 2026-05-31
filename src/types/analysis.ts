// 도메인 타입 — 정본: docs/PRD.md §8

export type AnalysisSession = {
  id: string;
  playlistUrl: string;
  playlistId: string;
  createdAt: string;
  totalTrackCount: number;
  ownedCount: number;
  missingCount: number;
  reviewCount: number;
};
