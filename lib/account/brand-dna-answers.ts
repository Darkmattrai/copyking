"use client";

import { useMemo } from "react";

import { useBrandStore } from "@/lib/brand/store";
import { useOfferDraftStore } from "@/lib/offer/store";
import { useIcpDraftStore } from "@/lib/icp/store";
import { CHANNELS, TONES } from "@/lib/icp/schema";

// A single feature/tool an answer belongs to (shown as a tag in the UI).
export type FeatureTag = "ICP" | "Offer" | "Brand DNA";

// "list" fields edit a newline-separated list; "readonly" fields are shown but
// not inline-editable (derived/AI-generated/complex values).
export type FieldKind = "text" | "textarea" | "list" | "readonly";

export interface AnswerField {
  id: string;
  feature: FeatureTag;
  question: string;
  value: string;
  // When the answer was improved with "✨ Enhance with AI", we keep the text
  // the user originally wrote and the AI rewrite so both can be shown.
  original?: string;
  enhanced?: string;
  kind: FieldKind;
  onChange?: (v: string) => void;
}

export interface AnswerGroup {
  feature: FeatureTag;
  category: string;
  fields: AnswerField[];
}

const joinList = (a?: string[]) => (a ?? []).join("\n");
const splitList = (v: string) =>
  v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

function labelFor(
  values: string[] | undefined,
  table: readonly { value: string; label: string }[],
): string {
  return (values ?? [])
    .map((v) => table.find((t) => t.value === v)?.label ?? v)
    .join(", ");
}

/**
 * Aggregates every answer a user has entered across the ICP Map, the Offer
 * Builder, and their Brand DNA pillars into categorised groups for the account
 * "Brand DNA" tab. Editable fields write straight back to the source store.
 */
export function useBrandDnaAnswers(): AnswerGroup[] {
  const brandDNA = useBrandStore((s) => s.brandDNA);
  const updatePillar = useBrandStore((s) => s.updatePillar);

  const offer = useOfferDraftStore((s) => s.offer);
  const enhancements = useOfferDraftStore((s) => s.enhancements);
  const updateProduct = useOfferDraftStore((s) => s.updateProduct);

  const formData = useIcpDraftStore((s) => s.formData);
  const segments = useIcpDraftStore((s) => s.segments);
  const setFormData = useIcpDraftStore((s) => s.setFormData);
  const setSegments = useIcpDraftStore((s) => s.setSegments);

  return useMemo<AnswerGroup[]>(() => {
    const groups: AnswerGroup[] = [];

    // ── ICP (from the ICP Map intake the user filled in) ──────────────────
    const icpFields: AnswerField[] = [
      {
        id: "icp.businessName",
        feature: "ICP",
        question: "What's your business name?",
        value: formData.businessName ?? "",
        kind: "text",
        onChange: (v) => setFormData({ businessName: v }),
      },
      {
        id: "icp.whatYouDo",
        feature: "ICP",
        question: "What do you do?",
        value: formData.whatYouDo ?? "",
        kind: "textarea",
        onChange: (v) => setFormData({ whatYouDo: v }),
      },
      {
        id: "icp.industry",
        feature: "ICP",
        question: "What industry are you in?",
        value: formData.industry ?? "",
        kind: "text",
        onChange: (v) => setFormData({ industry: v }),
      },
      {
        id: "icp.offer",
        feature: "ICP",
        question: "What's your core offer?",
        value: formData.offer ?? "",
        kind: "textarea",
        onChange: (v) => setFormData({ offer: v }),
      },
      {
        id: "icp.brandReference",
        feature: "ICP",
        question: "A brand you admire / want to feel like",
        value: formData.brandReference ?? "",
        kind: "text",
        onChange: (v) => setFormData({ brandReference: v }),
      },
      {
        id: "icp.socialProof",
        feature: "ICP",
        question: "Social proof (results, testimonials, numbers)",
        value: formData.socialProof ?? "",
        kind: "textarea",
        onChange: (v) => setFormData({ socialProof: v }),
      },
    ];
    if (formData.channels?.length)
      icpFields.push({
        id: "icp.channels",
        feature: "ICP",
        question: "Channels you reach them on",
        value: labelFor(formData.channels, CHANNELS),
        kind: "readonly",
      });
    if (formData.tone?.length)
      icpFields.push({
        id: "icp.tone",
        feature: "ICP",
        question: "Brand tone",
        value: labelFor(formData.tone, TONES),
        kind: "readonly",
      });
    groups.push({ feature: "ICP", category: "Business & Audience", fields: icpFields });

    // One group per audience segment the user described.
    segments.forEach((seg, idx) => {
      const set = (key: keyof typeof seg, v: string) =>
        setSegments(segments.map((s, i) => (i === idx ? { ...s, [key]: v } : s)));
      groups.push({
        feature: "ICP",
        category: `Audience Segment: ${seg.name || `Audience Segment ${idx + 1}`}`,
        fields: [
          {
            id: `icp.seg.${idx}.name`,
            feature: "ICP",
            question: "Audience segment name",
            value: seg.name,
            kind: "text",
            onChange: (v) => set("name", v),
          },
          {
            id: `icp.seg.${idx}.pain`,
            feature: "ICP",
            question: "Their biggest pain",
            value: seg.pain,
            kind: "textarea",
            onChange: (v) => set("pain", v),
          },
          {
            id: `icp.seg.${idx}.goals`,
            feature: "ICP",
            question: "Their goals",
            value: seg.goals,
            kind: "textarea",
            onChange: (v) => set("goals", v),
          },
          {
            id: `icp.seg.${idx}.mindset`,
            feature: "ICP",
            question: "Their mindset",
            value: seg.mindset,
            kind: "textarea",
            onChange: (v) => set("mindset", v),
          },
          {
            id: `icp.seg.${idx}.emotional`,
            feature: "ICP",
            question: "Emotional fingerprint",
            value: seg.emotional,
            kind: "textarea",
            onChange: (v) => set("emotional", v),
          },
          {
            id: `icp.seg.${idx}.objections`,
            feature: "ICP",
            question: "Their objections",
            value: seg.objections,
            kind: "textarea",
            onChange: (v) => set("objections", v),
          },
          {
            id: `icp.seg.${idx}.triggers`,
            feature: "ICP",
            question: "Buying triggers",
            value: seg.triggers,
            kind: "textarea",
            onChange: (v) => set("triggers", v),
          },
        ],
      });
    });

    // ── Offer (from the Offer Builder) ────────────────────────────────────
    // The offer is a value ladder of self-contained products. Each product's
    // scalar fields can carry an AI-enhanced version (keyed `${productId}.field`)
    // recorded when the user clicked "✨ Enhance with AI".
    if (offer.offerName)
      groups.push({
        feature: "Offer",
        category: "Offer — Overview",
        fields: [
          {
            id: "offer.offerName",
            feature: "Offer",
            question: "Offer name (the whole ladder)",
            value: offer.offerName,
            kind: "text",
          },
        ],
      });

    offer.ladders.forEach((L, li) => {
      L.products.forEach((P, pi) => {
        const label = P.name || `Rung ${pi + 1}`;
        const prefix = `Product: ${label}`;
        const setP = (key: keyof typeof P, v: string) =>
          updateProduct(li, pi, { [key]: v });

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
            onChange: (v) => setP(key, v),
          };
        };

        groups.push({
          feature: "Offer",
          category: `${prefix} · The Bullseye`,
          fields: [
            pText("name", "Product / rung name", "text"),
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
            pText("desc", "One-line summary (shown on the rung)"),
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

        // Lists are shown read-only (edited in the builder itself).
        const fbLines = (P.features ?? [])
          .filter((r) => r.f || r.b)
          .map((r) => `${r.f} → ${r.b}`);
        const psLines = (P.problems ?? [])
          .filter((r) => r.p || r.s)
          .map((r) => `${r.p} → ${r.s}`);
        const delivLines = (P.deliverables ?? [])
          .filter((r) => r.item)
          .map((r) => `${r.item}${r.val ? ` ($${r.val})` : ""}`);
        const bonusLines = (P.bonuses ?? [])
          .filter((r) => r.name)
          .map((r) => `${r.name}${r.val ? ` ($${r.val})` : ""}`);
        const objLines = (P.objections ?? [])
          .filter((r) => r.o || r.r)
          .map((r) => `${r.o} → ${r.r}`);

        const listFields: AnswerField[] = [];
        if (fbLines.length)
          listFields.push({ id: `offer.${P.id}.features`, feature: "Offer", question: "Features → benefits", value: fbLines.join("\n"), kind: "readonly" });
        if (psLines.length)
          listFields.push({ id: `offer.${P.id}.problems`, feature: "Offer", question: "Problems → solutions", value: psLines.join("\n"), kind: "readonly" });
        if (delivLines.length)
          listFields.push({ id: `offer.${P.id}.deliverables`, feature: "Offer", question: "Deliverables", value: delivLines.join("\n"), kind: "readonly" });
        if (bonusLines.length)
          listFields.push({ id: `offer.${P.id}.bonuses`, feature: "Offer", question: "Bonuses", value: bonusLines.join("\n"), kind: "readonly" });
        if (objLines.length)
          listFields.push({ id: `offer.${P.id}.objections`, feature: "Offer", question: "Objections → rebuttals", value: objLines.join("\n"), kind: "readonly" });
        if (listFields.length)
          groups.push({
            feature: "Offer",
            category: `${prefix} · Stack & Lists`,
            fields: listFields,
          });
      });
    });

    // ── Brand DNA pillars (the deeper discovery; ICP & Offer have their own
    // tools above, so we surface the remaining six pillars here) ───────────
    const b = brandDNA;

    groups.push({
      feature: "Brand DNA",
      category: "Niche & Market",
      fields: [
        { id: "brand.niche.marketCategory", feature: "Brand DNA", question: "Market category", value: b.niche.marketCategory, kind: "text", onChange: (v) => updatePillar("niche", { marketCategory: v }) },
        { id: "brand.niche.subNiche", feature: "Brand DNA", question: "Sub-niche", value: b.niche.subNiche, kind: "text", onChange: (v) => updatePillar("niche", { subNiche: v }) },
        { id: "brand.niche.congregationPoints", feature: "Brand DNA", question: "Where they congregate", value: joinList(b.niche.congregationPoints), kind: "list", onChange: (v) => updatePillar("niche", { congregationPoints: splitList(v) }) },
        { id: "brand.niche.purchasingPower", feature: "Brand DNA", question: "Purchasing power", value: b.niche.purchasingPower, kind: "readonly" },
        { id: "brand.niche.painLevel", feature: "Brand DNA", question: "Pain level", value: `${b.niche.painLevel}/10`, kind: "readonly" },
      ],
    });

    groups.push({
      feature: "Brand DNA",
      category: "Positioning",
      fields: [
        { id: "brand.pos.uniqueMechanism", feature: "Brand DNA", question: "Your unique mechanism", value: b.positioning.uniqueMechanism, kind: "textarea", onChange: (v) => updatePillar("positioning", { uniqueMechanism: v }) },
        { id: "brand.pos.categoryOwned", feature: "Brand DNA", question: "Category you own", value: b.positioning.categoryOwned, kind: "text", onChange: (v) => updatePillar("positioning", { categoryOwned: v }) },
        { id: "brand.pos.positioningStatement", feature: "Brand DNA", question: "Positioning statement", value: b.positioning.positioningStatement, kind: "textarea", onChange: (v) => updatePillar("positioning", { positioningStatement: v }) },
        { id: "brand.pos.pointOfView", feature: "Brand DNA", question: "Your point of view", value: b.positioning.pointOfView, kind: "textarea", onChange: (v) => updatePillar("positioning", { pointOfView: v }) },
        ...(b.positioning.competitors.length
          ? [{ id: "brand.pos.competitors", feature: "Brand DNA" as const, question: "Competitors & how you differ", value: b.positioning.competitors.map((c) => `${c.name} — ${c.howYouDiffer}`).join("\n"), kind: "readonly" as const }]
          : []),
      ],
    });

    groups.push({
      feature: "Brand DNA",
      category: "Voice & Personality",
      fields: [
        { id: "brand.voice.primaryArchetype", feature: "Brand DNA", question: "Primary archetype", value: b.voice.primaryArchetype, kind: "text", onChange: (v) => updatePillar("voice", { primaryArchetype: v }) },
        { id: "brand.voice.secondaryArchetype", feature: "Brand DNA", question: "Secondary archetype", value: b.voice.secondaryArchetype, kind: "text", onChange: (v) => updatePillar("voice", { secondaryArchetype: v }) },
        { id: "brand.voice.toneAttributes", feature: "Brand DNA", question: "Tone attributes", value: joinList(b.voice.toneAttributes), kind: "list", onChange: (v) => updatePillar("voice", { toneAttributes: splitList(v) }) },
        { id: "brand.voice.brandPersona", feature: "Brand DNA", question: "Brand persona", value: b.voice.brandPersona, kind: "textarea", onChange: (v) => updatePillar("voice", { brandPersona: v }) },
        { id: "brand.voice.alwaysWords", feature: "Brand DNA", question: "Words you always use", value: joinList(b.voice.alwaysWords), kind: "list", onChange: (v) => updatePillar("voice", { alwaysWords: splitList(v) }) },
        { id: "brand.voice.neverWords", feature: "Brand DNA", question: "Words you never use", value: joinList(b.voice.neverWords), kind: "list", onChange: (v) => updatePillar("voice", { neverWords: splitList(v) }) },
      ],
    });

    groups.push({
      feature: "Brand DNA",
      category: "Brand Story",
      fields: [
        { id: "brand.story.originStory", feature: "Brand DNA", question: "Origin story", value: b.story.originStory, kind: "textarea", onChange: (v) => updatePillar("story", { originStory: v }) },
        { id: "brand.story.transformationMoment", feature: "Brand DNA", question: "Transformation moment", value: b.story.transformationMoment, kind: "textarea", onChange: (v) => updatePillar("story", { transformationMoment: v }) },
        { id: "brand.story.mission", feature: "Brand DNA", question: "Mission", value: b.story.mission, kind: "textarea", onChange: (v) => updatePillar("story", { mission: v }) },
        { id: "brand.story.vision", feature: "Brand DNA", question: "Vision", value: b.story.vision, kind: "textarea", onChange: (v) => updatePillar("story", { vision: v }) },
        { id: "brand.story.coreValues", feature: "Brand DNA", question: "Core values", value: joinList(b.story.coreValues), kind: "list", onChange: (v) => updatePillar("story", { coreValues: splitList(v) }) },
        { id: "brand.story.villain", feature: "Brand DNA", question: "The villain you fight", value: b.story.villain, kind: "textarea", onChange: (v) => updatePillar("story", { villain: v }) },
      ],
    });

    groups.push({
      feature: "Brand DNA",
      category: "Messaging",
      fields: [
        { id: "brand.msg.oneLiner", feature: "Brand DNA", question: "One-liner", value: b.messaging.oneLiner, kind: "textarea", onChange: (v) => updatePillar("messaging", { oneLiner: v }) },
        { id: "brand.msg.tagline", feature: "Brand DNA", question: "Tagline", value: b.messaging.tagline, kind: "text", onChange: (v) => updatePillar("messaging", { tagline: v }) },
        { id: "brand.msg.keyMessages", feature: "Brand DNA", question: "Key messages", value: joinList(b.messaging.keyMessages), kind: "list", onChange: (v) => updatePillar("messaging", { keyMessages: splitList(v) }) },
      ],
    });

    groups.push({
      feature: "Brand DNA",
      category: "Content DNA",
      fields: [
        { id: "brand.content.themes", feature: "Brand DNA", question: "Content themes", value: joinList(b.contentDNA.themes), kind: "list", onChange: (v) => updatePillar("contentDNA", { themes: splitList(v) }) },
        { id: "brand.content.hookStyles", feature: "Brand DNA", question: "Hook styles", value: joinList(b.contentDNA.hookStyles), kind: "list", onChange: (v) => updatePillar("contentDNA", { hookStyles: splitList(v) }) },
        { id: "brand.content.storytellingPatterns", feature: "Brand DNA", question: "Storytelling patterns", value: joinList(b.contentDNA.storytellingPatterns), kind: "list", onChange: (v) => updatePillar("contentDNA", { storytellingPatterns: splitList(v) }) },
        { id: "brand.content.ctaStyle", feature: "Brand DNA", question: "CTA style", value: b.contentDNA.ctaStyle, kind: "text", onChange: (v) => updatePillar("contentDNA", { ctaStyle: v }) },
        { id: "brand.content.cadence", feature: "Brand DNA", question: "Posting cadence", value: b.contentDNA.cadence, kind: "text", onChange: (v) => updatePillar("contentDNA", { cadence: v }) },
      ],
    });

    return groups;
  }, [
    brandDNA,
    updatePillar,
    offer,
    enhancements,
    updateProduct,
    formData,
    segments,
    setFormData,
    setSegments,
  ]);
}
