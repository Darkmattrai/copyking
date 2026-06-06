import type { Offer, Tier } from "./schema";
import {
  sortTiers,
  tierOf,
  money,
  valueScore,
  offerValueTotal,
} from "./schema";

function stageHasContent(x: Tier): boolean {
  return Boolean(
    x.name ||
      x.price ||
      (x.deliverables || []).some((d) => d.item) ||
      (x.bonuses || []).some((b) => b.name),
  );
}

export function offerMarkdown(D: Offer): string {
  const valTotal = offerValueTotal(D);
  let o = `# ${D.offerName || "Titanium Offer"}\n\n`;
  o += `**For:** ${D.who || "—"}  |  **Reach:** ${D.where || "—"}\n\n`;
  o += `**Dream outcome:** ${D.dream || "—"}\n**Bullseye emotion:** ${D.emotion || "—"}\n\n`;
  o += `## The Promise\n${D.trim || "—"}\n\n## Why it's this good (rationale)\n${D.rationale || "—"}\n\n`;
  const multi = D.ladders.length > 1;
  o += `## The Value Ladder\n`;
  D.ladders.forEach((L, i) => {
    if (multi) o += `### ${L.name || "Value Ladder " + (i + 1)}\n`;
    sortTiers(L.tiers).forEach((x) => {
      if (!stageHasContent(x)) return;
      const t = tierOf(x.price);
      o += `\n**${x.name || "Stage"}${x.pop ? " ⭐" : ""}** — ${x.price || "—"}${t ? ` _(${t.label})_` : ""}\n`;
      if (x.desc) o += `${x.desc}\n`;
      (x.deliverables || []).forEach((d) => {
        if (d.item) o += `- ${d.item} — ${money(d.val)}\n`;
      });
      (x.bonuses || []).forEach((b) => {
        if (b.name) o += `- 🎁 ${b.name} — ${money(b.val)} (${b.why || ""})\n`;
      });
      if (x.payment) o += `- 💳 ${x.payment}\n`;
    });
    const c = L.continuity;
    if (c && c.on && (c.name || c.price))
      o += `\n**Continuity 🔁:** ${c.name} — ${c.price} (${c.cycle}) — ${c.desc || ""}\n`;
    o += `\n`;
  });
  o += `**Total stacked value: ${money(valTotal)}**\n\n`;
  o += `## Price\nToday: **${money(D.realPrice)}** vs ${money(valTotal)} value.\n${D.anchorCompare || ""}\n\n`;
  o += `## Guarantee (${D.guaranteeType})\n${D.guaranteeResult || "—"} ${D.guaranteeWindow ? "(" + D.guaranteeWindow + ")" : ""}\nClient must prove: ${D.guaranteeProofReq || "—"}\nEdge: ${D.pgCompetitors || "—"}\nPayback: ${D.pgPayback || "—"}\nPlaced: ${D.pgWhere || "—"}\n\n`;
  o += `## Scarcity (${D.scarcityType}) / Urgency (${D.urgencyType})\n${D.scarcityDetail || "—"}\n\n`;
  o += `## Objections handled\n`;
  D.objections.forEach((x) => {
    if (x.o) o += `- **${x.o}** → ${x.r || ""}\n`;
  });
  o += `\n**Lead the offer — added:** ${D.leadAdd || "—"}\n\n`;
  o += `---\n_Value Equation score: ${valueScore(D.veq)} (dream ${D.veq.dream}, likelihood ${D.veq.likely}, time ${D.veq.time}, effort ${D.veq.effort})_\n`;
  return o;
}

export { stageHasContent };
