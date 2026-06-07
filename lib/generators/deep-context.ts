// Pulls the FULL ICP Map + Offer Builder data (saved as JSON in the
// `generations` table) and formats it as extra system-prompt context so every
// generator writes for the specific audience/offer, not a thin brand-DNA slice.

import { createClient } from "@/lib/supabase/server";
import type { GeneratedICP } from "@/lib/icp/schema";
import type { Offer, Product } from "@/lib/offer/schema";
import {
  stageValue,
  valueScore,
  money,
  offerValueTotal,
  sortProducts,
} from "@/lib/offer/schema";
import { migrateOffer } from "@/lib/offer/migrate";

interface IcpMapSave {
  formData?: {
    businessName?: string;
    whatYouDo?: string;
    industry?: string;
    offer?: string;
    channels?: string[];
    tone?: string[];
    socialProof?: string;
  };
  result?: GeneratedICP | null;
}

function formatIcpMap(save: IcpMapSave): string | null {
  const icp = save.result;
  if (!icp) return null;

  const lines: string[] = [];
  lines.push(`## ICP MAP — ${icp.businessName} (${icp.industryLabel}, ${icp.regionLabel})`);

  const u = icp.universal;
  if (u) {
    lines.push(`### Universal audience truths
- Top challenges: ${u.painChallenge?.join("; ") || "N/A"}
- What keeps them up at night: ${u.painNight?.join("; ") || "N/A"}
- What they've already tried: ${u.painTried?.join("; ") || "N/A"}
- Goals: ${u.goals?.join("; ") || "N/A"}
- Emotional fingerprint: ${u.emotionalFingerprint || "N/A"}
- Buying triggers: ${u.triggers?.join("; ") || "N/A"}
- Objections: ${u.objections?.join("; ") || "N/A"}
- Hesitations: ${u.hesitations?.join("; ") || "N/A"}`);
  }

  for (const seg of icp.segments ?? []) {
    const it = seg.intensity;
    lines.push(`### Segment: ${seg.name} — ${seg.oneLine}
- Pain: ${seg.pain?.join("; ") || "N/A"}
- Goals: ${seg.goals?.join("; ") || "N/A"}
- Mindset: ${seg.mindset?.join("; ") || "N/A"}
- Objections: ${seg.objections?.join("; ") || "N/A"}
- Triggers: ${seg.triggers?.join("; ") || "N/A"}
- Intensity — pain ${it?.painIntensity ?? "?"}, goal clarity ${it?.goalClarity ?? "?"}, urgency ${it?.buyingUrgency ?? "?"}, price sensitivity ${it?.priceSensitivity ?? "?"}, skepticism ${it?.skepticism ?? "?"} (0–100)`);
  }

  return lines.join("\n\n");
}

function formatProduct(p: Product, idx: number): string {
  const lines: string[] = [];
  lines.push(`#### Product ${idx + 1}: ${p.name || "(unnamed product)"}${p.pop ? " [most popular]" : ""} — ${p.price || "price N/A"}`);

  lines.push(`- One-liner: ${p.desc || "N/A"}
- Who it's for: ${p.who || "N/A"}
- Where they are: ${p.where || "N/A"}
- Dream outcome: ${p.dream || "N/A"}
- Emotional driver: ${p.emotion || "N/A"}
- Lead magnet / bait: ${p.bait || "N/A"}
- The "magic wand" promise: ${p.magic || "N/A"}
- One-line promise: ${p.trim || "N/A"}
- Rationale / reason to act: ${p.rationale || "N/A"}`);

  if (p.features?.length) {
    lines.push(`Features → benefits:
${p.features.map((f) => `  - ${f.f || "?"} → ${f.b || "?"}`).join("\n")}`);
  }

  if (p.problems?.length) {
    lines.push(`Problems → solutions:
${p.problems.map((x) => `  - ${x.p || "?"} → ${x.s || "?"}`).join("\n")}`);
  }

  const deliv = (p.deliverables ?? [])
    .filter((d) => d.item)
    .map((d) => `  - ${d.item}${d.val ? ` (${money(d.val)})` : ""}`)
    .join("\n");
  if (deliv) lines.push(`Deliverables:\n${deliv}`);

  const bonus = (p.bonuses ?? [])
    .filter((b) => b.name)
    .map((b) => `  - ${b.name}${b.val ? ` (${money(b.val)})` : ""}${b.why ? ` — ${b.why}` : ""}`)
    .join("\n");
  if (bonus) lines.push(`Bonuses:\n${bonus}`);

  const sv = stageValue(p);
  if (sv > 0 || p.realPrice) {
    lines.push(`Value & proof:
- Stacked value: ${sv ? money(sv) : "N/A"}
- Real price: ${p.realPrice || "N/A"}
- Price justification: ${p.priceProof || "N/A"}
- Anchor comparison: ${p.anchorCompare || "N/A"}
- Proof points: ${p.proofShots?.filter(Boolean).join("; ") || "N/A"}
- Value-equation score: ${p.veq ? valueScore(p.veq) : "N/A"} (dream ${p.veq?.dream ?? "?"}, likelihood ${p.veq?.likely ?? "?"}, time ${p.veq?.time ?? "?"}, effort ${p.veq?.effort ?? "?"})`);
  }

  if (p.guaranteeType || p.guaranteeResult) {
    lines.push(`Guarantee:
- Type: ${p.guaranteeType || "N/A"}
- Promise: ${p.guaranteeResult || "N/A"}
- Window: ${p.guaranteeWindow || "N/A"}
- Proof required: ${p.guaranteeProofReq || "N/A"}`);
  }

  if (p.scarcityType || p.urgencyType || p.scarcityDetail) {
    lines.push(`Scarcity & urgency:
- Scarcity: ${p.scarcityType || "N/A"}
- Urgency: ${p.urgencyType || "N/A"}
- Detail: ${p.scarcityDetail || "N/A"}`);
  }

  if (p.objections?.length) {
    lines.push(`Objections → responses:
${p.objections.map((o) => `  - ${o.o || "?"} → ${o.r || "?"}`).join("\n")}`);
  }

  if (p.payment) lines.push(`Payment: ${p.payment}`);

  return lines.join("\n");
}

function formatOffer(offer: Offer): string | null {
  if (!offer || !offer.ladders?.length) return null;

  const products = offer.ladders.flatMap((L) => L.products ?? []);
  if (!offer.offerName && !products.length) return null;

  const lines: string[] = [];
  lines.push(`## OFFER — ${offer.offerName || "(unnamed offer)"}`);
  lines.push(
    `The offer is built as a value ladder: an ordered set of standalone products that ascend in value/price. Each product is its own complete offer with its own avatar, value stack, guarantee, scarcity and proof.`,
  );

  for (const L of offer.ladders) {
    const ladderLines: string[] = [];
    ladderLines.push(`### Value ladder: ${L.name || "Value Ladder"}`);
    sortProducts(L.products ?? []).forEach((p, i) => {
      ladderLines.push(formatProduct(p, i));
    });
    if (L.continuity?.on) {
      ladderLines.push(
        `#### Continuity: ${L.continuity.name || ""} — ${L.continuity.price || ""}/${L.continuity.cycle || ""}${L.continuity.desc ? ` — ${L.continuity.desc}` : ""}`,
      );
    }
    lines.push(ladderLines.join("\n\n"));
  }

  const valTotal = offerValueTotal(offer);
  if (valTotal > 0) {
    lines.push(`### Total stacked value across the ladder: ${money(valTotal)}`);
  }

  return lines.join("\n\n");
}

// Reads the authenticated user's saved ICP Map + Offer JSON and returns a
// formatted context block (empty string if neither exists or no session).
export async function buildDeepContext(): Promise<string> {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return "";
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "";

  const { data, error } = await supabase
    .from("generations")
    .select("slug, content")
    .eq("user_id", user.id)
    .in("slug", ["icp-map", "irresistible-offer"]);

  if (error || !data?.length) return "";

  const blocks: string[] = [];

  for (const row of data) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(row.content as string);
    } catch {
      continue;
    }

    if (row.slug === "icp-map") {
      const block = formatIcpMap(parsed as IcpMapSave);
      if (block) blocks.push(block);
    } else if (row.slug === "irresistible-offer") {
      // Newer saves wrap the offer as { offer, enhancements }; older saves are
      // the bare (possibly pre-ladder) Offer object. migrateOffer normalizes
      // both into the current ladder-of-products shape.
      const raw = (parsed as { offer?: unknown }).offer ?? parsed;
      const block = formatOffer(migrateOffer(raw));
      if (block) blocks.push(block);
    }
  }

  return blocks.length > 0
    ? `\n\n# AUDIENCE & OFFER DETAIL\n\nUse this rich ICP Map and Offer detail to tailor everything you write to this exact audience and offer.\n\n${blocks.join("\n\n")}`
    : "";
}
