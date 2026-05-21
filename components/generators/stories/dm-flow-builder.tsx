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

interface DmFlowBuilderProps {
  overview: ParsedOverview;
  nurtureLadder: string;
  brandDNA: BrandDNA;
}

export function DmFlowBuilder({
  overview,
  nurtureLadder,
  brandDNA,
}: DmFlowBuilderProps) {
  const [copied, setCopied] = useState(false);

  const { completion, isLoading, complete, setCompletion } = useCompletion({
    api: "/api/generate/stories-tools",
    streamProtocol: "text",
  });

  const handleGenerate = useCallback(async () => {
    setCompletion("");
    await complete("", {
      body: {
        tool: "dm-flow",
        overview,
        nurtureLadder,
        brandDNA,
      },
    });
  }, [overview, nurtureLadder, brandDNA, complete, setCompletion]);

  const handleCopy = async () => {
    if (!completion) return;
    await navigator.clipboard.writeText(completion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-tertiary">
        Build a complete ManyChat-compatible DM automation flow with branching logic, tags, delays, and a no-response sequence.
      </p>

      {/* Nurture ladder preview */}
      {nurtureLadder && (
        <div className="rounded-lg bg-background border border-border/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-pink-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-text-primary">
              DM Nurture Ladder (from your series)
            </span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3">
            {nurtureLadder.slice(0, 200)}
            {nurtureLadder.length > 200 && "..."}
          </p>
        </div>
      )}

      {/* CTA info */}
      {overview.primaryCta && (
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-text-tertiary">Series CTA:</span>
          <span className="font-medium text-text-primary bg-accent/10 text-accent px-2 py-0.5 rounded-full">
            {overview.primaryCta}
          </span>
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
            Building DM flow...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            Build DM automation flow
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
              <span className="text-[11px] font-semibold text-accent flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                DM Automation Flow
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
                {copied ? "Copied!" : "Copy flow"}
              </button>
            </div>

            <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 p-4 max-h-[500px] overflow-y-auto">
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
