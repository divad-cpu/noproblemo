import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let recoverySupabaseClient: SupabaseClient<Database> | undefined;

export function getRecoverySupabaseClient() {
  if (recoverySupabaseClient) {
    return recoverySupabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing public Supabase environment variables.");
  }

  recoverySupabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "implicit",
      persistSession: true,
      storageKey: "noproblemo-password-recovery",
    },
  });

  return recoverySupabaseClient;
}
