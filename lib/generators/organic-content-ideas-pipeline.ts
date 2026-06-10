import { generateText, streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const MODEL = "claude-sonnet-4-6";
const MAX_OUTPUT_TOKENS = 8192;

const SKELETON_INSTRUCTION = `# STAGE OVERRIDE: SKELETON-ONLY MODE

For this call ONLY, IGNORE the "OUTPUT FORMAT" section in the system prompt above. Output ONLY a compact 30-day calendar skeleton — exactly 30 lines, nothing else.

Use this exact line format (one day per line, pipe-separated):

Day [N] | [PILLAR] | [Format] | Topic: [≤8 words specific to their niche, in their voice] | Hook: [≤8 words, scroll-stopping]

Rules:
- N = 1 to 30 (you MUST output every day from 1 through 30 with no gaps)
- PILLAR = TEACH | PROVE | STORY | RELATE | CONVERT | CONNECT — never repeat the same pillar two days in a row
- Format = Reel | Carousel | Single Image | Story Set
- Pillar mix target: ~25% TEACH, ~15% PROVE, ~20% STORY, ~15% RELATE, ~15% CONVERT, ~10% CONNECT
- Format mix target: 60-70% Reels, 30-40% Carousels, single images <10%
- Topics must pull directly from the user's Brand DNA (niche, ICP pain points, offer, story). No generic content.
- Hooks must be in their voice — pull from their Content DNA hook styles.

Do NOT output any of: Calendar Overview, per-day field expansions, week headers, scripts, playbooks, trend-jacking templates, evergreen themes, checklists, batching workflows, commentary, or markdown headers.

Output exactly 30 lines. Every day from 1 to 30 must appear. Stop.`;

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

type DayChunk = {
  startDay: number;
  endDay: number;
  weekHeader: string | null;
};

const DAY_CHUNKS: DayChunk[] = [
  { startDay: 1, endDay: 4, weekHeader: "### Week 1 — [1-line theme tied to their offer]" },
  { startDay: 5, endDay: 7, weekHeader: null },
  { startDay: 8, endDay: 11, weekHeader: "### Week 2 — [1-line theme tied to their offer]" },
  { startDay: 12, endDay: 14, weekHeader: null },
  { startDay: 15, endDay: 18, weekHeader: "### Week 3 — [1-line theme tied to their offer]" },
  { startDay: 19, endDay: 21, weekHeader: null },
  { startDay: 22, endDay: 25, weekHeader: "### Week 4 — [1-line theme tied to their offer]" },
  { startDay: 26, endDay: 30, weekHeader: null },
];

function dayList(start: number, end: number): string {
  const days: string[] = [];
  for (let d = start; d <= end; d++) days.push(`Day ${d}`);
  return days.join(", ");
}

function chunkInstruction(chunk: DayChunk): string {
  const enumerated = dayList(chunk.startDay, chunk.endDay);
  const count = chunk.endDay - chunk.startDay + 1;
  const headerLine = chunk.weekHeader
    ? `Start with this week header on its own line, replacing the bracket with a real theme:\n${chunk.weekHeader}\n\nThen output every day below.`
    : "Do NOT output any week header — this chunk continues the previous week. Start directly with the first day's block.";

  return `# STAGE OVERRIDE: DAYS ${chunk.startDay}-${chunk.endDay} ONLY

You MUST output exactly ${count} days: ${enumerated}.

${headerLine}

For EACH of those ${count} days, output the FULL day block as defined under "30-Day Calendar" in the OUTPUT FORMAT — both PART A (planning fields) AND PART B (ready-to-post script). Both parts are mandatory. Do not skip Part B.

PRESERVE the Pillar, Format, Topic, and Hook from the SKELETON above for each day exactly as drafted. Expand every other field (Caption Hook, Save Trigger, Send Trigger, CTA Type, SEO Keyword, Hashtags, Optimal Post Window, Primary Metric Target) AND the FULL ready-to-post script (scene-by-scene for Reels / slide-by-slide for Carousels / full caption for Single Images / frame-by-frame for Story Sets) specifically for that day, in their voice, using their Brand DNA verbatim — no placeholder text.

After the last day in this chunk, STOP. Do NOT output the Calendar Overview, days outside ${chunk.startDay}-${chunk.endDay}, week summaries, transition paragraphs, or any appendix sections.

Verify before stopping: did you output all of ${enumerated}? If any are missing, output them now.`;
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
    model: anthropic(MODEL),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
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
      model: anthropic(MODEL),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      system: stageSystem(OVERVIEW_INSTRUCTION),
      prompt: userPrompt,
    }),
    ...DAY_CHUNKS.map((chunk) =>
      streamText({
        model: anthropic(MODEL),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
        system: stageSystem(chunkInstruction(chunk)),
        prompt: userPrompt,
      }),
    ),
    streamText({
      model: anthropic(MODEL),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
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
