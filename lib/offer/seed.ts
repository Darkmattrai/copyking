import type { Offer, Tier, Ladder } from "./schema";

export function newTier(o?: Partial<Tier>): Tier {
  return {
    name: "",
    price: "",
    desc: "",
    pop: false,
    deliverables: [{ item: "", val: "" }],
    bonuses: [{ name: "", val: "", why: "" }],
    payment: "",
    ...(o || {}),
  };
}

export function newLadder(): Ladder {
  return {
    name: "",
    tiers: [newTier()],
    continuity: { on: false, name: "", price: "", cycle: "Monthly", desc: "" },
  };
}

export function seed(): Offer {
  return {
    who: "",
    where: "",
    dream: "",
    emotion: "",
    bait: "",
    features: [{ f: "", b: "" }],
    problems: [{ p: "", s: "" }],
    magic: "",
    trim: "",
    rationale: "",
    realPrice: "",
    priceProof: "",
    anchorCompare: "",
    proofShots: [],
    veq: { dream: 5, likely: 5, time: 5, effort: 5 },
    ladders: [
      {
        name: "Get-More-Jobs Ladder",
        tiers: [
          newTier({
            name: "Free Game Plan",
            price: "FREE",
            desc: "A free plan that shows where their next 10 jobs come from (the bait).",
          }),
          newTier({
            name: "Starter",
            price: "$750/mo",
            desc: "The system + templates. They run it themselves.",
          }),
          newTier({
            name: "Accelerator",
            price: "$1,500/mo",
            desc: "Done-for-you ads, lead picking, weekly calls — the full machine.",
            pop: true,
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
          }),
          newTier({
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
    guaranteeType: "Conditional",
    guaranteeResult: "",
    guaranteeWindow: "",
    guaranteeProofReq: "",
    scarcityType: "Limited slots / seats",
    urgencyType: "Rolling cohorts",
    scarcityDetail: "",
    objections: [{ o: "", r: "" }],
    leadAdd: "",
    pgCompetitors: "",
    pgStrength: "",
    pgPayback: "",
    pgWhere: "",
    nm: { formula: "SHARP", parts: {} },
    offerName: "",
  };
}
