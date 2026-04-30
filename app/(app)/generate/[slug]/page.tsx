"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { motion } from "framer-motion";

import { getGenerator } from "@/lib/generators/registry";
import { useBrandStore } from "@/lib/brand/store";
import { useGenerationsStore } from "@/lib/generators/store";
import { PillarIcon } from "@/components/brand/pillar-icon";
import { ParamForm } from "@/components/generators/param-form";
import { GeneratorOutput } from "@/components/generators/generator-output";

export default function GeneratorPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const generator = getGenerator(slug);
  const brandDNA = useBrandStore((s) => s.brandDNA);
  const hasParams = generator?.params && generator.params.length > 0;
  const [submitted, setSubmitted] = useState(false);
  const [hydratedFromCache, setHydratedFromCache] = useState(false);
  const lastParamsRef = useRef<Record<string, string>>({});
  const prevIsLoadingRef = useRef(false);

  const cachedGeneration = useGenerationsStore(
    (s) => s.generations[slug],
  );
  const setGeneration = useGenerationsStore((s) => s.setGeneration);
  const clearGeneration = useGenerationsStore((s) => s.clearGeneration);

  const { completion, isLoading, complete, setCompletion, error } = useCompletion({
    api: "/api/generate",
    streamProtocol: "text",
  });

  // Hydrate completion + form state from persisted store on first mount.
  useEffect(() => {
    if (hydratedFromCache) return;
    if (cachedGeneration && cachedGeneration.content) {
      setCompletion(cachedGeneration.content);
      lastParamsRef.current = cachedGeneration.params || {};
      setSubmitted(true);
    }
    setHydratedFromCache(true);
  }, [hydratedFromCache, cachedGeneration, setCompletion]);

  // Persist completion to the store when streaming finishes.
  useEffect(() => {
    const finishedStreaming =
      prevIsLoadingRef.current && !isLoading && completion.length > 100;
    if (finishedStreaming) {
      setGeneration(slug, {
        content: completion,
        params: lastParamsRef.current,
      });
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading, completion, slug, setGeneration]);

  const handleGenerate = useCallback(
    async (formParams?: Record<string, string>) => {
      const paramValues = formParams ?? lastParamsRef.current;
      lastParamsRef.current = paramValues;
      setSubmitted(true);
      setCompletion("");

      await complete("", {
        body: {
          slug,
          params: paramValues,
          brandDNA,
        },
      });
    },
    [slug, brandDNA, complete, setCompletion],
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

      {hasParams && !submitted && (
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

      {!hasParams && !submitted && (
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
            content={completion}
            isStreaming={isLoading}
            onRegenerate={handleRegenerate}
          />
        </motion.div>
      )}
    </div>
  );
}
