
## Developer session handoff and supplied owl brand — 2026-11-20

Both production builds passed. Sixteen contract tests include browser challenge, audience, role, expiry and signature rejection. A Chromium test with two local Next processes, an isolated PostgreSQL schema and test-only HTTPS proxy verified: an existing portal-only HttpOnly session enters AI via the portal menu without any shared-domain cookie; AI shows the fixture developer name; other users' projects stay hidden; an empty account creates a project, enters the IDE and returns to the project list; consumed code replay is refused; a direct mobile visit silently recovers the portal session with no horizontal overflow; anonymous users settle on sign-in without a redirect loop. TLS fixtures and authentication fixtures are local tests, not production credentials. Production DNS and deployment were not changed.

The owl artwork supplied by the user was converted to PNG, not regenerated. The dashboard, IDE, loading screen, portal entry and favicon use it. Solid application backgrounds remain; motion is disabled with prefers-reduced-motion. Portal TypeScript still reports unrelated pre-existing modules; no new handoff module errors were reported.

## AI-only session repair — 2026-11-20

Production build and TypeScript passed; 18 contract tests passed. A configuration fixture verifies repair does not change any portal file, preserves existing OpenAI/encryption credentials, writes protected backups and overrides stale PM2 signing/database settings. Browser/PostgreSQL checks repeat the portal handoff, then drop the daily quota table: the named account and profile photo remain visible, the session API returns 200 with creditsAvailable=false, and entering a project name enables creation. After restoring quota storage, actual project creation and IDE opening pass. A stale local cookie is also tested with a valid shared cookie. Production server state has not been inspected or changed.

## Existing 22-character developer secret — 2026-11-20

The server diagnostic reported an existing 22-character DEV_PORTAL_JWT_SECRET. The repair and verification paths previously required 32 characters and therefore rejected it before deployment. Repair now copies the existing key and pins its SHA-256 fingerprint; unpinned short keys are rejected. The portal handoff's length check accepts the existing key without changing portal accounts or environment values. Nineteen contract tests cover legacy compatibility, wrong-key/role/expiry rejection and preserving the portal files. Both application builds pass. No real signing key was received or printed.

## Mobile dashboard and project navigation — 2026-11-20

Production build and TypeScript passed. Browser tests at 320, 360, 390 and 768px verified no horizontal overflow, projects heading above 650px, account menu opening, project creation dialog within viewport, actual project creation and IDE opening, four primary project navigation actions, project menu and project switch control access, and return to the new project card. Desktop creation at 1440px and existing authentication/tenant-isolation browser checks also passed. Mobile keeps the same solid colors and supplied logo. Account details and less-used IDE commands remain accessible in dialogs rather than wrapping across the header. No deployment or database changes are required for this UI update.

## Lightweight JoJo AI showcase — 2026-11-20

The root URL serves public/showcase/index.html with its own local CSS and JavaScript. Combined HTML/CSS/JS is approximately 34.5 KB uncompressed, excluding the cached supplied PNG logo. Browser checks confirmed no Next client bundle or API request on the showcase, no horizontal overflow at 320/390/768/1440px, working FR/EN selection, mobile menu, native FAQ and /dashboard entry links. Core content and entry links remain available without JavaScript. Animations honor reduced-motion. The actual dashboard moved to /dashboard; /workspace/:id still opens the same IDE. Signed portal callbacks now enter /dashboard and old root auth-error URLs redirect there. Both the existing desktop project flow and mobile creation/IDE flows passed after the move, including authentication, tenant isolation and anonymous recovery. Production build and all 19 contract tests passed. The Electron source opens /dashboard; no new Windows binary was built in this change.
