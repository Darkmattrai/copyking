"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ProofElement {
  id: string;
  type: "testimonial" | "stat" | "case-study" | "credential";
  content: string;
}

const TYPE_LABELS: Record<ProofElement["type"], { label: string; placeholder: string; icon: string }> = {
  testimonial: {
    label: "Testimonial",
    placeholder: "e.g. Sarah went from $3K to $47K/month in 90 days — Sarah M., Austin TX",
    icon: "💬",
  },
  stat: {
    label: "Statistic",
    placeholder: "e.g. 2,300+ clients served with a 94% success rate",
    icon: "📊",
  },
  "case-study": {
    label: "Case Study",
    placeholder: "e.g. Client A went from 0 to $100K revenue in 6 months using our system",
    icon: "📋",
  },
  credential: {
    label: "Credential",
    placeholder: "e.g. Featured in Forbes, 10+ years experience, PhD in Psychology",
    icon: "🏆",
  },
};

interface VSLProofInputsProps {
  proofs: ProofElement[];
  onChange: (proofs: ProofElement[]) => void;
}

export function VSLProofInputs({ proofs, onChange }: VSLProofInputsProps) {
  const [addingType, setAddingType] = useState<ProofElement["type"] | null>(null);

  function addProof(type: ProofElement["type"]) {
    const newProof: ProofElement = {
      id: crypto.randomUUID(),
      type,
      content: "",
    };
    onChange([...proofs, newProof]);
    setAddingType(null);
  }

  function updateProof(id: string, content: string) {
    onChange(proofs.map((p) => (p.id === id ? { ...p, content } : p)));
  }

  function removeProof(id: string) {
    onChange(proofs.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {proofs.map((proof) => {
          const meta = TYPE_LABELS[proof.type];
          return (
            <motion.div
              key={proof.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="relative group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs">{meta.icon}</span>
                <span className="text-xs font-medium text-text-secondary">{meta.label}</span>
                <button
                  type="button"
                  onClick={() => removeProof(proof.id)}
                  className="ml-auto opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-danger transition-all text-xs"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={proof.content}
                onChange={(e) => updateProof(proof.id, e.target.value)}
                placeholder={meta.placeholder}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors resize-y"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {addingType === null ? (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABELS) as ProofElement["type"][]).map((type) => {
            const meta = TYPE_LABELS[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => addProof(type)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border hover:border-accent/40 text-xs text-text-secondary hover:text-accent transition-colors"
              >
                <span>{meta.icon}</span>
                <span>Add {meta.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {proofs.length === 0 && (
        <p className="text-xs text-text-tertiary italic">
          No proof elements added yet. The AI will generate placeholder proof — adding real data produces much better results.
        </p>
      )}
    </div>
  );
}
