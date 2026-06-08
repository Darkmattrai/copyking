import { getUserRole } from "@/lib/auth/get-role";
import { createAdminClient } from "@/lib/supabase/admin";

// Bulk export of every user's Brand DNA + generation content for the admin
// "Export all" action. Admin-only — service-role client reads across all users.
// The client turns this raw bundle into a combined document or JSON download.
export async function GET() {
  if ((await getUserRole()) !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const [profilesRes, brandRes, gensRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("brand_profiles")
      .select("user_id, brand_dna, interview_completed, updated_at"),
    admin.from("generations").select("user_id, slug, content, updated_at"),
  ]);

  if (profilesRes.error) {
    return Response.json({ error: profilesRes.error.message }, { status: 500 });
  }

  type BrandRow = NonNullable<typeof brandRes.data>[number];
  const brandByUser = new Map<string, BrandRow>();
  for (const b of brandRes.data ?? []) {
    if (b.user_id) brandByUser.set(b.user_id, b);
  }

  const gensByUser = new Map<string, { slug: string; content: string }[]>();
  for (const g of gensRes.data ?? []) {
    if (!g.user_id) continue;
    const arr = gensByUser.get(g.user_id) ?? [];
    arr.push({ slug: g.slug, content: g.content });
    gensByUser.set(g.user_id, arr);
  }

  const users = (profilesRes.data ?? []).map((u) => {
    const brand = brandByUser.get(u.id);
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      brandDna: brand?.brand_dna ?? null,
      interviewCompleted: Boolean(brand?.interview_completed),
      generations: gensByUser.get(u.id) ?? [],
    };
  });

  return Response.json({ users, exportedAt: new Date().toISOString() });
}
