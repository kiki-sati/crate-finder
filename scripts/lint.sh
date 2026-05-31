#!/usr/bin/env bash
# Atomic tool: lint only.
# package.json이 없으면 스캐폴딩 전이므로 graceful skip한다.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f package.json ]; then
  echo "skip(lint): package.json 없음 — 프로젝트 스캐폴딩 전"
  exit 0
fi

if ! npm run | grep -qE '^\s*lint'; then
  echo "skip(lint): package.json에 lint 스크립트 없음"
  exit 0
fi

npm run lint
