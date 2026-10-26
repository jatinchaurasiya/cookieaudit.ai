import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase access model:
 *
 *  - The WRITE path (scan persistence) runs server-side with the
 *    service-role key. Writing with the anon key was structurally dead on
 *    arrival: RLS had no INSERT policy for `anon`, so every insert failed
 *    and the failure was swallowed. With the service role, writes succeed
 *    without weakening RLS for browser clients (the anon edge is unaffected
 *    by policy).
 *  - Reading is also server-side (route handlers + server components), so
 *    the service key NEVER ships to the browser.
 *  - The anon key is retained only as a legacy fallback for deployments that
 *    haven't set the service key yet; persistence then attempts RLS-bound
 *    writes and any rejection is surfaced loudly, not swallowed.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function keyPlaceholderConfigured(url: string): boolean {
  return !url.includes("your-project");
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && keyPlaceholderConfigured(supabaseUrl) && (supabaseServiceRoleKey || supabaseAnonKey)
);

/** True when writes can bypass RLS legitimately (server-side service role). */
export const isServiceRoleConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/** Never log or expose these values. */
export function getSupabaseMode(): "service_role" | "anon_restricted" | "unconfigured" {
  if (!isSupabaseConfigured || !supabase) return "unconfigured";
  return supabaseServiceRoleKey ? "service_role" : "anon_restricted";
}
