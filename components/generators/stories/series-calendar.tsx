"use client";

import { useState, useCallback } from "react";
import { useCompletion } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import type { BrandDNA } from "@/types/brand";
import { MarkdownRenderer } from "@/components/generators/markdown-renderer";

interface ParsedOverview {
  objective: string;
  hookAngle: string;
  primaryCta: string;
  postingTime: string;
}

interface SeriesCalendarProps {
  overview: ParsedOverview;
  themes: string;
  brandDNA: BrandDNA;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-rose-500",
];

export function SeriesCalendar({
  overview,
  themes,
  brandDNA,
}: SeriesCalendarProps) {
  const [copied, setCopied] = useState(false);

  const { completion, isLoading, complete, setCompletion } = useCompletion({
    api: "/api/generate/stories-tools",
    streamProtocol: "text",
  });

  const handleGenerate = useCallback(async () => {
    setCompletion("");
    await complete("", {
      body: {
        tool: "calendar",
        overview,
        themes,
        brandDNA,
      },
    });
  }, [overview, themes, brandDNA, complete, setCompletion]);

  const handleCopy = async () => {
    if (!completion) return;
    await navigator.clipboard.writeText(completion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-tertiary">
        Generate a full 7-day Stories content calendar with one series per day, mapped to your weekly themes. Each day gets a unique angle, hook, CTA, and posting time.
      </p>

      {/* Themes preview */}
      {themes && (
        <div className="rounded-lg bg-background border border-border/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span className="text-[11px] font-semibold text-text-primary">
              Weekly Themes (from your series)
            </span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3">
            {themes.slice(0, 200)}
            {themes.length > 200 && "..."}
          </p>
        </div>
      )}

      {/* Visual day indicators */}
      <div className="flex gap-1.5">
        {DAY_LABELS.map((day, i) => (
          <div key={day} className="flex-1 text-center">
            <div className={`h-1.5 rounded-full ${DAY_COLORS[i]} opacity-40`} />
            <span className="text-[9px] text-text-tertiary font-medium mt-1 block">
              {day}
            </span>
          </div>
        ))}
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
            Building 7-day calendar...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Generate 7-day content calendar
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
              <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                7-Day Stories Calendar
                {isLoading && (
                  <span className="flex gap-1 ml-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse [animation-delay:300ms]" />
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-surface-hover hover:bg-accent/10 text-text-secondary hover:text-accent transition-colors"
              >
                {copied ? "Copied!" : "Copy calendar"}
              </button>
            </div>

            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 max-h-[500px] overflow-y-auto">
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
