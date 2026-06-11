"use client";

import { useState } from "react";

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

const EMPTY = {
  name: "",
  username: "",
  bio: "",
  link: "",
  businessModel: "",
  profileImageNote: "",
};

// Audits an Instagram profile against the agency rubric — bio, link, and the
// profile photo. Pulls from the connected profile, or paste the fields.
export function ProfileAudit() {
  const [form, setForm] = useState({ ...EMPTY });
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [audit, setAudit] = useState<IgAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof EMPTY, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

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
      <input className="ck-input" placeholder="Bio link (URL)" value={form.link} onChange={(e) => set("link", e.target.value)} />

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
          audit.profileImage,
        ];
        const counts = { good: 0, "needs-work": 0, missing: 0 } as Record<string, number>;
        findings.forEach((f) => {
          if (f.status in counts) counts[f.status]++;
        });
        return (
          <div className="space-y-5 border-t border-border pt-5">
            {/* ── Report header ── */}
            <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
              <div className="bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] p-5">
                <div className="flex items-center gap-4">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-white/70 shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold shrink-0">
                      {(form.username || form.name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 text-white">
                    <div className="font-bold text-lg leading-tight truncate">
                      {form.username ? `@${form.username.replace(/^@/, "")}` : form.name || "Profile"}
                    </div>
                    {form.name && form.username && (
                      <div className="text-white/80 text-sm truncate">{form.name}</div>
                    )}
                    <div className="text-white/70 text-[11px] uppercase tracking-wider mt-0.5">Instagram Profile Report</div>
                  </div>
                  <div className="ml-auto shrink-0 h-[68px] w-[68px] rounded-2xl bg-white shadow-lg flex flex-col items-center justify-center">
                    <span className={`text-2xl font-extrabold leading-none ${GRADE_RING[audit.grade.letter] ?? "text-text-tertiary"}`}>
                      {audit.grade.letter}
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold mt-0.5">{audit.grade.score}/100</span>
                  </div>
                </div>
              </div>
              {/* Stat row */}
              <div className="grid grid-cols-3 divide-x divide-border bg-surface">
                <div className="p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-500">{counts.good}</div>
                  <div className="text-[10px] uppercase tracking-wide text-text-tertiary">Good</div>
                </div>
                <div className="p-3 text-center">
                  <div className="text-2xl font-bold text-amber-500">{counts["needs-work"]}</div>
                  <div className="text-[10px] uppercase tracking-wide text-text-tertiary">Needs work</div>
                </div>
                <div className="p-3 text-center">
                  <div className="text-2xl font-bold text-red-500">{counts.missing}</div>
                  <div className="text-[10px] uppercase tracking-wide text-text-tertiary">Missing</div>
                </div>
              </div>
            </div>

            {/* Verdict */}
            <div className="rounded-xl border border-border bg-surface-hover/40 p-4">
              <p className="text-sm text-text-secondary">
                <span className="font-semibold text-text-primary">Verdict — </span>
                {audit.grade.rationale}
              </p>
              <p className="text-sm text-text-secondary italic mt-1.5">{audit.summary}</p>
            </div>

            {/* Bio section */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-accent" />
                <h4 className="text-sm font-bold text-text-primary">Bio</h4>
              </div>
              <FindingRow label="5-second clarity" finding={audit.bio.fiveSecondClarity} />
              <FindingRow label="4-line structure" finding={audit.bio.structure} />
              <FindingRow label="Outcome + method + timeframe one-liner" finding={audit.bio.oneLiner} />
              <FindingRow label='"DM me {word}" trigger' finding={audit.bio.dmTrigger} />
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
                <div className="text-[10px] uppercase tracking-wide font-bold text-accent mb-2">✨ Suggested bio</div>
                <div className="rounded-lg bg-background border border-border p-3 text-sm font-medium text-text-primary whitespace-pre-wrap leading-relaxed">
                  {audit.bio.rewrite}
                </div>
              </div>
            </section>

            {/* Profile setup section */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-accent" />
                <h4 className="text-sm font-bold text-text-primary">Link &amp; Profile Photo</h4>
              </div>
              <FindingRow label="Bio link" finding={audit.link.finding} />
              <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-tertiary">
                <span className="font-medium text-text-secondary">Detected:</span> {audit.link.detectedDestination}
                <span className="mx-1">·</span>
                <span className="font-medium text-text-secondary">Recommended:</span> {audit.link.recommendation}
              </div>
              <FindingRow label="Profile image" finding={audit.profileImage} />
            </section>

            {/* Priority fixes */}
            {audit.topFixes.length > 0 && (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-accent">Priority fixes</div>
                <ol className="space-y-2.5">
                  {audit.topFixes.map((f, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-text-primary">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">{i + 1}</span>
                      <span className="pt-0.5">{f}</span>
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
