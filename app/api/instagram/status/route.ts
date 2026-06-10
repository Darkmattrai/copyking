import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchProfile } from "@/lib/instagram/meta";

// Returns the current user's IG connection STATUS only — never the tokens.
// The profile picture is fetched live (IG picture URLs are short-lived).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ connected: false });

  const admin = createAdminClient();
  const { data } = await admin
    .from("instagram_connections")
    .select("ig_username, ig_user_id, page_access_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return Response.json({ connected: false });

  let username = data.ig_username ?? null;
  let profilePictureUrl: string | null = null;
  try {
    if (data.ig_user_id && data.page_access_token) {
      const profile = await fetchProfile(data.ig_user_id, data.page_access_token);
      profilePictureUrl = profile.profilePictureUrl || null;
      if (profile.username) username = profile.username;
    }
  } catch (err) {
    console.error("[instagram/status] live profile fetch failed:", err);
  }

  return Response.json({ connected: true, username, profilePictureUrl });
}

// Disconnect: remove the stored connection + tokens.
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  await admin.from("instagram_connections").delete().eq("user_id", user.id);
  return Response.json({ ok: true });
}
