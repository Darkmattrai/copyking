"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { DeepenerShell } from "../deepener-shell";
import { useBrandStore } from "@/lib/brand/store";
import { PILLAR_META } from "@/types/brand";

const SLIDERS = [
  {
    key: "dreamOutcomeScore",
    label: "Dream Outcome",
    description: "How transformative is the result you deliver?",
    low: "Incremental improvement",
    high: "Life-changing transformation",
    multiply: true,
  },
  {
    key: "likelihoodScore",
    label: "Perceived Likelihood",
    description: "How confident are they it will work?",
    low: "Skeptical",
    high: "Guaranteed results",
    multiply: true,
  },
  {
    key: "timeScore",
    label: "Time Delay",
    description: "How fast do they see results?",
    low: "Years",
    high: "Instant",
    multiply: false,
  },
  {
    key: "effortScore",
    label: "Effort Required",
    description: "How much work does the customer do?",
    low: "Massive effort",
    high: "Done for them",
    multiply: false,
  },
] as const;

type ScoreKey = (typeof SLIDERS)[number]["key"];

function getScoreColor(score: number) {
  if (score >= 7) return "text-success";
  if (score >= 4) return "text-warning";

  return "text-danger";
}

export function OfferCalculator() {
  const meta = PILLAR_META[2];
  const { brandDNA, updatePillar } = useBrandStore();

  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    dreamOutcomeScore: 5,
    likelihoodScore: 5,
    timeScore: 5,
    effortScore: 5,
  });

  const [dreamOutcome, setDreamOutcome] = useState(brandDNA.offer.dreamOutcome);
  const [perceivedLikelihood, setPerceivedLikelihood] = useState(brandDNA.offer.perceivedLikelihood);
  const [timeDelay, setTimeDelay] = useState(brandDNA.offer.timeDelay);
  const [effortRequired, setEffortRequired] = useState(brandDNA.offer.effortRequired);
  const [grandSlam, setGrandSlam] = useState(brandDNA.offer.grandSlamDescription);

  const numerator = scores.dreamOutcomeScore * scores.likelihoodScore;
  const denominator = Math.max((11 - scores.timeScore) * (11 - scores.effortScore), 1);
  const valueScore = Math.round((numerator / denominator) * 10);

  useEffect(() => {
    if (brandDNA.offer.valueScore > 0) {
      // rough reverse from stored score
    }
  }, [brandDNA.offer.valueScore]);

  const handleSave = () => {
    updatePillar("offer", {
      dreamOutcome,
      perceivedLikelihood,
      timeDelay,
      effortRequired,
      grandSlamDescription: grandSlam,
      valueScore: Math.min(valueScore, 40),
    });
    toast.success("Offer saved");
  };

  return (
    <DeepenerShell meta={meta}>
      <div className="space-y-6">
        <div className="ck-section">
          <div className="text-center mb-4">
            <div className="text-xs text-text-tertiary uppercase tracking-wider mb-2">
              Value Equation
            </div>
            <div className="text-sm text-text-secondary font-mono">
              Value = (Dream Outcome &times; Likelihood) &divide; (Time &times;
              Effort)
            </div>
          </div>

          <div className="space-y-5">
            {SLIDERS.map((slider) => (
              <div key={slider.key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-text-primary">{slider.label}</span>
                    <p className="text-xs text-text-tertiary">{slider.description}</p>
                  </div>
                  <span className={`text-lg font-bold ${getScoreColor(scores[slider.key])}`}>
                    {scores[slider.key]}
                  </span>
                </div>
                <input
                  aria-label={slider.label}
                  className="ck-range"
                  max={10}
                  min={1}
                  type="range"
                  value={scores[slider.key]}
                  onChange={(e) =>
                    setScores((p) => ({
                      ...p,
                      [slider.key]: Number(e.target.value),
                    }))
                  }
                />
                <div className="flex justify-between text-xs text-text-tertiary">
                  <span>{slider.low}</span>
                  <span>{slider.high}</span>
                </div>
              </div>
            ))}
          </div>

          <motion.div
            key={valueScore}
            animate={{ scale: 1 }}
            className="text-center pt-5 mt-5 border-t border-border"
            initial={{ scale: 0.95 }}
          >
            <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
              Value Score
            </div>
            <div className={`text-5xl font-black ${getScoreColor(valueScore / 4)}`}>
              {valueScore}
            </div>
            <div className="text-xs text-text-tertiary mt-1">
              {valueScore >= 70 ? "Irresistible offer territory" : valueScore >= 40 ? "Good — room to optimize" : "Needs work on the value proposition"}
            </div>
          </motion.div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="ck-label">Dream Outcome</label>
            <textarea className="ck-input resize-none" placeholder="What transformation do you deliver?" rows={2} value={dreamOutcome} onChange={(e) => setDreamOutcome(e.target.value)} />
          </div>
          <div>
            <label className="ck-label">Why Should They Believe It Works?</label>
            <textarea className="ck-input resize-none" placeholder="Social proof, guarantees, track record..." rows={2} value={perceivedLikelihood} onChange={(e) => setPerceivedLikelihood(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ck-sublabel">Time to Results</label>
              <input className="ck-input" placeholder="e.g. 30 days" value={timeDelay} onChange={(e) => setTimeDelay(e.target.value)} />
            </div>
            <div>
              <label className="ck-sublabel">Effort Required</label>
              <input className="ck-input" placeholder="e.g. 1 hr/week" value={effortRequired} onChange={(e) => setEffortRequired(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="ck-label">Irresistible Offer Description</label>
            <textarea className="ck-input resize-none" placeholder="Describe the full offer — what's included, the guarantee, the bonuses..." rows={3} value={grandSlam} onChange={(e) => setGrandSlam(e.target.value)} />
          </div>
        </div>

        <button className="ck-btn-primary w-full" onClick={handleSave}>
          Save Offer
        </button>
      </div>
    </DeepenerShell>
  );
}
