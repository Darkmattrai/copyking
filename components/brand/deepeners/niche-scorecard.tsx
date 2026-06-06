"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { DeepenerShell } from "../deepener-shell";
import { AutosaveIndicator } from "../autosave-indicator";
import { useBrandStore } from "@/lib/brand/store";
import { useAutosave } from "@/lib/hooks/use-autosave";
import { PILLAR_META } from "@/types/brand";

const FACTORS = [
  {
    key: "growing",
    label: "Market Growth",
    question: "Is your market growing?",
    low: "Shrinking",
    high: "Booming",
  },
  {
    key: "targetable",
    label: "Easy to Target",
    question: "How easy is it to find and reach them?",
    low: "Scattered everywhere",
    high: "All in one place",
  },
  {
    key: "purchasing",
    label: "Purchasing Power",
    question: "Do they have money to spend?",
    low: "Penny-pinching",
    high: "Money is no object",
  },
  {
    key: "pain",
    label: "Pain Level",
    question: "How desperate is their pain?",
    low: "Mild annoyance",
    high: "Hair on fire",
  },
] as const;

function getGrade(total: number): { letter: string; color: string; feedback: string } {
  if (total >= 18) return { letter: "A", color: "text-success", feedback: "You've found an ideal market. This is a strong niche — high demand, accessible, and they can pay." };
  if (total >= 14) return { letter: "B", color: "text-accent", feedback: "Solid niche with room to improve. Consider niching down further for higher prices and easier targeting." };
  if (total >= 10) return { letter: "C", color: "text-warning", feedback: "Decent foundation but some weak spots. Look at where you scored lowest and brainstorm ways to improve." };

  return { letter: "D", color: "text-danger", feedback: "This market might be tough. Consider pivoting to a sub-niche with more pain, more money, or easier targeting." };
}

export function NicheScorecard() {
  const meta = PILLAR_META[0];
  const { brandDNA, updatePillar } = useBrandStore();

  // Init sliders once from the saved pillar; afterwards they are user-owned
  // (autosave writes back, so we must not re-derive from brandDNA on change).
  const [scores, setScores] = useState(() => ({
    growing: brandDNA.niche.isGrowing ? 4 : 3,
    targetable: brandDNA.niche.easyToTarget ? 4 : 3,
    purchasing:
      brandDNA.niche.purchasingPower === "high"
        ? 5
        : brandDNA.niche.purchasingPower === "medium"
          ? 3
          : 1,
    pain: Math.round(brandDNA.niche.painLevel / 2) || 3,
  }));

  const [marketCategory, setMarketCategory] = useState(brandDNA.niche.marketCategory);
  const [subNiche, setSubNiche] = useState(brandDNA.niche.subNiche);
  const [congregations, setCongregations] = useState(brandDNA.niche.congregationPoints.join(", "));

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const grade = getGrade(total);

  const payload = {
    marketCategory,
    subNiche,
    isGrowing: scores.growing >= 3,
    easyToTarget: scores.targetable >= 3,
    purchasingPower: (scores.purchasing >= 4
      ? "high"
      : scores.purchasing >= 2
        ? "medium"
        : "low") as "high" | "medium" | "low",
    painLevel: scores.pain * 2,
    congregationPoints: congregations.split(",").map((s) => s.trim()).filter(Boolean),
  };

  const status = useAutosave(payload, (p) => updatePillar("niche", p));

  const handleSave = () => {
    updatePillar("niche", payload);
    toast.success("Niche profile saved");
  };

  return (
    <DeepenerShell meta={meta}>
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="ck-label">Market Category</label>
          <input
            className="ck-input"
            placeholder="e.g. Health > Weight Loss > Busy Moms"
            value={marketCategory}
            onChange={(e) => setMarketCategory(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <label className="ck-label">Sub-Niche</label>
          <input
            className="ck-input"
            placeholder="e.g. Post-partum weight loss for first-time moms"
            value={subNiche}
            onChange={(e) => setSubNiche(e.target.value)}
          />
        </div>

        <div className="ck-section space-y-5">
          <h3 className="text-sm font-semibold text-text-primary">4-Factor Niche Scorecard</h3>

          {FACTORS.map((factor) => (
            <div key={factor.key} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">{factor.question}</span>
                <span className="text-sm font-bold text-accent">
                  {scores[factor.key]}/5
                </span>
              </div>
              <input
                aria-label={factor.label}
                className="ck-range"
                max={5}
                min={1}
                type="range"
                value={scores[factor.key]}
                onChange={(e) =>
                  setScores((p) => ({
                    ...p,
                    [factor.key]: Number(e.target.value),
                  }))
                }
              />
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>{factor.low}</span>
                <span>{factor.high}</span>
              </div>
            </div>
          ))}

          <motion.div
            key={total}
            animate={{ scale: 1 }}
            className="text-center pt-4 border-t border-border"
            initial={{ scale: 0.95 }}
          >
            <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
              Niche Grade
            </div>
            <div className={`text-5xl font-black ${grade.color}`}>
              {grade.letter}
            </div>
            <div className="text-xs text-text-secondary mt-2 max-w-sm mx-auto">
              {grade.feedback}
            </div>
          </motion.div>
        </div>

        <div className="space-y-3">
          <label className="ck-label">
            Where does your audience hang out?
          </label>
          <input
            className="ck-input"
            placeholder="Facebook groups, Instagram, Reddit, podcasts..."
            value={congregations}
            onChange={(e) => setCongregations(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <AutosaveIndicator status={status} />
          <button className="ck-btn-primary" onClick={handleSave}>
            Save Niche Profile
          </button>
        </div>
      </div>
    </DeepenerShell>
  );
}
