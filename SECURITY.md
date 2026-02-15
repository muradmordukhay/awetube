# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in AweTube, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please use [GitHub's private vulnerability reporting](../../security/advisories/new) to submit your report. This ensures the issue is handled confidentially.

In your report, please include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

We will acknowledge your report within 48 hours and work with you to understand and address the issue.

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | Yes       |

## Security Measures

AweTube implements the following security practices:

- **Authentication** — NextAuth v5 with JWT strategy, bcrypt password hashing (12 rounds)
- **Security Headers Middleware** (`src/middleware.ts`) — Applied to all non-static routes:
  - Content-Security-Policy (restricts script/style/img/media/connect/frame sources)
  - X-Frame-Options: DENY (prevents clickjacking)
  - X-Content-Type-Options: nosniff (prevents MIME sniffing)
  - Strict-Transport-Security: 2-year max-age with includeSubDomains and preload
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=() (disables device APIs)
- **Input Validation** — All API inputs validated with Zod v4 schemas (`src/lib/validation.ts`)
- **Rate Limiting** — 6 named limiters with endpoint-specific windows (auth: 10/15min, upload: 20/hr, search: 30/min, api: 60/min, passwordReset: 3/15min, callback: 100/min)
- **HMAC Callback Verification** — Qencode callbacks signed with HMAC-SHA256 using `CALLBACK_SIGNING_SECRET`, verified with timing-safe `crypto.timingSafeEqual` comparison
- **Callback Replay Protection** — HMAC payload includes Unix timestamp; callbacks older than 5 minutes are rejected. Legacy non-timestamped functions are deprecated.
- **Environment Validation** — `src/lib/env.ts` validates all required env vars at startup with Zod. App fails fast with clear error messages if any are missing.
- **CSRF Protection** — Handled by NextAuth (SameSite cookies + same-origin requests)
- **Authorization** — Resource ownership checks on all mutating endpoints
- **Secret Scanning** — gitleaks pre-commit hook + CI workflow prevents accidental secret commits
