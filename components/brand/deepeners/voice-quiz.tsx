"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { DeepenerShell } from "../deepener-shell";
import { AutosaveIndicator } from "../autosave-indicator";
import { useBrandStore } from "@/lib/brand/store";
import { useAutosave } from "@/lib/hooks/use-autosave";
import { PILLAR_META, BRAND_ARCHETYPES } from "@/types/brand";

interface QuizQuestion {
  question: string;
  options: { label: string; archetypes: string[] }[];
}

const QUIZ: QuizQuestion[] = [
  {
    question: "Your customer just failed at something. You would...",
    options: [
      { label: "Give them a direct, no-BS pep talk", archetypes: ["The Hero", "The Outlaw"] },
      { label: "Patiently explain what went wrong and why", archetypes: ["The Sage", "The Caregiver"] },
      { label: "Make them laugh about it and try again", archetypes: ["The Jester", "The Everyman"] },
      { label: "Show them a completely new way to approach it", archetypes: ["The Magician", "The Creator"] },
    ],
  },
  {
    question: "At a dinner party, your brand would be the person who...",
    options: [
      { label: "Commands the room with bold stories", archetypes: ["The Hero", "The Ruler"] },
      { label: "Shares deep, thought-provoking insights", archetypes: ["The Sage", "The Explorer"] },
      { label: "Makes everyone feel welcome and heard", archetypes: ["The Caregiver", "The Lover"] },
      { label: "Challenges the status quo and stirs debate", archetypes: ["The Outlaw", "The Magician"] },
    ],
  },
  {
    question: "Your brand's content should make people feel...",
    options: [
      { label: "Empowered and ready to take action", archetypes: ["The Hero", "The Magician"] },
      { label: "Smarter and more informed", archetypes: ["The Sage", "The Creator"] },
      { label: "Understood and supported", archetypes: ["The Caregiver", "The Innocent"] },
      { label: "Entertained and energized", archetypes: ["The Jester", "The Explorer"] },
    ],
  },
  {
    question: "If your brand had a motto, it would be...",
    options: [
      { label: "Where there's a will, there's a way", archetypes: ["The Hero", "The Explorer"] },
      { label: "Knowledge is power", archetypes: ["The Sage", "The Ruler"] },
      { label: "Rules are meant to be broken", archetypes: ["The Outlaw", "The Jester"] },
      { label: "Together we're stronger", archetypes: ["The Caregiver", "The Everyman"] },
    ],
  },
  {
    question: "A competitor copies your strategy. You...",
    options: [
      { label: "Outwork them and prove you're the original", archetypes: ["The Hero", "The Ruler"] },
      { label: "Innovate and create something they can't copy", archetypes: ["The Creator", "The Magician"] },
      { label: "Don't care — focus on serving your people better", archetypes: ["The Caregiver", "The Innocent"] },
      { label: "Publicly call it out and double down on what makes you different", archetypes: ["The Outlaw", "The Explorer"] },
    ],
  },
  {
    question: "Your ideal customer relationship feels like...",
    options: [
      { label: "Coach and athlete — pushing them to greatness", archetypes: ["The Hero", "The Ruler"] },
      { label: "Mentor and student — sharing wisdom", archetypes: ["The Sage", "The Magician"] },
      { label: "Best friends — real, relatable, fun", archetypes: ["The Jester", "The Everyman"] },
      { label: "Guide and traveler — exploring together", archetypes: ["The Explorer", "The Creator"] },
    ],
  },
];

function computeArchetypes(answers: number[]): [string, string] {
  const tally: Record<string, number> = {};

  for (const arch of BRAND_ARCHETYPES) {
    tally[arch] = 0;
  }

  answers.forEach((ansIdx, qIdx) => {
    const opts = QUIZ[qIdx].options[ansIdx];

    if (opts) {
      opts.archetypes.forEach((a) => {
        tally[a] = (tally[a] || 0) + 1;
      });
    }
  });

  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);

  return [sorted[0][0], sorted[1][0]];
}

export function VoiceQuiz() {
  const meta = PILLAR_META[4];
  const { brandDNA, updatePillar } = useBrandStore();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showSliders, setShowSliders] = useState(false);
  const [result, setResult] = useState<[string, string] | null>(null);

  const [formalCasual, setFormalCasual] = useState(brandDNA.voice.communicationStyle.formalityCasual);
  const [techSimple, setTechSimple] = useState(brandDNA.voice.communicationStyle.technicalSimple);
  const [provNurture, setProvNurture] = useState(brandDNA.voice.communicationStyle.provocativeNurturing);

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers, optionIdx];

    setAnswers(newAnswers);

    if (newAnswers.length === QUIZ.length) {
      const archetypes = computeArchetypes(newAnswers);

      setResult(archetypes);
      setShowSliders(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  const payload = {
    primaryArchetype: result?.[0] ?? "",
    secondaryArchetype: result?.[1] ?? "",
    communicationStyle: {
      formalityCasual: formalCasual,
      technicalSimple: techSimple,
      provocativeNurturing: provNurture,
    },
  };

  // Only autosave once the quiz has produced an archetype result.
  const status = useAutosave(payload, (p) => updatePillar("voice", p), {
    enabled: !!result,
  });

  const handleSave = () => {
    if (!result) return;
    updatePillar("voice", payload);
    toast.success("Voice profile saved");
  };

  return (
    <DeepenerShell meta={meta}>
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {!showSliders ? (
            <motion.div
              key={`q-${step}`}
              animate={{ opacity: 1, x: 0 }}
              className="ck-section !p-6"
              exit={{ opacity: 0, x: -20 }}
              initial={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-text-tertiary">
                  {step + 1} of {QUIZ.length}
                </span>
                <div className="flex gap-1">
                  {QUIZ.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i < answers.length ? "bg-accent" : i === step ? "bg-text-tertiary" : "bg-border"}`}
                    />
                  ))}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-text-primary mb-5">
                {QUIZ[step].question}
              </h3>

              <div className="space-y-2">
                {QUIZ[step].options.map((opt, i) => (
                  <button
                    key={i}
                    className="ck-card w-full text-left px-4 py-3 text-sm text-text-primary"
                    onClick={() => handleAnswer(i)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
            >
              {result && (
                <div className="ck-section !p-6 text-center">
                  <div className="text-xs text-text-tertiary uppercase tracking-wider mb-2">
                    Your Brand Archetype
                  </div>
                  <motion.div
                    animate={{ scale: 1 }}
                    className="text-3xl font-black text-accent"
                    initial={{ scale: 0.5 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                  >
                    {result[0]}
                  </motion.div>
                  <div className="text-sm text-text-secondary mt-1">
                    with a hint of {result[1]}
                  </div>
                </div>
              )}

              <div className="ck-section space-y-5">
                <h3 className="text-sm font-semibold text-text-primary">Tone Spectrum</h3>

                {[
                  { label: "Formal vs Casual", value: formalCasual, set: setFormalCasual, low: "Formal", high: "Casual" },
                  { label: "Technical vs Simple", value: techSimple, set: setTechSimple, low: "Technical", high: "Simple" },
                  { label: "Provocative vs Nurturing", value: provNurture, set: setProvNurture, low: "Provocative", high: "Nurturing" },
                ].map((s) => (
                  <div key={s.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">{s.label}</span>
                      <span className="text-accent font-medium">{s.value}/10</span>
                    </div>
                    <input
                      aria-label={s.label}
                      className="ck-range"
                      max={10}
                      min={1}
                      type="range"
                      value={s.value}
                      onChange={(e) => s.set(Number(e.target.value))}
                    />
                    <div className="flex justify-between text-xs text-text-tertiary">
                      <span>{s.low}</span>
                      <span>{s.high}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <AutosaveIndicator status={status} />
                <button className="ck-btn-primary" onClick={handleSave}>
                  Save Voice Profile
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DeepenerShell>
  );
}
