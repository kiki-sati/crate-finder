# Analysis Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** mock으로 동작하던 분석 플로우를 실제 API 라우트 + matcher 엔진에 배선하고, 매칭 결과를 sessionStorage로 `/results`에 전달한다.

**Architecture:** `analysis.service`가 `fetch`로 서버 라우트(`/api/youtube/playlist`, `/api/rekordbox/parse`)를 호출하고 순수 matcher(`matchTracks`)를 직접 실행한다. `AnalysisFlow`는 결과를 `analysis-handoff`(sessionStorage)에 저장 후 `/results`로 이동하고, `/results`는 핸드오프에서 `MatchRow[]`를 조립한다. YouTube 실제 fetcher(키 필요)는 범위 밖 — `stubFetcher` 유지.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Vitest 4 + @testing-library/react (jsdom).

**Spec:** `docs/superpowers/specs/2026-05-31-analysis-integration-design.md`
**Branch:** `feature/analysis-integration` (base `chore/contract-foundation`)

---

## File Structure

| 파일 | 책임 | 변경 |
|---|---|---|
| `src/services/analysis-handoff.ts` | 분석 결과 ↔ sessionStorage (저장/읽기) | 신규 |
| `src/services/analysis.service.ts` | 라우트 fetch + matcher 호출 (mock 제거) | 교체 |
| `src/app/results/loader.ts` | 핸드오프 → `MatchRow[]` 조립 | 교체 |
| `src/components/analysis/AnalysisFlow.tsx` | `handleRun`에서 결과 저장 후 이동 | 수정 |
| `src/app/results/page.tsx` | client 전환 + 빈 상태 | 수정 |

각 `*.test.ts(x)`는 해당 소스와 같은 위치에 둔다(기존 컨벤션).

---

## Task 1: analysis-handoff (sessionStorage 저장/읽기)

**Files:**
- Create: `src/services/analysis-handoff.ts`
- Test: `src/services/analysis-handoff.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/services/analysis-handoff.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  saveAnalysis,
  readAnalysis,
  type AnalysisHandoff,
} from "@/services/analysis-handoff";

const sample: AnalysisHandoff = {
  results: [
    {
      id: "mr_1",
      youtubeTrackId: "yt_1",
      matchedRekordboxTrackId: "rb_1",
      status: "owned",
      confidence: "high",
      score: 0.98,
      candidates: [],
    },
  ],
  youtubeTracks: [
    {
      id: "yt_1",
      videoId: "v1",
      rawTitle: "A - B",
      parseStatus: "parsed",
      parsedArtist: "A",
      parsedTitle: "B",
    },
  ],
  rekordboxTracks: [
    { id: "rb_1", title: "B", artist: "A", normalizedTitle: "b", normalizedArtist: "a" },
  ],
};

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("analysis-handoff", () => {
  it("save 후 read하면 동일 페이로드를 돌려준다", () => {
    saveAnalysis(sample);
    expect(readAnalysis()).toEqual(sample);
  });

  it("저장된 게 없으면 null", () => {
    expect(readAnalysis()).toBeNull();
  });

  it("malformed JSON이면 null", () => {
    window.sessionStorage.setItem("crate-finder:analysis", "{not json");
    expect(readAnalysis()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/services/analysis-handoff.test.ts`
Expected: FAIL — `@/services/analysis-handoff` 모듈 없음 (resolve 에러).

- [ ] **Step 3: Write minimal implementation**

Create `src/services/analysis-handoff.ts`:

```ts
// 분석 결과 핸드오프 — AnalysisFlow → /results 간 sessionStorage 전달.
// 저장 대상은 파싱된 메타데이터뿐(원본 XML·API Key 미포함 — ADR-004).
// 계층 규칙: components import 금지. lib/도메인 타입만 의존.

import type { MatchResult } from "@/types/match";
import type { YouTubeTrack, RekordboxTrack } from "@/types/track";

export type AnalysisHandoff = {
  results: MatchResult[];
  youtubeTracks: YouTubeTrack[];
  rekordboxTracks: RekordboxTrack[];
};

const KEY = "crate-finder:analysis";

export function saveAnalysis(payload: AnalysisHandoff): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // 저장 실패(쿼터 등)는 무시 — 핸드오프는 best-effort.
  }
}

export function readAnalysis(): AnalysisHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AnalysisHandoff;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/services/analysis-handoff.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/analysis-handoff.ts src/services/analysis-handoff.test.ts
git commit -m "feat(analysis): add sessionStorage handoff for analysis results"
```

---

## Task 2: analysis.service 실제 배선 (fetch + matcher)

**Files:**
- Modify (전면 교체): `src/services/analysis.service.ts`
- Modify (재작성): `src/services/analysis.service.test.ts`

- [ ] **Step 1: Rewrite the test (failing)**

Replace entire contents of `src/services/analysis.service.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadPlaylist, parseXml, runMatch } from "@/services/analysis.service";
import type {
  YouTubePlaylistResponse,
  RekordboxParseResponse,
} from "@/types/api";

function jsonResponse(body: unknown): Response {
  return { json: async () => body } as Response;
}

beforeEach(() => {
  vi.restoreAllMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("analysis.service", () => {
  it("loadPlaylist: 유효 URL이면 라우트 호출 후 data를 언랩한다", async () => {
    const data: YouTubePlaylistResponse = {
      playlistId: "PL1",
      tracks: [],
      unavailableCount: 0,
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ ok: true, data }));
    const res = await loadPlaylist(
      "https://www.youtube.com/playlist?list=PL1",
    );
    expect(res).toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/youtube/playlist",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("loadPlaylist: 유효하지 않은 URL이면 fetch 전에 throw", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(loadPlaylist("not-a-url")).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loadPlaylist: 라우트가 ok:false면 error.message로 throw", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        ok: false,
        error: { code: "youtube_error", message: "쿼터 초과" },
      }),
    );
    await expect(
      loadPlaylist("https://www.youtube.com/playlist?list=PL1"),
    ).rejects.toThrow("쿼터 초과");
  });

  it("parseXml: 비-xml 파일이면 fetch 전에 throw", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const file = new File(["x"], "library.txt", { type: "text/plain" });
    await expect(parseXml(file)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("parseXml: .xml이면 FormData로 라우트 호출 후 언랩", async () => {
    const data: RekordboxParseResponse = {
      trackCount: 0,
      tracks: [],
      warnings: [],
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ ok: true, data }));
    const file = new File(["<xml/>"], "library.xml", { type: "text/xml" });
    const res = await parseXml(file);
    expect(res).toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/rekordbox/parse",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("runMatch: 입력 YouTube 트랙당 MatchResult 1개를 반환한다(matcher 배선)", async () => {
    const playlist: YouTubePlaylistResponse = {
      playlistId: "PL1",
      tracks: [
        {
          id: "yt_1",
          videoId: "v1",
          rawTitle: "Daft Punk - One More Time",
          parseStatus: "parsed",
          parsedArtist: "Daft Punk",
          parsedTitle: "One More Time",
        },
      ],
      unavailableCount: 0,
    };
    const library: RekordboxParseResponse = {
      trackCount: 1,
      tracks: [
        {
          id: "rb_1",
          title: "One More Time",
          artist: "Daft Punk",
          normalizedTitle: "one more time",
          normalizedArtist: "daft punk",
        },
      ],
      warnings: [],
    };
    const results = await runMatch(playlist, library);
    expect(results).toHaveLength(1);
    expect(results[0].youtubeTrackId).toBe("yt_1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/services/analysis.service.test.ts`
Expected: FAIL — 현재 구현은 mock(`sample-data`)이라 `loadPlaylist`가 `fetch`를 호출하지 않음 → `fetchMock` 호출 단언 실패.

- [ ] **Step 3: Replace the implementation**

Replace entire contents of `src/services/analysis.service.ts`:

```ts
// 분석 서비스 — 실제 API 라우트 호출 + 순수 matcher 엔진.
// 외부 API Key는 라우트(서버)에만 존재 → 이 모듈은 client에서 호출 가능.
// 계층 규칙(CLAUDE.md): services → lib(matcher) 허용. components import 금지.

import type {
  ApiResult,
  YouTubePlaylistResponse,
  RekordboxParseResponse,
} from "@/types/api";
import type { MatchResult } from "@/types/match";
import { parsePlaylistUrl } from "@/lib/youtube/parse-playlist-url";
import { matchTracks } from "@/lib/matcher/match";

function unwrap<T>(res: ApiResult<T>): T {
  if (!res.ok) throw new Error(res.error.message);
  return res.data;
}

export async function loadPlaylist(
  url: string,
): Promise<YouTubePlaylistResponse> {
  parsePlaylistUrl(url); // 유효하지 않으면 네트워크 전에 즉시 throw
  const res = await fetch("/api/youtube/playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return unwrap((await res.json()) as ApiResult<YouTubePlaylistResponse>);
}

export async function parseXml(file: File): Promise<RekordboxParseResponse> {
  if (!file.name.toLowerCase().endsWith(".xml")) {
    throw new Error("XML 파일만 업로드할 수 있습니다.");
  }
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/rekordbox/parse", {
    method: "POST",
    body: form,
  });
  return unwrap((await res.json()) as ApiResult<RekordboxParseResponse>);
}

export async function runMatch(
  playlist: YouTubePlaylistResponse,
  library: RekordboxParseResponse,
): Promise<MatchResult[]> {
  return matchTracks(playlist.tracks, library.tracks);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/services/analysis.service.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/analysis.service.ts src/services/analysis.service.test.ts
git commit -m "feat(analysis): wire analysis.service to API routes + matcher"
```

---

## Task 3: results loader 재작성 (핸드오프 → MatchRow[])

**Files:**
- Modify (전면 교체): `src/app/results/loader.ts`
- Modify (재작성): `src/app/results/loader.test.ts`

- [ ] **Step 1: Rewrite the test (failing)**

Replace entire contents of `src/app/results/loader.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { loadMatchRows } from "@/app/results/loader";
import { saveAnalysis } from "@/services/analysis-handoff";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("loadMatchRows", () => {
  it("핸드오프가 없으면 빈 배열", () => {
    expect(loadMatchRows()).toEqual([]);
  });

  it("저장된 분석에서 MatchRow[]를 조립한다", () => {
    saveAnalysis({
      results: [
        {
          id: "mr_1",
          youtubeTrackId: "yt_1",
          matchedRekordboxTrackId: "rb_1",
          status: "owned",
          confidence: "high",
          score: 0.98,
          candidates: [],
        },
        {
          id: "mr_2",
          youtubeTrackId: "yt_2",
          status: "missing",
          confidence: "low",
          score: 0,
          candidates: [],
        },
      ],
      youtubeTracks: [
        {
          id: "yt_1",
          videoId: "v1",
          rawTitle: "A - B",
          parseStatus: "parsed",
          parsedArtist: "A",
          parsedTitle: "B",
        },
        {
          id: "yt_2",
          videoId: "v2",
          rawTitle: "C - D",
          parseStatus: "parsed",
          parsedArtist: "C",
          parsedTitle: "D",
        },
      ],
      rekordboxTracks: [
        { id: "rb_1", title: "B", artist: "A", normalizedTitle: "b", normalizedArtist: "a" },
      ],
    });
    const rows = loadMatchRows();
    expect(rows).toHaveLength(2);
    expect(rows[0].youtubeTrack.id).toBe("yt_1");
    expect(rows[0].matchedTrack?.id).toBe("rb_1");
    expect(rows[1].matchedTrack).toBeUndefined();
  });

  it("youtubeTrack이 누락된 결과 행은 skip한다", () => {
    saveAnalysis({
      results: [
        {
          id: "mr_1",
          youtubeTrackId: "yt_missing",
          status: "missing",
          confidence: "low",
          score: 0,
          candidates: [],
        },
      ],
      youtubeTracks: [],
      rekordboxTracks: [],
    });
    expect(loadMatchRows()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/results/loader.test.ts`
Expected: FAIL — 현재 `loadMatchRows`는 `sample-data`를 반환하므로 "핸드오프 없으면 빈 배열"이 실패(mock 데이터 반환).

- [ ] **Step 3: Replace the implementation**

Replace entire contents of `src/app/results/loader.ts`:

```ts
import { readAnalysis } from "@/services/analysis-handoff";
import type { MatchRow } from "@/components/results/match-row";

// /results 데이터 진입점. 핸드오프(sessionStorage)에서 분석 결과를 읽어 행을 조립한다.
// 핸드오프가 없으면 빈 배열. YouTube 트랙이 없는 결과 행은 방어적으로 제외한다.
export function loadMatchRows(): MatchRow[] {
  const analysis = readAnalysis();
  if (!analysis) return [];
  const { results, youtubeTracks, rekordboxTracks } = analysis;
  return results.flatMap((result) => {
    const youtubeTrack = youtubeTracks.find(
      (t) => t.id === result.youtubeTrackId,
    );
    if (!youtubeTrack) return [];
    const matchedTrack = result.matchedRekordboxTrackId
      ? rekordboxTracks.find((t) => t.id === result.matchedRekordboxTrackId)
      : undefined;
    return [{ result, youtubeTrack, matchedTrack }];
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/results/loader.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/results/loader.ts src/app/results/loader.test.ts
git commit -m "feat(analysis): build result rows from sessionStorage handoff"
```

---

## Task 4: AnalysisFlow에서 결과 저장 후 이동

**Files:**
- Modify: `src/components/analysis/AnalysisFlow.tsx` (import 추가 + `handleRun` 본문)
- Modify: `src/components/analysis/AnalysisFlow.test.tsx` (handoff 모킹 + 신규 케이스)

- [ ] **Step 1: Add the failing test**

In `src/components/analysis/AnalysisFlow.test.tsx`, add the handoff mock near the existing mocks (right after the `vi.mock("@/services/analysis.service", ...)` block):

```ts
vi.mock("@/services/analysis-handoff", () => ({ saveAnalysis: vi.fn() }));
```

Add to the existing imports block (after the `analysis.service` import line):

```ts
import { saveAnalysis } from "@/services/analysis-handoff";
```

Add to the `vi.mocked(...)` declarations (after `mockedRun`):

```ts
const mockedSave = vi.mocked(saveAnalysis);
```

Then add this test inside the `describe("AnalysisFlow", ...)` block:

```ts
  it("Run 클릭 시 결과를 저장한 뒤 /results로 이동한다", async () => {
    mockedLoad.mockResolvedValue(playlistRes(2));
    mockedParse.mockResolvedValue(parseRes(5));
    const matchResults = [
      {
        id: "mr_1",
        youtubeTrackId: "yt_1",
        status: "missing",
        confidence: "low",
        score: 0,
        candidates: [],
      },
    ] as unknown as Awaited<ReturnType<typeof runMatch>>;
    mockedRun.mockResolvedValue(matchResults);

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

    await user.click(screen.getByRole("button", { name: "Run Match" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/results"));
    expect(mockedSave).toHaveBeenCalledWith(
      expect.objectContaining({ results: matchResults }),
    );
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/analysis/AnalysisFlow.test.tsx`
Expected: FAIL — 새 케이스에서 `mockedSave`가 호출되지 않음(`handleRun`이 아직 `saveAnalysis`를 부르지 않음).

- [ ] **Step 3: Wire saveAnalysis into AnalysisFlow**

In `src/components/analysis/AnalysisFlow.tsx`, add import after the `analysis.service` import:

```ts
import { saveAnalysis } from "@/services/analysis-handoff";
```

Replace the `handleRun` function body:

```ts
  async function handleRun() {
    if (!playlist || !library) return;
    setError("");
    setMatching(true);
    try {
      const results = await runMatch(playlist, library);
      saveAnalysis({
        results,
        youtubeTracks: playlist.tracks,
        rekordboxTracks: library.tracks,
      });
      router.push("/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석에 실패했습니다.");
      setMatching(false);
    }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/analysis/AnalysisFlow.test.tsx`
Expected: PASS (기존 5 + 신규 1 = 6 tests). 기존 "둘 다 준비되면…" 테스트도 `saveAnalysis`가 no-op 모킹이라 그대로 통과.

- [ ] **Step 5: Commit**

```bash
git add src/components/analysis/AnalysisFlow.tsx src/components/analysis/AnalysisFlow.test.tsx
git commit -m "feat(analysis): save match results before navigating to /results"
```

---

## Task 5: /results 페이지 client 전환 + 빈 상태

**Files:**
- Modify (전면 교체): `src/app/results/page.tsx`
- Create: `src/app/results/page.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/app/results/page.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { MatchRow } from "@/components/results/match-row";

vi.mock("@/app/results/loader", () => ({ loadMatchRows: vi.fn() }));
import { loadMatchRows } from "@/app/results/loader";
import ResultsPage from "@/app/results/page";

const mockedLoad = vi.mocked(loadMatchRows);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ResultsPage", () => {
  it("핸드오프가 없으면 빈 상태 안내와 / 링크를 보여준다", async () => {
    mockedLoad.mockReturnValue([]);
    render(<ResultsPage />);
    expect(await screen.findByText(/분석을 먼저 실행/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /새 분석/ })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("결과가 있으면 테이블을 렌더한다", async () => {
    const rows: MatchRow[] = [
      {
        result: {
          id: "mr_1",
          youtubeTrackId: "yt_1",
          matchedRekordboxTrackId: "rb_1",
          status: "owned",
          confidence: "high",
          score: 0.98,
          candidates: [],
        },
        youtubeTrack: {
          id: "yt_1",
          videoId: "v1",
          rawTitle: "A - B",
          parseStatus: "parsed",
          parsedArtist: "A",
          parsedTitle: "B",
        },
        matchedTrack: {
          id: "rb_1",
          title: "B",
          artist: "A",
          normalizedTitle: "b",
          normalizedArtist: "a",
        },
      },
    ];
    mockedLoad.mockReturnValue(rows);
    render(<ResultsPage />);
    await waitFor(() =>
      expect(screen.getByRole("table")).toBeInTheDocument(),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/results/page.test.tsx`
Expected: FAIL — 현재 `page.tsx`는 server component로 `loadMatchRows()`를 동기 호출하고 빈 상태 UI가 없어 `/분석을 먼저 실행/` 텍스트를 찾지 못함.

- [ ] **Step 3: Replace the page**

Replace entire contents of `src/app/results/page.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { WindowPanel } from "@/components/ui/WindowPanel";
import { MatchResultTable } from "@/components/results/MatchResultTable";
import { loadMatchRows } from "@/app/results/loader";
import type { MatchRow } from "@/components/results/match-row";

export default function ResultsPage() {
  // sessionStorage는 SSR에서 읽으면 hydration mismatch → mount 후 useEffect에서 채운다.
  const [rows, setRows] = useState<MatchRow[] | null>(null);

  useEffect(() => {
    setRows(loadMatchRows());
  }, []);

  if (rows === null) {
    return (
      <AppShell statusText="결과 불러오는 중…">
        <WindowPanel title="Match Results">
          <p className="p-4 text-sm text-[color:var(--color-text-muted)]">
            불러오는 중…
          </p>
        </WindowPanel>
      </AppShell>
    );
  }

  if (rows.length === 0) {
    return (
      <AppShell statusText="결과 없음">
        <WindowPanel title="Match Results">
          <div className="flex flex-col items-start gap-3 p-4">
            <p className="text-sm">
              분석 결과가 없습니다. 분석을 먼저 실행하세요.
            </p>
            <a href="/" className="text-sm underline">
              ← 새 분석 시작
            </a>
          </div>
        </WindowPanel>
      </AppShell>
    );
  }

  return (
    <AppShell statusText={`${rows.length} tracks analyzed`}>
      <WindowPanel title="Match Results">
        <MatchResultTable rows={rows} />
      </WindowPanel>
    </AppShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/results/page.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/results/page.tsx src/app/results/page.test.tsx
git commit -m "feat(analysis): make /results client-driven with empty state"
```

---

## Task 6: 전체 검증

- [ ] **Step 1: Run full verification**

Run: `bash scripts/verify.sh`
Expected: lint → build → test 모두 통과. (`sample-data`는 더 이상 import되지 않지만 파일은 남겨둔다 — 다른 테스트 fixture에서 사용 가능.)

- [ ] **Step 2: lint가 미사용 import를 잡으면 정리**

`src/app/results/loader.ts`·`src/services/analysis.service.ts`에서 제거한 `sample-data` import가 남아있지 않은지 확인. 남으면 삭제 후 재검증.

- [ ] **Step 3: 최종 커밋(있다면)**

```bash
git status
# 변경 있으면:
git add -A && git commit -m "chore(analysis): cleanup after integration wiring"
```

---

## Self-Review Notes (작성자 확인 완료)

- **Spec 커버리지:** §5.1 service(Task 2)·§5.2 handoff(Task 1)·§5.3 AnalysisFlow(Task 4)·§5.4 loader(Task 3)·§5.5 page+hydration(Task 5)·§6 보안(handoff는 파싱 메타데이터만 저장)·§7 테스트(전 Task) 모두 매핑됨.
- **타입 일관성:** `AnalysisHandoff`(results/youtubeTracks/rekordboxTracks) — Task 1 정의 → Task 3·4에서 동일 형태로 사용. `saveAnalysis`/`readAnalysis`/`loadMatchRows`/`runMatch`/`matchTracks` 시그니처 일치.
- **범위:** YouTube 실제 fetcher·가격·삭제·전역상태 미포함(spec §2 제외와 일치).
- **runMatch 테스트:** matcher 내부 정확도는 matcher 자체 테스트가 담당. 여기선 "입력 YT 트랙 수 = 출력 MatchResult 수"로 배선만 검증(견고).
