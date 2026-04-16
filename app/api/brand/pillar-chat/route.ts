import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";

import { PILLAR_SYSTEM_PROMPTS } from "@/lib/brand/prompts";
import type { PillarKey } from "@/types/brand";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, pillar, context }: {
    messages: UIMessage[];
    pillar: PillarKey;
    context?: string;
  } = await req.json();

  const systemPrompt = PILLAR_SYSTEM_PROMPTS[pillar];
  if (!systemPrompt) {
    return new Response(JSON.stringify({ error: "Invalid pillar" }), {
      status: 400,
    });
  }

  const contextBlock = context
    ? `\n\nHere's what we already know about this person's brand from their initial interview:\n${context}\n\nUse this context to personalize your questions and avoid asking about things they've already covered. Build on what we know.`
    : "";

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt + contextBlock,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
