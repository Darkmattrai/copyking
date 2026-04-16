"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

import { useBrandStore } from "@/lib/brand/store";

function RevealCard({
  children,
  onNext,
  reducedMotion,
}: {
  children: React.ReactNode;
  onNext: () => void;
  reducedMotion: boolean;
}) {
  useEffect(() => {
    const timer = setTimeout(onNext, 5000);

    return () => clearTimeout(timer);
  }, [onNext]);

  const animProps = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.9, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.9, y: -20 } };

  return (
    <motion.div
      {...animProps}
      className="w-full max-w-lg mx-auto cursor-pointer"
      transition={{ duration: reducedMotion ? 0.1 : 0.5, ease: "easeOut" }}
      onClick={onNext}
    >
      <div className="rounded-2xl border border-border bg-surface-raised p-8 backdrop-blur-xl shadow-2xl">
        {children}
      </div>
    </motion.div>
  );
}

function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="ck-chip">
      {children}
    </span>
  );
}

export default function RevealPage() {
  const router = useRouter();
  const { brandDNA, setRevealSeen } = useBrandStore();
  const [step, setStep] = useState(0);
  const prefersReducedMotion = useReducedMotion() ?? false;

  const totalSteps = 9;

  const next = useCallback(() => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      setRevealSeen(true);
      router.push("/brand");
    }
  }, [step, router, setRevealSeen]);

  const springTransition = prefersReducedMotion
    ? { duration: 0.1 }
    : { type: "spring" as const, bounce: 0.4 };

  const cards = [
    <RevealCard key="intro" reducedMotion={prefersReducedMotion} onNext={next}>
      <div className="text-center">
        <motion.div
          animate={{ rotate: 0, scale: 1 }}
          className="text-5xl mb-4"
          initial={{ rotate: prefersReducedMotion ? 0 : -10, scale: prefersReducedMotion ? 1 : 0.8 }}
          transition={{ delay: 0.2, ...springTransition }}
        >
          <svg className="w-12 h-12 mx-auto text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Your Brand DNA</h2>
        <p className="text-text-secondary text-sm">Let&apos;s see what we discovered</p>
      </div>
    </RevealCard>,

    <RevealCard key="niche" reducedMotion={prefersReducedMotion} onNext={next}>
      <div className="text-center">
        <div className="text-xs text-accent uppercase tracking-wider mb-3 font-medium">Your Market</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">{brandDNA.niche.marketCategory || "Your Niche"}</h2>
        {brandDNA.niche.subNiche && (
          <p className="text-text-secondary text-sm mb-4">{brandDNA.niche.subNiche}</p>
        )}
        <div className="flex justify-center gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">{brandDNA.niche.painLevel}/10</div>
            <div className="text-xs text-text-tertiary">Pain Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{brandDNA.niche.purchasingPower}</div>
            <div className="text-xs text-text-tertiary">Buying Power</div>
          </div>
        </div>
      </div>
    </RevealCard>,

    <RevealCard key="icp" reducedMotion={prefersReducedMotion} onNext={next}>
      <div className="text-center">
        <div className="text-xs text-accent-hover uppercase tracking-wider mb-3 font-medium">Your Dream Customer</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">{brandDNA.icp.name || "Your Avatar"}</h2>
        {brandDNA.icp.dreamOutcome && (
          <p className="text-text-secondary text-sm mb-4">Their dream: {brandDNA.icp.dreamOutcome}</p>
        )}
        {brandDNA.icp.painPoints.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {brandDNA.icp.painPoints.slice(0, 4).map((p) => (
              <TagChip key={p}>{p}</TagChip>
            ))}
          </div>
        )}
      </div>
    </RevealCard>,

    <RevealCard key="offer" reducedMotion={prefersReducedMotion} onNext={next}>
      <div className="text-center">
        <div className="text-xs text-success uppercase tracking-wider mb-3 font-medium">Your Offer</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">{brandDNA.offer.dreamOutcome || "Your Transformation"}</h2>
        {brandDNA.offer.valueScore > 0 && (
          <div className="mt-4">
            <div className="text-4xl font-black text-accent">
              {brandDNA.offer.valueScore}
            </div>
            <div className="text-xs text-text-tertiary">Value Score</div>
          </div>
        )}
      </div>
    </RevealCard>,

    <RevealCard key="positioning" reducedMotion={prefersReducedMotion} onNext={next}>
      <div className="text-center">
        <div className="text-xs text-warning uppercase tracking-wider mb-3 font-medium">Your Position</div>
        <p className="text-lg font-medium leading-relaxed italic text-text-secondary">
          &ldquo;{brandDNA.positioning.positioningStatement || "Your positioning statement will appear here"}&rdquo;
        </p>
        {brandDNA.positioning.uniqueMechanism && (
          <div className="mt-4">
            <TagChip>{brandDNA.positioning.uniqueMechanism}</TagChip>
          </div>
        )}
      </div>
    </RevealCard>,

    <RevealCard key="voice" reducedMotion={prefersReducedMotion} onNext={next}>
      <div className="text-center">
        <div className="text-xs text-accent uppercase tracking-wider mb-3 font-medium">Your Voice</div>
        <motion.div
          animate={{ scale: 1 }}
          className="text-2xl font-black text-accent mb-1"
          initial={{ scale: prefersReducedMotion ? 1 : 0.5 }}
          transition={springTransition}
        >
          {brandDNA.voice.primaryArchetype || "Your Archetype"}
        </motion.div>
        {brandDNA.voice.secondaryArchetype && (
          <p className="text-text-secondary text-sm mb-4">with a hint of {brandDNA.voice.secondaryArchetype}</p>
        )}
        {brandDNA.voice.toneAttributes.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {brandDNA.voice.toneAttributes.map((t) => (
              <TagChip key={t}>{t}</TagChip>
            ))}
          </div>
        )}
      </div>
    </RevealCard>,

    <RevealCard key="story" reducedMotion={prefersReducedMotion} onNext={next}>
      <div className="text-center">
        <div className="text-xs text-warning uppercase tracking-wider mb-3 font-medium">Your Story</div>
        {brandDNA.story.mission && (
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            {brandDNA.story.mission}
          </p>
        )}
        {brandDNA.story.villain && (
          <p className="text-sm text-text-tertiary italic">
            Fighting against: {brandDNA.story.villain}
          </p>
        )}
        {brandDNA.story.coreValues.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-4">
            {brandDNA.story.coreValues.map((v) => (
              <TagChip key={v}>{v}</TagChip>
            ))}
          </div>
        )}
      </div>
    </RevealCard>,

    <RevealCard key="messaging" reducedMotion={prefersReducedMotion} onNext={next}>
      <div className="text-center">
        <div className="text-xs text-accent uppercase tracking-wider mb-3 font-medium">Your Messages</div>
        {brandDNA.messaging.tagline && (
          <h2 className="text-xl font-bold text-text-primary mb-3">{brandDNA.messaging.tagline}</h2>
        )}
        {brandDNA.messaging.oneLiner && (
          <p className="text-sm text-text-secondary leading-relaxed">
            {brandDNA.messaging.oneLiner}
          </p>
        )}
      </div>
    </RevealCard>,

    <RevealCard key="final" reducedMotion={prefersReducedMotion} onNext={next}>
      <div className="text-center">
        <div className="text-4xl font-black text-accent mb-2">
          {brandDNA.completionScore}%
        </div>
        <div className="text-xs text-text-tertiary mb-4">Brand DNA Complete</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Your brand is ready</h2>
        <p className="text-sm text-text-secondary mb-6">
          Time to create content that sounds like you.
        </p>
        <button
          className="ck-btn-primary !px-8 !py-3 !rounded-xl shadow-lg shadow-accent/25"
          onClick={(e) => {
            e.stopPropagation();
            setRevealSeen(true);
            router.push("/brand");
          }}
        >
          Go to Brand Dashboard
        </button>
      </div>
    </RevealCard>,
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 rounded-full bg-accent-hover/10 blur-3xl" />
      </div>

      <AnimatePresence mode="wait">{cards[step]}</AnimatePresence>

      <div className="flex gap-1.5 mt-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <button
            key={i}
            aria-label={`Go to card ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === step ? "bg-accent w-6" : i < step ? "bg-text-tertiary w-2" : "bg-border w-2"
            }`}
            onClick={() => setStep(i)}
          />
        ))}
      </div>

      <p className="text-xs text-text-tertiary mt-4">Tap to continue</p>
    </div>
  );
}
