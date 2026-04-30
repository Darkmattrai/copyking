"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { PillarCard } from "@/components/brand/pillar-card";
import { HydrationGuard } from "@/components/hydration-guard";
import { useBrandStore } from "@/lib/brand/store";
import { PILLAR_META } from "@/types/brand";
import { getPillarCompletion, createMockBrandDNA } from "@/lib/brand/utils";

function SummaryField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value) return null;

  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-text-tertiary uppercase tracking-wider mb-0.5">
        {label}
      </dt>
      <dd className="text-sm text-text-secondary truncate">{value}</dd>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { brandDNA, interviewCompleted, setBrandDNA, setInterviewCompleted } =
    useBrandStore();

  if (!interviewCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-3">No Brand DNA Yet</h1>
        <p className="text-text-secondary mb-6 max-w-md">
          Complete the brand discovery interview to build your Brand DNA — or
          load a demo brand to test the generators immediately.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            className="ck-btn-primary !px-8 !py-3 !rounded-xl"
            onClick={() => router.push("/onboarding")}
          >
            Start Discovery
          </button>
          <button
            className="ck-btn-secondary !px-6 !py-3 !rounded-xl"
            onClick={() => {
              setBrandDNA(createMockBrandDNA());
              setInterviewCompleted(true);
            }}
          >
            Load Demo Brand DNA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Brand DNA</h1>
            <p className="text-sm text-text-tertiary">
              Your complete brand identity profile
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">
              {brandDNA.completionScore}%
            </div>
            <div className="text-xs text-text-tertiary">Complete</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="ck-section mb-8"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-sm font-semibold text-text-primary mb-4">Brand Summary</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryField label="Niche" value={brandDNA.niche.marketCategory} />
          <SummaryField label="Dream Customer" value={brandDNA.icp.name} />
          <SummaryField
            label="Positioning"
            value={brandDNA.positioning.positioningStatement}
          />
          <SummaryField
            label="Archetype"
            value={
              brandDNA.voice.primaryArchetype
                ? `${brandDNA.voice.primaryArchetype}${brandDNA.voice.secondaryArchetype ? ` / ${brandDNA.voice.secondaryArchetype}` : ""}`
                : ""
            }
          />
          <SummaryField label="Tagline" value={brandDNA.messaging.tagline} />
          <SummaryField label="One-Liner" value={brandDNA.messaging.oneLiner} />
          <SummaryField label="Mission" value={brandDNA.story.mission} />
          <SummaryField
            label="Tone"
            value={brandDNA.voice.toneAttributes.join(", ")}
          />
        </dl>
      </motion.div>

      <h2 className="text-sm font-semibold text-text-primary mb-4">Pillars</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 mb-8">
        {PILLAR_META.map((meta, i) => (
          <PillarCard
            key={meta.key}
            completion={getPillarCompletion(brandDNA, meta.key)}
            hrefPrefix="/brand/deepen"
            index={i}
            meta={meta}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <button
          className="ck-btn-secondary"
          onClick={() => router.push("/onboarding/reveal")}
        >
          View Reveal Again
        </button>
        <button
          className="ck-btn-secondary"
          onClick={() => router.push("/onboarding")}
        >
          Redo Interview
        </button>
      </div>
    </div>
  );
}

export default function BrandDashboardPage() {
  return (
    <HydrationGuard>
      <DashboardContent />
    </HydrationGuard>
  );
}
