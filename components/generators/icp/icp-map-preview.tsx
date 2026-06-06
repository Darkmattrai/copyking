"use client";

import { useEffect, useState } from "react";
import type { GeneratedICP } from "@/lib/icp/schema";

export function IcpMapPreview({
  icp,
  logoDataUrl,
}: {
  icp: GeneratedICP;
  logoDataUrl?: string;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setError(null);

    (async () => {
      try {
        const res = await fetch("/api/icp/serialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ icp, logoDataUrl }),
        });
        if (!res.ok) throw new Error(`Render failed (${res.status})`);
        const text = await res.text();
        if (!cancelled) setHtml(text);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to render map",
          );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [icp, logoDataUrl]);

  const download = () => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${icp.businessName || "icp"}-map.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="ck-card p-6 text-sm text-danger">
        {error}
      </div>
    );
  }

  if (!html) {
    return (
      <div className="ck-card p-12 flex flex-col items-center justify-center gap-3">
        <span className="relative h-6 w-6">
          <span className="absolute inset-0 rounded-full border-2 border-border" />
          <span className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </span>
        <p className="text-sm text-text-secondary">Rendering your map…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" onClick={download} className="ck-btn-secondary">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Export HTML
        </button>
      </div>
      <div className="ck-card overflow-hidden">
        <iframe
          title="ICP Map"
          srcDoc={html}
          className="w-full bg-white"
          style={{ height: "80vh", border: "none" }}
        />
      </div>
    </div>
  );
}
