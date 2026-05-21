"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const WPM = 140;

interface SectionTiming {
  name: string;
  wordCount: number;
  minutes: number;
  color: string;
}

interface VSLTimingBarProps {
  content: string;
  isStreaming: boolean;
}

/**
 * Parses VSL markdown content into sections by H2/H3 headings,
 * calculates word counts and estimated read times at 140 WPM.
 */
function parseSections(content: string): SectionTiming[] {
  if (!content.trim()) return [];

  const lines = content.split("\n");
  const sections: { name: string; lines: string[] }[] = [];
  let current: { name: string; lines: string[] } | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      if (current) sections.push(current);
      current = { name: headingMatch[1].replace(/\*\*/g, "").trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      // Content before first heading
      if (!current) {
        current = { name: "Introduction", lines: [line] };
      }
    }
  }
  if (current) sections.push(current);

  const colors = [
    "bg-accent",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-orange-500",
  ];

  return sections.map((s, i) => {
    const text = s.lines.join(" ");
    const words = text.split(/\s+/).filter(Boolean).length;
    return {
      name: s.name,
      wordCount: words,
      minutes: words / WPM,
      color: colors[i % colors.length],
    };
  });
}

function formatTime(minutes: number): string {
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function VSLTimingBar({ content, isStreaming }: VSLTimingBarProps) {
  const sections = useMemo(() => parseSections(content), [content]);

  const totalWords = sections.reduce((sum, s) => sum + s.wordCount, 0);
  const totalMinutes = totalWords / WPM;

  if (totalWords < 10) return null;

  return (
    <div className="ck-card p-4 space-y-3">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-text-primary">
              {formatTime(totalMinutes)}
            </span>
            <span className="text-xs text-text-tertiary">estimated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
            <span className="text-sm font-medium text-text-secondary">{totalWords.toLocaleString()} words</span>
            <span className="text-xs text-text-tertiary">@ {WPM} WPM</span>
          </div>
        </div>
        {isStreaming && (
          <span className="text-xs text-accent animate-pulse">Calculating...</span>
        )}
      </div>

      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-surface-raised">
        {sections.map((s, i) => {
          const pct = totalWords > 0 ? (s.wordCount / totalWords) * 100 : 0;
          if (pct < 1) return null;
          return (
            <motion.div
              key={i}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`${s.color} opacity-80 hover:opacity-100 transition-opacity relative group`}
              title={`${s.name}: ${formatTime(s.minutes)}`}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-surface-raised border border-border shadow-lg text-[10px] text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {s.name}: {formatTime(s.minutes)} ({s.wordCount} words)
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Section legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {sections.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            <div className={`w-2 h-2 rounded-full ${s.color} opacity-80`} />
            <span className="text-text-secondary truncate max-w-[120px]">{s.name}</span>
            <span className="text-text-tertiary">{formatTime(s.minutes)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
