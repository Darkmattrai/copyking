"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useBrandStore } from "@/lib/brand/store";
import { useGenerationsStore } from "@/lib/generators/store";
import { getGenerator } from "@/lib/generators/registry";
import { useAutosave } from "@/lib/hooks/use-autosave";
import { AutosaveIndicator } from "@/components/brand/autosave-indicator";
import { PillarIcon } from "@/components/brand/pillar-icon";
import { useIcpDraftStore, blankSegment } from "@/lib/icp/store";
import { brandToIntake, icpToBrandUpdate } from "@/lib/icp/brand-bridge";
import type { Intake } from "@/lib/icp/schema";
import { IcpIntakeForm } from "@/components/generators/icp/icp-intake-form";
import { IcpGuidedChat } from "@/components/generators/icp/icp-guided-chat";
import { IcpMapPreview } from "@/components/generators/icp/icp-map-preview";

const SLUG = "icp-map";

type Mode = "select" | "guided" | "manual";

export default function IcpMapPage() {
  const router = useRouter();
  const generator = getGenerator(SLUG);

  const brandDNA = useBrandStore((s) => s.brandDNA);
  const updatePillars = useBrandStore((s) => s.updatePillars);
  const setGeneration = useGenerationsStore((s) => s.setGeneration);

  const {
    result,
    setResult,
    formData,
    setFormData,
    segments,
    setSegments,
    lastIntake,
    setLastIntake,
    reset,
  } = useIcpDraftStore();

  const [mode, setMode] = useState<Mode>("select");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // Seed the manual form from Brand DNA once, if the draft is still empty.
  useEffect(() => {
    if (seeded) return;
    const draftEmpty =
      !formData.businessName &&
      !formData.industry &&
      segments.every((s) => !s.pain && !s.goals && !s.name.includes(":"));
    const hasBrand =
      brandDNA.icp.name ||
      brandDNA.icp.painPoints.length ||
      brandDNA.icp.dreamOutcome;
    if (draftEmpty && hasBrand) {
      const seed = brandToIntake(brandDNA.icp);
      if (seed.industry || seed.channels) {
        setFormData({
          industry: seed.industry,
          channels: seed.channels,
        });
      }
      if (seed.segments?.length) {
        setSegments(
          seed.segments.map((s, i) => ({ ...blankSegment(i + 1), ...s })),
        );
      }
    }
    setSeeded(true);
  }, [seeded, formData, segments, brandDNA, setFormData, setSegments]);

  // Autosave the intake draft (and any generated map) to the account.
  // logoDataUrl is intentionally excluded to keep payloads small.
  const autosaveStatus = useAutosave(
    { formData, segments, result, lastIntake },
    (draft) =>
      setGeneration(SLUG, {
        content: JSON.stringify(draft),
        params: {},
      }),
    { enabled: seeded, delay: 1500 },
  );

  const generate = async (intake: Intake) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/icp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intake),
      });
      if (!res.ok) {
        const { error: e } = await res
          .json()
          .catch(() => ({ error: `Server error ${res.status}` }));
        throw new Error(e ?? `Server error ${res.status}`);
      }
      const icp = await res.json();
      setResult(icp);
      setLastIntake(intake);
      // Mirror EVERY captured field into Brand DNA across pillars, then await
      // the sync so the data is actually persisted before we mark it saved.
      const patch = icpToBrandUpdate(
        icp,
        intake,
        useBrandStore.getState().brandDNA,
      );
      await updatePillars(patch);
      await setGeneration(SLUG, {
        content: JSON.stringify({ formData, segments, result: icp, intake }),
        params: {},
      });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate ICP map",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveToBrand = async () => {
    if (!result) return;
    const patch = icpToBrandUpdate(
      result,
      lastIntake ?? undefined,
      useBrandStore.getState().brandDNA,
    );
    await updatePillars(patch);
    await setGeneration(SLUG, {
      content: JSON.stringify({
        formData,
        segments,
        result,
        intake: lastIntake,
      }),
      params: {},
    });
    setSaved(true);
  };

  const startOver = () => {
    setResult(null);
    setMode("select");
    setError(null);
    setSaved(false);
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

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white shrink-0">
            <PillarIcon className="w-6 h-6" icon="target" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {generator.name}
            </h1>
            <p className="text-sm text-text-tertiary mt-1 max-w-lg">
              {generator.description}
            </p>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                <PillarIcon className="w-3.5 h-3.5" icon="book" />
                Seeds from your Brand DNA
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                <PillarIcon className="w-3.5 h-3.5" icon="sparkles" />
                Guided or manual flow
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* RESULT VIEW */}
      {result ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveToBrand}
                className="ck-btn-primary"
                disabled={saved}
              >
                {saved ? "Saved to Brand DNA ✓" : "Save to Brand DNA"}
              </button>
              <button
                type="button"
                onClick={startOver}
                className="ck-btn-secondary"
              >
                Start over
              </button>
            </div>
            <AutosaveIndicator status={autosaveStatus} />
          </div>
          <IcpMapPreview
            icp={result}
            logoDataUrl={useIcpDraftStore.getState().logoDataUrl}
          />
        </div>
      ) : mode === "select" ? (
        /* MODE SELECTOR */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
          <button
            type="button"
            onClick={() => setMode("guided")}
            className="ck-card p-6 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-3">
              <PillarIcon className="w-5 h-5" icon="sparkles" />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">
              Guided interview
            </h3>
            <p className="text-sm text-text-tertiary">
              Answer a few questions and let Claude assemble the intake for you.
              Fastest if you&apos;re starting fresh.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode("manual")}
            className="ck-card p-6 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-3">
              <PillarIcon className="w-5 h-5" icon="target" />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">
              Manual form
            </h3>
            <p className="text-sm text-text-tertiary">
              Fill in your business and audience segments directly. Pre-filled
              from your Brand DNA where possible.
            </p>
          </button>
        </div>
      ) : mode === "guided" ? (
        /* GUIDED CHAT */
        <div className="max-w-3xl">
          {submitting ? (
            <div className="ck-card p-12 flex flex-col items-center justify-center gap-3">
              <span className="relative h-6 w-6">
                <span className="absolute inset-0 rounded-full border-2 border-border" />
                <span className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              </span>
              <p className="text-sm text-text-secondary">
                Synthesising your psychology map…
              </p>
            </div>
          ) : (
            <IcpGuidedChat
              onReady={generate}
              onSwitchToManual={() => setMode("manual")}
            />
          )}
          {error && (
            <div className="mt-4 p-4 rounded-xl border border-danger/30 bg-danger/[0.06] text-sm text-danger">
              {error}
            </div>
          )}
        </div>
      ) : (
        /* MANUAL FORM */
        <div className="max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setMode("select")}
              className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
            >
              ← Change mode
            </button>
            <div className="flex items-center gap-3">
              <AutosaveIndicator status={autosaveStatus} />
              <button
                type="button"
                onClick={reset}
                className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
              >
                Clear form
              </button>
            </div>
          </div>
          <IcpIntakeForm
            submitting={submitting}
            error={error}
            onSubmit={generate}
          />
        </div>
      )}
    </div>
  );
}
