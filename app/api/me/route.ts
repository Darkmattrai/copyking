import { getUserRole } from "@/lib/auth/get-role";

// Returns the current user's role for client-side UI gating.
export async function GET() {
  const role = await getUserRole();
  if (!role) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({ role });
}
