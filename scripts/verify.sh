#!/usr/bin/env bash
# Atomic tool 조합: lint → build → test 순차 검증.
# WAT의 검증 단계 및 .claude/settings.json Stop hook에서 호출한다.
# 개별 도구는 package.json이 없으면 graceful skip하므로 스캐폴딩 전에도 깨지지 않는다.
set -euo pipefail
cd "$(dirname "$0")/.."

bash scripts/lint.sh
bash scripts/build.sh
bash scripts/test.sh
echo "verify: 완료"
