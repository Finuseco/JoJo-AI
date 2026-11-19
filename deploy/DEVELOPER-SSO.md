# Developer browser SSO

The developer portal and studio use the same PostgreSQL developer identity and HS256 signing secret. The studio verifies the signature, expiry and Developer role, then loads the user from dev_portal_users. No browser-supplied profile is trusted.

On the developer portal, set DEV_PORTAL_SSO_COOKIE_DOMAIN=cashpay-all.com. On JoJo AI, set JOJO_AUTH_JWT_SECRET to the portal's DEV_PORTAL_JWT_SECRET (not its main wallet JWT_SECRET). Both must point to the same developer database. Rebuild and restart both applications.

Sign in again once on the developer portal, through OTP or Google, to issue the shared __Secure-cp_developer_sso cookie. Existing host-only sessions cannot retroactively issue it. Then open https://ai.cashpay-all.com in the same browser. No token URL or localStorage copy is needed. Portal logout clears the shared cookie; its JWT otherwise expires after seven days. Already loaded studio pages refresh their authentication on the next request.

The shared cookie is HttpOnly, Secure, SameSite=Lax, Path=/, Domain=cashpay-all.com. Enable this only if every subdomain is trusted: domain cookies are also sent to other HTTPS subdomains. Do not host untrusted project previews under cashpay-all.com; use a separate registrable domain for user-generated sites. Windows uses its own browser session and must sign in there; it does not inherit the system browser's cookies.
