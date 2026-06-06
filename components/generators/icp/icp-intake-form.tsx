"use client";

import { useState } from "react";
import type { Intake, SegmentInput } from "@/lib/icp/schema";
import { CHANNELS, TONES } from "@/lib/icp/schema";
import {
  useIcpDraftStore,
  blankSegment,
  type IcpSegmentDraft,
} from "@/lib/icp/store";
import { IcpChipSelector } from "./icp-chip-selector";

const SEGMENT_FIELDS: {
  key: keyof SegmentInput;
  label: string;
  placeholder: string;
  color: string;
}[] = [
  {
    key: "pain",
    label: "Pain Points",
    placeholder:
      "What specific problems, frustrations, and struggles does this person face? Be visceral and specific.",
    color: "var(--color-icp-pain)",
  },
  {
    key: "goals",
    label: "Goals & Desired Outcomes",
    placeholder:
      "What do they desperately want to achieve? What does success look like for them?",
    color: "var(--color-icp-goals)",
  },
  {
    key: "mindset",
    label: "Mindset & Beliefs",
    placeholder:
      "How do they think about their situation? What beliefs, biases, or mental models shape their decisions?",
    color: "var(--color-icp-mindset)",
  },
  {
    key: "emotional",
    label: "Emotional Fingerprint",
    placeholder:
      "What emotion dominates their inner world? How does it affect how they research and buy?",
    color: "var(--color-icp-emotion)",
  },
  {
    key: "triggers",
    label: "Buying Triggers",
    placeholder:
      "What specific events or moments make them ready to buy NOW? Not personality traits — specific situations.",
    color: "var(--color-icp-trigger)",
  },
  {
    key: "objections",
    label: "Objections",
    placeholder:
      "What reasons will they give themselves NOT to buy? Include both rational and emotional objections.",
    color: "var(--color-icp-objection)",
  },
];

const SEG_DOT = [
  "var(--color-icp-objection)",
  "var(--color-icp-trigger)",
  "var(--color-icp-mindset)",
  "var(--color-icp-emotion)",
  "var(--color-icp-goals)",
  "var(--color-icp-pain)",
];

function SegmentCard({
  seg,
  index,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: {
  seg: IcpSegmentDraft;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (updates: Partial<SegmentInput>) => void;
  onRemove: () => void;
}) {
  const color = SEG_DOT[index % SEG_DOT.length];

  return (
    <div className="ck-card overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: color }}
        >
          {index + 1}
        </div>
        <input
          type="text"
          value={seg.name}
          onChange={(e) => onChange({ name: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="Segment name, e.g. The Hungry Beginner"
          className="ck-input flex-1 !py-2 font-semibold"
        />
        <svg
          className={`w-4 h-4 text-text-tertiary shrink-0 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {index > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-text-tertiary hover:text-danger transition-colors shrink-0"
            aria-label="Remove segment"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-4">
          {SEGMENT_FIELDS.map(({ key, label, placeholder, color: c }) => (
            <label key={key} className="flex flex-col gap-1.5">
              <span
                className="text-xs font-bold tracking-wide uppercase"
                style={{ color: c }}
              >
                {label}
              </span>
              <textarea
                value={seg[key]}
                onChange={(e) => onChange({ [key]: e.target.value })}
                placeholder={placeholder}
                rows={3}
                className="ck-input resize-none"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function IcpIntakeForm({
  submitting,
  error,
  onSubmit,
}: {
  submitting: boolean;
  error: string | null;
  onSubmit: (intake: Intake) => void;
}) {
  const {
    formData,
    segments,
    logoDataUrl,
    setFormData,
    setSegments,
    setLogo,
  } = useIcpDraftStore();
  const [step, setStep] = useState<"a" | "b">("a");
  const [expandedId, setExpandedId] = useState<string>(
    segments[0]?._id ?? "",
  );

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      alert("Logo must be under 1MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const canProceed =
    (formData.businessName?.trim().length ?? 0) > 0 &&
    (formData.industry?.trim().length ?? 0) > 0 &&
    (formData.whatYouDo?.trim().length ?? 0) >= 10 &&
    (formData.offer?.trim().length ?? 0) >= 10 &&
    (formData.channels?.length ?? 0) > 0 &&
    (formData.tone?.length ?? 0) > 0;

  const canSubmit = segments.every(
    (s) =>
      s.name.trim() &&
      s.pain.trim() &&
      s.goals.trim() &&
      s.mindset.trim() &&
      s.emotional.trim() &&
      s.objections.trim() &&
      s.triggers.trim(),
  );

  const updateSegment = (id: string, updates: Partial<SegmentInput>) =>
    setSegments(segments.map((s) => (s._id === id ? { ...s, ...updates } : s)));

  const removeSegment = (id: string) =>
    setSegments(segments.filter((s) => s._id !== id));

  const addSegment = () => {
    const seg = blankSegment(segments.length + 1);
    setSegments([...segments, seg]);
    setExpandedId(seg._id);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload: Intake = {
      businessName: formData.businessName!,
      logoDataUrl,
      whatYouDo: formData.whatYouDo!,
      industry: formData.industry!,
      offer: formData.offer!,
      channels: formData.channels!,
      tone: formData.tone!,
      brandReference: formData.brandReference ?? "",
      socialProof: formData.socialProof ?? "",
      segments: segments.map(({ _id, ...rest }) => {
        void _id;
        return rest;
      }),
    };
    onSubmit(payload);
  };

  return (
    <div>
      {/* Step tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setStep("a")}
          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
            step === "a"
              ? "text-text-primary bg-surface border border-border"
              : "text-text-tertiary hover:text-text-primary"
          }`}
        >
          1 · Your Business
        </button>
        <button
          type="button"
          onClick={() => canProceed && setStep("b")}
          disabled={!canProceed}
          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
            step === "b"
              ? "text-text-primary bg-surface border border-border"
              : "text-text-tertiary hover:text-text-primary"
          } ${!canProceed ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          2 · Segments
        </button>
      </div>

      {step === "a" ? (
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="ck-label !mb-0">
              Business Name <span className="text-danger">*</span>
            </span>
            <input
              type="text"
              value={formData.businessName ?? ""}
              onChange={(e) => setFormData({ businessName: e.target.value })}
              placeholder="e.g. Facebook Ads Domination"
              className="ck-input"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="ck-label !mb-0">
              Logo{" "}
              <span className="text-text-tertiary font-normal">(optional)</span>
            </span>
            <div className="flex items-center gap-3">
              {logoDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoDataUrl}
                  alt="Logo preview"
                  className="h-10 w-auto object-contain rounded"
                />
              )}
              <label className="cursor-pointer px-4 py-2 rounded-lg border border-dashed border-border hover:border-border-hover text-sm text-text-tertiary hover:text-text-primary transition-all">
                {logoDataUrl ? "Change logo" : "Upload logo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </label>
              {logoDataUrl && (
                <button
                  type="button"
                  onClick={() => setLogo(undefined)}
                  className="text-xs text-text-tertiary hover:text-danger transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="ck-label !mb-0">
              Industry <span className="text-danger">*</span>
            </span>
            <input
              type="text"
              value={formData.industry ?? ""}
              onChange={(e) => setFormData({ industry: e.target.value })}
              placeholder="e.g. Digital Marketing Education"
              className="ck-input"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="ck-label !mb-0">
              What you do <span className="text-danger">*</span>
            </span>
            <textarea
              value={formData.whatYouDo ?? ""}
              onChange={(e) => setFormData({ whatYouDo: e.target.value })}
              placeholder="Describe your business in 1–3 sentences. What problem do you solve, and for whom?"
              rows={3}
              className="ck-input resize-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="ck-label !mb-0">
              Core offer <span className="text-danger">*</span>
            </span>
            <textarea
              value={formData.offer ?? ""}
              onChange={(e) => setFormData({ offer: e.target.value })}
              placeholder="Describe the specific product or service this ICP map is for."
              rows={3}
              className="ck-input resize-none"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="ck-label !mb-0">
              Marketing channels <span className="text-danger">*</span>
            </span>
            <p className="ck-sublabel !mb-0">Where do your customers find you?</p>
            <IcpChipSelector
              options={CHANNELS}
              selected={formData.channels ?? []}
              onChange={(channels) => setFormData({ channels })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="ck-label !mb-0">
              Brand tone <span className="text-danger">*</span>
            </span>
            <p className="ck-sublabel !mb-0">
              Select up to 3 that best describe your brand voice.
            </p>
            <IcpChipSelector
              options={TONES}
              selected={formData.tone ?? []}
              onChange={(tone) => setFormData({ tone })}
              max={3}
            />
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="ck-label !mb-0">
              Brand references{" "}
              <span className="text-text-tertiary font-normal">(optional)</span>
            </span>
            <input
              type="text"
              value={formData.brandReference ?? ""}
              onChange={(e) => setFormData({ brandReference: e.target.value })}
              placeholder="Brands with a similar tone or style, e.g. Alex Hormozi, Notion, Oatly"
              className="ck-input"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="ck-label !mb-0">
              Social proof{" "}
              <span className="text-text-tertiary font-normal">(optional)</span>
            </span>
            <textarea
              value={formData.socialProof ?? ""}
              onChange={(e) => setFormData({ socialProof: e.target.value })}
              placeholder="Key results, testimonials, or case studies. This shapes how Claude frames your authority."
              rows={2}
              className="ck-input resize-none"
            />
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep("b")}
              disabled={!canProceed}
              className="ck-btn-primary"
            >
              Continue to Segments →
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {segments.map((seg, idx) => (
              <SegmentCard
                key={seg._id}
                seg={seg}
                index={idx}
                expanded={expandedId === seg._id}
                onToggle={() =>
                  setExpandedId(expandedId === seg._id ? "" : seg._id)
                }
                onChange={(updates) => updateSegment(seg._id, updates)}
                onRemove={() => removeSegment(seg._id)}
              />
            ))}
          </div>

          {segments.length < 6 && (
            <button
              type="button"
              onClick={addSegment}
              className="flex items-center gap-2 self-start px-4 py-2.5 rounded-lg border border-dashed border-border hover:border-border-hover text-sm font-medium text-text-primary transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 3v10M3 8h10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Add another segment
            </button>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-danger/30 bg-danger/[0.06] text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("a")}
              className="ck-btn-secondary"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="ck-btn-primary"
            >
              {submitting ? (
                <>
                  <span className="relative h-4 w-4">
                    <span className="absolute inset-0 rounded-full border-2 border-white/30" />
                    <span className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  </span>
                  Synthesising psychology…
                </>
              ) : (
                "Generate ICP Map →"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
