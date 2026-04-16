import { BrandDNASchema } from "@/types/brand";
import { createClient } from "@/lib/supabase/server";

interface SavePayload {
  brandDNA: unknown;
  interviewCompleted: boolean;
  revealSeen: boolean;
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("brand_profiles")
      .select("brand_dna, interview_completed, reveal_seen")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return Response.json(
        { error: "Failed to load profile", details: error.message },
        { status: 500 },
      );
    }

    if (!data) {
      return Response.json({ profile: null });
    }

    const parsed = BrandDNASchema.safeParse(data.brand_dna);

    if (!parsed.success) {
      return Response.json(
        { error: "Stored Brand DNA is invalid." },
        { status: 500 },
      );
    }

    return Response.json({
      profile: {
        brandDNA: parsed.data,
        interviewCompleted: Boolean(data.interview_completed),
        revealSeen: Boolean(data.reveal_seen),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SavePayload;

  try {
    body = (await req.json()) as SavePayload;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BrandDNASchema.safeParse(body.brandDNA);

  if (!parsed.success) {
    return Response.json({ error: "Invalid brandDNA payload" }, { status: 400 });
  }

  try {
    const { error } = await supabase.from("brand_profiles").upsert(
      {
        user_id: user.id,
        profile_key: user.id,
        brand_dna: parsed.data,
        interview_completed: body.interviewCompleted,
        reveal_seen: body.revealSeen,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      return Response.json(
        {
          error: "Failed to save profile.",
          details: error.message,
        },
        { status: 500 },
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return Response.json({ error: message }, { status: 500 });
  }
}
