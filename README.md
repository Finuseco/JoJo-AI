# JoJo AI — one application, one port

**https://ai.cashpay-all.com** serves the web IDE and every API route from the same Next.js application on **127.0.0.1:8095**, with one PM2 process (`jojo-ai`). No separate API process, internal API URL, API proxy, or second application port is required.

- `/`: project dashboard.
- `/workspace/:id`: authenticated IDE, desktop Monaco and tactile mobile editor.
- `/p/:id`: private/public project WebView.
- `/api/v1/...`: workspace/session/files/chat API, shared by web, Electron Windows and future Android/iOS clients.
- Existing `/api/projects/...` and `/api/integrations/...`: runtime/GitHub/ZIP/OpenAI/Android operations.

Copy `.env.example` to `.env.local` and configure PostgreSQL, the developer portal JWT secret, encryption and OpenAI models/keys there. Use Node 22+, `npm ci`, `node --env-file=.env.local scripts/migrate.cjs`, `npm run build`, then `pm2 startOrRestart deploy/ecosystem.config.cjs --update-env`. The database must already contain dev_portal_users. Nginx forwards the entire domain to 8095; see deploy/studio-nginx.conf.example.

The former split ai_api service is superseded. See deploy/README.md for safely moving its existing environment settings back into this application; preserve existing signing/encryption keys. There is no call to an internal API service.

Windows: `npm run desktop:package:windows` builds a genuine x64 portable Electron client opening this same public endpoint. The Windows executable has no server secrets; its renderer stays sandboxed. The application is online, not an offline local server. Signing/native Windows runtime tests remain release work.

No demo database/provider result or drawn emulator fallback is used. OpenAI requests require actual configuration and API billing. Android boot needs KVM. Optional isolated build/emulator workers remain tools behind this application's API; they are not separate web/API deployments. See deploy/AUDIT.md for remaining capability limits.

### Public showcase and studio entry

`/` is a lightweight JoJo AI presentation served from `public/showcase/index.html`, with local `style.css` and `main.js`. It follows the CashPay showcase structure and verified violet palette, with the supplied owl logo, FR/EN content and reduced-motion animations. It does not load the IDE or request a session. `/dashboard` is the authenticated project dashboard, `/workspace/:id` the existing IDE, and `/api/...` the same backend on port 8095. Sign-in callbacks enter the dashboard directly. No additional service, dependency or database migration is required for the showcase.
