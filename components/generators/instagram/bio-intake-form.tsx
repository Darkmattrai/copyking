"use client";

import { useState } from "react";

import type { BrandDNA } from "@/types/brand";

const LINK_DESTINATIONS = [
  "YouTube video (nurture the audience)",
  "Book a free consultation",
  "Webinar invite",
  "Lead magnet (free download)",
  "Low-ticket offer",
];

// Pre-fill the intake from Brand DNA where we can — the user reviews/edits.
function seedFromDNA(b: BrandDNA) {
  return {
    identity: b.niche.subNiche || b.niche.marketCategory || b.positioning.categoryOwned || "",
    audience: b.icp.industryLabel || b.icp.demographics.jobTitle || "",
    outcome: b.offer.dreamOutcome || b.icp.dreamOutcome || "",
    method: b.positioning.uniqueMechanism || b.offer.deliveryModel || "",
    timeframe: b.offer.timeDelay || "",
    dmWord: "",
    dmValue: "",
    linkDestination: LINK_DESTINATIONS[1],
    linkUrl: "",
  };
}

type Fields = ReturnType<typeof seedFromDNA>;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">{title}</h3>
        {hint && <p className="text-[11px] text-text-tertiary">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-text-secondary">{label}</span>
      <input
        className="ck-input mt-1"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

interface Props {
  brandDNA: BrandDNA;
  isLoading: boolean;
  brandIsEmpty: boolean;
  onSubmit: (params: Record<string, string>) => void;
  onQuickGenerate: () => void;
}

// Guided bio intake — grouped into the 4 lines of the bio, pre-filled from
// Brand DNA. Instagram bios cap at 150 characters; the generator enforces it.
export function BioIntakeForm({ brandDNA, isLoading, brandIsEmpty, onSubmit, onQuickGenerate }: Props) {
  const [f, setF] = useState<Fields>(() => seedFromDNA(brandDNA));
  const set = (k: keyof Fields, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const params: Record<string, string> = {};
    const add = (label: string, val: string) => {
      if (val.trim()) params[label] = val.trim();
    };
    add("Identity / title", f.identity);
    add("Who you help (audience)", f.audience);
    add("Outcome they get", f.outcome);
    add("Method / how", f.method);
    add("Timeframe", f.timeframe);
    add("DM trigger word", f.dmWord);
    add("What they get for DMing", f.dmValue);
    add("Bio link destination", f.linkDestination);
    add("Bio link URL", f.linkUrl);
    onSubmit(params);
  };

  return (
    <div className="ck-card p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Build your bio</h2>
        <p className="text-sm text-text-tertiary">
          Answer these (pre-filled from your Brand DNA — edit anything). Instagram
          bios cap at <strong className="text-text-secondary">150 characters</strong>,
          so every version stays within it.
        </p>
      </div>

      <Section title="Who you are" hint="Line 1–2 of your bio">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Identity / title" placeholder="e.g. Marketing Consultant" value={f.identity} onChange={(v) => set("identity", v)} />
          <Field label="Who you help" placeholder="e.g. service-based solopreneurs" value={f.audience} onChange={(v) => set("audience", v)} />
        </div>
      </Section>

      <Section title="Your promise" hint="The one-liner: outcome + method + timeframe">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Outcome" placeholder="e.g. consistent $10k months" value={f.outcome} onChange={(v) => set("outcome", v)} />
          <Field label="Method" placeholder="e.g. with organic content" value={f.method} onChange={(v) => set("method", v)} />
          <Field label="Timeframe" placeholder="e.g. in 90 days" value={f.timeframe} onChange={(v) => set("timeframe", v)} />
        </div>
      </Section>

      <Section title="Your hook" hint="The DM trigger for your ManyChat automation">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="DM trigger word" placeholder="e.g. GROWTH" value={f.dmWord} onChange={(v) => set("dmWord", v)} />
          <Field label="What they get for DMing" placeholder="e.g. free 7-figure playbook" value={f.dmValue} onChange={(v) => set("dmValue", v)} />
        </div>
      </Section>

      <Section title="Your link" hint="Where the bio link should send people">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-text-secondary">Destination</span>
            <select
              className="ck-input mt-1"
              value={f.linkDestination}
              onChange={(e) => set("linkDestination", e.target.value)}
            >
              {LINK_DESTINATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <Field label="Link URL (optional)" placeholder="https://…" value={f.linkUrl} onChange={(v) => set("linkUrl", v)} />
        </div>
      </Section>

      <div className="flex items-center gap-4 flex-wrap pt-1">
        <button
          type="button"
          onClick={submit}
          disabled={isLoading || brandIsEmpty}
          className="ck-btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2"
        >
          Generate my bio
        </button>
        <button
          type="button"
          onClick={onQuickGenerate}
          disabled={isLoading || brandIsEmpty}
          className="text-xs text-text-tertiary hover:text-accent transition-colors disabled:opacity-50"
        >
          Skip — quick-generate from Brand DNA
        </button>
      </div>
    </div>
  );
}
