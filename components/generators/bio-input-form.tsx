"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PillarIcon } from "@/components/brand/pillar-icon";
import type { ParamDef } from "@/lib/generators/types";

interface BioInputFormProps {
  params: ParamDef[];
  onSubmit: (values: Record<string, string>) => void;
  isLoading?: boolean;
}

export function BioInputForm({ params, onSubmit, isLoading }: BioInputFormProps) {
  const [open, setOpen] = useState(false);
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

  const selectParams = params.filter((p) => p.type === "select");
  const textParams = params.filter((p) => p.type === "text");

  return (
    <div className="ck-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-muted flex items-center justify-center text-accent">
            <PillarIcon className="w-4 h-4" icon="target" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              Customize (optional)
            </p>
            <p className="text-[11px] text-text-tertiary">
              Account type, goal, aesthetic, location, keyword, username audit
            </p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectParams.map((param) => (
                  <div key={param.key} className="space-y-1.5">
                    <label
                      htmlFor={param.key}
                      className="block text-xs font-medium text-text-secondary"
                    >
                      {param.label}
                    </label>
                    <select
                      id={param.key}
                      value={values[param.key] ?? ""}
                      onChange={(e) => handleChange(param.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
                    >
                      {param.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {textParams.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border">
                  {textParams.map((param) => (
                    <div key={param.key} className="space-y-1.5">
                      <label
                        htmlFor={param.key}
                        className="block text-xs font-medium text-text-secondary"
                      >
                        {param.label}
                      </label>
                      <input
                        id={param.key}
                        type="text"
                        value={values[param.key] ?? ""}
                        onChange={(e) => handleChange(param.key, e.target.value)}
                        placeholder={param.placeholder}
                        className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="ck-btn-primary px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all inline-flex items-center gap-2"
                >
                  <PillarIcon className="w-4 h-4" icon="sparkles" />
                  Generate with these settings
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
