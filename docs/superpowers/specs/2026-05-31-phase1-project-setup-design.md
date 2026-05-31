# Phase 1 Project Setup — 설계 (Spec)

- 작성일: 2026-05-31
- 상태: 승인됨 (brainstorming)
- 관련 문서: `docs/ARCHITECTURE.md` §3·§4·§15·§17·§19, `docs/ADR.md`, `docs/PRD.md` §8, `docs/WORKFLOW.md`

## 1. 배경 / 목적

`crate-finder`는 기획·아키텍처 문서와 WAT 운영 도구(`scripts/*.sh`, harness)는 갖췄지만 **코드가 0줄**(package.json 없음)이다. 그래서 `scripts/verify.sh`와 `.claude/settings.json`의 Stop hook이 graceful skip 상태로 실제 검증을 수행하지 못한다.

Phase 1의 목적은 **이후 모든 Phase(Ingestion → Matching → UI → Pricing → Hardening)가 올라설 검증 가능한 토대**를 세우는 것이다. 구체적으로 Next.js App Router + TypeScript strict + Tailwind v4 + Vitest 스캐폴딩을 만들고, 도메인 공통 타입을 정의한다.

## 2. 범위

### 포함
- create-next-app 기반 스캐폴딩 후 ARCHITECTURE 구조로 조정
- 계층 루트 7개 폴더(`src/{app,components,lib,services,types,styles,tests}`)
- `src/types/` 공통 타입 작성 (PRD §8 정본 기준)
- Vitest 테스트 환경 + smoke 테스트 1개
- `package.json` scripts를 기존 자산(`scripts/*.sh`, hook)과 정합
- `.env.example` (ARCHITECTURE §17)

### 제외 (다음 Phase)
- DB/Prisma (Phase 2+)
- 실제 컴포넌트(AppShell 등, Phase 4)
- API route·파서·매처 로직 (Phase 2/3)
- CI GitHub Actions (Phase 6)

## 3. 확정된 결정

| 항목 | 결정 | 근거 |
|---|---|---|
| 범위 | 순수 스캐폴딩 (DB 제외) | ARCHITECTURE §19 Phase 1 정의 / YAGNI |
| 디렉토리 | 계층 루트 7폴더 + types만 작성 | 빈 stub 양산 방지(YAGNI) |
| 패키지 매니저 | npm | 호환성·기존 자산(`scripts/*.sh`, 문서) 일치, Node 내장 |
| 생성 방식 | create-next-app 후 조정 | 표준·검증된 출발점, 누락 위험 최소 |
| Next / React | 15.3.x / 19.2.x | latest(16)보다 생태계 검증 충분 |
| Tailwind | v4 (4.3.x) | CSS-first `@theme` → `styles/tokens.css` 구조와 정합 |
| Vitest | 4.x | + @testing-library/react, jsdom |

환경 확인: Node v24.2.0, npm 11.3.0 (2026-05-31).

## 4. 작업 상세

### 4.1 스캐폴딩 생성 + 조정
`npx create-next-app@15` 옵션: TypeScript, Tailwind, App Router, ESLint, `src/` 디렉토리, import alias `@/*`, npm.

조정:
- 기본 생성 `src/app/globals.css` → `src/styles/globals.css`로 이동.
- `src/styles/tokens.css` 신설 — UI_GUIDE 디자인 토큰 CSS 변수 이식(`--color-app-bg`, `--color-window-bg`, 상태 색상 등).
- Tailwind v4 CSS-first 구성: `globals.css`에서 `@import "tailwindcss"` + `@theme`로 tokens 연결 (`tailwind.config.ts` 불필요).
- `src/app/layout.tsx`의 CSS import 경로를 `@/styles/globals.css`로 수정.
- 샘플 boilerplate(데모 page 콘텐츠·SVG 에셋) 제거 → 최소 홈 `src/app/page.tsx`.

### 4.2 디렉토리 골격 (ARCHITECTURE §3)
- `src/{app,components,lib,services,types,styles,tests}` 7개 루트 생성. 빈 폴더는 `.gitkeep`.
- `src/types/` 작성 (PRD §8 정본):
  - `track.ts` — `TrackStatus`, `MatchConfidence`, `YouTubeTrack`, `RekordboxTrack`
  - `match.ts` — `MatchResult`, `MatchCandidate`
  - `playlist.ts` — `YouTubePlaylist`
  - `analysis.ts` — `AnalysisSession`
  - `pricing.ts` — 가격 Provider 관련 타입(초안)
  - `api.ts` — API 요청/응답 타입(초안)
- 그 외 하위 폴더·구현 파일은 각 Phase에서 실제 구현 시 생성.

### 4.3 테스트 환경 (Vitest)
- 설치: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@vitejs/plugin-react`.
- `vitest.config.ts`: jsdom 환경, alias `@/*`, `src/tests/` 포함, setup 파일(`@testing-library/jest-dom` 로드).
- smoke 테스트 `src/tests/setup.test.ts` 1개 — test 단계가 빈 통과가 아닌 실제 통과가 되도록 보장.

### 4.4 검증 명령 정합성
`package.json` scripts:
```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "next lint",
"test": "vitest run"
```
이로써 `scripts/{lint,build,test,verify}.sh`가 graceful skip이 아니라 실제 실행되고, Stop hook이 실동작한다.

### 4.5 환경변수 (ARCHITECTURE §17)
- `.env.example` 생성:
  ```txt
  YOUTUBE_API_KEY=
  DATABASE_URL=
  NEXT_PUBLIC_APP_URL=
  PRICE_PROVIDER_MODE=mock
  MAX_XML_FILE_SIZE_MB=20
  ```
- `.gitignore`에 `.env` 포함 확인(create-next-app 기본 포함).

## 5. 컴포넌트(유닛) 경계

| 유닛 | 책임 | 의존 |
|---|---|---|
| `src/types/*` | 도메인 타입 정의 (순수, 런타임 코드 없음) | 없음 |
| `src/styles/{globals,tokens}.css` | 디자인 토큰·글로벌 스타일 | Tailwind v4 |
| `src/app/{layout,page}.tsx` | 앱 진입점·최소 홈 | styles, types |
| `vitest.config.ts` + `src/tests/` | 테스트 실행 환경 | @testing-library, jsdom |
| `package.json` scripts | 검증 진입점 | next, vitest |

각 유닛은 독립적으로 이해·교체 가능하다. 타입은 다른 계층이 import하되 역방향 의존(타입→컴포넌트)은 없다.

## 6. 완료 기준 (Verification)
```bash
npm run lint              # 통과
npm run test             # smoke 테스트 실제 통과
npm run build            # 빌드 성공
bash scripts/verify.sh   # 전체 통과 (더 이상 skip 아님)
npm run dev              # 홈(/) 렌더 확인
npx tsc --noEmit         # strict mode 타입 에러 없음
```

## 7. 위험 / 주의
- **Tailwind v4 신구성**: v3와 설정 방식이 완전히 다름(config 파일 없음). create-next-app@15가 v3를 깔 경우 v4로 업그레이드 + PostCSS 플러그인(`@tailwindcss/postcss`) 조정 필요.
- **styles 경로 이동**: globals.css 이동 후 layout import 경로 누락 시 스타일 깨짐 → 빌드 후 dev 렌더로 확인.
- **타입 초안의 과설계 경계**: pricing/api 타입은 초안 수준으로만. 실제 형태는 해당 Phase에서 확정.
