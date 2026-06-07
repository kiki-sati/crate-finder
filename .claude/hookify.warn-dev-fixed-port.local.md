---
name: warn-dev-fixed-port
enabled: true
event: bash
pattern: (?<!PORT=\d{4} )(?<!PORT=\d{4}  )(npm run dev|next dev|npm start|next start)(?!.*(-p |--port))
action: warn
---

⚠️ **dev/start 서버 포트를 고정하세요**

포트를 명시하지 않으면 3000이 점유됐을 때 Next.js가 자동으로 3001 등 다른 포트로 옮겨갑니다.
그러면 고정 포트(3000)로 보낸 curl/preview 요청이 엉뚱한 서버에 닿아 404로 오진할 수 있습니다.

- 포트를 명시하세요: `PORT=3100 npm run dev` 또는 `npm run dev -- -p 3100`
- 또는 점유 프로세스를 먼저 정리: `lsof -ti:3000 | xargs kill`
- 요청 검증 시 dev 로그의 실제 "Local: http://localhost:PORT" 를 확인한 뒤 그 포트로 curl 하세요.
