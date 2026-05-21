"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownRenderer } from "../markdown-renderer";

interface VSLSectionCardProps {
  title: string;
  content: string;
  index: number;
  isStreaming: boolean;
  onRegenerate: (sectionTitle: string) => void;
  isRegenerating: boolean;
}

export function VSLSectionCard({
  title,
  content,
  index,
  isStreaming,
  onRegenerate,
  isRegenerating,
}: VSLSectionCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copySection() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(wordCount / 140);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="ck-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-raised/50">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2.5 text-left flex-1 min-w-0"
        >
          <motion.svg
            className="w-4 h-4 text-text-tertiary shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </motion.svg>
          <h3 className="text-sm font-semibold text-text-primary truncate">{title}</h3>
          <span className="text-[10px] text-text-tertiary whitespace-nowrap">
            {wordCount} words · ~{readTime}m
          </span>
        </button>

        {!isStreaming && (
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={copySection}
              className="px-2 py-1 rounded-md text-[11px] font-medium text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-all"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => onRegenerate(title)}
              disabled={isRegenerating}
              className="px-2 py-1 rounded-md text-[11px] font-medium text-text-tertiary hover:text-accent hover:bg-accent/[0.06] transition-all disabled:opacity-40"
            >
              {isRegenerating ? (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
                  </svg>
                  Rewriting...
                </span>
              ) : (
                "Rewrite"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4" data-vsl-output>
              <MarkdownRenderer content={content} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
