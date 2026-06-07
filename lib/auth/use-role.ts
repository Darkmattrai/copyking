"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "./roles";

// Fetches the current user's role once for client-side UI gating.
// Returns null while loading.
export function useRole(): UserRole | null {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.role) setRole(data.role as UserRole);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return role;
}
