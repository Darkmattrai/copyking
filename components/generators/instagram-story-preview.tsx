"use client";

import type { ParsedStorySlide } from "./story-slide-card";

interface InstagramStoryPreviewProps {
  slides: ParsedStorySlide[];
  activeIdx: number;
  onChange: (idx: number) => void;
  username?: string;
  showSafeZone?: boolean;
  onToggleSafeZone?: () => void;
}

const SLIDE_BG_GRADIENTS = [
  "from-[#833AB4] via-[#E1306C] to-[#F77737]",
  "from-[#0F2027] via-[#203A43] to-[#2C5364]",
  "from-[#FF6A00] via-[#EE0979] to-[#FF6A00]",
  "from-[#1F1C2C] via-[#928DAB] to-[#1F1C2C]",
  "from-[#0F0C29] via-[#302B63] to-[#24243E]",
  "from-[#134E5E] via-[#71B280] to-[#134E5E]",
  "from-[#7F00FF] via-[#E100FF] to-[#7F00FF]",
  "from-[#283048] via-[#859398] to-[#283048]",
  "from-[#FF512F] via-[#DD2476] to-[#FF512F]",
  "from-[#36D1DC] via-[#5B86E5] to-[#36D1DC]",
  "from-[#000428] via-[#004e92] to-[#000428]",
  "from-[#3A1C71] via-[#D76D77] to-[#FFAF7B]",
  "from-[#0B486B] via-[#F56217] to-[#0B486B]",
];

function StickerMock({ slide }: { slide: ParsedStorySlide }) {
  const type = slide.sticker.type.toLowerCase();
  const copy = slide.sticker.copy || "";

  if (type === "none" || !type) return null;

  if (type === "poll") {
    const options = copy
      .split(/[/|,]| or | vs /i)
      .map((o) => o.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean)
      .slice(0, 2);
    const [a, b] = [options[0] || "Yes", options[1] || "No"];
    return (
      <div className="absolute left-3 right-3 bottom-[15%] rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="px-3 pt-2 pb-1.5">
          <p className="text-[11px] font-semibold text-neutral-900 text-center line-clamp-2">
            {copy.split(/[/|,]| or | vs /i)[0] || "Tap to vote"}
          </p>
        </div>
        <div className="grid grid-cols-2 border-t border-neutral-200">
          <div className="py-2 text-center text-[12px] font-semibold text-neutral-900 border-r border-neutral-200">
            {a}
          </div>
          <div className="py-2 text-center text-[12px] font-semibold text-neutral-900">
            {b}
          </div>
        </div>
      </div>
    );
  }

  if (type === "quiz") {
    const parts = copy
      .split(/[/|,]/)
      .map((o) => o.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    const question = parts[0] || copy || "Quick quiz";
    const options = parts.slice(1, 5);
    return (
      <div className="absolute left-3 right-3 bottom-[12%] rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500">
          <p className="text-[11px] font-semibold text-white line-clamp-2">
            {question}
          </p>
        </div>
        <div className="divide-y divide-neutral-200">
          {(options.length > 0 ? options : ["Option A", "Option B"]).map(
            (opt, i) => (
              <div
                key={i}
                className="px-3 py-1.5 text-[11px] font-medium text-neutral-900"
              >
                {opt}
              </div>
            ),
          )}
        </div>
      </div>
    );
  }

  if (type === "question") {
    return (
      <div className="absolute left-3 right-3 bottom-[18%] rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="px-3 pt-2 pb-1">
          <p className="text-[11px] font-semibold text-neutral-900 text-center">
            {copy || "Ask me anything"}
          </p>
        </div>
        <div className="mx-3 mb-2 mt-1 px-3 py-2 rounded-full bg-neutral-100 text-[11px] text-neutral-500">
          Type something...
        </div>
      </div>
    );
  }

  if (type === "slider") {
    // Pick the first non-ASCII character as the slider emoji (covers all emoji
    // surrogate pairs without needing the unicode regex flag).
    const firstNonAscii = Array.from(copy).find(
      (ch) => ch.charCodeAt(0) > 127,
    );
    const emoji = firstNonAscii ?? "🔥";
    const label =
      Array.from(copy)
        .filter((ch) => ch.charCodeAt(0) <= 127)
        .join("")
        .trim() || "How hot?";
    return (
      <div className="absolute left-3 right-3 bottom-[18%] rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl px-3 py-2.5">
        <p className="text-[11px] font-semibold text-neutral-900 text-center mb-1.5 line-clamp-1">
          {label}
        </p>
        <div className="relative h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400">
          <div
            className="absolute -top-3 text-lg"
            style={{ left: "60%", transform: "translateX(-50%)" }}
          >
            {emoji}
          </div>
        </div>
      </div>
    );
  }

  if (type === "countdown") {
    return (
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[18%] w-[80%] rounded-2xl bg-gradient-to-r from-fuchsia-500 to-orange-500 shadow-xl px-3 py-2 text-center">
        <p className="text-[10px] font-semibold text-white/90 uppercase tracking-wide">
          {copy || "Launch"}
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          {["02", "14", "37"].map((n, i) => (
            <div
              key={i}
              className="px-1.5 py-0.5 rounded bg-white/20 text-[12px] font-bold text-white"
            >
              {n}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "reveal") {
    return (
      <div className="absolute left-3 right-3 bottom-[16%] rounded-2xl bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 shadow-xl px-3 py-2.5 text-center">
        <p className="text-[10px] font-bold text-white/90 uppercase tracking-wide">
          DM to unlock
        </p>
        <p className="text-[12px] font-semibold text-white mt-0.5 line-clamp-2">
          {copy || 'DM "GUIDE" to get it'}
        </p>
      </div>
    );
  }

  if (type === "link") {
    return (
      <div className="absolute left-3 right-3 bottom-[14%] rounded-full bg-white shadow-xl px-3 py-1.5 flex items-center gap-1.5">
        <svg
          className="w-3 h-3 text-neutral-700 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
          />
        </svg>
        <span className="text-[11px] font-semibold text-neutral-900 truncate">
          {copy || "Tap the link"}
        </span>
      </div>
    );
  }

  if (type === "add-yours") {
    return (
      <div className="absolute left-3 right-3 bottom-[18%] rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl px-3 py-2 text-center">
        <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">
          Add yours
        </p>
        <p className="text-[11px] font-medium text-neutral-900 mt-0.5 line-clamp-2">
          {copy || "Share yours →"}
        </p>
      </div>
    );
  }

  // Generic chip for mention/location/music/other
  return (
    <div className="absolute left-3 right-3 bottom-[18%] rounded-full bg-white/90 backdrop-blur-sm shadow-md px-3 py-1.5 flex items-center justify-center">
      <span className="text-[11px] font-medium text-neutral-900 truncate">
        {copy || slide.sticker.type}
      </span>
    </div>
  );
}

export function InstagramStoryPreview({
  slides,
  activeIdx,
  onChange,
  username = "yourbrand",
  showSafeZone = false,
  onToggleSafeZone,
}: InstagramStoryPreviewProps) {
  const slide = slides[activeIdx];
  const total = slides.length;
  const gradient =
    SLIDE_BG_GRADIENTS[activeIdx % SLIDE_BG_GRADIENTS.length] ??
    SLIDE_BG_GRADIENTS[0];

  const goPrev = () => {
    if (activeIdx > 0) onChange(activeIdx - 1);
  };
  const goNext = () => {
    if (activeIdx < total - 1) onChange(activeIdx + 1);
  };

  return (
    <div className="w-full max-w-[320px] mx-auto">
      {/* Phone frame — 9:16 */}
      <div className="relative rounded-[2rem] border-2 border-border bg-black overflow-hidden shadow-lg aspect-[9/16]">
        {/* Background */}
        {slide ? (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
            aria-hidden
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-900" aria-hidden />
        )}

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 px-2 pt-2 flex gap-0.5 z-20">
          {slides.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden"
            >
              <div
                className={`h-full bg-white transition-all ${
                  i < activeIdx
                    ? "w-full"
                    : i === activeIdx
                      ? "w-1/2"
                      : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Header (username + time) */}
        <div className="absolute top-3.5 left-3 right-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 p-[1.5px]">
              <div className="w-full h-full rounded-full bg-black" />
            </div>
            <span className="text-[11px] font-semibold text-white drop-shadow">
              {username}
            </span>
            <span className="text-[10px] text-white/70 drop-shadow">
              · now
            </span>
          </div>
        </div>

        {/* Safe-zone overlay */}
        {showSafeZone && (
          <>
            <div className="absolute inset-x-0 top-0 h-[8.07%] bg-rose-500/10 border-b border-dashed border-rose-400/70 z-10 pointer-events-none">
              <span className="absolute right-1 bottom-0 text-[8px] font-mono text-rose-200">
                155px UI safe
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-[8.07%] bg-rose-500/10 border-t border-dashed border-rose-400/70 z-10 pointer-events-none">
              <span className="absolute right-1 top-0 text-[8px] font-mono text-rose-200">
                155px UI safe
              </span>
            </div>
            <div className="absolute inset-x-2 top-[8.07%] bottom-[8.07%] border border-dashed border-emerald-400/50 z-10 pointer-events-none">
              <span className="absolute left-1 top-1 text-[8px] font-mono text-emerald-200">
                1080×1610 safe
              </span>
            </div>
          </>
        )}

        {/* Slide content (headline + body) — centered in safe zone */}
        {slide && (
          <div className="absolute inset-x-4 top-[18%] bottom-[28%] flex flex-col items-center justify-center z-10 text-center">
            <h3
              className="text-white font-bold text-lg leading-tight drop-shadow-lg"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
            >
              {slide.headline || ""}
            </h3>
            {slide.body && slide.body !== "—" && (
              <p
                className="mt-2 text-white/95 text-[12px] leading-snug drop-shadow"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
              >
                {slide.body}
              </p>
            )}
          </div>
        )}

        {/* Sticker mock */}
        {slide && <StickerMock slide={slide} />}

        {/* Reply bar */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-1.5 z-20">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 px-3 py-1.5 rounded-full border border-white/40 text-[11px] text-white/70 bg-black/20 backdrop-blur-sm">
              Send message
            </div>
            <button className="w-7 h-7 rounded-full flex items-center justify-center text-white/90">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
            <button className="w-7 h-7 rounded-full flex items-center justify-center text-white/90">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tap zones for prev/next */}
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous slide"
          className="absolute inset-y-0 left-0 w-1/3 z-30 cursor-pointer"
          disabled={activeIdx === 0}
        />
        <button
          type="button"
          onClick={goNext}
          aria-label="Next slide"
          className="absolute inset-y-0 right-0 w-1/3 z-30 cursor-pointer"
          disabled={activeIdx === total - 1}
        />
      </div>

      {/* Controls below the phone */}
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={activeIdx === 0}
          className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Prev
        </button>

        <span className="text-[11px] text-text-tertiary font-mono">
          {total > 0 ? activeIdx + 1 : 0} / {total}
        </span>

        <button
          type="button"
          onClick={goNext}
          disabled={activeIdx >= total - 1}
          className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Safe-zone toggle */}
      {onToggleSafeZone && (
        <button
          type="button"
          onClick={onToggleSafeZone}
          className={`mt-3 w-full text-xs font-medium py-1.5 rounded-lg border transition-colors ${
            showSafeZone
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
              : "border-border bg-surface hover:border-accent/40 text-text-secondary"
          }`}
        >
          {showSafeZone ? "Hide" : "Show"} 1080×1610 safe zone
        </button>
      )}
    </div>
  );
}
