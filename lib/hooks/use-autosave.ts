"use client";

import { useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved";

/**
 * Debounced autosave. Watches `value`, and after `delay` ms of no change
 * calls `save(value)`. Skips the first render (so it records a baseline
 * without saving) and skips saves when the serialized value is unchanged.
 *
 * `save` is expected to persist to the account (e.g. updatePillar /
 * setGeneration, both of which POST to Supabase).
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => void | Promise<void>,
  options?: { delay?: number; enabled?: boolean },
): AutosaveStatus {
  const { delay = 1000, enabled = true } = options ?? {};

  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const serialized = JSON.stringify(value);

  const lastSaved = useRef<string | null>(null);
  const first = useRef(true);
  const valueRef = useRef(value);
  const saveRef = useRef(save);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  valueRef.current = value;
  saveRef.current = save;

  useEffect(() => {
    // Record a baseline on first render without saving.
    if (first.current) {
      first.current = false;
      lastSaved.current = serialized;
      return;
    }
    if (!enabled) return;
    if (serialized === lastSaved.current) return;

    setStatus("saving");
    const debounce = setTimeout(async () => {
      try {
        await saveRef.current(valueRef.current);
        lastSaved.current = serialized;
        setStatus("saved");
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => setStatus("idle"), 2000);
      } catch {
        setStatus("idle");
      }
    }, delay);

    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, enabled, delay]);

  useEffect(
    () => () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    },
    [],
  );

  return status;
}
