// Export helpers for the account "Brand DNA" tab. No external dependencies:
// the PDF path opens a print-ready window and calls window.print() (users pick
// "Save as PDF"); the .doc path downloads a Word-compatible HTML blob.

import type { AnswerGroup } from "./brand-dna-answers";
import type { Offer } from "@/lib/offer/schema";
import {
  sortProducts,
  tierOf,
  money,
  stageValue,
  offerValueTotal,
  effectiveDeliverables,
  effectiveBonuses,
} from "@/lib/offer/schema";
import { productHasContent } from "@/lib/offer/assemble";

interface ExportMeta {
  brandName?: string;
  // When provided, the offer ladder is rendered into the document.
  offer?: Offer | null;
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const nl2br = (s: string) => esc(s).replace(/\n/g, "<br/>");

// A field counts as "answered" if it has any value or an AI rewrite.
function hasContent(g: AnswerGroup): boolean {
  return g.fields.some((f) => f.value.trim() || f.enhanced?.trim());
}

function fieldHtml(question: string, value: string, original?: string, enhanced?: string): string {
  // When an AI-enhanced version exists, show both the original answer and the
  // rewrite so the document captures everything the user produced.
  if (enhanced?.trim() && original?.trim() && original.trim() !== enhanced.trim()) {
    return `<div class="field">
      <div class="q">${esc(question)}</div>
      <div class="sub">Original answer</div>
      <div class="a orig">${nl2br(original)}</div>
      <div class="sub">AI-enhanced version</div>
      <div class="a enh">${nl2br(enhanced)}</div>
    </div>`;
  }
  if (!value.trim()) return "";
  return `<div class="field">
    <div class="q">${esc(question)}</div>
    <div class="a">${nl2br(value)}</div>
  </div>`;
}

// Render the offer ladder (the same summary shown in the builder/Brand DNA) as
// a self-contained HTML section so it appears in the exported PDF/.doc.
function offerLadderHtml(offer?: Offer | null): string {
  if (!offer) return "";
  const anyContent = offer.ladders.some((L) =>
    L.products.some(productHasContent),
  );
  if (!anyContent) return "";

  const ladders = offer.ladders
    .map((L) => {
      const products = sortProducts(L.products).filter(productHasContent);
      const conts = (L.continuities ?? []).filter(
        (c) => c.on && (c.name || c.price),
      );
      if (!products.length && !conts.length) return "";

      const prods = products
        .map((p) => {
          const t = tierOf(p.price);
          const sv = stageValue(p);
          const stack = [
            ...effectiveDeliverables(p)
              .filter((d) => d.item)
              .map(
                (d) =>
                  `<li>${esc(d.item)}${d.val ? `<span class="v">${esc(money(d.val))}</span>` : ""}</li>`,
              ),
            ...effectiveBonuses(p)
              .filter((b) => b.name)
              .map(
                (b) =>
                  `<li>🎁 ${esc(b.name)}${b.val ? `<span class="v">${esc(money(b.val))}</span>` : ""}</li>`,
              ),
          ].join("");
          return `<div class="prod"${t ? ` style="border-left:3px solid ${t.color}"` : ""}>
            <div class="prod-head"><strong>${esc(p.name || "Product")}${p.pop ? " ⭐" : ""}</strong>${t ? ` <span class="tier">${esc(t.label)}</span>` : ""}<span class="price">${esc(p.price)}</span></div>
            ${p.desc ? `<div class="prod-desc">${esc(p.desc)}</div>` : ""}
            ${p.trim ? `<div class="prod-promise"><em>Promise:</em> ${esc(p.trim)}</div>` : ""}
            ${stack ? `<ul class="stack">${stack}</ul>` : ""}
            ${sv > 0 || p.realPrice ? `<div class="prod-foot">${sv > 0 ? `${esc(money(sv))} value` : ""}${p.realPrice ? ` &rarr; <strong>${esc(money(p.realPrice))}</strong>` : ""}</div>` : ""}
            ${p.guaranteeType !== "No Guarantee" && p.guaranteeResult ? `<div class="prod-guar">✅ ${esc(p.guaranteeResult)}</div>` : ""}
          </div>`;
        })
        .join("");

      const continuity = conts
        .map((c) => {
          const cd = (c.deliverables ?? [])
            .filter((d) => d.item)
            .map(
              (d) =>
                `<li>${esc(d.item)}${d.val ? `<span class="v">${esc(money(d.val))}</span>` : ""}</li>`,
            );
          const cb = (c.bonuses ?? [])
            .filter((b) => b.name)
            .map(
              (b) =>
                `<li>🎁 ${esc(b.name)}${b.val ? `<span class="v">${esc(money(b.val))}</span>` : ""}</li>`,
            );
          const stack = [...cd, ...cb].join("");
          return `<div class="cont">🔁 ${esc(c.name || "Continuity")}<span class="price">${esc(c.price)}${c.cycle ? `/${esc(c.cycle.toLowerCase())}` : ""}</span></div>${stack ? `<ul class="stack">${stack}</ul>` : ""}`;
        })
        .join("");

      return prods + continuity;
    })
    .join("");

  const total = offerValueTotal(offer);

  return `<section class="group offer-ladder">
    <h2>Offer Ladder <span class="tag">Offer</span></h2>
    <div class="ladder-name">${esc(offer.offerName || "(unnamed offer)")}</div>
    ${ladders}
    ${total > 0 ? `<div class="ladder-total">Total stacked value<span>${esc(money(total))}</span></div>` : ""}
  </section>`;
}

function buildBodyHtml(groups: AnswerGroup[]): string {
  const sections = groups
    .filter(hasContent)
    .map((g) => {
      const fields = g.fields
        .map((f) => fieldHtml(f.question, f.value, f.original, f.enhanced))
        .filter(Boolean)
        .join("\n");
      if (!fields) return "";
      return `<section class="group">
        <h2>${esc(g.category)} <span class="tag">${esc(g.feature)}</span></h2>
        ${fields}
      </section>`;
    })
    .filter(Boolean)
    .join("\n");
  return sections;
}

function buildDocument(groups: AnswerGroup[], meta: ExportMeta): string {
  const title = meta.brandName ? `${meta.brandName} — Brand DNA` : "Brand DNA";
  const date = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; margin: 40px; line-height: 1.5; }
  .doc-header { border-bottom: 3px solid #6b46ff; padding-bottom: 12px; margin-bottom: 24px; }
  .doc-header h1 { font-size: 26px; margin: 0 0 4px; }
  .doc-header .meta { font-size: 12px; color: #666; }
  section.group { margin: 0 0 28px; page-break-inside: avoid; }
  section.group h2 { font-size: 17px; margin: 0 0 12px; padding-bottom: 6px; border-bottom: 1px solid #ddd; }
  .tag { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;
         color: #6b46ff; border: 1px solid #6b46ff; border-radius: 4px; padding: 1px 6px; margin-left: 8px;
         vertical-align: middle; }
  .field { margin: 0 0 14px; }
  .q { font-weight: bold; font-size: 13px; color: #333; margin-bottom: 3px; }
  .a { font-size: 13px; color: #1a1a1a; white-space: normal; }
  .sub { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 6px 0 2px; }
  .a.orig { color: #777; }
  .a.enh { color: #1a1a1a; }
  .offer-ladder .ladder-name { font-size: 16px; font-weight: bold; margin: 0 0 12px; }
  .offer-ladder .prod { border: 1px solid #ddd; border-radius: 6px; padding: 10px 12px; margin: 0 0 10px; page-break-inside: avoid; }
  .offer-ladder .prod-head { display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; }
  .offer-ladder .prod-head .tier { color: #888; font-weight: normal; font-size: 11px; margin-right: auto; padding-left: 6px; }
  .offer-ladder .prod-head .price { font-weight: bold; }
  .offer-ladder .prod-desc { font-size: 12px; color: #666; margin-top: 2px; }
  .offer-ladder .prod-promise { font-size: 12px; color: #333; margin-top: 4px; }
  .offer-ladder ul.stack { list-style: none; margin: 6px 0 0; padding: 0; }
  .offer-ladder ul.stack li { display: flex; justify-content: space-between; font-size: 12px; color: #333; padding: 1px 0; }
  .offer-ladder ul.stack li .v { color: #666; }
  .offer-ladder .prod-foot { display: flex; justify-content: space-between; font-size: 12px; color: #666; border-top: 1px solid #eee; margin-top: 6px; padding-top: 4px; }
  .offer-ladder .prod-guar { font-size: 12px; color: #555; margin-top: 4px; }
  .offer-ladder .cont { display: flex; justify-content: space-between; font-size: 12px; color: #555; padding: 2px 0; }
  .offer-ladder .ladder-total { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; border-top: 2px solid #333; margin-top: 8px; padding-top: 6px; }
  @media print { body { margin: 0.6in; } }
</style>
</head>
<body>
  <div class="doc-header">
    <h1>${esc(title)}</h1>
    <div class="meta">Exported ${esc(date)}</div>
  </div>
  ${offerLadderHtml(meta.offer)}
  ${buildBodyHtml(groups)}
</body>
</html>`;
}

// Opens a print window so the user can "Save as PDF".
export function exportAnswersPdf(groups: AnswerGroup[], meta: ExportMeta = {}): void {
  const html = buildDocument(groups, meta);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  // Give the new document a tick to lay out before invoking the print dialog.
  win.onload = () => {
    win.focus();
    win.print();
  };
}

// ── Bulk export (admin "Export all Brand DNA") ───────────────────────────────

export interface UserBrandExport {
  label: string; // email or display name
  meta?: string; // e.g. "client · joined Jan 3, 2026"
  groups: AnswerGroup[];
}

function buildBundleDocument(entries: UserBrandExport[]): string {
  const date = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sections = entries
    .map((e) => {
      const body = buildBodyHtml(e.groups);
      return `<section class="user">
        <div class="user-head">
          <h1>${esc(e.label)}</h1>
          ${e.meta ? `<div class="user-meta">${esc(e.meta)}</div>` : ""}
        </div>
        ${body || '<p class="empty">No Brand DNA captured yet.</p>'}
      </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>All Brand DNA</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; margin: 40px; line-height: 1.5; }
  .doc-header { border-bottom: 3px solid #6b46ff; padding-bottom: 12px; margin-bottom: 24px; }
  .doc-header h1 { font-size: 26px; margin: 0 0 4px; }
  .doc-header .meta { font-size: 12px; color: #666; }
  section.user { margin: 0 0 40px; page-break-after: always; }
  .user-head { background: #f4f2ff; border-left: 4px solid #6b46ff; padding: 10px 14px; margin: 0 0 18px; }
  .user-head h1 { font-size: 20px; margin: 0; }
  .user-meta { font-size: 12px; color: #666; margin-top: 2px; }
  section.group { margin: 0 0 24px; page-break-inside: avoid; }
  section.group h2 { font-size: 16px; margin: 0 0 10px; padding-bottom: 6px; border-bottom: 1px solid #ddd; }
  .tag { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;
         color: #6b46ff; border: 1px solid #6b46ff; border-radius: 4px; padding: 1px 6px; margin-left: 8px;
         vertical-align: middle; }
  .field { margin: 0 0 12px; }
  .q { font-weight: bold; font-size: 13px; color: #333; margin-bottom: 3px; }
  .a { font-size: 13px; color: #1a1a1a; }
  .sub { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 6px 0 2px; }
  .a.orig { color: #777; }
  .empty { font-size: 13px; color: #999; font-style: italic; }
  @media print { body { margin: 0.6in; } }
</style>
</head>
<body>
  <div class="doc-header">
    <h1>All Brand DNA</h1>
    <div class="meta">${entries.length} account${entries.length === 1 ? "" : "s"} · Exported ${esc(date)}</div>
  </div>
  ${sections}
</body>
</html>`;
}

// Downloads a single Word-compatible .doc containing every user's Brand DNA.
export function exportAllBrandDnaDoc(entries: UserBrandExport[]): void {
  const html = buildBundleDocument(entries);
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `all-brand-dna-${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Downloads the raw bundle as JSON (full fidelity, machine-readable).
export function exportAllBrandDnaJson(payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `all-brand-dna-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Downloads a Word-compatible .doc file built from the same HTML.
export function exportAnswersDoc(groups: AnswerGroup[], meta: ExportMeta = {}): void {
  const html = buildDocument(groups, meta);
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const base = (meta.brandName || "brand-dna")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  a.href = url;
  a.download = `${base || "brand-dna"}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
