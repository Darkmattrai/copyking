"use client";

import { useEffect, useRef } from "react";

import { useGenerationsStore } from "@/lib/generators/store";

export function GenerationsSyncBootstrap() {
  const booted = useRef(false);
  const loadFromSupabase = useGenerationsStore((s) => s.loadFromSupabase);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    void loadFromSupabase();
  }, [loadFromSupabase]);

  return null;
}
