import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.startsWith("http") &&
  !supabaseUrl.includes("your-project-id") &&
  supabaseKey &&
  !supabaseKey.includes("your-anon-public-key") &&
  !supabaseKey.includes("your-publishable-key")
);

if (typeof window !== "undefined") {
  console.log("[Supabase Client Init]", {
    isConfigured: isSupabaseConfigured,
    supabaseUrl: supabaseUrl ? supabaseUrl.replace(/https:\/\/(.{4}).*(\.supabase\.co)/, "https://$1...$2") : "(empty)",
    hasKey: Boolean(supabaseKey),
    keyPrefix: supabaseKey ? supabaseKey.substring(0, 15) + "..." : "(none)",
  });
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
