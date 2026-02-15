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
- **Input Validation** — All API inputs validated with Zod schemas
- **Rate Limiting** — All API endpoints are rate-limited
- **HMAC Verification** — External callbacks verified with timing-safe signature comparison
- **CSRF Protection** — Handled by NextAuth
- **Authorization** — Resource ownership checks on all mutating endpoints
