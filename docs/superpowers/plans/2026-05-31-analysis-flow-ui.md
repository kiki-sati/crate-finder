# Analysis 입력 플로우 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/`에서 YouTube 플레이리스트 URL 입력 → Rekordbox XML 업로드 → 분석 실행 → `/results` 이동까지의 끝단 흐름을 mock 기반으로 완성한다.

**Architecture:** mock `analysis.service`(sample-data 반환)를 client 컴포넌트 `AnalysisFlow`가 호출. `AnalysisFlow`가 상태 머신(로딩/에러/준비)을 관리하고 기존 `PlaylistUrlForm`·`FileUploadBox`를 조합한다. Run 시 `router.push("/results")`. 통합 시 service 구현만 실제 fetch로 교체.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, Vitest 4 + @testing-library/react + user-event.

**Spec:** `docs/superpowers/specs/2026-05-31-analysis-flow-ui-design.md`

**Branch:** `chore/contract-foundation`에서 `feature/analysis-flow` 분기. 시작 전:
```bash
git checkout chore/contract-foundation && git checkout -b feature/analysis-flow
```

**테스트 실행 규칙:** 단일 파일은 `npm run test -- <path>`, 전체는 `npm run test`, 최종 검증은 `bash scripts/verify.sh`.

**기존 자산(그대로 사용):** `PlaylistUrlForm`(`onSubmit:(url)=>void`, Input placeholder "YouTube playlist URL", Button "Load"), `FileUploadBox`(`onFile:(file)=>void`, hidden `input[type=file]`), `AppShell`(`statusText`), `WindowPanel`(`title`), `Button`(`variant`, `disabled` 지원). 테스트 setup은 `src/tests/setup.ts`가 `@testing-library/jest-dom/vitest`를 로드(이미 구성됨).

---

### Task 1: mock analysis.service

**Files:**
- Create: `src/services/analysis.service.ts`
- Test: `src/services/analysis.service.test.ts`

계층 규칙: 외부 API/Key 없음(mock) → client 호출 가능. components import 금지. URL 검증은 기존 `parsePlaylistUrl`(`InvalidPlaylistUrlError`) 재사용.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/services/analysis.service.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { loadPlaylist, parseXml, runMatch } from "@/services/analysis.service";

describe("analysis.service (mock)", () => {
  it("유효한 URL이면 playlist 응답을 반환한다", async () => {
    const res = await loadPlaylist("https://www.youtube.com/playlist?list=PL1");
    expect(res.tracks.length).toBeGreaterThan(0);
  });

  it("유효하지 않은 URL이면 에러를 던진다", async () => {
    await expect(loadPlaylist("not-a-url")).rejects.toThrow();
  });

  it(".xml이 아니면 에러를 던진다", async () => {
    const file = new File(["x"], "library.txt", { type: "text/plain" });
    await expect(parseXml(file)).rejects.toThrow();
  });

  it(".xml 파일이면 파싱 응답을 반환한다", async () => {
    const file = new File(["<xml/>"], "library.xml", { type: "text/xml" });
    const res = await parseXml(file);
    expect(res.trackCount).toBe(res.tracks.length);
  });

  it("runMatch는 MatchResult 배열을 반환한다", async () => {
    const playlist = await loadPlaylist(
      "https://www.youtube.com/playlist?list=PL1",
    );
    const library = await parseXml(
      new File(["<xml/>"], "library.xml", { type: "text/xml" }),
    );
    const results = await runMatch(playlist, library);
    expect(Array.isArray(results)).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- src/services/analysis.service.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 최소 구현**

`src/services/analysis.service.ts`:
```ts
// mock 분석 서비스 — sample-data를 인위적 지연과 함께 반환한다.
// 통합 시 이 파일의 함수 구현만 실제 fetch로 교체한다(단일 교체 지점).
// 계층 규칙(CLAUDE.md): 외부 API/Key 없음 → client 호출 가능. components import 금지.

import type {
  YouTubePlaylistResponse,
  RekordboxParseResponse,
} from "@/types/api";
import type { MatchResult } from "@/types/match";
import { parsePlaylistUrl } from "@/lib/youtube/parse-playlist-url";
import {
  sampleYouTubePlaylistResponse,
  sampleRekordboxParseResponse,
  sampleMatchResults,
} from "@/mocks/sample-data";

const MOCK_DELAY_MS = 300;

function delay<T>(value: T, ms = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function loadPlaylist(
  url: string,
): Promise<YouTubePlaylistResponse> {
  parsePlaylistUrl(url); // 유효하지 않으면 InvalidPlaylistUrlError throw
  return delay(sampleYouTubePlaylistResponse);
}

export async function parseXml(file: File): Promise<RekordboxParseResponse> {
  if (!file.name.toLowerCase().endsWith(".xml")) {
    throw new Error("XML 파일만 업로드할 수 있습니다.");
  }
  return delay(sampleRekordboxParseResponse);
}

export async function runMatch(
  _playlist: YouTubePlaylistResponse,
  _library: RekordboxParseResponse,
): Promise<MatchResult[]> {
  return delay(sampleMatchResults);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -- src/services/analysis.service.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/services/analysis.service.ts src/services/analysis.service.test.ts
git commit -m "feat(analysis): add mock analysis service"
```

---

### Task 2: StepIndicator 컴포넌트

**Files:**
- Create: `src/components/analysis/StepIndicator.tsx`
- Test: `src/components/analysis/StepIndicator.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/analysis/StepIndicator.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepIndicator } from "@/components/analysis/StepIndicator";

describe("StepIndicator", () => {
  it("세 단계를 렌더한다", () => {
    render(<StepIndicator current={1} />);
    expect(screen.getByText(/플레이리스트/)).toBeInTheDocument();
    expect(screen.getByText(/XML 업로드/)).toBeInTheDocument();
    expect(screen.getByText(/분석/)).toBeInTheDocument();
  });

  it("현재 단계에 aria-current=step을 부여한다", () => {
    render(<StepIndicator current={2} />);
    expect(screen.getByText(/XML 업로드/)).toHaveAttribute(
      "aria-current",
      "step",
    );
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- src/components/analysis/StepIndicator.test.tsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 최소 구현**

`src/components/analysis/StepIndicator.tsx`:
```tsx
const STEPS = ["플레이리스트", "XML 업로드", "분석"] as const;

export function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap gap-2 text-xs" aria-label="진행 단계">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className={`border-2 border-strong px-2 py-1 ${
              active ? "bg-accent text-white" : "bg-panel"
            }`}
          >
            {step}. {label}
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -- src/components/analysis/StepIndicator.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/components/analysis/StepIndicator.tsx src/components/analysis/StepIndicator.test.tsx
git commit -m "feat(analysis): add StepIndicator"
```

---

### Task 3: AnalysisFlow 오케스트레이터

**Files:**
- Create: `src/components/analysis/AnalysisFlow.tsx`
- Test: `src/components/analysis/AnalysisFlow.test.tsx`

의존: Task 1·2 + 기존 PlaylistUrlForm/FileUploadBox/AppShell/WindowPanel/Button.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/analysis/AnalysisFlow.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/services/analysis.service", () => ({
  loadPlaylist: vi.fn(),
  parseXml: vi.fn(),
  runMatch: vi.fn(),
}));

import { loadPlaylist, parseXml, runMatch } from "@/services/analysis.service";
import { AnalysisFlow } from "@/components/analysis/AnalysisFlow";

const mockedLoad = vi.mocked(loadPlaylist);
const mockedParse = vi.mocked(parseXml);
const mockedRun = vi.mocked(runMatch);

function playlistRes(trackCount: number) {
  return {
    playlistId: "PL1",
    tracks: Array.from({ length: trackCount }, () => ({})),
    unavailableCount: 0,
  } as unknown as Awaited<ReturnType<typeof loadPlaylist>>;
}
function parseRes(trackCount: number) {
  return {
    trackCount,
    tracks: [],
    warnings: [],
  } as unknown as Awaited<ReturnType<typeof parseXml>>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AnalysisFlow", () => {
  it("초기에는 Run 버튼이 비활성화", () => {
    render(<AnalysisFlow />);
    expect(screen.getByRole("button", { name: "Run Match" })).toBeDisabled();
  });

  it("플레이리스트만 로드하면 Run은 여전히 비활성화", async () => {
    mockedLoad.mockResolvedValue(playlistRes(2));
    render(<AnalysisFlow />);
    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText("YouTube playlist URL"),
      "https://www.youtube.com/playlist?list=PL1",
    );
    await user.click(screen.getByRole("button", { name: "Load" }));
    await screen.findByText("2곡 로드됨");
    expect(screen.getByRole("button", { name: "Run Match" })).toBeDisabled();
  });

  it("XML 업로드 성공 시 파일명과 트랙 수를 표시한다", async () => {
    mockedParse.mockResolvedValue(parseRes(5));
    const { container } = render(<AnalysisFlow />);
    const user = userEvent.setup();
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["<xml/>"], "library.xml", { type: "text/xml" }),
    );
    expect(await screen.findByText(/library\.xml/)).toHaveTextContent("5곡");
  });

  it("둘 다 준비되면 Run 활성화, 클릭 시 /results로 이동", async () => {
    mockedLoad.mockResolvedValue(playlistRes(2));
    mockedParse.mockResolvedValue(parseRes(5));
    mockedRun.mockResolvedValue([]);
    const { container } = render(<AnalysisFlow />);
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText("YouTube playlist URL"),
      "https://www.youtube.com/playlist?list=PL1",
    );
    await user.click(screen.getByRole("button", { name: "Load" }));
    await screen.findByText("2곡 로드됨");

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["<xml/>"], "library.xml", { type: "text/xml" }),
    );
    await screen.findByText(/library\.xml/);

    const runBtn = screen.getByRole("button", { name: "Run Match" });
    expect(runBtn).toBeEnabled();
    await user.click(runBtn);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/results"));
  });

  it("URL 오류 시 에러 메시지를 즉시 표시한다", async () => {
    mockedLoad.mockRejectedValue(
      new Error("유효한 YouTube 플레이리스트 URL이 아닙니다."),
    );
    render(<AnalysisFlow />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("YouTube playlist URL"), "bad");
    await user.click(screen.getByRole("button", { name: "Load" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("유효한 YouTube");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- src/components/analysis/AnalysisFlow.test.tsx`
Expected: FAIL — `AnalysisFlow` 없음.

- [ ] **Step 3: 최소 구현**

`src/components/analysis/AnalysisFlow.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlaylistUrlForm } from "@/components/playlist/PlaylistUrlForm";
import { FileUploadBox } from "@/components/rekordbox/FileUploadBox";
import { Button } from "@/components/ui/Button";
import { AppShell } from "@/components/layout/AppShell";
import { WindowPanel } from "@/components/ui/WindowPanel";
import { StepIndicator } from "@/components/analysis/StepIndicator";
import {
  loadPlaylist,
  parseXml,
  runMatch,
} from "@/services/analysis.service";
import type {
  YouTubePlaylistResponse,
  RekordboxParseResponse,
} from "@/types/api";

export function AnalysisFlow() {
  const router = useRouter();
  const [playlist, setPlaylist] = useState<YouTubePlaylistResponse | null>(null);
  const [library, setLibrary] = useState<RekordboxParseResponse | null>(null);
  const [fileName, setFileName] = useState("");
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState("");

  async function handlePlaylistSubmit(url: string) {
    setError("");
    setLoadingPlaylist(true);
    try {
      setPlaylist(await loadPlaylist(url));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "플레이리스트를 불러오지 못했습니다.",
      );
    } finally {
      setLoadingPlaylist(false);
    }
  }

  async function handleFile(file: File) {
    setError("");
    setParsing(true);
    try {
      setLibrary(await parseXml(file));
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "XML을 파싱하지 못했습니다.");
    } finally {
      setParsing(false);
    }
  }

  async function handleRun() {
    if (!playlist || !library) return;
    setError("");
    setMatching(true);
    try {
      await runMatch(playlist, library);
      router.push("/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석에 실패했습니다.");
      setMatching(false);
    }
  }

  const ready = playlist !== null && library !== null;
  const currentStep = !playlist ? 1 : !library ? 2 : 3;

  return (
    <AppShell statusText={matching ? "분석 중…" : "새 분석"}>
      <WindowPanel title="New Analysis">
        <StepIndicator current={currentStep} />

        <div className="mt-4 flex flex-col gap-6">
          <section>
            <h2 className="mb-2 text-sm font-semibold">1. 플레이리스트 불러오기</h2>
            <PlaylistUrlForm onSubmit={handlePlaylistSubmit} />
            {loadingPlaylist && <p className="mt-2 text-xs">불러오는 중…</p>}
            {playlist && (
              <p className="mt-2 text-xs text-[color:var(--color-text-muted)]">
                {playlist.tracks.length}곡 로드됨
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">2. Rekordbox XML 업로드</h2>
            <FileUploadBox onFile={handleFile} />
            {parsing && <p className="mt-2 text-xs">파싱 중…</p>}
            {library && (
              <p className="mt-2 text-xs text-[color:var(--color-text-muted)]">
                {fileName} — {library.trackCount}곡 파싱됨
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">3. 분석 실행</h2>
            <Button type="button" onClick={handleRun} disabled={!ready || matching}>
              {matching ? "분석 중…" : "Run Match"}
            </Button>
          </section>

          {error && (
            <p role="alert" className="text-sm text-[color:var(--color-danger)]">
              {error}
            </p>
          )}
        </div>
      </WindowPanel>
    </AppShell>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -- src/components/analysis/AnalysisFlow.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/components/analysis/AnalysisFlow.tsx src/components/analysis/AnalysisFlow.test.tsx
git commit -m "feat(analysis): add AnalysisFlow orchestrator"
```

---

### Task 4: `/` 페이지에 마운트

**Files:**
- Modify: `src/app/page.tsx` (전체 교체)

현재 정적 소개문구를 `AnalysisFlow` 마운트로 교체한다. server component가 client 컴포넌트를 렌더한다.

- [ ] **Step 1: page.tsx 교체**

`src/app/page.tsx`:
```tsx
import { AnalysisFlow } from "@/components/analysis/AnalysisFlow";

export default function Home() {
  return <AnalysisFlow />;
}
```

- [ ] **Step 2: 빌드 확인 (server/client 경계)**

Run: `npm run build`
Expected: 빌드 성공. `"use client"`는 `AnalysisFlow`에만 있고 `page.tsx`는 server component로 유지.

- [ ] **Step 3: 커밋**

```bash
git add src/app/page.tsx
git commit -m "feat(analysis): mount AnalysisFlow at /"
```

---

### Task 5: 최종 검증 & push

- [ ] **Step 1: 전체 검증**

Run: `bash scripts/verify.sh`
Expected: lint → build → test 모두 PASS.

- [ ] **Step 2: 개발 서버로 흐름 수동 확인 (선택)**

Run: `PORT=3100 npm run dev` 후 `http://localhost:3100` — URL 입력·XML 업로드·Run → `/results` 이동 확인. (포트 반드시 고정, CLAUDE.md)

- [ ] **Step 3: push**

```bash
git push -u origin feature/analysis-flow
```

PR은 `chore/contract-foundation`을 base로 생성(stacked). 사용자 승인 전 merge 금지.

---

## 완료 기준 (Spec AC)

- [ ] `bash scripts/verify.sh` 통과
- [ ] `/`에서 입력→업로드→Run 흐름 동작(mock), Run 후 `/results` 도달
- [ ] 입력·업로드 둘 다 완료 전 Run disabled / 업로드 성공 시 파일명·트랙 수 표시 / URL 오류 즉시 표시
- [ ] 신규 테스트 통과, 기존 테스트 무회귀
