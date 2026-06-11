import { z } from "zod/v4";

import type { BrandDNA } from "@/types/brand";
import type { Product } from "./schema";
import { buildOfferBrandContext } from "./brand-context";
import { ANTI_AI_LINGO } from "@/lib/generators/prompts";

// Structured first-draft of a product's narrative fields. The assistant fills
// these from Brand DNA (+ anything already filled), so the user edits instead of
// starting from a blank box. Keys map 1:1 onto Product fields.
export const OfferDraftSchema = z.object({
  who: z.string().describe("The exact person this product is for."),
  where: z.string().describe("Where they are right now — their current painful situation."),
  dream: z.string().describe("Their dream outcome — the result this delivers."),
  emotion: z.string().describe("The core emotion driving them to act."),
  bait: z.string().describe("The hook / lead-in that pulls them in."),
  magic: z.string().describe("The ONE specific, believable promise this offer makes."),
  rationale: z.string().describe("Why this offer makes sense for them right now — the reason to act."),
  features: z
    .array(z.object({ f: z.string(), b: z.string() }))
    .max(6)
    .describe("Feature → benefit pairs (what it includes → why it matters)."),
  problems: z
    .array(z.object({ p: z.string(), s: z.string() }))
    .max(6)
    .describe("Problem they have → how this solves it."),
  resultMap: z
    .object({
      ultimate: z.string().describe("The ultimate transformation."),
      cores: z
        .array(
          z.object({
            result: z.string(),
            splinters: z.array(z.string()).max(5),
          }),
        )
        .max(5),
    })
    .describe("Transformation tree: ultimate result → core results → splinter results."),
  guaranteeResult: z.string().describe("What you guarantee — the concrete outcome."),
  guaranteeWindow: z.string().describe("The timeframe the guarantee covers."),
  scarcityDetail: z.string().describe("A real, specific reason it's limited or urgent."),
  objections: z
    .array(z.object({ o: z.string(), r: z.string() }))
    .max(5)
    .describe("Likely objection → your honest rebuttal."),
  priceProof: z.string().describe("Why the price is justified — the value framing."),
  anchorCompare: z.string().describe("What to compare the price against (the anchor)."),
});

export type OfferDraft = z.infer<typeof OfferDraftSchema>;

export const OFFER_DRAFT_SYSTEM = `You are a world-class offer strategist in the Alex Hormozi "$100M Offers" tradition. You design Grand Slam Offers: a specific dream outcome, high perceived likelihood of success, low time delay, low effort, real risk reversal, and genuine scarcity. Everything you write is concrete, specific to the exact audience, and human — like a senior strategist drafting the offer for a client to react to.

${ANTI_AI_LINGO}`;

// A compact summary of what's already on the product, so the draft stays
// consistent with the user's own entries instead of contradicting them.
function filledSummary(p: Product): string {
  const lines: string[] = [];
  const add = (label: string, v?: string) => {
    if (v && v.trim()) lines.push(`- ${label}: ${v.trim()}`);
  };
  add("Product name", p.name);
  add("Price / position", p.price);
  add("One-liner", p.desc);
  add("Who", p.who);
  add("Dream outcome", p.dream);
  add("Promise (magic)", p.magic);
  add("Guarantee", p.guaranteeResult);
  return lines.length ? lines.join("\n") : "";
}

export function buildOfferDraftPrompt(brandDNA: BrandDNA, product: Product): string {
  const dna = buildOfferBrandContext(brandDNA) || "(no Brand DNA on file — infer sensibly)";
  const filled = filledSummary(product);
  const position = product.price
    ? `This product sits at: ${product.price}${product.desc ? ` — ${product.desc}` : ""}.`
    : "Position: not set yet.";

  return [
    "Draft a complete Grand Slam Offer for THIS product, grounded in the brand context below. Fill every field specifically and concretely for this exact audience — no placeholders, no generic filler.",
    `BRAND CONTEXT:\n${dna}`,
    position,
    filled
      ? `ALREADY FILLED (keep your draft consistent with these — build around them, don't contradict):\n${filled}`
      : "Nothing is filled yet — draft the whole offer from the brand context.",
  ].join("\n\n");
}
