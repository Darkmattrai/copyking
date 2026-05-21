"use client";

import { useState, useCallback } from "react";
import { useCompletion } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import type { ParsedStorySlide } from "@/components/generators/story-slide-card";
import type { BrandDNA } from "@/types/brand";
import { MarkdownRenderer } from "@/components/generators/markdown-renderer";

interface ParsedOverview {
  objective: string;
  hookAngle: string;
  primaryCta: string;
  postingTime: string;
}

interface AudienceToneShiftProps {
  slides: ParsedStorySlide[];
  overview: ParsedOverview;
  brandDNA: BrandDNA;
}

type Temperature = "cold" | "warm" | "hot";

const TEMP_CONFIG: Record<Temperature, { label: string; description: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  cold: {
    label: "Cold",
    description: "Strangers who don't know you yet",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500",
    icon: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
  },
  warm: {
    label: "Warm",
    description: "Engaged followers who know your content",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500",
    icon: "M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 6.75 6.75 0 009 12a4.5 4.5 0 11-1.607-3.446l.12-.107A6.732 6.732 0 0112 3c1.268 0 2.39.63 3.068 1.593",
  },
  hot: {
    label: "Hot",
    description: "Buyers and superfans ready to act",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500",
    icon: "M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 6.75 6.75 0 009 12a4.5 4.5 0 11-1.607-3.446",
  },
};

export function AudienceToneShift({
  slides,
  overview,
  brandDNA,
}: AudienceToneShiftProps) {
  const [temperature, setTemperature] = useState<Temperature>("cold");
  const [copied, setCopied] = useState(false);

  const { completion, isLoading, complete, setCompletion } = useCompletion({
    api: "/api/generate/stories-tools",
    streamProtocol: "text",
  });

  const handleGenerate = useCallback(async () => {
    setCompletion("");
    await complete("", {
      body: {
        tool: "audience-tone",
        slides: slides.map((s) => ({
          index: s.index,
          funnelRole: s.funnelRole,
          headline: s.headline,
          body: s.body,
          visualDirection: s.visualDirection,
          imageRecommendation: s.imageRecommendation,
          sticker: s.sticker,
          retentionTactic: s.retentionTactic,
          expectedSignal: s.expectedSignal,
        })),
        overview,
        targetTemperature: temperature,
        brandDNA,
      },
    });
  }, [slides, overview, temperature, brandDNA, complete, setCompletion]);

  const handleCopy = async () => {
    if (!completion) return;
    await navigator.clipboard.writeText(completion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (slides.length === 0) {
    return (
      <p className="text-xs text-text-tertiary">
        Generate a story series first to create audience-adapted versions.
      </p>
    );
  }

  const config = TEMP_CONFIG[temperature];

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-tertiary">
        Rewrite your entire series for a different audience temperature — cold strangers, warm followers, or hot buyers. Each version adapts copy, CTAs, and sticker strategy.
      </p>

      {/* Temperature selector */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(TEMP_CONFIG) as Temperature[]).map((temp) => {
          const cfg = TEMP_CONFIG[temp];
          const isActive = temperature === temp;
          return (
            <button
              key={temp}
              type="button"
              onClick={() => setTemperature(temp)}
              className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                isActive
                  ? `${cfg.borderColor} ${cfg.bgColor}`
                  : "border-border bg-surface hover:border-accent/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className={`w-4 h-4 ${isActive ? cfg.color : "text-text-tertiary"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                </svg>
                <span
                  className={`text-[11px] font-bold ${
                    isActive ? cfg.color : "text-text-secondary"
                  }`}
                >
                  {cfg.label}
                </span>
              </div>
              <p className="text-[10px] text-text-tertiary leading-tight">
                {cfg.description}
              </p>
              {isActive && (
                <div className="absolute top-2 right-2">
                  <div className={`w-2 h-2 rounded-full ${cfg.bgColor.replace("/10", "")} animate-pulse`} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isLoading}
        className="ck-btn-primary px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 w-full justify-center disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
            </svg>
            Rewriting for {config.label.toLowerCase()} audience...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            Rewrite for {config.label} audience
          </>
        )}
      </button>

      {/* Output */}
      <AnimatePresence>
        {completion && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold ${config.color} flex items-center gap-1.5`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                </svg>
                {config.label} Audience Version
                {isLoading && (
                  <span className="flex gap-1 ml-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${config.bgColor.replace("/10", "")} animate-pulse`} />
                    <span className={`w-1.5 h-1.5 rounded-full ${config.bgColor.replace("/10", "")} animate-pulse [animation-delay:150ms]`} />
                    <span className={`w-1.5 h-1.5 rounded-full ${config.bgColor.replace("/10", "")} animate-pulse [animation-delay:300ms]`} />
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-surface-hover hover:bg-accent/10 text-text-secondary hover:text-accent transition-colors"
              >
                {copied ? "Copied!" : "Copy all"}
              </button>
            </div>

            <div className={`rounded-lg border ${config.borderColor}/20 ${config.bgColor.replace("10", "5")} p-4 max-h-[500px] overflow-y-auto`}>
              <div className="prose-sm">
                <MarkdownRenderer content={completion} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
