import { z } from "zod";

/**
 * Environment configuration.
 *
 * Only the two NEXT_PUBLIC_ values may ever reach the browser. The service
 * role key is read exclusively by the server-only admin client.
 */

const supabaseUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    },
    { message: "must be a valid http(s) URL" },
  );

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrlSchema,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .trim()
    .min(20, { message: "is missing or too short" }),
});

export const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .trim()
    .min(20, { message: "is missing or too short" }),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function readPublicEnv() {
  // Read each variable explicitly: Next.js only inlines direct
  // `process.env.NEXT_PUBLIC_*` references into the browser bundle.
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

function formatIssues(error: z.ZodError): string {
  const names = error.issues.map((issue) =>
    issue.path.length > 0 ? issue.path.join(".") : "environment",
  );

  return [...new Set(names)].join(", ");
}

/**
 * Parses the public env lazily so a malformed/missing variable throws a
 * message that names the variable instead of an opaque SDK failure.
 */
export function getPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse(readPublicEnv());

  if (!parsed.success) {
    throw new Error(
      `Environment configuration error: ${formatIssues(parsed.error)}. ` +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local " +
        "(Supabase → Project Settings → API Keys).",
    );
  }

  return parsed.data;
}

/** Server-only. Throws when the service role key is not configured. */
export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    ...readPublicEnv(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      `Environment configuration error: ${formatIssues(parsed.error)}. ` +
        "SUPABASE_SERVICE_ROLE_KEY is required for admin actions and must stay server-side.",
    );
  }

  return parsed.data;
}

export function hasPublicEnv(): boolean {
  return publicEnvSchema.safeParse(readPublicEnv()).success;
}

export function hasServiceRoleEnv(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/**
 * Called once from instrumentation. Logs a precise warning instead of
 * crashing the server so the health endpoint can still report the problem.
 */
export function warnAboutEnv(): void {
  const parsed = publicEnvSchema.safeParse(readPublicEnv());

  if (!parsed.success) {
    console.error(
      `[env] Missing or invalid: ${formatIssues(parsed.error)}. ` +
        "Copy .env.example to .env.local and fill the Supabase values.",
    );
  }

  if (!hasServiceRoleEnv()) {
    console.warn(
      "[env] SUPABASE_SERVICE_ROLE_KEY is not set — account deletion will be unavailable.",
    );
  }
}
