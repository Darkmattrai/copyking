import type { ICP } from "@/types/brand";
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
  };
}
