import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    "WARNING: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. Image uploads will not work."
  );
}

/**
 * Server-side Supabase client with service role key.
 * Used for storage operations (uploads, deletions) that bypass RLS.
 */
export const supabaseAdmin = createClient(
  supabaseUrl || "",
  supabaseServiceRoleKey || "",
  {
    auth: { persistSession: false },
  }
);

export const STORAGE_BUCKET = "uploads";
