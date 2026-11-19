# Unified deployment verification

The web and every API route are in the same Next.js application listening on 127.0.0.1:8095. No secondary API process, internal API proxy, or cross-service environment is required.

- Production build and TypeScript pass with the pages and API routes in one output.
- Fourteen contract tests pass (workspace/archives/crypto/OpenAI stream/PNG/Git/npm/Electron policy/preview filtering).
- A real PostgreSQL fixture and a single application process verify file create/read/save/rename/delete, stale revisions and destination conflicts, tenant isolation, session cookie handoff and truthful SSE provider-configuration errors.
- Chromium verifies desktop Monaco/mobile tactile editing, actual saves, reloadable workspace routes, palette and terminal at 1440px and 390px, using this one application server.
- Nginx's unified configuration has one upstream destination (8095) for all pages and API routes.

The existing Electron client still opens https://ai.cashpay-all.com; no local Windows backend is added. Its previously generated Windows portable remains unsigned and untested on a native Windows host. Production deployment, paid model calls, OAuth/SSO end-to-end account setup and real KVM boot are not asserted by local fixture tests.
