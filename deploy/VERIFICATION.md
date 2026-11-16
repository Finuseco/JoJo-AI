# Verification performed for this branch

- Next.js production build and TypeScript validation passed.
- Four automated contract tests passed: unsafe paths, ZIP binary and executable preservation, symlink rejection, encrypted token tampering/wrong-key rejection.
- Actual Docker Node 22 job installed dependencies, built a static application and served the generated HTML through the hosting worker. Anonymous control requests were refused and another user's job list was empty. Re-run with `npm run test:runtime` (Docker required; loopback ports 18990/18991 must be free).
- An isolated PostgreSQL 16 fixture accepted the migration. A real project role/database was provisioned, CREATE/INSERT/SELECT executed, results limited to 100 rows and access with another project ID refused. Test resources were deleted.
- The running Next.js app denied private ZIP access to anonymous and foreign users; its owner downloaded a valid ZIP.
- Chromium opened the authenticated studio at 360px and 1440px without browser exceptions or horizontal document overflow.
- Android boot, GitHub OAuth/push, model generation and public-domain TLS were not exercised live: they require operator configuration; Android additionally needs /dev/kvm, unavailable here.


## OpenAI-only / 8095 update

- Nine contract tests cover the previous archive/security contracts, conservative Git three-way merges, OpenAI-only selection, bounded Responses requests/streams, incomplete-stream rejection and transparent PNG trimming.
- The daily ledger was tested on actual PostgreSQL: 100 tasks exhaust the daily grant; duplicate concurrent request IDs charge once; repeated refunds restore once; same-day reconnect cannot refill; personal API-key tasks do not use shared credits.
- The studio was started at 127.0.0.1:8095. Chromium checked the new OpenAI/tools screen at 360px and 1440px, encrypted personal-key save/delete and metadata without the key.
- No paid OpenAI code/image call or live GitHub OAuth/push was performed. Provider/model credentials remain deployment requirements. KVM is still unavailable here, so Android boot is not claimed.
- Nginx successfully validated the 8095 upstream configuration with `nginx -t` in an isolated nginx:alpine container.
- Authenticated studio routes actually imported the public octocat/Hello-World repository and confirmed an unchanged pull. No remote repository was modified. Local test networking required Node's HTTPS proxy support.
- PostgreSQL also verified transactional batch approval: one stale file prevented all changes; a valid batch preserved its binary PNG exactly.

## Terminal / WebView update

- Eleven contract tests include npm command/flag injection rejection and public preview reference filtering/relative resource resolution.
- Actual Docker tests verify custom npm scripts, logs received before completion, installing a real registry package with manifest proposals, cross-user cancellation rejection and actual cancellation.
- Authenticated Next.js + PostgreSQL + worker browser tests at 360px/1440px cover every studio menu, WebView CSS rendering, explicit public activation and anonymous viewing, private ZIP rejection and collaborator execution denial.
- An actual package installation was proposed exactly once, approved through the UI and saved in the project; rebuilding/publication made the stable preview API resolve the published site's URL. Public DNS/TLS transport was not asserted by the local test.
