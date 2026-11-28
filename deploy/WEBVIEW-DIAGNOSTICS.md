# WebView diagnostics and repair workflow

The preview API previously converted every exception (including database/schema
failures) into HTTP 403 “Aperçu privé ou projet introuvable”. It now distinguishes
invalid ID (400), missing project (404), actual access denial (403) and unexpected
service failure (503, safe message plus correlation reference). Public projects
still bypass membership requirements; private previews retain access checks.

For members, unpublished previews report worker availability and last job state.
The public preview never exposes internal job diagnostics. Build-required pages
explain that public visibility does not compile/publish code. Existing published
artifacts remain available when a later build fails; the studio shows the latest
task separately. A retry button reloads the preview.

The studio WebView inspects preview/runtime responses and offers a diagnostic
shortcut. Terminal jobs offer a correction shortcut with command/status/error and
the last 14,000 characters of real logs. Both prefill chat, without a hidden paid
request or automatic file overwrite. User reviews and sends the diagnostic, then
accepts proposed edits in Modifications, or edits source manually, and recompiles
and publishes. Logs are untrusted data; users should review them before sending.
Cross-origin browser errors/HTTPS failures cannot be inspected inside third-party
published frames; the panel provides the published URL for direct diagnosis.

No dependency, environment variable or database migration added.
Validation: typecheck and contract tests cover public access without login,
private denial, missing projects, database failures, unreachable workers and
verified custom preview URLs. Production build also checked.
The user's News project and VPS were not accessible in this workspace; its exact
failure must be confirmed from the new diagnostic and real build log.
