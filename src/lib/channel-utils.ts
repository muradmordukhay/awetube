/**
 * Channel handle generation.
 *
 * Creates URL-safe handles from display names (lowercase alphanumeric, max 20 chars).
 * Appends incrementing counter if taken (e.g., "johndoe", "johndoe1", "johndoe2").
 *
 * Called during user registration.
 */
import { db } from "@/lib/db";

export async function generateUniqueHandle(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);

  const handle = base || "user";
  let uniqueHandle = handle;
  let counter = 1;

  while (await db.channel.findUnique({ where: { handle: uniqueHandle } })) {
    uniqueHandle = `${handle}${counter}`;
    counter++;
  }

  return uniqueHandle;
}
