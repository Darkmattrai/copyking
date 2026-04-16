"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { DeepenerShell } from "../deepener-shell";
import { useBrandStore } from "@/lib/brand/store";
import { PILLAR_META } from "@/types/brand";

const HOOK_STYLES = [
  { id: "question", label: "Question Hook", example: "What if everything you knew about [topic] was wrong?" },
  { id: "bold-claim", label: "Bold Claim", example: "I made $100K in 30 days using a method nobody talks about." },
  { id: "story", label: "Story Opener", example: "3 years ago, I was broke, sleeping on my friend's couch..." },
  { id: "statistic", label: "Statistic", example: "97% of people who try [thing] fail. Here's why the 3% don't." },
  { id: "contrarian", label: "Contrarian Take", example: "Stop posting daily content. It's actually killing your growth." },
];

const STORYTELLING = [
  { id: "before-after", label: "Before / After", desc: "Show the transformation from struggle to success" },
  { id: "myth-busting", label: "Myth Busting", desc: "Destroy a common belief and replace it with truth" },
  { id: "framework", label: "Framework Teaching", desc: "Teach a step-by-step system or mental model" },
  { id: "case-study", label: "Case Study", desc: "Walk through a real client result or personal win" },
];

const PLATFORMS = [
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "twitter", label: "X / Twitter" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "newsletter", label: "Newsletter" },
  { id: "podcast", label: "Podcast" },
];

function SelectableCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`text-left p-4 rounded-lg border transition-all ${
        selected
          ? "border-accent/50 bg-accent-muted"
          : "border-border bg-surface hover:bg-surface-hover"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ContentDNAPicker() {
  const meta = PILLAR_META[7];
  const { brandDNA, updatePillar } = useBrandStore();
  const dna = brandDNA.contentDNA;

  const [hooks, setHooks] = useState<string[]>(dna.hookStyles);
  const [patterns, setPatterns] = useState<string[]>(dna.storytellingPatterns);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(dna.platforms);
  const [themes, setThemes] = useState(dna.themes.join(", "));
  const [cadence, setCadence] = useState(dna.cadence);

  const toggle = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSave = () => {
    updatePillar("contentDNA", {
      hookStyles: hooks,
      storytellingPatterns: patterns,
      platforms: selectedPlatforms,
      themes: themes.split(",").map((s) => s.trim()).filter(Boolean),
      cadence,
    });
    toast.success("Content DNA saved");
  };

  return (
    <DeepenerShell meta={meta}>
      <div className="space-y-6">
        <div className="ck-section space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Hook Styles <span className="text-text-tertiary font-normal">(pick 2-3)</span>
          </h3>
          <div className="space-y-2">
            {HOOK_STYLES.map((h) => (
              <SelectableCard
                key={h.id}
                selected={hooks.includes(h.id)}
                onClick={() => toggle(hooks, h.id, setHooks)}
              >
                <div className="text-sm font-medium text-text-primary">{h.label}</div>
                <div className="text-xs text-text-tertiary mt-1 italic">&quot;{h.example}&quot;</div>
              </SelectableCard>
            ))}
          </div>
        </div>

        <div className="ck-section space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Storytelling Patterns <span className="text-text-tertiary font-normal">(pick your favorites)</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {STORYTELLING.map((s) => (
              <SelectableCard
                key={s.id}
                selected={patterns.includes(s.id)}
                onClick={() => toggle(patterns, s.id, setPatterns)}
              >
                <div className="text-sm font-medium text-text-primary">{s.label}</div>
                <div className="text-xs text-text-tertiary mt-1">{s.desc}</div>
              </SelectableCard>
            ))}
          </div>
        </div>

        <div className="ck-section space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Platforms</h3>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <motion.button
                key={p.id}
                className={`px-4 py-2 rounded-full text-sm border transition-all ${
                  selectedPlatforms.includes(p.id)
                    ? "border-accent/50 bg-accent-muted text-accent"
                    : "border-border bg-surface hover:bg-surface-hover text-text-secondary"
                }`}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggle(selectedPlatforms, p.id, setSelectedPlatforms)}
              >
                {p.label}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="ck-label">
              Content Themes (comma-separated)
            </label>
            <input
              className="ck-input"
              placeholder="e.g. mindset, lead generation, case studies, productivity hacks"
              value={themes}
              onChange={(e) => setThemes(e.target.value)}
            />
          </div>
          <div>
            <label className="ck-label">Cadence Goal</label>
            <input
              className="ck-input"
              placeholder="e.g. 3x/week on YouTube, daily on Twitter"
              value={cadence}
              onChange={(e) => setCadence(e.target.value)}
            />
          </div>
        </div>

        <button
          className="ck-btn-primary w-full"
          onClick={handleSave}
        >
          Save Content DNA
        </button>
      </div>
    </DeepenerShell>
  );
}
