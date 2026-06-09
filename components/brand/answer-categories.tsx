"use client";

import { useState, type ReactNode } from "react";
import type { AnswerGroup, FeatureTag } from "@/lib/account/brand-dna-answers";

// Top-level categories the saved answers are grouped under. ICP Map and Offer
// are the two the client actually fills; Brand DNA holds the deeper discovery
// pillars (only shows when populated). Order here = tab order.
interface CategoryMeta {
  feature: FeatureTag;
  title: string;
  blurb: string;
  dot: string;
}

const CATEGORIES: CategoryMeta[] = [
  {
    feature: "ICP",
    title: "ICP Map",
    blurb:
      "Your ideal customer — their pains, goals, mindset, and what makes them buy.",
    dot: "bg-indigo-400",
  },
  {
    feature: "Offer",
    title: "Offer",
    blurb:
      "What you sell — the promise, the value stack, the proof, and the pricing.",
    dot: "bg-amber-400",
  },
  {
    feature: "Brand DNA",
    title: "Brand DNA",
    blurb:
      "Deeper brand discovery — niche, positioning, voice, story, and messaging.",
    dot: "bg-emerald-400",
  },
];

/**
 * Renders saved AnswerGroups as switchable tabs (ICP Map / Offer / Brand DNA).
 * The caller supplies how each group card is rendered, so the editable account
 * view and the read-only admin view share one tabbed layout.
 */
export function AnswerCategories({
  groups,
  renderGroup,
  extras,
}: {
  groups: AnswerGroup[];
  renderGroup: (group: AnswerGroup) => ReactNode;
  // Optional visual block rendered at the top of a category's panel (e.g. the
  // value-ladder + result-map drawings under the Offer tab).
  extras?: Partial<Record<FeatureTag, ReactNode>>;
}) {
  // Only categories that actually have answers become tabs.
  const available = CATEGORIES.map((cat) => ({
    ...cat,
    groups: groups.filter((g) => g.feature === cat.feature),
  })).filter((cat) => cat.groups.length > 0);

  const [active, setActive] = useState<FeatureTag>(
    available[0]?.feature ?? "ICP",
  );

  if (!available.length) return null;

  // Guard against the active tab emptying out (e.g. after an inline edit).
  const current =
    available.find((cat) => cat.feature === active) ?? available[0];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {available.map((cat) => {
          const isActive = cat.feature === current.feature;
          return (
            <button
              key={cat.feature}
              type="button"
              onClick={() => setActive(cat.feature)}
              className={
                "flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors " +
                (isActive
                  ? "border-accent bg-accent/10 text-text-primary"
                  : "border-border text-text-tertiary hover:text-text-secondary hover:border-border-hover")
              }
            >
              <span className={`h-2 w-2 rounded-full ${cat.dot}`} />
              {cat.title}
              <span
                className={
                  "rounded-full px-1.5 text-[11px] " +
                  (isActive
                    ? "bg-accent/20 text-text-secondary"
                    : "bg-surface-hover text-text-tertiary")
                }
              >
                {cat.groups.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active category */}
      <p className="mt-4 mb-4 text-sm text-text-tertiary">{current.blurb}</p>
      {extras?.[current.feature]}
      <div className="space-y-4">{current.groups.map(renderGroup)}</div>
    </div>
  );
}
