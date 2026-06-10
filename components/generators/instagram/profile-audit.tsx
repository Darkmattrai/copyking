"use client";

import { useState } from "react";

import { useRole } from "@/lib/auth/use-role";
import type { IgAudit } from "@/lib/instagram/audit";

type Status = "good" | "needs-work" | "missing" | "not-provided";
type Finding = { status: Status; comment: string };

const STATUS_STYLE: Record<Status, { label: string; chip: string; icon: string }> = {
  good: { label: "Good", chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", icon: "✓" },
  "needs-work": { label: "Needs work", chip: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", icon: "!" },
  missing: { label: "Missing", chip: "bg-red-500/15 text-red-500 border-red-500/30", icon: "✕" },
  "not-provided": { label: "Not provided", chip: "bg-surface-hover text-text-tertiary border-border", icon: "–" },
};

function StatusChip({ status }: { status: Status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE["not-provided"];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${s.chip}`}>
      <span aria-hidden>{s.icon}</span>
      {s.label}
    </span>
  );
}

function FindingRow({ label, finding }: { label: string; finding: Finding }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <StatusChip status={finding.status} />
      </div>
      <p className="text-sm text-text-secondary leading-snug">{finding.comment}</p>
    </div>
  );
}

const GRADE_RING: Record<string, string> = {
  A: "text-emerald-500",
  B: "text-lime-500",
  C: "text-amber-500",
  D: "text-orange-500",
  F: "text-red-500",
};

function ScoreRing({ score, letter }: { score: number; letter: string }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * circ;
  return (
    <svg width="88" height="88" viewBox="0 0 84 84" className="shrink-0">
      <circle cx="42" cy="42" r={r} fill="none" strokeWidth="7" className="stroke-border" />
      <circle
        cx="42"
        cy="42"
        r={r}
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 42 42)"
        className={`${GRADE_RING[letter] ?? "text-text-tertiary"} stroke-current transition-all`}
      />
      <text x="42" y="40" textAnchor="middle" className="fill-text-primary font-bold" fontSize="22">{letter}</text>
      <text x="42" y="56" textAnchor="middle" className="fill-text-tertiary" fontSize="11">{score}/100</text>
    </svg>
  );
}

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
      <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
        <label className="text-xs font-medium text-text-secondary">
          Profile screenshot — pinned posts &amp; highlights are audited from this (the API can&apos;t read them)
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

      {audit && (() => {
        const findings: Finding[] = [
          audit.bio.fiveSecondClarity,
          audit.bio.structure,
          audit.bio.oneLiner,
          audit.bio.dmTrigger,
          audit.link.finding,
          audit.pinnedPosts,
          audit.highlights,
          audit.profileImage,
        ];
        const counts = { good: 0, "needs-work": 0, missing: 0 } as Record<string, number>;
        findings.forEach((f) => {
          if (f.status in counts) counts[f.status]++;
        });
        return (
          <div className="space-y-5 border-t border-border pt-5">
            {/* Grade hero */}
            <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-border bg-surface-hover/40 p-4">
              <ScoreRing score={audit.grade.score} letter={audit.grade.letter} />
              <div className="min-w-0 text-center sm:text-left">
                <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">Overall grade</div>
                <p className="text-sm text-text-secondary">{audit.grade.rationale}</p>
                <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">✓ {counts.good} good</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">! {counts["needs-work"]} needs work</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-red-500/15 text-red-500 border-red-500/30">✕ {counts.missing} missing</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-text-secondary italic">{audit.summary}</p>

            {/* Bio */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Bio</div>
              <FindingRow label="5-second clarity" finding={audit.bio.fiveSecondClarity} />
              <FindingRow label="4-line structure" finding={audit.bio.structure} />
              <FindingRow label="Outcome + method + timeframe one-liner" finding={audit.bio.oneLiner} />
              <FindingRow label='"DM me {word}" trigger' finding={audit.bio.dmTrigger} />
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
                <div className="text-[10px] uppercase tracking-wide font-bold text-accent mb-1">Suggested bio</div>
                <p className="text-sm text-text-primary whitespace-pre-wrap">{audit.bio.rewrite}</p>
              </div>
            </div>

            {/* Link · Pinned · Highlights · Photo */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Link · Pinned · Highlights · Photo</div>
              <FindingRow label="Bio link" finding={audit.link.finding} />
              <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-tertiary">
                <span className="font-medium text-text-secondary">Detected:</span> {audit.link.detectedDestination}
                <span className="mx-1">·</span>
                <span className="font-medium text-text-secondary">Recommended:</span> {audit.link.recommendation}
              </div>
              <FindingRow label="Pinned posts" finding={audit.pinnedPosts} />
              <FindingRow label="Highlights" finding={audit.highlights} />
              <FindingRow label="Profile image" finding={audit.profileImage} />
            </div>

            {/* Top fixes */}
            {audit.topFixes.length > 0 && (
              <div className="rounded-xl border border-border bg-surface-hover/40 p-4 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Top fixes</div>
                <ol className="space-y-2">
                  {audit.topFixes.map((f, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-text-secondary">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white text-[11px] font-bold">{i + 1}</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
