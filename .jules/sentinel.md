## 2024-05-24 - [Add IP Sanitization]
**Vulnerability:** Client IPs extracted from the `x-forwarded-for` header in API routes (`checkout`, `self-referral`, `therapist/dashboard`) were being used directly for rate limiting and audit logging without any sanitization.
**Learning:** `req.headers.get('x-forwarded-for')` can be easily spoofed by malicious clients. Storing this directly allows for log injection and potential rate limit bypasses.
**Prevention:** Use a dedicated validation function (e.g., `sanitizeIp` in `lib/safety.ts`) to ensure the input strictly conforms to expected IPv4 or IPv6 formats before using it as a cache key or storing it in the database.

## 2025-05-18 - Timing Attack Vulnerability in CRON endpoints
**Vulnerability:** Timing attack vulnerability due to insecure string comparison of `CRON_SECRET` using `!==`.
**Learning:** Checking the authorization header of incoming webhooks or cron jobs with simple equality operators (`===` or `!==`) exposes the endpoint to timing attacks. Attackers can incrementally guess the secret by measuring the time it takes for the comparison to fail.
**Prevention:** Always use `crypto.timingSafeEqual` to verify the `authorization` header against the expected string when dealing with `process.env.CRON_SECRET` or any other secret token comparison. Ensure the strings are converted to `Buffer` objects of identical length before comparing.
