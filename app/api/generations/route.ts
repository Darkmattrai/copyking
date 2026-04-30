import { createClient } from "@/lib/supabase/server";

interface SavePayload {
  slug: string;
  content: string;
  params?: Record<string, string>;
  generatedAt?: string;
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
      .from("generations")
      .select("slug, content, params, generated_at")
      .eq("user_id", user.id);

    if (error) {
      return Response.json(
        { error: "Failed to load generations", details: error.message },
        { status: 500 },
      );
    }

    const map: Record<
      string,
      { content: string; params: Record<string, string>; generatedAt: string }
    > = {};

    for (const row of data ?? []) {
      map[row.slug as string] = {
        content: row.content as string,
        params: ((row.params ?? {}) as Record<string, string>) || {},
        generatedAt: row.generated_at as string,
      };
    }

    return Response.json({ generations: map });
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

  if (!body.slug || typeof body.content !== "string") {
    return Response.json(
      { error: "Missing slug or content" },
      { status: 400 },
    );
  }

  try {
    const now = new Date().toISOString();
    const { error } = await supabase.from("generations").upsert(
      {
        user_id: user.id,
        slug: body.slug,
        content: body.content,
        params: body.params ?? {},
        generated_at: body.generatedAt ?? now,
        updated_at: now,
      },
      { onConflict: "user_id,slug" },
    );

    if (error) {
      return Response.json(
        { error: "Failed to save generation", details: error.message },
        { status: 500 },
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  try {
    const query = supabase.from("generations").delete().eq("user_id", user.id);
    const { error } = slug ? await query.eq("slug", slug) : await query;

    if (error) {
      return Response.json(
        { error: "Failed to delete generation", details: error.message },
        { status: 500 },
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
