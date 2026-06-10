"use client";

import { useState } from "react";

import { useRole } from "@/lib/auth/use-role";
import type { IgAudit } from "@/lib/instagram/audit";

type Status = "good" | "needs-work" | "missing" | "not-provided";
type Finding = { status: Status; comment: string };

const STATUS_STYLE: Record<Status, { dot: string; label: string }> = {
  good: { dot: "bg-emerald-400", label: "Good" },
  "needs-work": { dot: "bg-amber-400", label: "Needs work" },
  missing: { dot: "bg-red-400", label: "Missing" },
  "not-provided": { dot: "bg-text-tertiary", label: "Not provided" },
};

function FindingRow({ label, finding }: { label: string; finding: Finding }) {
  const s = STATUS_STYLE[finding.status] ?? STATUS_STYLE["not-provided"];
  return (
    <div className="flex gap-2.5">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
      <div className="min-w-0">
        <div className="text-sm font-medium text-text-primary">
          {label} <span className="text-text-tertiary font-normal">· {s.label}</span>
        </div>
        <p className="text-sm text-text-secondary leading-snug">{finding.comment}</p>
      </div>
    </div>
  );
}

const GRADE_COLOR: Record<string, string> = {
  A: "bg-emerald-500",
  B: "bg-lime-500",
  C: "bg-amber-500",
  D: "bg-orange-500",
  F: "bg-red-500",
};

const EMPTY = {
  name: "",
  username: "",
  bio: "",
  link: "",
  businessModel: "",
  pinnedPosts: "",
  highlights: "",
  profileImageNote: "",
};

// Audits an Instagram profile against the agency rubric. Paste the fields for
// now; once a client connects their account this will auto-fill from the live
// profile. Admin-gated until the Meta integration opens to clients.
export function ProfileAudit() {
  const role = useRole();
  const [form, setForm] = useState({ ...EMPTY });
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [audit, setAudit] = useState<IgAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (role !== "admin") return null;

  const set = (k: keyof typeof EMPTY, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onScreenshot = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setShot(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  // Pull the live connected profile into the form (bio/name/link + photo).
  const loadConnected = async () => {
    setLoadingProfile(true);
    setError(null);
    try {
      const res = await fetch("/api/instagram/profile");
      const data = await res.json();
      if (!res.ok || !data.connected || !data.profile) {
        throw new Error(data?.error || "No connected Instagram profile found.");
      }
      const p = data.profile;
      setForm((f) => ({
        ...f,
        name: p.name || "",
        username: p.username || "",
        bio: p.biography || "",
        link: p.website || "",
      }));
      setImgUrl(p.profilePictureUrl || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const run = async () => {
    setLoading(true);
    setError(null);
    setAudit(null);
    try {
      const res = await fetch("/api/instagram/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          profileImageUrl: imgUrl ?? undefined,
          screenshotDataUrl: shot ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Audit failed");
      setAudit(data.audit as IgAudit);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ck-card p-5 mb-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Profile audit
          </h3>
          <p className="text-xs text-text-tertiary">
            Pull your connected profile (or paste any profile) and audit it against
            the criteria.
          </p>
        </div>
        <button
          type="button"
          onClick={loadConnected}
          disabled={loadingProfile}
          className="ck-btn-secondary !py-1.5 !px-3 text-xs whitespace-nowrap disabled:opacity-50"
        >
          {loadingProfile ? "Loading…" : "Load connected profile"}
        </button>
      </div>

      {imgUrl && (
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
          Profile photo loaded — it&apos;ll be assessed in the audit.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <input className="ck-input" placeholder="Name field" value={form.name} onChange={(e) => set("name", e.target.value)} />
        <input className="ck-input" placeholder="@username" value={form.username} onChange={(e) => set("username", e.target.value)} />
      </div>
      <textarea className="ck-input resize-y" rows={4} placeholder="Bio text (required)" value={form.bio} onChange={(e) => set("bio", e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="ck-input" placeholder="Bio link (URL)" value={form.link} onChange={(e) => set("link", e.target.value)} />
        <input className="ck-input" placeholder="How they deliver value (e.g. high-ticket only, calls)" value={form.businessModel} onChange={(e) => set("businessModel", e.target.value)} />
      </div>
      <textarea className="ck-input resize-y" rows={2} placeholder="Pinned posts (optional — or use a screenshot below)" value={form.pinnedPosts} onChange={(e) => set("pinnedPosts", e.target.value)} />
      <textarea className="ck-input resize-y" rows={2} placeholder="Highlights (optional — or use a screenshot below)" value={form.highlights} onChange={(e) => set("highlights", e.target.value)} />

      <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
        <label className="text-xs font-medium text-text-secondary">
          Profile screenshot — for pinned posts &amp; highlights (the API can&apos;t read these)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onScreenshot(e.target.files?.[0])}
          className="block w-full text-xs text-text-tertiary file:mr-3 file:rounded-md file:border-0 file:bg-surface-hover file:px-3 file:py-1.5 file:text-text-secondary"
        />
        {shot && (
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot} alt="" className="h-12 rounded border border-border object-cover" />
            Screenshot attached — pinned posts &amp; highlights will be read from it.
          </div>
        )}
        <p className="text-[11px] text-text-tertiary">
          Tip: capture the highlights row and the top of your grid in one shot.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={run} disabled={loading || !form.bio.trim()} className="ck-btn-primary disabled:opacity-50">
          {loading ? "Auditing…" : "Run audit"}
        </button>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>

      {audit && (
        <div className="space-y-5 border-t border-border pt-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl text-white ${
                GRADE_COLOR[audit.grade.letter] ?? "bg-text-tertiary"
              }`}
            >
              <span className="text-2xl font-bold leading-none">{audit.grade.letter}</span>
              <span className="text-[10px] opacity-90">{audit.grade.score}/100</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Grade</div>
              <p className="text-sm text-text-secondary">{audit.grade.rationale}</p>
            </div>
          </div>

          <p className="text-sm text-text-secondary italic">{audit.summary}</p>

          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Bio</div>
            <FindingRow label="5-second clarity" finding={audit.bio.fiveSecondClarity} />
            <FindingRow label="4-line structure" finding={audit.bio.structure} />
            <FindingRow label="Outcome + method + timeframe one-liner" finding={audit.bio.oneLiner} />
            <FindingRow label='"DM me {word}" trigger' finding={audit.bio.dmTrigger} />
            <div className="rounded-lg bg-surface-hover p-3">
              <div className="text-[10px] uppercase tracking-wide text-accent mb-1">Suggested bio</div>
              <p className="text-sm text-text-primary whitespace-pre-wrap">{audit.bio.rewrite}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Link · Pinned · Highlights · Photo</div>
            <FindingRow label="Bio link" finding={audit.link.finding} />
            <p className="text-xs text-text-tertiary pl-5">Detected: {audit.link.detectedDestination} — Recommended: {audit.link.recommendation}</p>
            <FindingRow label="Pinned posts" finding={audit.pinnedPosts} />
            <FindingRow label="Highlights" finding={audit.highlights} />
            <FindingRow label="Profile image" finding={audit.profileImage} />
          </div>

          {audit.topFixes.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Top fixes</div>
              <ul className="space-y-1">
                {audit.topFixes.map((f, i) => (
                  <li key={i} className="text-sm text-text-secondary flex gap-2">
                    <span className="text-accent shrink-0">→</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
