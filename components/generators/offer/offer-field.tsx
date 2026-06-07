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
  const canEnhance =
    onEnhance && (type === "text" || type === "textarea");

  return (
    <label className="flex flex-col gap-1.5">
      <span className="ck-label !mb-0">
        {label}{" "}
        {required && (
          <span className="ck-badge bg-accent/15 text-accent !text-[10px] ml-1">
            key
          </span>
        )}
      </span>
      {hint && <span className="ck-sublabel !mb-0">{hint}</span>}
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="ck-input resize-none"
        />
      ) : type === "select" ? (
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
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ck-input"
        />
      )}
      {eg && (
        <span className="text-xs text-text-tertiary">💡 e.g. {eg}</span>
      )}
      {canEnhance && (
        <button
          type="button"
          disabled={enhancing || !value.trim()}
          onClick={async () => {
            const original = value;
            const out = await onEnhance!(fieldKey, label, value);
            if (out) {
              onEnhanced?.(fieldKey, original, out);
              onChange(out);
            }
          }}
          className="self-start text-xs font-medium text-accent hover:text-accent-hover disabled:opacity-40 transition-colors mt-0.5"
        >
          {enhancing ? "✨ Enhancing…" : "✨ Enhance with AI"}
        </button>
      )}
    </label>
  );
}
