import { stackServerApp } from "@/stack/server";
import { syncUserToSupabase } from "@/lib/syncUserToSupabase";

export default async function UserSync({ children }: { children: React.ReactNode }) {
  const user = await stackServerApp.getUser();

  console.log("[UserSync] user:", user);

  if (user) {
    await syncUserToSupabase({ id: user.id, displayName: user.displayName });
    console.log("[UserSync] synced user to Supabase:", user.id);
  } else {
    console.log("[UserSync] no user, skipping Supabase sync");
  }

  return <>{children}</>;
}