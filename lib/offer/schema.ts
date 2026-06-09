// Typed model for the Offer Builder.
//
// A "value ladder" is the SPINE of the offer: an ordered list of Products that
// ascend in value/price. Each Product is a self-contained Grand-Slam Offer —
// its own avatar, features, problems, value stack, guarantee, scarcity, proof
// and name. The top-level Offer is a thin wrapper around the ladder(s).

export type Deliverable = {
  item: string;
  val: string;
};

export type Bonus = {
  name: string;
  val: string;
  why: string;
};

// A "pillar" groups part of the offer into a themed bucket: a promise + the
// deliverables and bonuses that fulfil it. High-ticket offers are usually sold
// as 3–5 pillars. Optional per product (see Product.usePillars).
export type Pillar = {
  name: string;
  promise: string;
  deliverables: Deliverable[];
  bonuses: Bonus[];
};

// A "result map" structures the transformation a product delivers as a tree:
// the ULTIMATE result (the big outcome) → the CORE results the buyer must hit
// to get there → the SPLINTER results / frameworks under each core. It's the
// scaffold you use to design the deliverables/pillars of any product, course
// or service. Optional per product (rendered when it has content).
export type CoreResult = {
  result: string;
  splinters: string[];
};

export type ResultMap = {
  ultimate: string;
  cores: CoreResult[];
};

export type FeatureBenefit = {
  f: string;
  b: string;
};

export type ProblemSolution = {
  p: string;
  s: string;
};

export type Objection = {
  o: string;
  r: string;
};

export interface Veq {
  dream: number;
  likely: number;
  time: number;
  effort: number;
}

export interface NameModel {
  formula: string;
  parts: Record<string, string>;
}

// A single product on the ladder — a complete, standalone offer.
export interface Product {
  id: string;

  // identity + ladder display
  name: string;
  price: string; // headline / recurring price shown on the ladder ("$1,500/mo", "FREE")
  desc: string; // one-line "what they get on this product"
  pop: boolean; // ⭐ the product most people pick
  payment: string;

  // bullseye / avatar
  who: string;
  where: string;
  dream: string;
  emotion: string;
  bait: string;
  // Link to a saved ICP-map audience segment (by its name). When set, the
  // bullseye was filled from that segment and copy generation references its
  // psychology so it writes to that exact avatar. "" = no linked profile.
  icpSegmentRef: string;

  // value engine
  features: FeatureBenefit[];
  problems: ProblemSolution[];
  deliverables: Deliverable[];
  bonuses: Bonus[];
  // Optional high-ticket structuring: when usePillars is on, the value stack is
  // organized into pillars instead of the flat deliverables/bonuses lists above.
  usePillars: boolean;
  pillars: Pillar[];
  magic: string;
  trim: string;
  // The transformation tree (ultimate → core → splinter results). Optional.
  resultMap: ResultMap;
  rationale: string;

  // value equation + pricing framing
  veq: Veq;
  realPrice: string; // today's price for the value-stack math
  priceProof: string;
  anchorCompare: string;
  proofShots: string[];

  // risk reversal
  guaranteeType: string;
  guaranteeResult: string;
  guaranteeWindow: string;
  guaranteeProofReq: string;
  pgCompetitors: string;
  pgStrength: string;
  pgPayback: string;
  pgWhere: string;

  // urgency
  scarcityType: string;
  urgencyType: string;
  scarcityDetail: string;

  // objections + name
  objections: Objection[];
  leadAdd: string;
  nm: NameModel;
}

export interface Continuity {
  on: boolean;
  name: string;
  price: string;
  cycle: string;
  desc: string;
}

export interface Ladder {
  name: string;
  products: Product[];
  continuities: Continuity[];
}

export interface Offer {
  offerName: string;
  ladders: Ladder[];
}

// ─── Price tiers (auto colour + position) ──────────────────────────────────────

export interface TierDef {
  key: string;
  rank: number;
  label: string;
  color: string;
  bg: string;
}

// Colors reference theme-aware CSS variables (defined in styles/globals.css)
// so tiers adapt between light and dark mode.
export const TIERS: TierDef[] = [
  { key: "free", rank: 0, label: "Free", color: "var(--color-tier-free)", bg: "var(--color-tier-free-bg)" },
  { key: "low", rank: 1, label: "Low Ticket", color: "var(--color-tier-low)", bg: "var(--color-tier-low-bg)" },
  { key: "mid", rank: 2, label: "Mid Ticket", color: "var(--color-tier-mid)", bg: "var(--color-tier-mid-bg)" },
  { key: "midhi", rank: 3, label: "Mid to High", color: "var(--color-tier-midhi)", bg: "var(--color-tier-midhi-bg)" },
  { key: "high", rank: 4, label: "High Ticket", color: "var(--color-tier-high)", bg: "var(--color-tier-high-bg)" },
];

export function priceNum(p: string | number | null | undefined): number {
  const n = parseFloat(String(p == null ? "" : p).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function tierOf(price: string | number | null | undefined): TierDef | null {
  const s = String(price == null ? "" : price)
    .trim()
    .toLowerCase();
  if (s === "") return null;
  if (/free/.test(s) || priceNum(s) === 0) return TIERS[0];
  const n = priceNum(s);
  if (n < 100) return TIERS[1];
  if (n < 500) return TIERS[2];
  if (n < 1000) return TIERS[3];
  return TIERS[4];
}

// stable sort by tier ascending; unknown-price products keep order at the end
export function sortProducts(arr: Product[]): Product[] {
  return arr
    .map((t, i) => ({ t, i, r: tierOf(t.price) ? tierOf(t.price)!.rank : 99 }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.t);
}

// flag a higher-tier product that sits before a lower one (must read Free → High)
export function productOrderError(order: Product[]): string | null {
  let maxSeen = -1;
  let maxTier: TierDef | null = null;
  for (const t of order) {
    const tr = tierOf(t.price);
    if (!tr) continue;
    if (tr.rank < maxSeen)
      return `${maxTier!.label} offers can't be at this product — keep the ladder ordered Free → High ticket.`;
    if (tr.rank > maxSeen) {
      maxSeen = tr.rank;
      maxTier = tr;
    }
  }
  return null;
}

export function money(n: string | number): string {
  const num = +n;
  return isNaN(num) ? "" : "$" + num.toLocaleString();
}

// ─── Value equation ────────────────────────────────────────────────────────────

export function valueScore(veq: Veq): string {
  return ((+veq.dream * +veq.likely) / (+veq.time * +veq.effort)).toFixed(2);
}

export function scoreNote(s: string | number): string {
  const v = +s;
  if (v >= 4) return "🔥 elite — feels like a no-brainer";
  if (v >= 1.5) return "solid — push time & effort lower";
  return "weak — raise dream/likelihood or cut time/effort";
}

// True once a result map carries any real content (ultimate, a core result,
// or a splinter). Used to decide whether to render/export it.
export function resultMapHasContent(r: ResultMap | undefined): boolean {
  if (!r) return false;
  return Boolean(
    r.ultimate?.trim() ||
      (r.cores || []).some(
        (c) =>
          c.result?.trim() || (c.splinters || []).some((s) => s?.trim()),
      ),
  );
}

// The deliverables that actually count for a product — flattened across pillars
// when pillar mode is on, otherwise the flat list.
export function effectiveDeliverables(p: Product): Deliverable[] {
  if (p.usePillars && p.pillars?.length)
    return p.pillars.flatMap((pl) => pl.deliverables || []);
  return p.deliverables || [];
}

export function effectiveBonuses(p: Product): Bonus[] {
  if (p.usePillars && p.pillars?.length)
    return p.pillars.flatMap((pl) => pl.bonuses || []);
  return p.bonuses || [];
}

// stacked $ value of one product (its deliverables + bonuses, across pillars)
export function stageValue(p: Product): number {
  return (
    effectiveDeliverables(p).reduce((a, x) => a + (+x.val || 0), 0) +
    effectiveBonuses(p).reduce((a, x) => a + (+x.val || 0), 0)
  );
}

// total stacked value across every product in every ladder
export function offerValueTotal(offer: Offer): number {
  let t = 0;
  (offer.ladders || []).forEach((L) =>
    (L.products || []).forEach((p) => {
      t += stageValue(p);
    }),
  );
  return t;
}

// suggest 1–10 value-equation inputs for a single product from its own data
export function suggestVeq(p: Product): Veq {
  const len = (s: string) => String(s || "").trim().length;
  const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n * 2) / 2));
  const dream = clamp(
    3 + Math.min(4, len(p.dream) / 40) + Math.min(3, len(p.emotion) / 40),
  );
  let lk = 3;
  if (p.guaranteeResult) lk += 2;
  if (/free|refund|until|pay you/i.test(p.guaranteeResult || "")) lk += 1.5;
  if (len(p.priceProof) > 20) lk += 1.5;
  if (p.proofShots.length) lk += 1;
  const likely = clamp(lk);
  let tm = 7;
  const win =
    (p.guaranteeWindow || "") + " " + (p.trim || "") + " " + (p.name || "");
  const dm = win.match(/(\d+)\s*day/i);
  const wm = win.match(/(\d+)\s*week/i);
  const mm = win.match(/(\d+)\s*month/i);
  if (dm) tm = +dm[1] <= 30 ? 2 : 4;
  else if (wm) tm = +wm[1] <= 6 ? 3 : 5;
  else if (mm) tm = +mm[1] <= 2 ? 4 : 6;
  const time = clamp(tm);
  const allDeliv = effectiveDeliverables(p).map((d) => d.item).join(" ");
  let ef = 6;
  if (/done[- ]for[- ]you|dfy|we (build|set up|run|handle|do)|managed|hands[- ]off/i.test(allDeliv))
    ef -= 3;
  if (/template|script|swipe|plug[- ]and[- ]play|system/i.test(allDeliv)) ef -= 1.5;
  const effort = clamp(ef);
  return { dream, likely, time, effort };
}

// ─── Offer-name formulas ───────────────────────────────────────────────────────

export interface NameFormulaPart {
  key: string;
  label: string;
  hint: string;
  eg: string;
}

export interface NameFormula {
  key: string;
  label: string;
  order: string[];
  parts: NameFormulaPart[];
}

export const NAME_FORMULAS: NameFormula[] = [
  {
    key: "SHARP",
    label: "SHARP — Speed · Hook · Audience · Result · Package",
    order: ["hook", "audience", "speed", "pkg"],
    parts: [
      { key: "speed", label: "Speed — the timeframe", hint: "How fast they get it.", eg: "'30-Day', '90-Day'" },
      { key: "hook", label: "Hook — the attention word", hint: "The magnet that grabs the eye.", eg: "'Free', 'Booked-Out', '$10k'" },
      { key: "audience", label: "Audience — who it's for", hint: "Name the exact prospect.", eg: "'Roofer', 'Coach'" },
      { key: "result", label: "Result — the outcome", hint: "The promised end state.", eg: "'Booked-Out', 'Debt-Free'" },
      { key: "pkg", label: "Package — the wrapper word", hint: "What you call the container.", eg: "'System', 'Accelerator'" },
    ],
  },
  {
    key: "MAGIC",
    label: "MAGIC — Magnetic Avatar Getting an Incredible Change",
    order: ["avatar", "change", "container"],
    parts: [
      { key: "avatar", label: "Avatar — who it's for", hint: "The exact person.", eg: "'Roofer', 'Solo Founder'" },
      { key: "change", label: "Incredible change — the transformation", hint: "Before → after in a phrase.", eg: "'Booked-Out', 'Fully-Staffed'" },
      { key: "container", label: "Container — the wrapper", hint: "Method/system/program word.", eg: "'Method', 'Machine', 'Blueprint'" },
    ],
  },
  {
    key: "PAS",
    label: "Outcome-in-Time — [Result] in [Timeframe]",
    order: ["result", "time"],
    parts: [
      { key: "result", label: "Result — the dream outcome", hint: "What they end up with.", eg: "'10 New Jobs', 'A Full Calendar'" },
      { key: "time", label: "Timeframe — how fast", hint: "The deadline that creates urgency.", eg: "'in 60 Days', 'in One Quarter'" },
    ],
  },
  {
    key: "NUMERIC",
    label: "Numbered Promise — The [#]-[Unit] [Outcome] [Package]",
    order: ["number", "outcome", "pkg"],
    parts: [
      { key: "number", label: "Number — the headline figure", hint: "A concrete, believable number.", eg: "'7-Figure', '10-Job', '5-Star'" },
      { key: "outcome", label: "Outcome — the result word", hint: "What that number gets them.", eg: "'Roofing', 'Revenue', 'Booking'" },
      { key: "pkg", label: "Package — the wrapper word", hint: "Program/system word.", eg: "'Accelerator', 'Engine'" },
    ],
  },
];

export function assembleName(nm: NameModel): string {
  const f = NAME_FORMULAS.find((x) => x.key === nm.formula) || NAME_FORMULAS[0];
  const v = (k: string) => String((nm.parts || {})[k] || "").trim();
  const words = (f.order || f.parts.map((p) => p.key)).map(v).filter(Boolean);
  return words.length ? "The " + words.join(" ") : "";
}

export const GUARANTEE_TYPES = [
  "Unconditional",
  "Conditional",
  "Anti-guarantee",
  "Performance / Implied",
];
export const SCARCITY_TYPES = [
  "Limited slots / seats",
  "Limited bonuses",
  "Never-again (closing for good)",
];
export const URGENCY_TYPES = [
  "Rolling cohorts",
  "Rolling seasonal",
  "Pricing / bonus-based",
  "Exploding opportunity",
];
export const CONTINUITY_CYCLES = ["Monthly", "Quarterly", "Yearly"];
export const PROOF_MAX = 4;
