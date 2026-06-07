import type { Offer, Product, Ladder } from "./schema";

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// A blank, self-contained product (one rung of the ladder).
export function newProduct(o?: Partial<Product>): Product {
  return {
    id: uid(),
    name: "",
    price: "",
    desc: "",
    pop: false,
    payment: "",

    who: "",
    where: "",
    dream: "",
    emotion: "",
    bait: "",

    features: [{ f: "", b: "" }],
    problems: [{ p: "", s: "" }],
    deliverables: [{ item: "", val: "" }],
    bonuses: [{ name: "", val: "", why: "" }],
    magic: "",
    trim: "",
    rationale: "",

    veq: { dream: 5, likely: 5, time: 5, effort: 5 },
    realPrice: "",
    priceProof: "",
    anchorCompare: "",
    proofShots: [],

    guaranteeType: "Conditional",
    guaranteeResult: "",
    guaranteeWindow: "",
    guaranteeProofReq: "",
    pgCompetitors: "",
    pgStrength: "",
    pgPayback: "",
    pgWhere: "",

    scarcityType: "Limited slots / seats",
    urgencyType: "Rolling cohorts",
    scarcityDetail: "",

    objections: [{ o: "", r: "" }],
    leadAdd: "",
    nm: { formula: "SHARP", parts: {} },

    ...(o || {}),
  };
}

// Clone a product into a fresh, independent rung (new id, not "most popular").
export function cloneProduct(p: Product, o?: Partial<Product>): Product {
  return {
    ...structuredClone(p),
    id: uid(),
    pop: false,
    ...(o || {}),
  };
}

export function newLadder(): Ladder {
  return {
    name: "",
    products: [newProduct()],
    continuity: { on: false, name: "", price: "", cycle: "Monthly", desc: "" },
  };
}

export function seed(): Offer {
  return {
    offerName: "",
    ladders: [
      {
        name: "Get-More-Jobs Ladder",
        products: [
          newProduct({
            name: "Free Game Plan",
            price: "FREE",
            desc: "A free plan that shows where their next 10 jobs come from (the bait).",
            who: "Roofing-company owners doing $1M–$3M/yr who can't book enough qualified jobs.",
            dream: "A calendar full of pre-qualified jobs without chasing leads.",
            bait: "Free 'Booked-Out Roofer' game plan that shows where your next 10 jobs come from.",
          }),
          newProduct({
            name: "Starter",
            price: "$750/mo",
            desc: "The system + templates. They run it themselves.",
          }),
          newProduct({
            name: "Accelerator",
            price: "$1,500/mo",
            desc: "Done-for-you ads, lead picking, weekly calls — the full machine.",
            pop: true,
            who: "Roofing-company owners doing $1M–$3M/yr who can't book enough qualified jobs.",
            dream: "10 pre-qualified roofing jobs in 60 days, hands-off.",
            trim: "10 pre-qualified roofing jobs in your first 60 days, or we work for free until you get them.",
            deliverables: [
              { item: "Done-for-you ad campaigns", val: "4000" },
              { item: "Weekly strategy calls", val: "2000" },
              { item: "Lead-scoring system", val: "1500" },
            ],
            bonuses: [
              {
                name: "'First 10 Jobs' outreach script pack",
                val: "500",
                why: "Removes the 'what do I say to leads' fear so they win jobs in week one.",
              },
            ],
            payment: "$1,500/mo, or pay quarterly ($4,000) and save a month.",
            realPrice: "1500",
            guaranteeResult: "10 pre-qualified roofing jobs in 60 days or we work for free until you get them.",
            guaranteeWindow: "60 days",
          }),
          newProduct({
            name: "Domination",
            price: "$3,000/mo",
            desc: "Everything, plus their town locked so rivals can't join.",
          }),
        ],
        continuity: {
          on: true,
          name: "Inner Circle membership",
          price: "$297/mo",
          cycle: "Monthly",
          desc: "Ongoing campaign optimization, fresh ad templates each month, and a live group call — they stay subscribed.",
        },
      },
    ],
  };
}
