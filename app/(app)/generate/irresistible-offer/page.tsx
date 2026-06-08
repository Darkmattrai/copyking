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
import {
  brandToProduct,
  offerToBrand,
  flagshipProduct,
  chatOfferToProduct,
  chatIcpToBrand,
  type ChatOfferPayload,
} from "@/lib/offer/brand-bridge";
import {
  buildOfferBrandContext,
  hasIcpBuilt,
} from "@/lib/offer/brand-context";
import { OfferBuilderShell } from "@/components/generators/offer/offer-builder-shell";
import { OfferPreview } from "@/components/generators/offer/offer-preview";
import { OfferGuidedChat } from "@/components/generators/offer/offer-guided-chat";
import { productHasContent } from "@/lib/offer/assemble";

const SLUG = "irresistible-offer";

type Mode = "select" | "guided" | "manual";

export default function IrresistibleOfferPage() {
  const router = useRouter();
  const generator = getGenerator(SLUG);

  const brandDNA = useBrandStore((s) => s.brandDNA);
  const updatePillar = useBrandStore((s) => s.updatePillar);
  const setGeneration = useGenerationsStore((s) => s.setGeneration);

  const { offer, enhancements, updateProduct, setOfferName, reset } =
    useOfferDraftStore();

  const [seeded, setSeeded] = useState(false);
  const [mode, setMode] = useState<Mode>("select");

  // Seed once from Brand DNA into the flagship product, only when that product is
  // still untouched (no avatar / dream / price entered yet).
  useEffect(() => {
    if (seeded) return;
    const flag = flagshipProduct(offer);
    const untouched = flag && !flag.who && !flag.dream && !flag.realPrice;
    if (untouched) {
      const seedFromBrand = brandToProduct(brandDNA.offer);
      if (Object.keys(seedFromBrand).length) {
        // Locate the flagship's [ladder, product] indices to patch it in place.
        for (let li = 0; li < offer.ladders.length; li++) {
          const pi = offer.ladders[li].products.findIndex((p) => p.id === flag.id);
          if (pi !== -1) {
            updateProduct(li, pi, seedFromBrand);
            break;
          }
        }
      }
    }
    // Returning users with an existing offer land straight in the builder;
    // a blank slate gets the guided/manual mode picker first.
    const hasContent = offer.ladders.some((L) =>
      L.products.some(productHasContent),
    );
    if (hasContent) setMode("manual");
    setSeeded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seeded]);

  // Apply a finished offer from the guided chat: seed the flagship product,
  // set the offer name, and write any inline-gathered audience back to Brand DNA.
  // The offer pillar itself syncs via the autosave effect below.
  const applyChatOffer = (payload: ChatOfferPayload) => {
    const flag = flagshipProduct(offer);
    const productPatch = chatOfferToProduct(payload.product);
    if (flag && Object.keys(productPatch).length) {
      for (let li = 0; li < offer.ladders.length; li++) {
        const pi = offer.ladders[li].products.findIndex((p) => p.id === flag.id);
        if (pi !== -1) {
          updateProduct(li, pi, productPatch);
          break;
        }
      }
    }
    if (typeof payload.offerName === "string" && payload.offerName.trim()) {
      setOfferName(payload.offerName.trim());
    }
    if (payload.icp) {
      const icpPatch = chatIcpToBrand(payload.icp);
      if (Object.keys(icpPatch).length) updatePillar("icp", icpPatch);
    }
    setMode("manual");
  };

  // Autosave the offer draft straight into Brand DNA + the account as the user
  // types — no manual "Save" step. Short debounce so it feels instant while
  // still coalescing rapid keystrokes into one write.
  const autosaveStatus = useAutosave(
    { offer, enhancements },
    async ({ offer: o, enhancements: e }) => {
      updatePillar("offer", offerToBrand(o));
      await setGeneration(SLUG, {
        content: JSON.stringify({ offer: o, enhancements: e }),
        params: {},
      });
    },
    { enabled: seeded, delay: 400 },
  );

  const startOver = () => {
    if (confirm("Clear this offer and start over?")) {
      reset();
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
          {mode === "manual" && (
            <div className="flex items-center gap-3">
              <AutosaveIndicator status={autosaveStatus} />
              <button
                type="button"
                onClick={startOver}
                className="ck-btn-secondary"
              >
                Start over
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <BrandDNAHero />

      {mode === "select" ? (
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
              Don&apos;t know what to sell yet? Answer a few questions and let
              Claude propose and assemble a Grand-Slam offer for you.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode("manual")}
            className="ck-card p-6 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-3">
              <PillarIcon className="w-5 h-5" icon="offer" />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">
              Build it yourself
            </h3>
            <p className="text-sm text-text-tertiary">
              Go straight to the step-by-step builder. Pre-filled from your Brand
              DNA where possible.
            </p>
          </button>
        </div>
      ) : mode === "guided" ? (
        /* GUIDED CHAT */
        <div className="max-w-3xl">
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setMode("select")}
              className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
            >
              ← Change mode
            </button>
          </div>
          <OfferGuidedChat
            brandContext={buildOfferBrandContext(brandDNA)}
            hasIcp={hasIcpBuilt(brandDNA)}
            onReady={applyChatOffer}
            onSwitchToManual={() => setMode("manual")}
          />
        </div>
      ) : (
        /* MANUAL BUILDER */
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <OfferBuilderShell />
          <div>
            <OfferPreview offer={offer} />
          </div>
        </div>
      )}
    </div>
  );
}
