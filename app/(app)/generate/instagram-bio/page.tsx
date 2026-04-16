"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCompletion } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";

import { useBrandStore } from "@/lib/brand/store";
import { useHistoryStore, type GenerationEntry } from "@/lib/generators/history-store";
import { PillarIcon } from "@/components/brand/pillar-icon";
import { InstagramPreview } from "@/components/generators/instagram-preview";
import { BioVariationCard } from "@/components/generators/bio-variation-card";
import { MarkdownRenderer } from "@/components/generators/markdown-renderer";

// ────────────────────────────────────────────────────────────────
// Helpers to parse the structured markdown output from the prompt
// ────────────────────────────────────────────────────────────────

interface ParsedBio {
  label: string;
  formula: string;
  text: string;
  explanation: string;
}

interface ParsedOutput {
  nameOptions: string[];
  bios: ParsedBio[];
  ctasSection: string;
  tipsSection: string;
  raw: string;
}

function extractSection(md: string, heading: string): string {
  const pattern = new RegExp(
    `^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?$`,
    "mi",
  );
  const match = md.match(pattern);
  if (!match) return "";

  const startIdx = md.indexOf(match[0]) + match[0].length;
  const nextH2 = md.indexOf("\n## ", startIdx);
  const slice = nextH2 === -1 ? md.slice(startIdx) : md.slice(startIdx, nextH2);
  return slice.trim();
}

function cleanBioLine(line: string): string {
  let cleaned = line.trim();

  cleaned = cleaned
    .replace(/^[-•]\s*/, "")
    .replace(/^>\s*/, "")
    .replace(/\s*\(\d+\s*chars?\)\s*$/i, "")
    .trim();

  // Remove label prefixes if the model includes structural labels in the bio.
  cleaned = cleaned.replace(
    /^\**\s*(what you do|who you help|result they get|result)\s*\**\s*[:\-]?\s*/i,
    "",
  );

  // Remove malformed markdown markers that can leak into final bio text.
  cleaned = cleaned
    .replace(/\*\*/g, "")
    .replace(/^_+|_+$/g, "")
    .replace(/^\*+|\*+$/g, "")
    .trim();

  return cleaned;
}

function parseOutput(raw: string): ParsedOutput {
  const nameSection = extractSection(raw, "Name Field Options");
  const nameOptions = nameSection
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").replace(/\s*\(\d+\s*chars?\)\s*$/, "").trim())
    .filter(Boolean);

  const formulaLabels = [
    { label: "Value Formula", formula: "What you do + Who you help + Result" },
    { label: "Proof Formula", formula: "Credibility metric + What you do + CTA" },
    { label: "Mission Formula", formula: "Change you create + How you do it" },
    { label: "Personality Formula", formula: "Identity + Personal touch + CTA" },
  ];

  const bios: ParsedBio[] = [];
  for (const { label, formula } of formulaLabels) {
    const pattern = new RegExp(`###\\s+(?:Bio Variation \\d+\\s*[-–—]\\s*)?${label}`, "i");
    const match = raw.match(pattern);
    if (!match) continue;

    const startIdx = raw.indexOf(match[0]) + match[0].length;
    const nextH3 = raw.indexOf("\n### ", startIdx);
    const nextH2 = raw.indexOf("\n## ", startIdx);
    const ends = [nextH3, nextH2].filter((i) => i !== -1);
    const endIdx = ends.length > 0 ? Math.min(...ends) : raw.length;
    const section = raw.slice(startIdx, endIdx).trim();

    const lines = section.split("\n").map((l) => l.trim());
    const bioLines: string[] = [];
    let explanation = "";
    let pastBio = false;

    for (const line of lines) {
      if (!line) continue;
      if (line.startsWith("**Formula**") || line.startsWith("*Formula*")) continue;

      const charCountMatch = line.match(/\(\d+\s*chars?\)/i);
      const explanationIndicators = [
        "why this works",
        "this version works",
        "this works because",
        "why it works",
      ];

      if (
        pastBio &&
        explanationIndicators.some((ind) =>
          line.toLowerCase().includes(ind),
        )
      ) {
        explanation = line
          .replace(/^\*\*.*?\*\*:?\s*/, "")
          .replace(/^>\s*/, "")
          .trim();
        continue;
      }

      if (charCountMatch && !pastBio) {
        const cleanedLine = cleanBioLine(line);
        if (cleanedLine) bioLines.push(cleanedLine);
        pastBio = true;
        continue;
      }

      if (!pastBio) {
        const cleaned = cleanBioLine(
          line.replace(/^\*\*.*?\*\*:?\s*/, "").trim(),
        );
        if (cleaned) bioLines.push(cleaned);
      } else if (!explanation) {
        explanation = line
          .replace(/^\*\*.*?\*\*:?\s*/, "")
          .replace(/^>\s*/, "")
          .replace(/^[-*]\s*/, "")
          .trim();
      }
    }

    if (bioLines.length > 0) {
      bios.push({
        label,
        formula,
        text: bioLines.join("\n"),
        explanation,
      });
    }
  }

  const ctasSection = extractSection(raw, "Link-in-Bio CTAs");
  const tipsSection = extractSection(raw, "Profile Optimization Tips");

  return { nameOptions, bios, ctasSection, tipsSection, raw };
}

// ────────────────────────────────────────────────────────────────
// Page component
// ────────────────────────────────────────────────────────────────

export default function InstagramBioPage() {
  const router = useRouter();
  const brandDNA = useBrandStore((s) => s.brandDNA);
  const { addEntry, getEntriesForSlug } = useHistoryStore();

  const [selectedBioIdx, setSelectedBioIdx] = useState(0);
  const [selectedNameIdx, setSelectedNameIdx] = useState(0);
  const [hasAddedToHistory, setHasAddedToHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [restoredOutput, setRestoredOutput] = useState<string | null>(null);

  const { completion, isLoading, complete, setCompletion, error } =
    useCompletion({
      api: "/api/generate",
      streamProtocol: "text",
    });

  const activeOutput = restoredOutput ?? completion;

  const parsed = useMemo(() => parseOutput(activeOutput), [activeOutput]);

  const prevCompletionRef = useRef(completion);
  useEffect(() => {
    if (
      !isLoading &&
      completion &&
      completion !== prevCompletionRef.current &&
      !hasAddedToHistory
    ) {
      addEntry({ slug: "instagram-bio", output: completion });
      setHasAddedToHistory(true);
    }
    prevCompletionRef.current = completion;
  }, [isLoading, completion, addEntry, hasAddedToHistory]);

  const history = useMemo(
    () => getEntriesForSlug("instagram-bio"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getEntriesForSlug, activeOutput, showHistory],
  );

  const handleGenerate = useCallback(async () => {
    setRestoredOutput(null);
    setSelectedBioIdx(0);
    setSelectedNameIdx(0);
    setHasAddedToHistory(false);
    setCompletion("");
    await complete("", {
      body: { slug: "instagram-bio", params: {}, brandDNA },
    });
  }, [brandDNA, complete, setCompletion]);

  const handleRestore = (entry: GenerationEntry) => {
    setRestoredOutput(entry.output);
    setSelectedBioIdx(0);
    setSelectedNameIdx(0);
    setShowHistory(false);
  };

  const previewBio = parsed.bios[selectedBioIdx]?.text ?? "";
  const previewName = parsed.nameOptions[selectedNameIdx] || "";

  return (
    <div className="p-6 lg:p-8 h-full">
      {/* Back button */}
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

        {/* Hero header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] flex items-center justify-center text-white shrink-0">
            <PillarIcon className="w-6 h-6" icon="instagram" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Instagram Bio Generator
            </h1>
            <p className="text-sm text-text-tertiary mt-1 max-w-lg">
              Craft a high-converting bio using 4 proven formulas — optimized for
              discoverability, the 150-character limit, and 2026 best practices.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                <PillarIcon className="w-3.5 h-3.5" icon="book" />
                Uses your Brand DNA
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                4 variations per generation
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* LEFT COLUMN — Generation + Output */}
        <div className="space-y-5">
          {/* Generate button area */}
          {!activeOutput && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="ck-card p-8 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent-muted flex items-center justify-center text-accent mx-auto mb-4">
                <PillarIcon className="w-8 h-8" icon="instagram" />
              </div>
              <p className="text-sm text-text-secondary mb-1">
                One click generates 4 bio variations, 3 name field options,
                CTA ideas, and profile tips.
              </p>
              <p className="text-xs text-text-tertiary mb-6">
                All tailored to your Brand DNA.
              </p>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="ck-btn-primary px-8 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all inline-flex items-center gap-2"
              >
                <PillarIcon className="w-4.5 h-4.5" icon="sparkles" />
                Generate My Bio
              </button>
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
                <span className="text-sm">Crafting your perfect bio...</span>
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

          {/* Streaming output — markdown while streaming */}
          {isLoading && activeOutput && (
            <div className="ck-card p-6">
              <MarkdownRenderer content={activeOutput} />
              <div className="mt-4 flex items-center gap-2 text-text-tertiary">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:300ms]" />
                </div>
                <span className="text-xs">Still writing...</span>
              </div>
            </div>
          )}

          {/* Completed output — structured */}
          {!isLoading && activeOutput && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              {/* Regenerate bar */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerate}
                  className="ck-btn-primary px-5 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  Regenerate
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
              </div>

              {/* Name field options */}
              {parsed.nameOptions.length > 0 && (
                <div className="ck-card p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    Name Field (searchable, 30 char max)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {parsed.nameOptions.map((name, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedNameIdx(i)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                          selectedNameIdx === i
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-surface text-text-secondary hover:border-accent/40"
                        }`}
                      >
                        {name}
                        <span className="ml-1.5 text-[10px] text-text-tertiary">
                          ({name.length})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio variations */}
              {parsed.bios.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <PillarIcon className="w-4 h-4 text-accent" icon="pen" />
                    Bio Variations
                    <span className="text-[11px] font-normal text-text-tertiary">
                      — click to preview
                    </span>
                  </h3>
                  {parsed.bios.map((bio, i) => (
                    <BioVariationCard
                      key={i}
                      label={bio.label}
                      formula={bio.formula}
                      bioText={bio.text}
                      explanation={bio.explanation}
                      isSelected={selectedBioIdx === i}
                      onSelect={() => setSelectedBioIdx(i)}
                    />
                  ))}
                </div>
              )}

              {/* CTAs section */}
              {parsed.ctasSection && (
                <div className="ck-card p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.51a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374" /></svg>
                    Link-in-Bio CTAs
                  </h3>
                  <MarkdownRenderer content={parsed.ctasSection} />
                </div>
              )}

              {/* Tips section */}
              {parsed.tipsSection && (
                <div className="ck-card p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
                    Profile Optimization Tips
                  </h3>
                  <MarkdownRenderer content={parsed.tipsSection} />
                </div>
              )}

              {/* Fallback: raw markdown if parsing found nothing */}
              {parsed.bios.length === 0 && activeOutput && (
                <div className="ck-card p-6">
                  <MarkdownRenderer content={activeOutput} />
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMN — Phone preview (sticky) */}
        <div className="hidden xl:block sticky top-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
              Live Preview
            </h3>
            <InstagramPreview
              nameField={previewName}
              bioText={previewBio}
            />
            {previewBio && (
              <p className="text-[11px] text-text-tertiary text-center">
                Click a bio variation to update the preview
              </p>
            )}
          </div>
        </div>
      </div>

      {/* HISTORY SECTION */}
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
                Generation History
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
                    const preview = entry.output.slice(0, 80).replace(/\n/g, " ") + "…";
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
