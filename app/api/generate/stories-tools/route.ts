import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { BrandDNA } from "@/types/brand";

export const maxDuration = 120;

const MODEL = "gpt-4o-mini";

const BRAND_CONTEXT_BLOCK = `
You will receive the user's complete Brand DNA as context. USE IT for every line you write. Reference their specific niche, ICP, offer, positioning, voice, story, messaging, and content DNA.
CRITICAL: Never use placeholder text like [YOUR PRODUCT] or [AUDIENCE]. Fill everything with their actual brand data.
`;

const TOOL_PROMPTS: Record<string, string> = {
  variants: `You are an elite Instagram Stories copywriter. Given the existing story slides, generate 2 alternative variants for the specified slide(s).

${BRAND_CONTEXT_BLOCK}

For each variant, keep the same funnel role and sticker type but write a DIFFERENT headline, body text, visual direction, image recommendation, and sticker copy. The variant should target the same expected signal but take a different creative angle.

OUTPUT FORMAT — Follow this exactly for each variant:

### Variant A
**Headline:** <new headline, ≤6 words>
**Body text:** <new body, ≤20 words or "—">
**Visual direction:** <new 2-3 sentence direction>
**Image recommendation:** <new specific image type>
**Sticker:** type=<same type> — copy: "<new sticker copy>"
**Creative angle:** <1 sentence explaining what's different>

### Variant B
(same structure)

RULES:
- Each variant must be meaningfully different — not just synonym swaps.
- Maintain the brand voice exactly.
- Keep headline ≤6 words, body ≤20 words.`,

  "reel-convert": `You are a Reels scriptwriter who converts Instagram Story series into 30-60 second Reel scripts.

${BRAND_CONTEXT_BLOCK}

Given a complete Story series (slides with headlines, body, visual direction, and funnel roles), convert the narrative arc into a single vertical Reel script.

OUTPUT FORMAT:

## Reel Script — [Title based on hook angle]

**Duration:** <30s or 60s based on content density>
**Aspect ratio:** 1080x1920 (9:16)
**Audio:** <Original voiceover / trending audio recommendation>

### Scene 1 — 0-3s (Hook)
**On-screen text:** "<exact text>"
**Voiceover:** "<exact words spoken>"
**Visual:** <shot direction>
**Transition:** <cut type>

### Scene 2 — 3-8s
(same format)

### Scene 3 — 8-15s
(same format)

### Scene 4 — 15-22s
(same format)

### Scene 5 — 22-30s (CTA)
(same format)

(Add scenes 6-8 if 60s version)

## Caption
<Full caption, ≤300 chars, with hook + CTA + 3-5 hashtags>

## Thumbnail Direction
<Describe the ideal first-frame thumbnail: composition, text, expression>

RULES:
- The Reel must tell a complete story that stands alone.
- First 3 seconds must be a pattern interrupt.
- Every scene must work muted (on-screen text carries the message).
- Use the ICP's exact pain language from Brand DNA.`,

  "dm-flow": `You are a DM automation expert who builds ManyChat-compatible DM flows for Instagram.

${BRAND_CONTEXT_BLOCK}

Given the existing DM Nurture Ladder from the Story series, expand it into a complete automated DM flow with branching logic.

OUTPUT FORMAT:

## DM Automation Flow

### Trigger
**Keyword:** <the trigger keyword from the series>
**Trigger source:** Story reply / DM keyword / Comment keyword

### Message 1 — Instant Reply (0 seconds)
**Message:** "<full message, ≤300 chars>"
**Button(s):** [Button label] → leads to Message 2A or 2B
**Wait:** 0s

### Message 2A — If clicked [Button A]
**Message:** "<full message>"
**Action:** <Tag user as "interested-[topic]">
**Wait:** 2 minutes

### Message 2B — If clicked [Button B]
**Message:** "<full message>"
**Action:** <Tag user as "browsing">
**Wait:** 5 minutes

### Message 3 — Value Delivery
**Message:** "<full message with the promised resource/value>"
**Attachment:** <describe what to attach: PDF, link, voice note>
**Wait:** 24 hours

### Message 4 — Follow-up (Day 2)
**Message:** "<check-in message>"
**Button(s):** [Ready to learn more] → Message 5 | [Not now] → End
**Wait:** 24 hours

### Message 5 — Bridge to Offer
**Message:** "<bridge message connecting to the paid offer>"
**CTA:** <specific action: book call link, checkout link, etc.>

### No-Response Sequence
**After 24h no reply:** "<gentle bump message>"
**After 72h no reply:** "<final value-add message, no pressure>"

## ManyChat Setup Notes
- <Which nodes to create>
- <Tag naming convention>
- <Growth tool recommendation (Story mention, comment trigger, etc.)>

RULES:
- Every message must feel like a real person talking, not a bot.
- Use the brand's voice archetype and tone from Brand DNA.
- Include specific value in every message — never just "hey, you there?"
- Max 300 chars per message (Instagram DM best practice).`,

  calendar: `You are an Instagram Stories content calendar strategist.

${BRAND_CONTEXT_BLOCK}

Given the 3 weekly themes from the existing Story series, generate a full 7-day Story content calendar with one series per day mapped to a theme.

OUTPUT FORMAT:

## 7-Day Stories Calendar

### Monday — Theme: [Theme A name]
**Series angle:** <specific angle for this day>
**Slide count:** <5/9/13>
**Hook headline:** "<≤6 words>"
**Primary sticker:** <type>
**CTA:** <specific CTA>
**Best post time:** <time + reason>

### Tuesday — Theme: [Theme B name]
(same format)

### Wednesday — Theme: [Theme C name]
(same format)

### Thursday — Theme: [Theme A name — different angle]
(same format)

### Friday — Theme: [Theme B name — different angle]
(same format)

### Saturday — Theme: [Community / BTS]
(same format)

### Sunday — Theme: [Theme C name — different angle]
(same format)

## Weekly Rhythm Notes
- <Which days to emphasize engagement vs. conversion>
- <How to repurpose top-performing series>
- <Highlight rotation schedule>

RULES:
- Every day must have a different angle — no repeats.
- Match the brand voice and ICP language.
- Alternate between DM-focused and engagement-focused CTAs.`,

  "audience-tone": `You are a brand voice adaptation specialist.

${BRAND_CONTEXT_BLOCK}

Given an existing Story series, rewrite ALL slides for a different audience temperature (cold, warm, or hot). The user will specify the target temperature.

AUDIENCE TEMPERATURES:
- **Cold** (strangers): Lead with pain/curiosity, no jargon, no assumptions about awareness. Heavier pattern interrupts. CTA = low-commitment (poll, quiz, follow).
- **Warm** (engaged followers): Can reference shared context. Use insider language. CTA = medium-commitment (DM keyword, link sticker).
- **Hot** (buyers/superfans): Direct, skip the education. Reference past purchases/engagement. CTA = high-commitment (buy now, book call, join waitlist).

OUTPUT FORMAT:

## [Temperature] Audience Version

### Slide 1 — [Funnel role]
**Headline:** <≤6 words>
**Body text:** <≤20 words or "—">
**Visual direction:** <2-3 sentences>
**Image recommendation:** <specific image type>
**Sticker:** type=<type> — copy: "<copy>"
**Retention tactic:** <tactic>
**Expected signal:** <signal>
**Tone shift note:** <1 sentence on what changed and why>

(repeat for all slides)

## Adaptation Summary
- **Key changes:** <3-5 bullet points on what shifted>
- **CTA adjustment:** <how the CTA changed for this temperature>
- **Sticker strategy shift:** <how sticker choices changed>

RULES:
- Keep the same slide count and funnel role sequence.
- The creative angle can shift dramatically based on temperature.
- Cold audiences need more slides before the CTA.
- Hot audiences can get to the CTA faster.`,

  "cross-platform": `You are a cross-platform social media content strategist.

${BRAND_CONTEXT_BLOCK}

Given an existing Instagram Story series, adapt it for a different platform. The user will specify the target platform.

PLATFORM SPECS:
- **TikTok Stories**: 15s per slide, 1080x1920, can use effects/sounds, shorter text, more casual tone. Max ~60 slides but 5-15 optimal.
- **Facebook Stories**: Same 9:16 as IG but older demographic (35-55). Simpler language, more explicit CTAs. Link stickers available.
- **YouTube Shorts**: Not stories — convert to a single 15-60s vertical video script. Must hook in 1s. Comments are the engagement driver.

OUTPUT FORMAT:

## [Platform] Adaptation

### Platform-Specific Changes
- **Format:** <how the format changes>
- **Tone shift:** <how voice adapts>
- **CTA adaptation:** <platform-native CTA approach>
- **Technical specs:** <resolution, duration, safe zones>

### Adapted Slides

#### Slide 1 — [Funnel role]
**Headline:** <adapted, ≤6 words>
**Body text:** <adapted, ≤20 words>
**Visual direction:** <platform-specific direction>
**Platform feature:** <what platform-native feature to use (TikTok effect, FB sticker, etc.)>

(repeat for all slides)

### Platform-Specific Strategy
- **Posting time:** <platform-specific optimal time>
- **Hashtags/SEO:** <platform-specific discovery tactics>
- **Engagement strategy:** <how to drive engagement on this platform>

RULES:
- Respect each platform's native culture and UX.
- YouTube Shorts adaptation should be a single video script, not slides.
- Facebook needs simpler language and clearer CTAs.
- TikTok can be more raw/casual.`,
};

function buildBrandContext(brandDNA: BrandDNA): string {
  const sections: string[] = [];

  if (brandDNA.niche?.marketCategory) {
    sections.push(`## Niche: ${brandDNA.niche.marketCategory} — ${brandDNA.niche.subNiche || "N/A"}`);
  }
  if (brandDNA.icp?.name) {
    const icp = brandDNA.icp;
    sections.push(`## ICP: ${icp.name}
- Pain points: ${icp.painPoints?.join("; ") || "N/A"}
- Dream outcome: ${icp.dreamOutcome || "N/A"}
- Platforms: ${icp.platforms?.join(", ") || "N/A"}`);
  }
  if (brandDNA.offer?.dreamOutcome) {
    sections.push(`## Offer: ${brandDNA.offer.dreamOutcome} — ${brandDNA.offer.pricePoint || "N/A"}`);
  }
  if (brandDNA.positioning?.uniqueMechanism) {
    sections.push(`## Positioning: ${brandDNA.positioning.uniqueMechanism}`);
  }
  if (brandDNA.voice?.primaryArchetype) {
    sections.push(`## Voice: ${brandDNA.voice.primaryArchetype} / ${brandDNA.voice.secondaryArchetype || "N/A"}
- Tone: ${brandDNA.voice.toneAttributes?.join(", ") || "N/A"}
- Always: ${brandDNA.voice.alwaysWords?.join(", ") || "N/A"}
- Never: ${brandDNA.voice.neverWords?.join(", ") || "N/A"}`);
  }
  if (brandDNA.messaging?.oneLiner) {
    sections.push(`## Messaging: ${brandDNA.messaging.oneLiner}`);
  }

  return sections.length > 0
    ? `\n\n# BRAND DNA\n\n${sections.join("\n\n")}`
    : "";
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured: OPENAI_API_KEY missing" }),
      { status: 500 },
    );
  }

  let body: {
    tool: string;
    slides?: Array<{
      index: number;
      funnelRole: string;
      headline: string;
      body: string;
      visualDirection: string;
      imageRecommendation: string;
      sticker: { type: string; copy: string };
      retentionTactic: string;
      expectedSignal: string;
    }>;
    overview?: {
      objective: string;
      hookAngle: string;
      primaryCta: string;
      postingTime: string;
    };
    nurtureLadder?: string;
    themes?: string;
    slideIndex?: number;
    targetTemperature?: string;
    targetPlatform?: string;
    brandDNA?: BrandDNA;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
    });
  }

  const { tool, slides, overview, nurtureLadder, themes, slideIndex, targetTemperature, targetPlatform, brandDNA } = body;

  const systemPrompt = TOOL_PROMPTS[tool];
  if (!systemPrompt) {
    return new Response(JSON.stringify({ error: `Unknown tool: ${tool}` }), {
      status: 400,
    });
  }

  const brandContext = brandDNA ? buildBrandContext(brandDNA) : "";

  // Build user prompt based on tool
  let userPrompt = "";

  if (tool === "variants") {
    const targetSlide = slideIndex !== undefined && slides
      ? slides[slideIndex]
      : slides?.[0];
    if (!targetSlide) {
      return new Response(JSON.stringify({ error: "No slide specified" }), { status: 400 });
    }
    userPrompt = `Generate 2 variants for this slide:

Slide ${targetSlide.index} — ${targetSlide.funnelRole}
Headline: ${targetSlide.headline}
Body: ${targetSlide.body}
Visual direction: ${targetSlide.visualDirection}
Image recommendation: ${targetSlide.imageRecommendation}
Sticker: type=${targetSlide.sticker.type} — copy: "${targetSlide.sticker.copy}"
Retention tactic: ${targetSlide.retentionTactic}
Expected signal: ${targetSlide.expectedSignal}

Context — Series overview:
Objective: ${overview?.objective || "N/A"}
Hook angle: ${overview?.hookAngle || "N/A"}
Primary CTA: ${overview?.primaryCta || "N/A"}`;
  } else if (tool === "reel-convert") {
    const slidesList = slides
      ?.map(
        (s) =>
          `Slide ${s.index} — ${s.funnelRole}: "${s.headline}" / "${s.body}" / Visual: ${s.visualDirection}`,
      )
      .join("\n");
    userPrompt = `Convert this Instagram Story series into a Reel script:

Series overview:
- Objective: ${overview?.objective || "N/A"}
- Hook angle: ${overview?.hookAngle || "N/A"}
- Primary CTA: ${overview?.primaryCta || "N/A"}

Slides:
${slidesList || "N/A"}`;
  } else if (tool === "dm-flow") {
    userPrompt = `Build a complete DM automation flow from this nurture ladder:

${nurtureLadder || "No nurture ladder provided — generate a standard DM flow based on the series CTA."}

Series CTA: ${overview?.primaryCta || "N/A"}
Objective: ${overview?.objective || "N/A"}`;
  } else if (tool === "calendar") {
    userPrompt = `Generate a 7-day Stories content calendar based on these weekly themes:

${themes || "No themes provided — generate 3 themes from the brand DNA and build the calendar."}

Series overview:
- Objective: ${overview?.objective || "N/A"}
- Primary CTA: ${overview?.primaryCta || "N/A"}`;
  } else if (tool === "audience-tone") {
    const slidesList = slides
      ?.map(
        (s) =>
          `Slide ${s.index} — ${s.funnelRole}\nHeadline: ${s.headline}\nBody: ${s.body}\nVisual: ${s.visualDirection}\nSticker: type=${s.sticker.type} — copy: "${s.sticker.copy}"\nRetention: ${s.retentionTactic}\nSignal: ${s.expectedSignal}`,
      )
      .join("\n\n");
    userPrompt = `Rewrite this entire Story series for a ${targetTemperature?.toUpperCase() || "WARM"} audience:

Current slides:
${slidesList || "N/A"}

Series overview:
- Objective: ${overview?.objective || "N/A"}
- Hook angle: ${overview?.hookAngle || "N/A"}
- Primary CTA: ${overview?.primaryCta || "N/A"}`;
  } else if (tool === "cross-platform") {
    const slidesList = slides
      ?.map(
        (s) =>
          `Slide ${s.index} — ${s.funnelRole}: "${s.headline}" / "${s.body}" / Sticker: ${s.sticker.type}`,
      )
      .join("\n");
    userPrompt = `Adapt this Instagram Story series for ${targetPlatform?.toUpperCase() || "TIKTOK"}:

Current slides:
${slidesList || "N/A"}

Series overview:
- Objective: ${overview?.objective || "N/A"}
- Primary CTA: ${overview?.primaryCta || "N/A"}`;
  }

  try {
    const result = streamText({
      model: openai(MODEL),
      system: systemPrompt + brandContext,
      prompt: userPrompt,
      onError({ error }) {
        const e = error as { name?: string; message?: string };
        console.error(`[stories-tools] error tool=${tool}`, {
          name: e?.name,
          message: e?.message,
        });
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    const e = err as { message?: string };
    console.error(`[stories-tools] sync error tool=${tool}`, e?.message);
    return new Response(
      JSON.stringify({ error: e?.message ?? "Unknown error" }),
      { status: 500 },
    );
  }
}
