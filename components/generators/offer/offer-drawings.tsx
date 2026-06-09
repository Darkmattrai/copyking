"use client";

// Read-only renderings of the two Offer "drawings" — the value-ladder staircase
// and the result-map tree — so they can be showcased in the Brand DNA / answers
// view. Pure: driven entirely by an Offer object, no store, no editing.

import {
  tierOf,
  sortProducts,
  stageValue,
  resultMapHasContent,
  type Offer,
  type Ladder,
  type ResultMap,
} from "@/lib/offer/schema";

function burstPoints(
  cx: number,
  cy: number,
  spikes: number,
  outer: number,
  inner: number,
) {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    pts.push(
      `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`,
    );
  }
  return pts.join(" ");
}

function StarBurst() {
  return (
    <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-md">
      <polygon
        points={burstPoints(50, 50, 12, 48, 30)}
        fill="var(--color-warning)"
        stroke="var(--color-text-primary)"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <text
        x="50"
        y="52"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="36"
        fontWeight={900}
        fill="#1a1a1a"
      >
        $
      </text>
    </svg>
  );
}

function LadderChart({ ladder }: { ladder: Ladder }) {
  const ascending = sortProducts(ladder.products ?? []).filter(
    (p) => p.name || p.price,
  );
  if (!ascending.length) return null;

  const n = ascending.length;
  const continuities = (ladder.continuities ?? []).filter(
    (c) => c.on && (c.price || c.name),
  );

  return (
    <div className="ck-card p-5 pt-4">
      <div className="text-center text-xs font-bold tracking-[0.25em] text-text-tertiary mb-3">
        THE VALUE LADDER
      </div>
      <div className="flex">
        <div className="flex items-center justify-center w-6 shrink-0">
          <span className="-rotate-90 origin-center whitespace-nowrap text-[10px] font-bold tracking-[0.2em] text-text-tertiary">
            VALUE ↑
          </span>
        </div>
        <div className="flex-1 min-w-0 border-l-2 border-b-2 border-text-tertiary/40 pt-12 pl-2">
          <div className="flex items-end gap-1.5 sm:gap-2 h-[300px]">
            {ascending.map((p, i) => {
              const heightPct = Math.max(32, Math.round(((i + 1) / n) * 100));
              const tr = tierOf(p.price);
              const accent = tr ? tr.color : "var(--color-text-tertiary)";
              const bg = tr ? tr.bg : "var(--color-surface)";
              const isTop = i === n - 1;
              const sv = stageValue(p);
              return (
                <div
                  key={p.id || i}
                  className="relative flex-1 min-w-0 h-full flex flex-col justify-end"
                >
                  {isTop && (
                    <div className="absolute left-1/2 -translate-x-1/2 -top-9">
                      <StarBurst />
                    </div>
                  )}
                  <div
                    style={{ height: `${heightPct}%`, background: bg, borderColor: accent }}
                    className="relative w-full rounded-t-lg border-2 border-b-0 p-2 flex flex-col"
                  >
                    <span className="text-[11px]" style={{ color: accent }}>
                      {p.pop ? "★" : "☆"}
                    </span>
                    <div className="mt-auto min-w-0">
                      <div className="text-sm font-extrabold truncate text-text-primary">
                        {p.price || "—"}
                      </div>
                      <div className="text-[11px] font-semibold text-text-primary line-clamp-2">
                        {p.name || "Untitled"}
                      </div>
                      {tr && (
                        <div
                          className="text-[9px] font-bold uppercase tracking-wide"
                          style={{ color: accent }}
                        >
                          {tr.label}
                        </div>
                      )}
                      {sv > 0 && (
                        <div className="text-[9px] text-text-tertiary">
                          ${sv.toLocaleString()} value
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="pl-6 text-center text-[10px] font-bold tracking-[0.2em] text-text-tertiary mt-1">
        PRICE →
      </div>
      {continuities.length > 0 && (
        <div className="pl-6 mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold tracking-wide text-text-tertiary">
            CONTINUITY
          </span>
          {continuities.map((c, i) => (
            <span key={i} className="text-sm font-bold text-accent">
              → {c.price || c.name}
              {c.cycle ? `/${c.cycle.toLowerCase()}` : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultMapTree({ map }: { map: ResultMap }) {
  const cores = (map.cores ?? []).filter(
    (c) => c.result?.trim() || (c.splinters || []).some((s) => s?.trim()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        <div className="w-full max-w-md rounded-xl border-2 border-accent bg-accent/10 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1">
            Ultimate result
          </p>
          <p className="text-sm font-medium text-text-primary whitespace-pre-wrap">
            {map.ultimate || "—"}
          </p>
        </div>
        {cores.length > 0 && <div className="ck-tree-trunk" />}
      </div>

      {cores.length > 0 && (
        <div className="ck-tree-children overflow-x-auto pb-1">
          {cores.map((core, ci) => {
            const splinters = (core.splinters || []).filter((s) => s?.trim());
            return (
              <div key={ci} className="ck-tree-node min-w-[180px]">
                <div className="rounded-xl border border-border bg-surface p-3">
                  <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
                    Core result {ci + 1}
                  </span>
                  <p className="text-sm text-text-primary whitespace-pre-wrap mt-1">
                    {core.result || "—"}
                  </p>
                </div>
                {splinters.length > 0 && <div className="ck-tree-trunk" />}
                <div className="space-y-2">
                  {splinters.map((sp, si) => (
                    <div
                      key={si}
                      className="rounded-lg border border-dashed border-border p-2"
                    >
                      <p className="text-xs text-text-secondary whitespace-pre-wrap">
                        {sp}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function OfferDrawings({ offer }: { offer?: Offer | null }) {
  if (!offer) return null;

  const ladders = (offer.ladders ?? []).filter((L) =>
    (L.products ?? []).some((p) => p.name || p.price),
  );

  const resultMaps: { name: string; map: ResultMap }[] = [];
  (offer.ladders ?? []).forEach((L) =>
    (L.products ?? []).forEach((p) => {
      if (resultMapHasContent(p.resultMap))
        resultMaps.push({ name: p.name || "Product", map: p.resultMap });
    }),
  );

  if (!ladders.length && !resultMaps.length) return null;

  return (
    <div className="space-y-6 mb-6">
      {ladders.map((L, i) => (
        <LadderChart key={i} ladder={L} />
      ))}
      {resultMaps.map((rm, i) => (
        <div key={i} className="ck-card p-5">
          <div className="text-xs font-bold tracking-[0.2em] text-text-tertiary mb-4">
            RESULT MAP{rm.name ? ` · ${rm.name}` : ""}
          </div>
          <ResultMapTree map={rm.map} />
        </div>
      ))}
    </div>
  );
}
