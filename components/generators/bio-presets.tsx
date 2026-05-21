"use client";

import { motion } from "framer-motion";

interface PresetConfig {
  key: string;
  label: string;
  emoji: string;
  description: string;
  params: Record<string, string>;
}

const PRESETS: PresetConfig[] = [
  {
    key: "coach",
    label: "Coach",
    emoji: "\u{1F3AF}",
    description: "Authority + transformation focus",
    params: {
      accountType: "coach",
      primaryGoal: "calls",
      aestheticStyle: "clean-minimal",
      emojiDensity: "strategic",
    },
  },
  {
    key: "ecommerce",
    label: "E-commerce",
    emoji: "\u{1F6D2}",
    description: "Product-led + shop CTA",
    params: {
      accountType: "ecommerce",
      primaryGoal: "sales",
      aestheticStyle: "bold-punchy",
      emojiDensity: "strategic",
    },
  },
  {
    key: "local",
    label: "Local Biz",
    emoji: "\u{1F4CD}",
    description: "Location + visit-driving",
    params: {
      accountType: "local",
      primaryGoal: "local-visits",
      aestheticStyle: "professional",
      emojiDensity: "minimal",
    },
  },
  {
    key: "saas",
    label: "SaaS",
    emoji: "\u{1F4BB}",
    description: "Feature-benefit + free trial CTA",
    params: {
      accountType: "business",
      primaryGoal: "clicks",
      aestheticStyle: "clean-minimal",
      emojiDensity: "minimal",
    },
  },
  {
    key: "creator",
    label: "Creator",
    emoji: "\u{1F3A8}",
    description: "Personality-led + follow CTA",
    params: {
      accountType: "creator",
      primaryGoal: "follows",
      aestheticStyle: "lowercase",
      emojiDensity: "expressive",
    },
  },
  {
    key: "agency",
    label: "Agency",
    emoji: "\u{1F680}",
    description: "Results + book call CTA",
    params: {
      accountType: "agency",
      primaryGoal: "calls",
      aestheticStyle: "professional",
      emojiDensity: "none",
    },
  },
];

interface BioPresetsProps {
  onSelect: (params: Record<string, string>) => void;
  disabled?: boolean;
}

export function BioPresets({ onSelect, disabled }: BioPresetsProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2.5">
        Quick presets
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PRESETS.map((preset, i) => (
          <motion.button
            key={preset.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(preset.params)}
            disabled={disabled}
            className="group text-left px-3.5 py-3 rounded-xl border border-border bg-surface hover:border-accent/40 hover:bg-accent/[0.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{preset.emoji}</span>
              <span className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                {preset.label}
              </span>
            </div>
            <p className="text-[11px] text-text-tertiary leading-snug">
              {preset.description}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
