# Backend Ingestion (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** YouTube 플레이리스트/제목 파싱과 Rekordbox XML 파싱을 구현해 `/api/youtube/playlist`·`/api/rekordbox/parse` 두 엔드포인트를 완성한다(매칭은 범위 외).

**Architecture:** 순수 로직은 `src/lib/`(TDD), 외부 연동/조합은 `src/services/`, 진입점은 `src/app/api/`. YouTube 외부 호출은 주입 가능한 fetcher로 추상화하고 기본은 스텁(키 불필요). 응답은 동결된 `ApiResult<T>` 계약으로 감싼다.

**Tech Stack:** Next.js 15.5 App Router(Route Handlers) · TypeScript strict · Vitest 4 · fast-xml-parser(신규 의존성).

---

## 에이전트 가드레일 (필수 — 시작 전 숙지)

- **분기 베이스**: `chore/freeze-contract`. 작업 브랜치: `feature/ingestion` (워크트리 격리).
- **파일 생성 화이트리스트** (이 경로들만 생성/수정):
  - `src/lib/youtube/*`, `src/lib/rekordbox/*`
  - `src/services/youtube.service.ts`, `src/services/rekordbox.service.ts`
  - `src/app/api/youtube/playlist/route.ts`, `src/app/api/rekordbox/parse/route.ts`
  - `package.json`/`package-lock.json` (Task 0의 의존성 추가 한정)
- **절대 수정 금지**: `src/types/*`, `src/mocks/*`, `src/components/*`, `src/styles/*`, `src/app/page.tsx`, `src/app/layout.tsx`. 계약(`types`/`mocks`)이 부족하면 **고치지 말고 멈춰서 보고**.
- **계층 규칙**: `lib`/`services`는 `components` import 금지. lib은 순수 함수만.
- **보안**: `YOUTUBE_API_KEY`는 서버 전용·`NEXT_PUBLIC_` 금지. XML 원문·파일 경로·키를 로그/에러/응답에 노출 금지. XML 원본 미저장.
- **DoD**: 매 Task 끝 `git commit`, 트랙 종료 시 `bash scripts/verify.sh` green. 완료 시 자기보고(변경 파일·추가 테스트·verify 결과·가정/이탈) 반환.
- **참조 문서**: `docs/PRD.md §8`(타입 정본), `docs/ARCHITECTURE.md §7`(API)·§10(정규화). 재사용: `src/lib/normalizer.ts`(`normalizeTitle`, `normalizeArtist`).

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/lib/youtube/youtube-errors.ts` | YouTube 파싱 도메인 에러(코드 포함) |
| `src/lib/youtube/parse-playlist-url.ts` | URL → playlistId 추출 |
| `src/lib/youtube/parse-video-title.ts` | rawTitle → {parsedArtist?, parsedTitle?, parseStatus} |
| `src/lib/rekordbox/rekordbox-errors.ts` | XML 검증 도메인 에러 |
| `src/lib/rekordbox/validate-xml-file.ts` | 확장자/크기 검증 |
| `src/lib/rekordbox/parse-rekordbox-xml.ts` | XML → {tracks, warnings} |
| `src/services/youtube.service.ts` | playlistId 추출 + (주입형)아이템 fetch → YouTubePlaylistResponse |
| `src/services/rekordbox.service.ts` | validate + parse 조합 → RekordboxParseResponse |
| `src/app/api/youtube/playlist/route.ts` | POST 핸들러, ApiResult로 감쌈 |
| `src/app/api/rekordbox/parse/route.ts` | POST(multipart) 핸들러, ApiResult로 감쌈 |

---

## Task 0: fast-xml-parser 의존성 추가

> ⚠️ 이 Task는 사용자 사전 승인이 있어야 실행한다(의존성 결정). 미승인 시 멈추고 보고.

- [ ] **Step 1: 설치**

```bash
npm install fast-xml-parser
```

- [ ] **Step 2: 설치 확인**

Run: `node -e "require('fast-xml-parser')"`
Expected: 에러 없이 종료(exit 0).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add fast-xml-parser for rekordbox parsing"
```

---

## Task 1: YouTube 도메인 에러

**Files:** Create `src/lib/youtube/youtube-errors.ts`

- [ ] **Step 1: 구현** (에러는 테스트 대상 함수가 던지므로 이 파일은 코드 우선)

```ts
// YouTube 파싱 도메인 에러 — code는 ApiErr.error.code로 그대로 노출 가능.
export class InvalidPlaylistUrlError extends Error {
  readonly code = "invalid_playlist_url";
  constructor(message = "유효한 YouTube 플레이리스트 URL이 아닙니다.") {
    super(message);
    this.name = "InvalidPlaylistUrlError";
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/youtube/youtube-errors.ts
git commit -m "feat(youtube): add InvalidPlaylistUrlError"
```

---

## Task 2: parse-playlist-url

**Files:**
- Test: `src/lib/youtube/parse-playlist-url.test.ts`
- Create: `src/lib/youtube/parse-playlist-url.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from "vitest";
import { parsePlaylistUrl } from "@/lib/youtube/parse-playlist-url";
import { InvalidPlaylistUrlError } from "@/lib/youtube/youtube-errors";

describe("parsePlaylistUrl", () => {
  it("playlist?list= 형식에서 playlistId를 추출한다", () => {
    expect(
      parsePlaylistUrl("https://www.youtube.com/playlist?list=PL12345abcdef"),
    ).toBe("PL12345abcdef");
  });
  it("watch?v=…&list= 형식에서 playlistId를 추출한다", () => {
    expect(
      parsePlaylistUrl("https://www.youtube.com/watch?v=abc&list=PLxyz"),
    ).toBe("PLxyz");
  });
  it("youtu.be 단축 URL의 list 파라미터를 추출한다", () => {
    expect(parsePlaylistUrl("https://youtu.be/abc?list=PLshort")).toBe(
      "PLshort",
    );
  });
  it("list 파라미터가 없으면 InvalidPlaylistUrlError를 던진다", () => {
    expect(() =>
      parsePlaylistUrl("https://www.youtube.com/watch?v=abc"),
    ).toThrow(InvalidPlaylistUrlError);
  });
  it("YouTube 도메인이 아니면 InvalidPlaylistUrlError를 던진다", () => {
    expect(() => parsePlaylistUrl("https://vimeo.com/123")).toThrow(
      InvalidPlaylistUrlError,
    );
  });
  it("URL이 아니면 InvalidPlaylistUrlError를 던진다", () => {
    expect(() => parsePlaylistUrl("not a url")).toThrow(InvalidPlaylistUrlError);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/youtube/parse-playlist-url.test.ts`
Expected: FAIL (parsePlaylistUrl가 정의되지 않음).

- [ ] **Step 3: 최소 구현**

```ts
import { InvalidPlaylistUrlError } from "@/lib/youtube/youtube-errors";

const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

/** YouTube URL에서 플레이리스트 ID(list 파라미터)를 추출한다. */
export function parsePlaylistUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new InvalidPlaylistUrlError();
  }
  if (!YT_HOSTS.has(parsed.hostname)) throw new InvalidPlaylistUrlError();
  const list = parsed.searchParams.get("list");
  if (!list) throw new InvalidPlaylistUrlError();
  return list;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/youtube/parse-playlist-url.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/youtube/parse-playlist-url.ts src/lib/youtube/parse-playlist-url.test.ts
git commit -m "feat(youtube): extract playlistId from URL"
```

---

## Task 3: parse-video-title

**Files:**
- Test: `src/lib/youtube/parse-video-title.test.ts`
- Create: `src/lib/youtube/parse-video-title.ts`

휴리스틱: 첫 " - "(특수 대시 포함) 기준으로 좌=아티스트, 우=곡명 분리. 곡명 끝의 노이즈
괄호(Official Video/Audio, Lyric Video, MV 등)는 제거. 구분자가 없으면 `needs_review`.

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from "vitest";
import { parseVideoTitle } from "@/lib/youtube/parse-video-title";

describe("parseVideoTitle", () => {
  it("'Artist - Title (Official Video)'에서 아티스트/곡명을 추출하고 노이즈를 제거한다", () => {
    expect(parseVideoTitle("Daft Punk - One More Time (Official Video)")).toEqual({
      parsedArtist: "Daft Punk",
      parsedTitle: "One More Time",
      parseStatus: "parsed",
    });
  });
  it("en dash 구분자도 처리한다", () => {
    expect(parseVideoTitle("Daft Punk – One More Time")).toEqual({
      parsedArtist: "Daft Punk",
      parsedTitle: "One More Time",
      parseStatus: "parsed",
    });
  });
  it("feat 절은 아티스트 원문에 보존한다(정규화는 매칭 단계 책임)", () => {
    expect(
      parseVideoTitle("Daft Punk feat. Romanthony - One More Time"),
    ).toEqual({
      parsedArtist: "Daft Punk feat. Romanthony",
      parsedTitle: "One More Time",
      parseStatus: "parsed",
    });
  });
  it("버전 괄호(Extended Mix)는 곡명에 보존한다", () => {
    expect(parseVideoTitle("Justice - Genesis (Extended Mix)")).toEqual({
      parsedArtist: "Justice",
      parsedTitle: "Genesis (Extended Mix)",
      parseStatus: "parsed",
    });
  });
  it("구분자가 없으면 needs_review를 반환한다", () => {
    expect(parseVideoTitle("FULL SET @ Boiler Room London 2019")).toEqual({
      parseStatus: "needs_review",
    });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/youtube/parse-video-title.test.ts`
Expected: FAIL (parseVideoTitle 미정의).

- [ ] **Step 3: 최소 구현**

```ts
export type ParsedVideoTitle = {
  parsedArtist?: string;
  parsedTitle?: string;
  parseStatus: "parsed" | "needs_review";
};

const DASH = /\s[‒–—―−-]\s/; // 양쪽 공백을 가진 구분 대시
// 곡명 끝에 붙는 노이즈 괄호/대괄호 (대소문자 무시).
const NOISE =
  /\s*[([]\s*(?:official\s+(?:music\s+)?video|official\s+audio|official\s+video|lyric\s+video|lyrics?|audio|visualizer|m\/?v|hd|hq|4k)\s*[)\]]\s*$/i;

/** YouTube 영상 제목에서 아티스트/곡명을 추정한다. */
export function parseVideoTitle(rawTitle: string): ParsedVideoTitle {
  const idx = rawTitle.search(DASH);
  if (idx === -1) return { parseStatus: "needs_review" };
  const artist = rawTitle.slice(0, idx).trim();
  let title = rawTitle.slice(idx + 3).trim();
  title = title.replace(NOISE, "").trim();
  if (!artist || !title) return { parseStatus: "needs_review" };
  return { parsedArtist: artist, parsedTitle: title, parseStatus: "parsed" };
}
```

> 참고: `DASH`가 일반 하이픈도 포함하므로 `slice(idx + 3)`은 " - "(3자) 기준. en dash 등도
> 모두 1코드포인트 + 양쪽 공백이라 길이 3으로 동일하다.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/youtube/parse-video-title.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/youtube/parse-video-title.ts src/lib/youtube/parse-video-title.test.ts
git commit -m "feat(youtube): parse artist/title from video title"
```

---

## Task 4: Rekordbox 도메인 에러 + validate-xml-file

**Files:**
- Create: `src/lib/rekordbox/rekordbox-errors.ts`
- Test: `src/lib/rekordbox/validate-xml-file.test.ts`
- Create: `src/lib/rekordbox/validate-xml-file.ts`

- [ ] **Step 1: 에러 구현**

```ts
// src/lib/rekordbox/rekordbox-errors.ts
export class InvalidXmlFileError extends Error {
  constructor(
    readonly code: "invalid_extension" | "file_too_large" | "empty_file",
    message: string,
  ) {
    super(message);
    this.name = "InvalidXmlFileError";
  }
}
```

- [ ] **Step 2: 실패 테스트 작성**

```ts
import { describe, it, expect } from "vitest";
import { validateXmlFile, MAX_XML_BYTES } from "@/lib/rekordbox/validate-xml-file";
import { InvalidXmlFileError } from "@/lib/rekordbox/rekordbox-errors";

describe("validateXmlFile", () => {
  it("정상 .xml 파일은 통과한다(반환 없음)", () => {
    expect(validateXmlFile({ name: "library.xml", size: 1024 })).toBeUndefined();
  });
  it("대문자 확장자도 허용한다", () => {
    expect(validateXmlFile({ name: "LIB.XML", size: 10 })).toBeUndefined();
  });
  it(".xml이 아니면 invalid_extension", () => {
    expect(() => validateXmlFile({ name: "a.txt", size: 10 })).toThrow(
      InvalidXmlFileError,
    );
  });
  it("빈 파일은 empty_file", () => {
    expect(() => validateXmlFile({ name: "a.xml", size: 0 })).toThrow(
      /empty/i,
    );
  });
  it("최대 크기 초과는 file_too_large", () => {
    expect(() =>
      validateXmlFile({ name: "a.xml", size: MAX_XML_BYTES + 1 }),
    ).toThrow(/too large|초과|larg/i);
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run src/lib/rekordbox/validate-xml-file.test.ts`
Expected: FAIL (미정의).

- [ ] **Step 4: 최소 구현**

```ts
import { InvalidXmlFileError } from "@/lib/rekordbox/rekordbox-errors";

export const MAX_XML_BYTES = 20 * 1024 * 1024; // 20MB

/** 업로드 XML 파일의 확장자/크기를 검증한다. 위반 시 InvalidXmlFileError. */
export function validateXmlFile(file: { name: string; size: number }): void {
  if (!/\.xml$/i.test(file.name)) {
    throw new InvalidXmlFileError(
      "invalid_extension",
      ".xml 파일만 업로드할 수 있습니다.",
    );
  }
  if (file.size <= 0) {
    throw new InvalidXmlFileError("empty_file", "빈 파일입니다.");
  }
  if (file.size > MAX_XML_BYTES) {
    throw new InvalidXmlFileError(
      "file_too_large",
      "파일이 너무 큽니다(최대 20MB).",
    );
  }
}
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/lib/rekordbox/validate-xml-file.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/rekordbox/rekordbox-errors.ts src/lib/rekordbox/validate-xml-file.ts src/lib/rekordbox/validate-xml-file.test.ts
git commit -m "feat(rekordbox): validate uploaded xml file"
```

---

## Task 5: parse-rekordbox-xml

**Files:**
- Test: `src/lib/rekordbox/parse-rekordbox-xml.test.ts`
- Create: `src/lib/rekordbox/parse-rekordbox-xml.ts`

Rekordbox XML 구조: `<DJ_PLAYLISTS><COLLECTION><TRACK TrackID Name Artist Album TotalTime Location/></COLLECTION></DJ_PLAYLISTS>`. `TotalTime`(초) → `durationMs`. `normalizedTitle`/`normalizedArtist`는 `src/lib/normalizer.ts` 재사용.

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from "vitest";
import { parseRekordboxXml } from "@/lib/rekordbox/parse-rekordbox-xml";

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<DJ_PLAYLISTS Version="1.0.0">
  <COLLECTION Entries="2">
    <TRACK TrackID="1" Name="One More Time" Artist="Daft Punk" Album="Discovery" TotalTime="320" Location="file://localhost/Users/dj/one.mp3"/>
    <TRACK TrackID="2" Name="D.A.N.C.E." Artist="" Album="Cross" TotalTime="242" Location="file://localhost/Users/dj/dance.mp3"/>
  </COLLECTION>
</DJ_PLAYLISTS>`;

describe("parseRekordboxXml", () => {
  it("TRACK 노드를 RekordboxTrack[]로 변환한다", () => {
    const { tracks } = parseRekordboxXml(XML);
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toMatchObject({
      id: "1",
      title: "One More Time",
      artist: "Daft Punk",
      album: "Discovery",
      durationMs: 320000,
      normalizedTitle: "one more time",
      normalizedArtist: "daft punk",
    });
  });
  it("아티스트가 비면 artist/normalizedArtist를 생략한다", () => {
    const { tracks } = parseRekordboxXml(XML);
    expect(tracks[1].artist).toBeUndefined();
    expect(tracks[1].normalizedArtist).toBeUndefined();
  });
  it("TRACK이 없으면 빈 배열과 warning을 반환한다", () => {
    const { tracks, warnings } = parseRekordboxXml(
      `<DJ_PLAYLISTS><COLLECTION Entries="0"></COLLECTION></DJ_PLAYLISTS>`,
    );
    expect(tracks).toEqual([]);
    expect(warnings.some((w) => w.code === "empty_collection")).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/rekordbox/parse-rekordbox-xml.test.ts`
Expected: FAIL (미정의).

- [ ] **Step 3: 최소 구현**

```ts
import { XMLParser } from "fast-xml-parser";
import type { RekordboxTrack } from "@/types/track";
import type { RekordboxParseWarning } from "@/types/api";
import { normalizeTitle, normalizeArtist } from "@/lib/normalizer";

type RawTrack = Record<string, string | undefined>;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

/** Rekordbox XML → 트랙 메타데이터. 원본 문자열은 호출자가 폐기한다. */
export function parseRekordboxXml(xml: string): {
  tracks: RekordboxTrack[];
  warnings: RekordboxParseWarning[];
} {
  const warnings: RekordboxParseWarning[] = [];
  const doc = parser.parse(xml);
  const collection = doc?.DJ_PLAYLISTS?.COLLECTION;
  const rawTracks: RawTrack[] = collection?.TRACK
    ? Array.isArray(collection.TRACK)
      ? collection.TRACK
      : [collection.TRACK]
    : [];

  if (rawTracks.length === 0) {
    warnings.push({
      code: "empty_collection",
      message: "COLLECTION에 TRACK이 없습니다.",
    });
  }

  const tracks: RekordboxTrack[] = rawTracks.map((t) => {
    const id = t.TrackID ?? "";
    const title = t.Name ?? "";
    const artist = t.Artist?.trim() ? t.Artist : undefined;
    const totalTime = t.TotalTime ? Number(t.TotalTime) : undefined;
    if (!artist) {
      warnings.push({
        code: "missing_artist",
        message: "아티스트 정보가 없는 트랙",
        trackId: id,
      });
    }
    return {
      id,
      title,
      artist,
      album: t.Album?.trim() ? t.Album : undefined,
      durationMs:
        totalTime !== undefined && !Number.isNaN(totalTime)
          ? totalTime * 1000
          : undefined,
      location: t.Location,
      normalizedTitle: normalizeTitle(title),
      normalizedArtist: normalizeArtist(artist),
    };
  });

  return { tracks, warnings };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/rekordbox/parse-rekordbox-xml.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/rekordbox/parse-rekordbox-xml.ts src/lib/rekordbox/parse-rekordbox-xml.test.ts
git commit -m "feat(rekordbox): parse xml into RekordboxTrack[]"
```

---

## Task 6: youtube.service (주입형 fetcher + 스텁)

**Files:**
- Test: `src/services/youtube.service.test.ts`
- Create: `src/services/youtube.service.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from "vitest";
import { fetchPlaylist } from "@/services/youtube.service";

describe("fetchPlaylist", () => {
  it("주입한 fetcher 결과를 YouTubePlaylistResponse로 매핑한다", async () => {
    const res = await fetchPlaylist(
      "https://www.youtube.com/playlist?list=PLtest",
      async () => ({
        title: "Test",
        items: [
          { videoId: "v1", rawTitle: "Daft Punk - One More Time", available: true },
          { videoId: "v2", rawTitle: "[Deleted video]", available: false },
        ],
      }),
    );
    expect(res.playlistId).toBe("PLtest");
    expect(res.title).toBe("Test");
    expect(res.tracks).toHaveLength(2);
    expect(res.tracks[0].parsedArtist).toBe("Daft Punk");
    expect(res.tracks[1].parseStatus).toBe("unavailable");
    expect(res.unavailableCount).toBe(1);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/services/youtube.service.test.ts`
Expected: FAIL (미정의).

- [ ] **Step 3: 최소 구현**

```ts
import type { YouTubeTrack } from "@/types/track";
import type { YouTubePlaylistResponse } from "@/types/api";
import { parsePlaylistUrl } from "@/lib/youtube/parse-playlist-url";
import { parseVideoTitle } from "@/lib/youtube/parse-video-title";

export type RawPlaylistItem = {
  videoId: string;
  rawTitle: string;
  available: boolean;
  channelTitle?: string;
  publishedAt?: string;
};
export type PlaylistFetcher = (
  playlistId: string,
) => Promise<{ title?: string; items: RawPlaylistItem[] }>;

// 기본 스텁: 실제 YouTube API 키 연동(P1) 전까지 빈 결과를 반환한다.
// 라우트는 이 스텁 대신 환경에 따라 실제 fetcher를 주입할 수 있다.
const stubFetcher: PlaylistFetcher = async () => ({ title: undefined, items: [] });

/** URL에서 playlistId를 추출하고, 주입된 fetcher로 곡 목록을 만든다. */
export async function fetchPlaylist(
  url: string,
  fetcher: PlaylistFetcher = stubFetcher,
): Promise<YouTubePlaylistResponse> {
  const playlistId = parsePlaylistUrl(url);
  const { title, items } = await fetcher(playlistId);
  let unavailableCount = 0;
  const tracks: YouTubeTrack[] = items.map((item, i) => {
    if (!item.available) {
      unavailableCount += 1;
      return {
        id: `yt_${i + 1}`,
        videoId: item.videoId,
        rawTitle: item.rawTitle,
        channelTitle: item.channelTitle,
        publishedAt: item.publishedAt,
        parseStatus: "unavailable",
      };
    }
    const parsed = parseVideoTitle(item.rawTitle);
    return {
      id: `yt_${i + 1}`,
      videoId: item.videoId,
      rawTitle: item.rawTitle,
      channelTitle: item.channelTitle,
      publishedAt: item.publishedAt,
      ...parsed,
    };
  });
  return { playlistId, title, tracks, unavailableCount };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/services/youtube.service.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/services/youtube.service.ts src/services/youtube.service.test.ts
git commit -m "feat(youtube): playlist service with injectable fetcher"
```

---

## Task 7: rekordbox.service

**Files:**
- Test: `src/services/rekordbox.service.test.ts`
- Create: `src/services/rekordbox.service.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from "vitest";
import { parseUploadedXml } from "@/services/rekordbox.service";

const XML = `<DJ_PLAYLISTS><COLLECTION Entries="1"><TRACK TrackID="1" Name="A" Artist="B" TotalTime="100"/></COLLECTION></DJ_PLAYLISTS>`;

describe("parseUploadedXml", () => {
  it("검증 통과 후 파싱하여 RekordboxParseResponse를 만든다", () => {
    const res = parseUploadedXml({ name: "lib.xml", size: XML.length }, XML);
    expect(res.trackCount).toBe(1);
    expect(res.tracks[0].title).toBe("A");
    expect(Array.isArray(res.warnings)).toBe(true);
  });
  it("검증 실패 시 예외를 전파한다", () => {
    expect(() =>
      parseUploadedXml({ name: "bad.txt", size: 10 }, XML),
    ).toThrow();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/services/rekordbox.service.test.ts`
Expected: FAIL (미정의).

- [ ] **Step 3: 최소 구현**

```ts
import type { RekordboxParseResponse } from "@/types/api";
import { validateXmlFile } from "@/lib/rekordbox/validate-xml-file";
import { parseRekordboxXml } from "@/lib/rekordbox/parse-rekordbox-xml";

/** 업로드 메타 검증 → XML 파싱 → 응답 조립. 원본 xml은 반환/저장하지 않는다. */
export function parseUploadedXml(
  file: { name: string; size: number },
  xml: string,
): RekordboxParseResponse {
  validateXmlFile(file);
  const { tracks, warnings } = parseRekordboxXml(xml);
  return { trackCount: tracks.length, tracks, warnings };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/services/rekordbox.service.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/rekordbox.service.ts src/services/rekordbox.service.test.ts
git commit -m "feat(rekordbox): compose validate + parse service"
```

---

## Task 8: API 라우트 (youtube/playlist · rekordbox/parse)

**Files:**
- Create: `src/app/api/youtube/playlist/route.ts`
- Create: `src/app/api/rekordbox/parse/route.ts`

라우트는 얇게: 입력 파싱 → 서비스 호출 → `ApiResult<T>`로 감싸 반환. 도메인 에러의 `code`는
그대로 노출하되, 예기치 못한 에러는 일반 메시지로(원문 비노출).

- [ ] **Step 1: youtube/playlist 구현**

```ts
import { NextResponse } from "next/server";
import type { ApiResult, YouTubePlaylistResponse } from "@/types/api";
import { fetchPlaylist } from "@/services/youtube.service";

export async function POST(
  req: Request,
): Promise<NextResponse<ApiResult<YouTubePlaylistResponse>>> {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url) {
      return NextResponse.json(
        { ok: false, error: { code: "missing_url", message: "url이 필요합니다." } },
        { status: 400 },
      );
    }
    const data = await fetchPlaylist(url);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "youtube_error";
    const message = e instanceof Error ? e.message : "처리 중 오류가 발생했습니다.";
    return NextResponse.json({ ok: false, error: { code, message } }, { status: 400 });
  }
}
```

- [ ] **Step 2: rekordbox/parse 구현**

```ts
import { NextResponse } from "next/server";
import type { ApiResult, RekordboxParseResponse } from "@/types/api";
import { parseUploadedXml } from "@/services/rekordbox.service";

export async function POST(
  req: Request,
): Promise<NextResponse<ApiResult<RekordboxParseResponse>>> {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: { code: "missing_file", message: "file이 필요합니다." } },
        { status: 400 },
      );
    }
    const xml = await file.text();
    const data = parseUploadedXml({ name: file.name, size: file.size }, xml);
    // 원본 xml은 여기서 폐기(저장/로그 금지).
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "rekordbox_error";
    const message = e instanceof Error ? e.message : "파싱 중 오류가 발생했습니다.";
    return NextResponse.json({ ok: false, error: { code, message } }, { status: 400 });
  }
}
```

- [ ] **Step 3: 빌드/타입 확인**

Run: `npm run build`
Expected: 두 라우트가 등록되고 타입 에러 없이 컴파일.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/youtube/playlist/route.ts src/app/api/rekordbox/parse/route.ts
git commit -m "feat(api): add youtube/playlist and rekordbox/parse routes"
```

---

## Task 9: 트랙 종단 검증

- [ ] **Step 1: 전체 검증**

Run: `bash scripts/verify.sh`
Expected: lint→build→test 모두 green. 신규 lib/service 테스트가 모두 통과.

- [ ] **Step 2: 화이트리스트 자기점검**

Run: `git diff --name-only chore/freeze-contract...HEAD`
Expected: 출력이 가드레일 화이트리스트 안에만 있어야 함(`types/`·`mocks/`·`components/`·`styles/` 변경 0).

- [ ] **Step 3: 자기보고 반환**: 변경 파일 목록 · 추가 테스트 수 · `verify.sh` 결과 · 가정/이탈 사항.

---

## Self-Review 체크

- 스펙 §2 Agent B 파일 전부 Task로 커버됨(youtube 2 + rekordbox 2 + service 2 + route 2 + errors).
- 타입 일관성: `parseVideoTitle` 반환이 `YouTubeTrack`의 `parsedArtist?/parsedTitle?/parseStatus`와 정합; service에서 spread로 결합. `RekordboxTrack`/`RekordboxParseResponse`/`YouTubePlaylistResponse`는 동결 계약 그대로 사용.
- placeholder 없음(모든 코드/명령/기대결과 명시).
- 의존성: fast-xml-parser는 Task 0에서 명시 추가(사용자 승인 게이트).
