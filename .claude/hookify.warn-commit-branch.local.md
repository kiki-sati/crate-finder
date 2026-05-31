---
name: warn-commit-branch
enabled: true
event: bash
pattern: git\s+commit\b
action: warn
---

⚠️ **커밋 전 브랜치 확인**

CLAUDE.md 규칙: `main`에 직접 commit 금지.

커밋 직전 현재 브랜치가 `main`이 아닌지 확인하세요:
```bash
git rev-parse --abbrev-ref HEAD   # main이면 중단하고 feature 브랜치로 전환
```
(hookify는 명령어만 보고 브랜치를 알 수 없어 경고만 표시합니다.)
