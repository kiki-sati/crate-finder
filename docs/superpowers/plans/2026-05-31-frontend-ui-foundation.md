# Frontend UI Foundation (Phase 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 레트로(클래식 Macintosh) 스타일의 UI 골격과 결과 테이블을 mock 데이터로 완성한다. 실제 API 없이 `src/mocks/sample-data.ts`만으로 끝까지 렌더된다.

**Architecture:** 프리미티브(AppShell/WindowPanel/Button/Input) → 배지 → 입력 폼 → 결과 테이블/필터 순으로 빌드. 컴포넌트는 데이터를 props로 받고, 페이지 레벨 로더가 mock을 주입(통합 시 이 로더 한 곳만 실제 fetch로 교체). 디자인 토큰은 이미 `globals.css @theme`로 노출됨(`bg-app/window/panel`, `text-owned`, `bg-owned-bg`, `border-strong`, `text-accent` 등).

**Tech Stack:** Next.js 15.5 App Router · React 19 · TypeScript strict · Tailwind v4(CSS-first) · Vitest 4 + @testing-library/react(jsdom).

---

## 에이전트 가드레일 (필수 — 시작 전 숙지)

- **분기 베이스**: `chore/freeze-contract`. 작업 브랜치: `feature/ui-foundation` (워크트리 격리).
- **파일 생성 화이트리스트**:
  - `src/components/**`
  - `src/styles/*` (필요 시 토큰 보강만)
  - `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/results/**` 및 **`src/app/api/` 를 제외한** 앱 라우트
- **절대 수정 금지**: `src/types/*`, `src/mocks/*`, `src/lib/*`, `src/services/*`, `src/app/api/*`. 계약(`types`/`mocks`)이 부족하면 **고치지 말고 멈춰서 보고**.
- **계층 규칙**: 컴포넌트에서 XML 파싱·매칭·외부 API 직접 호출 금지. 데이터는 props/로더로만.
- **디자인 규칙(UI_GUIDE)**: Apple 로고·실제 Mac 시스템 아이콘 금지. 과한 네온·글래스모피즘 금지. 2px 검은 테두리(`border-strong`) 기반 레트로 창 스타일.
- **DoD**: 매 Task 끝 `git commit`, 트랙 종료 시 `bash scripts/verify.sh` green. 완료 시 자기보고 반환.
- **참조 문서**: `docs/UI_GUIDE.md`, `docs/ui/COMPONENTS.md`, `docs/ui/PAGES.md`, `docs/PRD.md §8`(타입). 데이터: `src/mocks/sample-data.ts`(읽기 전용).

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/components/layout/AppShell.tsx` | 메뉴바 + 메인 + 상태바 프레임 |
| `src/components/layout/TopMenuBar.tsx` | 상단 메뉴바 |
| `src/components/ui/WindowPanel.tsx` | 제목 달린 레트로 창 |
| `src/components/ui/Button.tsx` | primary/secondary/danger 버튼 |
| `src/components/ui/Input.tsx` | 텍스트 입력 |
| `src/components/results/StatusBadge.tsx` | TrackStatus 배지 |
| `src/components/results/ConfidenceBadge.tsx` | MatchConfidence 배지 |
| `src/components/playlist/PlaylistUrlForm.tsx` | URL 입력 폼 |
| `src/components/rekordbox/FileUploadBox.tsx` | XML 업로드 박스 |
| `src/components/results/match-row.ts` | 테이블 행 뷰모델 타입 |
| `src/components/results/MatchResultTable.tsx` | 결과 테이블(7컬럼) |
| `src/components/results/ResultFilters.tsx` | 상태/신뢰도 필터 |
| `src/app/results/loader.ts` | mock → 화면용 데이터(통합 시 교체 지점) |
| `src/app/results/page.tsx` | 결과 페이지(테이블+필터 조립) |

각 컴포넌트는 `*.test.tsx`(같은 폴더)로 검증. 테스트 스타일은 `src/lib/normalizer.test.ts`(vitest) +
`@testing-library/react`를 따른다.

---

## Task 1: WindowPanel (레트로 창 프리미티브)

**Files:**
- Test: `src/components/ui/WindowPanel.test.tsx`
- Create: `src/components/ui/WindowPanel.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WindowPanel } from "@/components/ui/WindowPanel";

describe("WindowPanel", () => {
  it("제목과 자식을 렌더한다", () => {
    render(
      <WindowPanel title="Playlist">
        <p>inner</p>
      </WindowPanel>,
    );
    expect(screen.getByText("Playlist")).toBeInTheDocument();
    expect(screen.getByText("inner")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/ui/WindowPanel.test.tsx`
Expected: FAIL (모듈 없음).

- [ ] **Step 3: 최소 구현**

```tsx
import type { ReactNode } from "react";

export function WindowPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-2 border-strong bg-window">
      <header className="border-b-2 border-strong bg-panel px-3 py-1 text-sm font-semibold">
        {title}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/ui/WindowPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/WindowPanel.tsx src/components/ui/WindowPanel.test.tsx
git commit -m "feat(ui): add WindowPanel primitive"
```

---

## Task 2: Button + Input

**Files:**
- Test: `src/components/ui/Button.test.tsx`
- Create: `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("라벨을 렌더하고 클릭 시 onClick을 호출한다", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Run</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Run" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
  it("variant=danger 클래스를 적용한다", () => {
    render(<Button variant="danger">Del</Button>);
    expect(screen.getByRole("button", { name: "Del" }).className).toMatch(/danger/);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/ui/Button.test.tsx`
Expected: FAIL.

- [ ] **Step 3: 최소 구현**

```tsx
// src/components/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger";
const VARIANT: Record<Variant, string> = {
  primary: "bg-accent text-white",
  secondary: "bg-panel text-[color:var(--color-text-primary)]",
  danger: "bg-[color:var(--color-danger)] text-white danger",
};

export function Button({
  variant = "primary",
  children,
  ...rest
}: { variant?: Variant; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`border-2 border-strong px-4 py-1 text-sm font-semibold disabled:opacity-50 ${VARIANT[variant]}`}
    >
      {children}
    </button>
  );
}
```

```tsx
// src/components/ui/Input.tsx
import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 w-full border border-strong bg-panel px-3 text-sm outline-none focus:border-accent"
    />
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/ui/Button.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Button.tsx src/components/ui/Input.tsx src/components/ui/Button.test.tsx
git commit -m "feat(ui): add Button and Input primitives"
```

---

## Task 3: AppShell + TopMenuBar

**Files:**
- Test: `src/components/layout/AppShell.test.tsx`
- Create: `src/components/layout/TopMenuBar.tsx`, `src/components/layout/AppShell.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "@/components/layout/AppShell";

describe("AppShell", () => {
  it("메뉴바 제목과 본문, 상태바를 렌더한다", () => {
    render(<AppShell statusText="Ready">body</AppShell>);
    expect(screen.getByText("Crate Finder")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/layout/AppShell.test.tsx`
Expected: FAIL.

- [ ] **Step 3: 최소 구현**

```tsx
// src/components/layout/TopMenuBar.tsx
export function TopMenuBar() {
  return (
    <div className="flex h-9 items-center border-b-2 border-strong bg-panel px-3 text-sm font-bold">
      Crate Finder
    </div>
  );
}
```

```tsx
// src/components/layout/AppShell.tsx
import type { ReactNode } from "react";
import { TopMenuBar } from "@/components/layout/TopMenuBar";

export function AppShell({
  children,
  statusText = "",
}: {
  children: ReactNode;
  statusText?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-app">
      <TopMenuBar />
      <main className="flex-1 p-6">{children}</main>
      <footer className="border-t-2 border-strong bg-panel px-3 py-1 text-xs text-[color:var(--color-text-muted)]">
        {statusText}
      </footer>
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/layout/AppShell.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/ src/components/layout/AppShell.test.tsx
git commit -m "feat(ui): add AppShell and TopMenuBar"
```

---

## Task 4: StatusBadge + ConfidenceBadge

**Files:**
- Test: `src/components/results/StatusBadge.test.tsx`
- Create: `src/components/results/StatusBadge.tsx`, `src/components/results/ConfidenceBadge.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/results/StatusBadge";
import { ConfidenceBadge } from "@/components/results/ConfidenceBadge";

describe("StatusBadge", () => {
  it("owned 라벨과 색 클래스를 렌더한다", () => {
    render(<StatusBadge status="owned" />);
    const el = screen.getByText("Owned");
    expect(el).toBeInTheDocument();
    expect(el.className).toMatch(/owned/);
  });
  it("needs_review는 'Needs Review'로 표시한다", () => {
    render(<StatusBadge status="needs_review" />);
    expect(screen.getByText("Needs Review")).toBeInTheDocument();
  });
});

describe("ConfidenceBadge", () => {
  it("confidence 라벨을 렌더한다", () => {
    render(<ConfidenceBadge confidence="high" />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/results/StatusBadge.test.tsx`
Expected: FAIL.

- [ ] **Step 3: 최소 구현**

```tsx
// src/components/results/StatusBadge.tsx
import type { TrackStatus } from "@/types/track";

const MAP: Record<TrackStatus, { label: string; cls: string }> = {
  owned: { label: "Owned", cls: "text-owned bg-owned-bg owned" },
  missing: { label: "Missing", cls: "text-missing bg-missing-bg missing" },
  needs_review: { label: "Needs Review", cls: "text-review bg-review-bg review" },
};

export function StatusBadge({ status }: { status: TrackStatus }) {
  const { label, cls } = MAP[status];
  return (
    <span className={`inline-block border border-strong px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
```

```tsx
// src/components/results/ConfidenceBadge.tsx
import type { MatchConfidence } from "@/types/track";

const LABEL: Record<MatchConfidence, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function ConfidenceBadge({ confidence }: { confidence: MatchConfidence }) {
  return (
    <span className="inline-block px-2 py-0.5 text-xs text-[color:var(--color-text-secondary)]">
      {LABEL[confidence]}
    </span>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/results/StatusBadge.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/results/StatusBadge.tsx src/components/results/ConfidenceBadge.tsx src/components/results/StatusBadge.test.tsx
git commit -m "feat(results): add StatusBadge and ConfidenceBadge"
```

---

## Task 5: PlaylistUrlForm + FileUploadBox

**Files:**
- Test: `src/components/playlist/PlaylistUrlForm.test.tsx`
- Create: `src/components/playlist/PlaylistUrlForm.tsx`, `src/components/rekordbox/FileUploadBox.tsx`

폼은 client component. 제출 시 `onSubmit(url)` 콜백만 호출(실제 fetch는 통합 단계 책임).

- [ ] **Step 1: 실패 테스트 작성**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlaylistUrlForm } from "@/components/playlist/PlaylistUrlForm";

describe("PlaylistUrlForm", () => {
  it("입력한 URL로 onSubmit을 호출한다", async () => {
    const onSubmit = vi.fn();
    render(<PlaylistUrlForm onSubmit={onSubmit} />);
    await userEvent.type(
      screen.getByPlaceholderText(/playlist/i),
      "https://youtube.com/playlist?list=PLx",
    );
    await userEvent.click(screen.getByRole("button", { name: /load/i }));
    expect(onSubmit).toHaveBeenCalledWith("https://youtube.com/playlist?list=PLx");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/playlist/PlaylistUrlForm.test.tsx`
Expected: FAIL.

- [ ] **Step 3: 최소 구현**

```tsx
// src/components/playlist/PlaylistUrlForm.tsx
"use client";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function PlaylistUrlForm({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [url, setUrl] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(url);
      }}
    >
      <Input
        placeholder="YouTube playlist URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Button type="submit">Load</Button>
    </form>
  );
}
```

```tsx
// src/components/rekordbox/FileUploadBox.tsx
"use client";
import { Button } from "@/components/ui/Button";

export function FileUploadBox({ onFile }: { onFile: (file: File) => void }) {
  return (
    <div className="border-2 border-dashed border-strong bg-panel p-6 text-center text-sm">
      <p className="mb-2">Rekordbox XML 파일을 선택하세요.</p>
      <label>
        <input
          type="file"
          accept=".xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        <Button type="button" variant="secondary">
          Choose file
        </Button>
      </label>
      <p className="mt-3 text-xs text-[color:var(--color-text-muted)]">
        원본 XML은 파싱 후 폐기되며 저장되지 않습니다.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/playlist/PlaylistUrlForm.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/playlist/ src/components/rekordbox/
git commit -m "feat(ui): add PlaylistUrlForm and FileUploadBox"
```

---

## Task 6: MatchRow 뷰모델 + MatchResultTable

**Files:**
- Create: `src/components/results/match-row.ts`
- Test: `src/components/results/MatchResultTable.test.tsx`
- Create: `src/components/results/MatchResultTable.tsx`

- [ ] **Step 1: 뷰모델 타입 작성**

```ts
// src/components/results/match-row.ts
import type { MatchResult } from "@/types/match";
import type { YouTubeTrack, RekordboxTrack } from "@/types/track";

// 테이블 한 행에 필요한 데이터 묶음(도메인 타입 조합, UI 전용).
export type MatchRow = {
  result: MatchResult;
  youtubeTrack: YouTubeTrack;
  matchedTrack?: RekordboxTrack;
};
```

- [ ] **Step 2: 실패 테스트 작성**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchResultTable } from "@/components/results/MatchResultTable";
import type { MatchRow } from "@/components/results/match-row";

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
      rawTitle: "Daft Punk - One More Time",
      parsedArtist: "Daft Punk",
      parsedTitle: "One More Time",
      parseStatus: "parsed",
    },
    matchedTrack: {
      id: "rb_1",
      title: "One More Time",
      artist: "Daft Punk",
      normalizedTitle: "one more time",
      normalizedArtist: "daft punk",
    },
  },
];

describe("MatchResultTable", () => {
  it("행의 곡명/아티스트와 상태 배지를 렌더한다", () => {
    render(<MatchResultTable rows={rows} />);
    expect(screen.getByText("One More Time")).toBeInTheDocument();
    expect(screen.getByText("Daft Punk")).toBeInTheDocument();
    expect(screen.getByText("Owned")).toBeInTheDocument();
  });
  it("빈 목록이면 안내 문구를 표시한다", () => {
    render(<MatchResultTable rows={[]} />);
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run src/components/results/MatchResultTable.test.tsx`
Expected: FAIL.

- [ ] **Step 4: 최소 구현**

```tsx
// src/components/results/MatchResultTable.tsx
import type { MatchRow } from "@/components/results/match-row";
import { StatusBadge } from "@/components/results/StatusBadge";
import { ConfidenceBadge } from "@/components/results/ConfidenceBadge";

const HEADERS = ["#", "Track", "Artist", "Status", "Confidence", "Matched", "Action"];

export function MatchResultTable({ rows }: { rows: MatchRow[] }) {
  if (rows.length === 0) {
    return <p className="p-4 text-sm text-[color:var(--color-text-muted)]">No results</p>;
  }
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b-2 border-strong text-left">
          {HEADERS.map((h) => (
            <th key={h} className="px-2 py-1 font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const yt = row.youtubeTrack;
          return (
            <tr key={row.result.id} className="border-b border-[color:var(--color-border-soft)]">
              <td className="px-2 py-1">{i + 1}</td>
              <td className="px-2 py-1">{yt.parsedTitle ?? yt.rawTitle}</td>
              <td className="px-2 py-1">{yt.parsedArtist ?? "—"}</td>
              <td className="px-2 py-1">
                <StatusBadge status={row.result.status} />
              </td>
              <td className="px-2 py-1">
                <ConfidenceBadge confidence={row.result.confidence} />
              </td>
              <td className="px-2 py-1">{row.matchedTrack?.title ?? "—"}</td>
              <td className="px-2 py-1" />
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/components/results/MatchResultTable.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/results/match-row.ts src/components/results/MatchResultTable.tsx src/components/results/MatchResultTable.test.tsx
git commit -m "feat(results): add MatchResultTable with MatchRow view-model"
```

---

## Task 7: ResultFilters

**Files:**
- Test: `src/components/results/ResultFilters.test.tsx`
- Create: `src/components/results/ResultFilters.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultFilters } from "@/components/results/ResultFilters";

describe("ResultFilters", () => {
  it("필터 버튼 클릭 시 onChange로 해당 값을 전달한다", async () => {
    const onChange = vi.fn();
    render(<ResultFilters value="all" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /missing/i }));
    expect(onChange).toHaveBeenCalledWith("missing");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/results/ResultFilters.test.tsx`
Expected: FAIL.

- [ ] **Step 3: 최소 구현**

```tsx
// src/components/results/ResultFilters.tsx
"use client";
import { Button } from "@/components/ui/Button";

export type ResultFilter = "all" | "owned" | "missing" | "needs_review";
const FILTERS: { key: ResultFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "owned", label: "Owned" },
  { key: "missing", label: "Missing" },
  { key: "needs_review", label: "Needs Review" },
];

export function ResultFilters({
  value,
  onChange,
}: {
  value: ResultFilter;
  onChange: (f: ResultFilter) => void;
}) {
  return (
    <div className="flex gap-2">
      {FILTERS.map((f) => (
        <Button
          key={f.key}
          variant={value === f.key ? "primary" : "secondary"}
          onClick={() => onChange(f.key)}
        >
          {f.label}
        </Button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/results/ResultFilters.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/results/ResultFilters.tsx src/components/results/ResultFilters.test.tsx
git commit -m "feat(results): add ResultFilters"
```

---

## Task 8: 페이지 로더(mock) + 결과 페이지 조립

**Files:**
- Test: `src/app/results/loader.test.ts`
- Create: `src/app/results/loader.ts`, `src/app/results/page.tsx`

로더는 mock을 `MatchRow[]`로 조립한다. **통합 단계에서 이 함수 한 곳만 실제 fetch로 교체**한다.

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from "vitest";
import { loadMatchRows } from "@/app/results/loader";

describe("loadMatchRows", () => {
  it("mock에서 MatchResult를 YouTube/Rekordbox 트랙과 조인한다", () => {
    const rows = loadMatchRows();
    expect(rows.length).toBeGreaterThan(0);
    const owned = rows.find((r) => r.result.status === "owned");
    expect(owned?.youtubeTrack.id).toBe(owned?.result.youtubeTrackId);
    expect(owned?.matchedTrack?.id).toBe(owned?.result.matchedRekordboxTrackId);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/app/results/loader.test.ts`
Expected: FAIL.

- [ ] **Step 3: 최소 구현**

```ts
// src/app/results/loader.ts
import {
  sampleMatchResults,
  sampleYouTubeTracks,
  sampleRekordboxTracks,
} from "@/mocks/sample-data";
import type { MatchRow } from "@/components/results/match-row";

// 통합 시 교체 지점: mock 대신 /api/analysis 결과를 받아 동일한 MatchRow[]를 만든다.
export function loadMatchRows(): MatchRow[] {
  return sampleMatchResults.map((result) => ({
    result,
    youtubeTrack: sampleYouTubeTracks.find((t) => t.id === result.youtubeTrackId)!,
    matchedTrack: sampleRekordboxTracks.find(
      (t) => t.id === result.matchedRekordboxTrackId,
    ),
  }));
}
```

```tsx
// src/app/results/page.tsx
import { AppShell } from "@/components/layout/AppShell";
import { WindowPanel } from "@/components/ui/WindowPanel";
import { MatchResultTable } from "@/components/results/MatchResultTable";
import { loadMatchRows } from "@/app/results/loader";

export default function ResultsPage() {
  const rows = loadMatchRows();
  return (
    <AppShell statusText={`${rows.length} tracks analyzed`}>
      <WindowPanel title="Match Results">
        <MatchResultTable rows={rows} />
      </WindowPanel>
    </AppShell>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/app/results/loader.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/results/
git commit -m "feat(results): mock loader and results page"
```

---

## Task 9: 트랙 종단 검증

- [ ] **Step 1: 전체 검증**

Run: `bash scripts/verify.sh`
Expected: lint→build→test 모두 green. `/results` 라우트가 빌드되고 모든 컴포넌트 테스트 통과.

- [ ] **Step 2: 화이트리스트 자기점검**

Run: `git diff --name-only chore/freeze-contract...HEAD`
Expected: `components/`·`styles/`·`app/(non-api)`만. `types/`·`mocks/`·`lib/`·`services/`·`app/api/` 변경 0.

- [ ] **Step 3: 자기보고 반환**: 변경 파일 · 추가 테스트 수 · `verify.sh` 결과 · 가정/이탈.

---

## Self-Review 체크

- 스펙 §2 Agent F 항목 전부 커버: 프리미티브(WindowPanel/Button/Input/AppShell/TopMenuBar) · 배지 2 · 입력 2 · 테이블 · 필터 · 페이지 로더. 토큰은 기존 `globals.css @theme` 재사용(신규 불요).
- 타입 일관성: `StatusBadge`는 `TrackStatus`, `ConfidenceBadge`는 `MatchConfidence`, `MatchResultTable`은 `MatchRow`(= `MatchResult`+`YouTubeTrack`+`RekordboxTrack` 조합)로 일관. 로더는 동결 mock만 읽음.
- placeholder 없음. 모든 컴포넌트에 props·테스트·명령·기대결과 명시.
- 계층 규칙 준수: 컴포넌트는 파싱/매칭/외부호출 안 함, 데이터는 로더 주입.
