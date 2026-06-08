# Crate Finder

유튜브 플레이리스트와 Rekordbox XML 라이브러리를 비교해 **보유 · 미보유 · 확인필요** 곡을 식별하고,
미보유 곡 구매 액션을 제공하는 DJ 음악 라이브러리 관리 웹앱.

## 핵심 흐름

```txt
YouTube 플레이리스트 URL 입력 → 곡 목록 로드 → 제목에서 아티스트/곡명 추출
→ Rekordbox XML 업로드 → 파싱·정규화 → 보유/미보유/확인필요 매칭(신뢰도 표시)
→ 확인필요 곡 수동 확정/거부(localStorage 영속) → 미보유 곡 구매 액션 → 분석 내역 저장
```

- **보유(owned)** 라이브러리에 있음 · **미보유(missing)** 없음 · **확인필요(needs_review)** 후보는 있으나 수동 확인 필요
- 매칭 신뢰도: **high / medium / low**. 불확실하면 억지로 보유 처리하지 않고 *확인필요*로 둔다.

## 기술 스택

Next.js 15.5 (App Router) · React 19 · TypeScript(strict) · Tailwind v4 (CSS-first `@theme`) · Vitest 4 · npm
영속화는 브라우저 localStorage(서버 DB 없음). 외부 연동은 YouTube Data API v3.

## 로컬 개발

```bash
npm install
cp .env.example .env        # YOUTUBE_API_KEY 채우기(없으면 스텁/데모로 동작)
PORT=3100 npm run dev       # 포트 고정 권장(미지정 시 3000 점유되면 3001로 이동→404 오진)
```

브라우저에서 http://localhost:3100 열기. 키 없이 흐름만 보려면 플레이리스트 URL에 데모 ID(`PLDEMO`)를 사용한다.

### 환경변수
실제로 코드가 읽는 변수는 `YOUTUBE_API_KEY`(필수·서버 전용)와 `PRICE_PROVIDER_MODE`(선택, 기본 `mock`)뿐이다.
**`YOUTUBE_API_KEY`는 절대 `NEXT_PUBLIC_`로 노출하지 않는다.** 자세한 표는 [`.env.example`](./.env.example) 및 [`docs/DEPLOY.md`](./docs/DEPLOY.md) 참고.

## 검증

```bash
bash scripts/verify.sh      # lint → build → test 일괄
# 개별: npm run lint | npm run build | npm run test
```

순수 로직(파서·정규화·매처·검증)은 TDD(테스트 먼저)로 작성한다.

## 배포

Vercel 권장(DB 불필요, Next.js 자동 감지). 단계별 절차·환경변수·알려진 제약은
**[`docs/DEPLOY.md`](./docs/DEPLOY.md)** 참고. 요약: 저장소 Import → `YOUTUBE_API_KEY` 등록 → Deploy.

## 문서

| 문서 | 내용 |
|---|---|
| [`docs/PRD.md`](./docs/PRD.md) | 제품 목표·MVP 범위·**도메인 데이터 모델(정본)** |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | 계층·데이터 흐름·API·매칭·보안·성능·테스트 |
| [`docs/ADR.md`](./docs/ADR.md) | 기술 의사결정과 트레이드오프 |
| [`docs/UI_GUIDE.md`](./docs/UI_GUIDE.md) | 디자인 토큰·원칙 |
| [`docs/DEPLOY.md`](./docs/DEPLOY.md) | 배포(Vercel) 절차 |

## 프로젝트 구조 (요약)

```txt
src/
  app/         # 라우트·페이지·API 라우트(서버 영역)
  components/  # UI(파싱·매칭·외부 호출 직접 금지)
  lib/         # 순수 로직: parser · normalizer · matcher · validator
  services/    # 외부 연동·복합 유스케이스(서버 영역)
  types/       # 공유 타입(정본)
  styles/      # tokens.css → globals.css(@theme)
```

계층 의존 규칙·자세한 구조는 [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) 참고.
