"use client";

import { PillarIcon } from "@/components/brand/pillar-icon";
import { MarkdownRenderer } from "@/components/generators/markdown-renderer";

export interface SeoAudit {
  intro: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  category: string;
  usernameAudit: string;
  semanticNotes: string;
}

interface Props {
  audit: SeoAudit;
}

export function BioSeoAuditCard({ audit }: Props) {
  return (
    <div className="ck-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <svg
          className="w-4 h-4 text-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        Profile SEO Audit
      </h3>

      {audit.intro && (
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          {audit.intro}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {audit.primaryKeyword && (
          <div className="rounded-lg bg-accent/5 border border-accent/30 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-accent font-semibold mb-0.5">
              Primary Keyword
            </p>
            <p className="text-sm font-semibold text-text-primary">
              {audit.primaryKeyword}
            </p>
          </div>
        )}
        {audit.category && (
          <div className="rounded-lg bg-surface border border-border px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-text-tertiary font-semibold mb-0.5">
              Recommended Category
            </p>
            <p className="text-sm font-semibold text-text-primary">
              {audit.category}
            </p>
          </div>
        )}
      </div>

      {audit.secondaryKeywords.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wide text-text-tertiary font-semibold mb-1.5">
            Secondary Keywords
          </p>
          <div className="flex flex-wrap gap-1.5">
            {audit.secondaryKeywords.map((kw, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md bg-surface-hover border border-border text-xs text-text-secondary"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {audit.usernameAudit && (
        <div className="mb-3 rounded-lg bg-surface border border-border p-3">
          <p className="text-[10px] uppercase tracking-wide text-text-tertiary font-semibold mb-1 flex items-center gap-1">
            <PillarIcon className="w-3 h-3" icon="instagram" />
            Username Audit
          </p>
          <div className="text-sm text-text-secondary leading-relaxed">
            <MarkdownRenderer content={audit.usernameAudit} />
          </div>
        </div>
      )}

      {audit.semanticNotes && (
        <div className="text-[12px] text-text-tertiary italic leading-relaxed border-l-2 border-accent/40 pl-3">
          <span className="not-italic font-semibold text-text-secondary">
            2026 semantic search:{" "}
          </span>
          {audit.semanticNotes}
        </div>
      )}
    </div>
  );
}
