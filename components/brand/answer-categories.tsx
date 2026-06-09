"use client";

import type { ReactNode } from "react";
import type { AnswerGroup, FeatureTag } from "@/lib/account/brand-dna-answers";

// Top-level categories the saved answers are grouped under. ICP Map and Offer
// are the two the client actually fills; Brand DNA holds the deeper discovery
// pillars (only shows when populated). Order here = display order.
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
 * Renders saved AnswerGroups split into clear top-level categories (ICP Map /
 * Offer / Brand DNA). The caller supplies how each group card is rendered, so
 * the editable account view and the read-only admin view share one layout.
 */
export function AnswerCategories({
  groups,
  renderGroup,
}: {
  groups: AnswerGroup[];
  renderGroup: (group: AnswerGroup) => ReactNode;
}) {
  return (
    <div className="space-y-10">
      {CATEGORIES.map((cat) => {
        const inCategory = groups.filter((g) => g.feature === cat.feature);
        if (!inCategory.length) return null;

        return (
          <section key={cat.feature}>
            <div className="flex items-center gap-2.5">
              <span className={`h-2.5 w-2.5 rounded-full ${cat.dot}`} />
              <h2 className="text-lg font-bold text-text-primary">
                {cat.title}
              </h2>
              <span className="text-xs text-text-tertiary">
                {inCategory.length} section{inCategory.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-0.5 mb-4 ml-5 text-sm text-text-tertiary">
              {cat.blurb}
            </p>
            <div className="space-y-4">{inCategory.map(renderGroup)}</div>
          </section>
        );
      })}
    </div>
  );
}
