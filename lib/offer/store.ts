"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Offer } from "./schema";
import { seed } from "./seed";

// When a field is improved with "✨ Enhance with AI", we keep BOTH the text the
// user originally wrote and the AI rewrite, keyed by the field's key. This lets
// the Brand DNA account tab show the original answer alongside its AI version.
export type Enhancement = { original: string; enhanced: string };
export type EnhancementMap = Record<string, Enhancement>;

interface OfferDraftStore {
  offer: Offer;
  enhancements: EnhancementMap;
  current: number;
  curLadder: number;
  openTier: number | null;

  setOffer: (offer: Offer) => void;
  patch: (updates: Partial<Offer>) => void;
  setField: <K extends keyof Offer>(key: K, value: Offer[K]) => void;
  recordEnhancement: (key: string, original: string, enhanced: string) => void;
  setEnhancements: (e: EnhancementMap) => void;
  setCurrent: (n: number) => void;
  setCurLadder: (n: number) => void;
  setOpenTier: (n: number | null) => void;
  reset: () => void;
}

export const useOfferDraftStore = create<OfferDraftStore>()(
  persist(
    (set) => ({
      offer: seed(),
      enhancements: {},
      current: 0,
      curLadder: 0,
      openTier: null,

      setOffer: (offer) => set({ offer }),
      patch: (updates) => set((s) => ({ offer: { ...s.offer, ...updates } })),
      setField: (key, value) =>
        set((s) => ({ offer: { ...s.offer, [key]: value } })),
      recordEnhancement: (key, original, enhanced) =>
        set((s) => ({
          // Preserve the very first original so repeated enhancements still
          // trace back to what the user actually wrote.
          enhancements: {
            ...s.enhancements,
            [key]: { original: s.enhancements[key]?.original ?? original, enhanced },
          },
        })),
      setEnhancements: (enhancements) => set({ enhancements }),
      setCurrent: (current) => set({ current }),
      setCurLadder: (curLadder) => set({ curLadder, openTier: null }),
      setOpenTier: (openTier) => set({ openTier }),
      reset: () =>
        set({ offer: seed(), enhancements: {}, current: 0, curLadder: 0, openTier: null }),
    }),
    {
      name: "copyking-offer-draft",
    },
  ),
);
