import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GeneratedICPSchema } from "@/lib/icp/schema";
import { generateStandaloneHTML } from "@/lib/icp/serialize";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { icp?: unknown; logoDataUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = GeneratedICPSchema.safeParse(body.icp);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid ICP data", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const html = generateStandaloneHTML(parsed.data, body.logoDataUrl);

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
