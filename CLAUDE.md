# CLAUDE.md

이 파일은 **항상 컨텍스트에 로드**된다. 그래서 참조 + 절대 규칙만 담는다.
상세 내용은 아래 문서를 **필요할 때만** 읽는다(lazy load).

## Project

`crate-finder` / **Crate Finder** — 유튜브 플레이리스트와 Rekordbox XML 라이브러리를 비교해
보유곡·누락곡·확인필요 곡을 식별하고, 누락곡 구매 액션을 제공하는 DJ 음악 라이브러리 관리 웹앱.

## Source of Truth (필요 시 읽기)

작업 전 관련 문서를 읽고 판단한다. 문서와 충돌하는 구현을 하지 않는다.
문서에 없는 큰 결정이 필요하면 먼저 사용자에게 확인한다(→ `When Unsure`).

- `docs/PRD.md` — 제품 목표·MVP 범위·기능 요구사항·**도메인 데이터 모델(정본)**·성공 기준
- `docs/ARCHITECTURE.md` — 디렉토리·계층·데이터 흐름·API·매칭 알고리즘·가격·보안·성능·테스트·오류·구현 순서(Phase)
- `docs/ADR.md` — 기술 의사결정과 트레이드오프
- `docs/UI_GUIDE.md` — 디자인 토큰·원칙(+ `docs/ui/COMPONENTS.md`, `docs/ui/PAGES.md`)
- `docs/WORKFLOW.md` — **작업 운영 방식(WAT 루프). 모든 작업은 이 루프를 따른다.**

## Core Product Flow

```txt
YouTube Playlist URL 입력 → playlistId 추출 → 곡 목록 로드 → 제목에서 아티스트/곡명 추출
→ Rekordbox XML 업로드 → XML 파싱 → 트랙 정규화 → 보유/누락/확인필요 매칭
→ 매칭 신뢰도 표시 → 누락곡 구매 액션 → 분석 내역 저장/삭제
```

MVP 최우선 3가지: ① Rekordbox XML 안정 파싱 ② 유튜브↔Rekordbox 정확 비교 ③ 빠르게 확인 가능한 결과 테이블.
랜딩페이지·고급 애니메이션·과한 디자인은 후순위.

## Stack & Commands (Phase 1 확정)

Next.js 15.5 (App Router) · React 19 · TypeScript strict · Tailwind v4(CSS-first `@theme`, config 파일 없음) · Vitest 4 · npm.
- 검증: `bash scripts/verify.sh` (lint→build→test). 개별: `npm run lint|build|test`.
- 스타일: `src/styles/{globals,tokens}.css`. 디자인 토큰은 tokens.css(:root) → globals.css `@theme`로 노출.
- 개발 서버: 포트 **반드시 고정** (`PORT=3100 npm run dev`). 미지정 시 3000 점유되면 3001로 이동→404 오진.
- TDD: 순수 로직은 테스트 먼저. 타입 검증은 `src/tests/*.test-d.ts`(vitest typecheck).
- `gh`/`brew`는 `/opt/homebrew/bin` (PATH 추가 필요할 수 있음).

## Domain Invariants (불변값 — 변경 시 사용자 확인)

```ts
type TrackStatus = "owned" | "missing" | "needs_review";
type MatchConfidence = "high" | "medium" | "low";
```

- `owned` 보유 / `missing` 없음 / `needs_review` 후보는 있으나 수동 확인 필요.
- `high` 정확·고신뢰 / `medium` 후보 있음·확인 권장 / `low` 불확실.
- 불확실한 항목을 억지로 `owned` 처리하지 않는다. 애매하면 `needs_review`.
- 전체 데이터 모델은 `docs/PRD.md` §8 참조(정본).

## CRITICAL Rules

**계층 의존성** (상세: ARCHITECTURE §3·§4)
- `lib`/`services` → `components` 의존 금지.
- `components`에서 XML 파싱·매칭 알고리즘·외부 API 직접 호출 금지.
- 순수 로직은 `src/lib/`(parser·normalizer·matcher·validator), 외부 연동/복합 유스케이스는 `src/services/`.

**보안** (상세: ARCHITECTURE §12, ADR-004)
- 외부 API(YouTube·가격)와 API Key는 **서버 영역(`src/app/api/*`, `src/services/*`)에서만**. 클라이언트 노출 금지.
- `YOUTUBE_API_KEY`는 절대 `NEXT_PUBLIC_`로 선언하지 않는다. `.env`는 커밋하지 않는다.
- Rekordbox XML 원본은 기본 저장하지 않는다. 파싱 후 필요한 메타데이터만 저장.
- XML 원문·API Key·로컬 파일 경로를 로그/에러 메시지에 노출하지 않는다. 파일 크기 제한·삭제 기능 제공.

**Git** (상세: ADR-014/015, `docs/WORKFLOW.md`)
- `main`에 직접 commit/push 금지. 작업은 `feature|fix|docs|refactor|test|chore/{slug}` 브랜치에서.
- Conventional Commits(`type(scope): summary`). 사용자 승인 전 merge 금지.
- 커밋 전 `git rev-parse --abbrev-ref HEAD`로 브랜치 확인(세션 혼선 방지).
- 병렬 트랙(BE/FE 등 독립 작업)은 **트랙별로 PR 분리**. 하나의 통합 브랜치로 묶어 단일 PR로 올리지 않는다. 공유 계약(`types`/`mocks`)은 먼저 별도 PR로 올리고, 각 트랙 PR을 그 위에 쌓는다(stacked).

## Do Not

- main 직접 push / 사용자 승인 없이 merge
- API Key 클라이언트 노출 / XML 원본 로그 출력 / XML 원본 기본 저장
- UI 컴포넌트에서 XML 파싱 또는 매칭 알고리즘 직접 구현
- 문서와 충돌하는 구조 변경 / 테스트 실패 무시하고 PR 생성
- Apple 로고·실제 Macintosh 시스템 아이콘 사용 / 과한 네온·글래스모피즘·AI SaaS 스타일
- 전체 기능을 한 번에 구현 / 관련 없는 리팩토링을 같은 PR에 포함
- 병렬 BE/FE(독립 트랙)를 한 PR에 묶기 — 트랙별로 분리해 올린다

## When Unsure (임의 결정 금지 — 사용자 확인)

외부 API 추가 · DB 스키마 큰 변경 · 원본 XML 저장 정책 변경 · 인증 방식 도입 ·
가격 조회 방식 변경 · 디자인 방향 변경 · 대규모 리팩토링 · MVP 범위 확대 · 유료/계정 기능 추가.
