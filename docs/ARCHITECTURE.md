# 아키텍처

## 1. 개요

Crate Finder는 유튜브 플레이리스트와 Rekordbox XML 라이브러리를 비교하여 보유곡, 누락곡, 확인 필요 곡을 식별하는 웹앱이다.

본 아키텍처의 핵심은 다음과 같다.

- UI와 파싱/매칭 로직을 분리한다.
- 외부 API 호출은 서버 영역에서만 수행한다.
- Rekordbox XML 원본은 기본적으로 저장하지 않는다.
- 트랙 정규화/매칭 로직은 테스트 가능한 순수 함수 중심으로 구성한다.
- 가격 조회 기능은 Provider 패턴으로 분리하여 MVP와 후속 확장을 모두 수용한다.
- Classic Macintosh-inspired UI는 컴포넌트 레이어에서만 적용하고 도메인 로직과 결합하지 않는다.

---

## 2. 기술 스택

### 2.1 기본 스택

| 영역 | 기술 |
|---|---|
| Framework | Next.js App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Custom retro components, shadcn/ui 선택적 활용 |
| Validation | Zod |
| XML Parsing | fast-xml-parser |
| Matching | 자체 정규화 함수 + 유사도 알고리즘 또는 Fuse.js |
| Database | PostgreSQL 또는 Supabase Postgres |
| ORM | Prisma |
| Test | Vitest, React Testing Library |
| E2E | Playwright, 후순위 |
| CI | GitHub Actions |

### 2.2 설계 원칙

- Server Components를 기본으로 사용한다.
- 사용자 입력, 파일 업로드, 필터 조작 등 인터랙션이 필요한 영역만 Client Component로 구성한다.
- 외부 API Key는 클라이언트 번들에 포함하지 않는다.
- 대량 데이터 처리가 필요한 로직은 `lib` 또는 `services` 계층으로 분리한다.

---

## 3. 디렉토리 구조

```txt
src/
├── app/
│   ├── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── analyze/
│   │   └── page.tsx
│   ├── results/
│   │   └── [analysisId]/
│   │       └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── api/
│       ├── youtube/
│       │   └── playlist/
│       │       └── route.ts
│       ├── rekordbox/
│       │   └── parse/
│       │       └── route.ts
│       ├── analysis/
│       │   ├── run/
│       │   │   └── route.ts
│       │   └── [analysisId]/
│       │       └── route.ts
│       ├── price/
│       │   └── search/
│       │       └── route.ts
│       └── events/
│           └── purchase-click/
│               └── route.ts
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── TopMenuBar.tsx
│   │   └── StatusBar.tsx
│   ├── retro/
│   │   ├── WindowPanel.tsx
│   │   ├── RetroButton.tsx
│   │   ├── RetroInput.tsx
│   │   └── RetroSelect.tsx
│   ├── playlist/
│   │   └── PlaylistUrlForm.tsx
│   ├── rekordbox/
│   │   └── XmlUploadBox.tsx
│   ├── results/
│   │   ├── MatchResultTable.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── ConfidenceBadge.tsx
│   │   ├── ResultFilters.tsx
│   │   └── ManualMatchPanel.tsx
│   ├── price/
│   │   └── PriceComparePanel.tsx
│   └── feedback/
│       ├── EmptyState.tsx
│       ├── ErrorState.tsx
│       └── LoadingState.tsx
├── lib/
│   ├── youtube/
│   │   ├── parse-playlist-url.ts
│   │   ├── parse-video-title.ts
│   │   └── youtube-errors.ts
│   ├── rekordbox/
│   │   ├── validate-xml-file.ts
│   │   ├── parse-rekordbox-xml.ts
│   │   └── map-rekordbox-track.ts
│   ├── matching/
│   │   ├── normalize-track.ts
│   │   ├── match-tracks.ts
│   │   ├── score-match.ts
│   │   └── matching-rules.ts
│   ├── pricing/
│   │   ├── price-provider.ts
│   │   ├── mock-price-provider.ts
│   │   └── search-link-provider.ts
│   ├── validation/
│   │   └── schemas.ts
│   └── security/
│       └── redact-sensitive-data.ts
├── services/
│   ├── youtube.service.ts
│   ├── analysis.service.ts
│   ├── rekordbox.service.ts
│   ├── price-provider.service.ts
│   └── event.service.ts
├── types/
│   ├── playlist.ts
│   ├── track.ts
│   ├── match.ts
│   ├── analysis.ts
│   ├── pricing.ts
│   └── api.ts
├── styles/
│   ├── globals.css
│   └── tokens.css
└── tests/
    ├── youtube/
    ├── rekordbox/
    └── matching/
```

---

## 4. 계층 구조

### 4.1 계층별 책임

| 계층 | 책임 |
|---|---|
| `app` | 페이지, 라우팅, API Route 진입점 |
| `components` | UI 표시와 사용자 상호작용 |
| `lib` | 순수 함수, 파서, 정규화, 매칭, 검증 |
| `services` | 외부 API, DB, 복합 유스케이스 처리 |
| `types` | 도메인 타입 정의 |
| `styles` | 디자인 토큰, 글로벌 스타일 |
| `tests` | 파서/매칭/정규화 테스트 |

### 4.2 의존성 방향

```txt
components → types
components → app/api 호출
app/api → services
services → lib
services → database
lib → types
```

### 4.3 금지 방향

```txt
lib → components 금지
services → components 금지
components → XML 파싱 직접 수행 금지
components → 외부 API 직접 호출 금지
client component → API Key 접근 금지
```

---

## 5. 데이터 흐름

### 5.1 신규 분석 플로우

```txt
사용자
→ YouTube URL 입력
→ Client Component에서 기본 형식 검증
→ API Route: /api/youtube/playlist
→ youtube.service
→ YouTube API 호출
→ 영상 목록 반환
→ parse-video-title
→ YouTubeTrack[] 생성

사용자
→ Rekordbox XML 업로드
→ API Route: /api/rekordbox/parse
→ validate-xml-file
→ parse-rekordbox-xml
→ RekordboxTrack[] 생성
→ 원본 XML 폐기

분석 실행
→ API Route: /api/analysis/run
→ normalize-track
→ match-tracks
→ score-match
→ AnalysisSession + MatchResult[] 저장
→ 결과 페이지 표시
```

### 5.2 결과 조회 플로우

```txt
사용자
→ /results/[analysisId]
→ Server Component에서 분석 결과 조회
→ MatchResultTable 렌더링
→ 필터/정렬은 Client Component 상태로 처리
```

### 5.3 구매 액션 플로우

```txt
누락곡 선택
→ PriceComparePanel
→ /api/price/search
→ price-provider.service
→ MockProvider 또는 SearchLinkProvider
→ 구매 링크 표시
→ 구매 링크 클릭
→ /api/events/purchase-click
→ 클릭 이벤트 저장
→ 외부 사이트 새 탭 이동
```

---

## 6. 상태 관리

### 6.1 서버 상태

서버 상태는 가능한 Server Component와 API Route를 통해 관리한다.

- 분석 내역
- 분석 결과
- 파싱된 트랙 메타데이터
- 구매 클릭 이벤트
- 수동 매칭 확정 데이터

### 6.2 클라이언트 상태

클라이언트 상태는 로컬 UI 상태 중심으로 제한한다.

- 입력 중인 URL
- 파일 업로드 상태
- 현재 필터
- 정렬 조건
- 로딩 상태
- 에러 메시지
- 수동 매칭 패널 열림/닫힘

### 6.3 상태 관리 라이브러리

MVP에서는 별도 전역 상태 관리 라이브러리를 도입하지 않는다. 필요 시 다음 단계에서 Zustand 또는 TanStack Query 도입을 검토한다.

---

## 7. API 설계

### 7.1 `/api/youtube/playlist`

- Method: `POST`
- 역할: 유튜브 플레이리스트 URL 검증, playlistId 추출, 플레이리스트 곡 목록 반환

```ts
type YouTubePlaylistRequest = {
  url: string;
};

type YouTubePlaylistResponse = {
  playlistId: string;
  title?: string;
  tracks: YouTubeTrack[];
  unavailableCount: number;
};
```

### 7.2 `/api/rekordbox/parse`

- Method: `POST`
- 역할: Rekordbox XML 파일 검증 및 트랙 메타데이터 파싱
- Request: `multipart/form-data`

```ts
type RekordboxParseResponse = {
  trackCount: number;
  tracks: RekordboxTrack[];
  warnings: RekordboxParseWarning[];
};
```

### 7.3 `/api/analysis/run`

- Method: `POST`
- 역할: 유튜브 트랙과 Rekordbox 트랙 비교 및 분석 결과 생성

```ts
type RunAnalysisRequest = {
  playlistUrl: string;
  youtubeTracks: YouTubeTrack[];
  rekordboxTracks: RekordboxTrack[];
};

type RunAnalysisResponse = {
  analysisId: string;
  summary: {
    total: number;
    owned: number;
    missing: number;
    needsReview: number;
  };
  results: MatchResult[];
};
```

### 7.4 `/api/price/search`

- Method: `POST`
- 역할: 누락곡에 대한 구매 링크/가격 후보 조회

```ts
type PriceSearchRequest = {
  artist?: string;
  title: string;
};

type PriceSearchResponse = {
  query: string;
  offers: PriceOffer[];
  provider: "mock" | "search-link" | "external-api";
};
```

### 7.5 `/api/events/purchase-click`

- Method: `POST`
- 역할: 구매 링크 클릭 이벤트 저장

```ts
type PurchaseClickEventRequest = {
  analysisId: string;
  matchResultId: string;
  site: string;
  url: string;
  price?: number;
  currency?: string;
};
```

---

## 8. 도메인 타입

> **정본: 도메인 데이터 모델은 `docs/PRD.md` §8.** 아래는 코드 레이어용 TypeScript 타입이며, 필드 의미·관계의 단일 출처는 PRD §8이다.

```ts
type TrackStatus = "owned" | "missing" | "needs_review";
type MatchConfidence = "high" | "medium" | "low";

// 엔티티 형태(YouTubeTrack, RekordboxTrack, MatchResult, MatchCandidate,
// AnalysisSession, YouTubePlaylist)는 docs/PRD.md §8 참조(정본).
// 여기서는 코드 전반에서 공유하는 상태/신뢰도 enum만 정의한다.
```

---

## 9. 데이터베이스 모델 초안

MVP에서는 원본 XML을 저장하지 않고, 분석에 필요한 최소 메타데이터만 저장한다.

```txt
User
AnalysisSession
YouTubeTrackSnapshot
RekordboxTrackSnapshot
MatchResult
ManualMatchRule
PurchaseClickEvent
```

### 저장 정책

| 데이터 | 저장 여부 | 설명 |
|---|---|---|
| 원본 XML 파일 | 기본 미저장 | 파싱 후 폐기 |
| XML 파일명 | 선택 저장 | 사용자 확인용 |
| 트랙 메타데이터 | 저장 | 분석 결과 재조회용 |
| 로컬 파일 경로 | 기본 미저장 또는 마스킹 | 민감정보 가능성 |
| 분석 결과 | 저장 | 대시보드/재분석용 |
| 구매 클릭 이벤트 | 저장 | KPI 산출용 |
| 수동 매칭 규칙 | 저장 | 다음 분석 재사용용 |

---

## 10. 매칭 알고리즘 설계

### 10.1 정규화 순서

```txt
원문 문자열
→ trim
→ lowercase
→ unicode normalize
→ 특수 dash 통일
→ 괄호 표현 처리
→ feat./featuring 표기 정리
→ 공백 정리
→ 비교용 normalized key 생성
```

### 10.2 1차 매칭

```txt
normalizedArtist + normalizedTitle 정확 일치
```

결과:

- `status = owned`
- `confidence = high`
- `reason = exact`

### 10.3 2차 매칭

정확 일치가 없는 경우 유사도 기반 후보를 생성한다.

고려 요소:

- 제목 유사도
- 아티스트 유사도
- 제목만 유사한 경우
- 길이 정보 유사도
- Remix/Edit/Version 표기

### 10.4 신뢰도 기준 초안

| Score | Confidence | Status |
|---|---|---|
| 0.95 이상 | high | owned |
| 0.75 이상 0.95 미만 | medium | needs_review |
| 0.55 이상 0.75 미만 | low | needs_review |
| 0.55 미만 | low | missing |

정확한 기준은 테스트 데이터 축적 후 조정한다.

---

## 11. 가격 Provider 설계

### 11.1 목적

음악 판매 사이트 연동은 정책 변화, API 부재, 크롤링 제한 가능성이 높다. 따라서 가격 조회 기능은 Provider 인터페이스로 분리한다.

### 11.2 Interface

```ts
type PriceProvider = {
  name: string;
  search(track: {
    artist?: string;
    title: string;
  }): Promise<PriceOffer[]>;
};
```

### 11.3 MVP Provider

| Provider | 역할 |
|---|---|
| MockPriceProvider | 개발/테스트용 가격 데이터 |
| SearchLinkProvider | Beatport, Juno Download, Traxsource 등 검색 링크 생성 |
| ExternalApiProvider | 후속 실제 연동용 확장 포인트 |

---

## 12. 보안 설계

### 12.1 API Key 보호

- 외부 API Key는 서버 환경변수로만 관리한다.
- Client Component에서 API Key에 접근하지 않는다.
- API Route 또는 Service 계층을 통해서만 외부 API를 호출한다.

### 12.2 XML 처리

- 원본 XML은 기본적으로 저장하지 않는다.
- XML 내용은 로그에 남기지 않는다.
- 파일 크기 제한을 둔다.
- 파싱 중 오류가 발생해도 원본 일부를 에러 메시지로 노출하지 않는다.
- 로컬 파일 경로는 저장하지 않거나 마스킹한다.

### 12.3 삭제 정책

- 사용자는 분석 내역을 삭제할 수 있다.
- 사용자는 파싱된 트랙 데이터와 매칭 결과를 삭제할 수 있다.
- 삭제 전 확인 절차를 둔다.

---

## 13. 오류 처리 전략

| 영역 | 오류 |
|---|---|
| YouTube | INVALID_URL, PRIVATE_PLAYLIST, DELETED_PLAYLIST, QUOTA_EXCEEDED, NETWORK_ERROR |
| XML | INVALID_FILE_TYPE, FILE_TOO_LARGE, XML_PARSE_FAILED, MISSING_FIELDS, ENCODING_ERROR |
| Matching | NO_TRACKS, LOW_CONFIDENCE_ONLY, MATCHING_FAILED |
| Pricing | PROVIDER_FAILED, NO_PRICE_FOUND, LINK_UNAVAILABLE |
| Data | ANALYSIS_NOT_FOUND, DELETE_FAILED |

### 사용자 메시지 원칙

- 개발자 로그 원문을 노출하지 않는다.
- 원인을 짧게 설명한다.
- 사용자가 할 수 있는 다음 행동을 제공한다.
- 재시도 버튼을 제공한다.

---

## 14. 성능 전략

### 14.1 프론트엔드

- 결과 테이블은 상태별 필터링 시 불필요한 리렌더링을 줄인다.
- 대량 트랙 목록은 가상 스크롤 도입을 검토한다.
- 검색 입력에는 debounce를 적용한다.
- 결과 테이블 컴포넌트는 메모이제이션을 검토한다.

### 14.2 백엔드/API

- 유튜브 플레이리스트 페이지네이션을 서버에서 처리한다.
- 외부 API 호출 실패를 재시도하되 무한 재시도하지 않는다.
- 가격 조회는 TTL 캐시를 적용할 수 있다.
- XML 파싱은 파일 크기 제한을 둔다.

### 14.3 데이터

- 원본 XML을 저장하지 않아 저장소 비용과 보안 리스크를 줄인다.
- 분석 결과는 요약 지표와 필요한 트랙 메타데이터만 저장한다.
- 대량 결과 조회 시 페이지네이션 또는 lazy loading을 검토한다.

---

## 15. 테스트 전략

### 15.1 Unit Test 우선 대상

```txt
lib/youtube/parse-playlist-url.ts
lib/youtube/parse-video-title.ts
lib/rekordbox/validate-xml-file.ts
lib/rekordbox/parse-rekordbox-xml.ts
lib/matching/normalize-track.ts
lib/matching/match-tracks.ts
lib/matching/score-match.ts
lib/pricing/search-link-provider.ts
```

### 15.2 주요 테스트 케이스

```txt
Daft Punk - One More Time
Daft Punk – One More Time
Daft Punk - One More Time (Official Video)
Daft Punk feat. Romanthony - One More Time
One More Time - Daft Punk
```

### 15.3 Component Test

- PlaylistUrlForm
- XmlUploadBox
- MatchResultTable
- ResultFilters
- StatusBadge
- ConfidenceBadge
- ErrorState

### 15.4 E2E Test

MVP 후순위로 적용한다.

```txt
새 분석 시작
→ URL 입력
→ XML 업로드
→ 분석 실행
→ 누락만 보기
→ 구매 링크 클릭
```

---

## 16. 디자인 적용 위치

디자인은 `docs/UI_GUIDE.md` 기준으로 `components` 계층에서 적용한다.

- `components/retro`에 레트로 공통 컴포넌트를 둔다.
- 도메인 로직에는 디자인 관련 의존성을 넣지 않는다.
- 테이블 가독성을 최우선으로 한다.
- Apple 로고, 실제 Macintosh 시스템 아이콘, OS UI 복제는 금지한다.

---

## 17. 환경변수

```txt
YOUTUBE_API_KEY=
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
PRICE_PROVIDER_MODE=mock
MAX_XML_FILE_SIZE_MB=20
```

### 규칙

- `NEXT_PUBLIC_` prefix가 붙은 값만 클라이언트에 노출 가능하다.
- API Key는 절대 `NEXT_PUBLIC_`로 선언하지 않는다.
- `.env` 파일은 커밋하지 않는다.

---

## 18. 배포 고려사항

### MVP 배포

- Vercel 또는 유사한 Next.js 호스팅 환경
- PostgreSQL/Supabase 연결
- GitHub Actions 기반 lint/test/build 검증
- main branch 보호 규칙 적용
- PR 리뷰 후 merge

### 운영 리스크

| 리스크 | 대응 |
|---|---|
| 유튜브 API quota 초과 | 쿼터 오류 안내, 캐시, 재시도 제한 |
| XML 대용량 업로드 | 파일 크기 제한, 파싱 실패 안내 |
| 가격 Provider 실패 | 검색 링크 fallback |
| 매칭 오류 | 신뢰도 표시, 수동 확인 |
| 사용자 데이터 삭제 누락 | 삭제 API와 테스트 강화 |

---

## 19. 구현 순서

> **구현 순서(Phase)의 단일 출처는 이 섹션이다.** CLAUDE.md·WORKFLOW.md는 여기를 참조만 한다.

### Phase 0: Foundation

- docs 정비
- Git/PR 규칙 정비
- UI Guide 반영
- 기본 프로젝트 구조 설정

### Phase 1: Project Setup

- Next.js App Router 구성
- TypeScript strict mode
- Tailwind CSS
- 테스트 환경
- 공통 타입 정의

### Phase 2: Ingestion

- 유튜브 URL parser
- 유튜브 플레이리스트 API route
- XML 파일 검증
- Rekordbox XML parser

### Phase 3: Matching

- 정규화 로직
- 정확 일치 매칭
- 유사도 매칭
- 신뢰도 산정
- 수동 매칭 구조

### Phase 4: UI

- AppShell
- WindowPanel
- PlaylistUrlForm
- XmlUploadBox
- MatchResultTable
- StatusBadge
- ResultFilters

### Phase 5: Pricing & Actions

- PriceProvider interface
- SearchLinkProvider
- MockPriceProvider
- Purchase click event

### Phase 6: Hardening

- 오류 메시지 정리
- 삭제 기능
- 보안 점검
- 성능 최적화
- CI 검증
