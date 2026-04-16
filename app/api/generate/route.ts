import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

import { getGenerator } from "@/lib/generators/registry";
import { GENERATOR_PROMPTS } from "@/lib/generators/prompts";
import type { BrandDNA } from "@/types/brand";

export const maxDuration = 60;

function buildBrandContext(brandDNA: BrandDNA): string {
  const sections: string[] = [];

  if (brandDNA.niche?.marketCategory) {
    sections.push(`## Niche & Market
- Market: ${brandDNA.niche.marketCategory}
- Sub-niche: ${brandDNA.niche.subNiche || "N/A"}
- Congregation points: ${brandDNA.niche.congregationPoints?.join(", ") || "N/A"}`);
  }

  if (brandDNA.icp?.name) {
    const icp = brandDNA.icp;
    sections.push(`## Ideal Customer Profile (ICP)
- Name/Avatar: ${icp.name}
- Demographics: ${icp.demographics?.ageRange || ""}, ${icp.demographics?.gender || ""}, ${icp.demographics?.location || ""}, ${icp.demographics?.incomeRange || ""}, ${icp.demographics?.jobTitle || ""}
- Pain points: ${icp.painPoints?.join("; ") || "N/A"}
- Dream outcome: ${icp.dreamOutcome || "N/A"}
- Failed solutions: ${icp.failedSolutions?.join("; ") || "N/A"}
- Values: ${icp.psychographics?.values?.join(", ") || "N/A"}
- Fears: ${icp.psychographics?.fears?.join(", ") || "N/A"}
- Desires: ${icp.psychographics?.desires?.join(", ") || "N/A"}
- Platforms: ${icp.platforms?.join(", ") || "N/A"}`);
  }

  if (brandDNA.offer?.dreamOutcome) {
    const offer = brandDNA.offer;
    sections.push(`## Offer
- Dream outcome: ${offer.dreamOutcome}
- Delivery model: ${offer.deliveryModel || "N/A"}
- Price point: ${offer.pricePoint || "N/A"}
- Perceived likelihood: ${offer.perceivedLikelihood || "N/A"}
- Time delay: ${offer.timeDelay || "N/A"}
- Effort required: ${offer.effortRequired || "N/A"}
- Description: ${offer.grandSlamDescription || "N/A"}`);
  }

  if (brandDNA.positioning?.uniqueMechanism) {
    const pos = brandDNA.positioning;
    sections.push(`## Positioning
- Unique mechanism: ${pos.uniqueMechanism}
- Category owned: ${pos.categoryOwned || "N/A"}
- Positioning statement: ${pos.positioningStatement || "N/A"}
- Point of view: ${pos.pointOfView || "N/A"}
- Competitors: ${pos.competitors?.map((c) => `${c.name} (${c.howYouDiffer})`).join("; ") || "N/A"}`);
  }

  if (brandDNA.voice?.primaryArchetype) {
    const voice = brandDNA.voice;
    const style = voice.communicationStyle;
    sections.push(`## Voice & Tone
- Primary archetype: ${voice.primaryArchetype}
- Secondary archetype: ${voice.secondaryArchetype || "N/A"}
- Tone attributes: ${voice.toneAttributes?.join(", ") || "N/A"}
- Brand persona: ${voice.brandPersona || "N/A"}
- Formality/casual scale: ${style?.formalityCasual ?? "N/A"}/10
- Technical/simple scale: ${style?.technicalSimple ?? "N/A"}/10
- Provocative/nurturing scale: ${style?.provocativeNurturing ?? "N/A"}/10
- Always use words: ${voice.alwaysWords?.join(", ") || "N/A"}
- Never use words: ${voice.neverWords?.join(", ") || "N/A"}`);
  }

  if (brandDNA.story?.originStory) {
    const story = brandDNA.story;
    sections.push(`## Brand Story
- Origin: ${story.originStory}
- Transformation moment: ${story.transformationMoment || "N/A"}
- Mission: ${story.mission || "N/A"}
- Vision: ${story.vision || "N/A"}
- Core values: ${story.coreValues?.join(", ") || "N/A"}
- Villain: ${story.villain || "N/A"}`);
  }

  if (brandDNA.messaging?.oneLiner) {
    const msg = brandDNA.messaging;
    sections.push(`## Messaging
- One-liner: ${msg.oneLiner}
- Tagline: ${msg.tagline || "N/A"}
- Key messages: ${msg.keyMessages?.join("; ") || "N/A"}
- Brand script hero: ${msg.brandScript?.hero || "N/A"}
- Brand script problem: External: ${msg.brandScript?.problem?.external || "N/A"}, Internal: ${msg.brandScript?.problem?.internal || "N/A"}, Philosophical: ${msg.brandScript?.problem?.philosophical || "N/A"}
- Brand script success: ${msg.brandScript?.success || "N/A"}
- Brand script failure: ${msg.brandScript?.failure || "N/A"}`);
  }

  if (brandDNA.contentDNA?.themes?.length) {
    const content = brandDNA.contentDNA;
    sections.push(`## Content DNA
- Themes: ${content.themes?.join(", ") || "N/A"}
- Hook styles: ${content.hookStyles?.join(", ") || "N/A"}
- Storytelling patterns: ${content.storytellingPatterns?.join(", ") || "N/A"}
- CTA style: ${content.ctaStyle || "N/A"}
- Platforms: ${content.platforms?.join(", ") || "N/A"}
- Cadence: ${content.cadence || "N/A"}`);
  }

  return sections.length > 0
    ? `\n\n# BRAND DNA CONTEXT\n\n${sections.join("\n\n")}`
    : "";
}

export async function POST(req: Request) {
  const {
    slug,
    params,
    brandDNA,
  }: {
    slug: string;
    params?: Record<string, string>;
    brandDNA: BrandDNA;
  } = await req.json();

  const generator = getGenerator(slug);
  if (!generator) {
    return new Response(JSON.stringify({ error: "Unknown generator" }), {
      status: 400,
    });
  }

  const systemPrompt = GENERATOR_PROMPTS[slug];
  if (!systemPrompt) {
    return new Response(JSON.stringify({ error: "No prompt for generator" }), {
      status: 400,
    });
  }

  const brandContext = buildBrandContext(brandDNA);

  let userPrompt = `Generate the ${generator.name} output for this brand.`;
  if (params && Object.keys(params).length > 0) {
    const paramLines = Object.entries(params)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n");
    userPrompt += `\n\nAdditional parameters:\n${paramLines}`;
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt + brandContext,
    prompt: userPrompt,
  });

  return result.toTextStreamResponse();
}
