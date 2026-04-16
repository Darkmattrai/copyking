import type { GeneratorDef, GeneratorCategory } from "./types";
import { GENERATOR_CATEGORIES } from "./types";

export { GENERATOR_CATEGORIES };

export const GENERATORS: GeneratorDef[] = [
  // ── Social ──────────────────────────────────────────────────────
  {
    slug: "instagram-bio",
    name: "Instagram Bio Generator",
    description: "Craft a high-converting 150-char bio with 3 variations",
    icon: "instagram",
    category: "social",
    outputFormat: "markdown",
  },
  {
    slug: "instagram-stories",
    name: "Instagram Stories Generator",
    description: "7-slide story sequence with hooks, polls, and CTAs",
    icon: "instagram",
    category: "social",
    outputFormat: "markdown",
  },
  {
    slug: "organic-content-ideas",
    name: "Organic Content Idea Generator",
    description: "30-day content calendar with daily topics and formats",
    icon: "pen",
    category: "social",
    outputFormat: "markdown",
  },
  {
    slug: "organic-content-generator",
    name: "Organic Content Generator",
    description: "Full post with caption for any format",
    icon: "pen",
    category: "social",
    params: [
      {
        key: "format",
        label: "Content Format",
        type: "select",
        required: true,
        options: [
          { value: "carousel", label: "Carousel (8-10 slides)" },
          { value: "reel", label: "Reel / Short Video" },
          { value: "thread", label: "Text Post / Thread" },
        ],
      },
      {
        key: "topic",
        label: "Topic or angle",
        type: "text",
        placeholder: "e.g. 3 mistakes beginners make with meal prep",
        required: true,
      },
    ],
    outputFormat: "markdown",
  },
  {
    slug: "organic-caption",
    name: "Organic Content Caption Generator",
    description: "Hook + body + CTA + hashtags for any post",
    icon: "pen",
    category: "social",
    params: [
      {
        key: "description",
        label: "Describe your post",
        type: "textarea",
        placeholder: "What is the post about? What image or video are you sharing?",
        required: true,
      },
    ],
    outputFormat: "markdown",
  },

  // ── Funnels ─────────────────────────────────────────────────────
  {
    slug: "lead-magnet-ideas",
    name: "Lead Magnet Idea Generator",
    description: "10 lead magnet ideas ranked by conversion potential",
    icon: "funnel",
    category: "funnels",
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
    description: "Full offer stack: core, bonuses, guarantee, pricing, objections",
    icon: "offer",
    category: "offers",
    params: [
      {
        key: "pricePoint",
        label: "Price point",
        type: "text",
        placeholder: "e.g. $2,997 one-time or $497/mo",
        required: true,
      },
    ],
    outputFormat: "markdown",
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
