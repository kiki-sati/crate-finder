// 도메인 타입 — 정본: docs/PRD.md §8

export type YouTubePlaylist = {
  id: string;
  playlistId: string;
  title?: string;
  sourceUrl: string;
  itemCount: number;
  loadedAt: string;
};
