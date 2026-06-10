"use client";

import { useState } from "react";

import type { BrandDNA } from "@/types/brand";
import { useBrandStore } from "@/lib/brand/store";
import { MarkdownRenderer } from "@/components/generators/markdown-renderer";

type Seed = (b: BrandDNA) => Record<string, string>;

const DESTINATIONS = [
  "A freebie (keyword → I send it)",
  "Book a free consultation (keyword → I book you in)",
];

const SOCIAL_PROOF_KEY = "Social proof — results & people you've helped";

// My Story — the 6-beat story arc (Intro → Resolution) + proof + CTA setup.
// Reused for the About Me pinned post.
const myStorySeed: Seed = (b) => ({
  "1. Intro — the problem you (or a client) had": b.icp.painPoints[0] || b.story.originStory || "",
  "2. Inflection — the pains that problem caused": b.icp.painPoints.slice(1, 3).join("; ") || "",
  "3. Rising action — failed solutions you tried": b.icp.failedSolutions.join("; ") || "",
  "4. Climax — the solution you found": b.positioning.uniqueMechanism || b.offer.grandSlamDescription || "",
  "5. Falling action — the results you saw": b.offer.perceivedLikelihood || b.offer.dreamOutcome || "",
  "6. Resolution — your business + the dream result": b.offer.dreamOutcome || "",
  [SOCIAL_PROOF_KEY]: b.offer.perceivedLikelihood || "",
  "Where to send them": DESTINATIONS[0],
  "Trigger keyword (e.g. STORY)": "",
  "The freebie / what you'll send (if freebie)": "",
});

// How I Can Help — who you help + process + problems + results + proof.
const helpSeed: Seed = (b) => ({
  "Who you work with": b.icp.industryLabel || b.icp.demographics.jobTitle || "",
  "Your process / method": b.positioning.uniqueMechanism || b.offer.deliveryModel || "",
  "The exact problems you solve": b.icp.painPoints.slice(0, 3).join("; ") || "",
  "Results to expect": b.offer.dreamOutcome || "",
  [SOCIAL_PROOF_KEY]: b.offer.perceivedLikelihood || "",
  "DM trigger keyword (e.g. HELP)": "",
});

// What to Expect — the 5-part client-journey structure + proof + CTA keyword.
const expectSeed: Seed = (b) => ({
  "1. The moment they become a client": b.offer.deliveryModel || "",
  "2. Your onboarding steps": "",
  "3. The transformation process": b.offer.grandSlamDescription || b.positioning.uniqueMechanism || "",
  "4. The dream result": b.offer.dreamOutcome || "",
  "5. The timeframe": b.offer.timeDelay || "",
  [SOCIAL_PROOF_KEY]: b.offer.perceivedLikelihood || "",
  "Comment keyword (e.g. START)": "",
});

interface GenItem {
  key: string;
  label: string;
  subtitle: string;
  formats: { value: string; label: string }[];
  seed: Seed;
  selects?: Record<string, string[]>;
  saveSocialProof?: boolean;
}

interface GuideItem {
  label: string;
  subtitle: string;
  bullets: string[];
}

const HL_FORMATS = [{ value: "highlight", label: "Highlight" }];
const PIN_FORMATS = [
  { value: "carousel", label: "Carousel" },
  { value: "reel", label: "Reel" },
];

const HIGHLIGHTS_GEN: GenItem[] = [
  {
    key: "my-story",
    label: "My Story",
    subtitle: "The 6-beat story (10–15 frames) → social proof → one end CTA (reply your keyword).",
    formats: HL_FORMATS,
    seed: myStorySeed,
    selects: { "Where to send them": DESTINATIONS },
    saveSocialProof: true,
  },
  {
    key: "how-i-help",
    label: "How I Can Help",
    subtitle: "Who you help, process, problems, results (10–15 frames) → social proof → comment-to-book CTA.",
    formats: HL_FORMATS,
    seed: helpSeed,
    saveSocialProof: true,
  },
];

const HIGHLIGHTS_GUIDE: GuideItem[] = [
  {
    label: "Testimonials / Results",
    subtitle: "What to put in this highlight",
    bullets: [
      "Screenshots of client wins & messages",
      "Short video clips / played voice notes",
      "Before → after numbers or visuals",
      "One-line case studies (problem → result)",
    ],
  },
  {
    label: "Free Stuff",
    subtitle: "What to put in this highlight",
    bullets: [
      "Your lead magnet (guide, checklist, template)",
      "Your best free YouTube videos / trainings",
      "A free mini-course or challenge",
      "Webinar invite or free community link",
    ],
  },
];

const PINNED_GEN: GenItem[] = [
  {
    key: "about-me",
    label: "About Me (My Story)",
    subtitle: "The 6-beat story as a pinned post + social proof → comment-to-get CTA.",
    formats: PIN_FORMATS,
    seed: myStorySeed,
    selects: { "Where to send them": DESTINATIONS },
    saveSocialProof: true,
  },
  {
    key: "what-to-expect",
    label: "What to Expect Working With Me",
    subtitle: "The 5-part journey + social proof → comment-to-book-a-consult CTA.",
    formats: PIN_FORMATS,
    seed: expectSeed,
    saveSocialProof: true,
  },
];

const PINNED_GUIDE: GuideItem[] = [
  {
    label: "Social Proof / Lead Magnet CTA",
    subtitle: "What to put in this pinned post",
    bullets: [
      "A social-proof carousel (results, testimonials), OR",
      "A direct CTA for your lead magnet (DM keyword to get it)",
      "Make the first slide the scroll-stopper",
      "End with one clear next step",
    ],
  },
];

function ContentItem({ item, brandDNA }: { item: GenItem; brandDNA: BrandDNA }) {
  const updatePillar = useBrandStore((s) => s.updatePillar);
  const [fields, setFields] = useState<Record<string, string>>(() => item.seed(brandDNA));
  const [format, setFormat] = useState(item.formats[0].value);
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setFields((p) => ({ ...p, [k]: v }));

  const run = async () => {
    setLoading(true);
    setError(null);
    setScript(null);
    // Persist the social proof back to Brand DNA so it sticks for next time.
    if (item.saveSocialProof) {
      const proof = fields[SOCIAL_PROOF_KEY]?.trim();
      if (proof) updatePillar("offer", { perceivedLikelihood: proof });
    }
    try {
      const res = await fetch("/api/instagram/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: item.key, format, fields, brandDNA }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed");
      setScript(data.script as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const activeLabel = item.formats.find((f) => f.value === format)?.label ?? "";
  const showFormatToggle = item.formats.length > 1;

  return (
    <div className="ck-card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-text-primary">{item.label}</h3>
        <p className="text-xs text-text-tertiary">{item.subtitle}</p>
      </div>

      <div className="space-y-3">
        {Object.entries(fields).map(([k, v]) => {
          const options = item.selects?.[k];
          return (
            <label key={k} className="block">
              <span className="text-xs text-text-secondary">{k}</span>
              {options ? (
                <select
                  className="ck-input mt-1"
                  value={v}
                  onChange={(e) => set(k, e.target.value)}
                >
                  {options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <textarea
                  className="ck-input mt-1 resize-y"
                  rows={2}
                  value={v}
                  onChange={(e) => set(k, e.target.value)}
                />
              )}
            </label>
          );
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {showFormatToggle && (
          <div className="inline-flex rounded-lg border border-border p-0.5">
            {item.formats.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFormat(f.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  format === f.value ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="ck-btn-primary !py-1.5 !px-4 text-sm disabled:opacity-50"
        >
          {loading ? "Generating…" : `Generate ${activeLabel}`}
        </button>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>

      {script && (
        <div className="rounded-lg border border-border bg-surface-hover/40 p-4">
          <MarkdownRenderer content={script} />
        </div>
      )}
    </div>
  );
}

function GuidanceCard({ item }: { item: GuideItem }) {
  return (
    <div className="ck-card p-5">
      <h3 className="text-sm font-semibold text-text-primary">{item.label}</h3>
      <p className="text-xs text-text-tertiary mb-3">{item.subtitle}</p>
      <ul className="space-y-1.5">
        {item.bullets.map((b, i) => (
          <li key={i} className="text-sm text-text-secondary flex gap-2">
            <span className="text-accent shrink-0">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BioContentTab({ kind, brandDNA }: { kind: "highlights" | "pinned"; brandDNA: BrandDNA }) {
  const gen = kind === "highlights" ? HIGHLIGHTS_GEN : PINNED_GEN;
  const guide = kind === "highlights" ? HIGHLIGHTS_GUIDE : PINNED_GUIDE;
  return (
    <div className="space-y-4">
      {gen.map((item) => (
        <ContentItem key={item.key} item={item} brandDNA={brandDNA} />
      ))}
      {guide.map((item) => (
        <GuidanceCard key={item.label} item={item} />
      ))}
    </div>
  );
}
