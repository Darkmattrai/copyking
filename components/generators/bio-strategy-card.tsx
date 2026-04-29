"use client";

import { MarkdownRenderer } from "@/components/generators/markdown-renderer";

interface Props {
  title: string;
  iconPath: string;
  content: string;
  subtitle?: string;
}

export function BioStrategyCard({ title, iconPath, content, subtitle }: Props) {
  if (!content.trim()) return null;

  return (
    <div className="ck-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
        <svg
          className="w-4 h-4 text-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
        {title}
      </h3>
      {subtitle && (
        <p className="text-[11px] text-text-tertiary mb-3">{subtitle}</p>
      )}
      <div className="text-sm">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
