import type { BrandDNA, PillarKey } from "@/types/brand";

export function createEmptyBrandDNA(): BrandDNA {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    completionScore: 0,
    niche: {
      marketCategory: "",
      subNiche: "",
      isGrowing: false,
      easyToTarget: false,
      purchasingPower: "medium",
      painLevel: 5,
      congregationPoints: [],
    },
    icp: {
      name: "",
      demographics: {
        ageRange: "",
        gender: "",
        location: "",
        incomeRange: "",
        jobTitle: "",
      },
      psychographics: {
        values: [],
        beliefs: [],
        fears: [],
        desires: [],
      },
      painPoints: [],
      dreamOutcome: "",
      failedSolutions: [],
      platforms: [],
    },
    offer: {
      dreamOutcome: "",
      perceivedLikelihood: "",
      timeDelay: "",
      effortRequired: "",
      pricePoint: "",
      deliveryModel: "",
      grandSlamDescription: "",
      valueScore: 0,
    },
    positioning: {
      uniqueMechanism: "",
      categoryOwned: "",
      competitors: [],
      positioningStatement: "",
      pointOfView: "",
    },
    voice: {
      primaryArchetype: "",
      secondaryArchetype: "",
      toneAttributes: [],
      communicationStyle: {
        formalityCasual: 5,
        technicalSimple: 5,
        provocativeNurturing: 5,
      },
      brandPersona: "",
      alwaysWords: [],
      neverWords: [],
    },
    story: {
      originStory: "",
      transformationMoment: "",
      mission: "",
      vision: "",
      coreValues: [],
      villain: "",
    },
    messaging: {
      oneLiner: "",
      tagline: "",
      keyMessages: [],
      brandScript: {
        hero: "",
        problem: { external: "", internal: "", philosophical: "" },
        guide: { empathy: "", authority: "" },
        plan: [],
        cta: { direct: "", transitional: "" },
        failure: "",
        success: "",
      },
      objections: [],
    },
    contentDNA: {
      themes: [],
      hookStyles: [],
      storytellingPatterns: [],
      ctaStyle: "",
      platforms: [],
      cadence: "",
    },
  };
}

function isFilledString(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function isFilledArray(v: unknown): boolean {
  return Array.isArray(v) && v.length > 0;
}

function pillarScore(pillar: Record<string, unknown>): number {
  const keys = Object.keys(pillar);
  if (keys.length === 0) return 0;

  let filled = 0;

  for (const k of keys) {
    const v = pillar[k];

    if (isFilledString(v) || isFilledArray(v)) {
      filled++;
    } else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      const sub = v as Record<string, unknown>;
      const subKeys = Object.keys(sub);

      if (subKeys.length > 0) {
        const subFilled = subKeys.filter(
          (sk) => isFilledString(sub[sk]) || isFilledArray(sub[sk]),
        ).length;

        if (subFilled > 0) filled++;
      }
    } else if (typeof v === "number" && v !== 0 && v !== 5) {
      filled++;
    } else if (typeof v === "boolean" && v) {
      filled++;
    }
  }

  return filled / keys.length;
}

const PILLAR_KEYS: PillarKey[] = [
  "niche",
  "icp",
  "offer",
  "positioning",
  "voice",
  "story",
  "messaging",
  "contentDNA",
];

export function computeCompletionScore(dna: BrandDNA): number {
  let total = 0;

  for (const key of PILLAR_KEYS) {
    total += pillarScore(dna[key] as unknown as Record<string, unknown>);
  }

  return Math.round((total / PILLAR_KEYS.length) * 100);
}

export function getPillarCompletion(
  dna: BrandDNA,
  key: PillarKey,
): number {
  return Math.round(
    pillarScore(dna[key] as unknown as Record<string, unknown>) * 100,
  );
}
