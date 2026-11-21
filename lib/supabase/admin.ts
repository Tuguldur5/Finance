import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env";

/**
 * Service-role Supabase client. Bypasses RLS — never import this from a
 * Client Component, a route handler that echoes data, or any public code.
 * Currently used only by the delete-account server action.
 */
export function createAdminClient(): SupabaseClient {
  const env = getServerEnv();

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
