"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Intake, SegmentInput, GeneratedICP } from "./schema";

export type IcpSegmentDraft = SegmentInput & { _id: string };

export function blankSegment(n: number): IcpSegmentDraft {
  return {
    _id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `seg-${n}-${Date.now()}`,
    name: `Audience Segment ${n}`,
    pain: "",
    goals: "",
    mindset: "",
    emotional: "",
    objections: "",
    triggers: "",
  };
}

interface IcpDraftStore {
  formData: Partial<Intake>;
  segments: IcpSegmentDraft[];
  logoDataUrl?: string;
  result: GeneratedICP | null;
  // The exact intake used for the last generation. The guided-chat flow
  // assembles an intake without populating formData/segments, so this is the
  // only complete record of the answers — needed to mirror EVERY field into
  // Brand DNA and to recover answers later.
  lastIntake: Intake | null;

  setFormData: (updates: Partial<Intake>) => void;
  setSegments: (segments: IcpSegmentDraft[]) => void;
  setLogo: (dataUrl?: string) => void;
  setResult: (icp: GeneratedICP | null) => void;
  setLastIntake: (intake: Intake | null) => void;
  reset: () => void;
}

export const useIcpDraftStore = create<IcpDraftStore>()(
  persist(
    (set) => ({
      formData: {},
      segments: [blankSegment(1)],
      logoDataUrl: undefined,
      result: null,
      lastIntake: null,

      setFormData: (updates) =>
        set((state) => ({ formData: { ...state.formData, ...updates } })),
      setSegments: (segments) => set({ segments }),
      setLogo: (logoDataUrl) => set({ logoDataUrl }),
      setResult: (result) => set({ result }),
      setLastIntake: (lastIntake) => set({ lastIntake }),
      reset: () =>
        set({
          formData: {},
          segments: [blankSegment(1)],
          logoDataUrl: undefined,
          result: null,
          lastIntake: null,
        }),
    }),
    {
      name: "copyking-icp-draft",
    },
  ),
);
