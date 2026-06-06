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
import { BrandDNAHero } from "@/components/generators/brand-dna-hero";
import { useOfferDraftStore } from "@/lib/offer/store";
import { seed } from "@/lib/offer/seed";
import { brandToOffer, offerToBrand } from "@/lib/offer/brand-bridge";
import { OfferBuilderShell } from "@/components/generators/offer/offer-builder-shell";
import { OfferPreview } from "@/components/generators/offer/offer-preview";

const SLUG = "irresistible-offer";

export default function IrresistibleOfferPage() {
  const router = useRouter();
  const generator = getGenerator(SLUG);

  const brandDNA = useBrandStore((s) => s.brandDNA);
  const updatePillar = useBrandStore((s) => s.updatePillar);
  const setGeneration = useGenerationsStore((s) => s.setGeneration);

  const { offer, patch, reset } = useOfferDraftStore();

  const [seeded, setSeeded] = useState(false);
  const [saved, setSaved] = useState(false);

  // Seed once from Brand DNA, only when the draft is still at seed defaults.
  useEffect(() => {
    if (seeded) return;
    const base = seed();
    const untouched =
      !offer.who &&
      !offer.dream &&
      offer.trim === base.trim &&
      offer.realPrice === base.realPrice;
    if (untouched) {
      const seedFromBrand = brandToOffer(brandDNA.offer);
      if (Object.keys(seedFromBrand).length) patch(seedFromBrand);
    }
    setSeeded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seeded]);

  // Autosave the offer draft to the account once seeding is done.
  const autosaveStatus = useAutosave(
    offer,
    async (o) => {
      updatePillar("offer", offerToBrand(o));
      await setGeneration(SLUG, { content: JSON.stringify(o), params: {} });
    },
    { enabled: seeded, delay: 1500 },
  );

  const handleSave = async () => {
    updatePillar("offer", offerToBrand(offer));
    await setGeneration(SLUG, {
      content: JSON.stringify(offer),
      params: {},
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const startOver = () => {
    if (confirm("Clear this offer and start over?")) {
      reset();
      setSaved(false);
    }
  };

  if (!generator) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-text-secondary">Generator not registered.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
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

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shrink-0">
              <PillarIcon className="w-6 h-6" icon="offer" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {generator.name}
              </h1>
              <p className="text-sm text-text-tertiary mt-1 max-w-lg">
                {generator.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AutosaveIndicator status={autosaveStatus} />
            <button
              type="button"
              onClick={handleSave}
              className="ck-btn-primary"
            >
              {saved ? "Saved ✓" : "Save to Brand DNA"}
            </button>
            <button
              type="button"
              onClick={startOver}
              className="ck-btn-secondary"
            >
              Start over
            </button>
          </div>
        </div>
      </motion.div>

      <BrandDNAHero />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <OfferBuilderShell />
        <div>
          <OfferPreview offer={offer} />
        </div>
      </div>
    </div>
  );
}
