"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  BrandDNA,
  PillarKey,
  Niche,
  ICP,
  Offer,
  Positioning,
  Voice,
  Story,
  Messaging,
  ContentDNA,
} from "@/types/brand";
import { computeCompletionScore, createEmptyBrandDNA } from "./utils";

type PillarDataMap = {
  niche: Partial<Niche>;
  icp: Partial<ICP>;
  offer: Partial<Offer>;
  positioning: Partial<Positioning>;
  voice: Partial<Voice>;
  story: Partial<Story>;
  messaging: Partial<Messaging>;
  contentDNA: Partial<ContentDNA>;
};

interface BrandStore {
  brandDNA: BrandDNA;
  interviewCompleted: boolean;
  revealSeen: boolean;
  isSyncing: boolean;
  syncError: string | null;
  lastSyncedAt: string | null;

  setBrandDNA: (dna: BrandDNA) => void;
  updatePillar: <K extends PillarKey>(
    key: K,
    data: PillarDataMap[K],
  ) => void;
  setInterviewCompleted: (v: boolean) => void;
  setRevealSeen: (v: boolean) => void;
  syncFromSupabase: () => Promise<void>;
  syncToSupabase: () => Promise<void>;
  reset: () => void;
}

export const useBrandStore = create<BrandStore>()(
  persist(
    (set, get) => ({
      brandDNA: createEmptyBrandDNA(),
      interviewCompleted: false,
      revealSeen: false,
      isSyncing: false,
      syncError: null,
      lastSyncedAt: null,

      setBrandDNA: (dna) => {
        set({
          brandDNA: {
            ...dna,
            updatedAt: new Date().toISOString(),
            completionScore: computeCompletionScore(dna),
          },
        });
        void get().syncToSupabase();
      },

      updatePillar: (key, data) => {
        set((state) => {
          const updated = {
            ...state.brandDNA,
            [key]: { ...state.brandDNA[key], ...data },
            updatedAt: new Date().toISOString(),
          };

          updated.completionScore = computeCompletionScore(updated);

          return { brandDNA: updated };
        });
        void get().syncToSupabase();
      },

      setInterviewCompleted: (v) => {
        set({ interviewCompleted: v });
        void get().syncToSupabase();
      },
      setRevealSeen: (v) => {
        set({ revealSeen: v });
        void get().syncToSupabase();
      },

      syncFromSupabase: async () => {
        set({ isSyncing: true, syncError: null });

        try {
          const res = await fetch("/api/brand/profile", {
            method: "GET",
            cache: "no-store",
          });

          if (res.status === 401) return;

          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Failed to fetch profile");

          if (data.profile) {
            set({
              brandDNA: data.profile.brandDNA,
              interviewCompleted: Boolean(data.profile.interviewCompleted),
              revealSeen: Boolean(data.profile.revealSeen),
              lastSyncedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          set({
            syncError:
              err instanceof Error ? err.message : "Failed to sync from Supabase",
          });
        } finally {
          set({ isSyncing: false });
        }
      },

      syncToSupabase: async () => {
        const state = get();
        set({ isSyncing: true, syncError: null });

        try {
          const res = await fetch("/api/brand/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              brandDNA: state.brandDNA,
              interviewCompleted: state.interviewCompleted,
              revealSeen: state.revealSeen,
            }),
          });

          if (res.status === 401) return;

          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Failed to save profile");

          set({ lastSyncedAt: new Date().toISOString() });
        } catch (err) {
          set({
            syncError:
              err instanceof Error ? err.message : "Failed to sync to Supabase",
          });
        } finally {
          set({ isSyncing: false });
        }
      },

      reset: () => {
        set({
          brandDNA: createEmptyBrandDNA(),
          interviewCompleted: false,
          revealSeen: false,
        });
        void get().syncToSupabase();
      },
    }),
    {
      name: "copyking-brand-dna",
      partialize: (state) => ({
        brandDNA: state.brandDNA,
        interviewCompleted: state.interviewCompleted,
        revealSeen: state.revealSeen,
      }),
    },
  ),
);
