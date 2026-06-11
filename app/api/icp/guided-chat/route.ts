import { NextRequest } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import { INTERVIEW_SYSTEM_PROMPT } from "@/lib/icp/interview-prompt";
import { fetchUrlText, READ_URL_TOOL } from "@/lib/chat/fetch-url";
import {
  toAnthropicMessages,
  type ChatClientMessage,
} from "@/lib/chat/attachments-server";
import { logUsage } from "@/lib/usage/log";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let messages: ChatClientMessage[];
  try {
    const body = await req.json();
    messages = body.messages ?? [];
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiMessages = await toAnthropicMessages(messages);
  const model = process.env.ICP_MODEL ?? "claude-sonnet-4-6";
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        let convo: Anthropic.MessageParam[] = apiMessages;
        for (let depth = 0; depth < 5; depth++) {
          const stream = anthropic.messages.stream({
            model,
            max_tokens: 4096,
            system: INTERVIEW_SYSTEM_PROMPT,
            messages: convo,
            tools: [READ_URL_TOOL],
          });

          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              send({ text: event.delta.text });
            }
          }

          const finalMessage = await stream.finalMessage();
          await logUsage({
            userId: user.id,
            feature: "icp-chat",
            model,
            usage: finalMessage.usage,
          });

          const toolUses = finalMessage.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );
          if (finalMessage.stop_reason === "tool_use" && toolUses.length) {
            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const tu of toolUses) {
              const url = (tu.input as { url?: string })?.url || "";
              send({ note: `Reading ${url}` });
              const content = await fetchUrlText(url);
              toolResults.push({
                type: "tool_result",
                tool_use_id: tu.id,
                content: `Content of ${url}:\n\n${content}`,
              });
            }
            convo = [
              ...convo,
              { role: "assistant", content: finalMessage.content },
              { role: "user", content: toolResults },
            ];
            continue;
          }
          break;
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        send({ error: msg });
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
