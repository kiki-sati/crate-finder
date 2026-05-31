현재 작업을 검증하고 커밋·push한 뒤 PR을 생성한다. 인자로 커밋 메시지를 받는다(Conventional Commits 형식).

사용: `/ship feat(youtube): add playlist url parser`

인자가 없으면 변경 내용을 보고 적절한 `type(scope): summary`를 제안한 뒤 사용자에게 확인받는다.

## 절차

아래를 순서대로 수행한다. **각 단계가 실패하면 즉시 중단하고 사용자에게 보고한다.** 다음 단계로 넘어가지 않는다.

### 1. 브랜치 가드 (CRITICAL)

```bash
git rev-parse --abbrev-ref HEAD
```

- 현재 브랜치가 `main`이면 **중단**한다. 절대 main에서 커밋하지 않는다(CLAUDE.md 규칙).
  - 변경 내용을 보고 적절한 브랜치명(`feature|fix|docs|refactor|test|chore/{slug}`)을 제안하고, 사용자 승인 후 `git checkout -b <branch>`로 옮긴 뒤 진행한다.
- main이 아니면 그대로 진행한다.

### 2. 변경 확인

```bash
git status --short
```

- 변경이 없으면 중단하고 "커밋할 변경이 없습니다"라고 보고한다.
- `node_modules`, `.next`, `*.tsbuildinfo`, `.env`(단 `.env.example` 제외)가 스테이징 대상에 섞이지 않는지 확인한다.

### 3. 검증 (verify)

```bash
bash scripts/verify.sh
```

- lint→build→test가 모두 통과해야 한다. **실패하면 중단**하고 실패 로그를 사용자에게 보고한다. 테스트 실패를 숨기고 진행하지 않는다(CLAUDE.md "Do Not").

### 4. 커밋

- 인자로 받은 메시지(또는 합의된 메시지)로 커밋한다. 메시지는 Conventional Commits 형식이어야 한다.
- 커밋 메시지 끝에 다음을 포함한다:
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  ```
- `.claude/*.local.md`, `.claude/launch.json` 같은 개인 설정 파일은 기본적으로 스테이징하지 않는다(사용자가 명시 요청하면 예외).

### 5. push

```bash
git push -u origin <current-branch>
```

### 6. PR 생성

```bash
gh pr create --base main --head <current-branch> --title "<제목>" --body "<본문>"
```

- 제목은 커밋 요약을 기반으로 작성한다.
- 본문에는 Summary / Changes / Verification(체크 완료 표시) / Reviewer Notes를 포함한다.
- 같은 브랜치에 이미 PR이 열려 있으면 새로 만들지 말고 push만 한 뒤 기존 PR URL을 보고한다.
- 생성된 PR URL을 `<pr-created>URL</pr-created>` 태그로 감싸 보고한다.

### 7. 보고

- 브랜치, 커밋 해시, 검증 결과, PR URL을 요약 보고한다.
- **머지는 하지 않는다.** 사용자 승인 후 별도로 머지한다(CLAUDE.md 규칙).

## 주의

- `gh`/`brew`가 PATH에 없으면 `export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"`를 먼저 실행한다.
- 어느 단계든 실패 시 다음으로 진행하지 말고 멈춰서 보고한다.
