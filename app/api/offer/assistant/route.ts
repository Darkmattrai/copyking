import { NextRequest } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";

import { anthropic } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import {
  toAnthropicMessages,
  type ChatClientMessage,
} from "@/lib/chat/attachments-server";
import { buildAssistantSystem, UPDATE_TOOL } from "@/lib/offer/assistant";
import { fetchUrlText, READ_URL_TOOL } from "@/lib/chat/fetch-url";
import { logUsage } from "@/lib/usage/log";
import type { Product } from "@/lib/offer/schema";

export const runtime = "nodejs";
export const maxDuration = 120;

// Streaming offer assistant. Chats, reads attachments, and writes into the
// builder via the update_offer tool — the tool call is streamed to the client,
// which applies it to the offer store. SSE: {text} | {tool,input} | [DONE].
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

  let messages: ChatClientMessage[] = [];
  let brandContext = "";
  let product: Product | null = null;
  try {
    const body = await req.json();
    messages = body.messages ?? [];
    brandContext = typeof body.brandContext === "string" ? body.brandContext : "";
    product = body.product ?? null;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiMessages = await toAnthropicMessages(messages);
  const model = process.env.OFFER_MODEL ?? "claude-sonnet-4-6";
  const system = buildAssistantSystem(brandContext, product);
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
            system,
            messages: convo,
            tools: [UPDATE_TOOL, READ_URL_TOOL],
          });

          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              send({ text: event.delta.text });
            }
          }

          const final = await stream.finalMessage();
          await logUsage({
            userId: user.id,
            feature: "offer-assistant",
            model,
            usage: final.usage,
          });

          const toolUses = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          if (final.stop_reason === "tool_use" && toolUses.length) {
            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const tu of toolUses) {
              if (tu.name === "read_url") {
                const url = (tu.input as { url?: string })?.url || "";
                send({ note: `Reading ${url}` });
                const content = await fetchUrlText(url);
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: tu.id,
                  content: `Content of ${url}:\n\n${content}`,
                });
              } else {
                // update_offer — applied client-side
                send({ tool: tu.name, input: tu.input });
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: tu.id,
                  content: "Applied to the builder.",
                });
              }
            }
            convo = [
              ...convo,
              { role: "assistant", content: final.content },
              { role: "user", content: toolResults },
            ];
            continue; // loop so the assistant confirms in text
          }
          break;
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        send({ error: err instanceof Error ? err.message : "Stream error" });
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
