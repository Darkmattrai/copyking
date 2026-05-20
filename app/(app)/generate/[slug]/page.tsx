"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";

import { getGenerator } from "@/lib/generators/registry";
import { useBrandStore } from "@/lib/brand/store";
import { useGenerationsStore } from "@/lib/generators/store";
import {
  useHistoryStore,
  type GenerationEntry,
} from "@/lib/generators/history-store";
import { PillarIcon } from "@/components/brand/pillar-icon";
import { ParamForm } from "@/components/generators/param-form";
import { GeneratorOutput } from "@/components/generators/generator-output";
import { BrandDNAHero } from "@/components/generators/brand-dna-hero";

export default function GeneratorPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const generator = getGenerator(slug);
  const brandDNA = useBrandStore((s) => s.brandDNA);
  const { addEntry, getEntriesForSlug } = useHistoryStore();
  const hasParams = generator?.params && generator.params.length > 0;
  const [submitted, setSubmitted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [restoredOutput, setRestoredOutput] = useState<string | null>(null);
  const [hasAddedToHistory, setHasAddedToHistory] = useState(false);
  const lastParamsRef = useRef<Record<string, string>>({});

  const cachedGeneration = useGenerationsStore(
    (s) => s.generations[slug],
  );
  const isStoreLoaded = useGenerationsStore((s) => s.isLoaded);
  const setGeneration = useGenerationsStore((s) => s.setGeneration);
  const clearGeneration = useGenerationsStore((s) => s.clearGeneration);

  const { completion, isLoading, complete, setCompletion, error } = useCompletion({
    api: "/api/generate",
    streamProtocol: "text",
  });

  // Hydrate completion from store whenever a cached generation appears,
  // as long as the user hasn't started a fresh generation. The cache can
  // arrive on first render (localStorage), or moments later (Supabase sync).
  useEffect(() => {
    if (submitted) return;
    if (cachedGeneration?.content) {
      setCompletion(cachedGeneration.content);
      lastParamsRef.current = cachedGeneration.params || {};
      setSubmitted(true);
    }
  }, [cachedGeneration, submitted, setCompletion]);

  const activeOutput = restoredOutput ?? completion;

  const prevCompletionRef = useRef(completion);
  useEffect(() => {
    if (
      !isLoading &&
      completion &&
      completion !== prevCompletionRef.current &&
      !hasAddedToHistory
    ) {
      addEntry({ slug, output: completion });
      setHasAddedToHistory(true);
    }
    prevCompletionRef.current = completion;
  }, [isLoading, completion, addEntry, hasAddedToHistory, slug]);

  const history = useMemo(
    () => getEntriesForSlug(slug),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getEntriesForSlug, slug, activeOutput, showHistory],
  );

  const handleRestore = (entry: GenerationEntry) => {
    setRestoredOutput(entry.output);
    setSubmitted(true);
    setShowHistory(false);
  };

  const handleGenerate = useCallback(
    async (formParams?: Record<string, string>) => {
      const paramValues = formParams ?? lastParamsRef.current;
      lastParamsRef.current = paramValues;
      setSubmitted(true);
      setRestoredOutput(null);
      setHasAddedToHistory(false);
      setCompletion("");

      // complete() resolves with the final completion text on success.
      // Save here directly so persistence does not depend on effect timing.
      const result = await complete("", {
        body: {
          slug,
          params: paramValues,
          brandDNA,
        },
      });

      if (typeof result === "string" && result.length > 100) {
        void setGeneration(slug, {
          content: result,
          params: paramValues,
        });
      }
    },
    [slug, brandDNA, complete, setCompletion, setGeneration],
  );

  const handleRegenerate = useCallback(() => {
    handleGenerate(lastParamsRef.current);
  }, [handleGenerate]);

  const handleChangeInputs = useCallback(() => {
    setSubmitted(false);
    setCompletion("");
    clearGeneration(slug);
  }, [setCompletion, clearGeneration, slug]);

  if (!generator) {
    return (
      <div className="p-6 lg:p-8">
        <div className="ck-card p-8 text-center">
          <p className="text-text-secondary mb-4">Generator not found.</p>
          <button
            onClick={() => router.push("/generate")}
            className="ck-btn-primary px-4 py-2 rounded-lg text-sm"
          >
            Back to Generators
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => router.push("/generate")}
          className="flex items-center gap-1.5 text-text-tertiary hover:text-text-primary text-sm mb-4 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          All Generators
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center text-accent">
            <PillarIcon className="w-5 h-5" icon={generator.icon} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              {generator.name}
            </h1>
            <p className="text-sm text-text-tertiary">
              {generator.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <PillarIcon className="w-3.5 h-3.5" icon="book" />
          <span>Uses your Brand DNA context automatically</span>
        </div>
      </motion.div>

      <BrandDNAHero />

      {!submitted && !isStoreLoaded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ck-card p-6 mb-6 text-center"
        >
          <p className="text-sm text-text-tertiary">Loading your saved work…</p>
        </motion.div>
      )}

      {hasParams && !submitted && isStoreLoaded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ck-card p-6 mb-6"
        >
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <PillarIcon className="w-4 h-4 text-accent" icon="sparkles" />
            Configure your output
          </h2>
          <ParamForm
            params={generator.params!}
            onSubmit={handleGenerate}
            isLoading={isLoading}
          />
        </motion.div>
      )}

      {!hasParams && !submitted && isStoreLoaded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ck-card p-6 mb-6 text-center"
        >
          <p className="text-sm text-text-secondary mb-4">
            This generator uses your Brand DNA to create copy in one click.
          </p>
          <button
            onClick={() => handleGenerate({})}
            disabled={isLoading}
            className="ck-btn-primary px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-all inline-flex items-center gap-2"
          >
            <PillarIcon className="w-4 h-4" icon={isLoading ? "sparkles" : generator.icon} />
            {isLoading ? "Generating..." : "Generate Now"}
          </button>
        </motion.div>
      )}

      {submitted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {error && (
            <div className="mb-4 ck-card p-4 border-danger/40">
              <p className="text-sm text-danger">
                Generation failed. Please try again.
              </p>
            </div>
          )}

          {hasParams && (
            <div className="mb-4">
              <button
                onClick={handleChangeInputs}
                className="text-xs text-text-tertiary hover:text-text-primary transition-colors flex items-center gap-1"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                  />
                </svg>
                Change inputs
              </button>
            </div>
          )}

          <GeneratorOutput
            content={activeOutput}
            isStreaming={isLoading}
            onRegenerate={handleRegenerate}
          />
        </motion.div>
      )}

      {/* History panel */}
      {submitted && (
        <div className="mt-4">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="text-xs text-text-tertiary hover:text-text-primary transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History ({history.length})
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3"
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
      )}
    </div>
  );
}
