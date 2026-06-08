# 배포 가이드 (Vercel)

Crate Finder를 Vercel에 배포하는 절차다. **DB가 필요 없고**(영속화는 브라우저 localStorage, ADR-004)
Next.js를 Vercel이 자동 감지하므로 설정이 단순하다. 필요한 건 사실상 **YouTube API 키 하나**다.

---

## 1. 사전 준비

| 항목 | 설명 |
|---|---|
| GitHub 저장소 | `kiki-sati/crate-finder` (이미 있음) |
| Vercel 계정 | https://vercel.com — GitHub 계정으로 가입/로그인 |
| YouTube Data API v3 키 | [Google Cloud Console](https://console.cloud.google.com/) → 프로젝트 생성 → **YouTube Data API v3 사용 설정** → 사용자 인증 정보 → **API 키** 발급. 키 제한은 "API 제한 → YouTube Data API v3"만 권장 |

> 키 발급이 처음이면: Google Cloud Console에서 프로젝트를 만들고 → "API 및 서비스 → 라이브러리"에서 *YouTube Data API v3* 검색 후 **사용** → "API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → API 키".

---

## 2. 환경변수

Vercel 대시보드 **Project → Settings → Environment Variables**에 등록한다. (로컬은 `.env` — `.env.example` 참고)

| 변수 | 필수 | 환경 | 설명 |
|---|---|---|---|
| `YOUTUBE_API_KEY` | ✅ **필수** | Production, Preview | YouTube Data API v3 키. **서버 전용** — 절대 `NEXT_PUBLIC_` 금지. 미설정 시 실제 조회 불가(스텁/데모만 동작) |
| `PRICE_PROVIDER_MODE` | 선택 | 전체 | 가격 조회 모드. 기본 `mock`. 미설정이면 자동 mock |
| `DATABASE_URL` | ❌ 미사용 | — | 현재 DB 없음(localStorage). 등록 불필요 |
| `NEXT_PUBLIC_APP_URL` | ❌ 미사용 | — | 현재 코드 미사용. 향후 예약 |
| `MAX_XML_FILE_SIZE_MB` | ❌ 미배선 | — | 현재 코드상 20MB 고정. 등록해도 효과 없음(아래 *알려진 제약* 참고) |

**핵심:** 실서비스로 쓰려면 `YOUTUBE_API_KEY` **하나만** 넣으면 된다. 나머지는 비워도 동작한다.

### 보안 수칙 (CLAUDE.md §보안 / ADR-004)
- `YOUTUBE_API_KEY`는 **서버 환경변수로만**. `NEXT_PUBLIC_` 접두사를 붙이면 브라우저로 노출되니 절대 금지.
- `.env`는 커밋하지 않는다(`.gitignore`로 차단됨). 커밋되는 건 `.env.example`뿐.
- 업로드된 Rekordbox XML 원본은 저장/로그하지 않는다(파싱 후 폐기).

---

## 3. 배포 절차 (대시보드)

1. **vercel.com → Add New… → Project**
2. **Import Git Repository** → `kiki-sati/crate-finder` 선택 (필요 시 GitHub 연동 승인)
3. **Configure Project**
   - *Framework Preset*: **Next.js** (자동 감지됨 — 그대로 둔다)
   - *Build Command*: 기본값 `next build` (수정 불필요)
   - *Output*: 자동 (`.next` — 수정 불필요)
   - *Node.js Version*: **24.x** (저장소 `engines`/`.nvmrc`로 고정됨 — 자동 일치)
   - *Environment Variables*: `YOUTUBE_API_KEY` 추가
4. **Deploy** 클릭 → 빌드(약 1–2분) → 배포 URL 발급 (`https://crate-finder-xxxx.vercel.app`)

이후 `main`에 머지될 때마다 자동 재배포된다. (PR마다 Preview 배포도 자동 생성)

### CLI로 하려면 (선택)
```bash
npm i -g vercel
vercel login
vercel link            # 저장소를 Vercel 프로젝트에 연결
vercel env add YOUTUBE_API_KEY   # production 선택 후 키 입력
vercel --prod          # 프로덕션 배포
```

---

## 4. 배포 후 점검 체크리스트

배포 URL에서 확인한다:

- [ ] `/` (홈) 정상 렌더
- [ ] YouTube 플레이리스트 URL 입력 → **Run** → 곡 목록 로드(키 정상 동작 확인)
- [ ] Rekordbox XML 업로드(**Choose file**) → 파싱 성공
- [ ] `/results` 결과 테이블 표시(보유/미보유/확인필요)
- [ ] 확인필요 곡 **확정/거부** → 같은 곡 재분석 시 결정 유지(localStorage 영속화)
- [ ] `/history` 분석 내역 표시

빠른 동작 확인은 플레이리스트 URL에 데모 ID(`PLDEMO`)를 쓰면 키 없이도 흐름을 볼 수 있다.

---

## 5. 알려진 제약 (배포 환경 특성)

1. **업로드 파일 크기 ~4.5MB 상한**
   Rekordbox XML은 서버 API 라우트(`/api/rekordbox/parse`)로 업로드된다. **Vercel 서버리스 함수는 요청 본문이 약 4.5MB로 제한**되어, 앱 코드 한도(20MB)와 무관하게 그보다 큰 파일은 함수에 도달하기 전 플랫폼이 거부한다(HTTP 413).
   - 일반적인 라이브러리(수천 곡, ~1–2MB)는 문제없다.
   - 4.5MB를 넘는 초대형 라이브러리는 Rekordbox에서 일부만 내보내거나, 향후 개선(클라이언트 파싱/분할 업로드) 필요.
   - *후속 개선안:* `MAX_XML_FILE_SIZE_MB`를 실제 코드에 배선해 4MB로 낮추면, 플랫폼의 불친절한 413 대신 앱의 친절한 "파일이 너무 큽니다" 안내가 먼저 뜬다.

2. **함수 실행 시간**
   매칭 연산은 **브라우저(클라이언트)에서** 수행되므로 서버 타임아웃과 무관하다. 다만 **초대형 플레이리스트(2000곡+) 조회**는 YouTube API 페이지네이션으로 수 초~수십 초가 걸릴 수 있다. 기본 함수 실행 한도(플랜에 따라 10초~)를 넘으면 Vercel Project Settings에서 함수 실행 시간을 상향한다.

3. **데이터 영속화 범위**
   분석 내역·수동 결정은 **브라우저 localStorage**에 저장된다(서버 DB 없음). 따라서 **기기/브라우저가 다르면 공유되지 않고**, 브라우저 데이터를 지우면 사라진다. 서버 공유가 필요해지면 DB 도입이 후속 과제(ADR 참조).

---

## 6. 커스텀 도메인 (선택)

Vercel **Project → Settings → Domains**에서 보유 도메인을 추가하고 안내된 DNS 레코드를 등록하면 된다.

---

## 참고 문서
- 아키텍처/보안/성능: [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)
- 기술 의사결정: [`docs/ADR.md`](./ADR.md)
- 제품 범위/데이터 모델: [`docs/PRD.md`](./PRD.md)
