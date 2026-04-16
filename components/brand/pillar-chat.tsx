"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { ChatMessage } from "@/components/onboarding/chat-message";
import { ChatInput } from "@/components/onboarding/chat-input";
import { PillarIcon } from "./pillar-icon";
import { useBrandStore } from "@/lib/brand/store";
import { PILLAR_META, type PillarKey } from "@/types/brand";

function getTextFromParts(parts: Array<{ type: string; text?: string }>) {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text || "")
    .join("");
}

function buildContextSummary(brandDNA: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(brandDNA)) {
    if (key === "id" || key === "createdAt" || key === "updatedAt" || key === "completionScore") continue;
    const json = JSON.stringify(value);
    if (json !== "{}" && json !== "[]" && json !== '""') {
      lines.push(`${key}: ${json}`);
    }
  }
  return lines.join("\n");
}

interface PillarChatProps {
  pillarKey: PillarKey;
  returnTo?: string;
}

export function PillarChat({ pillarKey, returnTo = "/onboarding/deepen" }: PillarChatProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);
  const [extracting, setExtracting] = useState(false);

  const meta = PILLAR_META.find((m) => m.key === pillarKey)!;
  const { brandDNA, updatePillar } = useBrandStore();

  const context = useMemo(
    () => buildContextSummary(brandDNA as unknown as Record<string, unknown>),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/brand/pillar-chat",
        body: { pillar: pillarKey, context },
      }),
    [pillarKey, context],
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const isLoading = status !== "ready";

  useEffect(() => {
    if (!sentInitial.current && status === "ready") {
      sentInitial.current = true;
      sendMessage({
        text: `Hi, I'd like to deep-dive into my ${meta.label.toLowerCase()}. Help me figure it out.`,
      });
    }
  }, [status, sendMessage, meta.label]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const userMessageCount = messages.filter((m) => m.role === "user").length;

  const extractPillarData = useCallback(async () => {
    setExtracting(true);

    const transcript = messages
      .map((m) => {
        const text = getTextFromParts(
          m.parts as Array<{ type: string; text?: string }>,
        );
        return `${m.role === "user" ? "User" : "Strategist"}: ${text}`;
      })
      .join("\n\n");

    try {
      const res = await fetch("/api/brand/pillar-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, pillar: pillarKey }),
      });

      if (!res.ok) throw new Error("Extraction failed");

      const extracted = await res.json();
      updatePillar(pillarKey, extracted);
      toast.success(`${meta.label} updated`);
      router.push(returnTo);
    } catch {
      toast.error("Failed to extract data. Try again.");
      setExtracting(false);
    }
  }, [messages, pillarKey, updatePillar, meta.label, router]);

  const lastMessage = messages[messages.length - 1];
  const lastMessageText = lastMessage
    ? getTextFromParts(
        lastMessage.parts as Array<{ type: string; text?: string }>,
      )
    : "";
  const isConversationDone =
    lastMessage?.role === "assistant" &&
    (lastMessageText.toLowerCase().includes("let me compile") ||
      lastMessageText.toLowerCase().includes("let me put it all together") ||
      lastMessageText.toLowerCase().includes("let me capture") ||
      lastMessageText.toLowerCase().includes("let me put it together"));

  useEffect(() => {
    if (isConversationDone && !extracting && status === "ready") {
      extractPillarData();
    }
  }, [isConversationDone, extracting, extractPillarData, status]);

  const handleSend = (content: string) => {
    sendMessage({ text: content });
  };

  const displayMessages = messages.filter(
    (m, i) => !(i === 0 && m.role === "user"),
  );

  const progress = Math.min((userMessageCount / 8) * 100, 95);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <button
            aria-label="Back to pillars"
            className="text-text-tertiary hover:text-text-secondary transition-colors"
            onClick={() => router.push(returnTo)}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M15 19l-7-7 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center text-accent">
            <PillarIcon className="w-4 h-4" icon={meta.icon} />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-text-primary">
              {meta.label}
            </h1>
            <p className="text-xs text-text-tertiary">{meta.description}</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-border overflow-hidden">
          <motion.div
            animate={{ width: `${extracting ? 100 : progress}%` }}
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-4">
        <AnimatePresence>
          {displayMessages.map((m) => (
            <ChatMessage
              key={m.id}
              content={getTextFromParts(
                m.parts as Array<{ type: string; text?: string }>,
              )}
              role={m.role as "user" | "assistant"}
            />
          ))}
        </AnimatePresence>

        {status === "streaming" && (
          <motion.div
            animate={{ opacity: 1 }}
            className="flex justify-start"
            initial={{ opacity: 0 }}
          >
            <div className="bg-surface rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </motion.div>
        )}
        </div>
      </div>

      <AnimatePresence>
        {extracting ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border-t border-border"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-center gap-3 justify-center">
              <div className="relative h-5 w-5">
                <div className="absolute inset-0 rounded-full border-2 border-border" />
                <div className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              </div>
              <span className="text-sm text-text-secondary">
                Extracting your {meta.label.toLowerCase()} data...
              </span>
            </div>
          </motion.div>
        ) : (
          <ChatInput
            disabled={isLoading || isConversationDone}
            placeholder={`Tell me about your ${meta.shortLabel.toLowerCase()}...`}
            onSend={handleSend}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
