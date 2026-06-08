"use client";

import type { ResultMap as ResultMapModel, CoreResult } from "@/lib/offer/schema";
import { newCoreResult, newResultMap } from "@/lib/offer/seed";

// Interactive transformation tree:
//   Ultimate Result (top, accent box)
//     → Core Results (the milestones needed to reach it)
//         → Splinter results / frameworks (what they must learn or solve per core)
// Mirrors the org-chart drawing the user provided; connectors come from the
// `.ck-tree-*` classes in globals.css.
export function ResultMap({
  value,
  onChange,
}: {
  value: ResultMapModel | null | undefined;
  onChange: (r: ResultMapModel) => void;
}) {
  // Legacy saved offers and AI-generated products may arrive without a result
  // map (null/undefined) — fall back to a blank one so the editor still renders.
  const map = value ?? newResultMap();
  const cores = map.cores || [];

  const setUltimate = (ultimate: string) => onChange({ ...map, ultimate });

  const setCore = (i: number, patch: Partial<CoreResult>) =>
    onChange({
      ...map,
      cores: cores.map((c, j) => (j === i ? { ...c, ...patch } : c)),
    });

  const addCore = () =>
    onChange({ ...map, cores: [...cores, newCoreResult()] });

  const removeCore = (i: number) =>
    onChange({ ...map, cores: cores.filter((_, j) => j !== i) });

  const setSplinter = (ci: number, si: number, text: string) =>
    setCore(ci, {
      splinters: (cores[ci].splinters || []).map((s, j) =>
        j === si ? text : s,
      ),
    });

  const addSplinter = (ci: number) =>
    setCore(ci, { splinters: [...(cores[ci].splinters || []), ""] });

  const removeSplinter = (ci: number, si: number) =>
    setCore(ci, {
      splinters: (cores[ci].splinters || []).filter((_, j) => j !== si),
    });

  return (
    <div className="space-y-4">
      {/* ULTIMATE RESULT */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-md rounded-xl border-2 border-accent bg-accent/10 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1">
            Ultimate result
          </p>
          <textarea
            value={map.ultimate}
            onChange={(e) => setUltimate(e.target.value)}
            placeholder="The big transformation this product delivers"
            rows={2}
            className="w-full resize-none bg-transparent text-center text-sm font-medium text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </div>

        {cores.length > 0 && <div className="ck-tree-trunk" />}
      </div>

      {/* CORE RESULTS */}
      {cores.length > 0 && (
        <div className="ck-tree-children overflow-x-auto pb-1">
          {cores.map((core, ci) => (
            <div key={ci} className="ck-tree-node min-w-[180px]">
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
                    Core result {ci + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCore(ci)}
                    className="text-xs text-text-tertiary hover:text-danger transition-colors"
                    aria-label="Remove core result"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  value={core.result}
                  onChange={(e) => setCore(ci, { result: e.target.value })}
                  placeholder="A milestone they must hit to reach the ultimate result"
                  rows={2}
                  className="w-full resize-none bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
                />
              </div>

              {(core.splinters || []).length > 0 && (
                <div className="ck-tree-trunk" />
              )}

              {/* SPLINTERS */}
              <div className="space-y-2">
                {(core.splinters || []).map((sp, si) => (
                  <div
                    key={si}
                    className="flex items-start gap-1.5 rounded-lg border border-dashed border-border p-2"
                  >
                    <textarea
                      value={sp}
                      onChange={(e) => setSplinter(ci, si, e.target.value)}
                      placeholder="Framework / splinter result they must solve"
                      rows={2}
                      className="flex-1 resize-none bg-transparent text-xs text-text-secondary outline-none placeholder:text-text-tertiary"
                    />
                    <button
                      type="button"
                      onClick={() => removeSplinter(ci, si)}
                      className="text-xs text-text-tertiary hover:text-danger transition-colors shrink-0"
                      aria-label="Remove splinter"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addSplinter(ci)}
                  className="w-full text-xs font-medium text-accent hover:text-accent-hover transition-colors py-1"
                >
                  + Splinter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addCore}
        className="ck-btn-secondary w-full"
      >
        + Add core result
      </button>
    </div>
  );
}
