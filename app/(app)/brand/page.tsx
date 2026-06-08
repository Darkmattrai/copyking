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

function FactList({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">
        {label}
      </dt>
      <dd>
        <ul className="space-y-1">
          {items.map((it, i) => (
            <li
              key={i}
              className="text-sm text-text-secondary flex gap-2 leading-snug"
            >
              <span className="text-accent shrink-0">•</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </dd>
    </div>
  );
}

function IntensityBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-text-tertiary mb-0.5">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
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

      {(() => {
        const icp = brandDNA.icp;
        const u = icp.universal;
        const hasUniversal =
          u &&
          (u.painChallenge?.length ||
            u.painNight?.length ||
            u.painTried?.length ||
            u.goals?.length ||
            u.emotionalFingerprint ||
            u.triggers?.length ||
            u.objections?.length ||
            u.hesitations?.length);
        const hasSegments = icp.segments?.length > 0;
        if (!hasUniversal && !hasSegments) return null;

        return (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Audience Psychology
                </h2>
                <p className="text-xs text-text-tertiary">
                  {icp.businessName ? `${icp.businessName} · ` : ""}
                  {hasSegments
                    ? `${icp.segments.length} segment${icp.segments.length === 1 ? "" : "s"} + universal block`
                    : "Universal block"}
                </p>
              </div>
              <button
                className="ck-btn-secondary !py-1.5 !px-3 text-xs"
                onClick={() => router.push("/generate/icp-map")}
              >
                Edit ICP Map
              </button>
            </div>

            {hasUniversal && (
              <div className="ck-section mb-4">
                <h3 className="text-xs font-semibold text-accent uppercase tracking-wider mb-4">
                  Universal · shared across every segment
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                  <FactList label="Core Challenges" items={u.painChallenge} />
                  <FactList label="Keeps Them Up at Night" items={u.painNight} />
                  <FactList label="Already Tried (Failed)" items={u.painTried} />
                  <FactList label="Goals" items={u.goals} />
                  <FactList label="Buying Triggers" items={u.triggers} />
                  <FactList label="Objections" items={u.objections} />
                  <FactList label="Hesitations" items={u.hesitations} />
                  {u.emotionalFingerprint && (
                    <div className="min-w-0 sm:col-span-2 lg:col-span-3">
                      <dt className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">
                        Emotional Fingerprint
                      </dt>
                      <dd className="text-sm text-text-secondary leading-snug">
                        {u.emotionalFingerprint}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {hasSegments && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {icp.segments.map((s, i) => (
                  <div key={i} className="ck-section">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-text-primary">
                        {s.name || `Segment ${i + 1}`}
                      </h3>
                      {s.oneLine && (
                        <p className="text-xs text-text-tertiary mt-0.5 leading-snug">
                          {s.oneLine}
                        </p>
                      )}
                    </div>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-4">
                      <FactList label="Pain" items={s.pain} />
                      <FactList label="Goals" items={s.goals} />
                      <FactList label="Mindset" items={s.mindset} />
                      <FactList label="Objections" items={s.objections} />
                      <FactList label="Triggers" items={s.triggers} />
                    </dl>
                    {s.intensity && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-3 border-t border-border">
                        <IntensityBar
                          label="Pain intensity"
                          value={s.intensity.painIntensity}
                        />
                        <IntensityBar
                          label="Goal clarity"
                          value={s.intensity.goalClarity}
                        />
                        <IntensityBar
                          label="Buying urgency"
                          value={s.intensity.buyingUrgency}
                        />
                        <IntensityBar
                          label="Price sensitivity"
                          value={s.intensity.priceSensitivity}
                        />
                        <IntensityBar
                          label="Skepticism"
                          value={s.intensity.skepticism}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );
      })()}

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
