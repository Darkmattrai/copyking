# SOP — ICP Map ↔ Brand DNA

## The rule

> **Every field a user saves in the ICP Map must show up in their Brand DNA.**

When someone completes an ICP Map (guided interview or manual form), the moment
it's saved we mirror their answers into the Brand DNA so the rest of CopyKing
(content generators, offer builder, messaging) can use them. Nothing the user
filled in should be stranded on the ICP Map screen.

## What gets reflected, and where

### Always written — the `icp` (Dream Customer) pillar
This is the ICP Map's home. On every save it is fully refreshed from the map:

**Generic / universal (shared across all segments)**
- Biggest challenges (pains)
- What keeps them up at night
- What they've already tried
- Goals & dreams
- Emotional fingerprint
- Buying triggers
- Objections
- Hesitations

**Segment-specific (per audience segment)**
- Segment name & one-liner
- Core pain
- Goals
- Mindset / beliefs
- Objections
- Buying triggers
- Intensity scores (pain, goal clarity, buying urgency, price sensitivity, skepticism)

Plus business name, industry label, and region.

### Mirrored into other pillars — only if still empty
So we never overwrite something the user edited by hand elsewhere:

| ICP Map answer        | Goes to                          |
|-----------------------|----------------------------------|
| Industry              | Niche → Market category          |
| What you do           | Niche → Sub-niche                |
| Core offer            | Offer → Grand-slam description    |
| Social proof          | Offer → Perceived likelihood     |
| Goals (universal)     | Offer → Dream outcome            |
| Brand tone            | Voice → Tone attributes          |
| Brand references      | Voice → Brand persona            |
| Marketing channels    | ICP → Platforms + Content DNA → Platforms |

> Note: the uploaded logo is intentionally **not** stored in Brand DNA (kept out
> to keep the saved payload small); it's used only while rendering the map.

## Reliability

- The final "Save to Brand DNA" **awaits** the database write — it does not
  fire-and-forget. The "Saved ✓" state only appears after the data is persisted.
- The exact answers used for a generation are also stored with the saved map, so
  if a sync ever fails the raw answers can be recovered rather than lost.

## When you add a new ICP Map question

Update the mapping in `lib/icp/brand-bridge.ts` (`icpToBrandUpdate`) and this
table — otherwise the new field will be collected but never reach Brand DNA,
which breaks the rule above.

## The brain image

The ICP Map's brain centrepiece is a server-rendered asset. It must be bundled
into the production serverless function (`next.config.mjs` →
`outputFileTracingIncludes`). If a generated/exported map ever comes out without
the brain, that bundling entry is the first thing to check.
