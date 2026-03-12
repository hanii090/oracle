## 2024-05-24 - [HIGH] Fix IP Spoofing vulnerability in rate limiting and logging
**Vulnerability:** Client IP addresses extracted directly from `x-forwarded-for` headers without sanitization. This is vulnerable to spoofing.
**Learning:** Malicious actors could bypass rate limits or inject log lines by passing manipulated values into the `x-forwarded-for` header, which was previously being used unsanitized in rate limits (`app/api/checkout/route.ts`, `app/api/self-referral/route.ts`) and audit logging (`app/api/therapist/dashboard/route.ts`).
**Prevention:** Use the `sanitizeIp` utility located in `@/lib/safety` to sanitize IP addresses extracted from `x-forwarded-for` headers before use.
