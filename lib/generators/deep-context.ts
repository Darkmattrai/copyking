// Pulls the FULL ICP Map + Offer Builder data (saved as JSON in the
// `generations` table) and formats it as extra system-prompt context so every
// generator writes for the specific audience/offer, not a thin brand-DNA slice.

import { createClient } from "@/lib/supabase/server";
import type { GeneratedICP } from "@/lib/icp/schema";
import type { Offer } from "@/lib/offer/schema";
import { offerValueTotal, valueScore, money } from "@/lib/offer/schema";

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

function formatOffer(offer: Offer): string | null {
  if (!offer || (!offer.dream && !offer.offerName && !(offer.ladders?.length))) {
    return null;
  }

  const lines: string[] = [];
  lines.push(`## OFFER — ${offer.offerName || "(unnamed offer)"}`);

  lines.push(`### Core
- Who it's for: ${offer.who || "N/A"}
- Where they are: ${offer.where || "N/A"}
- Dream outcome: ${offer.dream || "N/A"}
- Emotional driver: ${offer.emotion || "N/A"}
- Lead magnet / bait: ${offer.bait || "N/A"}
- The "magic wand" promise: ${offer.magic || "N/A"}
- One-line offer: ${offer.trim || "N/A"}
- Rationale / reason to act: ${offer.rationale || "N/A"}`);

  if (offer.features?.length) {
    lines.push(`### Features → benefits
${offer.features.map((f) => `- ${f.f || "?"} → ${f.b || "?"}`).join("\n")}`);
  }

  if (offer.problems?.length) {
    lines.push(`### Problems → solutions
${offer.problems.map((p) => `- ${p.p || "?"} → ${p.s || "?"}`).join("\n")}`);
  }

  if (offer.ladders?.length) {
    const ladderText = offer.ladders
      .map((L) => {
        const tiers = (L.tiers ?? [])
          .map((t) => {
            const deliv = (t.deliverables ?? [])
              .map((d) => `${d.item}${d.val ? ` (${money(d.val)})` : ""}`)
              .filter(Boolean)
              .join(", ");
            const bonus = (t.bonuses ?? [])
              .map((b) => `${b.name}${b.val ? ` (${money(b.val)})` : ""}`)
              .filter(Boolean)
              .join(", ");
            return `  - ${t.name || "Tier"} — ${t.price || "?"}${t.pop ? " [most popular]" : ""}: ${t.desc || ""}${deliv ? `\n    Deliverables: ${deliv}` : ""}${bonus ? `\n    Bonuses: ${bonus}` : ""}${t.payment ? `\n    Payment: ${t.payment}` : ""}`;
          })
          .join("\n");
        const cont = L.continuity?.on
          ? `\n  - Continuity: ${L.continuity.name || ""} ${L.continuity.price || ""}/${L.continuity.cycle || ""} — ${L.continuity.desc || ""}`
          : "";
        return `Ladder: ${L.name || "Value Ladder"}\n${tiers}${cont}`;
      })
      .join("\n\n");
    lines.push(`### Value ladder & pricing\n${ladderText}`);
  }

  const valTotal = offerValueTotal(offer);
  if (valTotal > 0 || offer.realPrice) {
    lines.push(`### Value & proof
- Total stacked value: ${valTotal ? money(valTotal) : "N/A"}
- Real price: ${offer.realPrice || "N/A"}
- Price justification: ${offer.priceProof || "N/A"}
- Anchor comparison: ${offer.anchorCompare || "N/A"}
- Proof points: ${offer.proofShots?.filter(Boolean).join("; ") || "N/A"}
- Value-equation score: ${offer.veq ? valueScore(offer.veq) : "N/A"} (dream ${offer.veq?.dream ?? "?"}, likelihood ${offer.veq?.likely ?? "?"}, time ${offer.veq?.time ?? "?"}, effort ${offer.veq?.effort ?? "?"})`);
  }

  if (offer.guaranteeType || offer.guaranteeResult) {
    lines.push(`### Guarantee
- Type: ${offer.guaranteeType || "N/A"}
- Promise: ${offer.guaranteeResult || "N/A"}
- Window: ${offer.guaranteeWindow || "N/A"}
- Proof required: ${offer.guaranteeProofReq || "N/A"}`);
  }

  if (offer.scarcityType || offer.urgencyType || offer.scarcityDetail) {
    lines.push(`### Scarcity & urgency
- Scarcity: ${offer.scarcityType || "N/A"}
- Urgency: ${offer.urgencyType || "N/A"}
- Detail: ${offer.scarcityDetail || "N/A"}`);
  }

  if (offer.objections?.length) {
    lines.push(`### Objections → responses
${offer.objections.map((o) => `- ${o.o || "?"} → ${o.r || "?"}`).join("\n")}`);
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
      const block = formatOffer(parsed as Offer);
      if (block) blocks.push(block);
    }
  }

  return blocks.length > 0
    ? `\n\n# AUDIENCE & OFFER DETAIL\n\nUse this rich ICP Map and Offer detail to tailor everything you write to this exact audience and offer.\n\n${blocks.join("\n\n")}`
    : "";
}
