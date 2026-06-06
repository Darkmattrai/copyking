"use client";

interface IcpChipSelectorProps {
  options: readonly { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  max?: number;
}

export function IcpChipSelector({
  options,
  selected,
  onChange,
  max,
}: IcpChipSelectorProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      if (max && selected.length >= max) return;
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              isSelected
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface text-text-secondary hover:border-border-hover hover:text-text-primary"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
