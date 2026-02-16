# Acceptance Criteria

## Passwordless Auth
- Requesting a sign-in link with a valid email returns 200 and sends an email link.
- Sign-in links expire after 1 hour and cannot be reused.
- First-time sign-ins auto-create a user and channel, then require display name completion.
- Completing the display name updates both user and channel names and clears the completion prompt.

## Production Readiness
- Content Security Policy allows the Qencode player script without broad wildcard access.
- Qencode player license is injected at runtime and playback works in production.
- Missing `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_QENCODE_PLAYER_LICENSE` fails fast on startup.
