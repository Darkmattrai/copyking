"use client";

const TONE_LABELS = [
  { value: 1, label: "Soft Sell", desc: "Educational, empathy-forward" },
  { value: 2, label: "Gentle", desc: "Nurturing with subtle persuasion" },
  { value: 3, label: "Balanced", desc: "Professional with clear CTAs" },
  { value: 4, label: "Direct", desc: "Confident, urgency-driven" },
  { value: 5, label: "Hard Sell", desc: "Aggressive, scarcity-heavy close" },
];

interface VSLToneSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function VSLToneSlider({ value, onChange }: VSLToneSliderProps) {
  const current = TONE_LABELS.find((t) => t.value === value) ?? TONE_LABELS[2];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-accent">{current.label}</span>
        <span className="text-xs text-text-tertiary">{current.desc}</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ck-range"
        aria-label="Selling intensity"
      />
      <div className="flex justify-between text-[10px] text-text-tertiary px-0.5">
        <span>Soft Sell</span>
        <span>Hard Sell</span>
      </div>
    </div>
  );
}
