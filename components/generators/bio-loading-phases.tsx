"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PHASES = [
  { label: "Analyzing your brand DNA...", icon: "dna", duration: 3000 },
  { label: "Running SEO keyword audit...", icon: "search", duration: 4000 },
  { label: "Writing 6 bio variations...", icon: "pen", duration: 5000 },
  { label: "Building profile strategy...", icon: "strategy", duration: 4000 },
  { label: "Scoring your bio...", icon: "score", duration: 3000 },
];

function PhaseIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "dna":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      );
    case "search":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      );
    case "pen":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
        </svg>
      );
    case "strategy":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      );
    case "score":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
}

export function BioLoadingPhases() {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = PHASES.reduce((sum, p) => sum + p.duration, 0);
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 100;
      const pct = Math.min((elapsed / totalDuration) * 100, 95);
      setProgress(pct);

      let accumulated = 0;
      for (let i = 0; i < PHASES.length; i++) {
        accumulated += PHASES[i].duration;
        if (elapsed < accumulated) {
          setPhaseIdx(i);
          break;
        }
        if (i === PHASES.length - 1) {
          setPhaseIdx(i);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ck-card p-8">
      <div className="flex flex-col items-center text-center">
        {/* Animated spinner */}
        <div className="relative w-20 h-20 mb-6">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-border"
            />
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="text-accent transition-all duration-300"
              strokeDasharray={`${2 * Math.PI * 35}`}
              strokeDashoffset={`${2 * Math.PI * 35 * (1 - progress / 100)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-accent">
            <AnimatePresence mode="wait">
              <motion.div
                key={phaseIdx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <PhaseIcon icon={PHASES[phaseIdx].icon} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Phase label */}
        <AnimatePresence mode="wait">
          <motion.p
            key={phaseIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="text-sm font-medium text-text-secondary mb-2"
          >
            {PHASES[phaseIdx].label}
          </motion.p>
        </AnimatePresence>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mt-3">
          {PHASES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i < phaseIdx
                  ? "w-6 bg-accent"
                  : i === phaseIdx
                    ? "w-8 bg-accent animate-pulse"
                    : "w-4 bg-border"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
