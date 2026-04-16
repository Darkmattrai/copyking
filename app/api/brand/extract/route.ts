import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod/v4";

import { EXTRACTION_SYSTEM_PROMPT } from "@/lib/brand/prompts";

const ExtractionSchema = z.object({
  niche: z.object({
    marketCategory: z.string().describe("The main market category, e.g. 'Health > Weight Loss > Busy Moms'"),
    subNiche: z.string().describe("The specific sub-niche within the market"),
    congregationPoints: z.array(z.string()).describe("Where the target audience hangs out online"),
  }),
  icp: z.object({
    name: z.string().describe("A catchy avatar name like 'Frustrated Frank' or 'Stressed Sarah'"),
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
    painPoints: z.array(z.string()).describe("Top 3-5 specific pain points"),
    dreamOutcome: z.string().describe("What their ideal result looks like"),
    failedSolutions: z.array(z.string()).describe("What they've already tried"),
    platforms: z.array(z.string()).describe("Social platforms and communities they use"),
  }),
  offer: z.object({
    dreamOutcome: z.string(),
    perceivedLikelihood: z.string(),
    timeDelay: z.string(),
    effortRequired: z.string(),
    grandSlamDescription: z.string(),
  }),
  positioning: z.object({
    uniqueMechanism: z.string(),
    categoryOwned: z.string(),
    positioningStatement: z.string().describe("Format: I help [X] achieve [Y] using [Z] without [W]"),
    pointOfView: z.string().describe("What the industry gets wrong"),
  }),
  voice: z.object({
    primaryArchetype: z.string().describe("One of the 12 Jungian brand archetypes"),
    secondaryArchetype: z.string(),
    toneAttributes: z.array(z.string()).describe("3-5 adjectives describing the brand tone"),
    brandPersona: z.string().describe("If the brand were a person, how would you describe them"),
  }),
  story: z.object({
    mission: z.string(),
    villain: z.string().describe("What the brand is fighting against"),
  }),
  messaging: z.object({
    oneLiner: z.string(),
    tagline: z.string().describe("3-7 word memorable phrase"),
  }),
  contentDNA: z.object({
    themes: z.array(z.string()).describe("3-5 recurring content topics"),
    hookStyles: z.array(z.string()).describe("Preferred hook styles"),
  }),
});

export async function POST(req: Request) {
  const { transcript } = await req.json();

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    system: EXTRACTION_SYSTEM_PROMPT,
    prompt: `Here is the conversation transcript:\n\n${transcript}`,
    schema: ExtractionSchema,
  });

  return Response.json(object);
}
