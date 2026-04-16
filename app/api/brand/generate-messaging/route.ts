import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod/v4";

import { MESSAGING_GENERATION_PROMPT } from "@/lib/brand/prompts";

const MessagingOutputSchema = z.object({
  oneLiner: z.string(),
  tagline: z.string(),
  keyMessages: z.array(z.string()),
  brandScript: z.object({
    hero: z.string(),
    problem: z.object({
      external: z.string(),
      internal: z.string(),
      philosophical: z.string(),
    }),
    guide: z.object({
      empathy: z.string(),
      authority: z.string(),
    }),
    plan: z.array(z.string()),
    cta: z.object({
      direct: z.string(),
      transitional: z.string(),
    }),
    failure: z.string(),
    success: z.string(),
  }),
  objections: z.array(
    z.object({
      objection: z.string(),
      response: z.string(),
    }),
  ),
});

export async function POST(req: Request) {
  const { brandDNA } = await req.json();

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    system: MESSAGING_GENERATION_PROMPT,
    prompt: `Here is the Brand DNA profile:\n\n${JSON.stringify(brandDNA, null, 2)}`,
    schema: MessagingOutputSchema,
  });

  return Response.json(object);
}
