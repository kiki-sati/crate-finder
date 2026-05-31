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
| `/harness` · `/review` | step 설계 · 변경 리뷰 슬래시 커맨드 |
| `.claude/settings.json` hook | Stop 시 `verify.sh` 자동 실행, 위험 명령(`rm -rf` 등) 사전 차단 |

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

## 다음 실전 작업

현재 코드는 0줄(package.json 없음)이라 atomic scripts/hook은 graceful skip 상태다.
**첫 `/harness` task는 Phase 1 Project Setup**(Next.js App Router + TS strict + Tailwind + Vitest 스캐폴딩, package.json 생성)이어야 verify.sh/hook이 실제로 동작한다. 이후 Phase 2 Ingestion → 3 Matching → 4 UI → 5 Pricing → 6 Hardening (순서는 `docs/ARCHITECTURE.md` §19).
