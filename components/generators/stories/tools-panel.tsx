"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ParsedStorySlide } from "@/components/generators/story-slide-card";
import type { BrandDNA } from "@/types/brand";

import { EngagementScore } from "./engagement-score";
import { VariantGenerator } from "./variant-generator";
import { DesignBriefExport } from "./design-brief-export";
import { ReelConverter } from "./reel-converter";
import { DmFlowBuilder } from "./dm-flow-builder";
import { PerformanceTracker } from "./performance-tracker";
import { SeriesCalendar } from "./series-calendar";
import { AudienceToneShift } from "./audience-tone-shift";
import { AiImagePrompts } from "./ai-image-prompts";
import { CrossPlatformAdapter } from "./cross-platform-adapter";

interface ParsedOverview {
  objective: string;
  hookAngle: string;
  primaryCta: string;
  postingTime: string;
}

interface ToolsPanelProps {
  slides: ParsedStorySlide[];
  overview: ParsedOverview;
  stickerStack: string;
  postingSchedule: string;
  nurtureLadder: string;
  metrics: string;
  themes: string;
  brandDNA: BrandDNA;
  objective?: string;
  seriesId: string;
}

interface ToolTab {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  category: "analyze" | "create" | "adapt";
  requiresSlides: boolean;
}

const TOOLS: ToolTab[] = [
  {
    id: "engagement",
    label: "Engagement Score",
    shortLabel: "Score",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    category: "analyze",
    requiresSlides: true,
  },
  {
    id: "variants",
    label: "A/B Variants",
    shortLabel: "Variants",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    category: "create",
    requiresSlides: true,
  },
  {
    id: "design-brief",
    label: "Design Brief",
    shortLabel: "Brief",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    category: "analyze",
    requiresSlides: true,
  },
  {
    id: "reel",
    label: "Reel Script",
    shortLabel: "Reel",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
    category: "create",
    requiresSlides: true,
  },
  {
    id: "dm-flow",
    label: "DM Automation",
    shortLabel: "DMs",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    category: "create",
    requiresSlides: false,
  },
  {
    id: "performance",
    label: "Performance Tracker",
    shortLabel: "Track",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    category: "analyze",
    requiresSlides: false,
  },
  {
    id: "calendar",
    label: "Content Calendar",
    shortLabel: "Calendar",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    category: "create",
    requiresSlides: false,
  },
  {
    id: "audience",
    label: "Audience Tone Shift",
    shortLabel: "Audience",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    category: "adapt",
    requiresSlides: true,
  },
  {
    id: "image-prompts",
    label: "AI Image Prompts",
    shortLabel: "Images",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    ),
    category: "create",
    requiresSlides: true,
  },
  {
    id: "cross-platform",
    label: "Cross-Platform",
    shortLabel: "Platforms",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    category: "adapt",
    requiresSlides: true,
  },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  analyze: { label: "Analyze", color: "text-emerald-500" },
  create: { label: "Create", color: "text-accent" },
  adapt: { label: "Adapt", color: "text-purple-500" },
};

export function ToolsPanel({
  slides,
  overview,
  stickerStack,
  postingSchedule,
  nurtureLadder,
  metrics,
  themes,
  brandDNA,
  objective,
  seriesId,
}: ToolsPanelProps) {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  const hasSlides = slides.length > 0;

  const renderToolContent = (toolId: string) => {
    switch (toolId) {
      case "engagement":
        return (
          <EngagementScore
            slides={slides}
            overview={overview}
            objective={objective}
          />
        );
      case "variants":
        return (
          <VariantGenerator
            slides={slides}
            overview={overview}
            brandDNA={brandDNA}
          />
        );
      case "design-brief":
        return (
          <DesignBriefExport
            slides={slides}
            overview={overview}
            stickerStack={stickerStack}
            postingSchedule={postingSchedule}
          />
        );
      case "reel":
        return (
          <ReelConverter
            slides={slides}
            overview={overview}
            brandDNA={brandDNA}
          />
        );
      case "dm-flow":
        return (
          <DmFlowBuilder
            overview={overview}
            nurtureLadder={nurtureLadder}
            brandDNA={brandDNA}
          />
        );
      case "performance":
        return (
          <PerformanceTracker
            metricsSection={metrics}
            seriesId={seriesId}
          />
        );
      case "calendar":
        return (
          <SeriesCalendar
            overview={overview}
            themes={themes}
            brandDNA={brandDNA}
          />
        );
      case "audience":
        return (
          <AudienceToneShift
            slides={slides}
            overview={overview}
            brandDNA={brandDNA}
          />
        );
      case "image-prompts":
        return <AiImagePrompts slides={slides} />;
      case "cross-platform":
        return (
          <CrossPlatformAdapter
            slides={slides}
            overview={overview}
            brandDNA={brandDNA}
          />
        );
      default:
        return null;
    }
  };

  // Group tools by category for the grid view
  const groupedTools = TOOLS.reduce(
    (acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = [];
      acc[tool.category].push(tool);
      return acc;
    },
    {} as Record<string, ToolTab[]>,
  );

  const activeTool = TOOLS.find((t) => t.id === activeToolId);

  return (
    <div className="ck-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.385 3.154a.75.75 0 01-1.077-.845l1.028-5.995a.75.75 0 00-.216-.664L.82 6.073a.75.75 0 01.416-1.28l6.019-.874a.75.75 0 00.564-.41L10.5.716a.75.75 0 011.342 0l2.68 5.433a.75.75 0 00.564.41l6.019.874a.75.75 0 01.416 1.28l-4.355 4.244a.75.75 0 00-.216.664l1.028 5.995a.75.75 0 01-1.077.845l-5.385-3.154a.75.75 0 00-.698 0z" />
            </svg>
            Stories Toolkit
            <span className="text-[10px] font-normal text-text-tertiary ml-1">
              10 tools
            </span>
          </h3>
          {activeTool && (
            <button
              type="button"
              onClick={() => setActiveToolId(null)}
              className="text-[11px] font-medium text-text-tertiary hover:text-text-primary flex items-center gap-1 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              All tools
            </button>
          )}
        </div>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {activeToolId ? (
            /* Active tool view */
            <motion.div
              key={activeToolId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Tool header */}
              <div className="flex items-center gap-2.5 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveToolId(null)}
                  className="w-7 h-7 rounded-lg bg-surface-hover hover:bg-accent/10 flex items-center justify-center text-text-tertiary hover:text-accent transition-colors shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-accent">{activeTool?.icon}</span>
                  <h4 className="text-sm font-semibold text-text-primary">
                    {activeTool?.label}
                  </h4>
                </div>
              </div>

              {/* Tool content */}
              {renderToolContent(activeToolId)}
            </motion.div>
          ) : (
            /* Grid view */
            <motion.div
              key="grid"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {(["analyze", "create", "adapt"] as const).map((category) => {
                const tools = groupedTools[category];
                if (!tools || tools.length === 0) return null;
                const catConfig = CATEGORY_LABELS[category];
                return (
                  <div key={category}>
                    <p className={`text-[10px] uppercase tracking-wider font-bold ${catConfig.color} mb-2`}>
                      {catConfig.label}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {tools.map((tool) => {
                        const disabled = tool.requiresSlides && !hasSlides;
                        return (
                          <button
                            key={tool.id}
                            type="button"
                            onClick={() => !disabled && setActiveToolId(tool.id)}
                            disabled={disabled}
                            className={`group relative text-left rounded-xl border p-3 transition-all ${
                              disabled
                                ? "border-border/50 bg-surface/50 opacity-50 cursor-not-allowed"
                                : "border-border bg-surface hover:border-accent/40 hover:bg-accent/5 hover:shadow-sm"
                            }`}
                          >
                            <div className={`mb-1.5 ${disabled ? "text-text-tertiary" : "text-text-secondary group-hover:text-accent"} transition-colors`}>
                              {tool.icon}
                            </div>
                            <span className="text-[11px] font-semibold text-text-primary block leading-tight">
                              {tool.shortLabel}
                            </span>
                            {disabled && (
                              <span className="text-[9px] text-text-tertiary block mt-0.5">
                                Needs slides
                              </span>
                            )}
                            {!disabled && (
                              <svg
                                className="absolute top-3 right-3 w-3 h-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
