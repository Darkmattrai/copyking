// Pure, framework-agnostic builder that turns a user's raw saved data (Brand DNA
// JSON + Offer/ICP generation content) into the same categorised AnswerGroup[]
// the account page shows — but READ-ONLY (no inline editors). This lets the admin
// dashboard render and export any user's answers server- or client-side without
// touching that user's live Zustand stores.
//
// The account tab's useBrandDnaAnswers() hook is the editable counterpart for the
// *current* user; this builder is the read-only counterpart for *any* user.

import type { BrandDNA } from "@/types/brand";
import type { Offer } from "@/lib/offer/schema";
import type { EnhancementMap } from "@/lib/offer/store";
import type { Intake, SegmentInput } from "@/lib/icp/schema";
import { CHANNELS, TONES } from "@/lib/icp/schema";
import type {
  AnswerField,
  AnswerGroup,
  FieldKind,
} from "./brand-dna-answers";
import { icpBrandPsychologyGroups, hasBrandIcpSegments } from "./icp-groups";

export interface BuildAnswersInput {
  brandDNA?: BrandDNA | null;
  offer?: Offer | null;
  enhancements?: EnhancementMap | null;
  icpFormData?: Partial<Intake> | null;
  icpSegments?: SegmentInput[] | null;
}

const joinList = (a?: string[]) => (a ?? []).join("\n");

function labelFor(
  values: string[] | undefined,
  table: readonly { value: string; label: string }[],
): string {
  return (values ?? [])
    .map((v) => table.find((t) => t.value === v)?.label ?? v)
    .join(", ");
}

// Build every answer group, read-only, from raw data. Empty inputs simply yield
// fewer groups; callers filter to populated groups before display/export.
export function buildBrandDnaAnswerGroups(
  input: BuildAnswersInput,
): AnswerGroup[] {
  const groups: AnswerGroup[] = [];
  const enhancements = input.enhancements ?? {};

  // ── ICP (from the ICP Map intake) ────────────────────────────────────────
  const formData = input.icpFormData ?? {};
  const segments = input.icpSegments ?? [];
  const b = input.brandDNA;

  // Business overview — prefer the raw intake, fall back to the saved Brand DNA
  // so guided-chat clients (blank intake) still show their identity.
  const icpFields: AnswerField[] = [
    { id: "icp.businessName", feature: "ICP", question: "What's your business name?", value: formData.businessName || b?.icp.businessName || "", kind: "text" },
    { id: "icp.whatYouDo", feature: "ICP", question: "What do you do?", value: formData.whatYouDo || b?.niche.subNiche || "", kind: "textarea" },
    { id: "icp.industry", feature: "ICP", question: "What industry are you in?", value: formData.industry || b?.icp.industryLabel || "", kind: "text" },
    { id: "icp.region", feature: "ICP", question: "Region / market", value: b?.icp.regionLabel ?? "", kind: "readonly" },
    { id: "icp.offer", feature: "ICP", question: "What's your core offer?", value: formData.offer || b?.offer.grandSlamDescription || "", kind: "textarea" },
    { id: "icp.brandReference", feature: "ICP", question: "A brand you admire / want to feel like", value: formData.brandReference || b?.voice.brandPersona || "", kind: "text" },
    { id: "icp.socialProof", feature: "ICP", question: "Social proof (results, testimonials, numbers)", value: formData.socialProof || b?.offer.perceivedLikelihood || "", kind: "textarea" },
  ];
  const channels = formData.channels?.length ? formData.channels : b?.icp.platforms;
  if (channels?.length)
    icpFields.push({ id: "icp.channels", feature: "ICP", question: "Channels you reach them on", value: labelFor(channels, CHANNELS), kind: "readonly" });
  const tone = formData.tone?.length ? formData.tone : b?.voice.toneAttributes;
  if (tone?.length)
    icpFields.push({ id: "icp.tone", feature: "ICP", question: "Brand tone", value: labelFor(tone, TONES), kind: "readonly" });
  groups.push({ feature: "ICP", category: "Business & Audience", fields: icpFields });

  // The real psychology + segments live in the saved Brand DNA `icp` pillar.
  groups.push(...icpBrandPsychologyGroups(b));

  // Only fall back to the raw intake segments when Brand DNA has none (avoids
  // showing blank default "Audience Segment 1" rows next to the real ones).
  if (!hasBrandIcpSegments(b)) {
    segments.forEach((seg, idx) => {
      groups.push({
        feature: "ICP",
        category: `Audience Segment: ${seg.name || `Audience Segment ${idx + 1}`}`,
        fields: [
          { id: `icp.seg.${idx}.name`, feature: "ICP", question: "Audience segment name", value: seg.name ?? "", kind: "text" },
          { id: `icp.seg.${idx}.pain`, feature: "ICP", question: "Their biggest pain", value: seg.pain ?? "", kind: "textarea" },
          { id: `icp.seg.${idx}.goals`, feature: "ICP", question: "Their goals", value: seg.goals ?? "", kind: "textarea" },
          { id: `icp.seg.${idx}.mindset`, feature: "ICP", question: "Their mindset", value: seg.mindset ?? "", kind: "textarea" },
          { id: `icp.seg.${idx}.emotional`, feature: "ICP", question: "Emotional fingerprint", value: seg.emotional ?? "", kind: "textarea" },
          { id: `icp.seg.${idx}.objections`, feature: "ICP", question: "Their objections", value: seg.objections ?? "", kind: "textarea" },
          { id: `icp.seg.${idx}.triggers`, feature: "ICP", question: "Buying triggers", value: seg.triggers ?? "", kind: "textarea" },
        ],
      });
    });
  }

  // ── Offer (from the Offer Builder) ───────────────────────────────────────
  const offer = input.offer;
  if (offer) {
    if (offer.offerName)
      groups.push({
        feature: "Offer",
        category: "Offer — Overview",
        fields: [{ id: "offer.offerName", feature: "Offer", question: "Offer name (the whole ladder)", value: offer.offerName, kind: "text" }],
      });

    (offer.ladders ?? []).forEach((L) => {
      (L.products ?? []).forEach((P, pi) => {
        const label = P.name || `#${pi + 1}`;
        const prefix = `Product: ${label}`;

        const pText = (
          key: keyof typeof P & string,
          question: string,
          kind: FieldKind = "textarea",
        ): AnswerField => {
          const enh = enhancements[`${P.id}.${key}`];
          return {
            id: `offer.${P.id}.${key}`,
            feature: "Offer",
            question,
            value: String(P[key] ?? ""),
            original: enh?.original,
            enhanced: enh?.enhanced,
            kind,
          };
        };

        groups.push({
          feature: "Offer",
          category: `${prefix} · The Bullseye`,
          fields: [
            pText("name", "Product name", "text"),
            pText("price", "Ladder price", "text"),
            pText("who", "Who is this product's dream prospect?"),
            pText("where", "Where do you reach them?", "text"),
            pText("dream", "Dream outcome — what do they crave?"),
            pText("emotion", "The core emotion / pain (the bullseye)"),
            pText("bait", "The bait / hook that pulls them in", "text"),
          ],
        });

        groups.push({
          feature: "Offer",
          category: `${prefix} · Promise & Rationale`,
          fields: [
            pText("magic", "Magic-wand promise — the outrageous version"),
            pText("trim", "Trimmed promise — realistic & deliverable"),
            pText("rationale", "Why is this product so good?"),
            pText("desc", "One-line summary (shown on the product)"),
          ],
        });

        groups.push({
          feature: "Offer",
          category: `${prefix} · Value & Proof`,
          fields: [
            pText("priceProof", "Proof people paid full price"),
            pText("anchorCompare", "Make the real price sound trivial"),
            pText("realPrice", "The real price you'll charge ($)", "text"),
            pText("payment", "Payment note", "text"),
          ],
        });

        groups.push({
          feature: "Offer",
          category: `${prefix} · Guarantee`,
          fields: [
            { id: `offer.${P.id}.guaranteeType`, feature: "Offer", question: "Guarantee type", value: P.guaranteeType ?? "", kind: "readonly" },
            pText("guaranteeResult", "The specific result you guarantee"),
            pText("guaranteeWindow", "Timeframe / window", "text"),
            pText("guaranteeProofReq", "What the client must prove"),
            pText("pgCompetitors", "Competitor scan + your strength"),
            pText("pgPayback", "Your payback / plan B"),
            pText("pgWhere", "Where you'll put the guarantee"),
          ],
        });

        groups.push({
          feature: "Offer",
          category: `${prefix} · Scarcity & Urgency`,
          fields: [
            { id: `offer.${P.id}.scarcityType`, feature: "Offer", question: "Scarcity type", value: P.scarcityType ?? "", kind: "readonly" },
            { id: `offer.${P.id}.urgencyType`, feature: "Offer", question: "Urgency type", value: P.urgencyType ?? "", kind: "readonly" },
            pText("scarcityDetail", "The legit constraint (be honest)"),
          ],
        });

        groups.push({
          feature: "Offer",
          category: `${prefix} · Objections & Lead`,
          fields: [pText("leadAdd", "Lead the offer — what can you ADD?")],
        });

        const fbLines = (P.features ?? []).filter((r) => r.f || r.b).map((r) => `${r.f} → ${r.b}`);
        const psLines = (P.problems ?? []).filter((r) => r.p || r.s).map((r) => `${r.p} → ${r.s}`);
        const delivLines = (P.deliverables ?? []).filter((r) => r.item).map((r) => `${r.item}${r.val ? ` ($${r.val})` : ""}`);
        const bonusLines = (P.bonuses ?? []).filter((r) => r.name).map((r) => `${r.name}${r.val ? ` ($${r.val})` : ""}`);
        const objLines = (P.objections ?? []).filter((r) => r.o || r.r).map((r) => `${r.o} → ${r.r}`);

        const listFields: AnswerField[] = [];
        if (fbLines.length) listFields.push({ id: `offer.${P.id}.features`, feature: "Offer", question: "Features → benefits", value: fbLines.join("\n"), kind: "readonly" });
        if (psLines.length) listFields.push({ id: `offer.${P.id}.problems`, feature: "Offer", question: "Problems → solutions", value: psLines.join("\n"), kind: "readonly" });
        if (delivLines.length) listFields.push({ id: `offer.${P.id}.deliverables`, feature: "Offer", question: "Deliverables", value: delivLines.join("\n"), kind: "readonly" });
        if (bonusLines.length) listFields.push({ id: `offer.${P.id}.bonuses`, feature: "Offer", question: "Bonuses", value: bonusLines.join("\n"), kind: "readonly" });
        if (objLines.length) listFields.push({ id: `offer.${P.id}.objections`, feature: "Offer", question: "Objections → rebuttals", value: objLines.join("\n"), kind: "readonly" });
        if (listFields.length)
          groups.push({ feature: "Offer", category: `${prefix} · Stack & Lists`, fields: listFields });
      });
    });
  }

  // ── Brand DNA pillars (the deeper discovery beyond ICP & Offer) ───────────
  if (b) {
    groups.push({
      feature: "Brand DNA",
      category: "Niche & Market",
      fields: [
        { id: "brand.niche.marketCategory", feature: "Brand DNA", question: "Market category", value: b.niche.marketCategory, kind: "text" },
        { id: "brand.niche.subNiche", feature: "Brand DNA", question: "Sub-niche", value: b.niche.subNiche, kind: "text" },
        { id: "brand.niche.congregationPoints", feature: "Brand DNA", question: "Where they congregate", value: joinList(b.niche.congregationPoints), kind: "list" },
        { id: "brand.niche.purchasingPower", feature: "Brand DNA", question: "Purchasing power", value: b.niche.purchasingPower, kind: "readonly" },
        { id: "brand.niche.painLevel", feature: "Brand DNA", question: "Pain level", value: `${b.niche.painLevel}/10`, kind: "readonly" },
      ],
    });

    groups.push({
      feature: "Brand DNA",
      category: "Positioning",
      fields: [
        { id: "brand.pos.uniqueMechanism", feature: "Brand DNA", question: "Your unique mechanism", value: b.positioning.uniqueMechanism, kind: "textarea" },
        { id: "brand.pos.categoryOwned", feature: "Brand DNA", question: "Category you own", value: b.positioning.categoryOwned, kind: "text" },
        { id: "brand.pos.positioningStatement", feature: "Brand DNA", question: "Positioning statement", value: b.positioning.positioningStatement, kind: "textarea" },
        { id: "brand.pos.pointOfView", feature: "Brand DNA", question: "Your point of view", value: b.positioning.pointOfView, kind: "textarea" },
        ...(b.positioning.competitors.length
          ? [{ id: "brand.pos.competitors", feature: "Brand DNA" as const, question: "Competitors & how you differ", value: b.positioning.competitors.map((c) => `${c.name} — ${c.howYouDiffer}`).join("\n"), kind: "readonly" as const }]
          : []),
      ],
    });

    groups.push({
      feature: "Brand DNA",
      category: "Voice & Personality",
      fields: [
        { id: "brand.voice.primaryArchetype", feature: "Brand DNA", question: "Primary archetype", value: b.voice.primaryArchetype, kind: "text" },
        { id: "brand.voice.secondaryArchetype", feature: "Brand DNA", question: "Secondary archetype", value: b.voice.secondaryArchetype, kind: "text" },
        { id: "brand.voice.toneAttributes", feature: "Brand DNA", question: "Tone attributes", value: joinList(b.voice.toneAttributes), kind: "list" },
        { id: "brand.voice.brandPersona", feature: "Brand DNA", question: "Brand persona", value: b.voice.brandPersona, kind: "textarea" },
        { id: "brand.voice.alwaysWords", feature: "Brand DNA", question: "Words you always use", value: joinList(b.voice.alwaysWords), kind: "list" },
        { id: "brand.voice.neverWords", feature: "Brand DNA", question: "Words you never use", value: joinList(b.voice.neverWords), kind: "list" },
      ],
    });

    groups.push({
      feature: "Brand DNA",
      category: "Brand Story",
      fields: [
        { id: "brand.story.originStory", feature: "Brand DNA", question: "Origin story", value: b.story.originStory, kind: "textarea" },
        { id: "brand.story.transformationMoment", feature: "Brand DNA", question: "Transformation moment", value: b.story.transformationMoment, kind: "textarea" },
        { id: "brand.story.mission", feature: "Brand DNA", question: "Mission", value: b.story.mission, kind: "textarea" },
        { id: "brand.story.vision", feature: "Brand DNA", question: "Vision", value: b.story.vision, kind: "textarea" },
        { id: "brand.story.coreValues", feature: "Brand DNA", question: "Core values", value: joinList(b.story.coreValues), kind: "list" },
        { id: "brand.story.villain", feature: "Brand DNA", question: "The villain you fight", value: b.story.villain, kind: "textarea" },
      ],
    });

    groups.push({
      feature: "Brand DNA",
      category: "Messaging",
      fields: [
        { id: "brand.msg.oneLiner", feature: "Brand DNA", question: "One-liner", value: b.messaging.oneLiner, kind: "textarea" },
        { id: "brand.msg.tagline", feature: "Brand DNA", question: "Tagline", value: b.messaging.tagline, kind: "text" },
        { id: "brand.msg.keyMessages", feature: "Brand DNA", question: "Key messages", value: joinList(b.messaging.keyMessages), kind: "list" },
      ],
    });

    groups.push({
      feature: "Brand DNA",
      category: "Content DNA",
      fields: [
        { id: "brand.content.themes", feature: "Brand DNA", question: "Content themes", value: joinList(b.contentDNA.themes), kind: "list" },
        { id: "brand.content.hookStyles", feature: "Brand DNA", question: "Hook styles", value: joinList(b.contentDNA.hookStyles), kind: "list" },
        { id: "brand.content.storytellingPatterns", feature: "Brand DNA", question: "Storytelling patterns", value: joinList(b.contentDNA.storytellingPatterns), kind: "list" },
        { id: "brand.content.ctaStyle", feature: "Brand DNA", question: "CTA style", value: b.contentDNA.ctaStyle, kind: "text" },
        { id: "brand.content.cadence", feature: "Brand DNA", question: "Posting cadence", value: b.contentDNA.cadence, kind: "text" },
      ],
    });
  }

  return groups;
}

// Keep only groups that actually carry an answer (or an AI rewrite). Mirrors the
// account page's populatedGroups filter so display + export match.
export function populatedAnswerGroups(groups: AnswerGroup[]): AnswerGroup[] {
  return groups.filter((g) =>
    g.fields.some((f) => f.value.trim() || f.enhanced?.trim()),
  );
}

// Parse the raw `generations` content rows (icp-map + irresistible-offer) into
// the structured pieces the builder needs. Tolerant of malformed JSON.
export function parseGenerationContent(
  contentBySlug: Record<string, string | undefined | null>,
): Pick<BuildAnswersInput, "offer" | "enhancements" | "icpFormData" | "icpSegments"> {
  const out: Pick<
    BuildAnswersInput,
    "offer" | "enhancements" | "icpFormData" | "icpSegments"
  > = {};

  const offerRaw = contentBySlug["irresistible-offer"];
  if (offerRaw) {
    try {
      const parsed = JSON.parse(offerRaw);
      const o = parsed.offer ?? parsed;
      if (o && typeof o === "object") out.offer = o as Offer;
      if (parsed.enhancements) out.enhancements = parsed.enhancements as EnhancementMap;
    } catch {
      /* ignore malformed row */
    }
  }

  const icpRaw = contentBySlug["icp-map"];
  if (icpRaw) {
    try {
      const parsed = JSON.parse(icpRaw);
      if (parsed.formData) out.icpFormData = parsed.formData as Partial<Intake>;
      if (Array.isArray(parsed.segments)) out.icpSegments = parsed.segments as SegmentInput[];
    } catch {
      /* ignore malformed row */
    }
  }

  return out;
}
