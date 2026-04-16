"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GenerationEntry {
  slug: string;
  output: string;
  createdAt: string;
}

interface HistoryStore {
  entries: GenerationEntry[];
  addEntry: (entry: Omit<GenerationEntry, "createdAt">) => void;
  getEntriesForSlug: (slug: string) => GenerationEntry[];
  clearForSlug: (slug: string) => void;
}

const MAX_ENTRIES = 20;

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) =>
        set((state) => {
          const newEntry: GenerationEntry = {
            ...entry,
            createdAt: new Date().toISOString(),
          };
          const updated = [newEntry, ...state.entries].slice(0, MAX_ENTRIES);
          return { entries: updated };
        }),

      getEntriesForSlug: (slug) =>
        get().entries.filter((e) => e.slug === slug),

      clearForSlug: (slug) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.slug !== slug),
        })),
    }),
    {
      name: "copyking-gen-history",
    },
  ),
);
