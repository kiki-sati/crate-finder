# UI Guide — 페이지 / 인터랙션 / 접근성

> `docs/UI_GUIDE.md`에서 분리된 페이지 레벨 가이드 + 인터랙션·접근성·반응형·콘텐츠 톤.

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

