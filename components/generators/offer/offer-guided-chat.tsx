"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ChatOfferPayload } from "@/lib/offer/brand-bridge";

type Message = { role: "user" | "assistant"; content: string };

function extractOffer(text: string): ChatOfferPayload | null {
  const match =
    text.match(/<OFFER_READY>([\s\S]*?)<\/OFFER_READY>/) ??
    text.match(/<OFFER_READY>([\s\S]*)$/);
  if (!match) return null;
  let raw = match[1].trim();
  const lastBrace = raw.lastIndexOf("}");
  if (lastBrace !== -1) raw = raw.slice(0, lastBrace + 1);
  const firstBrace = raw.indexOf("{");
  if (firstBrace > 0) raw = raw.slice(firstBrace);
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as ChatOfferPayload;
    return null;
  } catch {
    return null;
  }
}

function renderInline(text: string, keyBase: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyBase}-${i}`} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={`${keyBase}-${i}`}
          href={link[2]}
          className="text-accent underline hover:text-accent-hover"
        >
          {link[1]}
        </a>
      );
    }
    return <span key={`${keyBase}-${i}`}>{part}</span>;
  });
}

function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    const items = listItems;
    const k = key++;
    blocks.push(
      listType === "ol" ? (
        <ol key={`ol-${k}`} className="list-decimal pl-5 space-y-1 my-2">
          {items.map((it, i) => (
            <li key={i}>{renderInline(it, `ol-${k}-${i}`)}</li>
          ))}
        </ol>
      ) : (
        <ul key={`ul-${k}`} className="list-disc pl-5 space-y-1 my-2">
          {items.map((it, i) => (
            <li key={i}>{renderInline(it, `ul-${k}-${i}`)}</li>
          ))}
        </ul>
      ),
    );
    listItems = [];
    listType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    const heading = line.match(/^#{1,4}\s+(.*)$/);

    if (bullet) {
      if (listType === "ol") flushList();
      listType = "ul";
      listItems.push(bullet[1]);
    } else if (numbered) {
      if (listType === "ul") flushList();
      listType = "ol";
      listItems.push(numbered[1]);
    } else {
      flushList();
      if (heading) {
        blocks.push(
          <p key={`h-${key++}`} className="font-semibold mt-3 mb-1">
            {renderInline(heading[1], `h-${key}`)}
          </p>,
        );
      } else if (line.trim() !== "") {
        blocks.push(
          <p key={`p-${key++}`} className="my-1.5">
            {renderInline(line, `p-${key}`)}
          </p>,
        );
      }
    }
  }
  flushList();
  return <>{blocks}</>;
}

function Bubble({ msg, streaming }: { msg: Message; streaming?: boolean }) {
  const isUser = msg.role === "user";
  const display = msg.content
    .replace(/<OFFER_READY>[\s\S]*?<\/OFFER_READY>/g, "")
    .replace(/<OFFER_READY>[\s\S]*$/, "")
    .trim();

  if (!display && !streaming) return null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[85%] text-sm leading-relaxed rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-accent text-white rounded-br-sm"
            : "bg-surface text-text-primary rounded-bl-sm"
        }`}
      >
        {isUser ? display : <FormattedText text={display} />}
      </div>
    </div>
  );
}

export function OfferGuidedChat({
  brandContext,
  hasIcp,
  onReady,
  onSwitchToManual,
}: {
  brandContext: string;
  hasIcp: boolean;
  onReady: (payload: ChatOfferPayload) => void;
  onSwitchToManual: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const callChat = useCallback(
    async (msgs: Message[]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      setStreamingText("");
      setError("");

      try {
        const res = await fetch("/api/offer/guided-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: msgs, brandContext, hasIcp }),
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
            if (payload === "[DONE]") break;
            try {
              const { text, error: e } = JSON.parse(payload);
              if (e) throw new Error(e);
              if (text) {
                accumulated += text;
                setStreamingText(accumulated);
              }
            } catch (err) {
              if ((err as Error).message !== "Unexpected end of JSON input")
                throw err;
            }
          }
        }

        setMessages([...msgs, { role: "assistant", content: accumulated }]);
        setStreamingText("");

        const offer = extractOffer(accumulated);
        if (offer) onReady(offer);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    },
    [brandContext, hasIcp, onReady],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    callChat([{ role: "user", content: "Let's build my offer." }]);
  }, [callChat]);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    callChat(next);
  };

  return (
    <div className="ck-card flex flex-col h-[600px]">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-text-primary">
          Guided offer interview
        </span>
        <button
          type="button"
          onClick={onSwitchToManual}
          className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
        >
          Switch to manual builder →
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {messages.map((msg, i) => (
          <Bubble key={i} msg={msg} />
        ))}
        {streamingText && (
          <Bubble msg={{ role: "assistant", content: streamingText }} streaming />
        )}
        {isLoading && !streamingText && (
          <div className="flex gap-1 mb-4">
            <span className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce [animation-delay:300ms]" />
          </div>
        )}
        {error && (
          <div className="p-3 rounded-lg border border-danger/30 bg-danger/[0.06] text-sm text-danger">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-3 p-4 border-t border-border shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type your answer…"
          rows={1}
          disabled={isLoading}
          className="ck-input flex-1 resize-none !rounded-xl !py-3"
          style={{ maxHeight: "120px" }}
        />
        <button
          type="button"
          onClick={send}
          disabled={!input.trim() || isLoading}
          className="ck-btn-primary shrink-0 !rounded-xl !px-4 !py-3"
        >
          Send
        </button>
      </div>
    </div>
  );
}
