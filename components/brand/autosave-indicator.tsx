"use client";

import type { AutosaveStatus } from "@/lib/hooks/use-autosave";

export function AutosaveIndicator({ status }: { status: AutosaveStatus }) {
  return (
    <span
      aria-live="polite"
      className="inline-flex items-center gap-1.5 text-xs text-text-tertiary min-h-4"
    >
      {status === "saving" && (
        <>
          <span className="w-3 h-3 border-2 border-border border-t-accent rounded-full animate-spin" />
          Saving…
        </>
      )}
      {status === "saved" && (
        <>
          <svg
            className="w-3.5 h-3.5 text-success"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Saved to your account
        </>
      )}
    </span>
  );
}
