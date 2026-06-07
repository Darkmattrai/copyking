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

  setFormData: (updates: Partial<Intake>) => void;
  setSegments: (segments: IcpSegmentDraft[]) => void;
  setLogo: (dataUrl?: string) => void;
  setResult: (icp: GeneratedICP | null) => void;
  reset: () => void;
}

export const useIcpDraftStore = create<IcpDraftStore>()(
  persist(
    (set) => ({
      formData: {},
      segments: [blankSegment(1)],
      logoDataUrl: undefined,
      result: null,

      setFormData: (updates) =>
        set((state) => ({ formData: { ...state.formData, ...updates } })),
      setSegments: (segments) => set({ segments }),
      setLogo: (logoDataUrl) => set({ logoDataUrl }),
      setResult: (result) => set({ result }),
      reset: () =>
        set({
          formData: {},
          segments: [blankSegment(1)],
          logoDataUrl: undefined,
          result: null,
        }),
    }),
    {
      name: "copyking-icp-draft",
    },
  ),
);
