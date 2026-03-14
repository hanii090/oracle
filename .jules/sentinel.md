## 2024-05-24 - [Add IP Sanitization]
**Vulnerability:** Client IPs extracted from the `x-forwarded-for` header in API routes (`checkout`, `self-referral`, `therapist/dashboard`) were being used directly for rate limiting and audit logging without any sanitization.
**Learning:** `req.headers.get('x-forwarded-for')` can be easily spoofed by malicious clients. Storing this directly allows for log injection and potential rate limit bypasses.
**Prevention:** Use a dedicated validation function (e.g., `sanitizeIp` in `lib/safety.ts`) to ensure the input strictly conforms to expected IPv4 or IPv6 formats before using it as a cache key or storing it in the database.
