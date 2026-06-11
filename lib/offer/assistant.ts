import type Anthropic from "@anthropic-ai/sdk";

import type { Product } from "./schema";
import { ANTI_AI_LINGO } from "@/lib/generators/prompts";

// The single tool the assistant uses to write into the offer builder. It mirrors
// the editable Product fields; the model includes only the fields it's setting.
export const UPDATE_TOOL: Anthropic.Tool = {
  name: "update_offer",
  description:
    "Fill or update fields on the offer product the user is building. Include ONLY the fields you're setting right now; omit everything else. Call this the moment you have enough to fill a field or section — don't wait until the end. After calling it, tell the user in one short line what you filled and what's next.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Product name." },
      desc: { type: "string", description: "One-line: what they get on this product." },
      price: { type: "string", description: 'Headline price (e.g. "$1,500", "FREE").' },
      who: { type: "string", description: "The exact person this is for." },
      where: { type: "string", description: "Their current painful situation." },
      dream: { type: "string", description: "Their dream outcome." },
      emotion: { type: "string", description: "The core emotion driving them." },
      bait: { type: "string", description: "The hook that pulls them in." },
      magic: { type: "string", description: "The one specific, believable promise." },
      rationale: { type: "string", description: "Why act now — the reason." },
      features: {
        type: "array",
        items: { type: "object", properties: { f: { type: "string" }, b: { type: "string" } } },
        description: "Feature → benefit pairs.",
      },
      problems: {
        type: "array",
        items: { type: "object", properties: { p: { type: "string" }, s: { type: "string" } } },
        description: "Problem → your solution pairs.",
      },
      deliverables: {
        type: "array",
        items: { type: "object", properties: { item: { type: "string" }, val: { type: "string" } } },
        description: "Value-stack items → $ value.",
      },
      bonuses: {
        type: "array",
        items: {
          type: "object",
          properties: { name: { type: "string" }, val: { type: "string" }, why: { type: "string" } },
        },
      },
      resultMap: {
        type: "object",
        properties: {
          ultimate: { type: "string" },
          cores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                result: { type: "string" },
                splinters: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      guaranteeType: { type: "string" },
      guaranteeResult: { type: "string", description: "What you guarantee — the outcome." },
      guaranteeWindow: { type: "string", description: "The timeframe of the guarantee." },
      scarcityType: { type: "string" },
      scarcityDetail: { type: "string", description: "A real reason it's limited/urgent." },
      priceProof: { type: "string", description: "Why the price is justified." },
      anchorCompare: { type: "string", description: "What to compare the price against." },
      objections: {
        type: "array",
        items: { type: "object", properties: { o: { type: "string" }, r: { type: "string" } } },
        description: "Objection → rebuttal pairs.",
      },
    },
  },
};

// Lets the assistant read a public web page (the user's site, a landing page, a
// competitor, an article). Executed server-side; the page text comes back as the
// tool result for the assistant to use.
export const READ_URL_TOOL: Anthropic.Tool = {
  name: "read_url",
  description:
    "Fetch and read the text of a public web page. Use it whenever the user shares a URL or asks you to look at a link (their website, a sales page, a competitor, an article). Mine it for offer details.",
  input_schema: {
    type: "object",
    properties: {
      url: { type: "string", description: "The full http(s) URL to read." },
    },
    required: ["url"],
  },
};

// The fields the tool can write — used client-side to apply the patch safely.
export const UPDATE_FIELDS = Object.keys(
  (UPDATE_TOOL.input_schema as { properties: Record<string, unknown> }).properties,
);

function summarizeProduct(p: Product): string {
  const lines: string[] = [];
  const add = (label: string, v?: string) => {
    if (v && v.trim()) lines.push(`- ${label}: ${v.trim()}`);
  };
  add("Name", p.name);
  add("Price", p.price);
  add("One-liner", p.desc);
  add("Who", p.who);
  add("Where", p.where);
  add("Dream", p.dream);
  add("Promise", p.magic);
  add("Rationale", p.rationale);
  add("Guarantee", p.guaranteeResult);
  add("Scarcity", p.scarcityDetail);
  if (p.features.length) lines.push(`- Features: ${p.features.length} filled`);
  if (p.problems.length) lines.push(`- Problems: ${p.problems.length} filled`);
  if (p.objections.length) lines.push(`- Objections: ${p.objections.length} filled`);
  if (p.resultMap?.ultimate) lines.push(`- Result map: started`);
  return lines.length ? lines.join("\n") : "(nothing filled yet)";
}

export function buildAssistantSystem(brandContext: string, product: Product | null): string {
  return `You are CopyKing's offer-building assistant — a world-class offer strategist in the Alex Hormozi "$100M Offers" tradition, working alongside the user INSIDE their offer builder.

Your job: help them build a Grand Slam Offer for THIS product and FILL IT IN for them as you go using the update_offer tool. Don't just tell them what to write — actually write it via the tool. Pull everything you can from their Brand DNA so you ask as few questions as possible. When you have enough to fill a field or section, call update_offer immediately, then say in one short line what you filled and what's next.

Keep your chat replies short and human — the substance goes into the tool calls. If the user uploads files (transcripts, decks, sheets, notes), mine them for the offer details. If they share a URL or ask you to look at a link, use the read_url tool to read the page.

${brandContext ? `THEIR BRAND DNA:\n${brandContext}\n` : "No Brand DNA on file — gather the essentials by asking.\n"}
CURRENT PRODUCT (fill EMPTY fields; keep filled ones unless they ask you to change them):
${product ? summarizeProduct(product) : "(no product open)"}

${ANTI_AI_LINGO}`;
}
