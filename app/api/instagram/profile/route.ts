import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchProfile } from "@/lib/instagram/meta";

// Returns the current user's LIVE connected Instagram profile (read fresh from
// Meta via the stored page token) to pre-fill the audit. Never returns tokens.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ connected: false }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("instagram_connections")
    .select("ig_user_id, page_access_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data?.ig_user_id || !data.page_access_token) {
    return Response.json({ connected: false });
  }

  try {
    const p = await fetchProfile(data.ig_user_id, data.page_access_token);
    return Response.json({
      connected: true,
      profile: {
        username: p.username,
        name: p.name,
        biography: p.biography,
        website: p.website,
        followersCount: p.followersCount,
        followsCount: p.followsCount,
        mediaCount: p.mediaCount,
        profilePictureUrl: p.profilePictureUrl,
      },
    });
  } catch (err) {
    console.error("[instagram/profile] fetch failed:", err);
    return Response.json(
      { connected: true, error: "Couldn't read the live profile." },
      { status: 502 },
    );
  }
}
