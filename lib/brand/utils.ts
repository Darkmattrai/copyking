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

export function createMockBrandDNA(): BrandDNA {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    completionScore: 100,
    niche: {
      marketCategory: "Online business coaching",
      subNiche: "Service-based solopreneurs scaling past $10K/month",
      isGrowing: true,
      easyToTarget: true,
      purchasingPower: "high",
      painLevel: 9,
      congregationPoints: [
        "Twitter/X #buildinpublic",
        "Indie Hackers",
        "Reddit r/Entrepreneur",
        "Instagram solopreneur niche",
        "YouTube business podcasts",
      ],
    },
    icp: {
      name: "Maya the Burnt-Out Solopreneur",
      demographics: {
        ageRange: "28-42",
        gender: "Skews female (60%)",
        location: "US, UK, Canada, Australia",
        incomeRange: "$60K-$200K",
        jobTitle: "Founder / Solo consultant / Service provider",
      },
      psychographics: {
        values: ["Freedom", "Mastery", "Authenticity", "Family"],
        beliefs: [
          "I should be able to scale without selling my soul",
          "Most business advice is repackaged fluff",
          "Hard work eventually pays off",
        ],
        fears: [
          "Burning out before I make it",
          "Plateauing at $10K/month forever",
          "Looking like a fraud to peers",
        ],
        desires: [
          "A business that runs without me",
          "Predictable $30K+ months",
          "Time freedom to travel and parent",
        ],
      },
      painPoints: [
        "Trading hours for dollars and capped at $15K/month",
        "Drowning in client delivery, no time to market",
        "Tried 4 courses and 2 coaches, results were tactical not strategic",
        "Husband/wife asking when the income will stabilize",
      ],
      dreamOutcome:
        "Run a $50K/month business in 25 hours/week without a team and without launching another offer",
      failedSolutions: [
        "Generic mastermind groups",
        "$2K courses on Instagram growth",
        "Hiring a VA before having systems",
        "Cold DM agencies",
      ],
      platforms: ["Instagram", "Twitter/X", "YouTube", "Email newsletter"],
    },
    offer: {
      dreamOutcome:
        "Predictable $30K-$50K months working 25 hours/week as a solo operator",
      perceivedLikelihood: "Very high (74% of clients hit $30K within 90 days)",
      timeDelay: "First wins in 14 days, full system in 90 days",
      effortRequired: "3 hours of implementation per week",
      pricePoint: "$4,997 one-time or 3 × $1,800",
      deliveryModel:
        "12-week 1:1 hybrid: weekly Voxer access + bi-weekly Zoom + private dashboard",
      grandSlamDescription:
        "The Solo Scale System — the exact 4-step playbook to take a service-based solopreneur from capped $10K months to predictable $30-50K months without hiring a team",
      valueScore: 9,
    },
    positioning: {
      uniqueMechanism: "The 4-Lever Solo Scale Method (Offer · Pricing · Pipeline · Time)",
      categoryOwned: "Solo scaling (not 'agency building' or 'team building')",
      competitors: [
        {
          name: "Agency-builder coaches",
          howYouDiffer:
            "We help you stay solo and 2-3x revenue, not hire a team you don't want",
        },
        {
          name: "Course creators selling 'passive income'",
          howYouDiffer:
            "We design realistic 25-hour weeks, not fantasy passive income",
        },
      ],
      positioningStatement:
        "For service-based solopreneurs stuck under $15K/month who refuse to build a team — the Solo Scale System gets you to $30-50K months in 90 days, working 25 hours/week.",
      pointOfView:
        "Hiring is overrated. Most solopreneurs are 4 levers away from 3x revenue without a single team member.",
    },
    voice: {
      primaryArchetype: "The Sage",
      secondaryArchetype: "The Rebel",
      toneAttributes: ["Direct", "Warm", "Specific", "Anti-fluff"],
      communicationStyle: {
        formalityCasual: 7,
        technicalSimple: 7,
        provocativeNurturing: 6,
      },
      brandPersona:
        "Like a brilliant older sister who runs a 7-figure business and tells you the truth without coddling you",
      alwaysWords: [
        "playbook",
        "leverage",
        "specific",
        "system",
        "predictable",
        "evidence",
      ],
      neverWords: [
        "passionate",
        "guru",
        "hustle harder",
        "manifest",
        "abundance mindset",
      ],
    },
    story: {
      originStory:
        "I scaled my own consulting practice to $42K/month working 22 hours/week as a solo operator after burning out trying to build an agency in 2022.",
      transformationMoment:
        "When I fired my entire team of 4 in 90 days, raised my prices 3x, and tripled my profit — I realized solo wasn't a stepping stone, it was the destination.",
      mission:
        "Help 1,000 service-based solopreneurs build $30K+ months as solo operators by 2027",
      vision:
        "A future where the default growth path for solopreneurs isn't 'hire and scale to chaos' — it's 'optimize and stay solo and profitable'",
      coreValues: [
        "Specificity over inspiration",
        "Evidence over opinion",
        "Time freedom over revenue vanity",
        "Honest feedback over politeness",
      ],
      villain:
        "The agency-builder industrial complex that pressures every successful solopreneur to hire prematurely and trade their freedom for revenue they can't keep",
    },
    messaging: {
      oneLiner:
        "I help service-based solopreneurs hit $30-50K months in 90 days — solo, no team, 25 hours a week.",
      tagline: "Stay solo. Scale anyway.",
      keyMessages: [
        "You don't need a team to break $30K/month",
        "Hiring is the most expensive mistake successful solopreneurs make",
        "4 levers separate $10K and $50K solopreneurs — none of them are 'work harder'",
      ],
      brandScript: {
        hero: "Service-based solopreneur capped under $15K/month",
        problem: {
          external: "Trading hours for dollars with no leverage",
          internal: "Feeling stuck, exhausted, and unsure scaling solo is even possible",
          philosophical:
            "Why does success have to mean hiring a team I don't want?",
        },
        guide: {
          empathy:
            "I scaled to $42K/month solo after burning out building an agency. I get it.",
          authority:
            "74% of my clients hit $30K within 90 days using the same 4 levers",
        },
        plan: [
          "Audit your current 4 levers (Offer, Pricing, Pipeline, Time)",
          "Implement the Solo Scale playbook in 4 sequenced sprints",
          "Hit your first $30K month in 60-90 days",
        ],
        cta: {
          direct: "Book a strategy call",
          transitional: "Get the free Solo Scale audit",
        },
        failure:
          "Stay capped at $10-15K/month forever, burn out, or hire a team and trade freedom for revenue you can't keep",
        success:
          "Predictable $30-50K months as a solo operator, working 25 hours/week with full creative control",
      },
      objections: [
        {
          objection: "I don't have time for a coaching program",
          response:
            "The first 4 hours of the program save you 8 hours/week. Average client gets ROI on time investment in week 2.",
        },
        {
          objection: "I've tried other coaches and didn't get results",
          response:
            "Most coaches sell tactics. We rebuild the 4 levers underneath — that's why 74% hit $30K in 90 days.",
        },
        {
          objection: "Is $4,997 worth it?",
          response:
            "Average client adds $20K/month within 90 days. The ROI math is uncomfortable in our favor.",
        },
      ],
    },
    contentDNA: {
      themes: [
        "Solo scaling tactics",
        "Anti-hire takes",
        "Behind-the-scenes of running a $40K/month solo business",
        "Client transformations",
        "Pricing psychology",
      ],
      hookStyles: [
        "Contrarian take",
        "Specific number lead",
        "Cost-of-inaction frame",
        "Confession / vulnerability",
      ],
      storytellingPatterns: [
        "Before → moment → after",
        "Common belief → why it's wrong → what to do instead",
        "Client case study with numbers",
      ],
      ctaStyle: "DM trigger word + free audit",
      platforms: ["Instagram", "Twitter/X", "Email newsletter"],
      cadence: "5x/week Instagram, daily X, weekly email",
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
