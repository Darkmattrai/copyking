"use client";

import { useEffect, useMemo, useState } from "react";

import { useBrandStore } from "@/lib/brand/store";
import { icpSegmentsToProduct } from "@/lib/offer/brand-bridge";
import type { ICPSegment } from "@/types/brand";
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
  stageValue,
  money,
  tierOf,
  type Product,
  type FeatureBenefit,
  type ProblemSolution,
  type Objection,
  type Deliverable,
  type Bonus,
  type Pillar,
  type Veq,
} from "@/lib/offer/schema";
import { newPillar } from "@/lib/offer/seed";
import type { EnhanceContext } from "@/lib/offer/enhance-prompt";
import { OfferField, useEnhance } from "./offer-field";
import { ListTable } from "./list-table";
import { ResultMap } from "./result-map";
import { OfferAssistantDrawer } from "./offer-assistant-drawer";
import { buildOfferBrandContext } from "@/lib/offer/brand-context";

interface StepDef {
  id: string;
  grp: string;
  crumb: string;
  title: string;
  lead: string;
  quote?: string;
}

const STEPS: StepDef[] = [
  {
    id: "bullseye",
    grp: "Foundation",
    crumb: "Bullseye / avatar",
    title: "Find the Bullseye",
    lead: "Who is THIS product for, and the one emotion that drags them out of bed? Each product can target its own avatar.",
    quote:
      "“The bullseye that takes your prospect out of bed, grabs their credit card and buys — without hesitation.”",
  },
  {
    id: "fb",
    grp: "Foundation",
    crumb: "Features → Benefits",
    title: "Features → Benefits",
    lead: "List every feature of this product, then translate each into the real-life benefit.",
    quote: "“Do this properly and your offers will write themselves.”",
  },
  {
    id: "problems",
    grp: "Foundation",
    crumb: "Problems → Solutions",
    title: "Problems → Solutions",
    lead: "List every problem between this buyer and the dream outcome, then flip each into a solution this product delivers.",
  },
  {
    id: "magic",
    grp: "Foundation",
    crumb: "Magic wand → promise",
    title: "Magic-Wand Promise, then Trim",
    lead: "Write the most outrageous promise this product could make, then trim to what's realistic and deliverable.",
    quote:
      "“If the offer and guarantee don't keep you up at night, it's not good enough.”",
  },
  {
    id: "resultmap",
    grp: "Foundation",
    crumb: "Result map",
    title: "Map the Transformation",
    lead: "Chart the ultimate result this product delivers, the core results they must hit to get there, and the splinter results / frameworks under each. This is the skeleton your product is built on.",
    quote:
      "“People don't buy your product — they buy the transformation it promises.”",
  },
  {
    id: "stack",
    grp: "Build the Product",
    crumb: "Stack & price",
    title: "Value Stack & Price",
    lead: "What's included on this product — deliverables and bonuses with $ values — plus the price shown on the ladder.",
  },
  {
    id: "rationale",
    grp: "Build the Product",
    crumb: "Rationale",
    title: "Why It's This Good",
    lead: "Give a credible reason WHY this product is this good. Without rationale a crazy offer reads as a scam.",
  },
  {
    id: "value",
    grp: "Build the Product",
    crumb: "Value Equation",
    title: "Value Equation & Proof",
    lead: "Prove people paid full price, then score how strong the value is. Maximise dream & likelihood; minimise time & effort.",
    quote: "“A compelling offer is more powerful than a convincing argument.”",
  },
  {
    id: "guarantee",
    grp: "Make it Irresistible",
    crumb: "Guarantee",
    title: "Power Guarantee",
    lead: "Risk reversal for this product: pick the type, tie it to a specific result, lead with your strength, plan the payback.",
  },
  {
    id: "scarcity",
    grp: "Make it Irresistible",
    crumb: "Scarcity",
    title: "Scarcity & Urgency",
    lead: "A legit ticking clock for this product. Faking it kills legitimacy.",
    quote: "“The delay is the death of a sale.”",
  },
  {
    id: "obj",
    grp: "Make it Irresistible",
    crumb: "Objections",
    title: "Debunk Objections",
    lead: "List every objection to this product and overcome it. Then 'lead the offer': what can you ADD to remove the last hesitation?",
  },
  {
    id: "name",
    grp: "Finish",
    crumb: "Name this product",
    title: "Name This Product",
    lead: "Pick a naming formula and fill the parts — or write your own. This is the name shown on the ladder.",
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

// Pick one or more saved ICP-map audience segments to target with this product.
// The bullseye is merged from every selected segment and the links let copy
// generation write to all of those avatars.
function IcpProfilePicker({
  segments,
  selectedRefs,
  onChange,
}: {
  segments: ICPSegment[];
  selectedRefs: string[];
  onChange: (selected: ICPSegment[]) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!segments.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-3 py-2.5 text-xs text-text-tertiary">
        Build your{" "}
        <a
          href="/generate/icp-map"
          className="font-medium text-accent hover:underline"
        >
          ICP Map
        </a>{" "}
        to target saved audience profiles here.
      </div>
    );
  }

  const selected = segments.filter((s) => selectedRefs.includes(s.name));
  const isSelected = (name: string) => selectedRefs.includes(name);

  const toggle = (seg: ICPSegment) => {
    const nextRefs = isSelected(seg.name)
      ? selectedRefs.filter((r) => r !== seg.name)
      : [...selectedRefs, seg.name];
    onChange(segments.filter((s) => nextRefs.includes(s.name)));
  };

  return (
    <div className="relative">
      {selected.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-accent/40 bg-accent/[0.06] px-3 py-2">
          <span className="text-xs font-semibold text-accent">🔗 Targeting:</span>
          {selected.map((s) => (
            <span
              key={s.name}
              className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-text-primary"
            >
              {s.name}
              <button
                type="button"
                onClick={() => toggle(s)}
                aria-label={`Remove ${s.name}`}
                className="text-text-tertiary hover:text-danger transition-colors"
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="ml-auto text-xs text-text-tertiary hover:text-text-primary transition-colors"
          >
            Edit
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
        >
          <span className="text-base leading-none">＋</span>
          Use ICP profile(s)
        </button>
      )}

      {open && (
        <div className="absolute z-30 mt-1.5 w-full max-w-md overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
              Pick one or more segments
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Done
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {segments.map((seg, i) => {
              const sel = isSelected(seg.name);
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => toggle(seg)}
                    className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold leading-none ${
                        sel
                          ? "border-accent bg-accent text-white"
                          : "border-border-hover text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-text-primary">
                        {seg.name || `Segment ${i + 1}`}
                      </span>
                      {seg.oneLine && (
                        <span className="block line-clamp-2 text-xs text-text-tertiary">
                          {seg.oneLine}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ProductBuilder() {
  const {
    offer,
    curLadder,
    curProduct,
    current,
    setCurrent,
    setCurProduct,
    setProductField,
    patchProduct,
    recordEnhancement,
  } = useOfferDraftStore();
  const { enhance, enhancingKey } = useEnhance();

  const icp = useBrandStore((s) => s.brandDNA.icp);
  const brandDNA = useBrandStore((s) => s.brandDNA);
  const brandContext = useMemo(() => buildOfferBrandContext(brandDNA), [brandDNA]);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const ladder = offer.ladders[curLadder];
  const P: Product | undefined =
    curProduct !== null ? ladder?.products[curProduct] : undefined;

  const linkedRefs = P?.icpSegmentRefs ?? [];
  const linkedSegments = useMemo(
    () => icp.segments.filter((s) => linkedRefs.includes(s.name)),
    [icp.segments, linkedRefs],
  );

  const ctx: EnhanceContext = useMemo(
    () => ({
      who: P?.who,
      dream: P?.dream,
      offerName: P?.name || offer.offerName,
      segmentName: linkedSegments.map((s) => s.name).join(", ") || undefined,
      segmentPain: linkedSegments.flatMap((s) => s.pain ?? []),
      segmentGoals: linkedSegments.flatMap((s) => s.goals ?? []),
      segmentMindset: linkedSegments.flatMap((s) => s.mindset ?? []),
      segmentObjections: linkedSegments.flatMap((s) => s.objections ?? []),
      segmentTriggers: linkedSegments.flatMap((s) => s.triggers ?? []),
    }),
    [P?.who, P?.dream, P?.name, offer.offerName, linkedSegments],
  );


  // The guarantee's "result" is almost always the trimmed promise restated.
  // Prefill it from `trim` the first time the lead reaches the guarantee step
  // (fill-empty only — they can edit or clear it; the step still owns the
  // type / window / conditions / payback).
  const stepId = STEPS[current >= STEPS.length ? 0 : current]?.id;
  useEffect(() => {
    if (
      stepId === "guarantee" &&
      P &&
      !(P.guaranteeResult ?? "").trim() &&
      (P.trim ?? "").trim()
    ) {
      setProductField("guaranteeResult", P.trim);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId, P?.id]);

  if (!P) {
    return (
      <div className="ck-card p-6">
        <p className="text-text-secondary">No product selected.</p>
        <button
          type="button"
          onClick={() => setCurProduct(null)}
          className="ck-btn-secondary mt-3"
        >
          ← Back to ladder
        </button>
      </div>
    );
  }

  const step = STEPS[current >= STEPS.length ? 0 : current];

  // A free/lead-magnet product doesn't need the outrageous "magic-wand" promise
  // exercise — just the plain promise. (The promise itself stays; it feeds the
  // preview, exports, Brand DNA, and the guarantee prefill.)
  const isFree = tierOf(P.price)?.key === "free";

  // "No Guarantee" hides every guarantee field but the type selector.
  const noGuarantee = P.guaranteeType === "No Guarantee";

  const set = <K extends keyof Product>(key: K, value: Product[K]) =>
    setProductField(key, value);

  const onEnhance = (key: string, label: string, value: string) =>
    enhance(key, label, value, ctx);

  const fieldProps = (key: string) => ({
    fieldKey: `${P.id}.${key}`,
    onEnhance,
    onEnhanced: recordEnhancement,
    enhancing: enhancingKey === `${P.id}.${key}`,
  });

  const veqSet = (k: keyof Veq, v: number) => set("veq", { ...P.veq, [k]: v });

  // ── Pillars (high-ticket value-stack grouping) ──────────────────────────────
  const pillars = P.pillars || [];
  const setPillar = (i: number, patch: Partial<Pillar>) =>
    patchProduct({
      pillars: pillars.map((pl, j) => (j === i ? { ...pl, ...patch } : pl)),
    });
  const addPillar = () =>
    patchProduct({
      pillars: [...pillars, newPillar({ name: `Pillar ${pillars.length + 1}` })],
    });
  const removePillar = (i: number) =>
    patchProduct({ pillars: pillars.filter((_, j) => j !== i) });
  const togglePillars = (on: boolean) => {
    // Turning pillars ON for the first time: seed one pillar that carries over
    // any flat deliverables/bonuses the user already entered, so nothing is lost.
    if (on && pillars.length === 0) {
      const deliv = (P.deliverables || []).filter((d) => d.item || d.val);
      const bon = (P.bonuses || []).filter((b) => b.name || b.val);
      patchProduct({
        usePillars: true,
        pillars: [
          newPillar({
            name: "Pillar 1",
            deliverables: deliv.length ? deliv : [{ item: "", val: "" }],
            bonuses: bon.length ? bon : [{ name: "", val: "", why: "" }],
          }),
        ],
      });
    } else {
      patchProduct({ usePillars: on });
    }
  };

  const onProofUpload = async (files: FileList | null) => {
    if (!files) return;
    const room = PROOF_MAX - P.proofShots.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    const thumbs = await Promise.all(picked.map(readFileToThumb));
    if (thumbs.length) set("proofShots", [...P.proofShots, ...thumbs]);
  };

  const removeProof = (i: number) =>
    set("proofShots", P.proofShots.filter((_, j) => j !== i));

  const score = valueScore(P.veq);
  const sug = suggestVeq(P);
  const stack = stageValue(P);

  const nameFormula =
    NAME_FORMULAS.find((x) => x.key === P.nm.formula) || NAME_FORMULAS[0];
  const assembled = assembleName(P.nm);

  return (
    <div className="space-y-5">
      {/* TAB BAR — step navigation, grouped, horizontal */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setCurProduct(null)}
          className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
        >
          ← Back to ladder
        </button>
        <nav className="flex flex-wrap items-end gap-x-6 gap-y-1 border-b border-border overflow-x-auto">
          {STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrent(idx)}
              className={`-mb-px whitespace-nowrap border-b-2 pb-2.5 text-sm font-medium transition-colors ${
                idx === current
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {s.id === "magic" && isFree ? "Promise" : s.crumb}
            </button>
          ))}
        </nav>
      </div>

      {/* PANEL */}
      <div className="space-y-5">
        <div>
          <p className="text-xs text-text-tertiary mb-1">
            {P.name || "Untitled product"}
            {P.price ? ` · ${P.price}` : ""} — step {current + 1} of {STEPS.length}
          </p>
          <h2 className="text-xl font-bold text-text-primary">
            {step.id === "magic" && isFree ? "Promise" : step.title}
          </h2>
          <p className="text-sm text-text-secondary mt-1.5">
            {step.id === "magic" && isFree
              ? "The one realistic, specific promise this free offer makes."
              : step.lead}
          </p>
          {step.quote && (
            <p className="mt-3 pl-3 border-l-2 border-accent/40 text-sm italic text-text-tertiary">
              {step.quote}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {step.id === "bullseye" && (
            <>
              <IcpProfilePicker
                segments={icp.segments}
                selectedRefs={P.icpSegmentRefs ?? []}
                onChange={(selected) =>
                  patchProduct(icpSegmentsToProduct(selected, icp))
                }
              />
              <OfferField
                {...fieldProps("who")}
                label="Who is this product's dream prospect?"
                required
                hint="Be specific — the person, not 'everyone'."
                eg="Roofing-company owners doing $1M–$3M/yr who can't book enough qualified jobs."
                value={P.who}
                onChange={(v) => set("who", v)}
              />
              <OfferField
                {...fieldProps("where")}
                label="Where do you reach them?"
                hint="Channel / platform / list where they already gather."
                eg="Facebook groups for contractors; local trade shows."
                value={P.where}
                onChange={(v) => set("where", v)}
              />
              <OfferField
                {...fieldProps("dream")}
                label="Dream outcome — what do they ultimately crave?"
                type="textarea"
                required
                hint="The end result, stated in their words."
                eg="A calendar full of pre-qualified jobs so I can stop chasing leads."
                value={P.dream}
                onChange={(v) => set("dream", v)}
              />
              <OfferField
                {...fieldProps("emotion")}
                label="The core emotion / pain (the bullseye)"
                type="textarea"
                required
                hint="The fear, frustration, or desire that gets them out of bed."
                eg="Terror of slow months and missing payroll."
                value={P.emotion}
                onChange={(v) => set("emotion", v)}
              />
              <OfferField
                {...fieldProps("bait")}
                label="The bait / hook that pulls them in"
                hint="The specific thing you lead with to start the relationship."
                eg="Free 'Booked-Out Roofer' game plan."
                value={P.bait}
                onChange={(v) => set("bait", v)}
              />
            </>
          )}

          {step.id === "fb" && (
            <ListTable<FeatureBenefit>
              rows={P.features}
              columns={[
                { key: "f", label: "Feature", placeholder: "High-grade certified latex" },
                {
                  key: "b",
                  label: "Benefit(s) — what it does for them",
                  type: "textarea",
                  placeholder:
                    "Molds to your body → undisturbed sleep → wake with energy",
                },
              ]}
              onChange={(features) => patchProduct({ features })}
              addLabel="Add feature"
            />
          )}

          {step.id === "problems" && (
            <ListTable<ProblemSolution>
              rows={P.problems}
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
                    "Done-for-you lead-scoring system that flags sales-ready jobs",
                },
              ]}
              onChange={(problems) => patchProduct({ problems })}
              addLabel="Add problem"
            />
          )}

          {step.id === "magic" && (
            <>
              {/* The outrageous "magic-wand" exercise is skipped for free offers —
                  a freebie just needs its plain promise. */}
              {!isFree && (
                <OfferField
                  {...fieldProps("magic")}
                  label="🪄 Magic-wand promise — go outrageous (no rules)"
                  type="textarea"
                  required
                  hint="If there were no limits — the best result in the shortest time."
                  eg="I'll fill your calendar with 30 booked roofing jobs in 30 days or I pay YOU $10,000."
                  value={P.magic}
                  onChange={(v) => set("magic", v)}
                />
              )}
              <OfferField
                {...fieldProps("trim")}
                label={
                  isFree
                    ? "The promise — what they get from this free offer"
                    : "✂️ Trimmed promise — realistic, deliverable, lawsuit-proof"
                }
                type="textarea"
                required
                hint={
                  isFree
                    ? "The quick win this freebie delivers — keep it specific."
                    : "Keep it irresistible but make sure you can deliver it."
                }
                eg="10 pre-qualified roofing jobs in 60 days, or we work for free until you get them."
                value={P.trim}
                onChange={(v) => set("trim", v)}
              />
            </>
          )}

          {step.id === "resultmap" && (
            <ResultMap
              value={P.resultMap}
              onChange={(resultMap) => patchProduct({ resultMap })}
            />
          )}

          {step.id === "stack" && (
            <>
              <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                <OfferField
                  {...fieldProps("name")}
                  label="Product name"
                  required
                  hint="What this product is called on the ladder."
                  eg="Accelerator"
                  value={P.name}
                  onChange={(v) => set("name", v)}
                />
                <label className="flex flex-col gap-1.5">
                  <span className="ck-label !mb-0">Ladder price</span>
                  <input
                    type="text"
                    value={P.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="$1,500/mo · FREE"
                    className="ck-input"
                  />
                </label>
              </div>
              <OfferField
                {...fieldProps("desc")}
                label="One-line summary (shown on the product)"
                hint="What they get on this product, in a sentence."
                eg="Done-for-you ads, lead picking, weekly calls — the full machine."
                value={P.desc}
                onChange={(v) => set("desc", v)}
              />
              {/* Pillars toggle — high-ticket offers group the stack into pillars */}
              <label className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={P.usePillars}
                  onChange={(e) => togglePillars(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-accent)] shrink-0"
                />
                <span>
                  <span className="text-sm font-medium text-text-primary">
                    Structure as pillars
                  </span>
                  <span className="block text-xs text-text-tertiary mt-0.5">
                    Recommended for high-ticket. Group the offer into themed
                    pillars, each with its own promise, deliverables and bonuses.
                  </span>
                </span>
              </label>

              {!P.usePillars ? (
                <>
                  <div>
                    <p className="ck-label">Deliverables on this product</p>
                    <ListTable<Deliverable>
                      rows={P.deliverables}
                      columns={[
                        { key: "item", label: "Deliverable", placeholder: "Done-for-you ad campaigns" },
                        { key: "val", label: "Value ($)", type: "number", placeholder: "4000" },
                      ]}
                      onChange={(deliverables) => patchProduct({ deliverables })}
                      addLabel="Add deliverable"
                    />
                  </div>
                  <div>
                    <p className="ck-label">Bonuses on this product</p>
                    <ListTable<Bonus>
                      rows={P.bonuses}
                      columns={[
                        { key: "name", label: "Bonus", placeholder: "Outreach script pack" },
                        { key: "val", label: "Value ($)", type: "number", placeholder: "500" },
                        {
                          key: "why",
                          label: "Why it removes a problem",
                          type: "textarea",
                          placeholder: "Removes the 'what do I say to leads' fear",
                        },
                      ]}
                      onChange={(bonuses) => patchProduct({ bonuses })}
                      addLabel="Add bonus"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {pillars.map((pl, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-border p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                          Pillar {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePillar(i)}
                          className="text-xs text-text-tertiary hover:text-danger transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1.5">
                          <span className="ck-label !mb-0">Pillar name</span>
                          <input
                            type="text"
                            value={pl.name}
                            onChange={(e) => setPillar(i, { name: e.target.value })}
                            placeholder="The Client-Getting Machine"
                            className="ck-input"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="ck-label !mb-0">
                            Promise (what they get)
                          </span>
                          <input
                            type="text"
                            value={pl.promise}
                            onChange={(e) =>
                              setPillar(i, { promise: e.target.value })
                            }
                            placeholder="A predictable flow of booked calls"
                            className="ck-input"
                          />
                        </label>
                      </div>
                      <div>
                        <p className="ck-label">Deliverables in this pillar</p>
                        <ListTable<Deliverable>
                          rows={pl.deliverables}
                          columns={[
                            { key: "item", label: "Deliverable", placeholder: "Done-for-you ad campaigns" },
                            { key: "val", label: "Value ($)", type: "number", placeholder: "4000" },
                          ]}
                          onChange={(deliverables) =>
                            setPillar(i, { deliverables })
                          }
                          addLabel="Add deliverable"
                        />
                      </div>
                      <div>
                        <p className="ck-label">Bonuses in this pillar</p>
                        <ListTable<Bonus>
                          rows={pl.bonuses}
                          columns={[
                            { key: "name", label: "Bonus", placeholder: "Outreach script pack" },
                            { key: "val", label: "Value ($)", type: "number", placeholder: "500" },
                            {
                              key: "why",
                              label: "Why it removes a problem",
                              type: "textarea",
                              placeholder: "Removes the 'what do I say to leads' fear",
                            },
                          ]}
                          onChange={(bonuses) => setPillar(i, { bonuses })}
                          addLabel="Add bonus"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPillar}
                    className="ck-btn-secondary w-full"
                  >
                    + Add pillar
                  </button>
                </div>
              )}
              <label className="flex flex-col gap-1.5">
                <span className="ck-label !mb-0">Payment note (optional)</span>
                <input
                  type="text"
                  value={P.payment}
                  onChange={(e) => set("payment", e.target.value)}
                  placeholder="$1,500/mo, or pay quarterly ($4,000) and save a month."
                  className="ck-input"
                />
              </label>
              {stack > 0 && (
                <p className="text-sm text-text-secondary">
                  Stacked value on this product:{" "}
                  <b className="text-accent">{money(stack)}</b>
                </p>
              )}
            </>
          )}

          {step.id === "rationale" && (
            <OfferField
              {...fieldProps("rationale")}
              label="Why is this product so good? (the credible reason)"
              type="textarea"
              required
              hint="Introductory offer? Better model? Lower costs? Must be believable."
              eg="We only take 5 new roofers a quarter because we reinvest the first month's results into case studies."
              value={P.rationale}
              onChange={(v) => set("rationale", v)}
            />
          )}

          {step.id === "value" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <OfferField
                  {...fieldProps("priceProof")}
                  label="Proof people paid full price"
                  type="textarea"
                  hint="Screenshots, # of buyers, testimonials — show don't tell."
                  eg="42 contractors paid $12,000 for this exact build."
                  value={P.priceProof}
                  onChange={(v) => set("priceProof", v)}
                />
                <OfferField
                  {...fieldProps("anchorCompare")}
                  label="Make the real price sound trivial"
                  type="textarea"
                  hint="'Cheaper than a daily coffee', a pizza…"
                  eg="Less than a week of truck fuel — and it books a single $9k job."
                  value={P.anchorCompare}
                  onChange={(v) => set("anchorCompare", v)}
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
                  {P.proofShots.map((src, i) => (
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
                  {P.proofShots.length < PROOF_MAX && (
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
                label="The real price you'll charge today ($)"
                type="number"
                required
                hint="Aim ~10% of the stacked value on this product."
                eg="1500 (vs $14,000 stacked value)"
                value={P.realPrice}
                onChange={(v) => set("realPrice", v)}
              />

              {stack > 0 && (
                <p className="text-sm text-text-secondary">
                  Stacked value on this product:{" "}
                  <b className="text-accent">{money(stack)}</b>
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
                      value={P.veq[k]}
                      onChange={(e) => veqSet(k, +e.target.value)}
                      className="ck-range flex-1"
                    />
                    <span className="text-sm font-medium text-text-primary w-8 text-right">
                      {(+P.veq[k]).toFixed(1)}
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
                  onClick={() => set("veq", sug)}
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

          {step.id === "guarantee" && (
            <>
              <OfferField
                {...fieldProps("guaranteeType")}
                label="Guarantee type"
                type="select"
                required
                options={GUARANTEE_TYPES}
                value={P.guaranteeType}
                onChange={(v) => set("guaranteeType", v)}
              />
              {!noGuarantee && (
                <>
                  <OfferField
                    {...fieldProps("guaranteeResult")}
                    label="The specific result you guarantee"
                    type="textarea"
                    required
                    hint="Tie it to an outcome — not 'satisfaction guaranteed'."
                    eg="10 pre-qualified roofing jobs in 60 days or we work for free until you get them."
                    value={P.guaranteeResult}
                    onChange={(v) => set("guaranteeResult", v)}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <OfferField
                      {...fieldProps("guaranteeWindow")}
                      label="Timeframe / window"
                      hint="How long they have to hit the result."
                      eg="60 days"
                      value={P.guaranteeWindow}
                      onChange={(v) => set("guaranteeWindow", v)}
                    />
                    {/* "What the client must prove" — only for paid offers. */}
                    {!isFree && (
                      <OfferField
                        {...fieldProps("guaranteeProofReq")}
                        label="What the client must prove"
                        hint="For conditional guarantees."
                        eg="Show you ran every campaign and answered leads within 10 minutes."
                        value={P.guaranteeProofReq}
                        onChange={(v) => set("guaranteeProofReq", v)}
                      />
                    )}
                  </div>
                  {/* "Your payback / plan B" — only for paid offers. */}
                  {!isFree && (
                    <OfferField
                      {...fieldProps("pgPayback")}
                      label="Your payback / plan B"
                      type="textarea"
                      hint="What happens when a client isn't satisfied?"
                      eg="If under 10 jobs in 60 days, we work free until they hit it AND refund that month."
                      value={P.pgPayback}
                      onChange={(v) => set("pgPayback", v)}
                    />
                  )}
                </>
              )}
            </>
          )}

          {step.id === "scarcity" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <OfferField
                  {...fieldProps("scarcityType")}
                  label="Scarcity type"
                  type="select"
                  required
                  options={SCARCITY_TYPES}
                  value={P.scarcityType}
                  onChange={(v) => set("scarcityType", v)}
                />
                <OfferField
                  {...fieldProps("urgencyType")}
                  label="Urgency type"
                  type="select"
                  options={URGENCY_TYPES}
                  value={P.urgencyType}
                  onChange={(v) => set("urgencyType", v)}
                />
              </div>
              <OfferField
                {...fieldProps("scarcityDetail")}
                label="The legit constraint (be honest)"
                type="textarea"
                required
                hint="Real cap, real deadline, real waitlist."
                eg="We onboard exactly 5 roofers per quarter — 2 spots left for this cohort."
                value={P.scarcityDetail}
                onChange={(v) => set("scarcityDetail", v)}
              />
            </>
          )}

          {step.id === "obj" && (
            <>
              <p className="text-sm text-text-tertiary">
                List them all, then make sure your top 3 are crushed.
              </p>
              <ListTable<Objection>
                rows={P.objections}
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
                      "That's exactly why we work for free until you get jobs — we carry the risk.",
                  },
                ]}
                onChange={(objections) => patchProduct({ objections })}
                addLabel="Add objection"
              />
              <OfferField
                {...fieldProps("leadAdd")}
                label="Lead the offer — what can you ADD to make it more irresistible?"
                type="textarea"
                hint="What one addition removes the last hesitation?"
                eg="Add a 'we build your follow-up system free' so they never lose a lead."
                value={P.leadAdd}
                onChange={(v) => set("leadAdd", v)}
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
                  value={P.nm.formula}
                  onChange={(e) => set("nm", { formula: e.target.value, parts: {} })}
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
                {nameFormula.parts.map((part) => (
                  <OfferField
                    key={part.key}
                    {...fieldProps(`nm.parts.${part.key}`)}
                    label={part.label}
                    hint={part.hint}
                    eg={part.eg}
                    value={P.nm.parts[part.key] || ""}
                    onChange={(v) =>
                      set("nm", {
                        ...P.nm,
                        parts: { ...P.nm.parts, [part.key]: v },
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
                    onClick={() => set("name", assembled)}
                    className="text-xs font-medium text-accent hover:text-accent-hover transition-colors ml-1"
                  >
                    Use this →
                  </button>
                </p>
              )}

              <OfferField
                {...fieldProps("name")}
                label="✅ Final product name"
                required
                hint="Use the assembled suggestion, or write your own."
                eg="The Booked-Out Roofer 30-Day Accelerator"
                value={P.name}
                onChange={(v) => set("name", v)}
              />
            </>
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
          {current === STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurProduct(null)}
              className="ck-btn-primary"
            >
              Done — back to ladder
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrent(Math.min(STEPS.length - 1, current + 1))}
              className="ck-btn-primary"
            >
              Next →
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-40 ck-btn-primary rounded-full shadow-lg px-5 py-3 text-sm font-semibold inline-flex items-center gap-2"
      >
        ✨ Assistant
      </button>
      <OfferAssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        product={P ?? null}
        brandContext={brandContext}
        onApply={patchProduct}
      />
    </div>
  );
}
