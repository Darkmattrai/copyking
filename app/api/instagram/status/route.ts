import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Returns the current user's IG connection STATUS only — never the tokens.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ connected: false });

  const admin = createAdminClient();
  const { data } = await admin
    .from("instagram_connections")
    .select("ig_username, page_name, connected_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return Response.json({
    connected: Boolean(data),
    username: data?.ig_username ?? null,
  });
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
