import { z } from "zod";

export const emailLinkRequestSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
});

export const displayNameSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(100),
});
