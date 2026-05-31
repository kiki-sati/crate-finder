# Analysis 입력 플로우 UI — 설계 (Spec)

- 작성일: 2026-05-31
- 상태: 승인됨 (brainstorming)
- 트랙: **FE** (`feature/analysis-flow`). 병렬 트랙 — BE 트랙(`2026-05-31-matcher-engine-design.md`)과 별도 PR.
- 베이스: `chore/contract-foundation` (계약 동결: `src/types/*`, `src/mocks/sample-data.ts`) 위에 stack.
- 관련 문서: `docs/ui/PAGES.md` §21(Analysis Page), `docs/UI_GUIDE.md`, `docs/ui/PAGES.md` §17~20, `docs/ARCHITECTURE.md` §19(Phase 4), `CLAUDE.md`(계층 규칙)

## 1. 배경 / 목적

Phase 4(UI Foundation)로 컴포넌트(AppShell·WindowPanel·PlaylistUrlForm·FileUploadBox·MatchResultTable·StatusBadge·ResultFilters)와 결과 페이지(`/results`, mock loader)는 만들어졌다. **그러나 입력 플로우가 비어 있다**: `src/app/page.tsx`는 정적 소개문구뿐이고, `PlaylistUrlForm`·`FileUploadBox`는 어느 페이지에도 연결되지 않은 고아 상태다. 즉 사용자가 URL 입력·XML 업로드·분석 시작을 할 화면이 없다.

이 트랙의 목적은 **사용자가 입력→분석→결과까지 끝단 흐름을 경험할 수 있는 Analysis 페이지**를 mock 기반으로 완성하는 것이다.

## 2. 범위

### 포함
- `src/app/page.tsx` 교체 — 정적 소개 → `AnalysisFlow` 마운트
- `src/components/analysis/AnalysisFlow.tsx` (client) — 입력 플로우 오케스트레이터 + 상태 머신
- `src/components/analysis/StepIndicator.tsx` — 단계 표시
- `src/services/analysis.service.ts` (mock) — `loadPlaylist`·`parseXml`·`runMatch` (sample-data 반환 + 인위적 지연)
- 로딩·에러·빈 상태
- 각 컴포넌트 TDD 테스트 (`*.test.tsx`)

### 제외 (다음 단계 / 별도)
- 실제 API·환경변수 연결 (통합 PR — mock service가 교체 지점)
- 랜딩·대시보드·설정 페이지 (CLAUDE.md상 후순위)
- 분석 내역 저장/삭제 (Phase 6)
- 가격·구매 액션 (Phase 5)
- 결과 공유 URL / 상태 영속화

## 3. 확정된 결정

| 항목 | 결정 | 근거 |
|---|---|---|
| 범위 | 입력→분석→결과 플로우 | 끝단 흐름 완성, 고아 컴포넌트 연결 |
| 통합 경계 | **완전 mock 서비스 경유** | BE와 완전 격리, `results/loader.ts` 패턴과 일관, 교체 지점 명시 |
| 페이지 구조 | `"/"`=입력 플로우, Run→`/results` 이동 | 가장 단순, 랜딩/대시보드 후순위(CLAUDE.md) |
| 상태 전달 | mock이라 불필요(통합 시 store 도입) | YAGNI — `/results`는 자체 mock loader 유지 |

## 4. 구조 & 계층 규칙 (CLAUDE.md)

- `component → service` 호출은 허용, **역방향(`service`/`lib` → `component`) 금지**.
- mock `analysis.service.ts`는 외부 API/Key를 호출하지 않으므로 client에서 호출 가능.
- 컴포넌트에서 XML 파싱·매칭 알고리즘 직접 구현 금지 (mock service가 결과를 반환).

| 파일 | 책임 |
|---|---|
| `src/app/page.tsx` | `AnalysisFlow` 마운트 (server component가 client 컴포넌트 래핑) |
| `src/components/analysis/AnalysisFlow.tsx` | `"use client"`. PlaylistUrlForm + FileUploadBox + Run + StepIndicator 조합, 상태 머신 |
| `src/components/analysis/StepIndicator.tsx` | 1 플레이리스트 · 2 XML · 3 분석 — 현재 단계 강조 |
| `src/services/analysis.service.ts` | `loadPlaylist(url)`·`parseXml(file)`·`runMatch(...)` → sample-data 반환(지연). **통합 시 fetch 교체 단일 지점** |

## 5. 상태 머신

```txt
idle
 ─URL 입력 + Load→ loadingPlaylist → playlistReady(트랙 수 표시) | error(URL 오류 즉시 표시)
 ─XML 선택→        parsingXml      → xmlReady(파일명 + 트랙 수 표시) | error
 (playlistReady && xmlReady) → Run 버튼 enabled
 ─Run→ matching(로딩) → router.push("/results") | error
```

- 각 단계는 독립적으로 진행 가능(플레이리스트/ XML 순서 무관).
- 에러는 해당 단계에 국한 표시, 재시도 가능.

## 6. PAGES.md §21 규칙 반영

- 입력·업로드 **둘 다 완료 전까지 Run 버튼 disabled**
- 입력 오류 **즉시 표시** (잘못된 URL 등 — `src/lib/youtube/youtube-errors.ts` 재사용)
- XML 업로드 성공 시 **파일명 + 트랙 수** 표시
- **Step indicator** 제공
- Loading / error 상태 제공

## 7. UI_GUIDE / 접근성 준수 (`docs/ui/PAGES.md` §17~20)

- 접근성: `input`-`label` 연결, `div` 아닌 `button`, focus ring 유지(제거 금지), color-only 전달 금지, semantic HTML.
- 모션: transition 120~180ms, 장식 애니메이션 금지.
- 콘텐츠 톤: 한국어 본문 + 영어 상태 라벨(OWNED/MISSING/REVIEW), 짧고 명확, 다음 행동 안내.
- 반응형: 데스크톱 우선, URL 입력과 XML 업로드 세로 배치.

## 8. 결과 이동 (mock 단계 vs 통합)

- **mock 단계(이 PR)**: `Run` → `router.push("/results")`. `/results`는 기존 mock loader로 자체 렌더(현 구조 유지). 상태 전달 불필요.
- **통합(다음 PR)**: mock service를 실제 fetch로 교체, 분석 결과를 store(또는 server state)에 저장 후 `/results`가 그 결과를 읽음.

### 8.1 통합 단계 보안 가드레일 (필수 — ADR-003 / ARCHITECTURE §4.2·§5.1·§12.1)

> mock인 `src/services/analysis.service.ts`는 client 컴포넌트(`AnalysisFlow`)가 **직접 호출**한다. mock 단계에선 외부 API·API Key·`fetch`·`process.env`가 전혀 없어 안전하지만, 통합 시 이 호출 경로를 그대로 두면 키가 클라이언트 번들에 노출된다. 통합 PR은 아래를 반드시 지킨다.

- `loadPlaylist`/`parseXml`/`runMatch`의 구현을 **API Route 호출(`fetch('/api/youtube/playlist')` 등)로 교체**한다. 정본 흐름: `client component → API Route(/api/*) → service → 외부 API`(ARCHITECTURE §5.1).
- **금지**: client에서 실행되는 `analysis.service`가 `youtube.service`(YouTube API Key 보유) 등 서버 service를 직접 import하는 것. → 키가 클라이언트로 번들링됨(ADR-003·CLAUDE.md 보안 위반).
- `YOUTUBE_API_KEY`는 서버 영역(`src/app/api/*`, `src/services/*`의 서버 전용 경로)에서만 접근한다. `NEXT_PUBLIC_` 금지.
- 교체 후 검증: client 번들에 키/외부 엔드포인트 비밀이 포함되지 않는지 확인(`process.env` 직접 참조가 client 경로에 없을 것).

## 9. 테스트 케이스 (TDD, 테스트 먼저)

- `AnalysisFlow`:
  - 초기 상태: Run 버튼 disabled
  - 플레이리스트만 로드 → Run 여전히 disabled
  - XML만 업로드 → Run 여전히 disabled
  - 둘 다 완료 → Run enabled
  - XML 업로드 성공 시 파일명·트랙 수 표시
  - 잘못된 URL → 에러 메시지 즉시 표시, Run disabled 유지
  - Run 클릭 → matching 로딩 표시 → `/results` 이동 (router mock)
- `StepIndicator`: 현재 단계 강조 렌더
- `analysis.service.ts`(mock): 각 함수가 sample-data 형태 반환

## 10. 산출물 / AC

- `bash scripts/verify.sh` 통과 (lint → build → test).
- `/`에서 URL 입력·XML 업로드·Run까지 흐름 동작(mock), Run 후 `/results` 도달.
- 신규 테스트 모두 통과, 기존 테스트 무회귀.
