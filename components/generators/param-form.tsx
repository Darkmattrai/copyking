"use client";

import { useState } from "react";
import type { ParamDef } from "@/lib/generators/types";
import { PillarIcon } from "@/components/brand/pillar-icon";

interface ParamFormProps {
  params: ParamDef[];
  onSubmit: (values: Record<string, string>) => void;
  isLoading?: boolean;
}

export function ParamForm({ params, onSubmit, isLoading }: ParamFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const p of params) {
      init[p.key] = p.options?.[0]?.value ?? "";
    }
    return init;
  });

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  const allFilled = params
    .filter((p) => p.required)
    .every((p) => values[p.key]?.trim());

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {params.map((param) => (
        <div key={param.key} className="space-y-1.5">
          <label
            htmlFor={param.key}
            className="block text-sm font-medium text-text-primary"
          >
            <span className="inline-flex items-center gap-1.5">
              <PillarIcon
                className="w-3.5 h-3.5 text-accent"
                icon={param.type === "select" ? "target" : param.type === "textarea" ? "book" : "pen"}
              />
              {param.label}
            </span>
            {param.required && (
              <span className="text-accent ml-0.5">*</span>
            )}
          </label>

          {param.type === "select" && param.options && (
            <select
              id={param.key}
              value={values[param.key] ?? ""}
              onChange={(e) => handleChange(param.key, e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
            >
              {param.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {param.type === "text" && (
            <input
              id={param.key}
              type="text"
              value={values[param.key] ?? ""}
              onChange={(e) => handleChange(param.key, e.target.value)}
              placeholder={param.placeholder}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
            />
          )}

          {param.type === "textarea" && (
            <textarea
              id={param.key}
              value={values[param.key] ?? ""}
              onChange={(e) => handleChange(param.key, e.target.value)}
              placeholder={param.placeholder}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors resize-y"
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={!allFilled || isLoading}
        className="w-full ck-btn-primary py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                fill="currentColor"
              />
            </svg>
            Generating...
          </span>
        ) : (
          "Generate"
        )}
      </button>
    </form>
  );
}
