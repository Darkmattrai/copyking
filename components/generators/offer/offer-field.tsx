"use client";

import { useState } from "react";
import type { EnhanceContext } from "@/lib/offer/enhance-prompt";

export function useEnhance() {
  const [enhancingKey, setEnhancingKey] = useState<string | null>(null);

  const enhance = async (
    key: string,
    label: string,
    value: string,
    context: EnhanceContext,
  ): Promise<string | null> => {
    if (!value.trim()) return null;
    setEnhancingKey(key);
    try {
      const res = await fetch("/api/offer/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: label, value, context }),
      });
      if (!res.ok) return null;
      const { text } = await res.json();
      return typeof text === "string" && text.trim() ? text.trim() : null;
    } catch {
      return null;
    } finally {
      setEnhancingKey(null);
    }
  };

  return { enhance, enhancingKey };
}

interface OfferFieldProps {
  fieldKey: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "textarea" | "number" | "select";
  hint?: string;
  eg?: string;
  required?: boolean;
  options?: string[];
  // enhance
  onEnhance?: (key: string, label: string, value: string) => Promise<string | null>;
  onEnhanced?: (key: string, original: string, enhanced: string) => void;
  enhancing?: boolean;
}

export function OfferField({
  fieldKey,
  label,
  value,
  onChange,
  type = "text",
  hint,
  eg,
  required,
  options,
  onEnhance,
  onEnhanced,
  enhancing,
}: OfferFieldProps) {
  const [showHint, setShowHint] = useState(false);
  const canEnhance =
    onEnhance && (type === "text" || type === "textarea");
  // The example becomes the placeholder so it disappears once the user types.
  const placeholder = eg ? `e.g. ${eg}` : undefined;

  return (
    <div className="flex flex-col gap-2">
      {/* label row: title · key dot · circled ? · revealed hint */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-text-primary">{label}</span>
        {required && (
          <span
            className="h-1.5 w-1.5 rounded-full bg-accent"
            title="Key field"
            aria-label="Key field"
          />
        )}
        {hint && (
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            aria-expanded={showHint}
            aria-label="More info"
            className="ml-1 flex h-5 w-5 items-center justify-center rounded-full border border-border-hover text-[11px] font-semibold leading-none text-text-tertiary transition-colors hover:border-accent hover:text-accent"
          >
            ?
          </button>
        )}
        {hint && showHint && (
          <span className="rounded-md bg-surface-hover px-2.5 py-1 text-xs text-text-secondary">
            {hint}
          </span>
        )}
      </div>

      {/* control */}
      {type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ck-input"
        >
          {(options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <div className="relative">
          {type === "textarea" ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
              placeholder={placeholder}
              className={`ck-input resize-none ${canEnhance ? "!pr-28" : ""}`}
            />
          ) : (
            <input
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={`ck-input ${canEnhance ? "!pr-28" : ""}`}
            />
          )}
          {canEnhance && (
            <button
              type="button"
              disabled={enhancing || !value.trim()}
              title={enhancing ? "Enhancing…" : "Enhance with AI"}
              onClick={async () => {
                const original = value;
                const out = await onEnhance!(fieldKey, label, value);
                if (out) {
                  onEnhanced?.(fieldKey, original, out);
                  onChange(out);
                }
              }}
              className="absolute right-2 top-2 flex h-7 items-center gap-1 rounded-md bg-accent px-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {enhancing ? (
                <>⏳ <span>Enhancing</span></>
              ) : (
                <>✨ <span>Enhance</span></>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
