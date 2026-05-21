"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompletion } from "@ai-sdk/react";
import { useBrandStore } from "@/lib/brand/store";

interface VSLHeadlineVariantsProps {
  currentHeadline: string;
  vslContent: string;
  onSelectHeadline: (headline: string) => void;
}

interface ParsedVariant {
  style: string;
  headline: string;
}

function parseVariants(text: string): ParsedVariant[] {
  const variants: ParsedVariant[] = [];
  const lines = text.split("\n").filter((l) => l.trim());

  for (const line of lines) {
    // Match patterns like "**Curiosity:** How to..." or "1. **Fear-Based:** ..."
    const match = line.match(/\*\*([^*]+)\*\*[:\s]*(.+)/);
    if (match) {
      variants.push({
        style: match[1].trim(),
        headline: match[2].trim().replace(/^["']|["']$/g, ""),
      });
    }
  }
  return variants;
}

export function VSLHeadlineVariants({
  currentHeadline,
  vslContent,
  onSelectHeadline,
}: VSLHeadlineVariantsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const brandDNA = useBrandStore((s) => s.brandDNA);

  const { completion, isLoading, complete } = useCompletion({
    api: "/api/generate",
    streamProtocol: "text",
  });

  const variants = parseVariants(completion);

  async function generateVariants() {
    setIsOpen(true);
    setSelectedIdx(null);
    await complete("", {
      body: {
        slug: "vsl-headline-variants",
        params: {
          currentHeadline,
          vslContext: vslContent.slice(0, 2000),
        },
        brandDNA,
      },
    });
  }

  function handleSelect(idx: number) {
    setSelectedIdx(idx);
    onSelectHeadline(variants[idx].headline);
  }

  return (
    <div>
      <button
        type="button"
        onClick={generateVariants}
        disabled={isLoading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent bg-accent/[0.08] hover:bg-accent/[0.14] transition-colors disabled:opacity-50"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
        {isLoading ? "Generating..." : "A/B Headline Variants"}
      </button>

      <AnimatePresence>
        {isOpen && (completion || isLoading) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="ck-card p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                  Headline Variants
                </h4>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-text-tertiary hover:text-text-primary text-xs"
                >
                  Close
                </button>
              </div>

              {isLoading && variants.length === 0 && (
                <div className="flex items-center gap-2 py-3 text-text-tertiary">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
                  </svg>
                  <span className="text-sm">Generating 5 headline variants...</span>
                </div>
              )}

              {variants.map((v, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  type="button"
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedIdx === i
                      ? "border-accent bg-accent/[0.06]"
                      : "border-border hover:border-accent/40 bg-surface hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      selectedIdx === i ? "text-accent" : "text-text-tertiary"
                    }`}>
                      {v.style}
                    </span>
                    {selectedIdx === i && (
                      <span className="text-[10px] text-accent font-medium">Selected ✓</span>
                    )}
                  </div>
                  <p className="text-sm text-text-primary leading-snug">{v.headline}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
