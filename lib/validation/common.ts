import { z } from "zod";

const uuidSchema = z.string().uuid();

/** Guard for ids that arrive from form state or API calls. */
export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && uuidSchema.safeParse(value).success;
}
