"use client";

import { useEffect, useRef } from "react";

import { useBrandStore } from "@/lib/brand/store";

export function SupabaseSyncBootstrap() {
  const booted = useRef(false);
  const syncFromSupabase = useBrandStore((s) => s.syncFromSupabase);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    void syncFromSupabase();
  }, [syncFromSupabase]);

  return null;
}
