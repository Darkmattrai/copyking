"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { PillarIcon } from "@/components/brand/pillar-icon";
import type { UserRole } from "@/lib/auth/roles";

interface UserRow {
  id: string;
  email: string | null;
  role: UserRole;
  created_at: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setUsers(data.users);
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
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role } : u)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  const clientCount = users.filter((u) => u.role === "client").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
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
              admin{adminCount === 1 ? "" : "s"}
            </p>
          </div>
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
                <th className="px-4 py-3 font-medium">Signed up</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
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
                  <td className="px-4 py-3 text-text-tertiary">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={() =>
                        setRole(u.id, u.role === "admin" ? "client" : "admin")
                      }
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
