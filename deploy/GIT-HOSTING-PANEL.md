# Git synchronisation and separate hosting panel

Fetched origin before changes on 2026-11-28; latest remote was 8abdd3e.

GitHub / ZIP now compares the linked baseline, saved local files and current
remote branch. The review shows commit message/SHA/committer date, checked date,
added/modified/deleted paths and conflicts. A selected target branch can be
reviewed and pulled; a conflict-free pull changes the linked branch. Changes on
other branches are not silently imported. “No change” identifies the compared
branch and SHA. No forced push. Confirmation checks the reviewed remote SHA and
local digest again, so stale reviews cannot silently publish another snapshot.

Push now emits Git tree deletion entries for deleted importable tracked paths.
Excluded repository paths (secrets, generated files etc.) remain untouched.
Existing three-way merge and local edit protection remain. Unsaved editor files
must be saved first. Git API calls use the connected user's credentials.

Commands in GitHub panel: git status/diff/fetch perform the real comparison;
git log refreshes history; git pull/push open review and require confirmation.
The npm terminal routes Git commands to that panel. This is an API-backed Git
command interface, not a general-purpose shell. The assistant reads current
commit metadata when GitHub/Git/commit is requested; it cannot claim to pull or
push autonomously. User approval in the panel is still needed.

Separate authenticated panel: /hosting/PROJECT_ID. It reuses HostingManager,
StudioTerminal and DatabaseManager rather than duplicating their services.
Published-file inventory is read from the worker's current immutable artifact,
with tenant ownership enforced. It is not a second editable source tree.
A DNS-verified custom domain/subdomain can be selected for the project WebView.
The preview API uses that domain's HTTPS URL. DNS verification does not prove
that TLS has been provisioned: the existing TLS proxy remains necessary.

No registrar credit is needed for GitHub import or external-domain DNS pointing.
External DNS remains with the user's current provider. TXT ownership + A pointing
is still required, and existing MX records are not changed. A registrar transfer
is a separate, potentially paid operation. Complete DNS-zone editing, registrar
transfers/purchases, mailbox provisioning, recurring billing and arbitrary SSR
hosting are NOT implemented by this change. The mail panel states this explicitly.
No fake quotas, certificates or mailbox-success responses are returned.

No new dependency or database migration. Restart the existing runtime worker
along with Next.js to use /v1/site-files and primary-domain selection. There are
no new secrets beyond the existing GitHub OAuth/runtime settings.

Validation: npm test, npm run build and node --check server/runtime/server.cjs
passed. node tests/hosting-smoke.cjs passed against a real temporary static worker:
publication, inventory, tenant separation and unverified-domain rejection.
Live user GitHub OAuth push/pull, public DNS propagation, VPS TLS issuance and
mail services were not exercised in this workspace.
