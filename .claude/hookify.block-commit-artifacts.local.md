---
name: block-commit-artifacts
enabled: true
event: bash
pattern: git\s+add\b.*(node_modules|\.next/|/\.next|\bout/|\bbuild/|\.tsbuildinfo)
action: block
---

🚫 **빌드 산출물/의존성 스테이징 차단**

`node_modules`, `.next`, `out`, `build`, `*.tsbuildinfo`는 커밋하지 않습니다(.gitignore 대상).

- 전체 스테이징이 필요하면 `git add -A` 후 `git status`로 확인하세요. .gitignore가 이들을 자동 제외합니다.
- 특정 파일만 명시적으로 add 하세요.
