# Production readiness audit — 2026-11-19

## Implemented and testable

- Authenticated, tenant-scoped API v1 and web in ONE Next.js application; public endpoint ai.cashpay-all.com and a single private application listener on 8095.
- Actual PostgreSQL workspace files; create/save/rename/delete with revisions and HTTP 409 conflicts. No default demo workspace.
- Monaco editing/diff, local workers, resizable desktop panes, mobile drawer, searchable files/commands, save/close controls.
- OpenAI Responses streaming of actual proposed text/file snippets, persisted completed chat, reviewed/bulk application and real daily-credit ledger.
- Existing GitHub imports/pull/push, ZIP export, npm worker and WebView contracts preserved in the unified application API.
- Actual Electron Windows portable packaging, sandboxed renderer and explicit native menu bridge. No .NET/Java runtime is needed for this client shell.

## Still required / not claimed

- Live paid OpenAI code/image generation, private GitHub OAuth/push and production SMTP depend on actual account credentials. Test fixtures verify contracts, not paid provider availability.
- The coding engine does not yet autonomously call tools, read arbitrary context, run tests, inspect results and retry like the full Codex product. It proposes files, then approved tools execute separately.
- Long-running generation needs a dedicated queue/cancellation/recovery design beyond current reserved-credit reconciliation; request disconnects may complete server-side.
- Real Android boot needs /dev/kvm. Native Android APK builds/signing and Windows builds of user-generated projects need separate SDK workers. Editor highlighting is not compilation.
- User applications requiring server-side execution/SSR are not hosted by the static publishing worker.
- Windows signing/installer/update distribution and actual Windows runtime tests remain release work. The portable binary is built, not certified or installed on a user's PC.
- Arbitrary IDE/MCP plugins, extension isolation, full multi-user live editing, robust git conflict editing and per-project secret management are not implemented.
- Production deployment still requires DNS/TLS, backups/restores, worker network isolation, resource monitoring and operator configuration. No real infrastructure status is fabricated.

ChatGPT/API billing remains separate. Eligible subscription API-credit benefits must be activated with OpenAI; they are not implemented by stealing/reusing ChatGPT cookies. Keys and account credits are configured only through the actual API account.

References: https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform ; https://help.openai.com/en/articles/20001626-api-credits-benefit-for-eligible-chatgpt-subscriptions ; https://www.electronjs.org/docs/latest/tutorial/security .
