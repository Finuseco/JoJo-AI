
## Developer session handoff and supplied owl brand — 2026-11-20

Both production builds passed. Sixteen contract tests include browser challenge, audience, role, expiry and signature rejection. A Chromium test with two local Next processes, an isolated PostgreSQL schema and test-only HTTPS proxy verified: an existing portal-only HttpOnly session enters AI via the portal menu without any shared-domain cookie; AI shows the fixture developer name; other users' projects stay hidden; an empty account creates a project, enters the IDE and returns to the project list; consumed code replay is refused; a direct mobile visit silently recovers the portal session with no horizontal overflow; anonymous users settle on sign-in without a redirect loop. TLS fixtures and authentication fixtures are local tests, not production credentials. Production DNS and deployment were not changed.

The owl artwork supplied by the user was converted to PNG, not regenerated. The dashboard, IDE, loading screen, portal entry and favicon use it. Solid application backgrounds remain; motion is disabled with prefers-reduced-motion. Portal TypeScript still reports unrelated pre-existing modules; no new handoff module errors were reported.

## AI-only session repair — 2026-11-20

Production build and TypeScript passed; 18 contract tests passed. A configuration fixture verifies repair does not change any portal file, preserves existing OpenAI/encryption credentials, writes protected backups and overrides stale PM2 signing/database settings. Browser/PostgreSQL checks repeat the portal handoff, then drop the daily quota table: the named account and profile photo remain visible, the session API returns 200 with creditsAvailable=false, and entering a project name enables creation. After restoring quota storage, actual project creation and IDE opening pass. A stale local cookie is also tested with a valid shared cookie. Production server state has not been inspected or changed.

## Existing 22-character developer secret — 2026-11-20

The server diagnostic reported an existing 22-character DEV_PORTAL_JWT_SECRET. The repair and verification paths previously required 32 characters and therefore rejected it before deployment. Repair now copies the existing key and pins its SHA-256 fingerprint; unpinned short keys are rejected. The portal handoff's length check accepts the existing key without changing portal accounts or environment values. Nineteen contract tests cover legacy compatibility, wrong-key/role/expiry rejection and preserving the portal files. Both application builds pass. No real signing key was received or printed.
