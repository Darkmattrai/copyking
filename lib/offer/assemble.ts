import type { Offer, Product } from "./schema";
import {
  sortProducts,
  tierOf,
  money,
  valueScore,
  stageValue,
} from "./schema";

// A product is "worth printing" once it has a name, price, or any stack content.
export function productHasContent(p: Product): boolean {
  return Boolean(
    p.name ||
      p.price ||
      (p.deliverables || []).some((d) => d.item) ||
      (p.bonuses || []).some((b) => b.name) ||
      p.trim ||
      p.dream,
  );
}

function productMarkdown(p: Product): string {
  let o = `### ${p.name || "Product"}${p.pop ? " ⭐" : ""} — ${p.price || "—"}`;
  const t = tierOf(p.price);
  if (t) o += ` _(${t.label})_`;
  o += `\n`;
  if (p.desc) o += `${p.desc}\n`;
  if (p.who) o += `\n**For:** ${p.who}\n`;
  if (p.dream) o += `**Dream outcome:** ${p.dream}\n`;
  if (p.trim) o += `**The promise:** ${p.trim}\n`;

  const feats = (p.features || []).filter((f) => f.f || f.b);
  if (feats.length) {
    o += `\n**Features → benefits**\n`;
    feats.forEach((f) => (o += `- ${f.f || "?"} → ${f.b || "?"}\n`));
  }

  const probs = (p.problems || []).filter((x) => x.p || x.s);
  if (probs.length) {
    o += `\n**Problems → solutions**\n`;
    probs.forEach((x) => (o += `- ${x.p || "?"} → ${x.s || "?"}\n`));
  }

  const deliv = (p.deliverables || []).filter((d) => d.item);
  const bonus = (p.bonuses || []).filter((b) => b.name);
  if (deliv.length || bonus.length) {
    o += `\n**What's included**\n`;
    deliv.forEach((d) => (o += `- ${d.item} — ${money(d.val)}\n`));
    bonus.forEach((b) => (o += `- 🎁 ${b.name} — ${money(b.val)}${b.why ? ` (${b.why})` : ""}\n`));
  }
  if (p.payment) o += `- 💳 ${p.payment}\n`;

  const sv = stageValue(p);
  if (sv > 0 || p.realPrice) {
    o += `\n**Stacked value:** ${money(sv)}`;
    if (p.realPrice) o += ` — **price today: ${money(p.realPrice)}**`;
    o += `\n`;
    if (p.anchorCompare) o += `${p.anchorCompare}\n`;
  }

  if (p.guaranteeResult)
    o += `\n**Guarantee (${p.guaranteeType}):** ${p.guaranteeResult}${p.guaranteeWindow ? ` (${p.guaranteeWindow})` : ""}\n`;
  if (p.scarcityDetail)
    o += `**Scarcity (${p.scarcityType}):** ${p.scarcityDetail}\n`;

  const objs = (p.objections || []).filter((x) => x.o);
  if (objs.length) {
    o += `\n**Objections handled**\n`;
    objs.forEach((x) => (o += `- ${x.o} → ${x.r || ""}\n`));
  }

  o += `\n_Value Equation score: ${valueScore(p.veq)} (dream ${p.veq.dream}, likelihood ${p.veq.likely}, time ${p.veq.time}, effort ${p.veq.effort})_\n`;
  return o;
}

export function offerMarkdown(D: Offer): string {
  let o = `# ${D.offerName || "Value Ladder"}\n\n`;
  const multi = D.ladders.length > 1;
  D.ladders.forEach((L, i) => {
    if (multi) o += `## ${L.name || "Value Ladder " + (i + 1)}\n\n`;
    else o += `## The Value Ladder\n\n`;
    sortProducts(L.products).forEach((p) => {
      if (!productHasContent(p)) return;
      o += productMarkdown(p) + `\n`;
    });
    L.continuities.forEach((c) => {
      if (c.on && (c.name || c.price))
        o += `**Continuity 🔁:** ${c.name} — ${c.price} (${c.cycle}) — ${c.desc || ""}\n\n`;
    });
  });
  return o;
}
