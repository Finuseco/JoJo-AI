# Deployment: ai.cashpay-all.com

## Architecture

| Component | Private listener | Responsibility |
| --- | --- | --- |
| JoJo-AI web | 127.0.0.1:8095 | Responsive IDE and Electron renderer |
| ai_api | 127.0.0.1:8096 | Authentication, PostgreSQL, OpenAI, workspace APIs |
| Runtime worker | 127.0.0.1:8791 / 8790 | Isolated npm jobs / static sites |
| Android worker | 127.0.0.1:8788 | Actual KVM emulator and ADB/noVNC |

The public domain is https://ai.cashpay-all.com. Reuse the existing TLS server and include `studio-nginx.conf.example`. API routes keep the same paths: `/api/v1/...`, `/api/projects/...`, `/api/integrations/...`. SSE buffering must stay off. Keep worker control ports private; remote workers require authenticated private HTTPS/VPN tunnels. The Android viewer keeps its separate `/android/` WebSocket proxy.

## Install/update

Use Node 22 LTS or newer and npm. Configure API `.env.local` with the shared developer-portal JWT secret, PostgreSQL, integration encryption, OpenAI models/keys and worker access. Run its migration with database variables exported. Build/start `ai_api` first (`npm ci`, `npm run migrate`, `npm run build`, its PM2 ecosystem file). In the web configure only STUDIO_PUBLIC_ORIGIN, AI_API_INTERNAL_URL and the public authentication portal URL. Build/start with `npm ci`, `npm run build`, `pm2 start deploy/ecosystem.config.cjs`. Validate Nginx with `nginx -t` before reloading. Nothing in this change deploys or alters CashPay production automatically.

The web also offers a same-origin proxy for local testing; production Nginx sends `/api/` straight to the API. Existing server-action calls use an explicit authenticated backend adapter. Cookies are HttpOnly and host-scoped. Do not add wildcard CORS, put OpenAI secrets into NEXT_PUBLIC variables, or allow arbitrary desktop IPC.

## Windows client

The Electron client defaults to https://ai.cashpay-all.com. `npm run desktop:package:windows` downloads a real Electron Windows runtime, packages `desktop/` and verifies the generated executable's PE header. Output: `desktop/dist/JoJo AI Studio-win32-x64/`. Zip/distribute the whole folder; its DLLs/resources are required. The API and web remain separately hosted. For local desktop development only, JOJO_STUDIO_URL may point to HTTP localhost after installing the Electron runtime.

Renderer security: sandbox + context isolation, Node integration disabled, no filesystem/command execution IPC, webview tag disabled, untrusted project previews stay in sandboxed iframes. The preload only relays a fixed menu-command list. Navigation is restricted to the studio and explicit OAuth origins; other links open in the system browser. Invalid TLS certificates are rejected. Windows release signing, installer creation, auto-update hosting and an actual Windows launch test remain necessary before a production signed release. The supplied CI workflow builds an artifact, not an invented download result.

## IDE behavior

Desktop: activity rail, resizable explorer/editor/assistant and a dockable terminal (Ctrl J). Mobile: horizontal navigation, dismissible file drawer and full-width tactile text editor/chat. Monaco is used on desktop; the phone editor uses a real textarea with cursor/line tracking and the same versioned save API, avoiding reliance on desktop editor behavior for virtual keyboards. Ctrl P opens actual files/commands; Ctrl S saves; Ctrl B toggles the explorer. Monaco workers load from the application, not a CDN. File create/save/rename/delete use API v1; stale writes return 409. Dirty buffers stay intact until saved/discarded. The file palette and explorer use the server's actual tree.

Chat displays actual OpenAI stream snippets, not a typewriter simulation. Complete proposals can be diffed/approved individually or atomically as a group. It remains a proposal generator: there is no autonomous Codex CLI read/edit/test loop, plugin marketplace or unrestricted host terminal. The API's dedicated workers execute actual commands and emulator sessions only when configured.

Refer to the API README for API contracts, real credit accounting, proxy/CA settings, model configuration, KVM setup and worker limitations. Changes to those systems must now be made in ai_api, not duplicated into this renderer repository.

Authenticated workspaces have reloadable routes at `/workspace/PROJECT_ID`. The project list is still permission-filtered by the API before a direct workspace URL is opened.
