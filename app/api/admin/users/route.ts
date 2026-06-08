import { getUserRole } from "@/lib/auth/get-role";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/auth/roles";

// Lists every signup with role, created date, and usage/tracking rollups
// (generation count, last activity, whether their interview is complete).
// Admin-only.
export async function GET() {
  if ((await getUserRole()) !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const [profilesRes, gensRes, brandRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: false }),
    admin.from("generations").select("user_id, slug, updated_at"),
    admin
      .from("brand_profiles")
      .select("user_id, interview_completed, updated_at"),
  ]);

  if (profilesRes.error) {
    return Response.json({ error: profilesRes.error.message }, { status: 500 });
  }

  // Roll up per-user usage so the list can show activity at a glance.
  const counts = new Map<string, number>();
  const lastActive = new Map<string, string>();
  for (const g of gensRes.data ?? []) {
    if (!g.user_id) continue;
    counts.set(g.user_id, (counts.get(g.user_id) ?? 0) + 1);
    const prev = lastActive.get(g.user_id);
    if (!prev || (g.updated_at && g.updated_at > prev)) {
      if (g.updated_at) lastActive.set(g.user_id, g.updated_at);
    }
  }

  const interview = new Map<string, boolean>();
  for (const b of brandRes.data ?? []) {
    if (!b.user_id) continue;
    interview.set(b.user_id, Boolean(b.interview_completed));
    const prev = lastActive.get(b.user_id);
    if (b.updated_at && (!prev || b.updated_at > prev)) {
      lastActive.set(b.user_id, b.updated_at);
    }
  }

  const users = (profilesRes.data ?? []).map((u) => ({
    ...u,
    generationsCount: counts.get(u.id) ?? 0,
    lastActive: lastActive.get(u.id) ?? null,
    interviewCompleted: interview.get(u.id) ?? false,
  }));

  return Response.json({ users });
}

// Changes a user's role (promote/demote). Admin-only.
export async function PATCH(req: Request) {
  if ((await getUserRole()) !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { id?: string; role?: UserRole };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.id || (body.role !== "admin" && body.role !== "client")) {
    return Response.json({ error: "Missing id or role" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role: body.role })
    .eq("id", body.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
