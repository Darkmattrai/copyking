"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { DeepenerShell } from "../deepener-shell";
import { useBrandStore } from "@/lib/brand/store";
import { PILLAR_META } from "@/types/brand";

const PROMPTS = [
  {
    key: "originStory",
    title: "The Origin",
    prompt: "What were you doing before you started this? What was your life like?",
    placeholder: "Tell your story honestly — the struggle, the frustration, the 'before' picture...",
  },
  {
    key: "transformationMoment",
    title: "The Turning Point",
    prompt: "What was the moment everything changed? The breakthrough or revelation?",
    placeholder: "The specific moment, decision, or event that changed your trajectory...",
  },
  {
    key: "villain",
    title: "The Villain",
    prompt: "What's the thing you're fighting against? The enemy in your industry?",
    placeholder: "The broken system, false belief, or bad actor you refuse to tolerate...",
  },
  {
    key: "mission",
    title: "The Mission",
    prompt: "Why does this matter beyond money? What's the deeper reason?",
    placeholder: "The change you want to see in the world through your work...",
  },
] as const;

export function StoryPrompter() {
  const meta = PILLAR_META[5];
  const { brandDNA, updatePillar } = useBrandStore();
  const story = brandDNA.story;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    originStory: story.originStory,
    transformationMoment: story.transformationMoment,
    villain: story.villain,
    mission: story.mission,
  });
  const [vision, setVision] = useState(story.vision);
  const [coreValues, setCoreValues] = useState(story.coreValues.join(", "));
  const [done, setDone] = useState(false);

  const currentPrompt = PROMPTS[step];

  const handleNext = () => {
    if (step < PROMPTS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setDone(true);
    }
  };

  const handleSave = () => {
    updatePillar("story", {
      originStory: answers.originStory,
      transformationMoment: answers.transformationMoment,
      villain: answers.villain,
      mission: answers.mission,
      vision,
      coreValues: coreValues
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    toast.success("Brand story saved");
  };

  return (
    <DeepenerShell meta={meta}>
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key={`prompt-${step}`}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              initial={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-tertiary">
                  {step + 1} of {PROMPTS.length}
                </span>
                <div className="flex gap-1">
                  {PROMPTS.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i <= step ? "bg-accent" : "bg-border"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="ck-section !p-6">
                <h3 className="text-sm font-semibold text-accent mb-1">
                  {currentPrompt.title}
                </h3>
                <p className="text-lg font-medium text-text-primary mb-4">{currentPrompt.prompt}</p>
                <textarea
                  className="ck-input resize-none"
                  placeholder={currentPrompt.placeholder}
                  rows={5}
                  value={answers[currentPrompt.key] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [currentPrompt.key]: e.target.value,
                    }))
                  }
                />

                <div className="flex justify-between mt-4">
                  <button
                    className="text-xs text-text-tertiary hover:text-text-secondary transition-colors disabled:opacity-30"
                    disabled={step === 0}
                    onClick={() => setStep((s) => s - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="ck-btn-primary !px-6 !py-2"
                    onClick={handleNext}
                  >
                    {step === PROMPTS.length - 1 ? "Finish" : "Next"}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="final"
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
            >
              <div className="space-y-3">
                <label className="ck-label">Vision</label>
                <textarea
                  className="ck-input resize-none"
                  placeholder="What's the future you're building toward?"
                  rows={3}
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="ck-label">
                  Core Values (comma-separated)
                </label>
                <input
                  className="ck-input"
                  placeholder="Honesty, Grit, Generosity, No BS, Action over theory"
                  value={coreValues}
                  onChange={(e) => setCoreValues(e.target.value)}
                />
              </div>

              <button
                className="ck-btn-primary w-full"
                onClick={handleSave}
              >
                Save Brand Story
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DeepenerShell>
  );
}
