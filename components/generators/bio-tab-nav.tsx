"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";

export type BioTab = "bios" | "seo" | "strategy" | "score";

interface BioTabNavProps {
  activeTab: BioTab;
  onTabChange: (tab: BioTab) => void;
  bioCount?: number;
  scoreValue?: number | null;
}

const TABS: { key: BioTab; label: string; icon: ReactElement }[] = [
  {
    key: "bios",
    label: "Bios",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    key: "seo",
    label: "SEO & Name",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    key: "strategy",
    label: "Strategy",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    key: "score",
    label: "Score",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
];

export function BioTabNav({ activeTab, onTabChange, bioCount, scoreValue }: BioTabNavProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-border overflow-x-auto scrollbar-none">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? "text-text-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="bio-tab-indicator"
                className="absolute inset-0 rounded-lg bg-accent/10 border border-accent/30"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
              {tab.key === "bios" && bioCount !== undefined && bioCount > 0 && (
                <span className="ml-0.5 text-[10px] font-bold bg-accent/15 text-accent px-1.5 py-0.5 rounded-full">
                  {bioCount}
                </span>
              )}
              {tab.key === "score" && scoreValue !== null && scoreValue !== undefined && (
                <span className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  scoreValue >= 8 ? "bg-emerald-500/15 text-emerald-500" :
                  scoreValue >= 6 ? "bg-amber-500/15 text-amber-500" :
                  "bg-red-500/15 text-red-500"
                }`}>
                  {scoreValue}/10
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
