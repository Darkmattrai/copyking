"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface Section {
  name: string;
  id: string;
  status: "done" | "active" | "pending";
}

interface VSLProgressSidebarProps {
  content: string;
  isStreaming: boolean;
}

/**
 * Extracts top-level sections (H2/H3) from the streaming VSL content
 * and shows progress with clickable navigation.
 */
function extractSections(content: string, isStreaming: boolean): Section[] {
  const lines = content.split("\n");
  const headings: string[] = [];

  for (const line of lines) {
    const match = line.match(/^#{1,3}\s+(.+)/);
    if (match) {
      headings.push(match[1].replace(/\*\*/g, "").trim());
    }
  }

  // Expected section pattern for Classic 5-Part
  const expectedSections = [
    "VSL Landing Page",
    "The Hook",
    "The Problem",
    "The Solution",
    "The Proof",
    "The Offer + Close",
    "Order Page",
  ];

  return expectedSections.map((name) => {
    const found = headings.some((h) =>
      h.toLowerCase().includes(name.toLowerCase().replace("the ", ""))
    );
    const isLast = name === expectedSections[expectedSections.length - 1];

    let status: Section["status"];
    if (found) {
      // Check if there's a section after this one that's also found
      const idx = expectedSections.indexOf(name);
      const nextFound =
        idx < expectedSections.length - 1 &&
        headings.some((h) =>
          h.toLowerCase().includes(
            expectedSections[idx + 1].toLowerCase().replace("the ", "")
          )
        );
      status = nextFound || (!isStreaming && found) ? "done" : isStreaming ? "active" : "done";
    } else {
      status = "pending";
    }

    return {
      name,
      id: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      status,
    };
  });
}

export function VSLProgressSidebar({ content, isStreaming }: VSLProgressSidebarProps) {
  const sections = useMemo(
    () => extractSections(content, isStreaming),
    [content, isStreaming]
  );

  const completedCount = sections.filter((s) => s.status === "done").length;
  const progress = sections.length > 0 ? (completedCount / sections.length) * 100 : 0;

  if (!content.trim()) return null;

  function scrollToSection(name: string) {
    // Find the heading in the rendered output
    const headings = document.querySelectorAll(
      "[data-vsl-output] h1, [data-vsl-output] h2, [data-vsl-output] h3"
    );
    for (const h of Array.from(headings)) {
      if (
        h.textContent
          ?.toLowerCase()
          .includes(name.toLowerCase().replace("the ", ""))
      ) {
        h.scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      }
    }
  }

  return (
    <div className="ck-card p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
          Sections
        </span>
        <span className="text-[10px] text-text-tertiary">
          {completedCount}/{sections.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-surface-raised overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Section list */}
      <div className="space-y-0.5">
        {sections.map((section) => (
          <button
            key={section.name}
            type="button"
            onClick={() => scrollToSection(section.name)}
            disabled={section.status === "pending"}
            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors ${
              section.status === "pending"
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-surface-hover cursor-pointer"
            }`}
          >
            {/* Status icon */}
            {section.status === "done" && (
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <svg className="w-2.5 h-2.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            )}
            {section.status === "active" && (
              <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              </div>
            )}
            {section.status === "pending" && (
              <div className="w-4 h-4 rounded-full border border-border shrink-0" />
            )}

            <span
              className={`text-xs truncate ${
                section.status === "active"
                  ? "text-accent font-medium"
                  : section.status === "done"
                    ? "text-text-primary"
                    : "text-text-tertiary"
              }`}
            >
              {section.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
