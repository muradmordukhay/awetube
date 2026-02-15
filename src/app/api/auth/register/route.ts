import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { authLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { generateUniqueHandle } from "@/lib/channel-utils";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limit = authLimiter.check(ip);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const parsed = parseBody(registerSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { name, email, password } = parsed.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);
    const uniqueHandle = await generateUniqueHandle(name);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        channel: {
          create: {
            handle: uniqueHandle,
            name,
          },
        },
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (error) {
    logger.error({ err: error }, "Registration error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
