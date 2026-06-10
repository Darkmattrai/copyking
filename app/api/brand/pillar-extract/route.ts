import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod/v4";

import { PILLAR_EXTRACTION_PROMPTS } from "@/lib/brand/prompts";
import type { PillarKey } from "@/types/brand";

const EXTRACTION_SCHEMAS: Record<string, z.ZodType> = {
  niche: z.object({
    marketCategory: z.string(),
    subNiche: z.string(),
    isGrowing: z.boolean(),
    easyToTarget: z.boolean(),
    purchasingPower: z.enum(["low", "medium", "high"]),
    painLevel: z.number().min(0).max(10),
    congregationPoints: z.array(z.string()),
  }),

  icp: z.object({
    name: z.string(),
    demographics: z.object({
      ageRange: z.string(),
      gender: z.string(),
      location: z.string(),
      incomeRange: z.string(),
      jobTitle: z.string(),
    }),
    psychographics: z.object({
      values: z.array(z.string()),
      beliefs: z.array(z.string()),
      fears: z.array(z.string()),
      desires: z.array(z.string()),
    }),
    painPoints: z.array(z.string()),
    dreamOutcome: z.string(),
    failedSolutions: z.array(z.string()),
    platforms: z.array(z.string()),
  }),

  offer: z.object({
    dreamOutcome: z.string(),
    perceivedLikelihood: z.string(),
    timeDelay: z.string(),
    effortRequired: z.string(),
    pricePoint: z.string(),
    deliveryModel: z.string(),
    grandSlamDescription: z.string(),
    valueScore: z.number().min(0).max(40),
  }),

  positioning: z.object({
    uniqueMechanism: z.string(),
    categoryOwned: z.string(),
    competitors: z.array(
      z.object({ name: z.string(), howYouDiffer: z.string() }),
    ),
    positioningStatement: z.string(),
    pointOfView: z.string(),
  }),

  voice: z.object({
    primaryArchetype: z.string(),
    secondaryArchetype: z.string(),
    toneAttributes: z.array(z.string()),
    communicationStyle: z.object({
      formalityCasual: z.number().min(1).max(10),
      technicalSimple: z.number().min(1).max(10),
      provocativeNurturing: z.number().min(1).max(10),
    }),
    brandPersona: z.string(),
    alwaysWords: z.array(z.string()),
    neverWords: z.array(z.string()),
  }),

  story: z.object({
    originStory: z.string(),
    transformationMoment: z.string(),
    mission: z.string(),
    vision: z.string(),
    coreValues: z.array(z.string()),
    villain: z.string(),
  }),

  messaging: z.object({
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
      z.object({ objection: z.string(), response: z.string() }),
    ),
  }),

  contentDNA: z.object({
    themes: z.array(z.string()),
    hookStyles: z.array(z.string()),
    storytellingPatterns: z.array(z.string()),
    ctaStyle: z.string(),
    platforms: z.array(z.string()),
    cadence: z.string(),
  }),
};

export async function POST(req: Request) {
  const { transcript, pillar }: { transcript: string; pillar: PillarKey } =
    await req.json();

  const extractionPrompt = PILLAR_EXTRACTION_PROMPTS[pillar];
  const schema = EXTRACTION_SCHEMAS[pillar];

  if (!extractionPrompt || !schema) {
    return new Response(JSON.stringify({ error: "Invalid pillar" }), {
      status: 400,
    });
  }

  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    maxOutputTokens: 8192,
    system: extractionPrompt,
    prompt: `Here is the conversation transcript:\n\n${transcript}`,
    schema,
  });

  return Response.json(object);
}
