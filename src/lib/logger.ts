import pino from "pino";

/**
 * Structured logger for the application.
 *
 * In production: outputs JSON for log aggregation services.
 * In development: outputs pretty-printed logs (install pino-pretty as devDependency).
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info({ videoId }, "Video processing started");
 *   logger.error({ err, taskToken }, "Transcoding failed");
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        ignore: "pid,hostname",
        translateTime: "SYS:HH:MM:ss",
      },
    },
  }),
});
