"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Offer } from "./schema";
import { seed } from "./seed";

interface OfferDraftStore {
  offer: Offer;
  current: number;
  curLadder: number;
  openTier: number | null;

  setOffer: (offer: Offer) => void;
  patch: (updates: Partial<Offer>) => void;
  setField: <K extends keyof Offer>(key: K, value: Offer[K]) => void;
  setCurrent: (n: number) => void;
  setCurLadder: (n: number) => void;
  setOpenTier: (n: number | null) => void;
  reset: () => void;
}

export const useOfferDraftStore = create<OfferDraftStore>()(
  persist(
    (set) => ({
      offer: seed(),
      current: 0,
      curLadder: 0,
      openTier: null,

      setOffer: (offer) => set({ offer }),
      patch: (updates) => set((s) => ({ offer: { ...s.offer, ...updates } })),
      setField: (key, value) =>
        set((s) => ({ offer: { ...s.offer, [key]: value } })),
      setCurrent: (current) => set({ current }),
      setCurLadder: (curLadder) => set({ curLadder, openTier: null }),
      setOpenTier: (openTier) => set({ openTier }),
      reset: () => set({ offer: seed(), current: 0, curLadder: 0, openTier: null }),
    }),
    {
      name: "copyking-offer-draft",
    },
  ),
);
