import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

import { createClient } from "@/lib/supabase/server";
import { CONTENT_SYSTEM_PROMPT, buildContentPrompt } from "@/lib/instagram/content";
import type { BrandDNA } from "@/types/brand";

export const maxDuration = 120;

// Generates a Highlight / Reel / Carousel script for a single IG content item,
// from the user's intake answers + their Brand DNA. Claude Sonnet 4.6.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    item?: string;
    format?: string;
    fields?: Record<string, string>;
    brandDNA?: BrandDNA;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { item, format, fields, brandDNA } = body;
  if (!item || !format || !brandDNA) {
    return Response.json({ error: "Missing item, format, or brandDNA." }, { status: 400 });
  }

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      maxOutputTokens: 4096,
      system: CONTENT_SYSTEM_PROMPT,
      prompt: buildContentPrompt({ item, format, fields: fields ?? {}, brandDNA }),
    });
    return Response.json({ script: text });
  } catch (err) {
    console.error("[instagram/content] error:", err);
    return Response.json({ error: "Generation failed — please try again." }, { status: 502 });
  }
}
