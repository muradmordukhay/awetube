/**
 * NextAuth JWT callback — extracted for testability.
 *
 * Populates custom claims on initial sign-in (`user` present) and
 * refreshes them from DB when `session.update()` is called by the client
 * (`trigger === "update"`), e.g. after profile completion.
 */
import { db } from "@/lib/db";
import { featureFlags } from "@/lib/feature-flags";

export async function jwtCallback({
  token,
  user,
  trigger,
}: {
  token: Record<string, unknown>;
  user?: Record<string, unknown>;
  trigger?: string;
}): Promise<Record<string, unknown>> {
  if (user) {
    token.id = user.id;
    token.channelId = user.channelId ?? null;
    token.channelHandle = user.channelHandle ?? null;
    token.needsDisplayName = user.needsDisplayName ?? false;
  }

  // When session.update() is called (e.g. after profile completion),
  // re-fetch the user from DB to pick up changes like needsDisplayName.
  if (trigger === "update" && token.id) {
    const dbUser = await db.user.findUnique({
      where: { id: token.id as string },
      include: { channel: true },
    });
    if (dbUser) {
      token.needsDisplayName = featureFlags.profileCompletion
        ? dbUser.needsDisplayName
        : false;
      token.channelId = dbUser.channel?.id ?? null;
      token.channelHandle = dbUser.channel?.handle ?? null;
    }
  }

  return token;
}
