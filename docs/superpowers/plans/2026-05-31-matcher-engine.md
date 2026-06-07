# Matcher 엔진 lib Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** YouTube 트랙과 Rekordbox 라이브러리를 비교해 `MatchResult[]`를 만드는 순수 함수 매칭 엔진을 `src/lib/matcher/`에 구현한다.

**Architecture:** 4개 순수 모듈로 분리 — `similarity`(Dice 계수), `version`(버전 부류 비교), `matcher-config`(상수), `match`(엔진). 1차는 Map 인덱스로 정확일치, 2차는 Dice 가중합 유사도. 버전 부류가 다르면 owned로 못 올리고 needs_review로 강등한다.

**Tech Stack:** TypeScript strict, Vitest 4. 외부 의존성 0.

**Spec:** `docs/superpowers/specs/2026-05-31-matcher-engine-design.md`

**Branch:** `chore/contract-foundation`에서 `feature/matcher` 분기. 시작 전:
```bash
git checkout chore/contract-foundation && git checkout -b feature/matcher
```

**테스트 실행 규칙:** 단일 파일은 `npm run test -- <path>`, 전체는 `npm run test`, 최종 검증은 `bash scripts/verify.sh`.

---

### Task 1: similarity.ts — bigram Dice 계수

**Files:**
- Create: `src/lib/matcher/similarity.ts`
- Test: `src/lib/matcher/similarity.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/matcher/similarity.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { diceCoefficient } from "@/lib/matcher/similarity";

describe("diceCoefficient", () => {
  it("동일 문자열은 1을 반환한다", () => {
    expect(diceCoefficient("strobe", "strobe")).toBe(1);
  });

  it("완전히 다른 문자열은 0을 반환한다", () => {
    expect(diceCoefficient("abc", "xyz")).toBe(0);
  });

  it("한 글자 이하 비교는 동일하면 1, 다르면 0", () => {
    expect(diceCoefficient("a", "a")).toBe(1);
    expect(diceCoefficient("a", "b")).toBe(0);
    expect(diceCoefficient("", "")).toBe(1);
  });

  it("오타가 하나 있으면 0.8 이상의 높은 유사도", () => {
    // "strobe"(st,tr,ro,ob,be) vs "strob"(st,tr,ro,ob) → 2*4/(5+4)=0.888
    expect(diceCoefficient("strobe", "strob")).toBeGreaterThan(0.8);
  });

  it("대칭이다: dice(a,b) === dice(b,a)", () => {
    expect(diceCoefficient("night", "nacht")).toBe(
      diceCoefficient("nacht", "night"),
    );
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- src/lib/matcher/similarity.test.ts`
Expected: FAIL — "diceCoefficient is not a function" / 모듈 없음.

- [ ] **Step 3: 최소 구현**

`src/lib/matcher/similarity.ts`:
```ts
// 문자 bigram Dice 계수 — 두 문자열의 유사도(0~1). 순수 함수.
// 외부/컴포넌트 의존 금지(CLAUDE.md 계층 규칙).

function bigrams(s: string): string[] {
  const grams: string[] = [];
  for (let i = 0; i < s.length - 1; i++) grams.push(s.slice(i, i + 2));
  return grams;
}

export function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const aGrams = bigrams(a);
  const bGrams = bigrams(b);

  const bCounts = new Map<string, number>();
  for (const g of bGrams) bCounts.set(g, (bCounts.get(g) ?? 0) + 1);

  let intersection = 0;
  for (const g of aGrams) {
    const c = bCounts.get(g) ?? 0;
    if (c > 0) {
      intersection++;
      bCounts.set(g, c - 1);
    }
  }

  return (2 * intersection) / (aGrams.length + bGrams.length);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -- src/lib/matcher/similarity.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/matcher/similarity.ts src/lib/matcher/similarity.test.ts
git commit -m "feat(matcher): add bigram dice similarity"
```

---

### Task 2: version.ts — 버전 부류 추출·비교

**Files:**
- Create: `src/lib/matcher/version.ts`
- Test: `src/lib/matcher/version.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/matcher/version.test.ts`:
```ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- src/lib/matcher/version.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 최소 구현**

`src/lib/matcher/version.ts`:
```ts
// 제목에서 버전 부류를 판정하고 비교한다. 순수 함수.
// 입력은 normalizer로 정규화된(소문자, 괄호 통일) 제목을 가정한다.
// 미표기·(original mix)는 모두 "original" 부류로 본다.

// 우선순위 순서대로 매칭 — 먼저 걸리는 키워드가 부류를 결정한다.
const VERSION_CLASS_RULES: ReadonlyArray<readonly [string, string]> = [
  ["remix", "remix"],
  ["bootleg", "remix"],
  ["rework", "remix"],
  ["mashup", "remix"],
  ["vip", "remix"],
  ["extended", "extended"],
  ["club", "extended"],
  ["instrumental", "instrumental"],
  ["acapella", "acapella"],
  ["dub", "dub"],
  ["radio", "radio"],
  ["edit", "edit"],
  ["original", "original"],
];

const PAREN_PATTERN = /\(([^)]*)\)/g;

// 제목 안 모든 괄호 절을 모아 하나의 문자열로.
function parenContent(normalizedTitle: string): string {
  const segments: string[] = [];
  const re = new RegExp(PAREN_PATTERN);
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalizedTitle)) !== null) segments.push(m[1]);
  return segments.join(" ");
}

export function versionClass(normalizedTitle: string): string {
  const content = parenContent(normalizedTitle);
  for (const [keyword, cls] of VERSION_CLASS_RULES) {
    if (content.includes(keyword)) return cls;
  }
  return "original";
}

export function versionsMatch(a: string, b: string): boolean {
  return versionClass(a) === versionClass(b);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -- src/lib/matcher/version.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/matcher/version.ts src/lib/matcher/version.test.ts
git commit -m "feat(matcher): add version-class comparison"
```

---

### Task 3: matcher-config.ts — 튜닝 상수

**Files:**
- Create: `src/lib/matcher/matcher-config.ts`
- Test: `src/lib/matcher/matcher-config.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/matcher/matcher-config.test.ts`:
```ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- src/lib/matcher/matcher-config.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 최소 구현**

`src/lib/matcher/matcher-config.ts`:
```ts
// 매칭 엔진 튜닝 상수 한 곳. 정본: docs/ARCHITECTURE.md §10.4.
// 임계값은 테스트 데이터 축적 후 조정한다.

export const TITLE_WEIGHT = 0.65;
export const ARTIST_WEIGHT = 0.35;
export const MAX_CANDIDATES = 3;

// 점수 → status/confidence 임계값
export const OWNED_MIN = 0.95; // ≥ → owned/high
export const REVIEW_MID_MIN = 0.75; // ≥ → needs_review/medium
export const REVIEW_LOW_MIN = 0.55; // ≥ → needs_review/low ; < → missing/low
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -- src/lib/matcher/matcher-config.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/matcher/matcher-config.ts src/lib/matcher/matcher-config.test.ts
git commit -m "feat(matcher): add tuning constants"
```

---

### Task 4: match.ts — 매칭 엔진

**Files:**
- Create: `src/lib/matcher/match.ts`
- Test: `src/lib/matcher/match.test.ts`

의존: Task 1·2·3 + 기존 `src/lib/normalizer.ts`, `src/types/track.ts`, `src/types/match.ts`.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/matcher/match.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import type { YouTubeTrack, RekordboxTrack } from "@/types/track";
import { matchTracks } from "@/lib/matcher/match";

function rb(partial: Partial<RekordboxTrack> & { id: string }): RekordboxTrack {
  return {
    title: "",
    normalizedTitle: "",
    ...partial,
  };
}
function yt(partial: Partial<YouTubeTrack> & { id: string }): YouTubeTrack {
  return {
    videoId: "v_" + partial.id,
    rawTitle: "",
    parseStatus: "parsed",
    ...partial,
  };
}

const library: RekordboxTrack[] = [
  rb({
    id: "rb_strobe",
    title: "Strobe",
    artist: "deadmau5",
    normalizedTitle: "strobe",
    normalizedArtist: "deadmau5",
  }),
  rb({
    id: "rb_strobe_remix",
    title: "Strobe (Eric Prydz Remix)",
    artist: "deadmau5",
    normalizedTitle: "strobe (eric prydz remix)",
    normalizedArtist: "deadmau5",
  }),
];

describe("matchTracks", () => {
  it("정확일치는 owned/high/exact", () => {
    const [r] = matchTracks(
      [yt({ id: "1", parsedArtist: "deadmau5", parsedTitle: "Strobe" })],
      library,
    );
    expect(r.status).toBe("owned");
    expect(r.confidence).toBe("high");
    expect(r.matchedRekordboxTrackId).toBe("rb_strobe");
    expect(r.candidates[0].reason).toBe("exact");
  });

  it("리믹스는 원곡 후보로 owned 직행하지 않는다(버전 가드)", () => {
    // 플레이리스트는 remix, 라이브러리 최고 후보는 original("strobe")
    const onlyOriginal: RekordboxTrack[] = [library[0]];
    const [r] = matchTracks(
      [
        yt({
          id: "2",
          parsedArtist: "deadmau5",
          parsedTitle: "Strobe (Eric Prydz Remix)",
        }),
      ],
      onlyOriginal,
    );
    expect(r.status).not.toBe("owned");
  });

  it("아티스트 없는 트랙은 title-only(reason=similar_title)", () => {
    const [r] = matchTracks(
      [yt({ id: "3", parsedTitle: "Strobe" })],
      [library[0]],
    );
    // 같은 제목이지만 아티스트 정보가 없음 → 정확일치 키도 다름("|strobe")
    expect(r.candidates[0].reason).toBe("similar_title");
  });

  it("후보가 모두 낮으면 missing/low, 후보 비움", () => {
    const [r] = matchTracks(
      [yt({ id: "4", parsedArtist: "nobody", parsedTitle: "zzzzzzzz" })],
      library,
    );
    expect(r.status).toBe("missing");
    expect(r.confidence).toBe("low");
    expect(r.candidates).toEqual([]);
    expect(r.matchedRekordboxTrackId).toBeUndefined();
  });

  it("파싱 불가(unavailable) 트랙은 needs_review, 매칭 불가", () => {
    const [r] = matchTracks(
      [yt({ id: "5", parseStatus: "unavailable" })],
      library,
    );
    expect(r.status).toBe("needs_review");
    expect(r.candidates).toEqual([]);
    expect(r.matchedRekordboxTrackId).toBeUndefined();
  });

  it("YouTube 트랙 수만큼 결과를 반환한다", () => {
    const results = matchTracks(
      [
        yt({ id: "a", parsedArtist: "deadmau5", parsedTitle: "Strobe" }),
        yt({ id: "b", parseStatus: "unavailable" }),
      ],
      library,
    );
    expect(results).toHaveLength(2);
  });

  it("후보는 최대 3개로 제한한다", () => {
    const many: RekordboxTrack[] = Array.from({ length: 5 }, (_, i) =>
      rb({
        id: `m${i}`,
        title: "strobe",
        normalizedTitle: "strobe",
        normalizedArtist: "deadmau5",
        artist: "deadmau5",
      }),
    );
    const [r] = matchTracks(
      [yt({ id: "x", parsedArtist: "deadmau5", parsedTitle: "strob" })],
      many,
    );
    expect(r.candidates.length).toBeLessThanOrEqual(3);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- src/lib/matcher/match.test.ts`
Expected: FAIL — `matchTracks` 없음.

- [ ] **Step 3: 최소 구현**

`src/lib/matcher/match.ts`:
```ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -- src/lib/matcher/match.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/matcher/match.ts src/lib/matcher/match.test.ts
git commit -m "feat(matcher): add matching engine (exact + similarity + version guard)"
```

---

### Task 5: 공유 mock 기반 통합 sanity 테스트

**Files:**
- Test: `src/lib/matcher/match.integration.test.ts`

기존 `src/mocks/sample-data.ts`의 입력으로 엔진이 합리적 결과를 내는지 구조적으로 검증. (정규화 구두점 처리 등 세부에 의존하지 않는 안정적 단언만.)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/matcher/match.integration.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  sampleYouTubeTracks,
  sampleRekordboxTracks,
} from "@/mocks/sample-data";
import { matchTracks } from "@/lib/matcher/match";

describe("matchTracks (sample-data 통합)", () => {
  const results = matchTracks(sampleYouTubeTracks, sampleRekordboxTracks);

  it("YouTube 트랙 수만큼 결과를 낸다", () => {
    expect(results).toHaveLength(sampleYouTubeTracks.length);
  });

  it("yt_1(Daft Punk - One More Time)은 정확일치 owned", () => {
    const r = results.find((x) => x.youtubeTrackId === "yt_1")!;
    expect(r.status).toBe("owned");
    expect(r.confidence).toBe("high");
    expect(r.matchedRekordboxTrackId).toBe("rb_1");
  });

  it("파싱 불가/검토필요 트랙(yt_3, yt_4)은 needs_review, 매칭 id 없음", () => {
    for (const id of ["yt_3", "yt_4"]) {
      const r = results.find((x) => x.youtubeTrackId === id)!;
      expect(r.status).toBe("needs_review");
      expect(r.matchedRekordboxTrackId).toBeUndefined();
      expect(r.candidates).toEqual([]);
    }
  });

  it("모든 결과는 유효한 status/confidence를 가진다", () => {
    const statuses = ["owned", "missing", "needs_review"];
    const confidences = ["high", "medium", "low"];
    for (const r of results) {
      expect(statuses).toContain(r.status);
      expect(confidences).toContain(r.confidence);
    }
  });
});
```

- [ ] **Step 2: 테스트 실행 확인**

Run: `npm run test -- src/lib/matcher/match.integration.test.ts`
Expected: PASS (4 tests). 만약 yt_1이 owned가 아니면 정규화/인덱스 키를 디버그(buildMatchKey 결과를 console로 확인).

- [ ] **Step 3: 커밋**

```bash
git add src/lib/matcher/match.integration.test.ts
git commit -m "test(matcher): add sample-data integration sanity check"
```

---

### Task 6: 최종 검증 & push

- [ ] **Step 1: 전체 검증**

Run: `bash scripts/verify.sh`
Expected: lint → build → test 모두 PASS.

- [ ] **Step 2: push**

```bash
git push -u origin feature/matcher
```

PR은 `chore/contract-foundation`을 base로 생성(stacked). 사용자 승인 전 merge 금지.

---

## 완료 기준 (Spec AC)

- [ ] `src/lib/matcher/`에 4개 모듈 + 테스트 존재
- [ ] `bash scripts/verify.sh` 통과
- [ ] `matchTracks(sample…)`가 owned/needs_review를 합리적으로 분류
- [ ] 기존 테스트 무회귀
