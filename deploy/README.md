# JoJo AI Studio deployment

This release replaces prototype results with authenticated operations. It is a foundation, not a complete autonomous application hosting service. No changes to existing CashPay production deployments are required by this repository.

## Components and boundaries

- Next.js: responsive project dashboard, text editor, OpenAI-only streamed code proposals, individual/bulk approval and opt-in auto-approval, collaboration invitations, GitHub OAuth/repository browser/import/three-way pull/push, ZIP import/export, isolated HTML preview, PostgreSQL console, worker controls.
- Runtime worker: actual Docker dependency installation and build logs; static `dist/` or `out/` publication; raw static HTML publication; persistent site revisions; TXT/A-record domain verification.
- Android worker: actual Android 14 emulator container, ADB APK installation, noVNC streaming. It requires Linux `/dev/kvm`; no simulated device fallback exists.
- Dedicated PostgreSQL provisioner: creates one role/database per project and stores encrypted connections. MySQL is not implemented.
- Not included: production CashPay billing integration, SSR/Node hosting, native Android APK compilation/signing, Play Store publishing, automatic same-file Git conflict resolution. Import an externally built APK to run it. Unsupported operations show an error rather than success.

## Studio

Use Node 22 LTS and npm. `package-lock.json` is the npm installation contract; the obsolete Bun lock has been removed.

1. Copy `.env.example` to `.env.local` and configure it. The authentication signing key must match the existing developer portal; optionally enforce its issuer/audience. Never use a default/shared public key. Tokens are validated against actual developer users. The existing portal may hand off a signed token via `?token=...`; the studio removes it from the address bar after exchange. Configure the portal return URL and avoid logging query strings at the proxy.
2. Back up the studio database. `dev_portal_users` must already exist. Export the database variables into the shell before running `npm run migrate` (Node scripts do not automatically read Next.js env files).
3. `npm ci`, `npm run migrate`, `npm test`, `npm run typecheck`, `npm run build`, `npm start` (127.0.0.1:8095). For PM2 use `pm2 start deploy/ecosystem.config.cjs`; configure Nginx with `deploy/studio-nginx.conf.example`, test `nginx -t`, then reload your existing Nginx service. Keep port 8095 private and use public TLS port 443. No VPS files are modified automatically.
4. Run `npm run generations:reconcile` every five minutes with `DATABASE_URL` injected by the process supervisor. It refunds interrupted generation reservations older than 15 minutes exactly once. AI proposals require approval and reject stale versions.
5. Configure a GitHub OAuth application with the exact callback in `.env.example`. The user explicitly authorizes repository access. Tokens and database connections use authenticated encryption; protect and back up the encryption key. No OAuth credentials means the connect button reports configuration missing. No OpenAI credentials means generation is refused. There is no Google/Gemini fallback. On networks requiring an HTTPS proxy, configure Node’s supported proxy mechanism; keep TLS validation enabled.

Every authenticated user receives five non-cumulative credits for the current UTC day. Credits are created on first authenticated activity that day, not dependent on a cron or opening the coding panel. One coding or logo request costs one shared credit; retries with the same request ID do not charge twice. Daily credits are consumed first; additional credits remain separate. Failed/stalled tasks refund their original daily bucket or additional balance exactly once. Existing additional balances are preserved. New accounts have no extra welcome balance unless JOJO_INITIAL_CREDITS is explicitly set. Personal API-key requests do not consume the shared credits. Financial top-up is intentionally unavailable until a verified server-to-server CashPay integration replaces the removed prototype OTP/PIN bypass. Do not treat it as a payment service.

## Build and hosting worker

Run on a dedicated disposable Linux VM with Docker, separate from financial services and the studio database. Docker access is privileged on the worker host; never grant the studio public client direct access. Place no production secrets in worker environment/files. Restrict outbound installation traffic and private network access at the VM firewall. Control listeners bind to loopback; use authenticated SSH tunnels or a private TLS/VPN proxy for remote studio access.

Copy `server/runtime/.env.example` to a private environment file. Inject it using a supervisor or Node's `--env-file`:

```sh
docker pull node:22-alpine
node --env-file=/etc/jojo/runtime.env server/runtime/server.cjs
```

Builds use unprivileged, resource-limited containers, a read-only root filesystem and no network during build. Dependency installation ignores package lifecycle scripts. Caller npm configuration and locks are discarded to reject URL/file/git dependencies; only registry semver dependencies are supported. Pin dependency versions for reproducibility. Native modules requiring installation scripts and monorepo workspaces need a separately reviewed build profile. Builds expire after three minutes per command; project limits are 1,500 entries, 30 MiB total and 5 MiB per file. ZIP uploads are limited to 20 MiB compressed. The text editor opens files up to 512 KiB; larger files remain exportable.

Expose port 8790 through a separate hosting domain, not beneath the studio's cookie domain. Point wildcard DNS to the worker. A Caddy example is provided. Its on-demand TLS permission endpoint only permits existing project subdomains or verified custom domains. Protect/control rate and certificate issuance at the proxy. Back up `sites.json` and published revisions; rotate finished job metadata when the 1,000-job history limit is reached.

## Real Android

On a dedicated Linux worker with hardware virtualization:

```sh
test -r /dev/kvm
bash server/android/install.sh
node --env-file=/etc/jojo/android.env server/android/server.cjs
```

The installer downloads the actual multi-gigabyte Android emulator image, not a screenshot. Allow adequate disk/RAM and KVM access. Sessions use 3 GiB / 2 CPUs, expire after 30 minutes and are isolated by studio user/project. APK installation accepts up to 25 MiB. Never mount financial files, Docker socket, or extra host devices inside emulator containers. Review image updates and pin reviewed digests in production.

Proxy the viewer on the studio origin at `/android/` using `deploy/android-nginx.conf.example`; preserve WebSocket upgrades. `ANDROID_PUBLIC_ORIGIN` must match on both app and worker. Stream tickets are short-lived; viewing sets a scoped HttpOnly cookie. Private control traffic always requires the runner token.

This development environment does not expose `/dev/kvm`. Installation/ADB streaming code is present, but a live emulator boot must be verified on the selected KVM host. No Android image was booted here.

## Project databases

`PROJECT_DATABASE_ADMIN_URL` must point to a dedicated cluster containing no CashPay data. The provisioner requires CREATE ROLE / CREATE DATABASE privileges. It generates scoped names, non-superuser roles, connection limits and five-second SQL limits. Audit/revoke PUBLIC access to other databases in that cluster and limit its network exposure. SQL runs as the project's own role, never as the provisioner. The console returns at most 100 rows. Do not embed database passwords or AI/GitHub keys in frontend code. Production applications needing database-backed endpoints require a separately deployed backend; static hosting alone does not provide one.

## Verification

`npm test` verifies path restrictions, archive binary/executable preservation, symlink rejection and encrypted credential integrity. Build/type checks must pass. Live GitHub OAuth, model output, public DNS/TLS and Android boot require operator configuration and real integration credentials; they are not asserted by unit tests.

Project deletion does not automatically destroy published sites or external databases. Database-backed projects reject deletion until operator cleanup. Hosted revisions remain on the hosting worker until explicitly removed by the operator; include that cleanup in account closure procedures.


## OpenAI coding, image generation and personal keys

Only `https://api.openai.com` is used for model requests. Set `OPENAI_API_KEY`, `OPENAI_CODEX_MODEL` and `OPENAI_IMAGE_MODEL`. Select available coding/Responses and transparent-PNG image models in your OpenAI project; no outdated model name is silently assumed. The former Gemini/Genkit engines and prototype local-store data have been removed. Code generation uses Responses API streaming with bounded output and a 90-second timeout. Logo generation uses the Images API with a 120-second timeout. Nginx must allow at least 300 seconds when generating and integrating a logo in one request.

Users may save/delete their personal OpenAI API key in **Outils / OpenAI**. Keys are encrypted server-side and never returned by the metadata endpoint. A personal key overrides the shared key for that user. Saving only verifies format; permissions/quota/model access are verified on the first real request. This is API billing, not reuse of a ChatGPT session or an included ChatGPT/Codex subscription. No passwords, browser cookies, or unofficial subscription proxying are supported.

During coding, progress is derived from actual OpenAI stream events. The interface shows received character counts and proposed file paths, not fictional execution steps. No incomplete code is written to the workspace. Completed proposals can be approved individually or all together. Bulk approval is transactional: a stale/conflicting file rolls the whole batch back. Optional automatic approval applies completed batches only after the user explicitly enables it; dirty editor buffers remain intact. Earlier completed proposals can be approved while a new request is generating. Binary PNG proposals render as image previews and remain reviewable.

The logo tool requests a transparent PNG, validates dimensions/size, trims transparent margins and proposes its integration into existing code. It neither downloads arbitrary image URLs nor treats a model response as executable commands. Each project retains its own GitHub connection, source and pending changes. Generic Android and React starters are driven by the project brief; music/video/streaming/finance are domains, not a forced financial template. This is not a full autonomous Codex CLI runtime: code execution stays in the separate worker, and arbitrary MCP/IDE plugins are not installed.

Official references: [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create), [image generation](https://developers.openai.com/api/docs/guides/image-generation), [Codex SDK](https://developers.openai.com/codex/sdk/), [model deprecations](https://developers.openai.com/api/docs/deprecations). Check model availability for your API account before deployment.

## GitHub synchronization

OAuth users can browse their repositories, import a branch, pull its latest revision and publish actual commits. Pull compares the imported commit, saved local snapshot and remote snapshot. Independent changes and non-conflicting deletions merge; divergent edits or edit/delete conflicts list the affected paths and write nothing. A second comparison under a project lock rejects a workspace changed during download. Concurrent Git operations on a project are serialized. Unsaved editor buffers block sync in the UI and remain protected if the user navigates during an operation. No forced push, embedded user repository scripts, or arbitrary Git-host URL is executed.

## Additional tests

`npm run test:credits` requires `JOJO_TEST_DATABASE_URL` pointing to an isolated migrated PostgreSQL fixture. It verifies five daily credits, concurrency/idempotency, no same-day refill, own-key separation and exactly-once refunds. Do not point this test at production. `npm test` also covers three-way merge conflicts, OpenAI request/stream handling, interrupted streams and alpha-based PNG cropping. Actual paid model calls are not part of the tests.

Legacy pending proposals created before baseline hashes were added must be rejected/regenerated before approval; this prevents an unversioned proposal from overwriting newer files.
