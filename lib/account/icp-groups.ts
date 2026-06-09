// Read-only answer groups built from the SAVED Brand DNA `icp` pillar — the
// universal psychology block and every generated audience segment. This is the
// source of truth the ICP Map writes to, and the only complete record for
// guided-chat clients (whose raw intake form is left blank). Shared by both the
// editable account hook and the read-only admin builder so the ICP Map tab
// always shows the real pains/goals/segments, not the empty intake defaults.

import type { BrandDNA } from "@/types/brand";
import type { AnswerGroup } from "./brand-dna-answers";

const joinList = (a?: string[]) => (a ?? []).join("\n");

export function hasBrandIcpSegments(brandDNA?: BrandDNA | null): boolean {
  return (brandDNA?.icp.segments?.length ?? 0) > 0;
}

export function icpBrandPsychologyGroups(
  brandDNA?: BrandDNA | null,
): AnswerGroup[] {
  const icp = brandDNA?.icp;
  if (!icp) return [];

  const groups: AnswerGroup[] = [];
  const u = icp.universal;

  const hasUniversal =
    !!u &&
    (u.painChallenge?.length ||
      u.painNight?.length ||
      u.painTried?.length ||
      u.goals?.length ||
      !!u.emotionalFingerprint ||
      u.triggers?.length ||
      u.objections?.length ||
      u.hesitations?.length);

  if (hasUniversal) {
    groups.push({
      feature: "ICP",
      category: "Universal Psychology — shared across every segment",
      fields: [
        { id: "icp.universal.painChallenge", feature: "ICP", question: "Biggest challenges", value: joinList(u.painChallenge), kind: "readonly" },
        { id: "icp.universal.painNight", feature: "ICP", question: "What keeps them up at night", value: joinList(u.painNight), kind: "readonly" },
        { id: "icp.universal.painTried", feature: "ICP", question: "What they've already tried (and it failed)", value: joinList(u.painTried), kind: "readonly" },
        { id: "icp.universal.goals", feature: "ICP", question: "Goals & dreams", value: joinList(u.goals), kind: "readonly" },
        { id: "icp.universal.emotionalFingerprint", feature: "ICP", question: "Emotional fingerprint", value: u.emotionalFingerprint ?? "", kind: "readonly" },
        { id: "icp.universal.triggers", feature: "ICP", question: "Buying triggers", value: joinList(u.triggers), kind: "readonly" },
        { id: "icp.universal.objections", feature: "ICP", question: "Objections", value: joinList(u.objections), kind: "readonly" },
        { id: "icp.universal.hesitations", feature: "ICP", question: "Hesitations", value: joinList(u.hesitations), kind: "readonly" },
      ],
    });
  }

  (icp.segments ?? []).forEach((s, idx) => {
    const it = s.intensity;
    const intensityStr = it
      ? `Pain ${it.painIntensity} · Goal clarity ${it.goalClarity} · Buying urgency ${it.buyingUrgency} · Price sensitivity ${it.priceSensitivity} · Skepticism ${it.skepticism}`
      : "";
    groups.push({
      feature: "ICP",
      category: `Audience Segment: ${s.name || `Segment ${idx + 1}`}`,
      fields: [
        { id: `icp.brandSeg.${idx}.oneLine`, feature: "ICP", question: "One-line summary", value: s.oneLine ?? "", kind: "readonly" },
        { id: `icp.brandSeg.${idx}.pain`, feature: "ICP", question: "Core pain", value: joinList(s.pain), kind: "readonly" },
        { id: `icp.brandSeg.${idx}.goals`, feature: "ICP", question: "Goals", value: joinList(s.goals), kind: "readonly" },
        { id: `icp.brandSeg.${idx}.mindset`, feature: "ICP", question: "Mindset", value: joinList(s.mindset), kind: "readonly" },
        { id: `icp.brandSeg.${idx}.objections`, feature: "ICP", question: "Objections", value: joinList(s.objections), kind: "readonly" },
        { id: `icp.brandSeg.${idx}.triggers`, feature: "ICP", question: "Buying triggers", value: joinList(s.triggers), kind: "readonly" },
        { id: `icp.brandSeg.${idx}.intensity`, feature: "ICP", question: "Intensity (0–100)", value: intensityStr, kind: "readonly" },
      ],
    });
  });

  return groups;
}
