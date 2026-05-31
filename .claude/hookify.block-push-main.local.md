---
name: block-push-main
enabled: true
event: bash
pattern: git\s+push\b.*\bmain\b
action: block
---

🚫 **main 브랜치 직접 push 차단**

CLAUDE.md 규칙: `main`에 직접 commit/push 금지. 작업은 feature/fix/docs/... 브랜치에서 하고 PR로 머지한다.

- 현재 작업을 feature 브랜치로 옮긴 뒤 push하세요.
- PR 생성: `gh pr create --base main --head <branch>`
