"use client";

import { useEffect, useRef, useState } from "react";
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const exportPdf = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    // The export stylesheet force-expands every segment for print, so the PDF
    // captures the full map regardless of which sections are collapsed on screen.
    win.focus();
    win.print();
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
      <div className="flex justify-end gap-2">
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
        <button type="button" onClick={exportPdf} className="ck-btn-primary">
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
              d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
            />
          </svg>
          Download PDF
        </button>
      </div>
      <div className="ck-card overflow-hidden">
        <iframe
          ref={iframeRef}
          title="ICP Map"
          srcDoc={html}
          className="w-full bg-white"
          style={{ height: "80vh", border: "none" }}
        />
      </div>
    </div>
  );
}
