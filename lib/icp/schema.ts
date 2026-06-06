import { z } from "zod/v4";

// ─── Intake ──────────────────────────────────────────────────────────────────

export const SegmentInputSchema = z.object({
  name: z.string().min(1, "Segment name required"),
  pain: z.string().min(1, "Pain required"),
  goals: z.string().min(1, "Goals required"),
  mindset: z.string().min(1, "Mindset required"),
  emotional: z.string().min(1, "Emotional fingerprint required"),
  objections: z.string().min(1, "Objections required"),
  triggers: z.string().min(1, "Buying triggers required"),
});

export const IntakeSchema = z.object({
  businessName: z.string().min(1, "Business name required"),
  logoDataUrl: z.string().optional(),
  whatYouDo: z.string().min(10, "Please describe what you do"),
  industry: z.string().min(1, "Industry required"),
  offer: z.string().min(10, "Describe your offer"),
  channels: z.array(z.string()).min(1, "Select at least one channel"),
  tone: z.array(z.string()).min(1, "Select at least one tone"),
  brandReference: z.string().optional().default(""),
  socialProof: z.string().optional().default(""),
  segments: z.array(SegmentInputSchema).min(1).max(6),
});

export type SegmentInput = z.infer<typeof SegmentInputSchema>;
export type Intake = z.infer<typeof IntakeSchema>;

// ─── Generated ICP ───────────────────────────────────────────────────────────

export const UniversalBlockSchema = z.object({
  painChallenge: z.array(z.string()).length(3),
  painNight: z.array(z.string()).length(3),
  painTried: z.array(z.string()).length(3),
  goals: z.array(z.string()).length(3),
  emotionalFingerprint: z.string().min(10),
  triggers: z.array(z.string()).length(3),
  objections: z.array(z.string()).length(3),
  hesitations: z.array(z.string()).length(3),
});

export const IntensitySchema = z.object({
  painIntensity: z.number().int().min(0).max(100),
  goalClarity: z.number().int().min(0).max(100),
  buyingUrgency: z.number().int().min(0).max(100),
  priceSensitivity: z.number().int().min(0).max(100),
  skepticism: z.number().int().min(0).max(100),
});

export const SegmentOutputSchema = z.object({
  name: z.string(),
  oneLine: z.string(),
  pain: z.array(z.string()).length(3),
  goals: z.array(z.string()).length(3),
  mindset: z.array(z.string()).length(3),
  objections: z.array(z.string()).length(3),
  triggers: z.array(z.string()).length(3),
  intensity: IntensitySchema,
});

export const GeneratedICPSchema = z.object({
  businessName: z.string(),
  industryLabel: z.string(),
  regionLabel: z.string(),
  monthYear: z.string(),
  universal: UniversalBlockSchema,
  segments: z.array(SegmentOutputSchema).min(1).max(6),
});

export type UniversalBlock = z.infer<typeof UniversalBlockSchema>;
export type Intensity = z.infer<typeof IntensitySchema>;
export type SegmentOutput = z.infer<typeof SegmentOutputSchema>;
export type GeneratedICP = z.infer<typeof GeneratedICPSchema>;

// ─── Channels & Tones ────────────────────────────────────────────────────────

export const CHANNELS = [
  { value: "facebook", label: "Facebook Ads" },
  { value: "instagram", label: "Instagram" },
  { value: "google", label: "Google Ads" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "email", label: "Email" },
  { value: "seo", label: "SEO / Content" },
  { value: "podcast", label: "Podcast" },
  { value: "referral", label: "Referral" },
] as const;

export const TONES = [
  { value: "bold", label: "Bold" },
  { value: "warm", label: "Warm" },
  { value: "authoritative", label: "Authoritative" },
  { value: "playful", label: "Playful" },
  { value: "clinical", label: "Clinical" },
  { value: "rebellious", label: "Rebellious" },
  { value: "empathetic", label: "Empathetic" },
  { value: "sophisticated", label: "Sophisticated" },
  { value: "urgent", label: "Urgent" },
  { value: "educational", label: "Educational" },
] as const;
