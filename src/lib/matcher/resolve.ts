// needs_review 결과의 수동 확정/거부. MatchResult → MatchResult. 순수 함수.
// 매처(match.ts)는 후보(candidates)만 채울 뿐, 사용자가 후보를 골라
// 보유(owned)로 확정하거나 누락(missing)으로 거부하는 변환은 여기서 한다.
// 계층 규칙(CLAUDE.md): components/services/외부 API/환경변수 import 금지.
// 정본: docs/ARCHITECTURE.md §10, docs/PRD.md §8.

import type { MatchResult, MatchCandidate } from "@/types/match";

export type ResolveDecision =
  | { kind: "confirm"; rekordboxTrackId: string }
  | { kind: "reject" };

// 사용자가 후보를 보유곡으로 확정. owned/high/score 1.
// 선택 후보는 manual/score 1로 후보 맨 앞에 두고, 같은 id 중복은 제거한다.
function confirm(result: MatchResult, rekordboxTrackId: string): MatchResult {
  const manual: MatchCandidate = {
    rekordboxTrackId,
    score: 1,
    reason: "manual",
  };
  const rest = result.candidates.filter(
    (c) => c.rekordboxTrackId !== rekordboxTrackId,
  );

  return {
    id: result.id,
    youtubeTrackId: result.youtubeTrackId,
    matchedRekordboxTrackId: rekordboxTrackId,
    status: "owned",
    confidence: "high",
    score: 1,
    candidates: [manual, ...rest],
  };
}

// 사용자가 누락으로 거부. missing/low/score 0.
// 매처의 missing 표현과 일치: matchedRekordboxTrackId 미설정, candidates 비움.
function reject(result: MatchResult): MatchResult {
  return {
    id: result.id,
    youtubeTrackId: result.youtubeTrackId,
    status: "missing",
    confidence: "low",
    score: 0,
    candidates: [],
  };
}

export function resolveMatch(
  result: MatchResult,
  decision: ResolveDecision,
): MatchResult {
  return decision.kind === "confirm"
    ? confirm(result, decision.rekordboxTrackId)
    : reject(result);
}
