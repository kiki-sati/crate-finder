# Phase 5: Pricing & Actions 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 누락곡(`status === "missing"`)에 대해 Provider 패턴 기반 구매 검색 링크/가격 후보를 제공한다.

**Architecture:** 순수 provider(`lib/pricing/*`) → 서버 전용 선택 서비스(`price-provider.service`) ← API route ← 클라이언트 fetch 헬퍼(`price.service`) ← `PriceComparePanel` ← 결과 테이블. 실제 외부 API·DB 없음. 설계 정본: `docs/superpowers/specs/2026-06-01-pricing-actions-design.md`.

**Tech Stack:** Next.js 15.5 App Router, React 19, TS strict, Vitest 4 + RTL, Tailwind v4.

**검증:** 각 Task 끝에 해당 테스트 파일 실행. 전체는 `bash scripts/verify.sh`(lint→build→test).
**계층 규칙:** `lib`/`services` → `components` import 금지. 컴포넌트는 외부 API 직접 호출 금지(우리 route 경유).

---

## File Structure

| 파일 | 책임 |
|------|------|
| `src/types/api.ts` (수정) | `PriceSearchRequest`/`PriceSearchResponse` 추가 |
| `src/lib/pricing/price-provider.ts` (생성) | `PriceProvider` 인터페이스, `PriceSearchInput`, `buildQuery` |
| `src/lib/pricing/search-link-provider.ts` (생성) | 검색 링크 provider(순수) |
| `src/lib/pricing/mock-price-provider.ts` (생성) | mock 가격 provider(순수, 결정적) |
| `src/services/price-provider.service.ts` (생성) | 서버 전용: env→provider 선택, `searchOffers` |
| `src/app/api/price/search/route.ts` (생성) | POST 라우트(thin, ApiResult 봉투) |
| `src/services/http.ts` (생성) | `readApiResult` 공유 헬퍼 |
| `src/services/analysis.service.ts` (수정) | `readResult` → 공유 `readApiResult`로 교체 |
| `src/services/price.service.ts` (생성) | 클라이언트 fetch 헬퍼 `searchPrices` |
| `src/components/price/PriceComparePanel.tsx` (생성) | 오퍼 목록 UI(새 탭 링크, 최저가 강조) |
| `src/components/results/MatchResultTable.tsx` (수정) | client 전환, missing 행 구매 액션 + 펼침 |

---

## Task 1: 타입 계약 + PriceProvider 인터페이스 + buildQuery

**Files:**
- Modify: `src/types/api.ts`
- Create: `src/lib/pricing/price-provider.ts`
- Test: `src/lib/pricing/price-provider.test.ts`

- [ ] **Step 1: `types/api.ts`에 price 타입 추가**

파일 상단 import 블록에 pricing import 추가:

```ts
import type { PriceQuote, PriceProviderMode } from "@/types/pricing";
```

파일 끝(RekordboxParseResponse 다음)에 추가:

```ts
// --- 7.4 POST /api/price/search ---
// 누락곡 구매 검색 링크/가격 후보 조회. Provider 패턴(ADR-009/017).
export type PriceSearchRequest = {
  title: string;
  artist?: string;
};

export type PriceSearchResponse = {
  query: string; // 검색에 사용한 정규화 질의
  offers: PriceQuote[];
  provider: PriceProviderMode; // 실제 사용된 provider
};
```

- [ ] **Step 2: 실패 테스트 작성** — `src/lib/pricing/price-provider.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { buildQuery } from "@/lib/pricing/price-provider";

describe("buildQuery", () => {
  it("artist가 있으면 'artist title'을 소문자로 만든다", () => {
    expect(buildQuery({ title: "One More Time", artist: "Daft Punk" })).toBe(
      "daft punk one more time",
    );
  });
  it("artist가 없으면 title만 사용한다", () => {
    expect(buildQuery({ title: "One More Time" })).toBe("one more time");
  });
  it("공백을 단일화하고 trim한다", () => {
    expect(buildQuery({ title: "  One   More  Time ", artist: " Daft Punk " })).toBe(
      "daft punk one more time",
    );
  });
  it("빈 artist 문자열은 없는 것으로 취급한다", () => {
    expect(buildQuery({ title: "One More Time", artist: "   " })).toBe("one more time");
  });
});
```

- [ ] **Step 3: 테스트 실패 확인** — `npm test -- src/lib/pricing/price-provider.test.ts` → FAIL (모듈 없음)

- [ ] **Step 4: 구현** — `src/lib/pricing/price-provider.ts`

```ts
import type { PriceProviderMode, PriceQuote } from "@/types/pricing";

export type PriceSearchInput = { title: string; artist?: string };

export type PriceProvider = {
  mode: PriceProviderMode;
  search(input: PriceSearchInput): PriceQuote[];
};

// 비교/검색용 질의 문자열. artist가 있으면 "artist title", 없으면 "title".
// trim → 공백 단일화 → 소문자.
export function buildQuery(input: PriceSearchInput): string {
  return [input.artist, input.title]
    .filter((s): s is string => Boolean(s && s.trim()))
    .map((s) => s.trim())
    .join(" ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}
```

- [ ] **Step 5: 테스트 통과 확인** — `npm test -- src/lib/pricing/price-provider.test.ts` → PASS

- [ ] **Step 6: 커밋**

```bash
git add src/types/api.ts src/lib/pricing/price-provider.ts src/lib/pricing/price-provider.test.ts
git commit -m "feat(pricing): add PriceProvider interface, buildQuery, price API types"
```

---

## Task 2: SearchLinkProvider

**Files:**
- Create: `src/lib/pricing/search-link-provider.ts`
- Test: `src/lib/pricing/search-link-provider.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from "vitest";
import { createSearchLinkProvider } from "@/lib/pricing/search-link-provider";

const provider = createSearchLinkProvider(() => "2026-06-01T00:00:00.000Z");

describe("SearchLinkProvider", () => {
  it("mode는 search_link", () => {
    expect(provider.mode).toBe("search_link");
  });
  it("사이트당 1개씩 quote를 반환한다", () => {
    const quotes = provider.search({ title: "One More Time", artist: "Daft Punk" });
    const sites = quotes.map((q) => q.site);
    expect(sites).toEqual(["Beatport", "Juno Download", "Traxsource"]);
  });
  it("각 url은 인코딩된 query를 포함하고 가격은 없다", () => {
    const quotes = provider.search({ title: "One More Time", artist: "Daft Punk" });
    const encoded = encodeURIComponent("daft punk one more time");
    for (const q of quotes) {
      expect(q.url).toContain(encoded);
      expect(q.price).toBeUndefined();
      expect(q.fetchedAt).toBe("2026-06-01T00:00:00.000Z");
    }
  });
  it("Beatport url은 beatport 도메인으로 시작한다", () => {
    const [beatport] = provider.search({ title: "X" });
    expect(beatport.url.startsWith("https://www.beatport.com/")).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인** — `npm test -- src/lib/pricing/search-link-provider.test.ts` → FAIL

- [ ] **Step 3: 구현** — `src/lib/pricing/search-link-provider.ts`

```ts
import type { PriceProvider, PriceSearchInput } from "@/lib/pricing/price-provider";
import { buildQuery } from "@/lib/pricing/price-provider";
import type { PriceQuote } from "@/types/pricing";

// 검색 링크 대상 사이트. baseUrl 뒤에 encodeURIComponent(query)를 붙인다.
// ARCHITECTURE §11.3. URL 형식은 사이트 정책 변경 시 조정 가능(저위험: 단순 링크).
const SITES: { site: string; baseUrl: string }[] = [
  { site: "Beatport", baseUrl: "https://www.beatport.com/search?q=" },
  { site: "Juno Download", baseUrl: "https://www.junodownload.com/search/?q%5Ball%5D%5B%5D=" },
  { site: "Traxsource", baseUrl: "https://www.traxsource.com/search?term=" },
];

export function createSearchLinkProvider(
  now: () => string = () => new Date().toISOString(),
): PriceProvider {
  return {
    mode: "search_link",
    search(input: PriceSearchInput): PriceQuote[] {
      const encoded = encodeURIComponent(buildQuery(input));
      const fetchedAt = now();
      return SITES.map(({ site, baseUrl }) => ({
        site,
        url: `${baseUrl}${encoded}`,
        fetchedAt,
      }));
    },
  };
}

export const searchLinkProvider = createSearchLinkProvider();
```

- [ ] **Step 4: 통과 확인** — `npm test -- src/lib/pricing/search-link-provider.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/pricing/search-link-provider.ts src/lib/pricing/search-link-provider.test.ts
git commit -m "feat(pricing): add SearchLinkProvider (Beatport/Juno/Traxsource)"
```

---

## Task 3: MockPriceProvider

**Files:**
- Create: `src/lib/pricing/mock-price-provider.ts`
- Test: `src/lib/pricing/mock-price-provider.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from "vitest";
import { createMockPriceProvider } from "@/lib/pricing/mock-price-provider";

const provider = createMockPriceProvider(() => "2026-06-01T00:00:00.000Z");

describe("MockPriceProvider", () => {
  it("mode는 mock", () => {
    expect(provider.mode).toBe("mock");
  });
  it("가격과 통화가 있는 quote들을 반환한다", () => {
    const quotes = provider.search({ title: "One More Time", artist: "Daft Punk" });
    expect(quotes.length).toBeGreaterThan(0);
    for (const q of quotes) {
      expect(typeof q.price).toBe("number");
      expect(q.currency).toBe("USD");
    }
  });
  it("정확히 1개만 isLowest=true이고 그것이 최저가다", () => {
    const quotes = provider.search({ title: "One More Time", artist: "Daft Punk" });
    const lowest = quotes.filter((q) => q.isLowest);
    expect(lowest).toHaveLength(1);
    const min = Math.min(...quotes.map((q) => q.price as number));
    expect(lowest[0].price).toBe(min);
  });
  it("동일 입력에 대해 결정적 가격을 반환한다", () => {
    const a = provider.search({ title: "One More Time", artist: "Daft Punk" });
    const b = provider.search({ title: "One More Time", artist: "Daft Punk" });
    expect(a.map((q) => q.price)).toEqual(b.map((q) => q.price));
  });
});
```

- [ ] **Step 2: 실패 확인** — `npm test -- src/lib/pricing/mock-price-provider.test.ts` → FAIL

- [ ] **Step 3: 구현** — `src/lib/pricing/mock-price-provider.ts`

```ts
import type { PriceProvider, PriceSearchInput } from "@/lib/pricing/price-provider";
import { buildQuery } from "@/lib/pricing/price-provider";
import type { PriceQuote } from "@/types/pricing";

const SITES = ["Beatport", "Juno Download", "Traxsource"];

// query에서 결정적 의사난수 시드 생성(테스트 안정성을 위해 Math.random 미사용).
function seedFrom(query: string): number {
  let h = 0;
  for (let i = 0; i < query.length; i++) {
    h = (h * 31 + query.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function createMockPriceProvider(
  now: () => string = () => new Date().toISOString(),
): PriceProvider {
  return {
    mode: "mock",
    search(input: PriceSearchInput): PriceQuote[] {
      const query = buildQuery(input);
      const seed = seedFrom(query);
      const fetchedAt = now();
      const quotes: PriceQuote[] = SITES.map((site, i) => ({
        site,
        // 1.49 ~ 3.48 범위의 결정적 가격
        price: (149 + ((seed + i * 37) % 200)) / 100,
        currency: "USD",
        url: `https://example.com/${encodeURIComponent(
          site.toLowerCase(),
        )}/${encodeURIComponent(query)}`,
        fetchedAt,
      }));
      const min = Math.min(...quotes.map((q) => q.price as number));
      let marked = false;
      return quotes.map((q) => {
        if (!marked && q.price === min) {
          marked = true;
          return { ...q, isLowest: true };
        }
        return q;
      });
    },
  };
}

export const mockPriceProvider = createMockPriceProvider();
```

- [ ] **Step 4: 통과 확인** — `npm test -- src/lib/pricing/mock-price-provider.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/pricing/mock-price-provider.ts src/lib/pricing/mock-price-provider.test.ts
git commit -m "feat(pricing): add deterministic MockPriceProvider"
```

---

## Task 4: price-provider.service (서버 전용) + provider 선택

**Files:**
- Create: `src/services/price-provider.service.ts`
- Test: `src/services/price-provider.service.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from "vitest";
import { resolveProvider, searchOffers } from "@/services/price-provider.service";

describe("price-provider.service", () => {
  it("PRICE_PROVIDER_MODE=mock 이면 mock provider", () => {
    expect(resolveProvider("mock").mode).toBe("mock");
  });
  it("search_link 이면 search-link provider", () => {
    expect(resolveProvider("search_link").mode).toBe("search_link");
  });
  it("미설정이면 기본 search_link", () => {
    expect(resolveProvider(undefined).mode).toBe("search_link");
  });
  it("external(미구현)이면 search_link로 fallback", () => {
    expect(resolveProvider("external").mode).toBe("search_link");
  });
  it("searchOffers는 query/offers/provider를 반환한다", () => {
    const res = searchOffers({ title: "One More Time", artist: "Daft Punk" }, resolveProvider("mock"));
    expect(res.query).toBe("daft punk one more time");
    expect(res.offers.length).toBeGreaterThan(0);
    expect(res.provider).toBe("mock");
  });
  it("title이 비어 있으면 throw한다", () => {
    expect(() => searchOffers({ title: "  " })).toThrow();
  });
});
```

- [ ] **Step 2: 실패 확인** — `npm test -- src/services/price-provider.service.test.ts` → FAIL

- [ ] **Step 3: 구현** — `src/services/price-provider.service.ts`

```ts
// 서버 전용: PRICE_PROVIDER_MODE env로 provider를 선택해 가격 후보를 조회한다.
// route만 import한다(클라이언트 번들 미노출, ADR-003).
import type { PriceSearchRequest, PriceSearchResponse } from "@/types/api";
import type { PriceProvider } from "@/lib/pricing/price-provider";
import { buildQuery } from "@/lib/pricing/price-provider";
import { searchLinkProvider } from "@/lib/pricing/search-link-provider";
import { mockPriceProvider } from "@/lib/pricing/mock-price-provider";

// env → provider. 미설정/미인식/external은 search_link로 fallback(ADR-017, 결정 D4).
export function resolveProvider(
  mode: string | undefined = process.env.PRICE_PROVIDER_MODE,
): PriceProvider {
  return mode === "mock" ? mockPriceProvider : searchLinkProvider;
}

export function searchOffers(
  req: PriceSearchRequest,
  provider: PriceProvider = resolveProvider(),
): PriceSearchResponse {
  const title = req.title?.trim();
  if (!title) throw new Error("title이 필요합니다.");
  const input = { title, artist: req.artist?.trim() || undefined };
  return {
    query: buildQuery(input),
    offers: provider.search(input),
    provider: provider.mode,
  };
}
```

- [ ] **Step 4: 통과 확인** — `npm test -- src/services/price-provider.service.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/services/price-provider.service.ts src/services/price-provider.service.test.ts
git commit -m "feat(pricing): add server price-provider.service (env-based selection)"
```

---

## Task 5: `/api/price/search` 라우트 (thin)

**Files:**
- Create: `src/app/api/price/search/route.ts`

> 기존 라우트(youtube/playlist, rekordbox/parse)는 thin adapter이며 단위 테스트가 없다(로직은 service에서 테스트). 본 라우트도 같은 precedent를 따른다 — 검증/봉투 래핑만 수행하고 핵심 로직은 Task 4 service 테스트가 커버한다.

- [ ] **Step 1: 구현** — `src/app/api/price/search/route.ts`

```ts
import { NextResponse } from "next/server";
import type { ApiResult, PriceSearchResponse, PriceSearchRequest } from "@/types/api";
import { searchOffers } from "@/services/price-provider.service";

export async function POST(
  req: Request,
): Promise<NextResponse<ApiResult<PriceSearchResponse>>> {
  try {
    const body = (await req.json()) as Partial<PriceSearchRequest>;
    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json(
        { ok: false, error: { code: "missing_title", message: "title이 필요합니다." } },
        { status: 400 },
      );
    }
    const data = searchOffers({ title, artist: body.artist });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "가격 조회 중 오류가 발생했습니다.";
    return NextResponse.json(
      { ok: false, error: { code: "price_error", message } },
      { status: 400 },
    );
  }
}
```

- [ ] **Step 2: 타입/빌드 확인** — `npm run lint` (PASS) + 라우트가 빌드 그래프에 포함되는지 `npm test` 전체 무영향 확인

- [ ] **Step 3: 커밋**

```bash
git add src/app/api/price/search/route.ts
git commit -m "feat(pricing): add POST /api/price/search route"
```

---

## Task 6: `readApiResult` 공유 헬퍼 추출 + analysis.service 리팩토링

**Files:**
- Create: `src/services/http.ts`
- Test: `src/services/http.test.ts`
- Modify: `src/services/analysis.service.ts`

- [ ] **Step 1: 실패 테스트 작성** — `src/services/http.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { readApiResult } from "@/services/http";

function jsonResponse(body: unknown, init?: { status?: number }): Response {
  return { status: init?.status ?? 200, json: async () => body } as Response;
}

describe("readApiResult", () => {
  it("ok:true면 data를 언랩한다", async () => {
    const data = { foo: 1 };
    await expect(readApiResult(jsonResponse({ ok: true, data }))).resolves.toEqual(data);
  });
  it("ok:false면 error.message로 throw한다", async () => {
    await expect(
      readApiResult(jsonResponse({ ok: false, error: { code: "x", message: "실패함" } })),
    ).rejects.toThrow("실패함");
  });
  it("봉투가 아닌 HTTP 오류면 fallback 메시지로 throw한다", async () => {
    await expect(
      readApiResult(jsonResponse({ message: "err" }, { status: 500 }), "가격 조회에 실패했습니다"),
    ).rejects.toThrow("가격 조회에 실패했습니다");
  });
});
```

- [ ] **Step 2: 실패 확인** — `npm test -- src/services/http.test.ts` → FAIL

- [ ] **Step 3: 구현** — `src/services/http.ts`

```ts
// ApiResult 봉투를 언랩하는 공유 헬퍼. analysis.service / price.service가 공통 사용.
import type { ApiResult } from "@/types/api";

export async function readApiResult<T>(
  res: Response,
  fallbackMessage = "요청 처리에 실패했습니다",
): Promise<T> {
  const body = (await res.json().catch(() => null)) as ApiResult<T> | null;
  if (body && body.ok === false) throw new Error(body.error.message);
  if (!body || body.ok !== true) {
    throw new Error(`${fallbackMessage} (HTTP ${res.status}).`);
  }
  return body.data;
}
```

- [ ] **Step 4: analysis.service 리팩토링** — `src/services/analysis.service.ts`에서 로컬 `readResult` 정의(15~23행 부근)를 삭제하고 import + 호출로 교체.

import 블록에 추가:

```ts
import { readApiResult } from "@/services/http";
```

로컬 `readResult` 함수 전체 삭제. `loadPlaylist`/`parseXml`의 `return readResult<...>(res);`를 다음으로 교체:

```ts
// loadPlaylist 내부
  return readApiResult<YouTubePlaylistResponse>(res);
```
```ts
// parseXml 내부
  return readApiResult<RekordboxParseResponse>(res);
```

(기본 fallback 메시지가 기존과 동일 → 동작 불변)

- [ ] **Step 5: 통과 확인** — `npm test -- src/services/http.test.ts src/services/analysis.service.test.ts` → 모두 PASS (analysis 7 tests 회귀 없음)

- [ ] **Step 6: 커밋**

```bash
git add src/services/http.ts src/services/http.test.ts src/services/analysis.service.ts
git commit -m "refactor(services): extract shared readApiResult helper"
```

---

## Task 7: price.service (클라이언트 fetch 헬퍼)

**Files:**
- Create: `src/services/price.service.ts`
- Test: `src/services/price.service.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchPrices } from "@/services/price.service";
import type { PriceSearchResponse } from "@/types/api";

function jsonResponse(body: unknown, init?: { status?: number }): Response {
  return { status: init?.status ?? 200, json: async () => body } as Response;
}

beforeEach(() => vi.restoreAllMocks());

describe("price.service", () => {
  it("ok:true면 라우트 호출 후 data를 언랩한다", async () => {
    const data: PriceSearchResponse = {
      query: "daft punk one more time",
      offers: [],
      provider: "search_link",
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ ok: true, data }),
    );
    const res = await searchPrices({ title: "One More Time", artist: "Daft Punk" });
    expect(res).toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/price/search",
      expect.objectContaining({ method: "POST" }),
    );
  });
  it("ok:false면 error.message로 throw", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ ok: false, error: { code: "price_error", message: "조회 실패" } }, { status: 400 }),
    );
    await expect(searchPrices({ title: "X" })).rejects.toThrow("조회 실패");
  });
  it("봉투가 아닌 HTTP 오류면 throw", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ message: "ISE" }, { status: 500 }),
    );
    await expect(searchPrices({ title: "X" })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: 실패 확인** — `npm test -- src/services/price.service.test.ts` → FAIL

- [ ] **Step 3: 구현** — `src/services/price.service.ts`

```ts
// 클라이언트 전용 fetch 헬퍼 — /api/price/search 호출. (analysis.service 패턴)
import type { PriceSearchRequest, PriceSearchResponse } from "@/types/api";
import { readApiResult } from "@/services/http";

export async function searchPrices(
  req: PriceSearchRequest,
): Promise<PriceSearchResponse> {
  const res = await fetch("/api/price/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return readApiResult<PriceSearchResponse>(res, "가격 조회에 실패했습니다");
}
```

- [ ] **Step 4: 통과 확인** — `npm test -- src/services/price.service.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/services/price.service.ts src/services/price.service.test.ts
git commit -m "feat(pricing): add client price.service fetch helper"
```

---

## Task 8: PriceComparePanel 컴포넌트

**Files:**
- Create: `src/components/price/PriceComparePanel.tsx`
- Test: `src/components/price/PriceComparePanel.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/services/price.service", () => ({ searchPrices: vi.fn() }));
import { searchPrices } from "@/services/price.service";
import { PriceComparePanel } from "@/components/price/PriceComparePanel";

const mocked = vi.mocked(searchPrices);
beforeEach(() => vi.clearAllMocks());

describe("PriceComparePanel", () => {
  it("오퍼를 새 탭 링크로 렌더하고 최저가를 표시한다", async () => {
    mocked.mockResolvedValue({
      query: "daft punk one more time",
      provider: "mock",
      offers: [
        { site: "Beatport", price: 1.99, currency: "USD", url: "https://x/b", isLowest: true, fetchedAt: "t" },
        { site: "Traxsource", price: 2.49, currency: "USD", url: "https://x/t", fetchedAt: "t" },
      ],
    });
    render(<PriceComparePanel title="One More Time" artist="Daft Punk" />);
    const beatport = await screen.findByRole("link", { name: "Beatport" });
    expect(beatport).toHaveAttribute("target", "_blank");
    expect(beatport).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByLabelText("최저가")).toBeInTheDocument();
  });

  it("에러 시 alert과 다시 시도 버튼을 표시하고, 재시도 시 다시 호출한다", async () => {
    mocked.mockRejectedValueOnce(new Error("조회 실패"));
    render(<PriceComparePanel title="X" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("조회 실패");
    mocked.mockResolvedValueOnce({ query: "x", provider: "mock", offers: [] });
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(mocked).toHaveBeenCalledTimes(2));
  });

  it("오퍼가 없으면 안내 문구를 표시한다", async () => {
    mocked.mockResolvedValue({ query: "x", provider: "search_link", offers: [] });
    render(<PriceComparePanel title="X" />);
    expect(await screen.findByText(/찾지 못했습니다/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인** — `npm test -- src/components/price/PriceComparePanel.test.tsx` → FAIL

- [ ] **Step 3: 구현** — `src/components/price/PriceComparePanel.tsx`

```tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import { searchPrices } from "@/services/price.service";
import type { PriceQuote } from "@/types/pricing";

type Props = { title: string; artist?: string };

export function PriceComparePanel({ title, artist }: Props) {
  const [offers, setOffers] = useState<PriceQuote[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await searchPrices({ title, artist });
      setOffers(res.offers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "가격 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [title, artist]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="p-3 text-xs">가격 불러오는 중…</p>;

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2 p-3">
        <p role="alert" className="text-xs text-[color:var(--color-danger)]">
          {error}
        </p>
        <button type="button" onClick={() => void load()} className="text-xs underline">
          다시 시도
        </button>
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <p className="p-3 text-xs text-[color:var(--color-text-muted)]">
        구매 링크를 찾지 못했습니다.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1 p-3">
      {offers.map((o) => (
        <li key={o.site} className="flex items-center gap-2 text-xs">
          <a
            href={o.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {o.site}
          </a>
          {o.price !== undefined && (
            <span className="text-[color:var(--color-text-secondary)]">
              {o.currency ? `${o.currency} ` : ""}
              {o.price.toFixed(2)}
            </span>
          )}
          {o.isLowest && (
            <span
              aria-label="최저가"
              className="font-semibold text-[color:var(--color-owned)]"
            >
              최저가
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: 통과 확인** — `npm test -- src/components/price/PriceComparePanel.test.tsx` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/price/PriceComparePanel.tsx src/components/price/PriceComparePanel.test.tsx
git commit -m "feat(pricing): add PriceComparePanel (offers, lowest badge, new-tab links)"
```

---

## Task 9: MatchResultTable에 구매 액션 연동

**Files:**
- Modify: `src/components/results/MatchResultTable.tsx`
- Modify: `src/components/results/MatchResultTable.test.tsx`

- [ ] **Step 1: 테스트 갱신** — `src/components/results/MatchResultTable.test.tsx` 전체 교체

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// 패널 내부의 fetch 로직과 분리: 펼침 배선만 검증하기 위해 패널을 스텁으로 대체.
vi.mock("@/components/price/PriceComparePanel", () => ({
  PriceComparePanel: ({ title }: { title: string }) => (
    <div data-testid="price-panel">panel:{title}</div>
  ),
}));

import { MatchResultTable } from "@/components/results/MatchResultTable";
import type { MatchRow } from "@/components/results/match-row";

function row(id: string, status: MatchRow["result"]["status"], title: string): MatchRow {
  return {
    result: { id, youtubeTrackId: `yt_${id}`, status, confidence: "high", score: 0.5, candidates: [] },
    youtubeTrack: { id: `yt_${id}`, videoId: id, rawTitle: title, parsedArtist: "Daft Punk", parsedTitle: title, parseStatus: "parsed" },
  };
}

const rows: MatchRow[] = [row("mr_1", "owned", "One More Time"), row("mr_2", "missing", "Da Funk")];
beforeEach(() => vi.clearAllMocks());

describe("MatchResultTable", () => {
  it("행의 곡명/아티스트와 상태 배지를 렌더한다", () => {
    render(<MatchResultTable rows={rows} />);
    expect(screen.getByText("One More Time")).toBeInTheDocument();
    expect(screen.getAllByText("Daft Punk").length).toBeGreaterThan(0);
  });

  it("빈 목록이면 안내 문구를 표시한다", () => {
    render(<MatchResultTable rows={[]} />);
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it("missing 행에만 구매 버튼이 있다", () => {
    render(<MatchResultTable rows={rows} />);
    const buttons = screen.getAllByRole("button", { name: "구매" });
    expect(buttons).toHaveLength(1);
  });

  it("구매 클릭 시 해당 곡의 가격 패널을 펼친다", async () => {
    render(<MatchResultTable rows={rows} />);
    expect(screen.queryByTestId("price-panel")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "구매" }));
    expect(screen.getByTestId("price-panel")).toHaveTextContent("panel:Da Funk");
  });
});
```

- [ ] **Step 2: 실패 확인** — `npm test -- src/components/results/MatchResultTable.test.tsx` → FAIL (구매 버튼 없음)

- [ ] **Step 3: 구현** — `src/components/results/MatchResultTable.tsx` 전체 교체

```tsx
"use client";
import { Fragment, useState } from "react";
import type { MatchRow } from "@/components/results/match-row";
import { StatusBadge } from "@/components/results/StatusBadge";
import { ConfidenceBadge } from "@/components/results/ConfidenceBadge";
import { PriceComparePanel } from "@/components/price/PriceComparePanel";

const HEADERS = ["#", "Track", "Artist", "Status", "Confidence", "Matched", "Action"];

export function MatchResultTable({ rows }: { rows: MatchRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="p-4 text-sm text-[color:var(--color-text-muted)]">No results</p>
    );
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
          const title = yt.parsedTitle ?? yt.rawTitle;
          const isMissing = row.result.status === "missing";
          const expanded = expandedId === row.result.id;
          return (
            <Fragment key={row.result.id}>
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="px-2 py-1">{i + 1}</td>
                <td className="px-2 py-1">{title}</td>
                <td className="px-2 py-1">{yt.parsedArtist ?? "—"}</td>
                <td className="px-2 py-1">
                  <StatusBadge status={row.result.status} />
                </td>
                <td className="px-2 py-1">
                  <ConfidenceBadge confidence={row.result.confidence} />
                </td>
                <td className="px-2 py-1">
                  {row.matchedTrack
                    ? `${row.matchedTrack.title}${
                        row.matchedTrack.artist ? ` — ${row.matchedTrack.artist}` : ""
                      }`
                    : "—"}
                </td>
                <td className="px-2 py-1">
                  {isMissing && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(expanded ? null : row.result.id)
                      }
                      className="text-xs underline"
                    >
                      {expanded ? "닫기" : "구매"}
                    </button>
                  )}
                </td>
              </tr>
              {isMissing && expanded && (
                <tr>
                  <td
                    colSpan={HEADERS.length}
                    className="bg-[color:var(--color-app-bg)] p-0"
                  >
                    <PriceComparePanel title={title} artist={yt.parsedArtist} />
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: 통과 확인** — `npm test -- src/components/results/MatchResultTable.test.tsx` → PASS

- [ ] **Step 5: 전체 검증** — `bash scripts/verify.sh` → lint·build·test 모두 PASS

- [ ] **Step 6: 커밋**

```bash
git add src/components/results/MatchResultTable.tsx src/components/results/MatchResultTable.test.tsx
git commit -m "feat(results): wire purchase action into match table for missing tracks"
```

---

## Self-Review 체크리스트 (계획 작성자용 — 완료)

- **Spec coverage:** PriceProvider 인터페이스(T1) · SearchLinkProvider(T2) · MockPriceProvider(T3) · 서버 service(T4) · route(T5) · client service(T7) · PriceComparePanel(T8) · 테이블 연동(T9). 스펙 §2.1 전 항목 매핑됨. Purchase-click 영속화는 §2.2대로 제외(D1).
- **Placeholder scan:** 모든 step에 실제 코드 포함. TODO/TBD 없음.
- **Type consistency:** `PriceQuote`/`PriceProviderMode`(types/pricing.ts), `PriceSearchRequest`/`PriceSearchResponse`(types/api.ts), `PriceProvider`/`PriceSearchInput`/`buildQuery`(price-provider.ts) — 전 task에서 동일 시그니처 사용. 서버=`searchOffers`(sync), 클라이언트=`searchPrices`(async)로 명확히 구분.
