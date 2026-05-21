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

interface ReelConverterProps {
  slides: ParsedStorySlide[];
  overview: ParsedOverview;
  brandDNA: BrandDNA;
}

export function ReelConverter({
  slides,
  overview,
  brandDNA,
}: ReelConverterProps) {
  const [copied, setCopied] = useState(false);

  const { completion, isLoading, complete, setCompletion } = useCompletion({
    api: "/api/generate/stories-tools",
    streamProtocol: "text",
  });

  const handleConvert = useCallback(async () => {
    setCompletion("");
    await complete("", {
      body: {
        tool: "reel-convert",
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
        brandDNA,
      },
    });
  }, [slides, overview, brandDNA, complete, setCompletion]);

  const handleCopy = async () => {
    if (!completion) return;
    await navigator.clipboard.writeText(completion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (slides.length === 0) {
    return (
      <p className="text-xs text-text-tertiary">
        Generate a story series first to convert it to a Reel script.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-tertiary">
        Convert your entire Story series into a 30-60 second Reel script with scene-by-scene direction, voiceover, on-screen text, and caption.
      </p>

      {/* Series summary */}
      <div className="rounded-lg bg-background border border-border/50 p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] flex items-center justify-center text-white shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-text-primary">
            {slides.length}-slide series → Reel script
          </p>
          <p className="text-[10px] text-text-tertiary truncate">
            {overview.hookAngle || overview.objective || "Custom series"}
          </p>
        </div>
        <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full shrink-0">
          9:16
        </span>
      </div>

      {/* Convert button */}
      <button
        type="button"
        onClick={handleConvert}
        disabled={isLoading}
        className="ck-btn-primary px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 w-full justify-center disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
            </svg>
            Writing Reel script...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            Convert to Reel script
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
            {/* Copy bar */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-accent flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                Reel Script
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
                {copied ? "Copied!" : "Copy script"}
              </button>
            </div>

            <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 max-h-[500px] overflow-y-auto">
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
