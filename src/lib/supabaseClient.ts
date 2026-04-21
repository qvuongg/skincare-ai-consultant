/**
 * lib/supabaseClient.ts
 *
 * Convenience re-export that initialises the correct Supabase client based on
 * the calling context and exposes the three core database helpers.
 *
 * Usage
 * -----
 * Client component:
 *   import { supabase, fetchAllProducts } from "@/lib/supabaseClient";
 *
 * Server component / Route Handler:
 *   import { createServerSupabaseClient } from "@/lib/supabaseClient";
 *   const supabase = await createServerSupabaseClient();
 *
 * Server-only admin (bypasses RLS):
 *   import { supabaseAdmin } from "@/lib/supabaseClient";
 *
 * Environment variables required
 * -------------------------------
 *   NEXT_PUBLIC_SUPABASE_URL       – project URL  (public, safe for client)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  – anon key     (public, safe for client)
 *   SUPABASE_SERVICE_ROLE_KEY      – service role  (server-only, NEVER expose)
 */

// ---------------------------------------------------------------------------
// Client initialisation helpers
// ---------------------------------------------------------------------------

/** Browser/client-side singleton (anon key). */
export { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

/** Next.js server-side client with cookie-based auth. */
export { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

/** Service-role admin client that bypasses RLS (server-only). */
export { createAdminClient as createAdminSupabaseClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Default browser client instance
// ---------------------------------------------------------------------------
import { createClient } from "@/lib/supabase/client";

/**
 * Pre-initialised browser Supabase client.
 * Use this in client components for read operations.
 */
export const supabase = createClient();

// ---------------------------------------------------------------------------
// Database helper functions
// ---------------------------------------------------------------------------
export type { DBProduct, DBLead, DBScanStat } from "@/lib/supabase/db";

export {
  // Public read
  fetchAllProducts,

  // Lead capture (writes via service role, bypasses RLS)
  addLead,

  // Anonymous scan analytics (writes via service role, bypasses RLS)
  logScan,

  // Admin product management
  createProduct,
  updateProduct,
  deleteProduct,

  // Admin lead reading
  fetchLeads,
} from "@/lib/supabase/db";
