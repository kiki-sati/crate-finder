# GitHub Actions CI (verify) — 설계 노트

**작성일:** 2026-06-01
**브랜치:** `feature/ci-verify` (base: `chore/contract-foundation`)
**관련:** ADR-014(PR 기반 반영), ARCHITECTURE §18(GitHub Actions lint/test/build), Phase 6 "CI 검증"

> **자율 작업 노트:** 문서에 명시된 Phase 6 deliverable. 시크릿/배포 없이 `verify.sh`만 실행하는
> 저위험·되돌리기 쉬운 chore라 self-approve. 사용자는 PR을 검토 후 머지 여부 결정.

## 결정

- 워크플로 1개(`ci.yml`), job 1개(`verify`): `npm ci` → `bash scripts/verify.sh`(lint→build→test).
- 트리거: 모든 `pull_request` + `main`/`chore/contract-foundation` push. (스테이징 브랜치 구조상 PR base가 `chore/contract-foundation`이므로 PR 검증이 핵심.)
- Node 22(LTS, Next 15.5·Vitest 4 지원 범위). 로컬 검증은 Node 24에서 통과 — 22도 표준 지원.
- 시크릿 미사용(외부 API 미연동). `next build`는 env 없이 동작 확인됨(라우트 동적).

## 비범위 / 후속

- branch protection·required checks 설정(레포 설정, 사용자 권한 필요).
- 배포(Vercel 등), E2E(Playwright, MVP 후순위), 캐시 세분화.
- 멀티 Node 매트릭스(필요 시 추가).
