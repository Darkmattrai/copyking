"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BioQuickCopyBarProps {
  bioText: string;
  nameText: string;
  linksText: string;
  fullOutput: string;
}

type CopyTarget = "bio" | "name" | "links" | "all";

export function BioQuickCopyBar({ bioText, nameText, linksText, fullOutput }: BioQuickCopyBarProps) {
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget | null>(null);

  const handleCopy = useCallback(async (target: CopyTarget) => {
    let text = "";
    switch (target) {
      case "bio":
        text = bioText;
        break;
      case "name":
        text = nameText;
        break;
      case "links":
        text = linksText;
        break;
      case "all":
        text = fullOutput;
        break;
    }
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedTarget(target);
    setTimeout(() => setCopiedTarget(null), 2000);
  }, [bioText, nameText, linksText, fullOutput]);

  const buttons: { target: CopyTarget; label: string; hasContent: boolean }[] = [
    { target: "bio", label: "Copy Bio", hasContent: !!bioText },
    { target: "name", label: "Copy Name", hasContent: !!nameText },
    { target: "links", label: "Copy Links", hasContent: !!linksText },
    { target: "all", label: "Copy All", hasContent: !!fullOutput },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 xl:left-[calc(50%-180px)]"
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-background/95 backdrop-blur-lg border border-border shadow-xl">
        {buttons.map(({ target, label, hasContent }) => {
          const isCopied = copiedTarget === target;
          return (
            <button
              key={target}
              onClick={() => handleCopy(target)}
              disabled={!hasContent}
              className={`relative px-3.5 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                isCopied
                  ? "bg-emerald-500/15 text-emerald-500"
                  : "bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary"
              }`}
            >
              <AnimatePresence mode="wait">
                {isCopied ? (
                  <motion.span
                    key="copied"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Copied!
                  </motion.span>
                ) : (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
