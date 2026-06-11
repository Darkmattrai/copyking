"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import type { ChatAttachment } from "@/lib/chat/attachments";
import { ChatAttachmentBar } from "@/components/generators/chat-attachment-bar";
import { MarkdownRenderer } from "@/components/generators/markdown-renderer";
import { UPDATE_FIELDS } from "@/lib/offer/assistant";
import type { Product } from "@/lib/offer/schema";

type Msg = {
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
  filled?: string[];
};

export function OfferAssistantDrawer({
  open,
  onClose,
  product,
  brandContext,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  brandContext: string;
  onApply: (patch: Partial<Product>) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [filledNow, setFilledNow] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, filledNow]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const applyTool = useCallback(
    (rawInput: unknown): string[] => {
      if (!rawInput || typeof rawInput !== "object") return [];
      const patch: Record<string, unknown> = {};
      const filled: string[] = [];
      for (const [k, v] of Object.entries(rawInput as Record<string, unknown>)) {
        if (UPDATE_FIELDS.includes(k) && v != null && v !== "") {
          patch[k] = v;
          filled.push(k);
        }
      }
      if (filled.length) onApply(patch as Partial<Product>);
      return filled;
    },
    [onApply],
  );

  const callChat = useCallback(
    async (msgs: Msg[]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      setStreamingText("");
      setError("");
      setFilledNow([]);
      const turnFilled: string[] = [];
      try {
        const res = await fetch("/api/offer/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: msgs.map((m) => ({
              role: m.role,
              content: m.content,
              attachments: m.attachments,
            })),
            brandContext,
            product,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const { error: e } = await res
            .json()
            .catch(() => ({ error: "Request failed" }));
          throw new Error(e);
        }
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") continue;
            try {
              const evt = JSON.parse(payload);
              if (evt.error) throw new Error(evt.error);
              if (evt.text) {
                accumulated += evt.text;
                setStreamingText(accumulated);
              }
              if (evt.tool && evt.input) {
                turnFilled.push(...applyTool(evt.input));
                setFilledNow([...turnFilled]);
              }
            } catch (err) {
              if ((err as Error).message !== "Unexpected end of JSON input") throw err;
            }
          }
        }
        setMessages([
          ...msgs,
          {
            role: "assistant",
            content: accumulated,
            filled: turnFilled.length ? [...turnFilled] : undefined,
          },
        ]);
        setStreamingText("");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    },
    [brandContext, product, applyTool],
  );

  const send = () => {
    const trimmed = input.trim();
    if ((!trimmed && !attachments.length) || isLoading) return;
    const next: Msg[] = [
      ...messages,
      {
        role: "user",
        content: trimmed,
        attachments: attachments.length ? attachments : undefined,
      },
    ];
    setMessages(next);
    setInput("");
    setAttachments([]);
    callChat(next);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background border-l border-border flex flex-col h-full shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div>
            <div className="text-sm font-semibold text-text-primary">✨ Offer Assistant</div>
            <div className="text-[11px] text-text-tertiary">Chats, reads your files, and fills the builder.</div>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary p-1 text-lg leading-none">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !streamingText && (
            <div className="text-sm text-text-tertiary">
              Tell me about your offer (or upload a transcript, deck, or notes) and I&apos;ll build it out and fill the fields for you — pulling from your Brand DNA so you barely have to type.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : ""}>
              <div
                className={`inline-block max-w-[90%] rounded-xl px-3 py-2 text-sm text-left ${
                  m.role === "user" ? "bg-accent text-white" : "bg-surface-hover text-text-primary"
                }`}
              >
                {m.role === "assistant" ? <MarkdownRenderer content={m.content} /> : m.content}
                {m.attachments?.length ? (
                  <div className="mt-1 text-[11px] opacity-80">📎 {m.attachments.map((a) => a.name).join(", ")}</div>
                ) : null}
              </div>
              {m.filled?.length ? (
                <div className="mt-1 text-[11px] text-emerald-500">✓ Filled: {m.filled.join(", ")}</div>
              ) : null}
            </div>
          ))}
          {streamingText && (
            <div>
              <div className="inline-block max-w-[90%] rounded-xl px-3 py-2 text-sm bg-surface-hover text-text-primary">
                <MarkdownRenderer content={streamingText} />
              </div>
              {filledNow.length ? (
                <div className="mt-1 text-[11px] text-emerald-500">✓ Filling: {filledNow.join(", ")}</div>
              ) : null}
            </div>
          )}
          {isLoading && !streamingText && <div className="text-xs text-text-tertiary">Thinking…</div>}
          {error && <div className="text-sm text-danger">{error}</div>}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-3 space-y-2 shrink-0">
          <ChatAttachmentBar attachments={attachments} onChange={setAttachments} />
          <div className="flex items-end gap-2">
            <textarea
              className="ck-input resize-none flex-1"
              rows={2}
              placeholder="Message the assistant…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              onClick={send}
              disabled={isLoading}
              className="ck-btn-primary !px-4 !py-2 text-sm disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
