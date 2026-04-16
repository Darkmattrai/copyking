import { z } from "zod/v4";

export const NicheSchema = z.object({
  marketCategory: z.string().default(""),
  subNiche: z.string().default(""),
  isGrowing: z.boolean().default(false),
  easyToTarget: z.boolean().default(false),
  purchasingPower: z.enum(["low", "medium", "high"]).default("medium"),
  painLevel: z.number().min(0).max(10).default(5),
  congregationPoints: z.array(z.string()).default([]),
});

export const DemographicsSchema = z.object({
  ageRange: z.string().default(""),
  gender: z.string().default(""),
  location: z.string().default(""),
  incomeRange: z.string().default(""),
  jobTitle: z.string().default(""),
});

export const PsychographicsSchema = z.object({
  values: z.array(z.string()).default([]),
  beliefs: z.array(z.string()).default([]),
  fears: z.array(z.string()).default([]),
  desires: z.array(z.string()).default([]),
});

export const ICPSchema = z.object({
  name: z.string().default(""),
  demographics: DemographicsSchema.default({
    ageRange: "",
    gender: "",
    location: "",
    incomeRange: "",
    jobTitle: "",
  }),
  psychographics: PsychographicsSchema.default({
    values: [],
    beliefs: [],
    fears: [],
    desires: [],
  }),
  painPoints: z.array(z.string()).default([]),
  dreamOutcome: z.string().default(""),
  failedSolutions: z.array(z.string()).default([]),
  platforms: z.array(z.string()).default([]),
});

export const OfferSchema = z.object({
  dreamOutcome: z.string().default(""),
  perceivedLikelihood: z.string().default(""),
  timeDelay: z.string().default(""),
  effortRequired: z.string().default(""),
  pricePoint: z.string().default(""),
  deliveryModel: z.string().default(""),
  grandSlamDescription: z.string().default(""),
  valueScore: z.number().min(0).max(40).default(0),
});

export const CompetitorSchema = z.object({
  name: z.string(),
  howYouDiffer: z.string(),
});

export const PositioningSchema = z.object({
  uniqueMechanism: z.string().default(""),
  categoryOwned: z.string().default(""),
  competitors: z.array(CompetitorSchema).default([]),
  positioningStatement: z.string().default(""),
  pointOfView: z.string().default(""),
});

export const CommunicationStyleSchema = z.object({
  formalityCasual: z.number().min(1).max(10).default(5),
  technicalSimple: z.number().min(1).max(10).default(5),
  provocativeNurturing: z.number().min(1).max(10).default(5),
});

export const VoiceSchema = z.object({
  primaryArchetype: z.string().default(""),
  secondaryArchetype: z.string().default(""),
  toneAttributes: z.array(z.string()).default([]),
  communicationStyle: CommunicationStyleSchema.default({
    formalityCasual: 5,
    technicalSimple: 5,
    provocativeNurturing: 5,
  }),
  brandPersona: z.string().default(""),
  alwaysWords: z.array(z.string()).default([]),
  neverWords: z.array(z.string()).default([]),
});

export const StorySchema = z.object({
  originStory: z.string().default(""),
  transformationMoment: z.string().default(""),
  mission: z.string().default(""),
  vision: z.string().default(""),
  coreValues: z.array(z.string()).default([]),
  villain: z.string().default(""),
});

export const BrandScriptProblemSchema = z.object({
  external: z.string().default(""),
  internal: z.string().default(""),
  philosophical: z.string().default(""),
});

export const BrandScriptGuideSchema = z.object({
  empathy: z.string().default(""),
  authority: z.string().default(""),
});

export const BrandScriptCTASchema = z.object({
  direct: z.string().default(""),
  transitional: z.string().default(""),
});

export const BrandScriptSchema = z.object({
  hero: z.string().default(""),
  problem: BrandScriptProblemSchema.default({
    external: "",
    internal: "",
    philosophical: "",
  }),
  guide: BrandScriptGuideSchema.default({
    empathy: "",
    authority: "",
  }),
  plan: z.array(z.string()).default([]),
  cta: BrandScriptCTASchema.default({
    direct: "",
    transitional: "",
  }),
  failure: z.string().default(""),
  success: z.string().default(""),
});

export const ObjectionSchema = z.object({
  objection: z.string(),
  response: z.string(),
});

export const MessagingSchema = z.object({
  oneLiner: z.string().default(""),
  tagline: z.string().default(""),
  keyMessages: z.array(z.string()).default([]),
  brandScript: BrandScriptSchema.default({
    hero: "",
    problem: { external: "", internal: "", philosophical: "" },
    guide: { empathy: "", authority: "" },
    plan: [],
    cta: { direct: "", transitional: "" },
    failure: "",
    success: "",
  }),
  objections: z.array(ObjectionSchema).default([]),
});

export const ContentDNASchema = z.object({
  themes: z.array(z.string()).default([]),
  hookStyles: z.array(z.string()).default([]),
  storytellingPatterns: z.array(z.string()).default([]),
  ctaStyle: z.string().default(""),
  platforms: z.array(z.string()).default([]),
  cadence: z.string().default(""),
});

export const BrandDNASchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completionScore: z.number().min(0).max(100).default(0),
  niche: NicheSchema,
  icp: ICPSchema,
  offer: OfferSchema,
  positioning: PositioningSchema,
  voice: VoiceSchema,
  story: StorySchema,
  messaging: MessagingSchema,
  contentDNA: ContentDNASchema,
});

export type Niche = z.infer<typeof NicheSchema>;
export type Demographics = z.infer<typeof DemographicsSchema>;
export type Psychographics = z.infer<typeof PsychographicsSchema>;
export type ICP = z.infer<typeof ICPSchema>;
export type Offer = z.infer<typeof OfferSchema>;
export type Competitor = z.infer<typeof CompetitorSchema>;
export type Positioning = z.infer<typeof PositioningSchema>;
export type CommunicationStyle = z.infer<typeof CommunicationStyleSchema>;
export type Voice = z.infer<typeof VoiceSchema>;
export type Story = z.infer<typeof StorySchema>;
export type BrandScript = z.infer<typeof BrandScriptSchema>;
export type Objection = z.infer<typeof ObjectionSchema>;
export type Messaging = z.infer<typeof MessagingSchema>;
export type ContentDNA = z.infer<typeof ContentDNASchema>;
export type BrandDNA = z.infer<typeof BrandDNASchema>;

export const BRAND_ARCHETYPES = [
  "The Innocent",
  "The Everyman",
  "The Hero",
  "The Outlaw",
  "The Explorer",
  "The Creator",
  "The Ruler",
  "The Magician",
  "The Lover",
  "The Caregiver",
  "The Jester",
  "The Sage",
] as const;

export type BrandArchetype = (typeof BRAND_ARCHETYPES)[number];

export const PILLAR_KEYS = [
  "niche",
  "icp",
  "offer",
  "positioning",
  "voice",
  "story",
  "messaging",
  "contentDNA",
] as const;

export type PillarKey = (typeof PILLAR_KEYS)[number];

export interface PillarMeta {
  key: PillarKey;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

export const PILLAR_META: PillarMeta[] = [
  {
    key: "niche",
    label: "Niche & Market",
    shortLabel: "Niche",
    icon: "target",
    description: "Your market — who you serve and why they need you",
  },
  {
    key: "icp",
    label: "Dream Customer",
    shortLabel: "ICP",
    icon: "user",
    description: "Your ideal customer avatar — their pains, desires, and world",
  },
  {
    key: "offer",
    label: "Offer & Value",
    shortLabel: "Offer",
    icon: "gem",
    description: "Your offer — the transformation you deliver and why it's irresistible",
  },
  {
    key: "positioning",
    label: "Positioning",
    shortLabel: "Position",
    icon: "flag",
    description: "Your category of one — why they choose YOU",
  },
  {
    key: "voice",
    label: "Voice & Personality",
    shortLabel: "Voice",
    icon: "mic",
    description: "Your brand archetype — how you sound and feel",
  },
  {
    key: "story",
    label: "Brand Story",
    shortLabel: "Story",
    icon: "book",
    description: "Your origin — the journey that makes you credible",
  },
  {
    key: "messaging",
    label: "Messaging",
    shortLabel: "Messages",
    icon: "megaphone",
    description: "Your key messages — one-liner, tagline, and BrandScript",
  },
  {
    key: "contentDNA",
    label: "Content DNA",
    shortLabel: "Content",
    icon: "sparkles",
    description: "Your content style — hooks, patterns, and platforms",
  },
];
