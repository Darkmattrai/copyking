"use client";

import { useOfferDraftStore } from "@/lib/offer/store";
import { newTier, newLadder } from "@/lib/offer/seed";
import {
  tierOf,
  sortTiers,
  tierOrderError,
  stageValue,
  money,
  CONTINUITY_CYCLES,
  type Tier,
  type Deliverable,
  type Bonus,
} from "@/lib/offer/schema";
import { ListTable } from "./list-table";

export function ValueLadder() {
  const { offer, curLadder, openTier, patch, setCurLadder, setOpenTier } =
    useOfferDraftStore();

  const ladders = offer.ladders;
  const idx = curLadder >= ladders.length ? 0 : curLadder;
  const L = ladders[idx];

  const updateLadder = (updates: Partial<typeof L>) => {
    patch({
      ladders: ladders.map((l, i) => (i === idx ? { ...l, ...updates } : l)),
    });
  };

  const updateTier = (ti: number, updates: Partial<Tier>) => {
    updateLadder({
      tiers: L.tiers.map((t, i) => (i === ti ? { ...t, ...updates } : t)),
    });
  };

  const commitPriceSort = () => {
    updateLadder({ tiers: sortTiers(L.tiers) });
    setOpenTier(null);
  };

  const toggleStar = (ti: number) => {
    updateLadder({
      tiers: L.tiers.map((t, i) => ({ ...t, pop: i === ti ? !t.pop : false })),
    });
  };

  const removeTier = (ti: number) => {
    let next = L.tiers.filter((_, i) => i !== ti);
    if (next.length === 0) next = [newTier()];
    updateLadder({ tiers: next });
    setOpenTier(null);
  };

  const addTier = () => updateLadder({ tiers: [...L.tiers, newTier()] });

  const addLadder = () => {
    patch({ ladders: [...ladders, newLadder()] });
    setCurLadder(ladders.length);
  };

  const deleteLadder = () => {
    if (ladders.length <= 1) return;
    const next = ladders.filter((_, i) => i !== idx);
    patch({ ladders: next });
    setCurLadder(Math.min(idx, next.length - 1));
  };

  const orderWarn = tierOrderError(L.tiers);

  return (
    <div className="space-y-4">
      {/* Ladder tabs */}
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
            onClick={deleteLadder}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-tertiary hover:text-danger transition-all"
          >
            🗑 Delete
          </button>
        )}
      </div>

      {/* Ladder name */}
      <label className="flex flex-col gap-1.5">
        <span className="ck-label !mb-0">Value ladder name</span>
        <input
          type="text"
          value={L.name}
          onChange={(e) => updateLadder({ name: e.target.value })}
          placeholder="e.g. Get-More-Jobs Ladder"
          className="ck-input"
        />
      </label>

      <p className="text-xs text-text-tertiary">
        ↑ More value · more results · higher price. Set a price and the stage
        auto-colours into its tier (Free → High).
      </p>

      {/* Stages */}
      <div className="space-y-3">
        {L.tiers.map((t, i) => {
          const tr = tierOf(t.price);
          const accent = tr ? tr.color : "var(--color-border)";
          const open = openTier === i;
          const sv = stageValue(t);
          return (
            <div
              key={i}
              className="ck-card overflow-hidden"
              style={{ borderLeft: `3px solid ${accent}` }}
            >
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-tertiary">
                      Stage {i + 1}
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
                        {money(sv)} value
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleStar(i)}
                      title="Mark as the plan most people pick"
                      className="text-base leading-none"
                      style={{ color: t.pop ? "var(--color-warning)" : undefined }}
                    >
                      {t.pop ? "★" : "☆"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTier(i)}
                      className="text-text-tertiary hover:text-danger transition-colors"
                      aria-label="Remove stage"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M4 4l8 8M12 4l-8 8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
                  <input
                    type="text"
                    value={t.name}
                    onChange={(e) => updateTier(i, { name: e.target.value })}
                    placeholder="Stage name"
                    className="ck-input !py-2"
                  />
                  <input
                    type="text"
                    value={t.price}
                    onChange={(e) => updateTier(i, { price: e.target.value })}
                    onBlur={commitPriceSort}
                    placeholder="$ price / FREE"
                    className="ck-input !py-2"
                  />
                </div>
                <textarea
                  value={t.desc}
                  onChange={(e) => updateTier(i, { desc: e.target.value })}
                  placeholder="What they get on this stage"
                  rows={2}
                  className="ck-input resize-none !py-2"
                />

                <button
                  type="button"
                  onClick={() => setOpenTier(open ? null : i)}
                  className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
                >
                  {open ? "▾ Close details" : "▸ Edit details"}
                </button>

                {open && (
                  <div className="pt-2 space-y-4 border-t border-border">
                    <div>
                      <p className="ck-label">Deliverables on this stage</p>
                      <ListTable<Deliverable>
                        rows={t.deliverables}
                        columns={[
                          {
                            key: "item",
                            label: "Deliverable",
                            placeholder: "Done-for-you ad campaigns",
                          },
                          {
                            key: "val",
                            label: "Value ($)",
                            type: "number",
                            placeholder: "4000",
                          },
                        ]}
                        onChange={(deliverables) =>
                          updateTier(i, { deliverables })
                        }
                        addLabel="Add deliverable"
                      />
                    </div>
                    <div>
                      <p className="ck-label">Bonuses on this stage</p>
                      <ListTable<Bonus>
                        rows={t.bonuses}
                        columns={[
                          {
                            key: "name",
                            label: "Bonus",
                            placeholder: "Outreach script pack",
                          },
                          {
                            key: "val",
                            label: "Value ($)",
                            type: "number",
                            placeholder: "500",
                          },
                          {
                            key: "why",
                            label: "Why it removes a problem",
                            type: "textarea",
                            placeholder:
                              "Removes the 'what do I say to leads' fear so they win in week one",
                          },
                        ]}
                        onChange={(bonuses) => updateTier(i, { bonuses })}
                        addLabel="Add bonus"
                      />
                    </div>
                    <label className="flex flex-col gap-1.5">
                      <span className="ck-label !mb-0">
                        Payment note (optional)
                      </span>
                      <input
                        type="text"
                        value={t.payment}
                        onChange={(e) =>
                          updateTier(i, { payment: e.target.value })
                        }
                        placeholder="$1,500/mo, or pay quarterly ($4,000) and save a month."
                        className="ck-input !py-2"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addTier}
        className="flex items-center gap-2 self-start px-4 py-2.5 rounded-lg border border-dashed border-border hover:border-border-hover text-sm font-medium text-text-primary transition-all"
      >
        + Add a stage
      </button>

      {orderWarn && (
        <div className="p-3 rounded-lg border border-warning/30 bg-warning/[0.06] text-sm text-warning">
          {orderWarn}
        </div>
      )}

      {/* Continuity */}
      <div className="ck-card p-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={L.continuity.on}
            onChange={(e) =>
              updateLadder({
                continuity: { ...L.continuity, on: e.target.checked },
              })
            }
          />
          <span className="text-sm font-semibold text-text-primary">
            🔁 Add a continuity program
          </span>
        </label>
        <p className="text-xs text-text-tertiary">
          Recurring revenue that runs underneath this ladder — a membership /
          subscription they stay in.
        </p>
        {L.continuity.on && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="text"
                value={L.continuity.name}
                onChange={(e) =>
                  updateLadder({
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
                  updateLadder({
                    continuity: { ...L.continuity, price: e.target.value },
                  })
                }
                placeholder="$297/mo"
                className="ck-input !py-2"
              />
              <select
                value={L.continuity.cycle}
                onChange={(e) =>
                  updateLadder({
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
                updateLadder({
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
