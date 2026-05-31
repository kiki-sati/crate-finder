---
name: warn-xml-logging
enabled: true
event: file
conditions:
  - field: new_text
    operator: regex_match
    pattern: (console\.(log|debug|info|warn|error)|logger\.\w+)\s*\([^)]*(xml|Xml|XML|rawXml|xmlContent|fileContent)
---

⚠️ **XML 원본이 로그에 노출될 수 있습니다**

CLAUDE.md/보안 규칙: Rekordbox XML 원문, API Key, 로컬 파일 경로를 로그/에러 메시지에 노출 금지.

- XML 변수를 그대로 로그에 찍지 마세요.
- 필요하면 파일명·트랙 수 등 비민감 메타데이터만 로깅하거나, `src/lib/security/redact-sensitive-data.ts`로 마스킹하세요.
