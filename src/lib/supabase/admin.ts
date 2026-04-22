import { createClient } from "@supabase/supabase-js";
import { config } from "../config";

export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);

export const STORAGE_BUCKET = "uploads";
