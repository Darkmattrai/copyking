"use client";

import { useBrandStore } from "@/lib/brand/store";
import { PillarIcon } from "@/components/brand/pillar-icon";

export function BrandDNAHero() {
  const brandDNA = useBrandStore((s) => s.brandDNA);

  const niche = [brandDNA.niche.marketCategory, brandDNA.niche.subNiche]
    .filter(Boolean)
    .join(" — ");
  const icpName = brandDNA.icp.name;
  const positioning = brandDNA.positioning.positioningStatement;
  const archetype = [
    brandDNA.voice.primaryArchetype,
    brandDNA.voice.secondaryArchetype,
  ]
    .filter(Boolean)
    .join(" + ");

  const hasContent = niche || icpName || positioning || archetype;
  if (!hasContent) return null;

  const fields = [
    { icon: "target" as const, label: "Niche", value: niche },
    { icon: "heart" as const, label: "ICP", value: icpName },
    { icon: "flag" as const, label: "Positioning", value: positioning },
    { icon: "sparkles" as const, label: "Voice", value: archetype },
  ].filter((f) => f.value);

  return (
    <div className="ck-card p-4 border-accent/20 bg-accent/[0.03] mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <PillarIcon className="w-4 h-4 text-accent" icon="book" />
        <span className="text-xs font-semibold text-accent uppercase tracking-wider">
          Brand DNA Context
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
        {fields.map((f) => (
          <div key={f.label} className="flex items-start gap-2 min-w-0">
            <PillarIcon className="w-3.5 h-3.5 text-text-tertiary shrink-0 mt-0.5" icon={f.icon} />
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
                {f.label}
              </span>
              <p className="text-xs text-text-primary leading-snug truncate">
                {f.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
