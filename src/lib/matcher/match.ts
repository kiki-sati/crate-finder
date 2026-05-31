// 매칭 엔진. YouTubeTrack[] × RekordboxTrack[] → MatchResult[]. 순수 함수.
// 계층 규칙(CLAUDE.md): components/services/외부 API/환경변수 import 금지.
// 정본: docs/ARCHITECTURE.md §10.

import type {
  YouTubeTrack,
  RekordboxTrack,
  TrackStatus,
  MatchConfidence,
} from "@/types/track";
import type { MatchResult, MatchCandidate } from "@/types/match";
import {
  normalizeArtist,
  normalizeTitle,
  buildMatchKey,
} from "@/lib/normalizer";
import { diceCoefficient } from "@/lib/matcher/similarity";
import { versionsMatch } from "@/lib/matcher/version";
import {
  TITLE_WEIGHT,
  ARTIST_WEIGHT,
  MAX_CANDIDATES,
  OWNED_MIN,
  REVIEW_MID_MIN,
  REVIEW_LOW_MIN,
} from "@/lib/matcher/matcher-config";

// 정확일치 인덱스. key = `${normArtist??""}|${normTitle}`. 선착순 보존.
export function buildRekordboxIndex(
  tracks: RekordboxTrack[],
): Map<string, RekordboxTrack> {
  const index = new Map<string, RekordboxTrack>();
  for (const t of tracks) {
    const key = `${t.normalizedArtist ?? ""}|${t.normalizedTitle}`;
    if (!index.has(key)) index.set(key, t);
  }
  return index;
}

function scoreToStatus(score: number): {
  status: TrackStatus;
  confidence: MatchConfidence;
} {
  if (score >= OWNED_MIN) return { status: "owned", confidence: "high" };
  if (score >= REVIEW_MID_MIN)
    return { status: "needs_review", confidence: "medium" };
  if (score >= REVIEW_LOW_MIN)
    return { status: "needs_review", confidence: "low" };
  return { status: "missing", confidence: "low" };
}

export function matchTrack(
  yt: YouTubeTrack,
  rbTracks: RekordboxTrack[],
  rbIndex: Map<string, RekordboxTrack>,
): MatchResult {
  const base = { id: `match_${yt.id}`, youtubeTrackId: yt.id };

  // 1. 파싱 불가 → 매칭 불가(애매하면 needs_review)
  if (!yt.parsedTitle || yt.parseStatus === "unavailable") {
    return {
      ...base,
      status: "needs_review",
      confidence: "low",
      score: 0,
      candidates: [],
    };
  }

  const ytTitle = normalizeTitle(yt.parsedTitle);
  const ytArtist = normalizeArtist(yt.parsedArtist);

  // 2. 1차 정확일치
  const exact = rbIndex.get(buildMatchKey(yt.parsedArtist, yt.parsedTitle));
  if (exact) {
    return {
      ...base,
      matchedRekordboxTrackId: exact.id,
      status: "owned",
      confidence: "high",
      score: 1,
      candidates: [{ rekordboxTrackId: exact.id, score: 1, reason: "exact" }],
    };
  }

  // 3. 2차 유사도
  const hasArtist = ytArtist !== undefined;
  const scored = rbTracks.map((rb) => {
    const titleSim = diceCoefficient(ytTitle, rb.normalizedTitle);
    let score: number;
    let reason: MatchCandidate["reason"];
    if (hasArtist && rb.normalizedArtist) {
      const artistSim = diceCoefficient(ytArtist!, rb.normalizedArtist);
      score = TITLE_WEIGHT * titleSim + ARTIST_WEIGHT * artistSim;
      reason = "similar_title_artist";
    } else {
      score = titleSim;
      reason = "similar_title";
    }
    return { rb, score, reason };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, MAX_CANDIDATES);

  if (top.length === 0) {
    return {
      ...base,
      status: "missing",
      confidence: "low",
      score: 0,
      candidates: [],
    };
  }

  const best = top[0];
  let { status, confidence } = scoreToStatus(best.score);

  // 4. 버전 가드: owned 인데 버전 부류가 다르면 강등
  if (status === "owned" && !versionsMatch(ytTitle, best.rb.normalizedTitle)) {
    status = "needs_review";
    confidence = "medium";
  }

  // missing 이면 신뢰할 후보 없음 → 후보 비우고 매칭 id 미설정
  if (status === "missing") {
    return {
      ...base,
      status,
      confidence,
      score: best.score,
      candidates: [],
    };
  }

  const candidates: MatchCandidate[] = top.map((s) => ({
    rekordboxTrackId: s.rb.id,
    score: s.score,
    reason: s.reason,
  }));

  return {
    ...base,
    matchedRekordboxTrackId: best.rb.id,
    status,
    confidence,
    score: best.score,
    candidates,
  };
}

export function matchTracks(
  ytTracks: YouTubeTrack[],
  rbTracks: RekordboxTrack[],
): MatchResult[] {
  const rbIndex = buildRekordboxIndex(rbTracks);
  return ytTracks.map((yt) => matchTrack(yt, rbTracks, rbIndex));
}
