"use client";

import { useOfferDraftStore } from "@/lib/offer/store";
import {
  tierOf,
  sortProducts,
  productOrderError,
  stageValue,
  money,
  CONTINUITY_CYCLES,
  type Product,
} from "@/lib/offer/schema";

// A spiky "$" starburst that anchors the top of the ladder (the big payday).
function burstPoints(cx: number, cy: number, spikes: number, outer: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

function StarBurst() {
  return (
    <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-md">
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

// The ladder "home" — the canvas. Each rung is a self-contained product; click
// it to open its full offer builder. Rungs render as an ascending staircase
// (entry/free at the bottom, premium anchor at the top).
export function ValueLadder() {
  const {
    offer,
    curLadder,
    setOfferName,
    updateLadder,
    addLadder,
    removeLadder,
    updateProduct,
    addProduct,
    duplicateProduct,
    removeProduct,
    setCurLadder,
    setCurProduct,
  } = useOfferDraftStore();

  const ladders = offer.ladders;
  const idx = curLadder >= ladders.length ? 0 : curLadder;
  const L = ladders[idx];

  // Ascending by price: lowest/free at the left, premium anchor at the right —
  // each step climbs up and to the right, like the classic value-ladder chart.
  const ascending = sortProducts(L.products);
  const n = ascending.length;
  const realIndex = (p: Product) => L.products.findIndex((x) => x.id === p.id);

  const toggleStar = (p: Product) => {
    const ri = realIndex(p);
    updateLadder(idx, {
      products: L.products.map((x, i) => ({ ...x, pop: i === ri ? !x.pop : false })),
    });
  };

  const orderWarn = productOrderError(L.products);

  return (
    <div className="space-y-5">
      {/* Umbrella offer name */}
      <label className="flex flex-col gap-1.5">
        <span className="ck-label !mb-0">Offer name (the whole ladder)</span>
        <input
          type="text"
          value={offer.offerName}
          onChange={(e) => setOfferName(e.target.value)}
          placeholder="e.g. The Booked-Out Roofer Suite"
          className="ck-input"
        />
      </label>

      {/* Ladder tabs (most users have one) */}
      <div className="flex flex-wrap items-center gap-2">
        {ladders.map((l, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurLadder(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              i === idx
                ? "bg-accent text-white"
                : "bg-surface border border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            {l.name || `Ladder ${i + 1}`}
          </button>
        ))}
        <button
          type="button"
          onClick={addLadder}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border border-dashed border-border text-text-tertiary hover:text-text-primary transition-all"
        >
          + New ladder
        </button>
        {ladders.length > 1 && (
          <button
            type="button"
            onClick={() => removeLadder(idx)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-tertiary hover:text-danger transition-all"
          >
            🗑 Delete ladder
          </button>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="ck-label !mb-0">Value ladder name</span>
        <input
          type="text"
          value={L.name}
          onChange={(e) => updateLadder(idx, { name: e.target.value })}
          placeholder="e.g. Get-More-Jobs Ladder"
          className="ck-input"
        />
      </label>

      <p className="text-xs text-text-tertiary">
        ↑ Each rung is its own complete offer — its own avatar, promise, value
        stack, guarantee and price. Click a rung to build it out. Set a price and
        the rung auto-colours into its tier (Free → High).
      </p>

      {/* The value-ladder step chart — VALUE (y) vs PRICE (x), each rung a step
          that climbs up and to the right; the premium anchor caps it with a $ burst. */}
      <div className="ck-card p-5 pt-4">
        <div className="text-center text-xs font-bold tracking-[0.25em] text-text-tertiary mb-3">
          THE VALUE LADDER
        </div>

        <div className="flex">
          {/* Y axis label */}
          <div className="flex items-center justify-center w-6 shrink-0">
            <span className="-rotate-90 origin-center whitespace-nowrap text-[10px] font-bold tracking-[0.2em] text-text-tertiary">
              VALUE ↑
            </span>
          </div>

          {/* Plot area with L-shaped axis */}
          <div className="flex-1 min-w-0 border-l-2 border-b-2 border-text-tertiary/40 pt-12 pl-2 pb-0">
            <div className="flex items-end gap-1.5 sm:gap-2 h-[300px]">
              {ascending.map((p, i) => {
                const ri = realIndex(p);
                const tr = tierOf(p.price);
                const accent = tr ? tr.color : "var(--color-text-tertiary)";
                const bg = tr ? tr.bg : "var(--color-surface)";
                const sv = stageValue(p);
                const isTop = i === n - 1;
                const heightPct = Math.max(32, Math.round(((i + 1) / n) * 100));

                return (
                  <div
                    key={p.id}
                    className="relative flex-1 min-w-0 h-full flex flex-col justify-end"
                  >
                    {isTop && (
                      <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-10 pointer-events-none">
                        <StarBurst />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setCurProduct(ri)}
                      title={`${p.name || "Untitled rung"} — build this offer`}
                      style={{ height: `${heightPct}%`, background: bg, borderColor: accent }}
                      className="group relative w-full rounded-t-lg border-2 border-b-0 text-left p-2 flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      {/* top row: star + hover actions */}
                      <div className="flex items-center justify-between gap-1">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(p);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleStar(p);
                            }
                          }}
                          title="Mark as the rung most people pick"
                          className="text-sm leading-none cursor-pointer"
                          style={{ color: p.pop ? "var(--color-warning)" : accent }}
                        >
                          {p.pop ? "★" : "☆"}
                        </span>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateProduct(idx, ri);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.stopPropagation();
                                duplicateProduct(idx, ri);
                              }
                            }}
                            title="Duplicate rung"
                            className="text-[11px] leading-none cursor-pointer"
                            style={{ color: accent }}
                          >
                            ⧉
                          </span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeProduct(idx, ri);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.stopPropagation();
                                removeProduct(idx, ri);
                              }
                            }}
                            title="Delete rung"
                            className="text-[11px] leading-none cursor-pointer hover:text-danger"
                            style={{ color: accent }}
                          >
                            🗑
                          </span>
                        </div>
                      </div>

                      {/* tread label sits at the bottom of the step */}
                      <div className="mt-auto min-w-0">
                        <div
                          className="text-sm font-extrabold leading-tight truncate"
                          style={{ color: accent }}
                        >
                          {p.price || "—"}
                        </div>
                        <div className="text-[11px] font-semibold text-text-primary leading-snug line-clamp-2">
                          {p.name || "Untitled rung"}
                        </div>
                        {tr && (
                          <div
                            className="text-[9px] font-bold uppercase tracking-wide mt-0.5"
                            style={{ color: accent }}
                          >
                            {tr.label}
                          </div>
                        )}
                        {sv > 0 && (
                          <div className="text-[9px] text-text-tertiary mt-0.5">
                            {money(sv)} value
                          </div>
                        )}
                        <div className="text-[10px] font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent }}>
                          Build →
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* X axis label */}
        <div className="pl-6 text-center text-[10px] font-bold tracking-[0.2em] text-text-tertiary mt-1.5">
          PRICE →
        </div>

        {/* Continuity flow runs beneath the ladder */}
        {L.continuity.on && (
          <div className="pl-6 mt-2 flex items-center gap-1.5 flex-wrap text-text-tertiary">
            <span className="text-[10px] font-bold tracking-[0.15em]">
              CONTINUITY
            </span>
            <span className="text-sm font-bold text-accent">
              → {L.continuity.price || "$"} → {L.continuity.price || "$"} →{" "}
              {L.continuity.price || "$"} → …
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => addProduct(idx)}
        className="flex items-center gap-2 self-start px-4 py-2.5 rounded-lg border border-dashed border-border hover:border-border-hover text-sm font-medium text-text-primary transition-all"
      >
        + Add a rung (clones your flagship to edit)
      </button>

      {orderWarn && (
        <div className="p-3 rounded-lg border border-warning/30 bg-warning/[0.06] text-sm text-warning">
          {orderWarn}
        </div>
      )}

      {/* Continuity runs underneath the whole ladder */}
      <div className="ck-card p-4 space-y-3" style={{ borderTop: "2px solid var(--color-accent)" }}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={L.continuity.on}
            onChange={(e) =>
              updateLadder(idx, {
                continuity: { ...L.continuity, on: e.target.checked },
              })
            }
          />
          <span className="text-sm font-semibold text-text-primary">
            🔁 Continuity program (runs under the whole ladder)
          </span>
        </label>
        <p className="text-xs text-text-tertiary">
          Recurring revenue beneath the ladder — a membership / subscription they
          stay in regardless of which rung they bought.
        </p>
        {L.continuity.on && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="text"
                value={L.continuity.name}
                onChange={(e) =>
                  updateLadder(idx, {
                    continuity: { ...L.continuity, name: e.target.value },
                  })
                }
                placeholder="Inner Circle membership"
                className="ck-input !py-2"
              />
              <input
                type="text"
                value={L.continuity.price}
                onChange={(e) =>
                  updateLadder(idx, {
                    continuity: { ...L.continuity, price: e.target.value },
                  })
                }
                placeholder="$297/mo"
                className="ck-input !py-2"
              />
              <select
                value={L.continuity.cycle}
                onChange={(e) =>
                  updateLadder(idx, {
                    continuity: { ...L.continuity, cycle: e.target.value },
                  })
                }
                className="ck-input !py-2"
              >
                {CONTINUITY_CYCLES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={L.continuity.desc}
              onChange={(e) =>
                updateLadder(idx, {
                  continuity: { ...L.continuity, desc: e.target.value },
                })
              }
              placeholder="The ongoing value that earns the recurring charge."
              rows={2}
              className="ck-input resize-none !py-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}
