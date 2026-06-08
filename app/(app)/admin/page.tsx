"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { PillarIcon } from "@/components/brand/pillar-icon";
import type { UserRole } from "@/lib/auth/roles";
import type { BrandDNA } from "@/types/brand";
import {
  buildBrandDnaAnswerGroups,
  populatedAnswerGroups,
  parseGenerationContent,
} from "@/lib/account/build-answers";
import {
  exportAllBrandDnaDoc,
  exportAllBrandDnaJson,
  type UserBrandExport,
} from "@/lib/account/export";
import { formatUsd } from "@/lib/usage/pricing";

const fmtTokens = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}k`
      : String(n);

interface UserRow {
  id: string;
  email: string | null;
  role: UserRole;
  created_at: string;
  generationsCount: number;
  lastActive: string | null;
  interviewCompleted: boolean;
  costUsd: number;
  totalTokens: number;
}

interface ExportUser {
  id: string;
  email: string | null;
  role: UserRole;
  created_at: string;
  brandDna: BrandDNA | null;
  interviewCompleted: boolean;
  generations: { slug: string; content: string }[];
}

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "—");

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totals, setTotals] = useState<{ costUsd: number; totalTokens: number }>({
    costUsd: 0,
    totalTokens: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setUsers(data.users);
      if (data.totals) setTotals(data.totals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const setRole = async (id: string, role: UserRole) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update");
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  // Pull the full bundle and turn each user into an answer-group set the export
  // helpers understand. JSON keeps full fidelity; .doc is a readable bundle.
  const fetchExport = async (): Promise<{
    users: ExportUser[];
    exportedAt: string;
  }> => {
    const res = await fetch("/api/admin/export", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Export failed");
    return data;
  };

  const exportAllDoc = async () => {
    setExporting(true);
    setError(null);
    try {
      const { users: all } = await fetchExport();
      const entries: UserBrandExport[] = all.map((u) => {
        const contentBySlug: Record<string, string> = {};
        for (const g of u.generations) contentBySlug[g.slug] = g.content;
        const parsed = parseGenerationContent(contentBySlug);
        const groups = populatedAnswerGroups(
          buildBrandDnaAnswerGroups({ brandDNA: u.brandDna, ...parsed }),
        );
        return {
          label: u.email || u.id,
          meta: `${u.role} · joined ${fmtDate(u.created_at)}`,
          groups,
        };
      });
      exportAllBrandDnaDoc(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const exportAllJson = async () => {
    setExporting(true);
    setError(null);
    try {
      const data = await fetchExport();
      exportAllBrandDnaJson(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const clientCount = users.filter((u) => u.role === "client").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center text-accent">
            <PillarIcon className="w-5 h-5" icon="target" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Clients</h1>
            <p className="text-sm text-text-tertiary">
              {users.length} account{users.length === 1 ? "" : "s"} ·{" "}
              {clientCount} client{clientCount === 1 ? "" : "s"} · {adminCount}{" "}
              admin{adminCount === 1 ? "" : "s"} ·{" "}
              <span className="text-text-secondary font-medium">
                {formatUsd(totals.costUsd)}
              </span>{" "}
              Anthropic spend ({fmtTokens(totals.totalTokens)} tokens)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={exporting || !users.length}
            onClick={exportAllJson}
            className="ck-btn-secondary"
          >
            {exporting ? "Exporting…" : "Export all (JSON)"}
          </button>
          <button
            type="button"
            disabled={exporting || !users.length}
            onClick={exportAllDoc}
            className="ck-btn-primary"
          >
            {exporting ? "Exporting…" : "Export all Brand DNA"}
          </button>
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
      ) : (
        <div className="ck-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-tertiary">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Generations</th>
                <th className="px-4 py-3 font-medium">Interview</th>
                <th className="px-4 py-3 font-medium text-right">AI cost</th>
                <th className="px-4 py-3 font-medium">Last active</th>
                <th className="px-4 py-3 font-medium">Signed up</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => router.push(`/admin/${u.id}`)}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-surface-hover transition-colors"
                >
                  <td className="px-4 py-3 text-text-primary">
                    {u.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.role === "admin"
                          ? "inline-flex items-center rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent"
                          : "inline-flex items-center rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-text-secondary"
                      }
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {u.generationsCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-text-primary font-medium">
                      {formatUsd(u.costUsd)}
                    </span>
                    {u.totalTokens > 0 && (
                      <span className="block text-[11px] text-text-tertiary">
                        {fmtTokens(u.totalTokens)} tok
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-tertiary">
                    {u.interviewCompleted ? "✓" : "—"}
                  </td>
                  <td className="px-4 py-3 text-text-tertiary">
                    {fmtDate(u.lastActive)}
                  </td>
                  <td className="px-4 py-3 text-text-tertiary">
                    {fmtDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRole(u.id, u.role === "admin" ? "client" : "admin");
                      }}
                      className="ck-btn-secondary text-xs"
                    >
                      {busyId === u.id
                        ? "…"
                        : u.role === "admin"
                          ? "Make client"
                          : "Make admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
