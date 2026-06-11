import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

import { createClient } from "@/lib/supabase/server";
import {
  OfferDraftSchema,
  OFFER_DRAFT_SYSTEM,
  buildOfferDraftPrompt,
} from "@/lib/offer/draft";
import type { BrandDNA } from "@/types/brand";
import type { Product } from "@/lib/offer/schema";

export const maxDuration = 120;

// Drafts a full Grand Slam Offer for a product from Brand DNA (+ anything already
// filled). Claude Sonnet 4.6. Available to any logged-in user.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { brandDNA?: BrandDNA; product?: Product };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.brandDNA || !body.product) {
    return Response.json({ error: "Missing brandDNA or product." }, { status: 400 });
  }

  try {
    const { object } = await generateObject({
      model: anthropic(process.env.OFFER_MODEL ?? "claude-sonnet-4-6"),
      maxOutputTokens: 4096,
      system: OFFER_DRAFT_SYSTEM,
      schema: OfferDraftSchema,
      prompt: buildOfferDraftPrompt(body.brandDNA, body.product),
    });
    return Response.json({ draft: object });
  } catch (err) {
    console.error("[offer/draft] error:", err);
    return Response.json(
      { error: "Draft failed — please try again." },
      { status: 502 },
    );
  }
}
