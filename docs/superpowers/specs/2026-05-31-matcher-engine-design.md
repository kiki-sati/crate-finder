# Matcher 엔진 lib — 설계 (Spec)

- 작성일: 2026-05-31
- 상태: 승인됨 (brainstorming)
- 트랙: **BE** (`feature/matcher`). 병렬 트랙 — UI 트랙(`2026-05-31-analysis-flow-ui-design.md`)과 별도 PR.
- 베이스: `chore/contract-foundation` (계약 동결: `src/types/*`, `src/mocks/sample-data.ts`) 위에 stack.
- 관련 문서: `docs/ARCHITECTURE.md` §10·§13·§19(Phase 3), `docs/PRD.md` §8, `CLAUDE.md`(Domain Invariants·계층 규칙)

## 1. 배경 / 목적

Phase 2(Ingestion)와 Phase 4(UI)는 완료됐지만, 둘을 잇는 **매칭 엔진이 비어 있다**. 현재 결과 UI는 `src/mocks/sample-data.ts`의 고정 `MatchResult[]`에 물려 동작한다.

이 트랙의 목적은 **MVP 최우선 #2(유튜브↔Rekordbox 정확 비교)의 핵심 엔진**을 순수 함수 lib로 구현하는 것이다. 입력은 `YouTubeTrack[]`·`RekordboxTrack[]`, 출력은 `MatchResult[]`이다.

## 2. 범위

### 포함
- `src/lib/matcher/similarity.ts` — bigram Dice 계수 (순수 문자열 수학)
- `src/lib/matcher/version.ts` — 버전/리믹스 태그 추출·비교
- `src/lib/matcher/match.ts` — `matchTrack`(1건)·`matchTracks`(배열) 엔진
- `src/lib/matcher/matcher-config.ts` — 가중치·임계값 상수
- 각 파일 TDD 테스트 (`*.test.ts`)

### 제외 (다음 단계 / 별도)
- service·UI 연결, `/api/analysis` 라우트 (통합 PR)
- 수동 매칭(manual) 구조 (별도 — MVP 포함 여부 추후 확인)
- 길이/duration 유사도 (YouTubeTrack에 duration 필드 없음 → MVP 제외)
- 사전 필터링/인덱싱 최적화 (성능 한계는 주석으로 명기)

## 3. 확정된 결정

| 항목 | 결정 | 근거 |
|---|---|---|
| 범위 | 매칭 엔진 lib만 | CLAUDE.md "한 step = 한 레이어" / 순수 함수 TDD 최적 |
| 유사도 알고리즘 | bigram Dice + 가중합 | 외부 의존성 0, 오타·어순에 강함, 구현·테스트 단순 |
| 가중치 | title 0.65 / artist 0.35 | YouTube 파싱 아티스트가 더 노이즈 많음 (상수로 튜닝 가능) |
| Remix/Version 불일치 | **강제 needs_review로 강등** | DJ에겐 다른 파일 — 거짓 owned 방지. CLAUDE.md "애매하면 needs_review" |
| 신뢰도 임계값 | ARCHITECTURE §10.4 초안 채택 | 정본. 상수로 추후 튜닝 |
| 후보 수 | top-3 | 결과 UI·수동 매칭 후보 노출에 충분 |

## 4. 입력 / 출력 계약 (동결된 타입)

```ts
// src/types/track.ts
YouTubeTrack  = { id, videoId, rawTitle, parsedArtist?, parsedTitle?, parseStatus, ... }
RekordboxTrack = { id, title, artist?, normalizedTitle, normalizedArtist?, durationMs?, ... }

// src/types/match.ts  ← 출력
MatchResult = { id, youtubeTrackId, matchedRekordboxTrackId?, status, confidence, score, candidates[] }
MatchCandidate = { rekordboxTrackId, score, reason: "exact"|"similar_title_artist"|"similar_title"|"manual" }
```

- `RekordboxTrack`은 `normalizedTitle`/`normalizedArtist`를 **이미 보유** → 재정규화 불필요.
- `YouTubeTrack`은 정규화 필드 없음 → 매칭 시점에 `src/lib/normalizer.ts`(`normalizeTitle`/`normalizeArtist`/`buildMatchKey`)로 정규화.
- `normalizeTitle`은 feat 절만 제거하고 **버전 괄호(Original/Extended Mix 등)는 보존** → 버전이 다르면 정규화 key가 달라져 1차 정확일치엔 안 걸림. 버전 가드는 **2차 유사도 단계에서만** 작동.

## 5. 알고리즘 흐름 (YouTube 트랙 1건당)

```txt
1. parsedTitle 없음 또는 parseStatus="unavailable"
     → status=needs_review, confidence=low, candidates=[], matchedRekordboxTrackId=undefined (매칭 불가)
2. ytKey = buildMatchKey(parsedArtist, parsedTitle)
3. [1차] Rekordbox 인덱스(Map<key, RekordboxTrack[]>) 조회
     hit → owned / high / reason=exact  (버전은 key에 포함돼 자동 보장)
4. [2차] miss → 라이브러리 전체 스캔
     score = 0.65·dice(ytTitle, rbNormTitle) + 0.35·dice(ytArtist, rbNormArtist)
       (ytArtist 없으면 title-only, reason=similar_title)
     top-3 후보 보관 (score 내림차순)
5. [버전 가드] 최고 후보의 versionTag 가 ytTitle 의 versionTag 와 다르면
     → owned 조건이어도 needs_review 로 강등
6. score → status/confidence (§6)
```

## 6. 점수 → status / confidence (ARCHITECTURE §10.4)

| Score | Confidence | Status |
|---|---|---|
| ≥ 0.95 | high | owned |
| ≥ 0.75 | medium | needs_review |
| ≥ 0.55 | low | needs_review |
| < 0.55 | low | missing |

- 버전 불일치 override: owned 조건이어도 needs_review 강등 (reason은 similar_* 유지).
- `reason`: 양쪽(artist+title) 사용 시 `similar_title_artist`, 아티스트 없을 때 `similar_title`, 1차 정확일치 시 `exact`.
- `matchedRekordboxTrackId`: owned·needs_review일 때 최고 후보 id, missing이면 undefined.

## 7. 버전 태그 (`version.ts`)

- 추출 대상 키워드(예): `original`, `extended`, `radio`, `club`, `dub`, `instrumental`, `acapella`, `vip`, `edit`, `remix`(+ 리믹서명), `mix`, `bootleg`, `rework`.
- `extractVersionTag(title)`: 정규화된 제목에서 버전 절을 식별해 정규화된 태그 문자열(없으면 `""`) 반환.
- `versionsMatch(a, b)`: 두 태그가 같은 버전 부류인지. 둘 다 `""`(미표기)면 일치로 간주.
- 정확한 키워드 목록은 테스트 데이터로 보강(상수 한 곳 관리).

## 8. 성능

- O(N×M) 전체 스캔 (N=플레이리스트, M=라이브러리). MVP 규모(N~100, M~수천)에서 충분.
- 1차 정확일치는 Map 인덱스로 O(1) 조회 → 다수 케이스를 2차 스캔 전에 처리.
- 사전 필터링(첫 글자/토큰 버킷)은 후순위 — 코드 주석으로 한계 명기.

## 9. 테스트 케이스 (TDD, 테스트 먼저)

- 정확일치 → owned/high/exact
- feat만 다른 경우(`A (feat. B)` vs `A`) → 여전히 정확일치 (normalizer가 feat 제거)
- 버전 불일치(`(Original Mix)` vs `(XXX Remix)`) → 고점수여도 needs_review 강등
- 오타 유사(`Strobe` vs `Strob`) → 점수 기반 needs_review
- 아티스트 없는 YouTube 트랙 → title-only, reason=similar_title
- 무매칭(라이브러리에 후보 없음) → missing/low/candidates=[]
- parseStatus="unavailable"/parsedTitle 없음 → needs_review, 매칭 불가
- 후보 정렬·top-3 절단
- `similarity.ts`: 동일 문자열=1, 무관=0, 대칭성, 빈 문자열 처리
- `version.ts`: 태그 추출·미표기 처리·부류 비교

## 10. 계층/보안 규칙 (CLAUDE.md)

- `src/lib/matcher/`는 순수 함수만. `components`·`services`·외부 API·환경변수 import 금지.
- 로그에 XML 원문·파일 경로 노출 금지(엔진은 트랙 메타데이터만 다룸).
- Domain Invariants 불변: 불확실 항목을 억지로 owned 처리하지 않는다(애매 → needs_review).

## 11. 산출물 / AC

- `bash scripts/verify.sh` 통과 (lint → build → test).
- `matchTracks(sampleYouTubeTracks, sampleRekordboxTracks)`가 합리적 `MatchResult[]` 생성(샘플 기준 owned/needs_review/missing 분포 확인).
- 신규 테스트 모두 통과, 기존 테스트 무회귀.
