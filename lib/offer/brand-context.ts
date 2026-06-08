import type { BrandDNA } from "@/types/brand";

// True when the user has already built their audience psychology (ICP map).
// We treat a populated universal block or any saved segment as "built".
export function hasIcpBuilt(brandDNA: BrandDNA): boolean {
  const icp = brandDNA.icp;
  if (!icp) return false;
  const u = icp.universal;
  const universalFilled = Boolean(
    u &&
      (u.painChallenge?.length ||
        u.painNight?.length ||
        u.goals?.length ||
        u.emotionalFingerprint ||
        u.triggers?.length ||
        u.objections?.length),
  );
  return universalFilled || (icp.segments?.length ?? 0) > 0;
}

// Build a compact, readable snapshot of the user's Brand DNA for the offer
// guided-chat system prompt. Pulls from niche + ICP (universal + segments) +
// any existing offer so the strategist can ground every proposal in this exact
// audience. Returns "" when there's nothing useful on file.
export function buildOfferBrandContext(brandDNA: BrandDNA): string {
  const sections: string[] = [];

  const niche = brandDNA.niche;
  if (niche?.marketCategory || niche?.subNiche) {
    const parts = [
      niche.marketCategory && `Market: ${niche.marketCategory}`,
      niche.subNiche && `Sub-niche: ${niche.subNiche}`,
      niche.congregationPoints?.length &&
        `Found at: ${niche.congregationPoints.join(", ")}`,
    ].filter(Boolean);
    if (parts.length) sections.push(`NICHE\n${parts.join("\n")}`);
  }

  const icp = brandDNA.icp;
  if (icp) {
    const u = icp.universal;
    const lines: string[] = [];

    if (icp.businessName || icp.industryLabel || icp.regionLabel) {
      lines.push(
        `Business: ${icp.businessName || "?"} | Industry: ${icp.industryLabel || "?"} | Region: ${icp.regionLabel || "?"}`,
      );
    }

    const hasUniversal = Boolean(
      u &&
        (u.painChallenge?.length ||
          u.painNight?.length ||
          u.goals?.length ||
          u.emotionalFingerprint ||
          u.triggers?.length ||
          u.objections?.length),
    );

    if (hasUniversal) {
      if (u.painChallenge?.length)
        lines.push(`Core challenges: ${u.painChallenge.join("; ")}`);
      if (u.painNight?.length)
        lines.push(`Keeps them up at night: ${u.painNight.join("; ")}`);
      if (u.painTried?.length)
        lines.push(`Already tried (failed): ${u.painTried.join("; ")}`);
      if (u.goals?.length) lines.push(`Goals/dreams: ${u.goals.join("; ")}`);
      if (u.emotionalFingerprint)
        lines.push(`Emotional fingerprint: ${u.emotionalFingerprint}`);
      if (u.triggers?.length)
        lines.push(`Buying triggers: ${u.triggers.join("; ")}`);
      if (u.objections?.length)
        lines.push(`Objections: ${u.objections.join("; ")}`);
      if (u.hesitations?.length)
        lines.push(`Hesitations: ${u.hesitations.join("; ")}`);
    } else {
      // Fall back to the flattened fields for older Brand DNA records.
      if (icp.name) lines.push(`Primary avatar: ${icp.name}`);
      if (icp.painPoints?.length)
        lines.push(`Pain points: ${icp.painPoints.join("; ")}`);
      if (icp.dreamOutcome) lines.push(`Dream outcome: ${icp.dreamOutcome}`);
      if (icp.failedSolutions?.length)
        lines.push(`Failed solutions: ${icp.failedSolutions.join("; ")}`);
      if (icp.psychographics?.fears?.length)
        lines.push(`Fears: ${icp.psychographics.fears.join(", ")}`);
      if (icp.psychographics?.desires?.length)
        lines.push(`Desires: ${icp.psychographics.desires.join(", ")}`);
    }

    if (icp.segments?.length) {
      const segLines = icp.segments.map((s, i) => {
        const bits = [
          `Segment ${i + 1}: ${s.name || "Unnamed"}${s.oneLine ? ` — ${s.oneLine}` : ""}`,
          s.pain?.length && `  Pain: ${s.pain.join("; ")}`,
          s.goals?.length && `  Goals: ${s.goals.join("; ")}`,
          s.mindset?.length && `  Mindset: ${s.mindset.join("; ")}`,
          s.objections?.length && `  Objections: ${s.objections.join("; ")}`,
          s.triggers?.length && `  Triggers: ${s.triggers.join("; ")}`,
        ].filter(Boolean);
        return bits.join("\n");
      });
      lines.push(
        `\nAUDIENCE SEGMENTS (${icp.segments.length})\n${segLines.join("\n\n")}`,
      );
    }

    if (lines.length) sections.push(`AUDIENCE PSYCHOLOGY\n${lines.join("\n")}`);
  }

  const offer = brandDNA.offer;
  if (offer?.dreamOutcome || offer?.grandSlamDescription || offer?.pricePoint) {
    const parts = [
      offer.dreamOutcome && `Dream outcome: ${offer.dreamOutcome}`,
      offer.grandSlamDescription && `Current offer: ${offer.grandSlamDescription}`,
      offer.deliveryModel && `Delivery model: ${offer.deliveryModel}`,
      offer.pricePoint && `Price point: ${offer.pricePoint}`,
    ].filter(Boolean);
    if (parts.length) sections.push(`EXISTING OFFER\n${parts.join("\n")}`);
  }

  return sections.join("\n\n");
}
