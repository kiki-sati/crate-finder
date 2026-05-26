# CLAUDE.md

## Project

Repository: `crate-finder`  
Product Name: `Crate Finder`  
Description: 유튜브 플레이리스트와 Rekordbox XML 라이브러리를 비교하여 보유곡, 누락곡, 확인 필요 곡을 식별하고, 누락곡에 대한 구매 액션을 제공하는 DJ 음악 라이브러리 관리 웹앱.

---

## Source of Truth

Claude Code는 작업 전 반드시 아래 문서를 기준으로 판단한다.

1. `docs/PRD.md`
   - 제품 목표
   - MVP 범위
   - 기능 요구사항
   - 제외 범위
   - 성공 기준

2. `docs/ARCHITECTURE.md`
   - 디렉토리 구조
   - API 설계
   - 데이터 흐름
   - 계층별 책임
   - 보안/성능/테스트 전략

3. `docs/ADR.md`
   - 기술 의사결정
   - 선택 이유
   - 트레이드오프

4. `docs/UI_GUIDE.md`
   - Classic Macintosh-inspired DJ Workstation 디자인 방향
   - 컴포넌트 규칙
   - 디자인 금지사항

문서와 충돌하는 구현을 하지 않는다.  
문서에 없는 큰 결정이 필요하면 먼저 사용자에게 확인한다.

---

## Core Product Rules

이 프로젝트의 핵심 기능은 다음 흐름이다.

```txt
YouTube Playlist URL 입력
→ playlistId 추출
→ 플레이리스트 곡 목록 불러오기
→ 영상 제목에서 아티스트/곡명 추출
→ Rekordbox XML 업로드
→ XML 파싱
→ 트랙 정규화
→ 보유/누락/확인필요 매칭
→ 매칭 신뢰도 표시
→ 누락곡 구매 액션 제공
→ 분석 내역 저장/삭제
```

MVP에서 가장 중요한 것은 다음 세 가지다.

1. Rekordbox XML을 안정적으로 파싱하는 것
2. 유튜브 트랙과 Rekordbox 트랙을 정확하게 비교하는 것
3. 사용자가 누락곡을 빠르게 확인할 수 있는 결과 테이블을 제공하는 것

랜딩페이지, 고급 애니메이션, 과한 디자인 작업은 후순위다.

---

## Tech Stack

기본 기술 스택은 다음을 기준으로 한다.

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Zod
- Prisma
- PostgreSQL 또는 Supabase Postgres
- Vitest
- React Testing Library
- Playwright는 후순위

외부 라이브러리 추가가 필요한 경우, 반드시 다음 기준을 검토한다.

- 번들 크기
- 유지보수 상태
- 대체 가능성
- 테스트 가능성
- 장기 운영 리스크

---

## Architecture Rules

### 1. 계층 분리

다음 책임을 반드시 분리한다.

```txt
app        = 페이지, 라우팅, API Route
components = UI 표시와 사용자 상호작용
lib        = 순수 함수, parser, normalizer, matcher, validator
services   = 외부 API, DB, 복합 유스케이스
types      = 도메인 타입
styles     = 디자인 토큰, 글로벌 스타일
tests      = 핵심 로직 테스트
```

### 2. 금지 의존성

다음 구조는 금지한다.

```txt
lib → components
services → components
components → XML 파싱 직접 수행
components → 외부 API 직접 호출
client component → API Key 접근
```

### 3. 외부 API 호출

YouTube API, 가격 조회 API, 외부 Provider 호출은 반드시 서버 영역에서 수행한다.

허용 위치:

```txt
src/app/api/*
src/services/*
```

금지 위치:

```txt
src/components/*
Client Component 내부
브라우저에서 직접 호출되는 코드
```

API Key는 절대 클라이언트에 노출하지 않는다.

---

## Security Rules

### 1. Rekordbox XML 처리

Rekordbox XML은 민감 정보를 포함할 수 있다.  
예를 들어 로컬 파일 경로, 라이브러리 구조, 개인 작업 환경 정보가 포함될 수 있다.

따라서 다음 규칙을 지킨다.

- 원본 XML은 기본적으로 저장하지 않는다.
- XML 파싱 후 필요한 메타데이터만 저장한다.
- XML 원본 내용은 로그에 남기지 않는다.
- 에러 메시지에 XML 원문 일부를 노출하지 않는다.
- 로컬 파일 경로는 저장하지 않거나 마스킹한다.
- 파일 크기 제한을 둔다.
- 삭제 기능을 제공한다.

### 2. 환경변수

다음 규칙을 지킨다.

- API Key는 `.env`에 저장한다.
- `.env`는 커밋하지 않는다.
- `NEXT_PUBLIC_` prefix가 붙은 값만 클라이언트 노출 가능하다.
- `YOUTUBE_API_KEY`는 절대 `NEXT_PUBLIC_`로 선언하지 않는다.

예시:

```txt
YOUTUBE_API_KEY=
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
PRICE_PROVIDER_MODE=mock
MAX_XML_FILE_SIZE_MB=20
```

---

## Domain Model Rules

주요 도메인 타입은 다음 기준을 따른다.

```ts
type TrackStatus = "owned" | "missing" | "needs_review";

type MatchConfidence = "high" | "medium" | "low";
```

매칭 결과는 반드시 다음 세 가지 상태 중 하나를 가진다.

| Status | 의미 |
|---|---|
| `owned` | Rekordbox 라이브러리에 보유 중인 곡 |
| `missing` | 라이브러리에 없는 것으로 판단되는 곡 |
| `needs_review` | 매칭 후보가 있으나 수동 확인이 필요한 곡 |

신뢰도는 다음 세 가지로 표시한다.

| Confidence | 의미 |
|---|---|
| `high` | 정확 일치 또는 매우 높은 신뢰도 |
| `medium` | 후보는 있으나 확인 권장 |
| `low` | 불확실성이 높음 |

---

## Matching Rules

트랙 매칭 로직은 UI와 분리한다.

허용 위치:

```txt
src/lib/matching/
```

필수 파일 예시:

```txt
normalize-track.ts
match-tracks.ts
score-match.ts
matching-rules.ts
```

### 정규화 기준

다음 처리를 고려한다.

- trim
- lowercase
- unicode normalize
- dash 문자 통일
- 중복 공백 제거
- 괄호 표현 처리
- `feat.`, `featuring`, `ft.` 표기 처리
- `official video`, `lyrics`, `visualizer` 등 유튜브성 표현 제거 또는 감점
- `original mix`, `remix`, `edit`, `version` 등 DJ 트랙 표기 보존 여부 검토

### 매칭 순서

```txt
1. normalizedArtist + normalizedTitle 정확 일치
2. 제목 + 아티스트 유사도 매칭
3. 제목 중심 후보 매칭
4. 길이 등 보조 정보 활용
5. 수동 확인 후보 생성
```

### 주의

불확실한 항목을 억지로 `owned` 처리하지 않는다.  
애매하면 `needs_review`로 둔다.

---

## Pricing Rules

가격 조회는 Provider 패턴으로 분리한다.

MVP에서는 다음 우선순위를 따른다.

```txt
1. MockPriceProvider
2. SearchLinkProvider
3. ExternalApiProvider는 후속 확장
```

음악 판매 사이트의 API 정책, 크롤링 허용 여부, 가격 정보 정확성이 불확실하므로, MVP에서 실시간 최저가 자동화를 무리하게 구현하지 않는다.

구매 액션은 우선 검색 링크 기반으로 제공해도 된다.

---

## UI Rules

디자인은 `docs/UI_GUIDE.md`를 따른다.

### Design Concept

```txt
Classic Macintosh-inspired DJ Workstation
```

### 핵심 원칙

- 레트로 Macintosh-inspired 감성
- 실제 Apple 로고, 시스템 아이콘, OS UI 복제 금지
- 분석 결과 테이블 가독성 최우선
- 보유/누락/확인필요 상태 명확히 표시
- 과한 네온, 글래스모피즘, AI SaaS 스타일 금지
- 데스크톱/태블릿 우선

### 구현 우선순위

```txt
1. AppShell
2. WindowPanel
3. PlaylistUrlForm
4. XmlUploadBox
5. MatchResultTable
6. StatusBadge
7. ConfidenceBadge
8. ResultFilters
9. LoadingState
10. ErrorState
11. EmptyState
```

랜딩페이지는 후순위다.  
이 서비스의 핵심 화면은 결과 테이블이다.

---

## Component Rules

컴포넌트는 재사용 가능하게 분리한다.

추천 구조:

```txt
src/components/
├── layout/
│   ├── AppShell.tsx
│   ├── TopMenuBar.tsx
│   └── StatusBar.tsx
├── retro/
│   ├── WindowPanel.tsx
│   ├── RetroButton.tsx
│   ├── RetroInput.tsx
│   └── RetroSelect.tsx
├── playlist/
│   └── PlaylistUrlForm.tsx
├── rekordbox/
│   └── XmlUploadBox.tsx
├── results/
│   ├── MatchResultTable.tsx
│   ├── StatusBadge.tsx
│   ├── ConfidenceBadge.tsx
│   ├── ResultFilters.tsx
│   └── ManualMatchPanel.tsx
├── price/
│   └── PriceComparePanel.tsx
└── feedback/
    ├── EmptyState.tsx
    ├── ErrorState.tsx
    └── LoadingState.tsx
```

### 컴포넌트 작성 원칙

- UI 컴포넌트에 parser/matcher 로직을 넣지 않는다.
- props 타입을 명확히 정의한다.
- 상태 배지는 색상만으로 의미를 전달하지 않는다.
- button, input, table은 semantic HTML을 사용한다.
- 접근성을 위해 label, aria 속성을 고려한다.
- focus outline을 제거하지 않는다.

---

## Testing Rules

핵심 로직은 테스트 없이 구현하지 않는다.

### 우선 테스트 대상

```txt
src/lib/youtube/parse-playlist-url.ts
src/lib/youtube/parse-video-title.ts
src/lib/rekordbox/validate-xml-file.ts
src/lib/rekordbox/parse-rekordbox-xml.ts
src/lib/matching/normalize-track.ts
src/lib/matching/match-tracks.ts
src/lib/matching/score-match.ts
src/lib/pricing/search-link-provider.ts
```

### 필수 테스트 케이스 예시

```txt
Daft Punk - One More Time
Daft Punk – One More Time
Daft Punk - One More Time (Official Video)
Daft Punk feat. Romanthony - One More Time
One More Time - Daft Punk
```

### 검증 명령

PR 생성 전 가능한 범위에서 아래 명령을 실행한다.

```bash
npm run lint
npm run test
npm run build
```

명령이 없는 경우, 임의로 무시하지 말고 현재 package script를 확인한 뒤 가능한 검증만 수행한다.

---

## Performance Rules

### Frontend

- 결과 테이블의 불필요한 리렌더링을 줄인다.
- 필터/정렬은 memoization을 검토한다.
- 대량 트랙 목록은 가상 스크롤 도입을 검토한다.
- 검색 입력에는 debounce를 적용한다.
- 상태 변경 범위를 최소화한다.

### API / Backend

- 유튜브 플레이리스트 페이지네이션을 서버에서 처리한다.
- 외부 API 실패 시 무한 재시도하지 않는다.
- 가격 조회에는 TTL 캐시를 고려한다.
- XML 파일 크기 제한을 둔다.
- 일부 항목 파싱 실패가 전체 분석 실패로 이어지지 않도록 한다.

---

## Git Workflow Rules

### Branch

`main` 브랜치에 직접 커밋하거나 push하지 않는다.

작업은 반드시 브랜치에서 수행한다.

```txt
feature/{short-description}
fix/{short-description}
docs/{short-description}
refactor/{short-description}
test/{short-description}
chore/{short-description}
```

예시:

```txt
feature/youtube-playlist-parser
feature/rekordbox-xml-parser
feature/track-matching
docs/update-architecture
fix/xml-encoding-error
test/matching-normalization
```

### Commit

Conventional Commits를 사용한다.

형식:

```txt
type(scope): summary
```

허용 type:

```txt
feat
fix
docs
style
refactor
test
chore
perf
ci
build
```

예시:

```txt
feat(youtube): add playlist url parser
fix(rekordbox): handle xml encoding errors
docs(ui): add macintosh-inspired ui guide
test(matching): add normalization cases
refactor(results): split status badge component
```

### Pull Request

Claude Code는 작업 완료 후 PR을 생성한다.  
사용자가 확인하기 전 merge하지 않는다.

PR 생성 전 확인한다.

```txt
1. 현재 브랜치 확인
2. git status 확인
3. 변경 파일 확인
4. lint/test/build 실행
5. 변경 요약 작성
6. 리스크 작성
7. 리뷰 포인트 작성
8. PR 생성
```

---

## PR Review Rules

PR 본문에는 다음 항목을 포함한다.

```md
## Summary

-

## Changes

-

## Verification

- [ ] npm run lint
- [ ] npm run test
- [ ] npm run build

## Screenshots

-

## Risk

-

## Review Points

-
```

### Claude Code는 다음을 보고해야 한다.

- 어떤 파일을 수정했는지
- 왜 수정했는지
- 테스트 결과
- 실패한 검증이 있는지
- 사람이 중점적으로 봐야 할 부분
- known risk

---

## Implementation Process

작업은 작은 phase/step 단위로 진행한다.

### 추천 단계

```txt
Phase 0: Foundation
Phase 1: Project Setup
Phase 2: Ingestion
Phase 3: Matching
Phase 4: UI
Phase 5: Pricing & Actions
Phase 6: Hardening
```

### 작업 원칙

- 한 PR에는 하나의 목적만 담는다.
- 구현 범위를 임의로 확장하지 않는다.
- 문서 변경과 기능 구현을 불필요하게 섞지 않는다.
- 큰 구조 변경이 필요하면 먼저 사용자에게 보고한다.
- 실패한 테스트를 숨기지 않는다.
- 임시 구현이면 TODO와 이유를 남긴다.

---

## Error Handling Rules

사용자에게 노출되는 오류 메시지는 다음 원칙을 따른다.

- 짧고 명확하게 작성한다.
- 원인을 설명한다.
- 다음 행동을 제시한다.
- 개발자 로그 원문을 그대로 노출하지 않는다.
- XML 원문, API Key, 파일 경로 등 민감정보를 노출하지 않는다.

예시:

```txt
XML 파일을 읽을 수 없습니다.
Rekordbox에서 내보낸 XML 파일인지 확인한 뒤 다시 업로드하세요.
```

---

## Do Not

Claude Code는 다음을 하지 않는다.

- main 브랜치에 직접 push
- 사용자 승인 없이 merge
- API Key를 클라이언트에 노출
- XML 원본 내용을 로그에 출력
- 원본 XML을 기본 저장
- UI 컴포넌트에서 XML 파싱 수행
- UI 컴포넌트에서 매칭 알고리즘 직접 구현
- 문서와 충돌하는 구조 변경
- 테스트 실패를 무시하고 PR 생성
- Apple 로고 또는 실제 Macintosh 시스템 아이콘 사용
- 과한 네온/글래스모피즘/AI SaaS 스타일 적용
- 전체 기능을 한 번에 구현
- 관련 없는 리팩토링을 같은 PR에 포함

---

## When Unsure

다음 상황에서는 임의 결정하지 말고 사용자에게 확인한다.

- 외부 API 추가 여부
- DB 스키마 큰 변경
- 원본 XML 저장 정책 변경
- 인증 방식 도입
- 가격 조회 방식 변경
- 디자인 방향 변경
- 대규모 리팩토링
- MVP 범위 확대
- 유료 기능 또는 계정 기능 추가
