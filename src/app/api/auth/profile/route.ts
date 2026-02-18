import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { displayNameSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { featureFlags } from "@/lib/feature-flags";
import { logger } from "@/lib/logger";

export async function PATCH(req: Request) {
  try {
    if (!featureFlags.profileCompletion) {
      return NextResponse.json(
        { error: "Feature not available" },
        { status: 403 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = parseBody(displayNameSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { displayName } = parsed.data;

    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: displayName,
        needsDisplayName: false,
        channel: {
          update: {
            name: displayName,
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Profile update error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
