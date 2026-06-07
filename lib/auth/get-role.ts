import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "./roles";

// Reads the authenticated user's role from public.profiles.
// Returns null when there is no session. Defaults to "client" if a session
// exists but no profile row is found (fail closed to the restricted role).
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (data?.role as UserRole) ?? "client";
}
