"use client";

import { useState } from "react";
import type { Offer } from "@/lib/offer/schema";
import {
  sortProducts,
  tierOf,
  money,
  stageValue,
  offerValueTotal,
  resultMapHasContent,
} from "@/lib/offer/schema";
import { offerMarkdown, productHasContent } from "@/lib/offer/assemble";
import { offerExportHtml } from "@/lib/offer/export-html";

export function OfferPreview({
  offer: D,
  embedded = false,
}: {
  offer: Offer;
  // `embedded` drops the export toolbar and sticky positioning so the ladder can
  // be shown read-only inside the Brand DNA / answers view.
  embedded?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const valTotal = offerValueTotal(D);
  const multi = D.ladders.length > 1;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offerMarkdown(D));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const exportHtml = () => {
    const md = offerMarkdown(D);
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(
      D.offerName || "Offer",
    )}</title><style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.55;color:#1a1a1a}h1{font-size:28px}h2{font-size:18px;margin-top:28px;border-bottom:1px solid #eee;padding-bottom:4px}pre{white-space:pre-wrap;font-family:inherit}</style></head><body><pre>${esc(
      md,
    )}</pre></body></html>`;
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${D.offerName || "offer"}-ladder.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const html = offerExportHtml(D);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    // Give the new window a tick to lay out before opening the print dialog,
    // where the user picks "Save as PDF".
    const fire = () => {
      win.focus();
      win.print();
    };
    if (win.document.readyState === "complete") setTimeout(fire, 350);
    else win.addEventListener("load", () => setTimeout(fire, 350));
  };

  const anyContent = D.ladders.some((L) => L.products.some(productHasContent));

  return (
    <div className={`ck-card p-5 space-y-3 ${embedded ? "" : "sticky top-6"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
          Your offer ladder
        </span>
        {!embedded && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copy}
              className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              {copied ? "Copied ✓" : "Copy text"}
            </button>
            <button
              type="button"
              onClick={exportHtml}
              className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Export HTML
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
            >
              Export PDF
            </button>
          </div>
        )}
      </div>

      <div
        className={`border-t border-border pt-3 space-y-3 text-sm ${embedded ? "" : "max-h-[70vh] overflow-y-auto"}`}
      >
        {!anyContent && (
          <p className="text-text-tertiary">
            Add products and build each one — your offer ladder assembles here.
          </p>
        )}

        <div className="text-lg font-bold text-text-primary">
          {D.offerName || "(unnamed offer)"}
        </div>

        {D.ladders.map((L, li) => {
          const products = sortProducts(L.products).filter(productHasContent);
          const conts = (L.continuities ?? []).filter(
            (c) => c.on && (c.name || c.price),
          );
          if (!products.length && !conts.length) return null;
          return (
            <div key={li} className="space-y-2">
              {multi && (
                <h5 className="text-xs uppercase tracking-wide text-text-tertiary font-semibold">
                  {L.name || `Value ladder ${li + 1}`}
                </h5>
              )}
              {products.map((p) => {
                const t = tierOf(p.price);
                const sv = stageValue(p);
                return (
                  <div
                    key={p.id}
                    className="rounded-lg border border-border p-2.5"
                    style={t ? { borderLeft: `3px solid ${t.color}` } : {}}
                  >
                    <div className="flex justify-between gap-2 font-medium text-text-primary">
                      <span>
                        {p.name || "Product"}
                        {p.pop ? " ⭐" : ""}
                        {t && (
                          <span className="text-text-tertiary font-normal">
                            {" "}
                            {t.label}
                          </span>
                        )}
                      </span>
                      <span>{p.price}</span>
                    </div>
                    {p.desc && (
                      <p className="text-xs text-text-tertiary mt-0.5">{p.desc}</p>
                    )}
                    {p.trim && (
                      <p className="text-xs text-text-secondary mt-1">
                        <span className="text-text-tertiary">Promise:</span>{" "}
                        {p.trim}
                      </p>
                    )}
                    {resultMapHasContent(p.resultMap) && (
                      <div className="text-xs mt-1.5">
                        {p.resultMap.ultimate && (
                          <p className="text-text-secondary">
                            <span className="text-text-tertiary">
                              🎯 Ultimate:
                            </span>{" "}
                            {p.resultMap.ultimate}
                          </p>
                        )}
                        {(p.resultMap.cores || []).map(
                          (c, cidx) =>
                            (c.result ||
                              (c.splinters || []).some((s) => s.trim())) && (
                              <div key={cidx} className="pl-2 mt-0.5">
                                {c.result && (
                                  <p className="text-text-secondary">
                                    → {c.result}
                                  </p>
                                )}
                                {(c.splinters || [])
                                  .filter((s) => s.trim())
                                  .map((s, sidx) => (
                                    <p
                                      key={sidx}
                                      className="text-text-tertiary pl-3"
                                    >
                                      • {s}
                                    </p>
                                  ))}
                              </div>
                            ),
                        )}
                      </div>
                    )}
                    {p.usePillars && p.pillars?.length
                      ? p.pillars.map((pl, pli) => (
                          <div key={pli} className="mt-1.5">
                            <div className="text-xs font-medium text-text-primary">
                              {pl.name || `Pillar ${pli + 1}`}
                              {pl.promise && (
                                <span className="text-text-tertiary font-normal">
                                  {" "}
                                  — {pl.promise}
                                </span>
                              )}
                            </div>
                            {pl.deliverables.map(
                              (d, di) =>
                                d.item && (
                                  <div
                                    key={di}
                                    className="flex justify-between text-xs text-text-secondary pl-2"
                                  >
                                    <span>• {d.item}</span>
                                    <span>{money(d.val)}</span>
                                  </div>
                                ),
                            )}
                            {pl.bonuses.map(
                              (b, bi) =>
                                b.name && (
                                  <div
                                    key={bi}
                                    className="flex justify-between text-xs text-text-secondary pl-2"
                                  >
                                    <span>🎁 {b.name}</span>
                                    <span>{money(b.val)}</span>
                                  </div>
                                ),
                            )}
                          </div>
                        ))
                      : (
                          <>
                            {p.deliverables.map(
                              (d, di) =>
                                d.item && (
                                  <div
                                    key={di}
                                    className="flex justify-between text-xs text-text-secondary"
                                  >
                                    <span>• {d.item}</span>
                                    <span>{money(d.val)}</span>
                                  </div>
                                ),
                            )}
                            {p.bonuses.map(
                              (b, bi) =>
                                b.name && (
                                  <div
                                    key={bi}
                                    className="flex justify-between text-xs text-text-secondary"
                                  >
                                    <span>🎁 {b.name}</span>
                                    <span>{money(b.val)}</span>
                                  </div>
                                ),
                            )}
                          </>
                        )}
                    {(sv > 0 || p.realPrice) && (
                      <div className="flex justify-between text-xs mt-1 pt-1 border-t border-border">
                        <span className="text-text-tertiary">
                          {sv > 0 ? `${money(sv)} value` : ""}
                        </span>
                        {p.realPrice && (
                          <span className="font-semibold text-accent">
                            {money(p.realPrice)}
                          </span>
                        )}
                      </div>
                    )}
                    {p.guaranteeResult && (
                      <p className="text-xs text-text-tertiary mt-1">
                        ✅ {p.guaranteeResult}
                      </p>
                    )}
                    {p.payment && (
                      <p className="text-xs text-text-tertiary">💳 {p.payment}</p>
                    )}
                  </div>
                );
              })}
              {conts.map((c, ci) => (
                <div
                  key={ci}
                  className="flex justify-between text-xs text-text-secondary"
                >
                  <span>🔁 {c.name}</span>
                  <span>{c.price}</span>
                </div>
              ))}
            </div>
          );
        })}

        {valTotal > 0 && (
          <div className="border-t border-border pt-2 flex justify-between font-semibold text-text-primary">
            <span>Total stacked value</span>
            <span>{money(valTotal)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
