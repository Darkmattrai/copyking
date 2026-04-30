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
  isLoaded: boolean;
  isSyncing: boolean;

  loadFromSupabase: () => Promise<void>;
  setGeneration: (
    slug: string,
    entry: { content: string; params: Record<string, string> },
  ) => Promise<void>;
  clearGeneration: (slug: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useGenerationsStore = create<GenerationsStore>()(
  persist(
    (set, get) => ({
      generations: {},
      isLoaded: false,
      isSyncing: false,

      loadFromSupabase: async () => {
        if (get().isSyncing) return;
        set({ isSyncing: true });

        try {
          const res = await fetch("/api/generations", { cache: "no-store" });

          if (res.status === 401) {
            set({ isLoaded: true, isSyncing: false });
            return;
          }

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data?.error || "Failed to load generations");
          }

          set({
            generations: data.generations || {},
            isLoaded: true,
            isSyncing: false,
          });
        } catch (err) {
          console.error("[generations] load failed", err);
          set({ isLoaded: true, isSyncing: false });
        }
      },

      setGeneration: async (slug, entry) => {
        const generatedAt = new Date().toISOString();
        const fullEntry: GenerationEntry = { ...entry, generatedAt };

        set((state) => ({
          generations: { ...state.generations, [slug]: fullEntry },
        }));

        try {
          const res = await fetch("/api/generations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, ...fullEntry }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            console.error("[generations] save failed", data);
          }
        } catch (err) {
          console.error("[generations] save error", err);
        }
      },

      clearGeneration: async (slug) => {
        set((state) => {
          const next = { ...state.generations };
          delete next[slug];
          return { generations: next };
        });

        try {
          await fetch(
            `/api/generations?slug=${encodeURIComponent(slug)}`,
            { method: "DELETE" },
          );
        } catch (err) {
          console.error("[generations] delete error", err);
        }
      },

      clearAll: async () => {
        set({ generations: {} });
        try {
          await fetch("/api/generations", { method: "DELETE" });
        } catch (err) {
          console.error("[generations] clearAll error", err);
        }
      },
    }),
    {
      name: "copyking-generations",
      partialize: (state) => ({ generations: state.generations }),
    },
  ),
);
