import type { BrandDNA } from "@/types/brand";
import { ANTI_AI_LINGO } from "@/lib/generators/prompts";

// On-demand generators for the Highlights & Pinned Posts tabs of the IG bio tool.
// Each produces a ready-to-shoot script for a specific item, in a chosen format.

export const CONTENT_SYSTEM_PROMPT = `You are a world-class Instagram content scriptwriter and short-form director. You script Story Highlights, Reels, and Carousels for personal brands that convert strangers into followers and followers into buyers. You write tight, concrete, human copy — the kind a real creator would actually film.

CRITICAL — YOU ARE A ONE-SHOT GENERATOR. The user cannot reply to you. So:
- NEVER ask the user a question, request clarification, or stop to "flag" something. Always output the finished script.
- The user's intake answers are the SOURCE OF TRUTH — build the script from them first.
- If the brand context contains contradictions or off-topic/placeholder data, IGNORE the parts that don't fit the user's intake answers and the dominant, most coherent narrative. Make the call yourself and write a clean, single-story script.
- If you must make an assumption, you may note it in ONE short italic line at the very top — then deliver the full script anyway. Never withhold the script.

${ANTI_AI_LINGO}`;

const FORMAT_INSTRUCTIONS: Record<string, string> = {
  highlight: `OUTPUT FORMAT — STORY HIGHLIGHT (a tap-through highlight, NOT a reel):
- Write 10–15 STORY FRAMES for the narrative (do NOT count the proof frames in this number). Be descriptive and take your time — build the full story across the frames; never compress it into 5.
For each frame:
**Frame N**
- On-screen text: <a short, punchy line>
- Visual: <what to show — DEFAULT TO A PHOTO/IMAGE. Keep the mix MOSTLY IMAGES; only occasionally suggest a short video clip.>
Do NOT put any call to action in the middle frames.
After the narrative frames, add 2–4 **SOCIAL PROOF** frames — show the transformation you created and the people you've helped (result screenshots, testimonials, before/after). Use the social proof the user provided.
The FINAL frame is the ONLY call to action.`,
  reel: `OUTPUT FORMAT — REEL:
**Hook** (first 3 seconds): on-screen text + what they say out loud — must stop the scroll.
**Beats** (3–5 numbered): for each, what to SAY, what to SHOW, and the on-screen caption.
**CTA**: the closing line + the action (DM keyword / link / follow).
**Length**: suggested seconds (e.g. 30–45s).
**Audio**: a trending or original-audio suggestion that fits.`,
  carousel: `OUTPUT FORMAT — CAROUSEL POST (6–9 slides):
**Slide 1**: the hook (the scroll-stopper).
**Slides 2–N**: one idea per slide — give the exact on-slide text.
**Final slide**: the CTA.
**Caption**: the full post caption (hook line → value → CTA).`,
};

const ITEM_BRIEFS: Record<string, string> = {
  "my-story": `TOPIC — MY STORY (the "Start Here" highlight / origin reel).
Follow this EXACT 6-beat story arc, in order. The hero is the person (or one of their clients). Map the user's answers to each beat and keep the emotional build:
1. INTRO — establish the hero + the problem. Template: "X days/years ago I was experiencing [problem] (and/or saw others experience it)."
2. INFLECTION POINT — the pain points/symptoms from that problem. Template: "Because of this I was [pains/symptoms]."
3. RISING ACTION — the failed solutions/attempts they tried. Template: "I tried [failed attempts] to fix it."
4. CLIMAX — the solution. Template: "Finally, after [time] of no results, I figured out the one thing that actually worked: [solution]."
5. FALLING ACTION — the success/results from the solution. Template: "When I started doing this, I [results / social proof]."
6. RESOLUTION — the business/service. Template: "Because of this I started [business/service] to help people just like me achieve [dream result]."
Make every beat specific and personal — never a resume or a list of credentials. Spread the arc across the 10–15 frames; don't rush.
FINAL CTA (last frame only) — this is a story, so phrase it as a DM reply, based on "Where to send them":
- If a freebie: "Reply [KEYWORD] and I'll send you [the freebie / what you'll send]."
- If a consultation: "Reply [KEYWORD] and I'll get you booked in for a free consultation."
Use the exact keyword + freebie the user provided.`,
  "how-i-help": `TOPIC — HOW I CAN HELP (highlight). Same descriptive, image-heavy, 10–15 frame structure with social-proof frames at the end. Cover: who they work with, the process/method, the precise problems they solve, and the results to expect. Concrete, not vague — spread it across the frames.
FINAL CTA (last frame only): "Comment [KEYWORD] to book a free consultation." Use the exact keyword the user provided.`,
  "about-me": `TOPIC — ABOUT ME (pinned post). Introduce the person fast: who they are, who they help, the transformation they create, and why they're credible. Hook in the first line.`,
  "what-to-expect": `TOPIC — WHAT TO EXPECT WORKING WITH ME (pinned post / reel).
Present it as these 5 parts, IN ORDER, mapped from the user's answers. The viewer should picture the whole journey clearly and feel reassured:
1. What happens the moment they become a client.
2. The onboarding steps you take them through.
3. The process you take them through to get the transformation.
4. The dream result you help them achieve.
5. The timeframe you do it in.`,
};

function brandSummary(b: BrandDNA): string {
  const lines: string[] = ["BRAND CONTEXT (use the person's real voice + facts):"];
  const push = (label: string, val?: string) => {
    if (val && val.trim()) lines.push(`- ${label}: ${val.trim()}`);
  };
  push("Niche", [b.niche.marketCategory, b.niche.subNiche].filter(Boolean).join(" — "));
  push("Who they help", b.icp.industryLabel || b.icp.demographics.jobTitle);
  push("ICP pains", b.icp.painPoints.slice(0, 3).join("; "));
  push("Dream outcome", b.offer.dreamOutcome);
  push("Offer", b.offer.grandSlamDescription);
  push("Delivery model", b.offer.deliveryModel);
  push("Origin story", b.story.originStory);
  push("Turning point", b.story.transformationMoment);
  push("Mission", b.story.mission);
  push("Villain they fight", b.story.villain);
  push("Voice archetype", [b.voice.primaryArchetype, b.voice.secondaryArchetype].filter(Boolean).join(" + "));
  return lines.join("\n");
}

export function buildContentPrompt(opts: {
  item: string;
  format: string;
  fields: Record<string, string>;
  brandDNA: BrandDNA;
}): string {
  const { item, format, fields, brandDNA } = opts;
  const answers =
    Object.entries(fields)
      .filter(([, v]) => v && v.trim())
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n") || "(none provided — rely on Brand Context)";

  return [
    brandSummary(brandDNA),
    ITEM_BRIEFS[item] ?? `TOPIC — ${item}.`,
    FORMAT_INSTRUCTIONS[format] ?? FORMAT_INSTRUCTIONS.reel,
    `THE PERSON'S SPECIFICS (primary source — build the script from these, fill gaps with Brand Context):\n${answers}`,
    `Write the script in clean markdown. Be specific to THIS person — no placeholders, no generic filler.`,
  ].join("\n\n");
}
