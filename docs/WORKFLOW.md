# WORKFLOW — WAT 기반 작업 운영 매뉴얼

이 프로젝트의 모든 작업은 **WAT 프레임워크**(Nate Herk)를 따른다.
WAT = **W**orkflows · **A**gents · **T**ools. 즉 "AI의 추론과 실행을 분리"한다 —
Claude에게 **생각(workflow 설계)** 을 시키고, **실행/검증은 도구**에 맡긴다.

---

## WAT ↔ 이 repo 매핑

| 구성 | 의미 | 이 repo의 자산 |
|---|---|---|
| **W**orkflows | 작업 흐름을 코드보다 먼저 plain English로 정의 | `docs/`(Source of Truth) + `/harness`로 작성하는 `phases/{task}/step{N}.md` |
| **A**gents | self-healing + 서브에이전트 병렬 | `scripts/execute.py`(step별 새 세션·가드레일 주입·summary 누적·3회 자가 교정) + Explore/Plan 서브에이전트 |
| **T**ools | 작고 원자적인 도구의 조합 | `scripts/{build,test,lint,verify}.sh`, `/harness`·`/review` 커맨드, `.claude/settings.json` hook |

---

## W — Workflows: 코드 전에 흐름을 글로

> 10분 투자해 workflow를 명확히 정의하면 수시간의 삽질을 줄인다.

1. **큰 작업은 Plan Mode부터**(`Shift+Tab`). Claude가 수정 대상·접근을 제시 → 리뷰 → 승인 후 실행.
2. 승인되면 `/harness`로 작업을 여러 **step**으로 쪼갠 초안을 만든다. step 설계 규칙은 `.claude/commands/harness.md` 참조. 핵심:
   - **Scope 최소화** — 한 step = 한 레이어/모듈.
   - **자기완결성** — 각 step 파일은 독립 세션에서 실행된다. 외부 대화 참조 금지, 필요한 정보는 파일 안에.
   - **AC는 실행 가능한 커맨드** — `bash scripts/verify.sh` 등.

## A — Agents: 실행과 자가 교정

step 파일이 준비되면 두 가지 실행 방식 중 택한다.

- **자동(권장: 흐름이 명확한 다단계 작업)**
  ```bash
  python3 scripts/execute.py {task-name}          # 순차 실행 + 3회 자가 교정
  python3 scripts/execute.py {task-name} --push   # 실행 후 push
  ```
  execute.py가 자동 처리: `feat-{task}` 브랜치 · 매 step에 CLAUDE.md+docs 가드레일 주입 · 이전 step summary 누적 전달 · 실패 시 최대 3회 재시도(에러 피드백) · 코드/메타데이터 2단계 커밋.
- **인터랙티브(권장: 탐색·불확실성이 큰 작업)** — step 파일을 직접 세션에 주고 한 step씩 진행.

탐색이 필요하면 **Explore 서브에이전트를 병렬로** 띄워 결론만 회수한다.

## T — Tools: 작은 도구의 조합

거대한 스크립트 하나보다 원자적 도구 여러 개가 낫다.

| 도구 | 역할 |
|---|---|
| `scripts/lint.sh` / `build.sh` / `test.sh` | 각각 단일 책임 (package.json 없으면 graceful skip) |
| `scripts/verify.sh` | 위 셋을 조합한 검증 — step AC와 Stop hook이 호출 |
| `scripts/execute.py` | harness step 오케스트레이터 |
| `/harness` · `/review` · `/ship` | step 설계 · 변경 리뷰 · 검증→커밋→push→PR 자동화 |
| `.claude/settings.json` hook | Stop 시 `verify.sh` 자동 실행, 위험 명령(`rm -rf` 등) 사전 차단 |

---

## 병렬 트랙: BE / FE / QA (서브에이전트 + 워크트리)

독립적인 작업은 **트랙별 전용 서브에이전트**가 **격리된 git 워크트리**에서 병렬로 진행한다.
에이전트 정의는 `.claude/agents/{backend,frontend,test-verify}.md`(git 추적, 팀 공유)다.

| 트랙 | 에이전트 | 워크트리 | 쓰기 화이트리스트 |
|---|---|---|---|
| **BE** | `backend` | `../crate-finder-be` | `src/lib/**` · `src/services/**` · `src/app/api/**` + 해당 테스트 |
| **FE** | `frontend` | `../crate-finder-fe` | `src/components/**` · `src/styles/**` · `app/page.tsx`·`layout.tsx` + 해당 테스트 |
| **QA** | `test-verify` | `../crate-finder-qa` | `scripts/**` · `src/tests/**` · 루트 검증 설정 |

**공유 계약 = `src/types/**` · `src/mocks/**`.** BE·FE는 이 영역을 **읽기 전용**으로 다룬다.
부족하면 고치지 말고 멈춰 보고 → 계약을 **별도 PR로 먼저** 올리고 각 트랙 PR을 그 위에 쌓는다(stacked).

**운영 규칙**
- **트랙별 PR 분리.** 독립 트랙을 한 PR로 묶지 않는다(CLAUDE.md).
- 새 작업은 항상 **최신 `main`에서 브랜치를 새로 따서** 워크트리에 올린다(낡은 브랜치 위에서 작업 금지).
- QA(`test-verify`)는 **게이트키퍼**다. FE/BE 자기보고를 신뢰하지 않고 워크트리에서 `verify.sh`를 직접 재실행 + diff 화이트리스트 대조 + 보안 감사 후 통합을 권고한다.
- 워크트리 생성: `git worktree add ../crate-finder-be -b feature/{slug} main` (트랙별로 반복).

### 워크트리 셋업 (1회)

```bash
# 메인 저장소(crate-finder)에서, 최신 main 기준으로 트랙 워크트리 생성
git worktree add ../crate-finder-be -b be/{slug}   main   # BE 트랙
git worktree add ../crate-finder-fe -b fe/{slug}   main   # FE 트랙
git worktree add ../crate-finder-qa -b qa/{slug}   main   # QA 트랙

git worktree list          # 확인
git worktree remove ../crate-finder-be   # 트랙 종료 시 정리
```

> `.claude/worktrees/*`(세션 임시 워크트리)는 `.next/` 빌드 산출물을 품어 lint를 오염시키므로
> `eslint.config.mjs`가 `.claude/**`를 ignore한다. 트랙 워크트리는 **저장소 바깥**(`../crate-finder-*`)에 둔다.

---

## 핵심 운영 루프

```txt
Plan Mode 설계 → /harness로 step 분할 → (한 step씩) 구현
→ scripts/verify.sh 검증 → 작은 단위 commit → /clear → 다음 step
```

원칙:
- **한 세션 = 한 피처(step).** step 사이에 `/clear`. 신선한 컨텍스트 > 부풀어진 컨텍스트.
- **작은 변경 → test → lint → commit** 루프. 문제 생기면 마지막 커밋으로 복귀.
- Claude의 thinking 로그를 보다가 **잘못된 가정**이 보이면 즉시 `Escape`.
- 에러는 **해석하지 말고 로그 원문 그대로** 붙여넣는다.
- 무거운 데이터 처리는 대화가 아니라 **스크립트로 오프로드**, 결과 요약만 회수.
- 막히면 `/export` → 다른 AI에게 비평 요청.

---

## 진행 현황

Phase 1~5 완료(main 반영): 스캐폴딩 · Ingestion(YouTube/Rekordbox 파싱·API) · Matching(매칭 엔진) ·
UI(레트로 UI + 결과 테이블) · Pricing & Actions · 분석 내역(localStorage).
`scripts/verify.sh`/Stop hook은 실제 동작 중(lint→build→test→typecheck).

**다음: Phase 6 Hardening** — 오류 메시지 정리 · 삭제 기능 점검 · **보안 점검**(XML 원본 미저장·API Key·로그 노출) · 성능 최적화.
Phase 순서의 정본은 `docs/ARCHITECTURE.md` §19.
