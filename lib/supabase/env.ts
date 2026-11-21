import { getPublicEnv, hasPublicEnv } from "@/lib/env";

/**
 * Public Supabase configuration.
 *
 * Only the anon key is ever read in the browser. The service role key is
 * server-only (see `lib/supabase/admin.ts`).
 */
export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

export function hasSupabaseEnv(): boolean {
  return hasPublicEnv();
}

export function getSupabaseEnv(): SupabaseEnv {
  const env = getPublicEnv();

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}
