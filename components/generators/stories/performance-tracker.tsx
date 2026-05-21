"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MetricRow {
  label: string;
  predicted: string;
  actual: string;
  unit: string;
}

interface PerformanceTrackerProps {
  metricsSection: string;
  seriesId: string; // creation timestamp or hash to scope storage
}

interface StoredMetrics {
  completionRate: string;
  dmStartRate: string;
  tapForwardRate: string;
  saves: string;
  shares: string;
  views: string;
  notes: string;
}

const DEFAULT_METRICS: StoredMetrics = {
  completionRate: "",
  dmStartRate: "",
  tapForwardRate: "",
  saves: "",
  shares: "",
  views: "",
  notes: "",
};

function parseMetricTarget(
  metricsSection: string,
  keyword: string,
): string {
  const lines = metricsSection.split("\n");
  for (const line of lines) {
    if (line.toLowerCase().includes(keyword.toLowerCase())) {
      const match = line.match(/(\d+[\d.,]*\s*%?)/);
      return match ? match[1].trim() : "";
    }
  }
  return "";
}

function getStatusColor(predicted: string, actual: string): string {
  if (!actual || !predicted) return "text-text-tertiary";
  const pNum = parseFloat(predicted.replace(/[^0-9.]/g, ""));
  const aNum = parseFloat(actual.replace(/[^0-9.]/g, ""));
  if (isNaN(pNum) || isNaN(aNum)) return "text-text-tertiary";
  if (aNum >= pNum) return "text-emerald-500";
  if (aNum >= pNum * 0.8) return "text-amber-500";
  return "text-rose-500";
}

function getStorageKey(seriesId: string): string {
  return `ck-perf-${seriesId}`;
}

export function PerformanceTracker({
  metricsSection,
  seriesId,
}: PerformanceTrackerProps) {
  const [metrics, setMetrics] = useState<StoredMetrics>(DEFAULT_METRICS);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Load stored metrics on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(seriesId));
      if (stored) setMetrics(JSON.parse(stored));
    } catch {
      /* noop */
    }
  }, [seriesId]);

  // Save on change
  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(seriesId), JSON.stringify(metrics));
    } catch {
      /* noop */
    }
  }, [metrics, seriesId]);

  const update = (key: keyof StoredMetrics, value: string) => {
    setMetrics((prev) => ({ ...prev, [key]: value }));
  };

  const rows: MetricRow[] = [
    {
      label: "Completion rate",
      predicted: parseMetricTarget(metricsSection, "completion"),
      actual: metrics.completionRate,
      unit: "%",
    },
    {
      label: "DM start rate",
      predicted: parseMetricTarget(metricsSection, "dm start"),
      actual: metrics.dmStartRate,
      unit: "%",
    },
    {
      label: "Tap-forward rate",
      predicted: parseMetricTarget(metricsSection, "tap-forward"),
      actual: metrics.tapForwardRate,
      unit: "%",
    },
    {
      label: "Saves",
      predicted: parseMetricTarget(metricsSection, "save"),
      actual: metrics.saves,
      unit: "",
    },
    {
      label: "Shares",
      predicted: parseMetricTarget(metricsSection, "share"),
      actual: metrics.shares,
      unit: "",
    },
  ];

  const hasActualData = Object.values(metrics).some(
    (v) => v && v !== DEFAULT_METRICS.notes,
  );

  // Generate recommendations based on gaps
  const recommendations: string[] = [];
  for (const row of rows) {
    if (!row.actual || !row.predicted) continue;
    const pNum = parseFloat(row.predicted.replace(/[^0-9.]/g, ""));
    const aNum = parseFloat(row.actual.replace(/[^0-9.]/g, ""));
    if (isNaN(pNum) || isNaN(aNum)) continue;

    if (row.label === "Completion rate" && aNum < pNum) {
      recommendations.push(
        "Completion rate is below target — strengthen the hook on slide 1 and add more open loops between slides.",
      );
    }
    if (row.label === "DM start rate" && aNum < pNum) {
      recommendations.push(
        "DM rate is low — try a stronger reveal sticker with a more specific value promise, and move it earlier in the series.",
      );
    }
    if (row.label === "Tap-forward rate" && aNum > pNum) {
      recommendations.push(
        "Tap-forward rate is high — identify which slides get skipped (check Instagram Insights) and rewrite their headlines.",
      );
    }
    if (row.label === "Saves" && aNum < pNum) {
      recommendations.push(
        "Saves are underperforming — add a screenshot-worthy framework or specific stat on a value slide.",
      );
    }
    if (row.label === "Shares" && aNum < pNum) {
      recommendations.push(
        "Shares are below target — make slide 1 more relatable/contrarian so viewers send it to friends who feel the same pain.",
      );
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-tertiary">
        After posting, enter your actual Instagram Insights data to compare
        against predicted targets and get AI-powered recommendations.
      </p>

      {/* Views */}
      <div className="flex items-center gap-3">
        <label className="text-[11px] font-medium text-text-secondary w-20 shrink-0">
          Total views
        </label>
        <input
          type="text"
          value={metrics.views}
          onChange={(e) => update("views", e.target.value)}
          placeholder="e.g. 2,400"
          className="ck-input text-sm py-1.5 px-3 flex-1"
        />
      </div>

      {/* Metric comparison table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-surface-hover">
              <th className="text-left px-3 py-2 font-semibold text-text-secondary">
                Metric
              </th>
              <th className="text-center px-3 py-2 font-semibold text-text-secondary">
                Target
              </th>
              <th className="text-center px-3 py-2 font-semibold text-text-secondary">
                Actual
              </th>
              <th className="text-center px-3 py-2 font-semibold text-text-secondary w-10">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const statusColor = getStatusColor(row.predicted, row.actual);
              const inputKey = row.label
                .toLowerCase()
                .replace(/[^a-z]/g, "") as keyof StoredMetrics;
              // Map labels to state keys
              const stateKeyMap: Record<string, keyof StoredMetrics> = {
                completionrate: "completionRate",
                dmstartrate: "dmStartRate",
                tapforwardrate: "tapForwardRate",
                saves: "saves",
                shares: "shares",
              };
              const stateKey = stateKeyMap[inputKey] || inputKey;

              return (
                <tr key={row.label} className="border-t border-border/50">
                  <td className="px-3 py-2 font-medium text-text-primary">
                    {row.label}
                  </td>
                  <td className="text-center px-3 py-2 text-text-tertiary font-mono">
                    {row.predicted || "—"}
                  </td>
                  <td className="text-center px-2 py-1.5">
                    <input
                      type="text"
                      value={metrics[stateKey]}
                      onChange={(e) => update(stateKey, e.target.value)}
                      placeholder={row.unit === "%" ? "e.g. 72%" : "e.g. 45"}
                      className="w-20 text-center text-[11px] py-1 px-2 rounded border border-border bg-background text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
                    />
                  </td>
                  <td className="text-center px-3 py-2">
                    {row.actual ? (
                      <span className={`font-bold text-sm ${statusColor}`}>
                        {statusColor.includes("emerald")
                          ? "+"
                          : statusColor.includes("amber")
                            ? "~"
                            : "-"}
                      </span>
                    ) : (
                      <span className="text-text-tertiary">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      <div>
        <label className="text-[11px] font-medium text-text-secondary block mb-1">
          Notes (what worked, what to change)
        </label>
        <textarea
          value={metrics.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="e.g. Slide 3 had high tap-forward, try a stronger hook..."
          rows={2}
          className="ck-input w-full text-sm py-2 px-3 resize-none"
        />
      </div>

      {/* Recommendations */}
      <AnimatePresence>
        {hasActualData && recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg bg-accent/5 border border-accent/20 p-3">
              <p className="text-[11px] font-semibold text-accent mb-1.5 flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                  />
                </svg>
                Performance recommendations
              </p>
              <ul className="space-y-1">
                {recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="text-[11px] text-text-secondary pl-3 relative before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-accent/50"
                  >
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
