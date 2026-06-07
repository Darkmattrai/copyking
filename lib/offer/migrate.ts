import type {
  Offer,
  Product,
  Ladder,
  Continuity,
  Deliverable,
  Bonus,
  FeatureBenefit,
  ProblemSolution,
  Objection,
  Veq,
  NameModel,
} from "./schema";
import { newProduct, newLadder, seed } from "./seed";

// The old, flat single-offer shape (global fields + ladders of pricing tiers).
// Kept loose so we can read any historical save without importing dead types.
interface OldTier {
  name?: string;
  price?: string;
  desc?: string;
  pop?: boolean;
  deliverables?: Deliverable[];
  bonuses?: Bonus[];
  payment?: string;
}
interface OldLadder {
  name?: string;
  tiers?: OldTier[];
  continuity?: Continuity;
}
interface OldOffer {
  who?: string;
  where?: string;
  dream?: string;
  emotion?: string;
  bait?: string;
  features?: FeatureBenefit[];
  problems?: ProblemSolution[];
  magic?: string;
  trim?: string;
  rationale?: string;
  realPrice?: string;
  priceProof?: string;
  anchorCompare?: string;
  proofShots?: string[];
  veq?: Veq;
  ladders?: OldLadder[];
  guaranteeType?: string;
  guaranteeResult?: string;
  guaranteeWindow?: string;
  guaranteeProofReq?: string;
  scarcityType?: string;
  urgencyType?: string;
  scarcityDetail?: string;
  objections?: Objection[];
  leadAdd?: string;
  pgCompetitors?: string;
  pgStrength?: string;
  pgPayback?: string;
  pgWhere?: string;
  nm?: NameModel;
  offerName?: string;
}

function isNewShape(raw: unknown): raw is Offer {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as { ladders?: unknown };
  if (!Array.isArray(o.ladders)) return false;
  // New ladders carry `products`; old ones carry `tiers`.
  return o.ladders.every(
    (l) => l && typeof l === "object" && "products" in (l as object),
  );
}

const defaultContinuity = (): Continuity => ({
  on: false,
  name: "",
  price: "",
  cycle: "Monthly",
  desc: "",
});

// Ensure a (possibly partial) product from storage has every field the current
// schema expects, without clobbering the user's saved values.
function normalizeProduct(p: Partial<Product>): Product {
  return newProduct(p);
}

// Convert the old flat offer into the ladder-of-products shape. Every old tier
// becomes a full product that inherits the offer's shared (global) answers, so
// nothing the user wrote is lost.
function migrateFlat(old: OldOffer): Offer {
  const globals: Partial<Product> = {
    who: old.who,
    where: old.where,
    dream: old.dream,
    emotion: old.emotion,
    bait: old.bait,
    features: old.features,
    problems: old.problems,
    magic: old.magic,
    trim: old.trim,
    rationale: old.rationale,
    realPrice: old.realPrice,
    priceProof: old.priceProof,
    anchorCompare: old.anchorCompare,
    proofShots: old.proofShots,
    veq: old.veq,
    guaranteeType: old.guaranteeType,
    guaranteeResult: old.guaranteeResult,
    guaranteeWindow: old.guaranteeWindow,
    guaranteeProofReq: old.guaranteeProofReq,
    pgCompetitors: old.pgCompetitors,
    pgStrength: old.pgStrength,
    pgPayback: old.pgPayback,
    pgWhere: old.pgWhere,
    scarcityType: old.scarcityType,
    urgencyType: old.urgencyType,
    scarcityDetail: old.scarcityDetail,
    objections: old.objections,
    leadAdd: old.leadAdd,
    nm: old.nm,
  };
  // Drop undefined keys so newProduct's defaults apply where the old save was empty.
  Object.keys(globals).forEach((k) => {
    if ((globals as Record<string, unknown>)[k] === undefined)
      delete (globals as Record<string, unknown>)[k];
  });

  const oldLadders = old.ladders?.length ? old.ladders : [{ tiers: [{}] }];
  const ladders: Ladder[] = oldLadders.map((L) => {
    const tiers = L.tiers?.length ? L.tiers : [{}];
    const products = tiers.map((t, i) =>
      newProduct({
        ...globals,
        name: t.name ?? "",
        price: t.price ?? "",
        desc: t.desc ?? "",
        pop: t.pop ?? false,
        payment: t.payment ?? "",
        deliverables: t.deliverables?.length
          ? t.deliverables
          : [{ item: "", val: "" }],
        bonuses: t.bonuses?.length ? t.bonuses : [{ name: "", val: "", why: "" }],
        // The product's own name defaults to the product name; first product also
        // inherits the offer-wide name as a fallback.
        ...(i === 0 && !t.name && old.offerName ? { name: old.offerName } : {}),
      }),
    );
    return {
      name: L.name ?? "",
      products,
      continuity: L.continuity ?? defaultContinuity(),
    };
  });

  return { offerName: old.offerName ?? "", ladders };
}

// Public entry: accept any historical or current save and return a valid Offer.
export function migrateOffer(raw: unknown): Offer {
  if (!raw || typeof raw !== "object") return seed();

  if (isNewShape(raw)) {
    const o = raw as Offer;
    return {
      offerName: o.offerName ?? "",
      ladders: (o.ladders?.length ? o.ladders : [newLadder()]).map((L) => ({
        name: L.name ?? "",
        products: (L.products?.length ? L.products : [newProduct()]).map(
          normalizeProduct,
        ),
        continuity: L.continuity ?? defaultContinuity(),
      })),
    };
  }

  return migrateFlat(raw as OldOffer);
}
