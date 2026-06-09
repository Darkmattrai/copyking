# CopyKing — Engineering Notes & SOP

## Invariant: ICP Map → Brand DNA (every field must be mirrored)

**Anything a user saves in the ICP Map MUST be reflected in their Brand DNA.**
This is a hard product contract, not a nice-to-have.

- The ICP Map's generated psychology — the **universal** block (generic pains,
  goals, problems, triggers, objections, hesitations, emotional fingerprint) and
  **every audience segment** (segment-specific pain / goals / mindset /
  objections / triggers / intensity) — is the source of truth for the `icp`
  pillar and is **always written** on save.
- The remaining intake answers are mirrored into their natural pillars
  (**fill-empty-only** — never overwrite a field the user already edited):
  - `industry` → `niche.marketCategory`
  - `whatYouDo` → `niche.subNiche`
  - `offer` → `offer.grandSlamDescription`
  - `socialProof` → `offer.perceivedLikelihood`
  - universal goals → `offer.dreamOutcome`
  - `tone` → `voice.toneAttributes`
  - `brandReference` → `voice.brandPersona`
  - `channels` → `icp.platforms` + `contentDNA.platforms`

### Where this lives
- Mapping: `lib/icp/brand-bridge.ts` → `icpToBrandUpdate(generated, intake, current)`.
- Save path: `app/(app)/generate/icp-map/page.tsx` calls `updatePillars(patch)`
  and **awaits** the Supabase sync (never fire-and-forget for a final save).
- Multi-pillar atomic write + awaitable sync: `useBrandStore.updatePillars`
  in `lib/brand/store.ts`.

### Rule for future changes
If you add a field to the ICP intake (`lib/icp/schema.ts` `IntakeSchema`) or to
the generated output (`GeneratedICPSchema`), you **must** add it to
`icpToBrandUpdate` so it reaches Brand DNA. Add it to the table above too.

## Recoverability
- The full intake used for a generation is persisted as `lastIntake` in the ICP
  draft store and included in the `generations` row (slug `icp-map`) content.
  This is the recovery source if a Brand DNA sync ever fails — the raw answers
  are not lost just because the pillar write didn't land.

## ICP serializer assets (brain image / stylesheet)
- `lib/icp/serialize.ts` reads `public/brain.png` and `lib/icp/icp.css` from
  disk at request time. On Vercel these files are **not** on the lambda
  filesystem unless traced in. `next.config.mjs` → `outputFileTracingIncludes`
  for `/api/icp/serialize` bundles them. **Do not remove that entry** or the
  brain centrepiece silently disappears from generated maps in production.
- The asset-read catches now `console.error` instead of swallowing — a missing
  asset must be loud, not invisible.

## Deploy ritual (do not build while the preview server runs)
1. Stop the preview server.
2. `rm -rf .next`
3. `npx --yes pnpm@10.4.1 build`
4. `npx --yes vercel@latest --prod --yes`
5. Restart the preview server.
