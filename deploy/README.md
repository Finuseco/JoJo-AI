# Unified deployment — ai.cashpay-all.com

One repository (JoJo-AI), one Next.js server, one application listener **127.0.0.1:8095**, one PM2 process **jojo-ai**. Web pages and all API routes execute in the same server. Windows and future mobile clients use the same HTTPS endpoint and APIs. No internal API URL or separate API process is used.

## First installation

Clone Finuseco/JoJo-AI branch codex/production-studio-foundation. Use Node 22+ and npm. Copy .env.example to .env.local and configure DATABASE_URL, JOJO_AUTH_JWT_SECRET (matching the developer portal), INTEGRATION_ENCRYPTION_KEY and OpenAI model/key settings. The database must contain dev_portal_users. Configure the portal handoff/GitHub callback for https://ai.cashpay-all.com.

Run:

```sh
npm ci --ignore-scripts
node --env-file=.env.local scripts/migrate.cjs
npm run build
pm2 startOrRestart deploy/ecosystem.config.cjs --update-env
curl --fail http://127.0.0.1:8095/healthz
pm2 save
```

Include studio-nginx.conf.example inside the existing TLS server block for ai.cashpay-all.com. It has one location `/`, forwarding every page/API/SSE request to 8095. Use `nginx -t` before reloading. Nginx still terminates public HTTPS normally; the application port stays private. No production server is changed automatically by this repository.

## Migrating the earlier split installation

Move the existing API environment into this single application's .env.local. Back up the current web environment first. Preserve the existing JWT/encryption keys and database connection: do not generate replacement keys when moving services. The previous API .env.local already contains the necessary server settings and public origin. AI_API_INTERNAL_URL is no longer used and can be removed.

For the previously documented server directories, after backing up settings:

```sh
cp -a /var/www/cashpay-all/jojo-ai/.env.local /root/jojo-ai-web.env.backup
cp -a /var/www/cashpay-all/ai_api/.env.local /var/www/cashpay-all/jojo-ai/.env.local
chmod 600 /var/www/cashpay-all/jojo-ai/.env.local
cd /var/www/cashpay-all/jojo-ai
```

Update/build/migrate and start the unified application as above. Verify its health endpoint before reloading Nginx. Replace any old custom `/api/` location with the unified configuration: it must no longer target a separate API. After the unified service is healthy and Nginx routes to it, remove only the obsolete PM2 process if it exists:

```sh
if pm2 describe jojo-ai-api >/dev/null 2>&1; then pm2 delete jojo-ai-api; fi
pm2 save
```

Do not delete other CashPay processes, the database or old environment backups. The old ai_api directory is not needed to run this release. Avoid deploying the obsolete standalone repository.

## IDE / clients

Desktop: local Monaco workers, resizable explorer/editor/assistant and docked terminal; Ctrl P files/commands, Ctrl J terminal, Ctrl B explorer, Ctrl S save. Phones use a tactile native text editor and full-width panels. File CRUD uses the versioned REST API with optimistic revisions, conflict status 409 and existing tenant/session guards. Chat SSE and actual proposal previews are unchanged; no self-HTTP RPC is required for the web's server actions.

Electron defaults to https://ai.cashpay-all.com and consumes the same pages/routes. Build with npm run desktop:package:windows, distribute the entire output folder, and perform Windows signing/runtime validation before release. Java/.NET are not required for this client shell. Future native mobile clients must implement the documented authenticated session/Origin flow; no separate mobile backend is necessary and no permissive wildcard CORS is enabled.

Optional build/Android workers keep isolated execution and hardware access outside the web server; their public client entrypoints remain this application's API. They do not require another web/API deployment. KVM, native compilation/signing, production provider credentials, worker setup and hosting DNS/TLS remain genuine infrastructure requirements.
