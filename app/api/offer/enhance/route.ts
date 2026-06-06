import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import { buildEnhancePrompt, type EnhanceContext } from "@/lib/offer/enhance-prompt";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { field?: string; value?: string; context?: EnhanceContext };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const field = (body.field || "").trim();
  const value = (body.value || "").trim();
  if (!field || !value) {
    return NextResponse.json(
      { error: "Both field and value are required" },
      { status: 400 }
    );
  }

  const model = process.env.OFFER_MODEL ?? "claude-sonnet-4-6";
  const prompt = buildEnhancePrompt(field, value, body.context ?? {});

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[offer/enhance] Anthropic error:", err);
    return NextResponse.json(
      { error: "AI service error — please try again shortly." },
      { status: 502 }
    );
  }
}
