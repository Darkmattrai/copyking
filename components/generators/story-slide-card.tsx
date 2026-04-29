"use client";

import { useState } from "react";

export interface ParsedStorySlide {
  index: number;
  funnelRole: string;
  headline: string;
  body: string;
  visualDirection: string;
  sticker: { type: string; copy: string };
  retentionTactic: string;
  expectedSignal: string;
}

interface StorySlideCardProps {
  slide: ParsedStorySlide;
  total: number;
  isSelected: boolean;
  onSelect: () => void;
}

const SIGNAL_TONE: Record<string, string> = {
  dm: "bg-pink-500/10 text-pink-500",
  save: "bg-amber-500/10 text-amber-500",
  share: "bg-emerald-500/10 text-emerald-500",
  "watch-time": "bg-blue-500/10 text-blue-500",
  "profile-click": "bg-purple-500/10 text-purple-500",
  reply: "bg-cyan-500/10 text-cyan-500",
};

const RETENTION_TONE: Record<string, string> = {
  "pattern-interrupt": "bg-rose-500/10 text-rose-500",
  "open-loop": "bg-violet-500/10 text-violet-500",
  specificity: "bg-sky-500/10 text-sky-500",
  proof: "bg-emerald-500/10 text-emerald-500",
  tease: "bg-fuchsia-500/10 text-fuchsia-500",
  escalation: "bg-orange-500/10 text-orange-500",
};

const STICKER_LABEL: Record<string, string> = {
  poll: "Poll",
  quiz: "Quiz",
  question: "Question",
  slider: "Emoji Slider",
  countdown: "Countdown",
  reveal: "Reveal (DM unlock)",
  link: "Link",
  "add-yours": "Add Yours",
  mention: "Mention",
  location: "Location",
  music: "Music",
  none: "No sticker",
};

function wordCount(text: string): number {
  if (!text || text === "—") return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function StorySlideCard({
  slide,
  total,
  isSelected,
  onSelect,
}: StorySlideCardProps) {
  const [copied, setCopied] = useState(false);

  const headlineWords = wordCount(slide.headline);
  const bodyWords = wordCount(slide.body);
  const headlineOver = headlineWords > 6;
  const bodyOver = bodyWords > 20;

  const stickerLabel =
    STICKER_LABEL[slide.sticker.type.toLowerCase()] ?? slide.sticker.type;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = [slide.headline, slide.body].filter(Boolean).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative w-full text-left rounded-xl border-2 p-4 transition-all ${
        isSelected
          ? "border-accent bg-accent/5 shadow-sm"
          : "border-border hover:border-accent/40 bg-surface"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold ${
              isSelected
                ? "bg-accent text-white"
                : "bg-surface-hover text-text-secondary"
            }`}
          >
            {slide.index}
          </span>
          <div>
            <span className="block text-sm font-semibold text-text-primary leading-tight">
              {slide.funnelRole}
            </span>
            <span className="block text-[10px] text-text-tertiary">
              Slide {slide.index} of {total}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-surface-hover hover:bg-accent/10 text-text-secondary hover:text-accent transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Copied
              </>
            ) : (
              "Copy"
            )}
          </button>
        </div>
      </div>

      <div className="bg-background rounded-lg p-3 mb-3 border border-border/50">
        <p className="text-sm font-semibold text-text-primary leading-snug">
          {slide.headline || (
            <span className="text-text-tertiary italic">No headline</span>
          )}
        </p>
        {slide.body && slide.body !== "—" && (
          <p className="text-[13px] text-text-secondary leading-snug mt-1.5">
            {slide.body}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-[10px] text-text-tertiary">
          <span className={headlineOver ? "text-rose-500" : ""}>
            Headline: {headlineWords}/6 words
          </span>
          {slide.body && slide.body !== "—" && (
            <span className={bodyOver ? "text-rose-500" : ""}>
              Body: {bodyWords}/20 words
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
          {stickerLabel}
        </span>

        {slide.retentionTactic && (
          <span
            className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${
              RETENTION_TONE[slide.retentionTactic.toLowerCase()] ??
              "bg-surface-hover text-text-secondary"
            }`}
          >
            {slide.retentionTactic}
          </span>
        )}

        {slide.expectedSignal && (
          <span
            className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${
              SIGNAL_TONE[slide.expectedSignal.toLowerCase()] ??
              "bg-surface-hover text-text-secondary"
            }`}
          >
            {slide.expectedSignal === "watch-time"
              ? "watch time"
              : slide.expectedSignal === "profile-click"
                ? "profile click"
                : slide.expectedSignal}
          </span>
        )}
      </div>

      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        </div>
      )}
    </button>
  );
}
