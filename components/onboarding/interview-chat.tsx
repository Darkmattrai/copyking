"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { useBrandStore } from "@/lib/brand/store";

function getTextFromParts(parts: Array<{ type: string; text?: string }>) {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text || "")
    .join("");
}

export function InterviewChat() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [extracting, setExtracting] = useState(false);
  const sentInitial = useRef(false);
  const { setBrandDNA, brandDNA, setInterviewCompleted } = useBrandStore();

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/brand/interview" }),
    [],
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const isLoading = status !== "ready";

  useEffect(() => {
    if (!sentInitial.current && status === "ready") {
      sentInitial.current = true;
      sendMessage({ text: "Hi, I'm ready to discover my brand." });
    }
  }, [status, sendMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const userMessageCount = messages.filter((m) => m.role === "user").length;

  const extractBrandDNA = useCallback(async () => {
    setExtracting(true);

    const transcript = messages
      .map((m) => {
        const text = getTextFromParts(m.parts as Array<{ type: string; text?: string }>);

        return `${m.role === "user" ? "User" : "Strategist"}: ${text}`;
      })
      .join("\n\n");

    try {
      const res = await fetch("/api/brand/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      const extracted = await res.json();

      setBrandDNA({
        ...brandDNA,
        niche: {
          ...brandDNA.niche,
          marketCategory: extracted.niche?.marketCategory || "",
          subNiche: extracted.niche?.subNiche || "",
          congregationPoints: extracted.niche?.congregationPoints || [],
        },
        icp: {
          ...brandDNA.icp,
          name: extracted.icp?.name || "",
          demographics: {
            ...brandDNA.icp.demographics,
            ...(extracted.icp?.demographics || {}),
          },
          psychographics: {
            ...brandDNA.icp.psychographics,
            ...(extracted.icp?.psychographics || {}),
          },
          painPoints: extracted.icp?.painPoints || [],
          dreamOutcome: extracted.icp?.dreamOutcome || "",
          failedSolutions: extracted.icp?.failedSolutions || [],
          platforms: extracted.icp?.platforms || [],
        },
        offer: {
          ...brandDNA.offer,
          dreamOutcome: extracted.offer?.dreamOutcome || "",
          perceivedLikelihood: extracted.offer?.perceivedLikelihood || "",
          timeDelay: extracted.offer?.timeDelay || "",
          effortRequired: extracted.offer?.effortRequired || "",
          grandSlamDescription: extracted.offer?.grandSlamDescription || "",
        },
        positioning: {
          ...brandDNA.positioning,
          uniqueMechanism: extracted.positioning?.uniqueMechanism || "",
          categoryOwned: extracted.positioning?.categoryOwned || "",
          positioningStatement:
            extracted.positioning?.positioningStatement || "",
          pointOfView: extracted.positioning?.pointOfView || "",
        },
        voice: {
          ...brandDNA.voice,
          primaryArchetype: extracted.voice?.primaryArchetype || "",
          secondaryArchetype: extracted.voice?.secondaryArchetype || "",
          toneAttributes: extracted.voice?.toneAttributes || [],
          brandPersona: extracted.voice?.brandPersona || "",
        },
        story: {
          ...brandDNA.story,
          mission: extracted.story?.mission || "",
          villain: extracted.story?.villain || "",
        },
        messaging: {
          ...brandDNA.messaging,
          oneLiner: extracted.messaging?.oneLiner || "",
          tagline: extracted.messaging?.tagline || "",
        },
        contentDNA: {
          ...brandDNA.contentDNA,
          themes: extracted.contentDNA?.themes || [],
          hookStyles: extracted.contentDNA?.hookStyles || [],
        },
      });

      setInterviewCompleted(true);
      router.push("/onboarding/deepen");
    } catch {
      setExtracting(false);
    }
  }, [messages, brandDNA, setBrandDNA, setInterviewCompleted, router]);

  const lastMessage = messages[messages.length - 1];
  const lastMessageText = lastMessage
    ? getTextFromParts(lastMessage.parts as Array<{ type: string; text?: string }>)
    : "";
  const isInterviewDone =
    lastMessage?.role === "assistant" &&
    lastMessageText.toLowerCase().includes("everything i need");

  useEffect(() => {
    if (isInterviewDone && !extracting && status === "ready") {
      extractBrandDNA();
    }
  }, [isInterviewDone, extracting, extractBrandDNA, status]);

  const handleSend = (content: string) => {
    sendMessage({ text: content });
  };

  const displayMessages = messages.filter(
    (m, i) => !(i === 0 && m.role === "user"),
  );

  const progress = Math.min((userMessageCount / 6) * 100, 100);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-tertiary uppercase tracking-wider font-medium">
            Brand Discovery
          </span>
          <span className="text-xs text-text-tertiary">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1 rounded-full bg-border overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {displayMessages.map((m) => (
            <ChatMessage
              key={m.id}
              content={getTextFromParts(m.parts as Array<{ type: string; text?: string }>)}
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
                Analyzing your brand DNA...
              </span>
            </div>
          </motion.div>
        ) : (
          <ChatInput
            disabled={isLoading || isInterviewDone}
            onSend={handleSend}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
