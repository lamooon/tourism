import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ service role key, safe only on server
);

export async function syncUserToSupabase(user: { id: string; displayName?: string | null }) {
  const { error } = await supabaseServer.from("users").upsert(
    {
      userId: user.id,
      name: user.displayName ?? null,
    },
    { onConflict: "userId" }
  );

  if (error) {
    console.error("[Supabase sync error]", error);
  }
}