import type { Offer as BrandOffer, ICP, ICPSegment } from "@/types/brand";
import { CHANNELS } from "@/lib/icp/schema";
import type {
  Offer as BuilderOffer,
  Product,
  Deliverable,
  Bonus,
  Pillar,
  ResultMap,
} from "./schema";
import {
  stageValue,
  money,
  resultMapHasContent,
  GUARANTEE_TYPES,
  SCARCITY_TYPES,
} from "./schema";

// The "flagship" product is the one marked ⭐ most-popular, else the first product
// of the first ladder. It's what we sync with the Brand DNA `offer` pillar.
export function flagshipProduct(offer: BuilderOffer): Product | null {
  for (const L of offer.ladders) {
    const star = L.products.find((p) => p.pop);
    if (star) return star;
  }
  return offer.ladders[0]?.products[0] ?? null;
}

// Seed a fresh flagship product from the saved Brand DNA `offer` pillar.
export function brandToProduct(brand: BrandOffer): Partial<Product> {
  const seed: Partial<Product> = {};
  if (brand.dreamOutcome) seed.dream = brand.dreamOutcome;
  if (brand.grandSlamDescription) seed.trim = brand.grandSlamDescription;
  if (brand.pricePoint) {
    const num = brand.pricePoint.replace(/[^0-9.]/g, "");
    if (num) seed.realPrice = num;
  }
  return seed;
}

// ─── ICP segments → product bullseye ───────────────────────────────────────────
//
// Map one or more chosen ICP-map audience segments onto a product's bullseye so
// the lead doesn't re-answer who/where/dream/emotion/bait, and record the links
// so copy generation can refer back to those segments. With multiple segments
// the bullseye is the merged union of all of them (the linked profiles are the
// source of truth). With none, only the links are cleared — the typed bullseye
// text is left intact (nothing to overwrite it with).

const channelLabels = (vals: string[] | undefined): string =>
  (vals ?? [])
    .map((v) => CHANNELS.find((c) => c.value === v)?.label ?? v)
    .join(", ");

const uniq = (arr: string[]): string[] =>
  Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));

export function icpSegmentsToProduct(
  segments: ICPSegment[],
  icp: ICP,
): Partial<Product> {
  const refs = uniq(segments.map((s) => s.name));
  if (!segments.length) return { icpSegmentRefs: refs };

  const patch: Partial<Product> = {
    icpSegmentRefs: refs,
    who: uniq(segments.map((s) => s.oneLine || s.name)).join("; "),
    dream: uniq(segments.flatMap((s) => s.goals ?? [])).join("; "),
    emotion: uniq(segments.flatMap((s) => s.pain ?? [])).join("; "),
    bait: uniq(segments.flatMap((s) => s.triggers ?? [])).join("; "),
  };
  // Channels live on the ICP as a whole, not per-segment. Only set "where" when
  // there are channels, so picking a profile never blanks an existing value.
  const where = channelLabels(icp.platforms);
  if (where) patch.where = where;
  return patch;
}

// ─── Guided-chat <OFFER_READY> payload mapping ─────────────────────────────────
//
// The guided-chat strategist emits a JSON blob inside <OFFER_READY>…</OFFER_READY>.
// These helpers translate that loose, model-authored shape into the strict
// builder types (Partial<Product>) and the Brand DNA `icp` pillar, coercing
// numbers to strings and validating the enum fields against the allowed sets.

type ChatDeliverable = { item?: unknown; val?: unknown };
type ChatBonus = { name?: unknown; val?: unknown; why?: unknown };
type ChatPillar = {
  name?: unknown;
  promise?: unknown;
  deliverables?: unknown;
  bonuses?: unknown;
};

export type ChatOfferPayload = {
  offerName?: unknown;
  product?: Record<string, unknown>;
  icp?: Record<string, unknown>;
};

const str = (v: unknown): string =>
  v == null ? "" : typeof v === "string" ? v : String(v);

// Strip "$", commas and spaces so "$4,000" → "4000"; leaves "" when not numeric.
const numStr = (v: unknown): string => {
  const s = str(v).replace(/[^0-9.]/g, "");
  return s;
};

const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(str).filter((s) => s.trim().length > 0) : [];

const mapDeliverables = (v: unknown): Deliverable[] =>
  Array.isArray(v)
    ? v.map((d) => {
        const x = (d ?? {}) as ChatDeliverable;
        return { item: str(x.item), val: numStr(x.val) };
      })
    : [];

const mapBonuses = (v: unknown): Bonus[] =>
  Array.isArray(v)
    ? v.map((b) => {
        const x = (b ?? {}) as ChatBonus;
        return { name: str(x.name), val: numStr(x.val), why: str(x.why) };
      })
    : [];

type ChatCore = { result?: unknown; splinters?: unknown };

const mapResultMap = (v: unknown): ResultMap => {
  const o = (v ?? {}) as { ultimate?: unknown; cores?: unknown };
  const cores = Array.isArray(o.cores)
    ? o.cores.map((c) => {
        const x = (c ?? {}) as ChatCore;
        return { result: str(x.result), splinters: strArray(x.splinters) };
      })
    : [];
  return { ultimate: str(o.ultimate), cores };
};

const mapPillars = (v: unknown): Pillar[] =>
  Array.isArray(v)
    ? v.map((pl) => {
        const x = (pl ?? {}) as ChatPillar;
        return {
          name: str(x.name),
          promise: str(x.promise),
          deliverables: mapDeliverables(x.deliverables),
          bonuses: mapBonuses(x.bonuses),
        };
      })
    : [];

// Keep an enum value only if it's in the allowed set; otherwise drop it so the
// product keeps its seeded default rather than an invalid string.
const pickEnum = (v: unknown, allowed: readonly string[]): string | undefined => {
  const s = str(v);
  return allowed.includes(s) ? s : undefined;
};

// Translate the chat's `product` object into a Partial<Product> ready to merge
// onto the flagship via updateProduct. Only sets fields the model provided.
export function chatOfferToProduct(
  raw: Record<string, unknown> | undefined,
): Partial<Product> {
  if (!raw) return {};
  const p: Partial<Product> = {};

  const setStr = (key: keyof Product, v: unknown) => {
    const s = str(v).trim();
    if (s) (p[key] as string) = s;
  };

  setStr("name", raw.name);
  setStr("price", raw.price);
  setStr("who", raw.who);
  setStr("where", raw.where);
  setStr("dream", raw.dream);
  setStr("emotion", raw.emotion);
  setStr("bait", raw.bait);
  setStr("trim", raw.trim);
  setStr("rationale", raw.rationale);
  setStr("guaranteeResult", raw.guaranteeResult);
  setStr("guaranteeWindow", raw.guaranteeWindow);
  setStr("scarcityDetail", raw.scarcityDetail);

  const realPrice = numStr(raw.realPrice);
  if (realPrice) p.realPrice = realPrice;

  const resultMap = mapResultMap(raw.resultMap);
  if (resultMapHasContent(resultMap)) p.resultMap = resultMap;

  const gt = pickEnum(raw.guaranteeType, GUARANTEE_TYPES);
  if (gt) p.guaranteeType = gt;
  const st = pickEnum(raw.scarcityType, SCARCITY_TYPES);
  if (st) p.scarcityType = st;

  const usePillars = Boolean(raw.usePillars);
  if (usePillars) {
    const pillars = mapPillars(raw.pillars).filter(
      (pl) =>
        pl.name ||
        pl.promise ||
        pl.deliverables.some((d) => d.item) ||
        pl.bonuses.some((b) => b.name),
    );
    if (pillars.length) {
      p.usePillars = true;
      p.pillars = pillars;
    }
  } else {
    const deliverables = mapDeliverables(raw.deliverables).filter((d) => d.item);
    const bonuses = mapBonuses(raw.bonuses).filter((b) => b.name);
    if (deliverables.length) p.deliverables = deliverables;
    if (bonuses.length) p.bonuses = bonuses;
  }

  return p;
}

// Translate the chat's optional `icp` object (gathered inline when the user
// skipped the ICP map) into a Partial<ICP> for the Brand DNA `icp` pillar.
// Mirrors generatedToBrand: writes the universal block + one segment + the
// flattened convenience fields older consumers read.
export function chatIcpToBrand(
  raw: Record<string, unknown> | undefined,
): Partial<ICP> {
  if (!raw) return {};

  const segmentName = str(raw.segmentName).trim();
  const dreamOutcome = str(raw.dreamOutcome).trim();
  const pain = strArray(raw.pain);
  const goals = strArray(raw.goals);
  const objections = strArray(raw.objections);
  const triggers = strArray(raw.triggers);
  const emotional = str(raw.emotional).trim();

  return {
    name: segmentName,
    painPoints: pain,
    dreamOutcome: dreamOutcome || goals.join(" / "),
    psychographics: {
      values: [],
      beliefs: [],
      fears: pain,
      desires: goals,
    },
    universal: {
      painChallenge: pain,
      painNight: [],
      painTried: [],
      goals,
      emotionalFingerprint: emotional,
      triggers,
      objections,
      hesitations: [],
    },
    segments: [
      {
        name: segmentName || "Primary Segment",
        oneLine: dreamOutcome,
        pain,
        goals,
        mindset: [],
        objections,
        triggers,
        intensity: {
          painIntensity: 0,
          goalClarity: 0,
          buyingUrgency: 0,
          priceSensitivity: 0,
          skepticism: 0,
        },
      },
    ],
  };
}

// Write the flagship product back into the Brand DNA `offer` pillar.
export function offerToBrand(offer: BuilderOffer): Partial<BrandOffer> {
  const p = flagshipProduct(offer);
  if (!p) return {};
  const total = stageValue(p);
  return {
    dreamOutcome: p.dream,
    pricePoint: p.realPrice ? money(p.realPrice) : p.price || "",
    grandSlamDescription: p.trim,
    perceivedLikelihood: p.guaranteeResult,
    timeDelay: p.guaranteeWindow,
    ...(total ? { deliveryModel: `Stacked value ${money(total)}` } : {}),
  };
}
