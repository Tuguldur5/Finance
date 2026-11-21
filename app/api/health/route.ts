import { NextResponse } from "next/server";

import { getPublicEnv, hasPublicEnv, hasServiceRoleEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type HealthPayload = {
  env: boolean;
  db: boolean;
  auth: boolean;
  error?: string;
};

function payload(
  body: HealthPayload,
  status = 200,
): NextResponse<HealthPayload> {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

/**
 * Development diagnostic. Reports only booleans and a safe error message —
 * never key values, URLs, cookies or user data.
 */
export async function GET() {
  if (!hasPublicEnv()) {
    return payload(
      {
        env: false,
        db: false,
        auth: false,
        error:
          "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing or invalid.",
      },
      503,
    );
  }

  try {
    const supabase = await createClient();

    const [profileResult, userResult] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.auth.getUser(),
    ]);

    const auth = Boolean(userResult.data.user);
    const profileReadable = !profileResult.error;

    // Anonymous requests cannot read the RLS-protected profiles table, so a
    // permission error does not mean the database is down. Fall back to the
    // auth health endpoint, which also verifies the backend can reach Postgres.
    let db = profileReadable;
    if (!profileReadable) {
      const {
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
      } = getPublicEnv();
      const rest = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: anonKey },
        cache: "no-store",
      }).catch(() => null);
      db = rest?.ok ?? false;
    }

    return payload(
      {
        env: true,
        db,
        auth,
        ...(db
          ? {}
          : {
              error: profileResult.error?.message
                ? `Database: ${profileResult.error.message}`
                : "Database is unreachable.",
            }),
      },
      db ? 200 : 503,
    );
  } catch (error) {
    return payload(
      {
        env: true,
        db: false,
        auth: false,
        error:
          error instanceof Error ? error.message : "Unknown Supabase error.",
      },
      503,
    );
  }
}

/** Exposes whether the admin key exists without revealing it. */
export async function HEAD() {
  return new NextResponse(null, {
    status: hasServiceRoleEnv() ? 204 : 503,
    headers: { "x-service-role": hasServiceRoleEnv() ? "set" : "missing" },
  });
}
