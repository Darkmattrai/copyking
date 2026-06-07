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

  // Display order: ascending by price, premium on top → staircase climbs up.
  const ascending = sortProducts(L.products);
  const display = [...ascending].reverse();
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

      {/* The staircase */}
      <div className="space-y-2">
        {display.map((p) => {
          const ascPos = ascending.findIndex((x) => x.id === p.id); // 0 = lowest
          const ri = realIndex(p);
          const tr = tierOf(p.price);
          const accent = tr ? tr.color : "var(--color-border)";
          const sv = stageValue(p);
          // Indent grows with rank so higher rungs step up to the right.
          const indent = n > 1 ? Math.min(ascPos * 28, 140) : 0;

          return (
            <div
              key={p.id}
              style={{ marginLeft: indent }}
              className="transition-all"
            >
              <button
                type="button"
                onClick={() => setCurProduct(ri)}
                className="group w-full text-left ck-card overflow-hidden hover:border-border-hover transition-colors"
                style={{ borderLeft: `4px solid ${accent}` }}
              >
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-text-tertiary">
                        Rung {ascPos + 1}
                      </span>
                      {tr && (
                        <span
                          className="ck-badge !text-[10px]"
                          style={{ background: tr.bg, color: tr.color }}
                        >
                          {tr.label}
                        </span>
                      )}
                      {sv > 0 && (
                        <span className="text-xs text-success">
                          {money(sv)} stacked value
                        </span>
                      )}
                    </div>
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
                      className="text-base leading-none cursor-pointer"
                      style={{ color: p.pop ? "var(--color-warning)" : undefined }}
                    >
                      {p.pop ? "★" : "☆"}
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-text-primary truncate">
                        {p.name || "Untitled rung"}
                      </div>
                      {p.desc && (
                        <p className="text-xs text-text-tertiary line-clamp-2">
                          {p.desc}
                        </p>
                      )}
                    </div>
                    <div className="text-lg font-bold text-text-primary shrink-0">
                      {p.price || "—"}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-sm font-medium text-accent group-hover:text-accent-hover">
                      Build this offer →
                    </span>
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
                      className="text-xs text-text-tertiary hover:text-text-primary cursor-pointer"
                    >
                      Duplicate
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
                      className="text-xs text-text-tertiary hover:text-danger cursor-pointer"
                    >
                      Delete
                    </span>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
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
