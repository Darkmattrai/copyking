import { NextRequest } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import { buildOfferInterviewPrompt } from "@/lib/offer/interview-prompt";
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
  let brandContext = "";
  let hasIcp = false;
  try {
    const body = await req.json();
    messages = body.messages ?? [];
    brandContext = typeof body.brandContext === "string" ? body.brandContext : "";
    hasIcp = Boolean(body.hasIcp);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiMessages = await toAnthropicMessages(messages);
  const model = process.env.OFFER_MODEL ?? "claude-sonnet-4-6";
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model,
          max_tokens: 4096,
          system: buildOfferInterviewPrompt(brandContext, hasIcp),
          messages: apiMessages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          }
        }

        const finalMessage = await stream.finalMessage();
        await logUsage({
          userId: user.id,
          feature: "offer-chat",
          model,
          usage: finalMessage.usage,
        });

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
        );
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
