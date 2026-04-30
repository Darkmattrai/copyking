"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GenerationEntry {
  content: string;
  params: Record<string, string>;
  generatedAt: string;
}

interface GenerationsStore {
  generations: Record<string, GenerationEntry>;
  setGeneration: (
    slug: string,
    entry: { content: string; params: Record<string, string> },
  ) => void;
  clearGeneration: (slug: string) => void;
  clearAll: () => void;
}

export const useGenerationsStore = create<GenerationsStore>()(
  persist(
    (set) => ({
      generations: {},

      setGeneration: (slug, entry) =>
        set((state) => ({
          generations: {
            ...state.generations,
            [slug]: {
              ...entry,
              generatedAt: new Date().toISOString(),
            },
          },
        })),

      clearGeneration: (slug) =>
        set((state) => {
          const next = { ...state.generations };
          delete next[slug];
          return { generations: next };
        }),

      clearAll: () => set({ generations: {} }),
    }),
    {
      name: "copyking-generations",
      partialize: (state) => ({ generations: state.generations }),
    },
  ),
);
