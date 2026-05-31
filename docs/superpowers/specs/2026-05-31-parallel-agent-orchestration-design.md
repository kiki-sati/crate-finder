# 설계: BE/FE 병렬 에이전트 오케스트레이션

- 날짜: 2026-05-31
- 상태: 승인 대기 (브레인스토밍 산출물)
- 베이스 브랜치: `chore/freeze-contract` (계약·mock 동결 완료, commit `387b7ad`)

## Context (왜)

`crate-finder`는 Phase 1(스캐폴딩) 완료, 도메인 타입은 `src/types/*`에 정본 확정,
계약(`api.ts` Phase 2 엔드포인트 + `mocks/sample-data.ts`)이 `chore/freeze-contract`에
동결되어 있다. `lib/normalizer.ts`(Phase 3 일부)를 제외하면 `services/`·`components/`·
API 라우트는 비어 있다.

목표: **백엔드(Phase 2 Ingestion)와 프론트엔드(Phase 4 UI)를 진짜 병렬로 동시 실행**해
작업 시간을 최대한 단축한다. 실행 주체는 **이 세션(오케스트레이터)** 이며, 워크트리로
격리한 BE/FE 백그라운드 에이전트 2개를 동시에 돌리고 결과를 조율·통합한다.

## 확정된 결정 (브레인스토밍)

1. **실행 방식**: 오케스트레이터(이 세션)가 `Agent` 백그라운드 2개를 워크트리 격리로 동시 구동.
   참조 스킬: `superpowers:dispatching-parallel-agents`, `superpowers:using-git-worktrees`.
2. **범위**: BE = Phase 2(Ingestion), FE = Phase 4(UI, mock 기반). 매칭 엔진(Phase 3) 실연결 제외.
3. **BE 외부 경계**: YouTube fetch는 **주입 가능한 스텁**(테스트는 mock). 파서·XML 파서는 완전 구현.
   실제 `YOUTUBE_API_KEY` 연동은 P1로 분리.
4. **자율 모델**: **A안(Fire-and-forget)** — 각 에이전트가 트랙 끝까지 자율 실행 + `verify.sh` green.
   단, 아래 §6 4단 가드레일로 A의 단점(늦은 드리프트 발견)을 보완.
5. **분기 베이스**: 두 워크트리 모두 `chore/freeze-contract`에서 분기. 통합 시 한 번에 main PR.

## 1. 토폴로지

```txt
            chore/freeze-contract  (계약·mock 동결, 베이스)
                  │  ← 오케스트레이터가 워크트리 2개 분기
   ┌──────────────┴──────────────┐
worktree-be                  worktree-fe
feature/ingestion            feature/ui-foundation
[BG Agent B]                 [BG Agent F]      ← 동시 자율 실행
lib→services→api (TDD)       tokens→primitives→table (mock)
   └──────────────┬──────────────┘
        오케스트레이터: 회수·독립검증·통합 (→ chore/freeze-contract → main PR)
```

## 2. 트랙 분해

### Agent B — `feature/ingestion` (TDD, 순수 로직 테스트 우선)
- `src/lib/youtube/parse-playlist-url.ts` — URL→playlistId 추출
- `src/lib/youtube/parse-video-title.ts` — rawTitle→{parsedArtist, parsedTitle, parseStatus}.
  애매하면 `parseStatus: "needs_review"`. 케이스: ARCHITECTURE §6.2 Daft Punk 표.
- `src/lib/rekordbox/validate-xml-file.ts` — 크기/확장자 검증
- `src/lib/rekordbox/parse-rekordbox-xml.ts` — XML→`RekordboxTrack[]`, 원본 폐기
- `src/services/youtube.service.ts` — fetch 주입형, `YouTubePlaylistResponse` 반환(실호출 스텁)
- `src/services/rekordbox.service.ts` — validate+parse 조합
- `src/app/api/youtube/playlist/route.ts`, `src/app/api/rekordbox/parse/route.ts`
  — 반환은 `ApiResult<YouTubePlaylistResponse>` / `ApiResult<RekordboxParseResponse>`

### Agent F — `feature/ui-foundation` (mock 기반, 컴포넌트 테스트)
- `src/styles/tokens.css` + `src/styles/globals.css` `@theme` — 디자인 토큰(UI_GUIDE)
- 프리미티브: `AppShell`, `TopMenuBar`, `WindowPanel`, `Button`, `Input`
- 배지: `StatusBadge`(owned/missing/needs_review), `ConfidenceBadge`(high/medium/low)
- 입력: `PlaylistUrlForm`, `FileUploadBox`(XML, 정책 안내)
- 결과: `MatchResultTable`(mock `MatchResult[]` 렌더, 7컬럼), `ResultFilters`
- 페이지 로더: mock 반환 (통합 시 실제 fetch로 교체하는 **단일 스왑 지점**)

## 3. 공유 계약 & 격리 규칙

- **읽기 전용(수정 금지)**: `src/types/*`, `src/mocks/sample-data.ts`.
- **쓰기 영역 분리**:
  - Agent B: `src/lib/`, `src/services/`, `src/app/api/`
  - Agent F: `src/components/`, `src/styles/`, `src/app/page.tsx`·`layout.tsx`
  - 파일 단위로 겹치지 않음 → merge 충돌 ~0 (유일 접점 `app/`도 서로 다른 파일).
- **계층 의존성**: `lib`/`services` → `components` 금지. 컴포넌트에서 파싱/매칭/외부 API 직접 호출 금지.

## 4. 품질 게이트 (Definition of Done)

- 각 에이전트는 종료 전 **`bash scripts/verify.sh` green**(lint→build→test) 필수.
- Agent B: ARCHITECTURE §6.2 케이스 포함 TDD 통과.
- Agent F: 결과 테이블이 mock 데이터로 렌더되는 컴포넌트 테스트 통과.
- 보안: `YOUTUBE_API_KEY` 서버 전용·`NEXT_PUBLIC_` 금지, XML 원문/키를 로그·에러·응답에 노출 금지,
  XML 원본 미저장, `.env` 미커밋.

## 5. 통합 흐름 (Step F)

1. 두 에이전트 완료 → 각 브랜치를 `chore/freeze-contract`로 merge(충돌 시 오케스트레이터 해소).
2. FE 페이지 로더의 mock → 실제 `/api/...` fetch로 **한 곳만 스왑**(계약이 형태 일치 보장).
3. 신규 분석 플로우 스모크(`PORT=3100 npm run dev`) + 최종 `verify.sh` green.
4. 통합 브랜치 → `main` PR. **merge는 사용자 승인 필수**.

## 6. A안 단점 보완 — 4단 드리프트 가드레일

A(Fire-and-forget)의 단점은 "빗나가도 늦게 발견 → 그 트랙 작업 낭비". 사람 체크포인트를
추가하지 않고(= 속도 유지) 아래로 보완한다.

**1) 예방(Prevent)** — 드리프트 확률 자체를 낮춤
- 에이전트별 **airtight 브리프**: 작업 목록 · **파일 생성 화이트리스트** · **절대 수정 금지**
  목록(`types/`·`mocks/`·상대 트랙) · 계층/보안 규칙 · DoD(`verify.sh` green).
- **"계약이 부족하면 고치지 말고 멈춰 보고하라"** 규칙 → 계약 변경 시도 원천 차단.

**2) 탐지(Detect)** — '늦은 발견'을 정면 해결
- 백그라운드 진행을 **주기적으로 peek**(완료 알림에만 의존하지 않음). 화이트리스트 밖
  파일(특히 `types/`·`mocks/`·상대 트랙) 접근 시 **즉시 중단**.
- 완료 시 **구조화된 자기보고**(변경 파일 · 추가 테스트 · `verify.sh` 결과 · 가정/이탈)
  회수 → 브리프와 대조해 silent scope creep 적발.

**3) 격리(Contain)** — 피해 범위를 한 트랙으로 묶음
- 워크트리 격리라 빗나간 에이전트도 `main`/상대 트랙 오염 불가. 최악도 **그 워크트리만 폐기**,
  다른 트랙은 계속.
- 수용 전 오케스트레이터가 **`verify.sh` 독립 재실행** + **`git diff --name-only`를
  화이트리스트와 대조**(자기보고를 그대로 신뢰하지 않음).

**4) 복구(Recover)** — 빗나가면 싸게 되돌림
- 게이트 실패/드리프트 시 **실패 로그를 담아 재디스패치**(execute.py식 self-heal, 최대 2회).
  작은 커밋 단위라 리셋·재개 비용 낮음.
- 한 트랙 재시작이 다른 트랙을 막지 않음(독립).

## 7. 검증 (전체 종단)

- 트랙 내부: step마다 `verify.sh` green, 작은 commit.
- 통합 후: 신규 분석 플로우 스모크(`PORT=3100`) + 최종 `verify.sh` green.

## 8. 제외 (이번 범위 아님)

- Phase 3 매칭 엔진 실연결(현재 mock 사용).
- Phase 5 가격/구매, Phase 6 하드닝, 분석 내역 저장/삭제.
- 실제 YouTube Data API 키 연동(P1).
- 서드파티 오케스트레이션 프레임워크(oh-my-claudecode 등) 도입 — 기존 WAT/harness·superpowers와
  중복·충돌 우려로 이번 작업에서는 네이티브 도구만 사용.
