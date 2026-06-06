import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import { IntakeSchema, GeneratedICPSchema } from "@/lib/icp/schema";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/icp/prompt";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const intakeParsed = IntakeSchema.safeParse(body);
  if (!intakeParsed.success) {
    return NextResponse.json(
      { error: "Invalid intake data", details: intakeParsed.error.flatten() },
      { status: 422 }
    );
  }
  const intake = intakeParsed.data;

  if (intake.logoDataUrl && intake.logoDataUrl.length > 1_400_000) {
    return NextResponse.json(
      { error: "Logo data URL too large (max ~1MB)" },
      { status: 413 }
    );
  }

  const model = process.env.ICP_MODEL ?? "claude-opus-4-5";
  const userMessage = buildUserMessage(intake);

  for (let attempt = 1; attempt <= 2; attempt++) {
    let rawText: string;
    try {
      const message = await anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });
      rawText = message.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("");
    } catch (err) {
      console.error(`[icp/generate] Anthropic error (attempt ${attempt}):`, err);
      return NextResponse.json(
        { error: "AI service error — please try again shortly." },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      if (attempt === 2) {
        console.error(
          "[icp/generate] Failed to parse JSON after 2 attempts:",
          rawText.slice(0, 500)
        );
        return NextResponse.json(
          { error: "AI returned an unexpected format. Please try again." },
          { status: 502 }
        );
      }
      continue;
    }

    const icpParsed = GeneratedICPSchema.safeParse(parsed);
    if (!icpParsed.success) {
      if (attempt === 2) {
        console.error(
          "[icp/generate] Schema validation failed after 2 attempts:",
          icpParsed.error.flatten()
        );
        return NextResponse.json(
          { error: "AI output did not match expected format. Please try again." },
          { status: 502 }
        );
      }
      continue;
    }

    return NextResponse.json(icpParsed.data);
  }

  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}
