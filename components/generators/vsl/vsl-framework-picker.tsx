"use client";

import { motion } from "framer-motion";

export type VSLFramework =
  | "classic"
  | "pas"
  | "aida"
  | "mini-vsl"
  | "sso"
  | "perfect-webinar";

interface FrameworkDef {
  id: VSLFramework;
  name: string;
  tagline: string;
  duration: string;
  bestFor: string;
}

const FRAMEWORKS: FrameworkDef[] = [
  {
    id: "classic",
    name: "Classic 5-Part",
    tagline: "Hook → Problem → Solution → Proof → Close",
    duration: "10-25 min",
    bestFor: "Mid-to-high ticket offers ($97-$2,000+)",
  },
  {
    id: "pas",
    name: "PAS",
    tagline: "Problem → Agitate → Solution",
    duration: "5-15 min",
    bestFor: "Pain-driven offers with urgent problems",
  },
  {
    id: "aida",
    name: "AIDA",
    tagline: "Attention → Interest → Desire → Action",
    duration: "8-20 min",
    bestFor: "Product launches and new audiences",
  },
  {
    id: "mini-vsl",
    name: "Mini VSL",
    tagline: "Curiosity headline + short pitch + CTA",
    duration: "2-5 min",
    bestFor: "Low-ticket offers under $97",
  },
  {
    id: "sso",
    name: "SSO",
    tagline: "Star → Story → Solution → Offer",
    duration: "10-20 min",
    bestFor: "Personal brands and story-driven offers",
  },
  {
    id: "perfect-webinar",
    name: "Perfect Webinar",
    tagline: "3 Secrets + Stack + Close (Russell Brunson)",
    duration: "45-90 min",
    bestFor: "High-ticket offers $997+",
  },
];

interface VSLFrameworkPickerProps {
  value: VSLFramework;
  onChange: (framework: VSLFramework) => void;
}

export function VSLFrameworkPicker({ value, onChange }: VSLFrameworkPickerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {FRAMEWORKS.map((fw) => {
        const selected = value === fw.id;
        return (
          <motion.button
            key={fw.id}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(fw.id)}
            className={`relative text-left p-4 rounded-xl border-2 transition-all ${
              selected
                ? "border-accent bg-accent/[0.06] shadow-[0_0_0_1px_var(--color-accent)]"
                : "border-border bg-surface hover:border-border-hover hover:bg-surface-hover"
            }`}
          >
            {selected && (
              <motion.div
                layoutId="fw-check"
                className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </motion.div>
            )}
            <div className="pr-7">
              <h4 className={`text-sm font-semibold mb-0.5 ${selected ? "text-accent" : "text-text-primary"}`}>
                {fw.name}
              </h4>
              <p className="text-xs text-text-secondary leading-snug mb-2">
                {fw.tagline}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-text-tertiary">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {fw.duration}
                </span>
                <span className="truncate">{fw.bestFor}</span>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

export { FRAMEWORKS };
