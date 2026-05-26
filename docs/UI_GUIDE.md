# UI Guide

## Project

**레코드박스 연동 DJ 음악 관리 툴**

## Design Concept

### Classic Macintosh-inspired DJ Workstation

본 서비스의 UI는 초기 Apple Macintosh에서 영감을 받은 레트로 클래식 데스크톱 작업툴 감성을 기반으로 한다.

다만 실제 Apple 로고, Macintosh 시스템 아이콘, 특정 OS UI를 그대로 복제하지 않는다.  
디자인 방향은 “복제”가 아니라 “영감”이다.

이 서비스는 마케팅용 랜딩페이지가 아니라 DJ가 실제로 유튜브 플레이리스트와 레코드박스 XML을 비교하고, 보유곡/누락곡을 빠르게 판단하는 작업 도구다.

따라서 최우선 기준은 다음과 같다.

1. 분석 결과 테이블의 가독성
2. 보유/누락/확인필요 상태의 명확성
3. 유튜브 URL 입력과 XML 업로드의 직관성
4. 반복 사용 가능한 대시보드 구조
5. 레트로 감성은 유지하되 현대적인 사용성 보장

---

## Core UI Principles

### 1. Retro Shell, Modern Usability

레트로한 외형을 사용하되, 조작감은 현대 웹앱 기준을 따른다.

- 버튼 클릭 영역은 충분히 크게 유지한다.
- 입력창, 업로드 영역, 테이블은 명확하게 구분한다.
- 과도한 장식보다 작업 흐름을 우선한다.
- 모든 주요 액션은 한눈에 보여야 한다.
- 사용자가 다음에 무엇을 해야 하는지 명확히 안내한다.

### 2. Desktop Workstation Feel

전체 UI는 오래된 데스크톱 음악 관리 프로그램처럼 구성한다.

- Window Panel 기반 레이아웃
- Finder 스타일의 리스트/테이블 구조
- 메뉴바 형태의 상단 네비게이션
- 파일 업로드는 클래식 파일 선택 창 느낌
- 분석 결과는 작업용 데이터 테이블 중심

### 3. Utility First

이 앱의 핵심은 “예쁜 화면”이 아니라 “곡을 빠르게 정리하는 것”이다.

사용자가 즉시 판단해야 하는 정보는 다음이다.

- 이 곡이 레코드박스에 있는가?
- 누락된 곡인가?
- 매칭 신뢰도가 충분한가?
- 수동 확인이 필요한가?
- 구매 가능한 링크가 있는가?

---

## Visual Mood

### Keywords

- Classic desktop
- Retro file manager
- Music library workstation
- Off-white interface
- Pixel-inspired details
- Monochrome border system
- Compact but readable table
- Calm, technical, practical

### Avoid

- Neon cyberpunk
- Glassmorphism
- Heavy gradients
- Overly modern AI SaaS look
- Excessive purple glow
- Decorative animations
- Fake Apple branding
- Copying original Macintosh UI exactly

---

## Color System

### Base Colors

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

### Usage Rules

- 전체 배경은 `--color-app-bg`를 사용한다.
- 주요 창/카드는 `--color-window-bg`를 사용한다.
- 데이터 테이블 내부는 `--color-panel-bg`를 사용한다.
- 보라색은 포인트 컬러로만 사용한다.
- CTA, focus ring, 선택 상태 등에만 accent color를 제한적으로 사용한다.
- 상태값은 색상만으로 판단하게 하지 말고 반드시 텍스트 라벨을 함께 제공한다.

---

## Typography

### Font Strategy

기본 폰트는 시스템 폰트를 사용한다.

```css
font-family:
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

테이블, 코드성 데이터, URL, 파일명 등은 monospace 계열을 사용한다.

```css
font-family:
  ui-monospace,
  SFMono-Regular,
  Menlo,
  Consolas,
  "Liberation Mono",
  monospace;
```

### Usage Rules

| Element | Font |
|---|---|
| App title | system-ui, bold |
| Menu label | system-ui or monospace |
| Button | system-ui, medium |
| Input | monospace for URL input |
| Table body | system-ui or monospace mixed |
| Status badge | monospace recommended |
| Confidence score | monospace recommended |

### Size Scale

```css
--font-xs: 12px;
--font-sm: 13px;
--font-base: 14px;
--font-md: 15px;
--font-lg: 18px;
--font-xl: 22px;
--font-2xl: 28px;
```

### Typography Rules

- 본문 기본 크기는 14px 이상을 유지한다.
- 테이블은 최소 13px 이상으로 유지한다.
- 픽셀 폰트 느낌은 라벨/배지/작은 장식 요소에만 제한한다.
- 전체 본문에 픽셀 폰트를 적용하지 않는다.
- 긴 트랙명과 아티스트명은 ellipsis 처리하되, hover 또는 detail panel에서 전체 값을 확인할 수 있게 한다.

---

## Layout System

### App Shell

전체 앱은 클래식 데스크톱 작업 환경처럼 구성한다.

```txt
┌──────────────────────────────────────────────┐
│ Recordbox Matcher   File  Analyze  Settings  │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─ Playlist Import ──────────────────────┐  │
│  │ YouTube playlist URL                   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─ Rekordbox XML ────────────────────────┐  │
│  │ Choose XML file                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─ Match Results ────────────────────────┐  │
│  │ Track result table                     │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

### Page Width

```css
--layout-max-width: 1280px;
--layout-content-padding: 24px;
```

### Spacing

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
```

### Layout Rules

- 데스크톱/태블릿 우선으로 설계한다.
- 모바일은 후순위지만, 주요 기능 사용은 가능해야 한다.
- 카드형 UI보다 Window Panel 중심으로 구성한다.
- 분석 결과 테이블은 가능한 넓은 영역을 확보한다.
- 필터/정렬은 테이블 상단 toolbar에 배치한다.
- 입력 → 업로드 → 분석 → 결과 순서가 시각적으로 이어져야 한다.

---

## Border & Shape

### Border

```css
--border-window: 2px solid #111111;
--border-control: 1px solid #111111;
--border-muted: 1px solid #8A867A;
```

### Radius

```css
--radius-none: 0px;
--radius-sm: 2px;
--radius-md: 4px;
```

### Rules

- 기본적으로 각진 형태를 사용한다.
- 큰 rounded card는 사용하지 않는다.
- 버튼/입력창은 최대 2px radius로 제한한다.
- Window Panel은 2px 검은색 border를 기본으로 한다.
- 내부 구분선은 1px muted border를 사용한다.

---

## Shadow

### Shadow Tokens

```css
--shadow-window: 4px 4px 0 #111111;
--shadow-subtle: 2px 2px 0 #8A867A;
--shadow-inset: inset 1px 1px 0 #C8C1B2;
```

### Usage Rules

- 부드러운 blur shadow는 사용하지 않는다.
- 레트로 감성을 위해 hard shadow를 제한적으로 사용한다.
- 주요 Window Panel에는 `--shadow-window`를 사용할 수 있다.
- 중첩된 카드가 너무 많아지지 않도록 shadow 사용을 절제한다.

---

## Component Guidelines

## 1. AppShell

### Purpose

앱 전체의 기본 프레임이다.  
Classic desktop workstation 느낌을 제공한다.

### Structure

- Top Menu Bar
- Main Content Area
- Optional Status Bar

### Rules

- Top Menu Bar는 항상 상단에 고정하거나 페이지 최상단에 배치한다.
- 좌측에는 앱명을 표시한다.
- 우측에는 Account, Settings, Help 등을 배치한다.
- 현재 사용자가 어떤 단계에 있는지 breadcrumb 또는 step indicator를 제공할 수 있다.

### Example

```txt
Recordbox Matcher    File    Analyze    Library    Settings
```

---

## 2. Top Menu Bar

### Purpose

초기 Macintosh의 메뉴바 감성을 현대적으로 재해석한 상단 네비게이션이다.

### Visual Rules

- 높이: 36px ~ 44px
- 배경: `--color-window-bg`
- 하단 border: 2px solid black
- 텍스트: 13px ~ 14px
- 메뉴 간격: 16px ~ 24px

### Do

- 간결한 메뉴명 사용
- 현재 위치 강조
- Settings, Help 등 보조 메뉴 제공

### Do Not

- 실제 Apple 로고 사용 금지
- 원본 Macintosh 메뉴명 그대로 복제 금지
- 동작하지 않는 메뉴 과도하게 배치 금지

---

## 3. WindowPanel

### Purpose

각 기능 영역을 클래식 데스크톱 창처럼 표현한다.

### Structure

```txt
┌─ Window Title ───────────────────────────────┐
│ Content                                      │
└──────────────────────────────────────────────┘
```

### Props Concept

```ts
type WindowPanelProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};
```

### Visual Rules

- border: 2px solid black
- background: off-white
- title bar: 얇은 상단 영역
- padding: 16px ~ 24px
- shadow: optional hard shadow

### Usage

- Playlist Import
- Rekordbox XML Upload
- Match Results
- Price Compare
- Analysis History
- Settings

---

## 4. Toolbar

### Purpose

테이블 또는 작업 패널 상단에서 필터, 정렬, 액션을 제공한다.

### Rules

- WindowPanel 내부 상단에 배치한다.
- 버튼, 셀렉트, 검색 입력을 한 줄로 정리한다.
- 복잡해지면 2줄 layout 허용.
- 주요 액션은 우측, 필터는 좌측에 배치한다.

### Example

```txt
[All] [Missing] [Owned] [Needs Review]        Sort: [Confidence ▼]
```

---

## 5. Button

### Variants

#### Primary

주요 실행 액션에 사용한다.

예:
- Load Playlist
- Upload XML
- Run Analysis
- Confirm Match

Visual:
- 검은색 또는 accent 배경
- 흰색 텍스트
- 1px~2px border
- hover 시 살짝 눌리는 느낌

#### Secondary

보조 액션에 사용한다.

예:
- Retry
- View Details
- Clear Filter

Visual:
- 흰색 배경
- 검은색 border
- 검은색 텍스트

#### Danger

삭제/초기화에만 사용한다.

예:
- Delete Analysis
- Remove XML Data
- Clear All

Visual:
- danger 색상 제한적 사용
- 강한 빨간색 배경은 필요할 때만 사용

### Size

```css
height: 36px;
min-width: 88px;
padding: 0 14px;
```

### Rules

- 클릭 영역은 작게 만들지 않는다.
- 텍스트는 명확한 동사로 작성한다.
- 아이콘만 있는 버튼은 피한다.
- disabled 상태를 명확히 표시한다.

---

## 6. Input

### Usage

- YouTube Playlist URL
- Search
- Manual match query
- Settings value

### Visual Rules

- background: white
- border: 1px solid black
- height: 40px
- padding: 0 12px
- font: monospace for URL input
- focus: accent outline or black outline

### Placeholder Example

```txt
Paste YouTube playlist URL...
```

### Error State

- border를 missing/danger 색상으로 변경
- 하단에 짧은 오류 메시지 표시
- 오류 메시지는 원인과 해결 방향을 함께 제시한다.

Example:

```txt
지원하지 않는 YouTube URL 형식입니다. playlist?list= 형식의 URL을 입력하세요.
```

---

## 7. FileUploadBox

### Purpose

레코드박스 XML 업로드 영역이다.

### Visual Concept

클래식 파일 선택 창 또는 오래된 유틸리티 프로그램의 파일 선택 박스 느낌을 사용한다.

### Structure

```txt
┌─ Rekordbox XML ──────────────────────────────┐
│                                              │
│        [ Choose XML File ]                   │
│                                              │
│  Supported: .xml                             │
│  Original XML is parsed and discarded.       │
│                                              │
└──────────────────────────────────────────────┘
```

### Rules

- Drag & drop은 지원하되, 버튼 기반 업로드도 반드시 제공한다.
- 지원 확장자와 최대 파일 크기를 표시한다.
- 원본 XML 저장 정책을 명확히 안내한다.
- 업로드 중에는 진행률 또는 처리 상태를 표시한다.
- 실패 시 재업로드 버튼을 제공한다.

### States

- Idle
- Drag Over
- Uploading
- Parsing
- Success
- Failed

---

## 8. TrackResultTable

### Purpose

서비스의 핵심 컴포넌트다.  
유튜브 트랙과 레코드박스 라이브러리 매칭 결과를 한눈에 보여준다.

### Required Columns

| Column | Description |
|---|---|
| # | 순번 |
| Track | 유튜브에서 추출한 곡명 |
| Artist | 유튜브에서 추출한 아티스트 |
| Status | 보유/누락/확인필요 |
| Confidence | 매칭 신뢰도 |
| Matched Track | 레코드박스에서 매칭된 트랙 |
| Action | 구매하기/후보확인/수동확정 |

### Visual Rules

- header는 명확히 구분한다.
- row hover 상태를 제공한다.
- 긴 텍스트는 ellipsis 처리한다.
- Status와 Confidence는 badge로 표시한다.
- Missing 상태는 사용자가 즉시 알아볼 수 있어야 한다.
- Needs Review 상태는 수동 확인 액션과 연결한다.
- 모바일에서는 카드형 리스트로 전환 가능하다.

### Table Example

```txt
┌─ Match Results ─────────────────────────────────────────────────────┐
│ [All] [Missing] [Owned] [Needs Review]       Sort: [Confidence ▼]   │
├────┬──────────────────────┬────────────┬──────────┬───────────────┤
│ #  │ Track                │ Artist     │ Status   │ Confidence    │
├────┼──────────────────────┼────────────┼──────────┼───────────────┤
│ 01 │ One More Time        │ Daft Punk  │ OWNED    │ HIGH          │
│ 02 │ Unknown Track        │ Unknown    │ MISSING  │ LOW           │
│ 03 │ Blue Monday Remix    │ New Order  │ REVIEW   │ MEDIUM        │
└────┴──────────────────────┴────────────┴──────────┴───────────────┘
```

### Performance Rules

- 대량 트랙 목록 가능성을 고려한다.
- 500곡 이상 표시 가능성이 있으면 가상 스크롤 도입을 검토한다.
- 필터/정렬은 불필요한 전체 리렌더링을 줄인다.
- 검색 입력에는 debounce를 적용한다.

---

## 9. StatusBadge

### Status Values

```ts
type TrackStatus = "owned" | "missing" | "needs_review";
```

### Labels

| Value | Label |
|---|---|
| owned | OWNED |
| missing | MISSING |
| needs_review | REVIEW |

### Visual Rules

#### OWNED

- text: `--color-owned`
- background: `--color-owned-bg`
- border: 1px solid owned

#### MISSING

- text: `--color-missing`
- background: `--color-missing-bg`
- border: 1px solid missing

#### REVIEW

- text: `--color-review`
- background: `--color-review-bg`
- border: 1px solid review

### Rules

- 색상만으로 구분하지 않는다.
- 반드시 텍스트 라벨을 포함한다.
- 테이블 안에서 너무 크지 않게 유지한다.
- 배지는 monospace 사용 가능.

---

## 10. ConfidenceBadge

### Confidence Values

```ts
type MatchConfidence = "high" | "medium" | "low";
```

### Labels

| Value | Label |
|---|---|
| high | HIGH |
| medium | MED |
| low | LOW |

### Rules

- HIGH는 안정 매칭으로 표시한다.
- MED는 사용자가 확인할 수 있게 한다.
- LOW는 수동 후보 확인을 유도한다.
- 낮은 신뢰도 항목은 필터로 따로 볼 수 있어야 한다.

---

## 11. AnalysisHistoryCard

### Purpose

과거 분석 내역을 표시한다.

### Required Information

- 플레이리스트 이름 또는 URL
- 분석 일시
- 전체 곡 수
- 보유 곡 수
- 누락 곡 수
- 확인 필요 곡 수
- 다시 분석 버튼

### Visual Rules

- 작은 WindowPanel 형태로 표시한다.
- 숫자 지표는 명확히 보이게 한다.
- 최근 분석 내역이 먼저 보이게 한다.
- 삭제/재분석 액션은 구분한다.

---

## 12. PriceComparePanel

### Purpose

누락 곡에 대한 구매 정보와 가격 비교를 보여준다.

### Initial MVP Rule

초기 MVP에서는 실제 최저가 API 연동이 불확실할 수 있으므로, 다음 중 하나로 시작할 수 있다.

1. Mock price provider
2. 사이트별 검색 링크 제공
3. 실제 가격 조회는 후속 provider로 분리

### Required Information

- 사이트명
- 가격
- 통화
- 구매 링크
- 최저가 여부
- 조회 시각
- 링크 오류 상태

### Visual Rules

- 최저가 항목은 강조한다.
- 가격 정보가 없을 경우 “검색 링크 열기”를 제공한다.
- 외부 링크는 새 탭으로 연다.
- 구매 링크 클릭 이벤트 추적을 고려한다.

---

## 13. EmptyState

### Purpose

데이터가 없을 때 사용자가 다음 행동을 이해하도록 돕는다.

### Cases

- 아직 분석 내역 없음
- 플레이리스트 곡 없음
- XML 트랙 없음
- 누락 곡 없음
- 검색 결과 없음

### Rules

- 짧은 제목
- 한 줄 설명
- 다음 액션 버튼
- 과한 일러스트 사용 금지
- 레트로한 작은 아이콘 또는 ASCII-style 장식은 허용

### Example

```txt
No analysis yet.
Paste a YouTube playlist URL and upload your Rekordbox XML to start.
[Start New Analysis]
```

---

## 14. ErrorState

### Purpose

오류 원인과 해결 방법을 명확히 안내한다.

### Error Categories

#### YouTube

- Invalid URL
- Private playlist
- Deleted playlist
- API quota exceeded
- Network error

#### Rekordbox XML

- Invalid file type
- File too large
- XML parse failed
- Missing required fields
- Encoding issue

#### Price Link

- External link unavailable
- Price provider failed
- No result found

### Rules

- 오류 메시지는 원인 중심으로 작성한다.
- 재시도 버튼을 제공한다.
- 사용자가 직접 해결할 수 있는 문구를 포함한다.
- 개발자 로그성 메시지를 그대로 노출하지 않는다.

### Example

```txt
XML 파일을 읽을 수 없습니다.
레코드박스에서 내보낸 XML 파일인지 확인한 뒤 다시 업로드하세요.

[Retry Upload]
```

---

## 15. LoadingState

### Purpose

외부 API 호출, XML 파싱, 매칭 처리 중 상태를 표시한다.

### Rules

- 단순 spinner만 보여주지 않는다.
- 현재 처리 단계를 텍스트로 보여준다.
- 대기 시간이 긴 작업은 progress step을 표시한다.

### Example Steps

```txt
1. Validating playlist URL...
2. Loading YouTube tracks...
3. Parsing Rekordbox XML...
4. Matching tracks...
5. Preparing results...
```

---

## 16. Step Indicator

### Purpose

분석 실행 흐름을 명확히 보여준다.

### Steps

1. Playlist
2. Library
3. Match
4. Review
5. Buy

### Visual Rules

- 상단 또는 좌측에 표시한다.
- 현재 단계는 accent color로 표시한다.
- 완료 단계는 check 표시를 사용할 수 있다.
- 실패 단계는 오류 상태와 연결한다.

---

## 17. Interaction Rules

### Hover

- 테이블 row hover 제공
- 버튼 hover 시 눌리는 느낌
- 링크 hover 시 underline

### Focus

- 모든 input, button, link는 키보드 focus 상태를 제공한다.
- focus ring은 명확해야 한다.
- accent color 또는 black outline 사용

### Motion

- 과도한 애니메이션 금지
- transition은 120ms ~ 180ms 정도로 제한
- window opening animation 등 장식적 애니메이션은 MVP에서 제외

---

## 18. Accessibility

### Required

- Semantic HTML 사용
- button은 div가 아니라 button 사용
- table은 실제 table markup 사용
- input에는 label 연결
- status badge는 텍스트 라벨 포함
- color-only communication 금지
- keyboard navigation 고려
- focus outline 제거 금지

### Table Accessibility

- th scope 사용
- 행 클릭이 가능하면 별도 버튼도 제공
- 상태값은 스크린리더가 읽을 수 있는 텍스트 포함

---

## 19. Responsive Rules

### Desktop First

이 서비스는 DJ가 데스크톱 또는 노트북에서 사용할 가능성이 높다.  
따라서 데스크톱/태블릿 우선으로 설계한다.

### Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

### Mobile Behavior

- 테이블은 카드형 리스트로 전환 가능
- 주요 액션은 화면 하단에 고정하지 않는다
- URL 입력과 XML 업로드는 세로 배치
- 필터 버튼은 wrap 허용

---

## 20. Content Tone

### UI Text Style

- 짧고 명확하게 작성한다.
- 기술적 원인은 필요한 만큼만 설명한다.
- 사용자가 다음 행동을 알 수 있어야 한다.
- DJ 사용자에게 익숙한 library, track, playlist, crate 등의 용어를 사용할 수 있다.

### Recommended Labels

| Korean | English |
|---|---|
| 새 분석 시작 | New Analysis |
| 플레이리스트 불러오기 | Load Playlist |
| XML 업로드 | Upload XML |
| 분석 실행 | Run Match |
| 보유 | OWNED |
| 누락 | MISSING |
| 확인 필요 | REVIEW |
| 구매하기 | Buy |
| 다시 분석 | Re-run |
| 삭제 | Delete |

### Label Strategy

초기 버전은 한국어 UI를 기본으로 하되, 상태 배지에는 영어 라벨을 사용할 수 있다.

Example:

```txt
보유 / OWNED
누락 / MISSING
확인 필요 / REVIEW
```

---

## 21. Page-level Guidelines

## Landing Page

### Purpose

서비스의 목적을 짧게 설명하고 분석 시작으로 유도한다.

### Required Sections

- Hero
- 간단한 사용 흐름
- 주요 기능 요약
- Start New Analysis CTA

### Rules

- 과도한 마케팅 문구 금지
- 실제 사용 흐름을 보여준다.
- “AI 기반” 같은 모호한 표현 남용 금지
- 레트로 데스크톱 화면 preview를 사용할 수 있다.

---

## Dashboard

### Purpose

최근 분석 내역과 새 분석 시작점을 제공한다.

### Required

- New Analysis button
- Recent Analysis list
- Summary stats
- Settings link

### Layout

- 상단에 새 분석 시작 WindowPanel
- 하단에 최근 분석 내역
- 우측 또는 상단에 요약 지표

---

## Analysis Page

### Purpose

유튜브 플레이리스트와 레코드박스 XML을 입력받고 분석을 실행한다.

### Required

- Playlist URL input
- XML upload
- Run analysis button
- Step indicator
- Loading/error state

### Rules

- 입력과 업로드가 모두 완료되기 전까지 분석 버튼 disabled
- 입력 오류는 즉시 표시
- XML 업로드 성공 시 파일명, 트랙 수 표시

---

## Results Page

### Purpose

매칭 결과를 확인하고 누락 곡에 대한 액션을 수행한다.

### Required

- Match result summary
- Filter toolbar
- Track result table
- Manual match action
- Price/buy action
- Export or save option if needed

### Priority

1. Missing tracks
2. Needs review tracks
3. Owned tracks
4. Price action

---

## Settings Page

### Purpose

계정, 데이터, 개인정보 처리방침, 삭제 기능을 제공한다.

### Required

- Account management
- Analysis data management
- Uploaded XML data policy
- Delete analysis data
- Privacy policy link

### Rules

- 삭제 액션은 confirm dialog 필요
- “원본 XML 저장 여부” 정책을 명확히 표시
- 위험 액션은 일반 액션과 시각적으로 분리

---

## 22. Anti-patterns

### Do Not

- Apple 로고 사용
- 실제 Macintosh 시스템 아이콘 복제
- OS 창 닫기/최소화 버튼을 의미 없이 장식으로 남용
- 전체 UI에 픽셀 폰트 적용
- 글래스모피즘 사용
- 보라색 그라데이션 남용
- 네온 glow 효과 사용
- 테이블 대신 카드만 나열
- 상태값을 색상만으로 표시
- 작은 클릭 영역
- focus outline 제거
- 긴 로딩 중 아무 정보 없이 spinner만 표시
- 외부 API 오류를 원문 그대로 노출
- 사용자의 XML 원본 내용을 로그에 출력

---

## 23. Implementation Notes

### Recommended Component Structure

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

### Design Token File

```txt
src/styles/tokens.css
```

or

```txt
src/lib/design-tokens.ts
```

### Tailwind Extension Recommendation

Tailwind config에 다음 토큰을 반영한다.

- app background
- window background
- retro border
- hard shadow
- status colors
- monospace table styles

---

## 24. MVP Design Priority

MVP에서는 다음 순서로 UI를 구현한다.

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
12. Dashboard
13. Settings

랜딩페이지는 후순위다.  
이 서비스의 핵심은 결과 분석 화면이다.

---

## 25. Final Design Direction

이 프로젝트의 UI는 다음 문장으로 정의한다.

> A classic Macintosh-inspired DJ library workstation that helps DJs compare YouTube playlists with Rekordbox XML libraries, identify missing tracks, and take purchase actions quickly.

즉, 이 앱은 “복고풍으로 예쁜 웹사이트”가 아니라  
“오래된 음악 작업용 데스크톱 앱을 현대적인 웹 도구로 되살린 서비스”다.
