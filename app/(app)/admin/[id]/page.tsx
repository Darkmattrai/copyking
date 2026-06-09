"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

import type { BrandDNA } from "@/types/brand";
import type { UserRole } from "@/lib/auth/roles";
import type { AnswerField, AnswerGroup } from "@/lib/account/brand-dna-answers";
import {
  buildBrandDnaAnswerGroups,
  populatedAnswerGroups,
  parseGenerationContent,
} from "@/lib/account/build-answers";
import { AnswerCategories } from "@/components/brand/answer-categories";
import { OfferDrawings } from "@/components/generators/offer/offer-drawings";
import { exportAnswersPdf, exportAnswersDoc } from "@/lib/account/export";
import { formatUsd } from "@/lib/usage/pricing";

interface UsageBreakdownItem {
  key: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
}

interface UsageSummary {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  costUsd: number;
  byFeature: UsageBreakdownItem[];
  byModel: UsageBreakdownItem[];
}

const FEATURE_LABELS: Record<string, string> = {
  "icp-generate": "ICP Map generation",
  "icp-chat": "ICP guided chat",
  "offer-enhance": "Offer field enhance",
  "offer-chat": "Offer guided chat",
};

const fmtTokens = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}k`
      : String(n);

interface Bundle {
  profile: { id: string; email: string | null; role: UserRole; created_at: string };
  auth: {
    last_sign_in_at: string | null;
    created_at: string | null;
    email_confirmed_at: string | null;
    provider: string | null;
  } | null;
  brandProfile: {
    brand_dna: BrandDNA | null;
    interview_completed: boolean;
    reveal_seen: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  generations: {
    slug: string;
    content: string;
    params: unknown;
    generated_at: string;
    created_at: string;
    updated_at: string;
  }[];
  usage?: UsageSummary;
}

const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString() : "—";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/users/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load");
        if (!cancelled) setBundle(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const parsed = useMemo(() => {
    if (!bundle) return null;
    const contentBySlug: Record<string, string> = {};
    for (const g of bundle.generations) contentBySlug[g.slug] = g.content;
    return parseGenerationContent(contentBySlug);
  }, [bundle]);

  const groups = useMemo<AnswerGroup[]>(() => {
    if (!bundle || !parsed) return [];
    return populatedAnswerGroups(
      buildBrandDnaAnswerGroups({
        brandDNA: bundle.brandProfile?.brand_dna ?? null,
        ...parsed,
      }),
    );
  }, [bundle, parsed]);

  const brandName = useMemo(() => {
    if (!bundle) return "Brand DNA";
    const dna = bundle.brandProfile?.brand_dna;
    const fromIcp = groups
      .find((g) => g.category === "Business & Audience")
      ?.fields.find((f) => f.id === "icp.businessName")?.value;
    return (
      fromIcp ||
      dna?.niche?.marketCategory ||
      bundle.profile.email ||
      "Brand DNA"
    );
  }, [bundle, groups]);

  const completion = bundle?.brandProfile?.brand_dna?.completionScore ?? null;

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-1.5 text-text-tertiary hover:text-text-primary text-sm mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All clients
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {bundle?.profile.email || "User"}
            </h1>
            <p className="text-sm text-text-tertiary mt-1 font-mono">{id}</p>
          </div>
          {groups.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => exportAnswersDoc(groups, { brandName })}
                className="ck-btn-secondary"
              >
                Export .doc
              </button>
              <button
                type="button"
                onClick={() => exportAnswersPdf(groups, { brandName })}
                className="ck-btn-primary"
              >
                Export PDF
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {error && (
        <div className="mb-4 p-4 rounded-xl border border-danger/30 bg-danger/[0.06] text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="ck-card p-12 flex items-center justify-center">
          <span className="relative h-6 w-6">
            <span className="absolute inset-0 rounded-full border-2 border-border" />
            <span className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </span>
        </div>
      ) : bundle ? (
        <div className="space-y-6">
          {/* Tracking & usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <InfoCard title="Account">
              <Stat label="Role" value={bundle.profile.role} />
              <Stat label="Signed up" value={fmtDate(bundle.profile.created_at)} />
              <Stat label="Email confirmed" value={fmtDate(bundle.auth?.email_confirmed_at)} />
              <Stat label="Sign-in provider" value={bundle.auth?.provider || "email"} />
            </InfoCard>

            <InfoCard title="Activity">
              <Stat label="Last sign-in" value={fmtDate(bundle.auth?.last_sign_in_at)} />
              <Stat label="Generations saved" value={String(bundle.generations.length)} />
              <Stat
                label="Last saved"
                value={fmtDate(
                  bundle.generations[0]?.updated_at ??
                    bundle.brandProfile?.updated_at,
                )}
              />
              <Stat
                label="Brand profile updated"
                value={fmtDate(bundle.brandProfile?.updated_at)}
              />
            </InfoCard>

            <InfoCard title="Brand DNA progress">
              <Stat
                label="Completion score"
                value={completion != null ? `${completion}%` : "—"}
              />
              <Stat
                label="Interview completed"
                value={bundle.brandProfile?.interview_completed ? "Yes" : "No"}
              />
              <Stat
                label="Reveal seen"
                value={bundle.brandProfile?.reveal_seen ? "Yes" : "No"}
              />
              <Stat
                label="Tools used"
                value={
                  bundle.generations.length
                    ? bundle.generations.map((g) => g.slug).join(", ")
                    : "—"
                }
              />
            </InfoCard>
          </div>

          {/* AI usage & cost */}
          <UsageSection usage={bundle.usage} />

          {/* Billing */}
          <div className="ck-card p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Billing
            </h3>
            <p className="text-sm text-text-tertiary">
              No billing provider is connected yet, so there is no plan, payment
              method or invoice data to show. Once a billing integration (e.g.
              Stripe) is added, subscription status, plan, MRR and invoices will
              appear here.
            </p>
          </div>

          {/* Answers / Brand DNA */}
          <div>
            <h2 className="text-base font-semibold text-text-primary mb-3">
              Answers &amp; Brand DNA
            </h2>
            {groups.length === 0 ? (
              <div className="ck-card p-10 text-center">
                <p className="text-sm text-text-secondary">
                  This user hasn&apos;t filled in any answers yet.
                </p>
              </div>
            ) : (
              <AnswerCategories
                groups={groups}
                extras={{ Offer: <OfferDrawings offer={parsed?.offer ?? null} /> }}
                renderGroup={(group) => (
                  <GroupCard
                    key={`${group.feature}-${group.category}`}
                    group={group}
                  />
                )}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UsageSection({ usage }: { usage?: UsageSummary }) {
  const u = usage ?? {
    calls: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    totalTokens: 0,
    costUsd: 0,
    byFeature: [],
    byModel: [],
  };

  return (
    <div>
      <h2 className="text-base font-semibold text-text-primary mb-3">
        AI usage &amp; cost
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="ck-card p-5">
          <div className="text-xs uppercase tracking-wide text-text-tertiary mb-1">
            Total Anthropic cost
          </div>
          <div className="text-3xl font-bold text-text-primary">
            {formatUsd(u.costUsd)}
          </div>
          <div className="text-xs text-text-tertiary mt-1">
            {u.calls} call{u.calls === 1 ? "" : "s"} · {fmtTokens(u.totalTokens)} tokens
          </div>
          <dl className="mt-4 space-y-2.5">
            <Stat label="Input tokens" value={fmtTokens(u.inputTokens)} />
            <Stat label="Output tokens" value={fmtTokens(u.outputTokens)} />
            {u.cacheReadTokens > 0 && (
              <Stat label="Cache read tokens" value={fmtTokens(u.cacheReadTokens)} />
            )}
            {u.cacheCreationTokens > 0 && (
              <Stat label="Cache write tokens" value={fmtTokens(u.cacheCreationTokens)} />
            )}
          </dl>
        </div>

        <UsageBreakdownCard
          title="By feature"
          items={u.byFeature.map((i) => ({ ...i, label: FEATURE_LABELS[i.key] ?? i.key }))}
        />
        <UsageBreakdownCard
          title="By model"
          items={u.byModel.map((i) => ({ ...i, label: i.key }))}
        />
      </div>
    </div>
  );
}

function UsageBreakdownCard({
  title,
  items,
}: {
  title: string;
  items: (UsageBreakdownItem & { label: string })[];
}) {
  return (
    <div className="ck-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-text-tertiary">No AI usage yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.key} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-text-primary truncate">{i.label}</div>
                <div className="text-[11px] text-text-tertiary">
                  {i.calls} call{i.calls === 1 ? "" : "s"} · {fmtTokens(i.totalTokens)} tok
                </div>
              </div>
              <div className="text-sm font-medium text-text-primary shrink-0">
                {formatUsd(i.costUsd)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ck-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-3">{title}</h3>
      <dl className="space-y-2.5">{children}</dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-text-tertiary shrink-0">{label}</dt>
      <dd className="text-text-primary font-medium text-right break-words">
        {value}
      </dd>
    </div>
  );
}

function GroupCard({ group }: { group: AnswerGroup }) {
  const fields = group.fields.filter(
    (f) => f.value.trim() || f.enhanced?.trim(),
  );
  if (!fields.length) return null;

  return (
    <div className="ck-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        {group.category}
      </h3>
      <div className="space-y-4">
        {fields.map((field) => (
          <FieldRow key={field.id} field={field} />
        ))}
      </div>
    </div>
  );
}

function FieldRow({ field }: { field: AnswerField }) {
  const hasEnhanced =
    !!field.enhanced?.trim() &&
    !!field.original?.trim() &&
    field.original!.trim() !== field.enhanced!.trim();

  return (
    <div>
      <label className="ck-label !mb-1 block">{field.question}</label>
      {hasEnhanced ? (
        <div className="space-y-1.5">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-text-tertiary mb-0.5">
              Original answer
            </div>
            <p className="text-sm text-text-tertiary whitespace-pre-wrap">
              {field.original}
            </p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-accent mb-0.5">
              ✨ AI-enhanced version
            </div>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {field.enhanced}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-secondary whitespace-pre-wrap">
          {field.value || "—"}
        </p>
      )}
    </div>
  );
}
