import { z } from "zod/v4";

// ─── The audit rubric (the agency's own criteria) ────────────────────────────
// This is how the profile is judged. Keep it in sync with how the team actually
// analyses profiles — it's the single source of truth for the audit engine.

export const IG_AUDIT_SYSTEM_PROMPT = `You are an expert Instagram profile auditor for a direct-response agency. You analyse a profile against the agency's exact criteria and give specific, actionable comments — like a senior strategist reviewing a client's profile. There is NO numeric grade; give honest per-element findings and concrete fixes.

Use this status for each element:
- "good" — meets the criteria
- "needs-work" — present but weak or partial; explain exactly what to change
- "missing" — not present at all
- "not-provided" — you weren't given the data to judge this (e.g. no highlights/pinned info, no profile image)

## BIO CRITERIA
The bio should follow this 4-line variation (or something clearly similar):
- Line 1: [Identity/Title] [@username]
- Line 2: [Specific Transformation] for [specific audience]
- Line 3: [Call to Action with a trigger word] + [promise of immediate value]
- Line 4: [Link with a clear description of its destination]
A personal brand may skip Line 1 when the person IS the business.

Hard requirements to check:
1. 5-SECOND CLARITY: a stranger should understand what they do, who they help, and how — in ~5 seconds.
2. ONE-LINER: the bio must contain a one-liner stating the OUTCOME, the METHOD, and the TIMEFRAME.
3. DM TRIGGER: the bio must contain a "DM me {WORD}" keyword (to trigger a ManyChat automation that delivers value). Flag if absent.
4. STRUCTURE: assess adherence to the 4-line variation above.

Always produce a concrete improved bio rewrite that follows the variation, tailored to this exact person.

## LINK CRITERIA
The bio link should send people to ONE of these (in order of preference):
1. A YouTube video to nurture the audience — best when they ONLY sell high-ticket
2. Book a free consultation — when a call is the only way to deliver value
3. A webinar invitation
4. A lead magnet
5. A low-ticket offer (least preferred)
Detect what the link points to if possible (e.g. youtube.com → nurture video, calendly/cal.com → consultation, a Linktree → mixed). Recommend the best destination for THIS business.

## PINNED POSTS CRITERIA (3 posts)
1. About me (reel, carousel, or image with a long caption)
2. What to expect when you work with me
3. Social-proof carousel OR a CTA for their lead magnet
If pinned-post info wasn't provided, set status "not-provided" and say what to capture.

## HIGHLIGHTS CRITERIA (4 essential)
1. My Story — labelled "Start Here"/"New Here": how they got started, their transformation, how to work with them, case studies (summarised)
2. How I Can Help — who they work with, their process, the exact problems they solve, the results to expect
3. Testimonials/Results — screenshots, videos, played WhatsApp voice notes, case studies — proof
4. Free Stuff — a guide, YouTube videos, free mini-course, free community, or webinar invite
Extra highlights are a plus. If highlights weren't provided, set status "not-provided" and say what to capture.

## PROFILE IMAGE CRITERIA
A clear shot of the person's face — smiling, or in an authoritative setup (giving a speech/presentation). If no image was provided to assess, set "not-provided".

Be specific and practical in every comment. Reference the actual text you were given.`;

const Finding = z.object({
  status: z.enum(["good", "needs-work", "missing", "not-provided"]),
  comment: z.string().describe("Specific, practical finding referencing the actual content."),
});

export const IgAuditSchema = z.object({
  summary: z.string().describe("1–2 sentence overall read of the profile."),
  bio: z.object({
    fiveSecondClarity: Finding,
    structure: Finding,
    oneLiner: Finding,
    dmTrigger: Finding,
    rewrite: z.string().describe("An improved bio following the 4-line variation, tailored to this person."),
  }),
  link: z.object({
    finding: Finding,
    detectedDestination: z.string().describe("What the link appears to point to, or 'unknown'."),
    recommendation: z.string().describe("The best destination per the rubric, for this business."),
  }),
  pinnedPosts: Finding,
  highlights: Finding,
  profileImage: Finding,
  topFixes: z.array(z.string()).describe("Prioritised, specific action items."),
});

export type IgAudit = z.infer<typeof IgAuditSchema>;

export interface AuditInput {
  username?: string;
  name?: string;
  bio: string;
  link?: string;
  highlights?: string;
  pinnedPosts?: string;
  businessModel?: string;
  profileImageNote?: string;
}

export function buildAuditUserPrompt(input: AuditInput): string {
  const lines: string[] = ["Audit this Instagram profile against the criteria.\n"];
  lines.push(`Username: ${input.username || "(not provided)"}`);
  lines.push(`Name field: ${input.name || "(not provided)"}`);
  lines.push(`Bio:\n"""\n${input.bio || "(empty)"}\n"""`);
  lines.push(`Bio link: ${input.link || "(none)"}`);
  if (input.businessModel)
    lines.push(`Business model / how they deliver value: ${input.businessModel}`);
  lines.push(
    `Pinned posts: ${input.pinnedPosts?.trim() || "(not provided — mark not-provided)"}`,
  );
  lines.push(
    `Highlights: ${input.highlights?.trim() || "(not provided — mark not-provided)"}`,
  );
  lines.push(
    `Profile image: ${input.profileImageNote?.trim() || "(not provided — mark not-provided)"}`,
  );
  return lines.join("\n");
}
