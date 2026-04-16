"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { PillarIcon } from "./pillar-icon";
import type { PillarMeta } from "@/types/brand";

interface PillarCardProps {
  meta: PillarMeta;
  completion: number;
  index: number;
  hrefPrefix?: string;
}

function getCompletionColor(pct: number) {
  if (pct >= 80) return "bg-success";
  if (pct >= 40) return "bg-warning";

  return "bg-border-hover";
}

function getCompletionLabel(pct: number) {
  if (pct >= 80) return "Complete";
  if (pct >= 40) return "Partial";

  return "Not started";
}

function getCompletionBadge(pct: number) {
  if (pct >= 80)
    return "bg-success/15 text-success";
  if (pct >= 40)
    return "bg-warning/15 text-warning";

  return "bg-surface-hover text-text-tertiary";
}

export function PillarCard({ meta, completion, index, hrefPrefix = "/onboarding/deepen" }: PillarCardProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link aria-label={`Edit ${meta.label}`} href={`${hrefPrefix}/${meta.key}`}>
        <div className="ck-card group relative p-6 cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center text-accent">
              <PillarIcon className="w-5 h-5" icon={meta.icon} />
            </div>
            <span
              className={`ck-badge ${getCompletionBadge(completion)}`}
            >
              {getCompletionLabel(completion)}
            </span>
          </div>

          <h3 className="font-semibold text-sm text-text-primary mb-1">{meta.label}</h3>
          <p className="text-xs text-text-tertiary leading-relaxed mb-4">
            {meta.description}
          </p>

          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <motion.div
              animate={{ width: `${completion}%` }}
              className={`h-full rounded-full ${getCompletionColor(completion)}`}
              initial={{ width: 0 }}
              transition={{ delay: index * 0.05 + 0.3, duration: 0.6 }}
            />
          </div>

          <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ring-1 ring-accent/30" />
        </div>
      </Link>
    </motion.div>
  );
}
