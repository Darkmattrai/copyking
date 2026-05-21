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

interface CrossPlatformAdapterProps {
  slides: ParsedStorySlide[];
  overview: ParsedOverview;
  brandDNA: BrandDNA;
}

type Platform = "tiktok" | "facebook" | "youtube";

const PLATFORM_CONFIG: Record<Platform, { label: string; description: string; color: string; bgColor: string; borderColor: string; logo: React.ReactNode }> = {
  tiktok: {
    label: "TikTok Stories",
    description: "15s slides, casual tone, effects-driven",
    color: "text-text-primary",
    bgColor: "bg-surface-hover",
    borderColor: "border-text-primary",
    logo: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.44V13a8.2 8.2 0 005.58 2.17V11.7a4.84 4.84 0 01-3.77-1.24V6.69h3.77z" />
      </svg>
    ),
  },
  facebook: {
    label: "Facebook Stories",
    description: "35-55 demo, simpler language, explicit CTAs",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500",
    logo: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  youtube: {
    label: "YouTube Shorts",
    description: "15-60s vertical video script, SEO-optimized",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500",
    logo: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
};

export function CrossPlatformAdapter({
  slides,
  overview,
  brandDNA,
}: CrossPlatformAdapterProps) {
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [copied, setCopied] = useState(false);

  const { completion, isLoading, complete, setCompletion } = useCompletion({
    api: "/api/generate/stories-tools",
    streamProtocol: "text",
  });

  const handleGenerate = useCallback(async () => {
    setCompletion("");
    await complete("", {
      body: {
        tool: "cross-platform",
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
        targetPlatform: platform,
        brandDNA,
      },
    });
  }, [slides, overview, platform, brandDNA, complete, setCompletion]);

  const handleCopy = async () => {
    if (!completion) return;
    await navigator.clipboard.writeText(completion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (slides.length === 0) {
    return (
      <p className="text-xs text-text-tertiary">
        Generate a story series first to adapt it for other platforms.
      </p>
    );
  }

  const config = PLATFORM_CONFIG[platform];

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-tertiary">
        Adapt your Instagram Story series for TikTok Stories, Facebook Stories, or YouTube Shorts — respecting each platform&apos;s native culture, specs, and best practices.
      </p>

      {/* Platform selector */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((p) => {
          const cfg = PLATFORM_CONFIG[p];
          const isActive = platform === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              className={`relative rounded-xl border-2 p-3 text-center transition-all ${
                isActive
                  ? `${cfg.borderColor} ${cfg.bgColor}`
                  : "border-border bg-surface hover:border-accent/30"
              }`}
            >
              <div className={`flex justify-center mb-1.5 ${isActive ? cfg.color : "text-text-tertiary"}`}>
                {cfg.logo}
              </div>
              <span className={`text-[11px] font-bold block ${isActive ? cfg.color : "text-text-secondary"}`}>
                {cfg.label}
              </span>
              <p className="text-[9px] text-text-tertiary leading-tight mt-0.5">
                {cfg.description}
              </p>
              {isActive && (
                <motion.div
                  layoutId="platform-indicator"
                  className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full ${cfg.borderColor.replace("border-", "bg-")}`}
                />
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
            Adapting for {config.label}...
          </>
        ) : (
          <>
            <span className={config.color}>{config.logo}</span>
            Adapt for {config.label}
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
                <span className="w-3.5 h-3.5 flex items-center justify-center">{config.logo}</span>
                {config.label} Adaptation
                {isLoading && (
                  <span className="flex gap-1 ml-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:300ms]" />
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

            <div className={`rounded-lg border ${config.borderColor}/20 ${config.bgColor} p-4 max-h-[500px] overflow-y-auto`}>
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
