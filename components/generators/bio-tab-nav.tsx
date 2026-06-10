"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";

export type BioTab = "bios" | "highlights" | "pinned";

interface BioTabNavProps {
  activeTab: BioTab;
  onTabChange: (tab: BioTab) => void;
  bioCount?: number;
}

const TABS: { key: BioTab; label: string; icon: ReactElement }[] = [
  {
    key: "bios",
    label: "Bio",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    key: "highlights",
    label: "Highlights",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
  },
  {
    key: "pinned",
    label: "Pinned Posts",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
];

export function BioTabNav({ activeTab, onTabChange, bioCount }: BioTabNavProps) {
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
            </span>
          </button>
        );
      })}
    </div>
  );
}
