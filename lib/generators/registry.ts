import type { GeneratorDef, GeneratorCategory } from "./types";
import { GENERATOR_CATEGORIES } from "./types";

export { GENERATOR_CATEGORIES };

export const GENERATORS: GeneratorDef[] = [
  // ── Foundation ──────────────────────────────────────────────────
  {
    slug: "icp-map",
    name: "ICP Map Generator",
    description:
      "Visual ideal-customer-profile map: psychology brain, universal block, and up to 6 segments — built via guided interview or manual intake",
    icon: "target",
    category: "foundation",
    outputFormat: "structured",
  },

  // ── Social ──────────────────────────────────────────────────────
  {
    slug: "instagram-bio",
    name: "Instagram Bio Generator",
    description:
      "Full 2026 profile package: SEO audit, 6 bio formulas, multi-link strategy, highlights, pinned posts, and a bio score",
    icon: "instagram",
    category: "social",
    params: [
      {
        key: "accountType",
        label: "Account type",
        type: "select",
        options: [
          { value: "auto", label: "Auto (use Brand DNA)" },
          { value: "personal-brand", label: "Personal Brand" },
          { value: "coach", label: "Coach / Consultant" },
          { value: "creator", label: "Creator / Influencer" },
          { value: "business", label: "Business / Brand" },
          { value: "local", label: "Local Business" },
          { value: "ecommerce", label: "Ecommerce" },
          { value: "agency", label: "Agency" },
          { value: "author", label: "Author / Speaker" },
        ],
      },
      {
        key: "primaryGoal",
        label: "Primary goal",
        type: "select",
        options: [
          { value: "auto", label: "Auto (infer from offer)" },
          { value: "dms", label: "Drive DMs" },
          { value: "calls", label: "Book calls" },
          { value: "newsletter", label: "Newsletter signups" },
          { value: "sales", label: "Sell product" },
          { value: "follows", label: "Drive followers" },
          { value: "clicks", label: "Drive link clicks" },
          { value: "local-visits", label: "Local visits" },
        ],
      },
      {
        key: "aestheticStyle",
        label: "Aesthetic style",
        type: "select",
        options: [
          { value: "auto", label: "Auto (match brand voice)" },
          { value: "clean-minimal", label: "Clean Minimal" },
          { value: "lowercase", label: "Lowercase Aesthetic (2026)" },
          { value: "strategic-emoji", label: "Strategic Emoji" },
          { value: "bold-punchy", label: "Bold / Punchy" },
          { value: "professional", label: "Professional" },
          { value: "playful", label: "Playful" },
        ],
      },
      {
        key: "emojiDensity",
        label: "Emoji density",
        type: "select",
        options: [
          { value: "auto", label: "Auto" },
          { value: "none", label: "None" },
          { value: "minimal", label: "Minimal (1-2)" },
          { value: "strategic", label: "Strategic (3-5)" },
          { value: "expressive", label: "Expressive (5+)" },
        ],
      },
      {
        key: "location",
        label: "Location (optional)",
        type: "text",
        placeholder: "e.g. NYC, Bali, London",
      },
      {
        key: "primaryKeyword",
        label: "Primary search keyword (optional)",
        type: "text",
        placeholder: "e.g. fitness coach, wedding photographer",
      },
      {
        key: "currentUsername",
        label: "Current @ handle (optional, for audit)",
        type: "text",
        placeholder: "@yourhandle",
      },
    ],
    outputFormat: "markdown",
  },
  {
    slug: "instagram-stories",
    name: "Instagram Stories Generator",
    description:
      "Slide-by-slide story series tuned for the 2026 Stories algorithm: stickers, DM ladder, safe-zone visual direction, posting cadence, and metric targets",
    icon: "instagram",
    category: "social",
    params: [
      {
        key: "objective",
        label: "Objective",
        type: "select",
        required: true,
        options: [
          { value: "dm", label: "Drive DM conversations" },
          { value: "link-click", label: "Drive link clicks" },
          { value: "sale", label: "Drive a sale" },
          { value: "profile-follow", label: "Grow follows" },
          { value: "engagement-build", label: "Build engagement / warm audience" },
          { value: "booked-appointments", label: "Drive booked appointments" },
        ],
      },
      {
        key: "seriesLength",
        label: "Series length",
        type: "select",
        required: true,
        options: [
          { value: "short", label: "Short (5 slides)" },
          { value: "standard", label: "Standard (9 slides)" },
          { value: "power", label: "Power Series (13 slides — max reach cap)" },
        ],
      },
      {
        key: "ctaDestination",
        label: "Primary CTA destination",
        type: "select",
        required: true,
        options: [
          { value: "dm-keyword", label: "DM keyword trigger" },
          { value: "link-sticker", label: "Link sticker" },
          { value: "poll-vote", label: "Poll vote" },
          { value: "profile-visit", label: "Profile visit" },
        ],
      },
      {
        key: "tonePreset",
        label: "Tone preset",
        type: "select",
        required: true,
        options: [
          { value: "brand", label: "Brand Voice (from Brand DNA)" },
          { value: "bold", label: "Bold / provocative" },
          { value: "educational", label: "Educational" },
          { value: "bts", label: "Behind-the-scenes" },
          { value: "story", label: "Story-driven" },
        ],
      },
      {
        key: "topic",
        label: "Topic or angle (optional)",
        type: "text",
        placeholder: "e.g. 3 mistakes coaches make pricing high-ticket offers",
      },
      {
        key: "triggerKeyword",
        label: "DM trigger keyword (optional)",
        type: "text",
        placeholder: "e.g. GUIDE, START, AUDIT",
      },
    ],
    outputFormat: "markdown",
  },
  {
    slug: "organic-content-ideas",
    name: "Instagram Content Calendar Generator",
    description: "30-day Instagram calendar built for the 2026 algorithm: Reels, carousels, hooks, SEO keywords, save/send triggers",
    icon: "instagram",
    category: "social",
    outputFormat: "markdown",
  },

  // ── Funnels ─────────────────────────────────────────────────────
  {
    slug: "lead-magnet-ideas",
    name: "Lead Magnet Idea Generator",
    description: "10 ranked lead magnet ideas with conversion estimates, bridge-to-offer mapping, and ready-to-use headlines",
    icon: "funnel",
    category: "funnels",
    params: [
      {
        key: "trafficTemperature",
        label: "Traffic temperature (where will most leads come from?)",
        type: "select",
        required: false,
        options: [
          { value: "cold", label: "Cold — paid ads, SEO, cold outreach (problem-aware/unaware)" },
          { value: "warm", label: "Warm — organic social, podcast guests, partner audiences (solution-aware)" },
          { value: "hot", label: "Hot — email list, retargeting, existing community (product-aware)" },
          { value: "mixed", label: "Mixed — give me a balanced spread" },
        ],
      },
      {
        key: "primaryChannel",
        label: "Primary traffic source (optional)",
        type: "select",
        required: false,
        options: [
          { value: "meta-ads", label: "Meta ads (Facebook/Instagram)" },
          { value: "google-ads", label: "Google ads / search" },
          { value: "organic-social", label: "Organic social (IG, TikTok, LinkedIn, X)" },
          { value: "seo-blog", label: "SEO / blog" },
          { value: "email-list", label: "Existing email list" },
          { value: "cold-outreach", label: "Cold outreach (DM / email)" },
          { value: "podcast-youtube", label: "Podcast / YouTube" },
        ],
      },
      {
        key: "bridgeOffer",
        label: "Bridge offer focus (optional)",
        type: "textarea",
        placeholder: "Which paid offer should these magnets bridge to? Leave blank to use the default offer from your Brand DNA.",
        required: false,
      },
    ],
    outputFormat: "markdown",
  },
  {
    slug: "lead-magnet-funnel",
    name: "Lead Magnet Funnel Generator",
    description: "Landing page + thank you page + 5-email welcome sequence",
    icon: "funnel",
    category: "funnels",
    params: [
      {
        key: "leadMagnet",
        label: "Which lead magnet?",
        type: "textarea",
        placeholder: "Describe your lead magnet (name, format, what it teaches)",
        required: true,
      },
    ],
    outputFormat: "markdown",
  },
  {
    slug: "vsl-funnel",
    name: "VSL Script & Funnel Generator",
    description: "Full VSL script + landing page + order page copy",
    icon: "funnel",
    category: "funnels",
    params: [
      {
        key: "offerName",
        label: "Offer name",
        type: "text",
        placeholder: "e.g. The 90-Day Transformation Program",
        required: true,
      },
    ],
    outputFormat: "markdown",
  },

  // ── Email ───────────────────────────────────────────────────────
  {
    slug: "soap-opera-sequence",
    name: "Soap Opera Sequence Generator",
    description: "5-email story arc with cliffhangers that sell",
    icon: "email",
    category: "email",
    outputFormat: "markdown",
  },
  {
    slug: "seinfeld-sequence",
    name: "Seinfeld Sequence Generator",
    description: "7 edu-tainment emails that build trust and sell softly",
    icon: "email",
    category: "email",
    outputFormat: "markdown",
  },
  {
    slug: "high-ticket-questionnaire",
    name: "High Ticket Application Funnel",
    description: "Application page + questions + confirmation + review email",
    icon: "email",
    category: "email",
    outputFormat: "markdown",
  },

  // ── Sales ───────────────────────────────────────────────────────
  {
    slug: "dm-setting-script",
    name: "DM Setting Script Generator",
    description: "Natural DM framework: opener → qualifier → book call",
    icon: "sales",
    category: "sales",
    outputFormat: "markdown",
  },
  {
    slug: "phone-setting-script",
    name: "Phone Setting Script Generator",
    description: "Appointment setting call script with objection handlers",
    icon: "sales",
    category: "sales",
    outputFormat: "markdown",
  },
  {
    slug: "sales-closing-script",
    name: "Sales Closing Script Generator",
    description: "Consultative close: diagnosis → offer → objection handling",
    icon: "sales",
    category: "sales",
    outputFormat: "markdown",
  },

  // ── Ads ─────────────────────────────────────────────────────────
  {
    slug: "ad-copy",
    name: "Ad Copy Generator",
    description: "3 ad copy variations using PAS, AIDA, and Story frameworks",
    icon: "ad",
    category: "ads",
    params: [
      {
        key: "platform",
        label: "Platform",
        type: "select",
        required: true,
        options: [
          { value: "facebook", label: "Facebook / Instagram" },
          { value: "google", label: "Google Ads" },
          { value: "linkedin", label: "LinkedIn" },
        ],
      },
      {
        key: "goal",
        label: "Campaign goal",
        type: "text",
        placeholder: "e.g. Drive webinar registrations",
        required: true,
      },
    ],
    outputFormat: "markdown",
  },
  {
    slug: "image-ad",
    name: "Image Ad Generator",
    description: "3 ad concepts with creative direction, copy, and design specs",
    icon: "ad",
    category: "ads",
    params: [
      {
        key: "platform",
        label: "Platform",
        type: "select",
        required: true,
        options: [
          { value: "facebook", label: "Facebook / Instagram" },
          { value: "linkedin", label: "LinkedIn" },
          { value: "google-display", label: "Google Display" },
        ],
      },
      {
        key: "goal",
        label: "Campaign goal",
        type: "text",
        placeholder: "e.g. Generate leads for free consultation",
        required: true,
      },
    ],
    outputFormat: "markdown",
  },
  {
    slug: "video-ad",
    name: "Video Ad Generator",
    description: "Hook-problem-solution-CTA script with visual direction",
    icon: "ad",
    category: "ads",
    params: [
      {
        key: "length",
        label: "Video length",
        type: "select",
        required: true,
        options: [
          { value: "15s", label: "15 seconds (TikTok / Reels)" },
          { value: "30s", label: "30 seconds (Facebook / Instagram)" },
          { value: "60s", label: "60 seconds (YouTube / Facebook)" },
        ],
      },
      {
        key: "platform",
        label: "Platform",
        type: "select",
        required: true,
        options: [
          { value: "tiktok", label: "TikTok" },
          { value: "instagram", label: "Instagram Reels" },
          { value: "facebook", label: "Facebook" },
          { value: "youtube", label: "YouTube" },
        ],
      },
    ],
    outputFormat: "markdown",
  },

  // ── Video ───────────────────────────────────────────────────────
  {
    slug: "youtube-video",
    name: "YouTube Video Generator",
    description: "Title + thumbnail + full script with retention hooks",
    icon: "video",
    category: "video",
    params: [
      {
        key: "topic",
        label: "Video topic",
        type: "text",
        placeholder: "e.g. How to build a 6-figure coaching business from scratch",
        required: true,
      },
      {
        key: "length",
        label: "Target length",
        type: "select",
        required: true,
        options: [
          { value: "8-10min", label: "8-10 minutes (quick value)" },
          { value: "15-20min", label: "15-20 minutes (deep dive)" },
          { value: "25-30min", label: "25-30 minutes (comprehensive)" },
        ],
      },
    ],
    outputFormat: "markdown",
  },
  {
    slug: "youtube-thumbnail",
    name: "YouTube Thumbnail Generator",
    description: "3 thumbnail concepts with composition, colors, and text",
    icon: "video",
    category: "video",
    params: [
      {
        key: "topic",
        label: "Video topic",
        type: "text",
        placeholder: "e.g. Why most people fail at meal prepping",
        required: true,
      },
    ],
    outputFormat: "markdown",
  },
  {
    slug: "webinar-script",
    name: "Webinar Script Generator",
    description: "60-min script: intro, 3 secrets, offer stack, close",
    icon: "video",
    category: "video",
    params: [
      {
        key: "topic",
        label: "Webinar topic",
        type: "text",
        placeholder: "e.g. The 3 Secrets to Scaling Your Agency Past $50K/mo",
        required: true,
      },
      {
        key: "offerPrice",
        label: "Offer price point",
        type: "text",
        placeholder: "e.g. $2,997 or $497/mo",
        required: true,
      },
    ],
    outputFormat: "markdown",
  },

  // ── Offers ──────────────────────────────────────────────────────
  {
    slug: "irresistible-offer",
    name: "Irresistible Offer Builder",
    description:
      "11-step Grand Slam offer builder: bullseye, features/benefits, value ladder pricing, guarantee, scarcity, objections, and naming — with AI field enhancement",
    icon: "offer",
    category: "offers",
    outputFormat: "structured",
  },
];

export function getGenerator(slug: string): GeneratorDef | undefined {
  return GENERATORS.find((g) => g.slug === slug);
}

export function getGeneratorsByCategory(): Record<GeneratorCategory, GeneratorDef[]> {
  const grouped = {} as Record<GeneratorCategory, GeneratorDef[]>;
  for (const cat of GENERATOR_CATEGORIES) {
    grouped[cat.key] = GENERATORS.filter((g) => g.category === cat.key);
  }
  return grouped;
}
