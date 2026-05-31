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

## Component & Page Specs (분리됨)

비대화 방지를 위해 컴포넌트/페이지 상세는 별도 파일로 분리했다. 필요할 때만 읽는다(lazy load).

- 컴포넌트별 시각 스펙 → `docs/ui/COMPONENTS.md`
- 페이지 / 인터랙션 / 접근성 / 반응형 / 톤 → `docs/ui/PAGES.md`

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
