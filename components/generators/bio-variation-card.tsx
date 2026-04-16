"use client";

import { useState } from "react";

interface BioVariationCardProps {
  label: string;
  formula: string;
  bioText: string;
  explanation?: string;
  isSelected: boolean;
  onSelect: () => void;
}

function countChars(text: string): number {
  let count = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code > 0x1f600 && code < 0x1faff) {
      count += 2;
    } else if (char !== "\n") {
      count += 1;
    }
  }
  return count;
}

export function BioVariationCard({
  label,
  formula,
  bioText,
  explanation,
  isSelected,
  onSelect,
}: BioVariationCardProps) {
  const [copied, setCopied] = useState(false);
  const charCount = countChars(bioText);
  const isOverLimit = charCount > 150;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(bioText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-xl border-2 p-4 transition-all cursor-pointer ${
        isSelected
          ? "border-accent bg-accent/5 shadow-sm"
          : "border-border hover:border-accent/40 bg-surface"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${
              isSelected
                ? "bg-accent text-white"
                : "bg-surface-hover text-text-secondary"
            }`}
          >
            {label.charAt(0)}
          </span>
          <div>
            <span className="text-sm font-semibold text-text-primary">{label}</span>
            <span className="block text-[11px] text-text-tertiary">{formula}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Char count badge */}
          <span
            className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full ${
              isOverLimit
                ? "bg-red-500/10 text-red-500"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {charCount}/150
          </span>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-surface-hover hover:bg-accent/10 text-text-secondary hover:text-accent transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bio text */}
      <div className="bg-background rounded-lg p-3 mb-2 border border-border/50">
        {bioText.split("\n").map((line, i) => (
          <span key={i} className="block text-sm text-text-primary leading-relaxed">
            {line || "\u00A0"}
          </span>
        ))}
      </div>

      {/* Explanation */}
      {explanation && (
        <p className="text-[12px] text-text-tertiary italic leading-snug">
          {explanation}
        </p>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        </div>
      )}
    </div>
  );
}
