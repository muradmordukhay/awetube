export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function deriveDisplayName(email: string): string {
  const localPart = email.split("@")[0] || "user";
  const cleaned = localPart.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  const base = cleaned.length > 0 ? cleaned : "user";
  const titled = toTitleCase(base);
  return titled.slice(0, 100);
}
