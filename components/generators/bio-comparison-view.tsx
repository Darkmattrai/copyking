"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface CompareBio {
  label: string;
  formula: string;
  text: string;
  bestFor: string;
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

interface BioComparisonViewProps {
  bios: CompareBio[];
  onClose: () => void;
}

export function BioComparisonView({ bios, onClose }: BioComparisonViewProps) {
  const [selected, setSelected] = useState<number[]>(
    bios.length >= 2 ? [0, 1] : [0],
  );

  function toggleSelection(idx: number) {
    setSelected((prev) => {
      if (prev.includes(idx)) {
        return prev.filter((i) => i !== idx);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), idx];
      }
      return [...prev, idx];
    });
  }

  const compared = selected.map((idx) => bios[idx]).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="ck-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          Compare Bios
          <span className="text-[10px] font-normal text-text-tertiary">
            (select up to 3)
          </span>
        </h3>
        <button
          onClick={onClose}
          className="text-text-tertiary hover:text-text-primary transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Selection chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {bios.map((bio, idx) => {
          const isActive = selected.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => toggleSelection(idx)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                isActive
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-text-tertiary hover:border-accent/30"
              }`}
            >
              {bio.label}
            </button>
          );
        })}
      </div>

      {/* Side-by-side comparison */}
      {compared.length > 0 && (
        <div className={`grid gap-3 ${
          compared.length === 1 ? "grid-cols-1" :
          compared.length === 2 ? "grid-cols-1 md:grid-cols-2" :
          "grid-cols-1 md:grid-cols-3"
        }`}>
          {compared.map((bio, i) => {
            const charCount = countChars(bio.text);
            const isOver = charCount > 150;
            return (
              <div key={i} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-accent">{bio.label}</span>
                  <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full ${
                    isOver
                      ? "bg-red-500/10 text-red-500"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {charCount}/150
                  </span>
                </div>
                <div className="bg-background rounded-lg p-3 mb-2 border border-border/50 min-h-[5rem]">
                  {bio.text.split("\n").map((line, j) => (
                    <span key={j} className="block text-sm text-text-primary leading-relaxed">
                      {line || " "}
                    </span>
                  ))}
                </div>
                {bio.bestFor && (
                  <p className="text-[11px] text-text-tertiary">
                    <span className="font-medium text-text-secondary">Best for:</span> {bio.bestFor}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
