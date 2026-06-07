import { getUserRole } from "@/lib/auth/get-role";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/auth/roles";

// Lists every signup with role + created date. Admin-only.
export async function GET() {
  if ((await getUserRole()) !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ users: data ?? [] });
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
