# Phase 1 Project Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** crate-finder의 첫 코드 토대 — Next.js App Router + TS strict + Tailwind v4 + Vitest 스캐폴딩과 공통 도메인 타입을 만들어, `scripts/verify.sh`/Stop hook이 실제 검증을 수행하게 한다.

**Architecture:** `create-next-app@15`로 부트스트랩 후 `docs/ARCHITECTURE.md §3` 디렉토리 구조에 맞게 조정한다. 스타일은 `src/styles/`로 분리하고 Tailwind v4 CSS-first(`@theme`)로 구성한다. 도메인 타입은 `src/types/`에 PRD §8 정본 기준으로 작성한다. 개발은 TDD: 타입은 컴파일 검증, 런타임 환경은 smoke 테스트로 굳히고, 이후 Phase의 로직부터 red→green→refactor를 적용한다.

**Tech Stack:** npm, Next 15.3, React 19, Tailwind CSS v4, Vitest 4, @testing-library/react, jsdom, TypeScript strict.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `package.json` | 의존성 + 검증 scripts(`lint`/`build`/`test`/`dev`/`start`) |
| `tsconfig.json` | TS strict, path alias `@/*` |
| `next.config.ts` | Next 설정 (기본) |
| `vitest.config.ts` | jsdom 환경, alias, setup, include 경로 |
| `src/tests/setup.ts` | 테스트 전역 setup(@testing-library/jest-dom) |
| `src/tests/setup.test.ts` | 환경 smoke 테스트 |
| `src/tests/types.test-d.ts` | 타입 레벨 검증(컴파일) |
| `src/styles/globals.css` | Tailwind import + @theme 토큰 연결 + 글로벌 |
| `src/styles/tokens.css` | UI_GUIDE 디자인 토큰 CSS 변수 |
| `src/app/layout.tsx` | 루트 레이아웃, globals.css import |
| `src/app/page.tsx` | 최소 홈 |
| `src/types/{track,match,playlist,analysis,pricing,api}.ts` | 도메인 타입 |
| `.env.example` | 환경변수 템플릿 |
| `src/{components,lib,services}/.gitkeep` | 빈 계층 루트 |

**작업 브랜치:** `feature/project-setup` (이미 생성됨, spec 커밋 `fe63d8e` 위에 이어서).

---

## Task 0: 스캐폴딩 부트스트랩

**Files:**
- Create: 프로젝트 루트 전반 (`package.json`, `tsconfig.json`, `next.config.ts`, `src/app/*`, 등)

> 주의: 부트스트랩은 일회성이라 TDD 대상이 아니다. 검증은 "dev 서버가 뜬다"로 한다. create-next-app은 현재 디렉토리에 docs/scripts/.git이 이미 있으므로 임시 폴더에 생성 후 병합한다.

- [ ] **Step 1: 임시 디렉토리에 create-next-app 실행**

Run:
```bash
cd /tmp && rm -rf cf-scaffold && \
npx --yes create-next-app@^15 cf-scaffold \
  --ts --tailwind --app --eslint --src-dir \
  --import-alias "@/*" --use-npm --no-turbopack --yes
```
Expected: `/tmp/cf-scaffold`에 Next 15 프로젝트 생성 완료.

- [ ] **Step 2: 생성 결과를 repo로 병합 (기존 docs/scripts/.git 보존)**

Run:
```bash
cd /tmp/cf-scaffold && \
cp -R package.json package-lock.json tsconfig.json next.config.* \
  next-env.d.ts postcss.config.* eslint.config.* .gitignore \
  /Users/kimrumm/IdeaProjects/crate-finder/ 2>/dev/null; \
cp -R src /Users/kimrumm/IdeaProjects/crate-finder/ ; \
cp -R public /Users/kimrumm/IdeaProjects/crate-finder/ 2>/dev/null; \
echo merged
```
Expected: repo 루트에 Next 설정 파일들과 `src/app/`이 생긴다. 기존 `docs/`, `scripts/`, `.claude/`, `CLAUDE.md`는 그대로.

- [ ] **Step 3: 의존성 설치 및 버전 확인**

Run:
```bash
cd /Users/kimrumm/IdeaProjects/crate-finder && npm install && \
node -p "require('./package.json').dependencies.next, require('./package.json').dependencies.react"
```
Expected: 설치 성공. next 15.x, react 19.x.

- [ ] **Step 4: Tailwind v4 여부 확인 및 보정**

Run:
```bash
cd /Users/kimrumm/IdeaProjects/crate-finder && \
node -p "require('./package.json').devDependencies.tailwindcss || require('./package.json').dependencies.tailwindcss"
```
Expected: `^4...`. 만약 v3(`^3...`)이면 다음 실행:
```bash
npm install -D tailwindcss@^4 @tailwindcss/postcss@^4 && \
rm -f tailwind.config.* && \
printf '%s\n' '{ "plugins": { "@tailwindcss/postcss": {} } }' > postcss.config.json && rm -f postcss.config.mjs postcss.config.js
```
(v4는 `tailwind.config` 불필요, PostCSS 플러그인은 `@tailwindcss/postcss`.)

- [ ] **Step 5: dev 서버 기동 확인 후 종료**

Run:
```bash
cd /Users/kimrumm/IdeaProjects/crate-finder && \
( npm run dev & DEV_PID=$!; sleep 8; curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000 ; kill $DEV_PID )
```
Expected: `200` 출력.

- [ ] **Step 6: Commit**

```bash
cd /Users/kimrumm/IdeaProjects/crate-finder && \
git add -A && \
git commit -m "feat(setup): scaffold Next.js 15 + TS + Tailwind v4 (create-next-app)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 1: 스타일을 src/styles/로 분리 + 디자인 토큰

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/globals.css`
- Modify: `src/app/layout.tsx` (css import 경로), 기존 `src/app/globals.css` 삭제

- [ ] **Step 1: tokens.css 작성 (UI_GUIDE 디자인 토큰)**

Create `src/styles/tokens.css`:
```css
:root {
  --color-app-bg: #E8E3D3;
  --color-window-bg: #F8F6EE;
  --color-panel-bg: #FFFFFF;

  --color-border-primary: #111111;
  --color-border-muted: #8A867A;
  --color-border-soft: #C8C1B2;

  --color-text-primary: #111111;
  --color-text-secondary: #4F4A42;
  --color-text-muted: #777166;

  --color-accent-primary: #5A4FCF;
  --color-accent-primary-dark: #3F36A3;
  --color-accent-secondary: #2F2F2F;

  --color-owned: #1F7A3A;
  --color-owned-bg: #E4F4E8;
  --color-missing: #B83232;
  --color-missing-bg: #F8E4E4;
  --color-review: #B7791F;
  --color-review-bg: #FFF3D8;
  --color-info: #2B6CB0;
  --color-info-bg: #E4EFFA;
  --color-danger: #A92828;
  --color-danger-bg: #F8E2E2;
}
```

- [ ] **Step 2: globals.css 작성 (Tailwind v4 + @theme)**

Create `src/styles/globals.css`:
```css
@import "tailwindcss";
@import "./tokens.css";

/* tokens.css의 :root 변수를 Tailwind 유틸리티(bg-app, text-primary 등)로 노출.
   @theme의 우변은 tokens.css가 정의한 실제 변수를 가리킨다(자기참조 아님). */
@theme {
  --color-app: var(--color-app-bg);
  --color-window: var(--color-window-bg);
  --color-panel: var(--color-panel-bg);
  --color-owned: var(--color-owned);
  --color-missing: var(--color-missing);
  --color-review: var(--color-review);
  --color-accent: var(--color-accent-primary);
}

body {
  background: var(--color-app-bg);
  color: var(--color-text-primary);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

> 주의: `@theme`의 키 이름은 Tailwind 유틸리티 접두사(`--color-owned` → `bg-owned`)가 된다. tokens.css의 `--color-owned`와 키 이름이 겹쳐도 우변이 `var(--color-owned)`로 tokens.css 값을 읽으므로 동작하지만, 빌드 후 `bg-app`/`bg-owned` 유틸리티가 실제로 생성되는지 Task1 Step4 빌드에서 확인한다.

- [ ] **Step 3: 기존 globals.css 삭제 + layout.tsx import 경로 수정**

Run:
```bash
cd /Users/kimrumm/IdeaProjects/crate-finder && rm -f src/app/globals.css
```
Modify `src/app/layout.tsx`: import 라인을 `import "@/styles/globals.css";`로 변경 (기존 `./globals.css` 제거).

- [ ] **Step 4: 빌드로 스타일 경로 검증**

Run: `cd /Users/kimrumm/IdeaProjects/crate-finder && npm run build`
Expected: 빌드 성공 (css import 에러 없음).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor(styles): move globals to src/styles, add design tokens (Tailwind v4 @theme)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: 도메인 공통 타입 (PRD §8 정본)

**Files:**
- Create: `src/types/{track,match,playlist,analysis,pricing,api}.ts`
- Test: `src/tests/types.test-d.ts`

- [ ] **Step 1: track.ts 작성**

Create `src/types/track.ts`:
```ts
export type TrackStatus = "owned" | "missing" | "needs_review";
export type MatchConfidence = "high" | "medium" | "low";

export type YouTubeTrack = {
  id: string;
  videoId: string;
  rawTitle: string;
  channelTitle?: string;
  publishedAt?: string;
  parsedArtist?: string;
  parsedTitle?: string;
  parseStatus: "parsed" | "needs_review" | "unavailable";
};

export type RekordboxTrack = {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  durationMs?: number;
  location?: string;
  normalizedTitle: string;
  normalizedArtist?: string;
};
```

- [ ] **Step 2: match.ts 작성**

Create `src/types/match.ts`:
```ts
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
```

- [ ] **Step 3: playlist.ts, analysis.ts 작성**

Create `src/types/playlist.ts`:
```ts
export type YouTubePlaylist = {
  id: string;
  playlistId: string;
  title?: string;
  sourceUrl: string;
  itemCount: number;
  loadedAt: string;
};
```

Create `src/types/analysis.ts`:
```ts
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
```

- [ ] **Step 4: pricing.ts, api.ts 초안 작성**

Create `src/types/pricing.ts`:
```ts
// 가격 Provider 초안 — 실제 형태는 Phase 5에서 확정.
export type PriceProviderMode = "mock" | "search_link" | "external";

export type PriceQuote = {
  site: string;
  price?: number;
  currency?: string;
  url: string;
  isLowest?: boolean;
  fetchedAt: string;
};
```

Create `src/types/api.ts`:
```ts
// API 요청/응답 공통 래퍼 초안 — 실제 형태는 각 라우트 구현 시 확정.
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: { code: string; message: string } };
export type ApiResult<T> = ApiOk<T> | ApiErr;
```

- [ ] **Step 5: 타입 레벨 테스트 작성 (failing 먼저)**

Create `src/tests/types.test-d.ts`:
```ts
import { describe, it, expectTypeOf } from "vitest";
import type { TrackStatus, YouTubeTrack, RekordboxTrack } from "@/types/track";
import type { MatchResult, MatchCandidate } from "@/types/match";
import type { YouTubePlaylist } from "@/types/playlist";
import type { AnalysisSession } from "@/types/analysis";
import type { ApiResult } from "@/types/api";

describe("domain types", () => {
  it("TrackStatus는 세 상태만 허용", () => {
    expectTypeOf<TrackStatus>().toEqualTypeOf<"owned" | "missing" | "needs_review">();
  });
  it("MatchResult.candidates는 MatchCandidate 배열", () => {
    expectTypeOf<MatchResult["candidates"]>().toEqualTypeOf<MatchCandidate[]>();
  });
  it("주요 엔티티 타입이 존재한다", () => {
    expectTypeOf<YouTubeTrack["videoId"]>().toBeString();
    expectTypeOf<RekordboxTrack["normalizedTitle"]>().toBeString();
    expectTypeOf<YouTubePlaylist["playlistId"]>().toBeString();
    expectTypeOf<AnalysisSession["totalTrackCount"]>().toBeNumber();
    expectTypeOf<ApiResult<number>>().not.toBeNever();
  });
});
```

> 이 테스트는 Task 3에서 vitest 환경이 갖춰져야 실행된다. Task 2 시점엔 `npx tsc --noEmit`로 타입 컴파일만 검증한다.

- [ ] **Step 6: 타입 컴파일 검증**

Run: `cd /Users/kimrumm/IdeaProjects/crate-finder && npx tsc --noEmit`
Expected: 에러 없음 (strict mode 통과).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(types): add domain types from PRD §8 (track, match, playlist, analysis, pricing, api)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Vitest 테스트 환경 (TDD 토대)

**Files:**
- Create: `vitest.config.ts`, `src/tests/setup.ts`, `src/tests/setup.test.ts`
- Modify: `package.json` (test script, devDependencies)

- [ ] **Step 1: 테스트 의존성 설치**

Run:
```bash
cd /Users/kimrumm/IdeaProjects/crate-finder && \
npm install -D vitest@^4 @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event
```
Expected: 설치 성공.

- [ ] **Step 2: vitest.config.ts 작성**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    typecheck: { enabled: true, include: ["src/**/*.test-d.ts"] },
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```

- [ ] **Step 3: setup.ts 작성**

Create `src/tests/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: smoke 테스트 작성 (failing 먼저)**

Create `src/tests/setup.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("test environment", () => {
  it("vitest가 동작한다", () => {
    expect(1 + 1).toBe(2);
  });
  it("jsdom DOM API를 쓸 수 있다", () => {
    const el = document.createElement("div");
    el.textContent = "crate-finder";
    expect(el.textContent).toBe("crate-finder");
  });
});
```

- [ ] **Step 5: package.json test script 설정**

Modify `package.json` scripts에 추가/변경:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: 테스트 실행 (통과 확인)**

Run: `cd /Users/kimrumm/IdeaProjects/crate-finder && npm test`
Expected: PASS — smoke 테스트 2개 + types.test-d.ts 타입 테스트 통과.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "test(setup): add Vitest + Testing Library env with smoke and type tests

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: 계층 골격 + 검증 스크립트 정합 + 환경변수

**Files:**
- Create: `src/components/.gitkeep`, `src/lib/.gitkeep`, `src/services/.gitkeep`, `.env.example`
- Verify: `package.json` lint/build scripts, `scripts/verify.sh`

- [ ] **Step 1: 계층 루트 폴더 생성**

Run:
```bash
cd /Users/kimrumm/IdeaProjects/crate-finder && \
mkdir -p src/components src/lib src/services && \
touch src/components/.gitkeep src/lib/.gitkeep src/services/.gitkeep
```
Expected: `src/{app,components,lib,services,styles,tests,types}` 7개 루트 존재.

- [ ] **Step 2: 계층 루트 7개 존재 확인**

Run:
```bash
cd /Users/kimrumm/IdeaProjects/crate-finder && \
for d in app components lib services styles tests types; do test -d "src/$d" && echo "OK src/$d" || echo "MISSING src/$d"; done
```
Expected: 7개 모두 `OK`.

- [ ] **Step 3: .env.example 작성**

Create `.env.example`:
```txt
YOUTUBE_API_KEY=
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
PRICE_PROVIDER_MODE=mock
MAX_XML_FILE_SIZE_MB=20
```

- [ ] **Step 4: package.json scripts 최종 확인**

`package.json` scripts가 아래를 포함하는지 확인(없으면 추가):
```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "next lint",
"test": "vitest run"
```

- [ ] **Step 5: .env가 gitignore에 있는지 확인**

Run: `cd /Users/kimrumm/IdeaProjects/crate-finder && grep -qE '^\.env' .gitignore && echo "ignored OK" || echo "MISSING"`
Expected: `ignored OK` (create-next-app 기본 포함). 없으면 `.gitignore`에 `.env*` 추가하되 `!.env.example` 예외.

- [ ] **Step 6: verify.sh 전체 실행 (실동작 전환 확인)**

Run: `cd /Users/kimrumm/IdeaProjects/crate-finder && bash scripts/verify.sh`
Expected: lint/build/test가 skip이 아니라 실제 실행되고 전부 통과. 마지막 `verify: 완료`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore(setup): add layer-root dirs, .env.example; verify scripts now run

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: 최종 검증 + PR

**Files:** 없음 (검증·PR만)

- [ ] **Step 1: 전체 완료 기준 검증**

Run:
```bash
cd /Users/kimrumm/IdeaProjects/crate-finder && \
npm run lint && npm run test && npm run build && npx tsc --noEmit && \
bash scripts/verify.sh && echo "ALL GREEN"
```
Expected: 마지막 줄 `ALL GREEN`.

- [ ] **Step 2: dev 홈 렌더 확인**

Run:
```bash
cd /Users/kimrumm/IdeaProjects/crate-finder && \
( npm run dev & DEV_PID=$!; sleep 8; curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3000 ; kill $DEV_PID )
```
Expected: `200`.

- [ ] **Step 3: push + PR 생성**

Run:
```bash
cd /Users/kimrumm/IdeaProjects/crate-finder && \
git push -u origin feature/project-setup && \
gh pr create --base main --head feature/project-setup \
  --title "feat: Phase 1 Project Setup (Next 15 + TS + Tailwind v4 + Vitest)" \
  --body "## Summary
- Phase 1 스캐폴딩: Next 15 App Router + TS strict + Tailwind v4 + Vitest.
- 공통 도메인 타입(PRD §8) 정의. 계층 루트 7폴더.
- scripts/verify.sh·Stop hook이 실제 검증 수행하도록 전환.

## Verification
- [x] npm run lint
- [x] npm run test (smoke + type 테스트)
- [x] npm run build
- [x] npx tsc --noEmit
- [x] bash scripts/verify.sh

## Out of scope (다음 Phase)
DB/Prisma, 실제 컴포넌트, API route·파서·매처, CI.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```
Expected: PR URL 출력.

- [ ] **Step 4: 임시 스캐폴딩 폴더 정리**

Run: `rm -rf /tmp/cf-scaffold && echo cleaned`
Expected: `cleaned`.

---

## Self-Review 결과

**Spec coverage:** spec §4.1~4.5 전부 매핑됨 — 스캐폴딩(T0), styles 분리/토큰(T1), types(T2), Vitest(T3), 계층폴더+scripts정합+env(T4), 검증/PR(T5). ✅

**Placeholder scan:** 모든 코드 스텝에 실제 코드/명령 포함. "적절한 에러처리" 류 없음. ✅

**Type consistency:** `match.ts`가 `track.ts`의 `TrackStatus`/`MatchConfidence`를 import해 사용 — PRD §8과 일치. `types.test-d.ts`가 참조하는 타입(`MatchCandidate`, `ApiResult` 등)은 모두 T2에서 정의됨. ✅

**알려진 위험:** create-next-app@15가 Tailwind v3를 깔 가능성 → T0 Step4에서 v4 보정 분기 제공. `next lint`는 Next 15에서 deprecated 경고 가능하나 동작함(Phase 6에서 eslint 직접 호출로 교체 검토).
