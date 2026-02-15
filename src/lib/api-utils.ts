import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

export function parseBody<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Validation failed",
            details: err.issues.map((e) => ({
              path: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    throw err;
  }
}

export function parseSearchParams<T>(
  schema: z.ZodType<T>,
  params: URLSearchParams
): { success: true; data: T } | { success: false; response: NextResponse } {
  const obj = Object.fromEntries(params.entries());
  return parseBody(schema, obj);
}
