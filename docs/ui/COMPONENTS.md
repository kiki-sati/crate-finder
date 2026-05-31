# UI Guide — 컴포넌트 스펙

> `docs/UI_GUIDE.md`(디자인 토큰·원칙)에서 분리된 컴포넌트별 시각 스펙.
> 컴포넌트 구현 시 UI_GUIDE.md와 이 파일을 함께 참조한다.

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

