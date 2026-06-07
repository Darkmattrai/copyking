"use client";

import { useMemo } from "react";

import { useOfferDraftStore } from "@/lib/offer/store";
import {
  NAME_FORMULAS,
  GUARANTEE_TYPES,
  SCARCITY_TYPES,
  URGENCY_TYPES,
  PROOF_MAX,
  valueScore,
  scoreNote,
  suggestVeq,
  assembleName,
  offerValueTotal,
  money,
  type FeatureBenefit,
  type ProblemSolution,
  type Objection,
  type Veq,
} from "@/lib/offer/schema";
import type { EnhanceContext } from "@/lib/offer/enhance-prompt";
import { OfferField, useEnhance } from "./offer-field";
import { ListTable } from "./list-table";
import { ValueLadder } from "./value-ladder";

interface StepDef {
  id: string;
  grp: string;
  crumb: string;
  title: string;
  lead: string;
  quote?: string;
}

export const STEPS: StepDef[] = [
  {
    id: "bullseye",
    grp: "Module 0 · Foundation",
    crumb: "Find the bullseye",
    title: "Find the Bullseye",
    lead: "Sell what the market is starving for — not what you want to sell. Nail who they are and the one emotion that drags them out of bed.",
    quote:
      "“The bullseye that takes your prospect out of bed, grabs their credit card and buys — without hesitation.”",
  },
  {
    id: "fb",
    grp: "Module 0 · Foundation",
    crumb: "Features → Benefits",
    title: "Features → Benefits Sheet",
    lead: "List every feature, then translate each into the real-life benefit. Nobody cares about latex; they care about waking up pain-free and getting the promotion.",
    quote: "“Do this properly and your offers will write themselves.”",
  },
  {
    id: "problems",
    grp: "Module 0 · Foundation",
    crumb: "Problems → Solutions",
    title: "Problems → Solutions",
    lead: "List every problem standing between the prospect and the dream outcome, then flip each into a solution you deliver.",
  },
  {
    id: "magic",
    grp: "Module 0 · Foundation",
    crumb: "Magic wand → trim",
    title: "Magic-Wand Offer, then Trim",
    lead: "Forget your lawyer and the rules. Write the most outrageous promise you could make. Then trim to what's realistic, deliverable, and won't get you sued.",
    quote:
      "“If the offer and guarantee don't keep you up at night, it's not good enough.”",
  },
  {
    id: "s3",
    grp: "Build the Offer",
    crumb: "Value Ladder",
    title: "The Value Ladder",
    lead: "Build the staircase your customers climb — bottom step is the bait/entry, the top is your premium anchor. Click a stage to add its deliverables, bonuses and pricing. Prices auto-colour into tiers.",
  },
  {
    id: "s1",
    grp: "Build the Offer",
    crumb: "Rationale",
    title: "Why It's This Good (Rationale)",
    lead: "Give a credible reason WHY the offer is this good. Without rationale a crazy offer reads as a scam.",
  },
  {
    id: "s2",
    grp: "Build the Offer",
    crumb: "Value Equation",
    title: "Value Equation & Proof",
    lead: "Prove people paid full price, then score how strong the value really is. The equation maximises dream & likelihood and minimises time & effort.",
    quote: "“A compelling offer is more powerful than a convincing argument.”",
  },
  {
    id: "s6",
    grp: "Make it Irresistible",
    crumb: "Guarantee",
    title: "Power Guarantee",
    lead: "Risk reversal that becomes an unfair advantage: pick the type, tie it to a specific result, scan competitors, lead with your strength, plan the payback, and put it everywhere.",
  },
  {
    id: "s7",
    grp: "Make it Irresistible",
    crumb: "Scarcity",
    title: "Scarcity & Urgency",
    lead: "An offer with no scarcity has no deadline — and 'someday' means never. Add a LEGIT ticking clock.",
    quote: "“The delay is the death of a sale.”",
  },
  {
    id: "obj",
    grp: "Make it Irresistible",
    crumb: "Debunk objections",
    title: "Pre-frame & Debunk Objections",
    lead: "List every objection, pick the top 3, and overcome each. Then 'lead the offer': what can you add to make it even more irresistible?",
  },
  {
    id: "name",
    grp: "Name & Export",
    crumb: "Name the offer",
    title: "Name the Offer",
    lead: "Pick a naming formula and fill the parts — or write your own. A memorable name makes the offer easier to sell and remember.",
  },
  {
    id: "done",
    grp: "Name & Export",
    crumb: "Review & export",
    title: "Review & Export",
    lead: "Your finished offer is on the right. Copy it as text or export it — and save it to your Brand DNA.",
  },
];

function readFileToThumb(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1000;
        let w = img.width;
        let h = img.height;
        if (w > max || h > max) {
          const k = max / Math.max(w, h);
          w = Math.round(w * k);
          h = Math.round(h * k);
        }
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        cv.getContext("2d")?.drawImage(img, 0, 0, w, h);
        resolve(cv.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = r.result as string;
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function OfferBuilderShell() {
  const { offer, current, patch, setField, setCurrent, recordEnhancement } =
    useOfferDraftStore();
  const { enhance, enhancingKey } = useEnhance();

  const step = STEPS[current >= STEPS.length ? 0 : current];

  const ctx: EnhanceContext = useMemo(
    () => ({ who: offer.who, dream: offer.dream, offerName: offer.offerName }),
    [offer.who, offer.dream, offer.offerName],
  );

  const onEnhance = (key: string, label: string, value: string) =>
    enhance(key, label, value, ctx);

  const fieldProps = (key: string) => ({
    fieldKey: key,
    onEnhance,
    onEnhanced: recordEnhancement,
    enhancing: enhancingKey === key,
  });

  // group steps for the rail
  const groups = useMemo(() => {
    const out: { grp: string; items: { idx: number; step: StepDef }[] }[] = [];
    STEPS.forEach((s, idx) => {
      const last = out[out.length - 1];
      if (last && last.grp === s.grp) last.items.push({ idx, step: s });
      else out.push({ grp: s.grp, items: [{ idx, step: s }] });
    });
    return out;
  }, []);

  const veqSet = (k: keyof Veq, v: number) =>
    setField("veq", { ...offer.veq, [k]: v });

  const onProofUpload = async (files: FileList | null) => {
    if (!files) return;
    const room = PROOF_MAX - offer.proofShots.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    const thumbs = await Promise.all(picked.map(readFileToThumb));
    if (thumbs.length)
      setField("proofShots", [...offer.proofShots, ...thumbs]);
  };

  const removeProof = (i: number) =>
    setField(
      "proofShots",
      offer.proofShots.filter((_, j) => j !== i),
    );

  const score = valueScore(offer.veq);
  const sug = suggestVeq(offer);
  const stackTotal = offerValueTotal(offer);

  const nameFormula =
    NAME_FORMULAS.find((x) => x.key === offer.nm.formula) || NAME_FORMULAS[0];
  const assembled = assembleName(offer.nm);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-5">
      {/* LEFT RAIL */}
      <nav className="hidden lg:block space-y-4">
        {groups.map((g) => (
          <div key={g.grp}>
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-1.5 px-2">
              {g.grp}
            </p>
            <div className="space-y-0.5">
              {g.items.map(({ idx, step: s }) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrent(idx)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    idx === current
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface"
                  }`}
                >
                  {s.crumb}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* PANEL */}
      <div className="space-y-5">
        <div>
          <p className="text-xs text-text-tertiary mb-1">
            Step {current + 1} of {STEPS.length}
          </p>
          <h2 className="text-xl font-bold text-text-primary">{step.title}</h2>
          <p className="text-sm text-text-secondary mt-1.5">{step.lead}</p>
          {step.quote && (
            <p className="mt-3 pl-3 border-l-2 border-accent/40 text-sm italic text-text-tertiary">
              {step.quote}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {step.id === "bullseye" && (
            <>
              <OfferField
                {...fieldProps("who")}
                label="Who is your dream prospect?"
                required
                hint="Be specific — the person, not 'everyone'."
                eg="Roofing-company owners doing $1M–$3M/yr who can't book enough qualified jobs."
                value={offer.who}
                onChange={(v) => setField("who", v)}
              />
              <OfferField
                {...fieldProps("where")}
                label="Where do you reach them?"
                hint="Channel / platform / list where they already gather."
                eg="Facebook groups for contractors; local home-services trade shows; YouTube 'how to grow a roofing business'."
                value={offer.where}
                onChange={(v) => setField("where", v)}
              />
              <OfferField
                {...fieldProps("dream")}
                label="Dream outcome — what do they ultimately crave?"
                type="textarea"
                required
                hint="The end result, stated in their words."
                eg="A calendar full of pre-qualified jobs so I can stop chasing leads and finally take weekends off."
                value={offer.dream}
                onChange={(v) => setField("dream", v)}
              />
              <OfferField
                {...fieldProps("emotion")}
                label="The core emotion / pain (the bullseye)"
                type="textarea"
                required
                hint="The fear, frustration, or desire that gets them out of bed."
                eg="Terror of slow months and missing payroll — watching competitors win jobs they should have had."
                value={offer.emotion}
                onChange={(v) => setField("emotion", v)}
              />
              <OfferField
                {...fieldProps("bait")}
                label="The bait / hook that pulls them in"
                hint="The specific thing you lead with to start the relationship."
                eg="Free 'Booked-Out Roofer' game plan that shows where your next 10 jobs come from."
                value={offer.bait}
                onChange={(v) => setField("bait", v)}
              />
            </>
          )}

          {step.id === "fb" && (
            <ListTable<FeatureBenefit>
              rows={offer.features}
              columns={[
                {
                  key: "f",
                  label: "Feature",
                  placeholder: "High-grade certified latex",
                },
                {
                  key: "b",
                  label: "Benefit(s) — what it does for them",
                  type: "textarea",
                  placeholder:
                    "Molds to your body → undisturbed sleep → wake with energy → perform better → get the promotion",
                },
              ]}
              onChange={(features) => patch({ features })}
              addLabel="Add feature"
            />
          )}

          {step.id === "problems" && (
            <ListTable<ProblemSolution>
              rows={offer.problems}
              columns={[
                {
                  key: "p",
                  label: "Problem on the path to the dream",
                  placeholder: "I don't know which leads are worth calling",
                },
                {
                  key: "s",
                  label: "Your solution / deliverable",
                  type: "textarea",
                  placeholder:
                    "Done-for-you lead-scoring system that flags only sales-ready jobs",
                },
              ]}
              onChange={(problems) => patch({ problems })}
              addLabel="Add problem"
            />
          )}

          {step.id === "magic" && (
            <>
              <OfferField
                {...fieldProps("magic")}
                label="🪄 Magic-wand offer — go outrageous (no rules)"
                type="textarea"
                required
                hint="If there were no lawyers, no regulations, no limits — the best result in the shortest time. A few lines. Just for you."
                eg="I'll fill your calendar with 30 booked roofing jobs in 30 days or I pay YOU $10,000 and work free until you hit it."
                value={offer.magic}
                onChange={(v) => setField("magic", v)}
              />
              <OfferField
                {...fieldProps("trim")}
                label="✂️ Trimmed version — realistic, deliverable, lawsuit-proof"
                type="textarea"
                required
                hint="Keep it irresistible but make sure you can actually deliver it."
                eg="10 pre-qualified roofing jobs in your first 60 days, or we work for free until you get them."
                value={offer.trim}
                onChange={(v) => setField("trim", v)}
              />
            </>
          )}

          {step.id === "s3" && <ValueLadder />}

          {step.id === "s1" && (
            <OfferField
              {...fieldProps("rationale")}
              label="Why is this offer so good? (the credible reason)"
              type="textarea"
              required
              hint="Introductory offer? Better business/revenue model? Lower costs? Want advocates? Must be believable."
              eg="We only take 5 new roofers a quarter because we reinvest the first month's results into case studies — so we make our money on month two, not the intro."
              value={offer.rationale}
              onChange={(v) => setField("rationale", v)}
            />
          )}

          {step.id === "s2" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <OfferField
                  {...fieldProps("priceProof")}
                  label="Proof people paid full price"
                  type="textarea"
                  hint="Screenshots, # of buyers, testimonials — show don't tell."
                  eg="42 contractors paid $12,000 for this exact build — here are their signed agreements and results."
                  value={offer.priceProof}
                  onChange={(v) => setField("priceProof", v)}
                />
                <OfferField
                  {...fieldProps("anchorCompare")}
                  label="Make the real price sound trivial"
                  type="textarea"
                  hint="'Cheaper than a daily coffee', a pizza, a McDonald's meal…"
                  eg="Less than what you spend on truck fuel in a week — and it books a single $9k job that pays for it 7x over."
                  value={offer.anchorCompare}
                  onChange={(v) => setField("anchorCompare", v)}
                />
              </div>

              <div>
                <p className="ck-label">
                  Proof screenshots{" "}
                  <span className="font-normal text-text-tertiary">
                    (max {PROOF_MAX})
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {offer.proofShots.map((src, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`proof ${i + 1}`}
                        className="h-20 w-20 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeProof(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-danger text-white text-xs leading-none"
                        aria-label="Remove screenshot"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {offer.proofShots.length < PROOF_MAX && (
                    <label className="h-20 w-20 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-text-tertiary hover:text-text-primary cursor-pointer text-center px-1">
                      + Upload
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => onProofUpload(e.target.files)}
                      />
                    </label>
                  )}
                </div>
              </div>

              <OfferField
                {...fieldProps("realPrice")}
                label="The real price you'll charge ($)"
                type="number"
                required
                hint="Aim ~10% of the stacked full value."
                eg="1500 (vs $14,000 stacked value)"
                value={offer.realPrice}
                onChange={(v) => setField("realPrice", v)}
              />

              {stackTotal > 0 && (
                <p className="text-sm text-text-secondary">
                  Total stacked value across all stages:{" "}
                  <b className="text-accent">{money(stackTotal)}</b>
                </p>
              )}

              <div className="ck-card p-4 space-y-3">
                <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                  Value Equation score
                </p>
                {(
                  [
                    ["dream", "Dream outcome ↑"],
                    ["likely", "Perceived likelihood ↑"],
                    ["time", "Time delay ↓"],
                    ["effort", "Effort & sacrifice ↓"],
                  ] as [keyof Veq, string][]
                ).map(([k, lab]) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className="text-sm text-text-secondary w-44 shrink-0">
                      {lab}
                    </span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={0.5}
                      value={offer.veq[k]}
                      onChange={(e) => veqSet(k, +e.target.value)}
                      className="ck-range flex-1"
                    />
                    <span className="text-sm font-medium text-text-primary w-8 text-right">
                      {(+offer.veq[k]).toFixed(1)}
                    </span>
                    <span
                      className="text-xs text-text-tertiary w-10"
                      title="Suggested from your data"
                    >
                      ↪ {sug[k]}
                    </span>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setField("veq", sug)}
                  className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                >
                  ↪ Use suggested values from my data
                </button>
                <div className="border-t border-border pt-2 text-sm">
                  Value = (Dream × Likelihood) ÷ (Time × Effort) →{" "}
                  <b className="text-text-primary">{score}</b>{" "}
                  <span className="text-text-tertiary">{scoreNote(score)}</span>
                </div>
              </div>
            </>
          )}

          {step.id === "s6" && (
            <>
              <OfferField
                {...fieldProps("guaranteeType")}
                label="Guarantee type"
                type="select"
                required
                options={GUARANTEE_TYPES}
                value={offer.guaranteeType}
                onChange={(v) => setField("guaranteeType", v)}
              />
              <OfferField
                {...fieldProps("guaranteeResult")}
                label="The specific result you guarantee"
                type="textarea"
                required
                hint="Tie it to an outcome — not 'satisfaction guaranteed'."
                eg="10 pre-qualified roofing jobs in 60 days or we work for free until you get them."
                value={offer.guaranteeResult}
                onChange={(v) => setField("guaranteeResult", v)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <OfferField
                  {...fieldProps("guaranteeWindow")}
                  label="Timeframe / window"
                  hint="How long they have to hit the result."
                  eg="60 days"
                  value={offer.guaranteeWindow}
                  onChange={(v) => setField("guaranteeWindow", v)}
                />
                <OfferField
                  {...fieldProps("guaranteeProofReq")}
                  label="What the client must prove (keeps freeloaders out)"
                  hint="For conditional guarantees."
                  eg="Show you ran every campaign and answered leads within 10 minutes."
                  value={offer.guaranteeProofReq}
                  onChange={(v) => setField("guaranteeProofReq", v)}
                />
              </div>
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold pt-2">
                Turn it into an unfair advantage
              </p>
              <OfferField
                {...fieldProps("pgCompetitors")}
                label="Competitor scan + your strength"
                type="textarea"
                required
                hint="What guarantees (if any) do competitors offer? Then: what are you genuinely best at? Sell that — it's your performance guarantee."
                eg="Competitors offer a vague '30-day money back'. We're fastest at booking jobs, so we guarantee speed: jobs in 60 days."
                value={offer.pgCompetitors}
                onChange={(v) => setField("pgCompetitors", v)}
              />
              <OfferField
                {...fieldProps("pgPayback")}
                label="Your payback / plan B"
                type="textarea"
                hint="What happens when a client isn't satisfied? Be specific."
                eg="If under 10 jobs in 60 days, we work free until they hit it AND refund that month's fee."
                value={offer.pgPayback}
                onChange={(v) => setField("pgPayback", v)}
              />
              <OfferField
                {...fieldProps("pgWhere")}
                label="Where you'll put it (front & center)"
                type="textarea"
                hint="Which touchpoints will carry it? Website, ads, calls, bios, business cards — everywhere."
                eg="Headline on the landing page, first line of every ad, the call script intro, and the email signature."
                value={offer.pgWhere}
                onChange={(v) => setField("pgWhere", v)}
              />
            </>
          )}

          {step.id === "s7" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <OfferField
                  {...fieldProps("scarcityType")}
                  label="Scarcity type"
                  type="select"
                  required
                  options={SCARCITY_TYPES}
                  value={offer.scarcityType}
                  onChange={(v) => setField("scarcityType", v)}
                />
                <OfferField
                  {...fieldProps("urgencyType")}
                  label="Urgency type"
                  type="select"
                  options={URGENCY_TYPES}
                  value={offer.urgencyType}
                  onChange={(v) => setField("urgencyType", v)}
                />
              </div>
              <OfferField
                {...fieldProps("scarcityDetail")}
                label="The legit constraint (be honest)"
                type="textarea"
                required
                hint="Real cap, real deadline, real waitlist. Faking it kills your legitimacy."
                eg="We onboard exactly 5 roofers per quarter so each gets a dedicated campaign manager — 2 spots left for this cohort."
                value={offer.scarcityDetail}
                onChange={(v) => setField("scarcityDetail", v)}
              />
            </>
          )}

          {step.id === "obj" && (
            <>
              <p className="text-sm text-text-tertiary">
                List them all, then make sure your top 3 are crushed.
              </p>
              <ListTable<Objection>
                rows={offer.objections}
                columns={[
                  {
                    key: "o",
                    label: "Objection",
                    placeholder: "I've been burned by agencies before",
                  },
                  {
                    key: "r",
                    label: "Your rebuttal / pre-frame",
                    type: "textarea",
                    placeholder:
                      "That's exactly why we work for free until you get jobs — we carry the risk, not you.",
                  },
                ]}
                onChange={(objections) => patch({ objections })}
                addLabel="Add objection"
              />
              <OfferField
                {...fieldProps("leadAdd")}
                label="Lead the offer — what can you ADD to make it even more irresistible?"
                type="textarea"
                required
                hint="Re-read your offer as the prospect. What one addition removes the last hesitation?"
                eg="Add a 'we build your follow-up system free' so they never lose a lead they paid to get."
                value={offer.leadAdd}
                onChange={(v) => setField("leadAdd", v)}
              />
            </>
          )}

          {step.id === "name" && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="ck-label !mb-0">Naming formula</span>
                <span className="ck-sublabel !mb-0">
                  Pick a structure — the fields below change to match.
                </span>
                <select
                  value={offer.nm.formula}
                  onChange={(e) =>
                    setField("nm", { formula: e.target.value, parts: {} })
                  }
                  className="ck-input"
                >
                  {NAME_FORMULAS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                {nameFormula.parts.map((p) => (
                  <OfferField
                    key={p.key}
                    {...fieldProps(`nm.parts.${p.key}`)}
                    label={p.label}
                    hint={p.hint}
                    eg={p.eg}
                    value={offer.nm.parts[p.key] || ""}
                    onChange={(v) =>
                      setField("nm", {
                        ...offer.nm,
                        parts: { ...offer.nm.parts, [p.key]: v },
                      })
                    }
                  />
                ))}
              </div>

              {assembled && (
                <p className="text-sm text-text-secondary">
                  Suggested name: <b className="text-accent">{assembled}</b>{" "}
                  <button
                    type="button"
                    onClick={() => setField("offerName", assembled)}
                    className="text-xs font-medium text-accent hover:text-accent-hover transition-colors ml-1"
                  >
                    Use this →
                  </button>
                </p>
              )}

              <OfferField
                {...fieldProps("offerName")}
                label="✅ Final offer name"
                required
                hint="Use the assembled suggestion, or write your own."
                eg="The Booked-Out Roofer 30-Day Accelerator"
                value={offer.offerName}
                onChange={(v) => setField("offerName", v)}
              />
            </>
          )}

          {step.id === "done" && (
            <div className="ck-card p-5 space-y-2">
              <p className="text-sm text-text-secondary">
                Your finished offer is assembled on the right. Use{" "}
                <b>Copy text</b> or <b>Export HTML</b> to take it with you, then{" "}
                <b>Save to Brand DNA</b> to sync it back to your profile.
              </p>
              <p className="text-sm text-text-tertiary">
                Value Equation score:{" "}
                <b className="text-text-primary">{score}</b> — {scoreNote(score)}
              </p>
            </div>
          )}
        </div>

        {/* NAV */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
            className="ck-btn-secondary disabled:opacity-40"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() => setCurrent(Math.min(STEPS.length - 1, current + 1))}
            disabled={current === STEPS.length - 1}
            className="ck-btn-primary disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
