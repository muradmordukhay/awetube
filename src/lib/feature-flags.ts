function parseBooleanFlag(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) return defaultValue;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return defaultValue;
}

export const featureFlags = {
  authEmailLinks: parseBooleanFlag(process.env.FF_AUTH_EMAIL_LINKS, true),
  authPasswordlessOnly: parseBooleanFlag(
    process.env.FF_AUTH_PASSWORDLESS_ONLY,
    true
  ),
  authRateLimit: parseBooleanFlag(process.env.FF_AUTH_RATE_LIMIT, true),
  profileCompletion: parseBooleanFlag(
    process.env.FF_PROFILE_COMPLETION,
    true
  ),
};
