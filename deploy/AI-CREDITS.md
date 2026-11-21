# Purchased AI credits

The developer portal /dev/dashboard/ai-credits handles purchases. The confirmed rate is 2 USD = 100 credits, defaulting to 50 credits per USD. Set JOJO_CREDITS_PER_USD=50 in the developer portal. Invalid pricing disables purchases. Apply the portal migration 20261119_ai_credit_purchase.sql or run the studio migrations against the same database first.

A linked fleet wallet, configured SMTP, owner email OTP and fleet PIN are required. OTP is bound to the developer ID, USD amount and configured rate. A transaction locks the developer link, wallet and OTP, conditionally debits sufficient USD funds, adds purchased units, records a Completed B2B_AI transaction, and consumes the OTP. Failure rolls everything back. Replaying a consumed OTP cannot debit again. No payment success is taken from a redirect. Funding the fleet remains a separate existing payment flow.

The studio reads jojo_ai_credits by authenticated developer ID; free daily grants are separate. Balance refreshes every 30 seconds and on focus. The return link permits only the exact studio HTTPS origin and root or numeric workspace paths, without token/query credentials.

Current generation billing is still one credit per successful shared-account generation, refunded on failure. Token/model-dependent settlement is not implemented by this purchase change and must not be advertised as usage-based billing. Personal OpenAI keys use their own provider billing. Live financial and SMTP verification is required on a controlled account before enabling the purchase rate in production.

Routes: GET https://ai.cashpay-all.com/api/v1/session authenticates the studio session; GET https://ai.cashpay-all.com/api/v1/credits reads daily and purchased quotas. GET https://developer.cashpay-all.com/api/dev/ai-credits reads purchased balance and pricing. POST on that same portal URL accepts {"action":"request-otp","amount":2}, then {"action":"confirm","amount":2,"otp":"...","pin":"..."}. Requests require developer session and the exact developer Origin. No financial action is allowed by GET. Amounts and units are calculated on the server.
