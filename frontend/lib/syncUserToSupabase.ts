import { createClient } from "@supabase/supabase-js";

// Ensure the environment variables are being read. If they are not,
// the createClient call will not fail, but subsequent queries will.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase URL or Service Role Key is missing from environment variables.");
}

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

export async function syncUserToSupabase(user: { id: string; displayName?: string | null }) {
  console.log(`[Supabase Sync] Attempting to upsert user: ${user.id}`);

  const { error } = await supabaseServer.from("users").upsert(
    {
      userId: user.id,
      name: user.displayName ?? null,
    },
    { onConflict: "userId" }
  );

  // If there is an error, throw it so the application crashes loudly.
  if (error) {
    console.error("[Supabase sync error]", error);
    throw new Error(`Failed to sync user to Supabase: ${error.message}`);
  }

  console.log(`[Supabase Sync] Successfully upserted user: ${user.id}`);
}