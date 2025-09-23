import { stackServerApp } from "@/stack/server";
import { syncUserToSupabase } from "@/lib/syncUserToSupabase";

export default async function UserSync({ children }: { children: React.ReactNode }) {
  const user = await stackServerApp.getUser();

  if (user) {
    await syncUserToSupabase({ id: user.id, displayName: user.displayName });
  } else {
    console.log("[UserSync] no user, skipping Supabase sync");
  }

  return <>{children}</>;
}