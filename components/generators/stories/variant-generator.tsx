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

interface VariantGeneratorProps {
  slides: ParsedStorySlide[];
  overview: ParsedOverview;
  brandDNA: BrandDNA;
}

export function VariantGenerator({
  slides,
  overview,
  brandDNA,
}: VariantGeneratorProps) {
  const [selectedSlide, setSelectedSlide] = useState(0);

  const { completion, isLoading, complete, setCompletion } = useCompletion({
    api: "/api/generate/stories-tools",
    streamProtocol: "text",
  });

  const handleGenerate = useCallback(async () => {
    setCompletion("");
    await complete("", {
      body: {
        tool: "variants",
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
        slideIndex: selectedSlide,
        brandDNA,
      },
    });
  }, [slides, overview, selectedSlide, brandDNA, complete, setCompletion]);

  if (slides.length === 0) {
    return (
      <p className="text-xs text-text-tertiary">
        Generate a story series first to create slide variants.
      </p>
    );
  }

  const currentSlide = slides[selectedSlide];

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-tertiary">
        Select a slide and generate 2 alternative creative angles — same funnel role, different copy and direction.
      </p>

      {/* Slide selector */}
      <div className="flex gap-1.5 flex-wrap">
        {slides.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelectedSlide(i)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
              selectedSlide === i
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface text-text-secondary hover:border-accent/40 hover:text-text-primary"
            }`}
          >
            <span className="font-bold">{s.index}</span>
            <span className="ml-1 opacity-70">{s.funnelRole}</span>
          </button>
        ))}
      </div>

      {/* Selected slide preview */}
      {currentSlide && (
        <div className="rounded-lg bg-background border border-border/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent/10 text-accent text-[10px] font-bold">
              {currentSlide.index}
            </span>
            <span className="text-[11px] font-semibold text-text-primary">
              {currentSlide.funnelRole}
            </span>
          </div>
          <p className="text-sm font-medium text-text-primary">{currentSlide.headline}</p>
          {currentSlide.body && currentSlide.body !== "—" && (
            <p className="text-xs text-text-secondary mt-1">{currentSlide.body}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-text-tertiary">
            <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
              {currentSlide.sticker.type}
            </span>
            <span>{currentSlide.retentionTactic}</span>
          </div>
        </div>
      )}

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
            Generating variants...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            Generate A/B variants for Slide {currentSlide?.index}
          </>
        )}
      </button>

      {/* Streaming output */}
      <AnimatePresence>
        {completion && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-lg border border-accent/20 bg-accent/5 p-4 max-h-[500px] overflow-y-auto"
          >
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <span className="text-[11px] font-semibold text-accent">
                Variants for Slide {currentSlide?.index}
              </span>
              {isLoading && (
                <span className="flex gap-1 ml-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:300ms]" />
                </span>
              )}
            </div>
            <div className="prose-sm">
              <MarkdownRenderer content={completion} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
