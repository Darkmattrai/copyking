import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

import { INTERVIEW_SYSTEM_PROMPT } from "@/lib/brand/prompts";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    maxOutputTokens: 4096,
    system: INTERVIEW_SYSTEM_PROMPT,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
