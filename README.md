# JoJo AI Studio — Web & Windows

Virtual IDE for **https://ai.cashpay-all.com**: local Monaco editor/workers, resizable explorer/editor/assistant, command palette, file tabs, integrated project terminal, real OpenAI proposal stream and version-aware file operations. The mobile layout uses full-width panels instead of shrinking the desktop workspace.

## Separate backend

The business API is now a separate project, [Finuseco/ai_api](https://github.com/Finuseco/ai_api), developed independently in `/workspace/ai_api`. Web listens on 127.0.0.1:8095; the API on 127.0.0.1:8096. Nginx routes `/api/` to the API and other paths to the web, under the same public HTTPS origin. The web's server-action adapters and development gateway also forward to this API. OpenAI keys, JWT signing, encryption and database access belong to the API environment only.

Copy `.env.example` to `.env.local`, configure the internal API address, then `npm ci`, `npm run build`, and `pm2 start deploy/ecosystem.config.cjs`. Deploy/migrate the API first. See [deployment](deploy/README.md), [audit](deploy/AUDIT.md) and [Nginx](deploy/studio-nginx.conf.example).

## Windows

`npm run desktop:package:windows` builds a genuine Windows x64 portable Electron application for ai.cashpay-all.com. Distribute the whole generated folder, not the EXE alone. The Windows CI workflow packages it on windows-latest. The client uses the same cloud workspace/API/session; it is not an offline local development server. No OpenAI keys, database passwords, unrestricted filesystem IPC or host shell are embedded. Code signing, installer/update publishing and native Windows runtime verification remain release steps.

## Actual limits

The API provides 100 non-cumulative daily application credits; these do not make OpenAI usage free. API billing is distinct from ChatGPT subscription billing, subject to OpenAI's actual eligible API-credit programs. No subscription/session-cookie workaround is used. Android boot still needs a KVM worker; native APK and arbitrary Windows project compilation are not implemented. No provider output or emulator screen is simulated.
