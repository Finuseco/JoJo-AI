# Domain Name API — JoJo AI

Integration added after fetching origin on 2026-11-28. Claude's homepage (1ea838b)
and WebView (5fc7d26) changes are included. Existing runtime/domain routing reused.
No new dependency, database migration, worker or production service installed.

## Configuration

Create a top-level reseller account at https://www.domainnameapi.com/ and obtain
its production API key and reseller GUID from API settings. Sub-reseller
credentials cannot call this API directly. In JoJo AI's existing `.env.local`:

```dotenv
DOMAIN_API_KEY=your_production_key
DOMAIN_API_RESELLER_ID=your_reseller_guid
```

Neither variable may have NEXT_PUBLIC_ prefix. The client calls the authenticated
JoJo route `/api/domains/search`; only the server sends credentials upstream.
The live endpoint is fixed at https://api.domainresellerapi.com/api/v1/domains/bulk-search.
No test registry or simulated fallback is used. No secret is returned to clients.

## Delivered behavior

Optional search during creation and in Hosting. Bare names check com/net/fr;
full names check their specified extension. Matches are joined by domainName,
not position. Missing, duplicated or unrecognised results are UNKNOWN, never
AVAILABLE. HTTP/auth/timeout/429 failures are visible; no automatic retries.
A per-process bounded guard limits bursts; the provider remains authoritative
across multiple PM2 processes. There is no availability guarantee after search.
Selection prefills Hosting during the newly created project session only;
it is not a reservation or a permanent domain assignment. Connecting a domain
requires owning it, publishing a site, then completing the existing DNS check.

## Existing hosting configuration — keep current values

Next.js already uses RUNTIME_RUNNER_URL and RUNTIME_RUNNER_TOKEN.
The existing runtime worker uses HOSTING_BASE_DOMAIN and HOSTING_PUBLIC_IP.
These are hosting settings, not registrar API secrets. Domains and subdomains
use the existing A + _jojo-verify TXT workflow. Verified domains route to the
published artifact. HTTPS still requires the deployed TLS proxy (see
Caddyfile.example), reachable DNS and ports. Adding registrar keys cannot install
or start a hosting worker/proxy. This checkout hosts static builds, not arbitrary
Node/Next SSR servers. VPS deployment and live DNS/TLS were not tested here.

## Not yet available: purchases, transfers, renewals

API credentials enable search only, NOT a checkout. No customer payment for
domains exists in this repo (the AI-credit purchase link is not such a payment).
No registrar debit is made. Paid lifecycle requires verified payment callbacks,
order storage/idempotency/reconciliation, registrant contact collection, current
TLD rules/prices, renewal consent and document/verification follow-up. Merely
adding a key cannot safely supply those missing application workflows.
Never retry ambiguous paid requests, including registry-success/local-record
failures 10058/10059/10060. Provider support needs correlation ID and trace ID.
Do not infer active registration from HTTP 200; inspect actual status.

## Official documentation consulted

- https://www.domainnameapi.com/docs/
- https://www.domainnameapi.com/docs/getting-started/authentication/
- https://www.domainnameapi.com/docs/getting-started/requests-and-responses/
- https://www.domainnameapi.com/docs/getting-started/rate-limits/
- https://www.domainnameapi.com/docs/domains/availability/
- https://www.domainnameapi.com/docs/domains/register/
- https://www.domainnameapi.com/docs/catalogue/
- https://www.domainnameapi.com/docs/reference/errors/

Search sends a JSON array and X-API-KEY, __reseller, X-Correlation-ID headers.
Top-level bulk success is not per-domain success. Authentication errors can be
plain text; 429 may have an empty body and Retry-After. Response size is bounded
and timeout is 20 seconds to accommodate the provider's quota delays.

Live authenticated search needs the user's credentials; none were available
in this workspace. Unit/browser fixture checks do not validate the live account.

## Local validation 2026-11-28

`npm test` and `npm run build` passed. Headless Chromium mobile check confirmed
project creation remains enabled with a name and no domain/provider, technology
icons load, and the page has no horizontal overflow. Session data was a test-only
fixture; the search status used the real unauthenticated API (no availability
fabricated). Existing WebView browser regression passed home → nested page → home.
No registrar account, payment, domain registration or VPS deployment was exercised.

## Public homepage search and prices (2026-11-28)

`/api/public/domains/search` exposes availability to anonymous visitors through
server-side credentials, same-origin POST, bounded body/response sizes and a
shared five-second public cooldown per process. The existing provider limits
remain authoritative with multiple PM2 workers. The homepage and studio use the
same live result normalizer. No static TLD price list or simulated fallback.

Displayed registration price = API `price` × 1.15, rounded to the nearest cent.
The actual `currency` and `period` are retained (the term is not assumed annual).
USD/EUR/TRY/GBP quotes are supported; missing/invalid values or another currency
produce “Prix indisponible”, never an invented conversion. Taken domains have
no registration offer. Premium/document flags remain visible.

The provider documents `price` as a selling quote which may already include
account-side margin. JoJo adds the requested 15% on top of that received value;
check the reseller panel's price settings to avoid an unintended second margin.
No renewal, tax or hosting amount is inferred from this registration quote.
Checkout is still not enabled; the interface explicitly says so.

The same two existing variables suffice: DOMAIN_API_KEY and
DOMAIN_API_RESELLER_ID. No new secret, dependency, database migration or worker.
Live account prices cannot be validated until production credentials are supplied.

Validation of homepage addition: npm test and npm run build passed. Chromium
390px check used the real public route without credentials: HTTP 503, explicit
unconfigured message, no result/price cards, no horizontal overflow. Foreign
Origin POST returned 403. Retail tests cover 15% rounding, duration preservation,
invalid/missing quotes and taken domains. No authenticated live quote was tested.
