"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface BioApplyChecklistProps {
  hasName: boolean;
  hasBio: boolean;
  hasLinks: boolean;
  hasHighlights: boolean;
  hasPinnedPosts: boolean;
  hasProfilePhoto: boolean;
}

interface CheckItem {
  key: string;
  label: string;
  description: string;
  available: boolean;
}

export function BioApplyChecklist({
  hasName,
  hasBio,
  hasLinks,
  hasHighlights,
  hasPinnedPosts,
  hasProfilePhoto,
}: BioApplyChecklistProps) {
  const router = useRouter();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const items: CheckItem[] = [
    { key: "name", label: "Update Name Field", description: "Copy the name field to your Instagram profile", available: hasName },
    { key: "bio", label: "Update Bio Text", description: "Paste the selected bio into your Instagram bio", available: hasBio },
    { key: "links", label: "Set Up Native Links", description: "Add up to 5 links in Instagram's native link feature", available: hasLinks },
    { key: "category", label: "Set Category", description: "Switch to Professional Account and set your category", available: true },
    { key: "highlights", label: "Create Highlights", description: "Set up story highlights in the recommended order", available: hasHighlights },
    { key: "pinned", label: "Pin Top Posts", description: "Pin your 3 strategic posts to the top of your grid", available: hasPinnedPosts },
    { key: "photo", label: "Update Profile Photo", description: "Follow the photo direction for maximum trust", available: hasProfilePhoto },
    { key: "action", label: "Enable Action Buttons", description: "Set up Book Now, Email, or other action buttons", available: true },
  ];

  function toggleItem(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const completedCount = checked.size;
  const totalCount = items.filter((i) => i.available).length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="ck-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Apply to Instagram
        </h3>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-surface-hover overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-[10px] font-mono text-text-tertiary">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {items.map((item) => {
          if (!item.available) return null;
          const isDone = checked.has(item.key);
          return (
            <button
              key={item.key}
              onClick={() => toggleItem(item.key)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                isDone
                  ? "bg-emerald-500/5"
                  : "hover:bg-surface-hover"
              }`}
            >
              <div className={`mt-0.5 w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                isDone
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-border"
              }`}>
                {isDone && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium transition-all ${
                  isDone ? "text-text-tertiary line-through" : "text-text-primary"
                }`}>
                  {item.label}
                </p>
                <p className="text-[11px] text-text-tertiary leading-snug">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bridge buttons to other generators */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-2.5">
          Next steps
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push("/generate/organic-content-ideas")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface hover:border-accent/40 hover:bg-accent/[0.03] transition-all text-xs font-medium text-text-secondary hover:text-accent"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Generate Content Calendar
          </button>
          <button
            onClick={() => router.push("/generate/instagram-stories")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface hover:border-accent/40 hover:bg-accent/[0.03] transition-all text-xs font-medium text-text-secondary hover:text-accent"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
            Generate Stories Series
          </button>
        </div>
      </div>
    </div>
  );
}
