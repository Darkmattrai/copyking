import { getUserRole } from "@/lib/auth/get-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { summarizeUsage } from "@/lib/usage/rollup";

// Full per-user bundle for the admin detail view: profile, auth/session
// metadata, Brand DNA JSON, and every saved generation (their answers).
// Admin-only — service-role client bypasses RLS to read across users.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if ((await getUserRole()) !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();

  const [profileRes, brandRes, gensRes, usageRes, authRes] = await Promise.all([
    admin.from("profiles").select("id, email, role, created_at").eq("id", id).single(),
    admin
      .from("brand_profiles")
      .select("brand_dna, interview_completed, reveal_seen, created_at, updated_at")
      .eq("user_id", id)
      .maybeSingle(),
    admin
      .from("generations")
      .select("slug, content, params, generated_at, created_at, updated_at")
      .eq("user_id", id)
      .order("updated_at", { ascending: false }),
    admin
      .from("usage_events")
      .select(
        "feature, model, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens",
      )
      .eq("user_id", id),
    admin.auth.admin.getUserById(id),
  ]);

  if (profileRes.error) {
    return Response.json({ error: profileRes.error.message }, { status: 500 });
  }

  const authUser = authRes.data?.user;
  const usage = summarizeUsage(usageRes.data ?? []);

  return Response.json({
    profile: profileRes.data,
    auth: authUser
      ? {
          last_sign_in_at: authUser.last_sign_in_at ?? null,
          created_at: authUser.created_at ?? null,
          email_confirmed_at: authUser.email_confirmed_at ?? null,
          provider: authUser.app_metadata?.provider ?? null,
        }
      : null,
    brandProfile: brandRes.data ?? null,
    generations: gensRes.data ?? [],
    usage,
  });
}
