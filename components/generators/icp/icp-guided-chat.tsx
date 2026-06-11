"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { IntakeSchema, type Intake } from "@/lib/icp/schema";
import type { ChatAttachment } from "@/lib/chat/attachments";
import { ChatAttachmentBar } from "@/components/generators/chat-attachment-bar";
import { MicButton } from "@/components/generators/mic-button";

type Message = {
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
};

function extractIntake(text: string): Intake | null {
  const match =
    text.match(/<INTAKE_READY>([\s\S]*?)<\/INTAKE_READY>/) ??
    text.match(/<INTAKE_READY>([\s\S]*)$/);
  if (!match) return null;
  let raw = match[1].trim();
  const lastBrace = raw.lastIndexOf("}");
  if (lastBrace !== -1) raw = raw.slice(0, lastBrace + 1);
  try {
    const parsed = JSON.parse(raw);
    const result = IntakeSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function renderInline(text: string, keyBase: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyBase}-${i}`} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
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

function Bubble({
  msg,
  streaming,
}: {
  msg: Message;
  streaming?: boolean;
}) {
  const isUser = msg.role === "user";
  const display = msg.content
    .replace(/<INTAKE_READY>[\s\S]*?<\/INTAKE_READY>/g, "")
    .replace(/<INTAKE_READY>[\s\S]*$/, "")
    .trim();
  const attachments = msg.attachments ?? [];

  if (!display && !attachments.length && !streaming) return null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[85%] text-sm leading-relaxed rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-accent text-white rounded-br-sm"
            : "bg-surface text-text-primary rounded-bl-sm"
        }`}
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {attachments.map((a) => (
              <span
                key={a.id}
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs ${
                  isUser ? "bg-white/20" : "bg-bg"
                }`}
                title={a.name}
              >
                <span>
                  {a.kind === "image" ? "🖼️" : a.kind === "pdf" ? "📄" : "📎"}
                </span>
                <span className="truncate max-w-[160px]">{a.name}</span>
              </span>
            ))}
          </div>
        )}
        {display && (isUser ? display : <FormattedText text={display} />)}
      </div>
    </div>
  );
}

export function IcpGuidedChat({
  onReady,
  onSwitchToManual,
}: {
  onReady: (intake: Intake) => void;
  onSwitchToManual: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
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
      setNotes([]);

      try {
        const res = await fetch("/api/icp/guided-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: msgs }),
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
              const evt = JSON.parse(payload);
              if (evt.error) throw new Error(evt.error);
              if (evt.text) {
                accumulated += evt.text;
                setStreamingText(accumulated);
              }
              if (evt.note) setNotes((n) => [...n, String(evt.note)]);
            } catch (err) {
              if (
                (err as Error).message !== "Unexpected end of JSON input"
              )
                throw err;
            }
          }
        }

        setMessages([...msgs, { role: "assistant", content: accumulated }]);
        setStreamingText("");

        const intake = extractIntake(accumulated);
        if (intake) onReady(intake);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Something went wrong",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [onReady],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    callChat([{ role: "user", content: "Let's build my ICP map." }]);
  }, [callChat]);

  const send = () => {
    const trimmed = input.trim();
    if ((!trimmed && !attachments.length) || isLoading) return;
    const next = [
      ...messages,
      { role: "user" as const, content: trimmed, attachments },
    ];
    setMessages(next);
    setInput("");
    setAttachments([]);
    callChat(next);
  };

  return (
    <div className="ck-card flex flex-col h-[600px]">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-text-primary">
          Guided ICP interview
        </span>
        <button
          type="button"
          onClick={onSwitchToManual}
          className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
        >
          Switch to manual form →
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {messages.map((msg, i) => (
          <Bubble key={i} msg={msg} />
        ))}
        {streamingText && (
          <Bubble
            msg={{ role: "assistant", content: streamingText }}
            streaming
          />
        )}
        {isLoading && !streamingText && (
          <div className="flex gap-1 mb-4">
            <span className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce [animation-delay:300ms]" />
          </div>
        )}
        {notes.map((n, i) => (
          <div key={`note-${i}`} className="text-[11px] text-text-tertiary mb-2">🔗 {n}</div>
        ))}
        {error && (
          <div className="p-3 rounded-lg border border-danger/30 bg-danger/[0.06] text-sm text-danger">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-col gap-2.5 p-4 border-t border-border shrink-0">
        <ChatAttachmentBar
          attachments={attachments}
          onChange={setAttachments}
          disabled={isLoading}
        />
        <div className="flex items-end gap-3">
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
          <MicButton
            onText={(t) => setInput((p) => (p ? p + " " : "") + t)}
            onError={setError}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={send}
            disabled={(!input.trim() && !attachments.length) || isLoading}
            className="ck-btn-primary shrink-0 !rounded-xl !px-4 !py-3"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
