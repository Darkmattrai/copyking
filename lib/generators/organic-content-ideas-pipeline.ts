import { generateText, streamText } from "ai";
import { openai } from "@ai-sdk/openai";

const MODEL = "gpt-4o-mini";

const SKELETON_INSTRUCTION = `# STAGE OVERRIDE: SKELETON-ONLY MODE

For this call ONLY, IGNORE the "OUTPUT FORMAT" section in the system prompt above. Output ONLY a compact 30-day calendar skeleton — exactly 30 lines, nothing else.

Use this exact line format (one day per line, pipe-separated):

Day [N] | [PILLAR] | [Format] | Topic: [≤8 words specific to their niche, in their voice] | Hook: [≤8 words, scroll-stopping]

Rules:
- N = 1 to 30
- PILLAR = TEACH | PROVE | STORY | RELATE | CONVERT | CONNECT — never repeat the same pillar two days in a row
- Format = Reel | Carousel | Single Image | Story Set
- Pillar mix target: ~25% TEACH, ~15% PROVE, ~20% STORY, ~15% RELATE, ~15% CONVERT, ~10% CONNECT
- Format mix target: 60-70% Reels, 30-40% Carousels, single images <10%
- Topics must pull directly from the user's Brand DNA (niche, ICP pain points, offer, story). No generic content.
- Hooks must be in their voice — pull from their Content DNA hook styles.

Do NOT output any of: Calendar Overview, per-day field expansions, week headers, playbooks, trend-jacking templates, evergreen themes, checklists, batching workflows, commentary, or markdown headers.

Output exactly 30 lines. Stop.`;

const OVERVIEW_INSTRUCTION = `# STAGE OVERRIDE: CALENDAR OVERVIEW ONLY

Output ONLY the "### Calendar Overview" section as defined in the OUTPUT FORMAT in the system prompt above:
- Start with the header: ### Calendar Overview
- 2-3 sentences tying the 30 days to their offer, ICP, and primary goal — using the skeleton above as your reference for what's coming
- State the projected pillar mix
- State the "north star" metric for the month (pick ONE: sends, saves, profile clicks, or DMs)

Stop immediately after the overview. Do NOT output any day blocks, week headers, or appendix sections.`;

const APPENDIX_INSTRUCTION = `# STAGE OVERRIDE: APPENDIX ONLY

Output ONLY the appendix sections, in this exact order, using the exact headers from the OUTPUT FORMAT:

1. ### Reel-Specific Playbook
2. ### Carousel-Specific Playbook
3. ### Story Strategy (Run Daily Across the Month)
4. ### Broadcast Channel + Notes + Threads Strategy
5. ### 5 Trend-Jacking Templates (Brand-Adapted)
6. ### 3 Evergreen Content Themes (Recyclable Monthly)
7. ### Saves & Sends Optimization Checklist (Run Before Publishing Each Post)
8. ### Content Batching Workflow (Build a Week in 2 Hours)

Each section must be brand-specific (pull from their Brand DNA, not generic). Do NOT regenerate the Calendar Overview or any daily entries.`;

function weekInstruction(weekNumber: 1 | 2 | 3 | 4, dayRange: string): string {
  return `# STAGE OVERRIDE: WEEK ${weekNumber} ONLY (${dayRange})

Output ONLY Week ${weekNumber} of the calendar.

Start with this header line, replacing the bracket with a real 1-line weekly theme tied to their offer:
### Week ${weekNumber} — [theme]

Then output the FULL per-day field block for each day in ${dayRange}, EXACTLY as defined under "30-Day Calendar" in the OUTPUT FORMAT (every field: Topic/Angle, Hook, Caption Hook, Body Direction, Save Trigger, Send Trigger, CTA Type, CTA Copy, SEO Keyword Target, Hashtags, Optimal Post Window, Primary Metric Target, plus Estimated 3-sec hold rate for Reels).

PRESERVE the Pillar, Format, Topic, and Hook from the SKELETON above for each day exactly as drafted. Expand every other field specifically for that day, in their voice, using their Brand DNA.

Stop after the last day in ${dayRange}. Do NOT output the Calendar Overview, other weeks, or any appendix sections.`;
}

function withSkeleton(skeleton: string, instruction: string): string {
  return `# 30-DAY SKELETON (already drafted — preserve every Pillar, Format, Topic, and Hook)

${skeleton}

${instruction}`;
}

export async function streamOrganicContentIdeas({
  systemPrompt,
  userPrompt,
}: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<Response> {
  console.log("[organic-content-ideas-pipeline] starting multi-step generation");
  const skeletonStart = Date.now();
  const skeletonResult = await generateText({
    model: openai(MODEL),
    system: `${systemPrompt}\n\n${SKELETON_INSTRUCTION}`,
    prompt: userPrompt,
  });
  const skeleton = skeletonResult.text.trim();
  console.log(
    `[organic-content-ideas-pipeline] skeleton ready in ${Date.now() - skeletonStart}ms, ${skeleton.split("\n").length} lines`,
  );

  const stageSystem = (instruction: string) =>
    `${systemPrompt}\n\n${withSkeleton(skeleton, instruction)}`;

  const orderedStreams = [
    streamText({
      model: openai(MODEL),
      system: stageSystem(OVERVIEW_INSTRUCTION),
      prompt: userPrompt,
    }),
    streamText({
      model: openai(MODEL),
      system: stageSystem(weekInstruction(1, "Days 1-7")),
      prompt: userPrompt,
    }),
    streamText({
      model: openai(MODEL),
      system: stageSystem(weekInstruction(2, "Days 8-14")),
      prompt: userPrompt,
    }),
    streamText({
      model: openai(MODEL),
      system: stageSystem(weekInstruction(3, "Days 15-21")),
      prompt: userPrompt,
    }),
    streamText({
      model: openai(MODEL),
      system: stageSystem(weekInstruction(4, "Days 22-30")),
      prompt: userPrompt,
    }),
    streamText({
      model: openai(MODEL),
      system: stageSystem(APPENDIX_INSTRUCTION),
      prompt: userPrompt,
    }),
  ];

  const encoder = new TextEncoder();
  const responseStream = new ReadableStream({
    async start(controller) {
      try {
        for (let i = 0; i < orderedStreams.length; i++) {
          for await (const chunk of orderedStreams[i].textStream) {
            controller.enqueue(encoder.encode(chunk));
          }
          if (i < orderedStreams.length - 1) {
            controller.enqueue(encoder.encode("\n\n"));
          }
        }
        controller.close();
      } catch (err) {
        console.error("[organic-content-ideas-pipeline] stream error", err);
        controller.error(err);
      }
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
