"use client";

import { useState } from "react";
import type { Offer } from "@/lib/offer/schema";
import {
  sortTiers,
  tierOf,
  money,
  valueScore,
  scoreNote,
  offerValueTotal,
} from "@/lib/offer/schema";
import { offerMarkdown, stageHasContent } from "@/lib/offer/assemble";

export function OfferPreview({ offer: D }: { offer: Offer }) {
  const [copied, setCopied] = useState(false);
  const valTotal = offerValueTotal(D);
  const multi = D.ladders.length > 1;
  const score = valueScore(D.veq);

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
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(
      D.offerName || "Offer",
    )}</title><style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.55;color:#1a1a1a}h1{font-size:28px}h2{font-size:18px;margin-top:28px;border-bottom:1px solid #eee;padding-bottom:4px}pre{white-space:pre-wrap;font-family:inherit}</style></head><body><pre>${esc(
      md,
    )}</pre></body></html>`;
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${D.offerName || "offer"}-map.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const empty = !D.trim && !valTotal && !D.realPrice;

  return (
    <div className="ck-card p-5 space-y-3 sticky top-6">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
          Your offer
        </span>
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
        </div>
      </div>

      <div className="text-xs text-text-tertiary">
        Value score{" "}
        <b className="text-text-primary">{score}</b> — {scoreNote(score)}
      </div>

      <div className="border-t border-border pt-3 max-h-[70vh] overflow-y-auto space-y-3 text-sm">
        {empty && (
          <p className="text-text-tertiary">
            Start filling in the steps — your offer assembles here.
          </p>
        )}

        <div>
          <div className="text-lg font-bold text-text-primary">
            {D.offerName || "(unnamed offer)"}
          </div>
          <div className="text-xs text-text-tertiary">
            {D.who ? `For ${D.who}` : "define your prospect…"}
            {D.dream ? ` · ${D.dream.slice(0, 90)}` : ""}
          </div>
        </div>

        {D.trim && (
          <div>
            <h5 className="text-xs uppercase tracking-wide text-text-tertiary font-semibold mb-1">
              The Promise
            </h5>
            <p className="text-text-secondary">{D.trim}</p>
          </div>
        )}

        {D.rationale && (
          <div>
            <h5 className="text-xs uppercase tracking-wide text-text-tertiary font-semibold mb-1">
              Why it&apos;s this good
            </h5>
            <p className="text-text-tertiary">{D.rationale}</p>
          </div>
        )}

        {D.ladders.map((L, li) => {
          const hasTiers = L.tiers.some(stageHasContent);
          const c = L.continuity;
          const hasCont = c && c.on && (c.name || c.price);
          if (!hasTiers && !hasCont) return null;
          return (
            <div key={li}>
              <h5 className="text-xs uppercase tracking-wide text-text-tertiary font-semibold mb-1">
                {multi ? L.name || `Value ladder ${li + 1}` : "The value ladder"}
              </h5>
              {sortTiers(L.tiers).map((x, xi) => {
                if (!stageHasContent(x)) return null;
                const t = tierOf(x.price);
                return (
                  <div
                    key={xi}
                    className="mb-2"
                    style={
                      t ? { borderLeft: `3px solid ${t.color}`, paddingLeft: 8 } : {}
                    }
                  >
                    <div className="flex justify-between gap-2 font-medium text-text-primary">
                      <span>
                        {x.name || "Stage"}
                        {x.pop ? " ⭐" : ""}
                        {t && (
                          <span className="text-text-tertiary font-normal">
                            {" "}
                            {t.label}
                          </span>
                        )}
                      </span>
                      <span>{x.price}</span>
                    </div>
                    {x.desc && (
                      <p className="text-xs text-text-tertiary">{x.desc}</p>
                    )}
                    {x.deliverables.map(
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
                    {x.bonuses.map(
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
                    {x.payment && (
                      <p className="text-xs text-text-tertiary">
                        💳 {x.payment}
                      </p>
                    )}
                  </div>
                );
              })}
              {hasCont && (
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>🔁 {c.name}</span>
                  <span>{c.price}</span>
                </div>
              )}
            </div>
          );
        })}

        {(valTotal > 0 || D.realPrice) && (
          <div className="border-t border-border pt-2">
            {valTotal > 0 && (
              <div className="flex justify-between font-semibold text-text-primary">
                <span>Total stacked value</span>
                <span>{money(valTotal)}</span>
              </div>
            )}
            {D.realPrice && (
              <>
                <h5 className="text-xs uppercase tracking-wide text-text-tertiary font-semibold mt-2 mb-1">
                  Your price today
                </h5>
                <div className="text-2xl font-bold text-accent">
                  {money(D.realPrice)}
                </div>
                {valTotal > 0 && (
                  <p className="text-xs text-text-tertiary">
                    vs {money(valTotal)} in real value — you save{" "}
                    {money(valTotal - +D.realPrice)}
                  </p>
                )}
                {D.anchorCompare && (
                  <p className="text-xs text-text-tertiary">{D.anchorCompare}</p>
                )}
              </>
            )}
          </div>
        )}

        {D.guaranteeResult && (
          <div>
            <h5 className="text-xs uppercase tracking-wide text-text-tertiary font-semibold mb-1">
              Guarantee — {D.guaranteeType}
            </h5>
            <p className="text-text-secondary">
              {D.guaranteeResult}
              {D.guaranteeWindow ? ` (${D.guaranteeWindow})` : ""}
            </p>
          </div>
        )}

        {D.scarcityDetail && (
          <div>
            <h5 className="text-xs uppercase tracking-wide text-text-tertiary font-semibold mb-1">
              Act now — {D.scarcityType}
            </h5>
            <p className="text-text-secondary">{D.scarcityDetail}</p>
          </div>
        )}

        {D.objections.some((x) => x.o) && (
          <div>
            <h5 className="text-xs uppercase tracking-wide text-text-tertiary font-semibold mb-1">
              Objections handled
            </h5>
            {D.objections.map(
              (x, oi) =>
                x.o && (
                  <p key={oi} className="text-xs text-text-tertiary">
                    • {x.o}
                    {x.r ? ` → ${x.r}` : ""}
                  </p>
                ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
