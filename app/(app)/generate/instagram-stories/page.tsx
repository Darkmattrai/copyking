"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCompletion } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";

import { useBrandStore } from "@/lib/brand/store";
import {
  useHistoryStore,
  type GenerationEntry,
} from "@/lib/generators/history-store";
import { getGenerator } from "@/lib/generators/registry";
import { PillarIcon } from "@/components/brand/pillar-icon";
import { ParamForm } from "@/components/generators/param-form";
import { MarkdownRenderer } from "@/components/generators/markdown-renderer";
import {
  StorySlideCard,
  type ParsedStorySlide,
} from "@/components/generators/story-slide-card";
import { InstagramStoryPreview } from "@/components/generators/instagram-story-preview";
import { BrandDNAHero } from "@/components/generators/brand-dna-hero";

// ────────────────────────────────────────────────────────────────
// Parser — turns the structured markdown into typed sections
// ────────────────────────────────────────────────────────────────

interface ParsedStories {
  overview: {
    objective: string;
    hookAngle: string;
    primaryCta: string;
    postingTime: string;
  };
  slides: ParsedStorySlide[];
  stickerStack: string;
  postingSchedule: string;
  nurtureLadder: string;
  highlightStrategy: string;
  metrics: string;
  themes: string;
  raw: string;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractH2Section(md: string, heading: string): string {
  const pattern = new RegExp(
    `^##\\s+${escapeRegex(heading)}.*$`,
    "mi",
  );
  const match = md.match(pattern);
  if (!match) return "";
  const startIdx = md.indexOf(match[0]) + match[0].length;
  const nextH2 = md.slice(startIdx).search(/\n##\s+/);
  const slice =
    nextH2 === -1 ? md.slice(startIdx) : md.slice(startIdx, startIdx + nextH2);
  return slice.trim();
}

function extractField(block: string, label: string): string {
  // Accept "**Label:** value", "**Label**: value", and "- **Label:** value"
  // (bullet-prefixed). Terminate at the next field — which may also be bullet-
  // prefixed inside an overview block — or at end of block.
  const pattern = new RegExp(
    `\\*\\*${escapeRegex(label)}\\s*:?\\s*\\*\\*\\s*:?\\s*([\\s\\S]*?)(?=\\n[\\s\\-*•]*\\*\\*[A-Z]|$)`,
    "i",
  );
  const match = block.match(pattern);
  if (!match) return "";
  return match[1]
    .trim()
    .replace(/^[-*•]\s+/, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSticker(raw: string): { type: string; copy: string } {
  if (!raw) return { type: "none", copy: "" };

  // Format: type=poll — copy: "Are you ready?"
  const typeMatch = raw.match(/type\s*=\s*([a-z-]+)/i);
  const copyMatch = raw.match(/copy\s*:\s*["“]([\s\S]*?)["”]/i);

  let type = typeMatch?.[1]?.toLowerCase() ?? "none";
  let copy = copyMatch?.[1]?.trim() ?? "";

  if (!copyMatch) {
    // Fallback: take everything after the em dash or colon
    const fallback = raw
      .replace(/^.*type\s*=\s*[a-z-]+\s*[—–\-:]?\s*/i, "")
      .replace(/^copy\s*:\s*/i, "")
      .replace(/^["“]|["”]$/g, "")
      .trim();
    if (fallback) copy = fallback;
  }

  if (!type || type === "") type = "none";
  return { type, copy };
}

function parseStoryOutput(raw: string): ParsedStories {
  const overviewBlock = extractH2Section(raw, "Story Series Overview");
  const overview = {
    objective: extractField(overviewBlock, "Objective"),
    hookAngle: extractField(overviewBlock, "Hook angle"),
    primaryCta: extractField(overviewBlock, "Primary CTA"),
    postingTime: extractField(overviewBlock, "Recommended posting time"),
  };

  // Extract slides with regex against ## Slide N — Role
  const slides: ParsedStorySlide[] = [];
  const slideRegex = /^##\s+Slide\s+(\d+)\s*[—–\-:]\s*(.+?)\s*$/gim;
  const matches: { index: number; role: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = slideRegex.exec(raw)) !== null) {
    matches.push({
      index: parseInt(m[1], 10),
      role: m[2].trim(),
      start: m.index + m[0].length,
      end: -1,
    });
  }
  for (let i = 0; i < matches.length; i++) {
    matches[i].end = i + 1 < matches.length ? matches[i + 1].start - matches[i + 1].role.length - 20 : raw.length;
    // Re-derive end as the start of the next slide's heading (or next H2 outside of slides)
    const nextStart = i + 1 < matches.length
      ? raw.lastIndexOf("\n## Slide", matches[i + 1].start)
      : -1;
    if (nextStart !== -1) {
      matches[i].end = nextStart;
    } else {
      const nextH2 = raw.slice(matches[i].start).search(/\n##\s+(?!Slide)/);
      matches[i].end =
        nextH2 === -1 ? raw.length : matches[i].start + nextH2;
    }
  }

  for (const match of matches) {
    const block = raw.slice(match.start, match.end).trim();
    const headline = extractField(block, "Headline");
    const body = extractField(block, "Body text");
    const visualDirection = extractField(block, "Visual direction");
    const imageRecommendation = extractField(block, "Image recommendation");
    const stickerRaw = extractField(block, "Sticker");
    const retentionTactic = extractField(block, "Retention tactic");
    const expectedSignal = extractField(block, "Expected signal");

    if (!headline && !body && !visualDirection) continue;

    slides.push({
      index: match.index,
      funnelRole: match.role,
      headline,
      body,
      visualDirection,
      imageRecommendation,
      sticker: parseSticker(stickerRaw),
      retentionTactic: retentionTactic.toLowerCase(),
      expectedSignal: expectedSignal.toLowerCase(),
    });
  }

  return {
    overview,
    slides,
    stickerStack: extractH2Section(raw, "Sticker Stack Strategy"),
    postingSchedule: extractH2Section(raw, "Posting Schedule"),
    nurtureLadder: extractH2Section(raw, "DM Nurture Ladder"),
    highlightStrategy: extractH2Section(raw, "Highlight Save Strategy"),
    metrics: extractH2Section(raw, "Metric Targets"),
    themes: extractH2Section(raw, "3 Weekly Themes"),
    raw,
  };
}

// ────────────────────────────────────────────────────────────────
// Page component
// ────────────────────────────────────────────────────────────────

const SLUG = "instagram-stories";

export default function InstagramStoriesPage() {
  const router = useRouter();
  const brandDNA = useBrandStore((s) => s.brandDNA);
  const { addEntry, getEntriesForSlug } = useHistoryStore();
  const generator = getGenerator(SLUG);

  const [submitted, setSubmitted] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [restoredOutput, setRestoredOutput] = useState<string | null>(null);
  const [hasAddedToHistory, setHasAddedToHistory] = useState(false);
  const [formMode, setFormMode] = useState<"custom" | "presets">("custom");
  const lastParamsRef = useRef<Record<string, string>>({});

  const { completion, isLoading, complete, setCompletion, error } =
    useCompletion({
      api: "/api/generate",
      streamProtocol: "text",
    });

  const activeOutput = restoredOutput ?? completion;

  const parsed = useMemo(
    () => parseStoryOutput(activeOutput),
    [activeOutput],
  );

  // Reset active slide when slide count changes
  useEffect(() => {
    if (activeSlide >= parsed.slides.length) {
      setActiveSlide(0);
    }
  }, [parsed.slides.length, activeSlide]);

  // History save once streaming completes
  const prevCompletionRef = useRef(completion);
  useEffect(() => {
    if (
      !isLoading &&
      completion &&
      completion !== prevCompletionRef.current &&
      !hasAddedToHistory
    ) {
      addEntry({ slug: SLUG, output: completion });
      setHasAddedToHistory(true);
    }
    prevCompletionRef.current = completion;
  }, [isLoading, completion, addEntry, hasAddedToHistory]);

  const history = useMemo(
    () => getEntriesForSlug(SLUG),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getEntriesForSlug, activeOutput, showHistory],
  );

  const PRESET_DEFAULTS: Record<string, string> = {
    objective: "engagement-build",
    seriesLength: "standard",
    ctaDestination: "dm-keyword",
  };
  const PRESET_HIDDEN_KEYS = new Set(Object.keys(PRESET_DEFAULTS));

  const visibleParams = useMemo(() => {
    if (!generator?.params) return [];
    if (formMode === "presets") {
      return generator.params.filter((p) => !PRESET_HIDDEN_KEYS.has(p.key));
    }
    return generator.params;
  }, [generator?.params, formMode]);

  const handleGenerate = useCallback(
    async (formParams?: Record<string, string>) => {
      const raw = formParams ?? lastParamsRef.current;
      const paramValues =
        formMode === "presets" ? { ...PRESET_DEFAULTS, ...raw } : raw;
      lastParamsRef.current = paramValues;
      setSubmitted(true);
      setRestoredOutput(null);
      setActiveSlide(0);
      setHasAddedToHistory(false);
      setCompletion("");
      await complete("", {
        body: { slug: SLUG, params: paramValues, brandDNA },
      });
    },
    [brandDNA, complete, setCompletion, formMode],
  );

  const handleRegenerate = useCallback(() => {
    handleGenerate(lastParamsRef.current);
  }, [handleGenerate]);

  const handleRestore = (entry: GenerationEntry) => {
    setRestoredOutput(entry.output);
    setActiveSlide(0);
    setSubmitted(true);
    setShowHistory(false);
  };

  if (!generator) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-text-secondary">Generator not registered.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 h-full">
      {/* Back nav */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => router.push("/generate")}
          className="flex items-center gap-1.5 text-text-tertiary hover:text-text-primary text-sm mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All Generators
        </button>

        {/* Hero */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] flex items-center justify-center text-white">
              <PillarIcon className="w-6 h-6" icon="instagram" />
            </div>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-500 text-white">
              2026
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Instagram Stories Generator
            </h1>
            <p className="text-sm text-text-tertiary mt-1 max-w-lg">
              Slide-by-slide series tuned for the 2026 Stories algorithm.
              Stickers, DM nurture ladder, safe-zone visual direction, posting
              cadence, and metric targets — all from your Brand DNA.
            </p>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                <PillarIcon className="w-3.5 h-3.5" icon="book" />
                Uses your Brand DNA
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                5 / 9 / 13 slide options
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" strokeWidth={1.5} />
                </svg>
                Live phone preview
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <BrandDNAHero />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* LEFT — params + output */}
        <div className="space-y-5">
          {/* Param form */}
          {!submitted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="ck-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <PillarIcon className="w-4 h-4 text-accent" icon="sparkles" />
                  Configure your Stories series
                </h2>
                <div className="flex rounded-lg border border-border overflow-hidden text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setFormMode("presets")}
                    className={`px-3 py-1.5 transition-colors ${
                      formMode === "presets"
                        ? "bg-accent text-white"
                        : "bg-surface text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMode("custom")}
                    className={`px-3 py-1.5 transition-colors ${
                      formMode === "custom"
                        ? "bg-accent text-white"
                        : "bg-surface text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>
              {formMode === "presets" && (
                <p className="text-xs text-text-tertiary mb-3">
                  Standard 9-slide engagement series with DM keyword CTA. Pick your tone, topic, and trigger keyword.
                </p>
              )}
              {visibleParams.length > 0 && (
                <ParamForm
                  key={formMode}
                  params={visibleParams}
                  onSubmit={handleGenerate}
                  isLoading={isLoading}
                />
              )}
            </motion.div>
          )}

          {/* Loading state */}
          {isLoading && !activeOutput && (
            <div className="ck-card p-8 text-center">
              <div className="flex items-center justify-center gap-3 text-text-tertiary">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
                </svg>
                <span className="text-sm">Designing your Stories series...</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="ck-card p-4 border-danger/40">
              <p className="text-sm text-danger">
                Generation failed. Please try again.
              </p>
            </div>
          )}

          {/* Output (kept mounted during and after streaming so content never blanks) */}
          {activeOutput && (
            <div className="space-y-5">
              {/* Action bar */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleRegenerate}
                  disabled={isLoading}
                  className="ck-btn-primary px-5 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  Regenerate
                </button>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setRestoredOutput(null);
                    setCompletion("");
                  }}
                  disabled={isLoading}
                  className="ck-btn-secondary px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                  Change inputs
                </button>
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="ck-btn-secondary px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  History ({history.length})
                </button>
                {isLoading && (
                  <span className="inline-flex items-center gap-2 text-xs text-text-tertiary ml-auto">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:300ms]" />
                    </span>
                    Still writing...
                  </span>
                )}
              </div>

              {/* Series overview */}
              {(parsed.overview.objective || parsed.overview.primaryCta) && (
                <div className="ck-card p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                    Series overview
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <OverviewItem label="Objective" value={parsed.overview.objective} />
                    <OverviewItem label="Primary CTA" value={parsed.overview.primaryCta} />
                    <OverviewItem label="Hook angle" value={parsed.overview.hookAngle} />
                    <OverviewItem label="Best post time" value={parsed.overview.postingTime} />
                  </div>
                </div>
              )}

              {/* Slide cards */}
              {parsed.slides.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <PillarIcon className="w-4 h-4 text-accent" icon="instagram" />
                    Slides
                    <span className="text-[11px] font-normal text-text-tertiary">
                      — click a slide to preview it
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {parsed.slides.map((s, i) => (
                      <StorySlideCard
                        key={i}
                        slide={s}
                        total={parsed.slides.length}
                        isSelected={activeSlide === i}
                        onSelect={() => setActiveSlide(i)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Selected slide visual direction */}
              {parsed.slides[activeSlide]?.visualDirection && (
                <div className="ck-card p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                    <PillarIcon className="w-4 h-4 text-accent" icon="pen" />
                    Visual direction — Slide {parsed.slides[activeSlide].index}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {parsed.slides[activeSlide].visualDirection}
                  </p>
                </div>
              )}

              {/* Sticker stack */}
              {parsed.stickerStack && (
                <SectionCard title="Sticker stack strategy">
                  <MarkdownRenderer content={parsed.stickerStack} />
                </SectionCard>
              )}

              {/* Posting schedule */}
              {parsed.postingSchedule && (
                <SectionCard title="Posting schedule">
                  <MarkdownRenderer content={parsed.postingSchedule} />
                </SectionCard>
              )}

              {/* DM nurture ladder */}
              {parsed.nurtureLadder && (
                <SectionCard title="DM nurture ladder">
                  <MarkdownRenderer content={parsed.nurtureLadder} />
                </SectionCard>
              )}

              {/* Highlight strategy */}
              {parsed.highlightStrategy && (
                <SectionCard title="Highlight save strategy">
                  <MarkdownRenderer content={parsed.highlightStrategy} />
                </SectionCard>
              )}

              {/* Metric targets */}
              {parsed.metrics && (
                <SectionCard title="Metric targets">
                  <MarkdownRenderer content={parsed.metrics} />
                </SectionCard>
              )}

              {/* Weekly themes */}
              {parsed.themes && (
                <SectionCard title="3 weekly themes">
                  <MarkdownRenderer content={parsed.themes} />
                </SectionCard>
              )}

              {/* Always-on raw markdown — collapsible. Open by default if
                  parsing returned no slides so the user always sees content. */}
              <details
                className="ck-card p-5 group"
                open={parsed.slides.length === 0}
              >
                <summary className="cursor-pointer text-sm font-semibold text-text-primary flex items-center gap-2 select-none">
                  <svg
                    className="w-3.5 h-3.5 text-text-tertiary transition-transform group-open:rotate-90"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                  Full raw markdown
                  <span className="text-[11px] font-normal text-text-tertiary">
                    — the entire generated output
                  </span>
                </summary>
                <div className="mt-3 pt-3 border-t border-border">
                  <MarkdownRenderer content={activeOutput} />
                </div>
              </details>
            </div>
          )}
        </div>

        {/* RIGHT — sticky live preview */}
        <div className="hidden xl:block sticky top-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
              Live Story preview
            </h3>

            {parsed.slides.length > 0 ? (
              <>
                <InstagramStoryPreview
                  slides={parsed.slides}
                  activeIdx={activeSlide}
                  onChange={setActiveSlide}
                  showSafeZone={showSafeZone}
                  onToggleSafeZone={() => setShowSafeZone((v) => !v)}
                />

                {parsed.slides[activeSlide] && (
                  <div className="ck-card p-3 text-[11px] space-y-1">
                    <p>
                      <span className="text-text-tertiary">Role: </span>
                      <span className="text-text-primary font-medium">
                        {parsed.slides[activeSlide].funnelRole}
                      </span>
                    </p>
                    <p>
                      <span className="text-text-tertiary">Tactic: </span>
                      <span className="text-text-primary">
                        {parsed.slides[activeSlide].retentionTactic || "—"}
                      </span>
                    </p>
                    <p>
                      <span className="text-text-tertiary">Signal: </span>
                      <span className="text-text-primary">
                        {parsed.slides[activeSlide].expectedSignal || "—"}
                      </span>
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-border bg-surface p-6 text-center text-xs text-text-tertiary">
                Generate a series to see the live phone preview here.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-6"
          >
            <div className="ck-card p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Generation history
              </h3>

              {history.length === 0 ? (
                <p className="text-sm text-text-tertiary">
                  No previous generations yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((entry, i) => {
                    const date = new Date(entry.createdAt);
                    const timeStr = date.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const preview =
                      entry.output.slice(0, 80).replace(/\n/g, " ") + "…";
                    return (
                      <button
                        key={entry.createdAt + i}
                        onClick={() => handleRestore(entry)}
                        className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-accent/40 bg-surface hover:bg-surface-hover transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-text-secondary">
                            {timeStr}
                          </span>
                          <span className="text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                            Restore
                          </span>
                        </div>
                        <p className="text-xs text-text-tertiary truncate">
                          {preview}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-text-tertiary font-semibold mb-0.5">
        {label}
      </p>
      <p className="text-sm text-text-primary leading-snug">{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ck-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <PillarIcon className="w-4 h-4 text-accent" icon="sparkles" />
        {title}
      </h3>
      {children}
    </div>
  );
}
