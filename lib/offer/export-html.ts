import type { Offer, Product, Continuity } from "./schema";
import {
  sortProducts,
  tierOf,
  money,
  valueScore,
  scoreNote,
  stageValue,
  offerValueTotal,
  assembleName,
  NAME_FORMULAS,
} from "./schema";
import { productHasContent } from "./assemble";

// Self-contained, print-ready HTML for the whole offer ladder. It reproduces the
// right-side ladder summary AND a complete field-by-field breakdown of every
// product on every ladder — nothing entered is left out. Opened in a new window
// and printed, the browser's "Save as PDF" produces the export.

const esc = (s: string | number | null | undefined) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const has = (s: string | null | undefined) => Boolean(s && String(s).trim());

// A labelled row, rendered only when the value has content.
function row(label: string, value: string | null | undefined): string {
  if (!has(value)) return "";
  return `<div class="row"><div class="row-k">${esc(label)}</div><div class="row-v">${esc(
    value,
  )}</div></div>`;
}

function pairList(
  title: string,
  pairs: { a: string; b: string; sep?: string }[],
): string {
  const rows = pairs
    .filter((x) => has(x.a) || has(x.b))
    .map(
      (x) =>
        `<li><span class="pl-a">${esc(x.a || "—")}</span><span class="pl-sep">${
          x.sep || "→"
        }</span><span class="pl-b">${esc(x.b || "—")}</span></li>`,
    )
    .join("");
  if (!rows) return "";
  return `<div class="block"><div class="block-h">${esc(title)}</div><ul class="pairs">${rows}</ul></div>`;
}

function section(title: string, inner: string): string {
  if (!inner.trim()) return "";
  return `<div class="sec"><h4 class="sec-h">${esc(title)}</h4>${inner}</div>`;
}

// The compact ladder card (mirrors the right-side preview panel).
function ladderCard(p: Product): string {
  const t = tierOf(p.price);
  const sv = stageValue(p);
  const deliv = (p.deliverables || []).filter((d) => d.item);
  const bonus = (p.bonuses || []).filter((b) => b.name);
  return `<div class="lc">
    <div class="lc-top">
      <span class="lc-name">${esc(p.name || "Product")}${p.pop ? " ⭐" : ""}${
        t ? ` <span class="lc-tier">${esc(t.label)}</span>` : ""
      }</span>
      <span class="lc-price">${esc(p.price || "—")}</span>
    </div>
    ${p.desc ? `<div class="lc-desc">${esc(p.desc)}</div>` : ""}
    ${p.trim ? `<div class="lc-promise"><b>Promise:</b> ${esc(p.trim)}</div>` : ""}
    ${deliv
      .map(
        (d) =>
          `<div class="lc-line"><span>• ${esc(d.item)}</span><span>${esc(
            money(d.val),
          )}</span></div>`,
      )
      .join("")}
    ${bonus
      .map(
        (b) =>
          `<div class="lc-line"><span>🎁 ${esc(b.name)}</span><span>${esc(
            money(b.val),
          )}</span></div>`,
      )
      .join("")}
    ${
      sv > 0 || has(p.realPrice)
        ? `<div class="lc-foot">${sv > 0 ? `<span>${esc(money(sv))} value</span>` : "<span></span>"}${
            has(p.realPrice) ? `<span class="lc-real">${esc(money(p.realPrice))}</span>` : ""
          }</div>`
        : ""
    }
    ${p.guaranteeResult ? `<div class="lc-note">✅ ${esc(p.guaranteeResult)}</div>` : ""}
    ${p.payment ? `<div class="lc-note">💳 ${esc(p.payment)}</div>` : ""}
  </div>`;
}

// The complete, nothing-skipped breakdown of a single product.
function productBreakdown(p: Product, ordinal: number): string {
  const t = tierOf(p.price);
  const sv = stageValue(p);
  const name = assembleName(p.nm);
  const formula = NAME_FORMULAS.find((f) => f.key === p.nm?.formula);

  // Avatar / bullseye
  const avatar = section(
    "Avatar & bullseye",
    [
      row("Who it's for", p.who),
      row("Where to find them", p.where),
      row("Dream outcome", p.dream),
      row("Driving emotion", p.emotion),
      row("Bait / lead magnet", p.bait),
    ].join(""),
  );

  // Value engine
  const featuresBlock = pairList(
    "Features → benefits",
    (p.features || []).map((f) => ({ a: f.f, b: f.b })),
  );
  const problemsBlock = pairList(
    "Problems → solutions",
    (p.problems || []).map((x) => ({ a: x.p, b: x.s })),
  );
  const magicBlock = [
    row("Magic-wand outcome", p.magic),
    row("Trimmed promise", p.trim),
    row("Rationale (why this offer)", p.rationale),
  ].join("");
  const engine = section(
    "Value engine",
    featuresBlock + problemsBlock + magicBlock,
  );

  // What's included (deliverables + bonuses with full detail)
  const deliv = (p.deliverables || []).filter((d) => d.item);
  const bonus = (p.bonuses || []).filter((b) => b.name);
  let included = "";
  if (deliv.length) {
    included += `<div class="block"><div class="block-h">Deliverables</div><table class="tbl"><tbody>${deliv
      .map(
        (d) =>
          `<tr><td>${esc(d.item)}</td><td class="num">${esc(money(d.val))}</td></tr>`,
      )
      .join("")}</tbody></table></div>`;
  }
  if (bonus.length) {
    included += `<div class="block"><div class="block-h">Bonuses</div><table class="tbl"><tbody>${bonus
      .map(
        (b) =>
          `<tr><td>🎁 ${esc(b.name)}${b.why ? `<div class="why">${esc(b.why)}</div>` : ""}</td><td class="num">${esc(
            money(b.val),
          )}</td></tr>`,
      )
      .join("")}</tbody></table></div>`;
  }
  const includedSec = section("What's included", included);

  // Value equation
  const veqSec = section(
    "Value equation",
    `<div class="veq">
      <div class="veq-score">Score <b>${esc(valueScore(p.veq))}</b> <span class="veq-note">${esc(
        scoreNote(valueScore(p.veq)),
      )}</span></div>
      <div class="veq-grid">
        <div><span>Dream outcome</span><b>${esc(p.veq.dream)}</b></div>
        <div><span>Perceived likelihood</span><b>${esc(p.veq.likely)}</b></div>
        <div><span>Time delay</span><b>${esc(p.veq.time)}</b></div>
        <div><span>Effort & sacrifice</span><b>${esc(p.veq.effort)}</b></div>
      </div>
    </div>`,
  );

  // Pricing & proof
  const proof = (p.proofShots || []).filter(has);
  const pricing = section(
    "Pricing & proof",
    [
      sv > 0 ? row("Stacked value", money(sv)) : "",
      row("Price today", has(p.realPrice) ? money(p.realPrice) : ""),
      row("Headline / recurring price", p.price),
      row("Payment plan", p.payment),
      row("Price justification", p.priceProof),
      row("Anchor comparison", p.anchorCompare),
      proof.length
        ? `<div class="block"><div class="block-h">Proof</div><ul class="bullets">${proof
            .map((s) => `<li>${esc(s)}</li>`)
            .join("")}</ul></div>`
        : "",
    ].join(""),
  );

  // Risk reversal — basic + performance guarantee
  const guarantee = section(
    "Guarantee & risk reversal",
    [
      row("Guarantee type", p.guaranteeType),
      row("Guaranteed result", p.guaranteeResult),
      row("Window", p.guaranteeWindow),
      row("Proof required to claim", p.guaranteeProofReq),
      row("Performance — competitors", p.pgCompetitors),
      row("Performance — strength", p.pgStrength),
      row("Performance — payback", p.pgPayback),
      row("Performance — where it applies", p.pgWhere),
    ].join(""),
  );

  // Urgency & scarcity
  const urgency = section(
    "Urgency & scarcity",
    [
      row("Scarcity type", p.scarcityType),
      row("Urgency type", p.urgencyType),
      row("Detail", p.scarcityDetail),
    ].join(""),
  );

  // Objections
  const objections = section(
    "Objections handled",
    pairList(
      "",
      (p.objections || []).map((x) => ({ a: x.o, b: x.r })),
    ).replace('<div class="block-h"></div>', ""),
  );

  // Name
  const partsRows = formula
    ? formula.parts
        .map((part) =>
          row(part.label, (p.nm?.parts || {})[part.key]),
        )
        .join("")
    : "";
  const nameSec = section(
    "Offer name",
    [
      row("Assembled name", name),
      row("Formula", formula ? formula.label : p.nm?.formula),
      partsRows,
      row("Lead-gen add-on", p.leadAdd),
    ].join(""),
  );

  return `<div class="prod">
    <div class="prod-hd">
      <div class="prod-no">Stage ${ordinal}</div>
      <h3 class="prod-name">${esc(p.name || "Untitled product")}${p.pop ? " ⭐" : ""}</h3>
      <div class="prod-meta">
        <span class="prod-price">${esc(p.price || "—")}</span>
        ${t ? `<span class="prod-tier" style="background:${esc(t.bg)};color:${esc(t.color)}">${esc(t.label)}</span>` : ""}
      </div>
      ${p.desc ? `<div class="prod-desc">${esc(p.desc)}</div>` : ""}
    </div>
    ${avatar}
    ${engine}
    ${includedSec}
    ${veqSec}
    ${pricing}
    ${guarantee}
    ${urgency}
    ${objections}
    ${nameSec}
  </div>`;
}

function continuityRow(c: Continuity): string {
  return `<div class="cont">
    <div class="cont-top"><span class="cont-name">🔁 ${esc(c.name || "Continuity")}</span><span class="cont-price">${esc(
      c.price,
    )} <span class="cont-cycle">${esc(c.cycle)}</span></span></div>
    ${c.desc ? `<div class="cont-desc">${esc(c.desc)}</div>` : ""}
  </div>`;
}

export function offerExportHtml(D: Offer): string {
  const multi = D.ladders.length > 1;
  const valTotal = offerValueTotal(D);
  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const laddersHtml = D.ladders
    .map((L, li) => {
      const products = sortProducts(L.products).filter(productHasContent);
      const conts = (L.continuities || []).filter(
        (c) => c.on && (c.name || c.price),
      );
      if (!products.length && !conts.length) return "";

      // Summary (mirrors the right-side panel)
      const summary = `<div class="summary">
        <div class="summary-h">The value ladder${multi ? ` — ${esc(L.name || "Ladder " + (li + 1))}` : ""}</div>
        ${products.map(ladderCard).join("")}
        ${conts.map(continuityRow).join("")}
      </div>`;

      // Full per-stage breakdown
      const breakdown = products
        .map((p, i) => productBreakdown(p, i + 1))
        .join("");

      const contSection = conts.length
        ? `<div class="prod"><div class="prod-hd"><h3 class="prod-name">Continuity programs</h3></div>${conts
            .map(continuityRow)
            .join("")}</div>`
        : "";

      return `<section class="ladder">
        ${multi ? `<h2 class="ladder-h">${esc(L.name || "Value Ladder " + (li + 1))}</h2>` : ""}
        ${summary}
        <div class="breakdown-h">Full breakdown — every stage, every detail</div>
        ${breakdown}
        ${contSection}
      </section>`;
    })
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(D.offerName || "Offer")} — Offer Ladder</title>
<style>
  :root { --ink:#16151a; --muted:#6b6976; --line:#e7e5ec; --accent:#6d3df0; --bg:#ffffff; --soft:#f7f6fb; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: var(--ink); background: var(--bg); margin: 0; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .wrap { max-width: 820px; margin: 0 auto; padding: 48px 40px 64px; }
  .doc-eyebrow { font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--accent); font-weight: 700; }
  .doc-title { font-size: 34px; font-weight: 800; letter-spacing: -.01em; margin: 6px 0 4px; }
  .doc-meta { font-size: 12px; color: var(--muted); }
  .doc-total { margin-top: 14px; display: inline-flex; align-items: baseline; gap: 8px; background: var(--soft); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; }
  .doc-total b { font-size: 20px; }
  .doc-total span { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }

  .ladder { margin-top: 34px; }
  .ladder-h { font-size: 22px; font-weight: 800; border-bottom: 2px solid var(--ink); padding-bottom: 6px; }

  .summary { border: 1px solid var(--line); border-radius: 14px; padding: 16px; background: var(--soft); }
  .summary-h { font-size: 11px; text-transform: uppercase; letter-spacing: .12em; color: var(--muted); font-weight: 700; margin-bottom: 10px; }
  .lc { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 11px 13px; margin-bottom: 8px; }
  .lc-top { display: flex; justify-content: space-between; gap: 10px; font-weight: 700; }
  .lc-tier { font-weight: 500; color: var(--muted); font-size: 11px; }
  .lc-price { white-space: nowrap; }
  .lc-desc { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .lc-promise { font-size: 12px; margin-top: 4px; }
  .lc-line { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; color: #444; }
  .lc-foot { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; margin-top: 5px; padding-top: 5px; border-top: 1px solid var(--line); }
  .lc-real { font-weight: 700; color: var(--accent); }
  .lc-note { font-size: 12px; color: var(--muted); margin-top: 3px; }

  .breakdown-h { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--accent); margin: 28px 0 0; }

  .prod { border: 1px solid var(--line); border-radius: 14px; padding: 20px 22px; margin-top: 16px; page-break-inside: avoid; }
  .prod-hd { border-bottom: 1px solid var(--line); padding-bottom: 12px; margin-bottom: 4px; }
  .prod-no { font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); font-weight: 700; }
  .prod-name { font-size: 21px; font-weight: 800; margin: 3px 0 6px; }
  .prod-meta { display: flex; align-items: center; gap: 10px; }
  .prod-price { font-size: 16px; font-weight: 700; }
  .prod-tier { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
  .prod-desc { font-size: 13px; color: var(--muted); margin-top: 8px; }

  .sec { margin-top: 16px; }
  .sec-h { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--accent); margin: 0 0 8px; }
  .row { display: grid; grid-template-columns: 190px 1fr; gap: 12px; padding: 5px 0; border-bottom: 1px dotted var(--line); font-size: 13px; }
  .row-k { color: var(--muted); }
  .row-v { white-space: pre-wrap; }

  .block { margin: 10px 0; }
  .block-h { font-size: 12px; font-weight: 700; margin-bottom: 5px; }
  ul.pairs { list-style: none; margin: 0; padding: 0; }
  ul.pairs li { display: grid; grid-template-columns: 1fr 18px 1fr; gap: 6px; font-size: 13px; padding: 4px 0; border-bottom: 1px dotted var(--line); }
  .pl-sep { color: var(--accent); text-align: center; }
  .pl-b { color: #333; }
  ul.bullets { margin: 4px 0 0; padding-left: 18px; font-size: 13px; }
  ul.bullets li { margin: 2px 0; }

  table.tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
  table.tbl td { padding: 5px 0; border-bottom: 1px dotted var(--line); vertical-align: top; }
  table.tbl td.num { text-align: right; white-space: nowrap; color: var(--muted); width: 90px; }
  .why { font-size: 11px; color: var(--muted); margin-top: 1px; }

  .veq-score { font-size: 14px; margin-bottom: 8px; }
  .veq-note { color: var(--muted); font-size: 12px; }
  .veq-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .veq-grid > div { display: flex; justify-content: space-between; background: var(--soft); border: 1px solid var(--line); border-radius: 8px; padding: 7px 10px; font-size: 12px; }
  .veq-grid span { color: var(--muted); }

  .cont { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; margin-top: 8px; }
  .cont-top { display: flex; justify-content: space-between; gap: 10px; font-weight: 700; font-size: 13px; }
  .cont-cycle { font-weight: 500; color: var(--muted); font-size: 11px; }
  .cont-desc { font-size: 12px; color: var(--muted); margin-top: 3px; }

  @media print {
    .wrap { padding: 0; max-width: none; }
    @page { margin: 16mm; }
  }
</style></head><body><div class="wrap">
  <div class="doc-eyebrow">Irresistible Offer · Value Ladder</div>
  <h1 class="doc-title">${esc(D.offerName || "Untitled Offer")}</h1>
  <div class="doc-meta">Prepared by Copy King · ${esc(today)}</div>
  ${
    valTotal > 0
      ? `<div class="doc-total"><b>${esc(money(valTotal))}</b><span>Total stacked value</span></div>`
      : ""
  }
  ${laddersHtml || `<p style="color:var(--muted);margin-top:24px">No offer content yet — build out your ladder, then export.</p>`}
</div></body></html>`;
}
