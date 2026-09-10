import { createClient } from "@supabase/supabase-js";

// Untuk operasi admin server-only (update password, tabel token reset).
// WAJIB env SUPABASE_SERVICE_ROLE_KEY (bukan publishable/anon!).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function createAdminSupabase() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diset di environment");
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
