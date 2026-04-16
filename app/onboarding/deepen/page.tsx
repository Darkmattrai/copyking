"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { PillarCard } from "@/components/brand/pillar-card";
import { useBrandStore } from "@/lib/brand/store";
import { PILLAR_META } from "@/types/brand";
import { getPillarCompletion } from "@/lib/brand/utils";

export default function DeepenPage() {
  const router = useRouter();
  const { brandDNA } = useBrandStore();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-12">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 max-w-xl mx-auto"
          initial={{ opacity: 0, y: -10 }}
        >
          <h1 className="text-2xl font-bold text-text-primary mb-2">Your Brand DNA</h1>
          <p className="text-text-secondary text-sm">
            Your draft profile is ready. Deepen any pillar to sharpen your
            brand, or jump straight to the reveal.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">
                {brandDNA.completionScore}%
              </div>
              <div className="text-xs text-text-tertiary mt-0.5">Complete</div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8 max-w-6xl mx-auto">
          {PILLAR_META.map((meta, i) => (
            <PillarCard
              key={meta.key}
              completion={getPillarCompletion(brandDNA, meta.key)}
              index={i}
              meta={meta}
            />
          ))}
        </div>

        <motion.div
          animate={{ opacity: 1 }}
          className="text-center"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            className="ck-btn-primary !px-8 !py-3 !rounded-xl shadow-lg shadow-accent/25"
            onClick={() => router.push("/onboarding/reveal")}
          >
            See My Brand DNA Reveal
          </button>
          <p className="text-xs text-text-tertiary mt-2">
            You can always come back and deepen later
          </p>
        </motion.div>
      </div>
    </div>
  );
}
