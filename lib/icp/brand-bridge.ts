import type {
  ICP,
  Niche,
  Offer,
  Voice,
  ContentDNA,
  BrandDNA,
} from "@/types/brand";
import type { Intake, SegmentInput, GeneratedICP } from "./schema";
import { CHANNELS } from "./schema";

type ChannelValue = (typeof CHANNELS)[number]["value"];
const CHANNEL_VALUES = new Set<string>(CHANNELS.map((c) => c.value));
const isChannel = (p: string): p is ChannelValue => CHANNEL_VALUES.has(p);

// Seed the ICP-Map intake form from the saved Brand DNA `icp` pillar.
export function brandToIntake(icp: ICP): Partial<Intake> {
  const psy = icp.psychographics;

  const segment: SegmentInput = {
    name: icp.name || "Primary Segment",
    pain: icp.painPoints.join("\n"),
    goals: icp.dreamOutcome,
    mindset: psy.beliefs.join("\n"),
    emotional: psy.fears.join("\n"),
    objections: icp.failedSolutions.join("\n"),
    triggers: psy.desires.join("\n"),
  };

  const channels = icp.platforms.filter(isChannel);

  return {
    industry: icp.demographics.jobTitle || "",
    channels: channels.length ? channels : undefined,
    segments: [segment],
  };
}

// Write a generated ICP map back into the Brand DNA `icp` pillar.
// Preserves the FULL map (universal block + every segment) alongside the
// flattened convenience fields older consumers still read.
export function generatedToBrand(icp: GeneratedICP): Partial<ICP> {
  const u = icp.universal;
  const firstSegment = icp.segments[0];

  return {
    name: firstSegment?.name || icp.businessName,
    painPoints: [...u.painChallenge, ...u.painNight],
    dreamOutcome: u.goals.join(" / "),
    failedSolutions: u.painTried,
    psychographics: {
      values: [],
      beliefs: icp.segments.flatMap((s) => s.mindset),
      fears: u.painNight,
      desires: u.goals,
    },
    // Rich, lossless map data — what content generation should rely on.
    universal: {
      painChallenge: u.painChallenge,
      painNight: u.painNight,
      painTried: u.painTried,
      goals: u.goals,
      emotionalFingerprint: u.emotionalFingerprint,
      triggers: u.triggers,
      objections: u.objections,
      hesitations: u.hesitations,
    },
    segments: icp.segments.map((s) => ({
      name: s.name,
      oneLine: s.oneLine,
      pain: s.pain,
      goals: s.goals,
      mindset: s.mindset,
      objections: s.objections,
      triggers: s.triggers,
      intensity: { ...s.intensity },
    })),
    businessName: icp.businessName,
    industryLabel: icp.industryLabel,
    regionLabel: icp.regionLabel,
  };
}

// ─── Full ICP-Map → Brand DNA bridge ─────────────────────────────────────────
//
// SOP / invariant: EVERY field captured in the ICP Map must be reflected in the
// Brand DNA. The generated map's psychology (universal pains/goals/problems +
// every segment) is the ICP pillar's source of truth and is always written.
// The remaining intake answers (offer, tone, channels, what-you-do, social
// proof, brand references, industry) are mirrored into their natural pillars —
// but only into fields the user hasn't already filled, so manual edits to other
// pillars are never clobbered.
//
// If you add a field to the ICP intake or generated schema, ADD IT HERE too.

export interface BrandPillarPatch {
  icp: Partial<ICP>;
  niche?: Partial<Niche>;
  offer?: Partial<Offer>;
  voice?: Partial<Voice>;
  contentDNA?: Partial<ContentDNA>;
}

const blankStr = (v: string | undefined): boolean => !v || !v.trim();
const blankArr = (v: readonly unknown[] | undefined): boolean =>
  !v || v.length === 0;

export function icpToBrandUpdate(
  generated: GeneratedICP,
  intake: Partial<Intake> | undefined,
  current: BrandDNA,
): BrandPillarPatch {
  // ICP pillar — the map's own home; always authoritative (lossless).
  const icp = generatedToBrand(generated);

  const channels = (intake?.channels ?? []).filter(isChannel);
  if (channels.length) icp.platforms = channels;

  const patch: BrandPillarPatch = { icp };

  // Niche — fill-empty only.
  const niche: Partial<Niche> = {};
  if (intake?.industry && blankStr(current.niche.marketCategory))
    niche.marketCategory = intake.industry;
  if (intake?.whatYouDo && blankStr(current.niche.subNiche))
    niche.subNiche = intake.whatYouDo;
  if (Object.keys(niche).length) patch.niche = niche;

  // Offer — fill-empty only.
  const offer: Partial<Offer> = {};
  if (intake?.offer && blankStr(current.offer.grandSlamDescription))
    offer.grandSlamDescription = intake.offer;
  if (intake?.socialProof && blankStr(current.offer.perceivedLikelihood))
    offer.perceivedLikelihood = intake.socialProof;
  if (blankStr(current.offer.dreamOutcome) && generated.universal.goals.length)
    offer.dreamOutcome = generated.universal.goals.join(" / ");
  if (Object.keys(offer).length) patch.offer = offer;

  // Voice — fill-empty only.
  const voice: Partial<Voice> = {};
  if (intake?.tone?.length && blankArr(current.voice.toneAttributes))
    voice.toneAttributes = intake.tone;
  if (intake?.brandReference && blankStr(current.voice.brandPersona))
    voice.brandPersona = intake.brandReference;
  if (Object.keys(voice).length) patch.voice = voice;

  // Content DNA — fill-empty only.
  const contentDNA: Partial<ContentDNA> = {};
  if (channels.length && blankArr(current.contentDNA.platforms))
    contentDNA.platforms = channels;
  if (Object.keys(contentDNA).length) patch.contentDNA = contentDNA;

  return patch;
}
