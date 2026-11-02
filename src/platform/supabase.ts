import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonymousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = url && anonymousKey ? createClient(url, anonymousKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;
export const isCloudConfigured = Boolean(supabase);
