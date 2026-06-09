"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

import { createClient } from "@/lib/supabase/client";
import { useBrandStore } from "@/lib/brand/store";
import { useGenerationsStore } from "@/lib/generators/store";
import { useOfferDraftStore } from "@/lib/offer/store";
import { useIcpDraftStore } from "@/lib/icp/store";
import { seed } from "@/lib/offer/seed";
import { migrateOffer } from "@/lib/offer/migrate";
import { offerToBrand, flagshipProduct } from "@/lib/offer/brand-bridge";
import { useAutosave } from "@/lib/hooks/use-autosave";
import { AutosaveIndicator } from "@/components/brand/autosave-indicator";
import { PillarIcon } from "@/components/brand/pillar-icon";
import {
  useBrandDnaAnswers,
  type AnswerField,
  type AnswerGroup,
} from "@/lib/account/brand-dna-answers";
import { AnswerCategories } from "@/components/brand/answer-categories";
import { OfferDrawings } from "@/components/generators/offer/offer-drawings";
import { exportAnswersPdf, exportAnswersDoc } from "@/lib/account/export";

type Tab = "account" | "brand-dna" | "billing";

const TABS: { id: Tab; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "brand-dna", label: "Brand DNA" },
  { id: "billing", label: "Billing" },
];

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="p-6 lg:p-8" />}>
      <AccountPageInner />
    </Suspense>
  );
}

function AccountPageInner() {
  const [tab, setTab] = useState<Tab>("brand-dna");

  // Deep-link to a tab via ?tab= (used by the logo menu). Reactive so the tab
  // follows menu navigation even while already on /account.
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  useEffect(() => {
    if (tabParam === "account" || tabParam === "brand-dna" || tabParam === "billing")
      setTab(tabParam);
  }, [tabParam]);

  const updatePillar = useBrandStore((s) => s.updatePillar);

  const generations = useGenerationsStore((s) => s.generations);
  const genLoaded = useGenerationsStore((s) => s.isLoaded);
  const setGeneration = useGenerationsStore((s) => s.setGeneration);

  const offer = useOfferDraftStore((s) => s.offer);
  const enhancements = useOfferDraftStore((s) => s.enhancements);
  const setOffer = useOfferDraftStore((s) => s.setOffer);
  const setEnhancements = useOfferDraftStore((s) => s.setEnhancements);

  const formData = useIcpDraftStore((s) => s.formData);
  const segments = useIcpDraftStore((s) => s.segments);
  const icpResult = useIcpDraftStore((s) => s.result);
  const setFormData = useIcpDraftStore((s) => s.setFormData);
  const setSegments = useIcpDraftStore((s) => s.setSegments);
  const setResult = useIcpDraftStore((s) => s.setResult);

  const [hydrated, setHydrated] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const groups = useBrandDnaAnswers();

  const brandName =
    formData.businessName ||
    offer.offerName ||
    useBrandStore.getState().brandDNA.niche.marketCategory ||
    "Brand DNA";

  // Pull the signed-in user's email for the Profile tab.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null))
      .catch(() => {});
  }, []);

  // One-time hydration: if the local Offer / ICP drafts are untouched but the
  // account has saved copies (e.g. a fresh device), seed the drafts from the
  // `generations` rows so this page shows the user's real answers.
  useEffect(() => {
    if (hydrated || !genLoaded) return;

    const offerRow = generations["irresistible-offer"];
    if (offerRow?.content) {
      const baseFlag = flagshipProduct(seed());
      const curFlag = flagshipProduct(offer);
      const offerUntouched =
        !curFlag ||
        (!curFlag.who &&
          !curFlag.dream &&
          curFlag.trim === baseFlag?.trim &&
          curFlag.realPrice === baseFlag?.realPrice);
      if (offerUntouched) {
        try {
          const parsed = JSON.parse(offerRow.content);
          const o = parsed.offer ?? parsed;
          if (o && typeof o === "object") setOffer(migrateOffer(o));
          if (parsed.enhancements) setEnhancements(parsed.enhancements);
        } catch {
          /* ignore malformed row */
        }
      }
    }

    const icpRow = generations["icp-map"];
    if (icpRow?.content) {
      const icpUntouched =
        !formData.businessName &&
        !formData.industry &&
        segments.every((s) => !s.pain && !s.goals);
      if (icpUntouched) {
        try {
          const parsed = JSON.parse(icpRow.content);
          if (parsed.formData) setFormData(parsed.formData);
          if (parsed.segments?.length) setSegments(parsed.segments);
          if (parsed.result) setResult(parsed.result);
        } catch {
          /* ignore malformed row */
        }
      }
    }

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genLoaded, generations, hydrated]);

  // Autosave inline edits back to the account. Offer edits also refresh the
  // Brand DNA `offer` pillar (mirrors the Offer Builder page).
  const offerAutosave = useAutosave(
    { offer, enhancements },
    async ({ offer: o, enhancements: e }) => {
      updatePillar("offer", offerToBrand(o));
      await setGeneration("irresistible-offer", {
        content: JSON.stringify({ offer: o, enhancements: e }),
        params: {},
      });
    },
    { enabled: hydrated, delay: 1500 },
  );

  const icpAutosave = useAutosave(
    { formData, segments, result: icpResult },
    async (draft) => {
      await setGeneration("icp-map", {
        content: JSON.stringify(draft),
        params: {},
      });
    },
    { enabled: hydrated, delay: 1500 },
  );

  const saveStatus =
    offerAutosave === "saving" || icpAutosave === "saving"
      ? "saving"
      : offerAutosave === "saved" || icpAutosave === "saved"
        ? "saved"
        : "idle";

  const populatedGroups = useMemo(
    () =>
      groups.filter((g) =>
        g.fields.some((f) => f.value.trim() || f.enhanced?.trim()),
      ),
    [groups],
  );

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-text-primary">Account</h1>
        <p className="text-sm text-text-tertiary mt-1">
          Manage your profile and every answer behind your Brand DNA.
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-6">
        {TABS.map((t) => (
          <TabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </TabButton>
        ))}
      </div>

      {tab === "account" ? (
        <div className="ck-card p-6 max-w-lg">
          <h2 className="text-base font-semibold text-text-primary mb-4">
            Account settings
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-tertiary">Email</dt>
              <dd className="text-text-primary font-medium">
                {email ?? "—"}
              </dd>
            </div>
          </dl>
        </div>
      ) : tab === "billing" ? (
        <div className="ck-card p-6 max-w-lg">
          <h2 className="text-base font-semibold text-text-primary mb-2">
            Billing
          </h2>
          <p className="text-sm text-text-tertiary">
            Billing and subscription management is coming soon. You&apos;ll be
            able to view your plan, update payment details and download invoices
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-text-tertiary max-w-xl">
              Every answer you&apos;ve given across the ICP Map, Offer Builder
              and Brand DNA. Edit any field to update it everywhere, or export
              the whole thing.
            </p>
            <div className="flex items-center gap-3">
              <AutosaveIndicator status={saveStatus} />
              <button
                type="button"
                onClick={() => exportAnswersDoc(populatedGroups, { brandName })}
                className="ck-btn-secondary"
              >
                Export .doc
              </button>
              <button
                type="button"
                onClick={() => exportAnswersPdf(populatedGroups, { brandName })}
                className="ck-btn-primary"
              >
                Export PDF
              </button>
            </div>
          </div>

          {populatedGroups.length === 0 ? (
            <div className="ck-card p-10 text-center">
              <p className="text-sm text-text-secondary">
                Nothing here yet. Build your ICP Map and Offer to populate your
                Brand DNA.
              </p>
            </div>
          ) : (
            <AnswerCategories
              groups={populatedGroups}
              extras={{ Offer: <OfferDrawings offer={offer} /> }}
              renderGroup={(group) => (
                <GroupCard
                  key={`${group.feature}-${group.category}`}
                  group={group}
                />
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors " +
        (active
          ? "border-accent text-text-primary"
          : "border-transparent text-text-tertiary hover:text-text-secondary")
      }
    >
      {children}
    </button>
  );
}

function GroupCard({ group }: { group: AnswerGroup }) {
  const fields = group.fields.filter(
    (f) => f.value.trim() || f.enhanced?.trim() || f.onChange,
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

  const editable = field.kind !== "readonly" && !!field.onChange;
  const isList = field.kind === "list";
  const isMultiline =
    field.kind === "textarea" || isList || field.value.includes("\n");

  return (
    <div>
      <label className="ck-label !mb-1 block">{field.question}</label>

      {hasEnhanced && (
        <div className="mb-2 rounded-lg border border-border bg-surface px-3 py-2">
          <div className="text-[10px] uppercase tracking-wide text-text-tertiary mb-1">
            Original answer
          </div>
          <p className="text-sm text-text-tertiary whitespace-pre-wrap">
            {field.original}
          </p>
          <div className="text-[10px] uppercase tracking-wide text-accent mt-2 mb-1">
            ✨ AI-enhanced version
          </div>
        </div>
      )}

      {editable ? (
        isMultiline ? (
          <textarea
            value={field.value}
            onChange={(e) => field.onChange!(e.target.value)}
            rows={isList ? 4 : 3}
            placeholder={isList ? "One per line" : undefined}
            className="ck-input resize-y"
          />
        ) : (
          <input
            type="text"
            value={field.value}
            onChange={(e) => field.onChange!(e.target.value)}
            className="ck-input"
          />
        )
      ) : (
        <p className="text-sm text-text-secondary whitespace-pre-wrap">
          {field.value || "—"}
        </p>
      )}
    </div>
  );
}
