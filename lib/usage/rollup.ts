import { costForUsage } from "./pricing";

// Raw usage_events row shape (as selected by the admin APIs).
export interface UsageRow {
  user_id?: string | null;
  feature: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
}

export interface UsageBreakdownItem {
  key: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
}

export interface UsageSummary {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  costUsd: number;
  byFeature: UsageBreakdownItem[];
  byModel: UsageBreakdownItem[];
}

function emptyItem(key: string): UsageBreakdownItem {
  return { key, calls: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0 };
}

// Aggregates raw usage rows into totals + per-feature / per-model breakdowns.
// Cost is summed per-row so mixed models within a group price correctly.
export function summarizeUsage(rows: UsageRow[]): UsageSummary {
  const summary: UsageSummary = {
    calls: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    totalTokens: 0,
    costUsd: 0,
    byFeature: [],
    byModel: [],
  };

  const byFeature = new Map<string, UsageBreakdownItem>();
  const byModel = new Map<string, UsageBreakdownItem>();

  for (const r of rows) {
    const cost = costForUsage(r.model, {
      input_tokens: r.input_tokens,
      output_tokens: r.output_tokens,
      cache_creation_tokens: r.cache_creation_tokens,
      cache_read_tokens: r.cache_read_tokens,
    });
    const total = r.input_tokens + r.output_tokens;

    summary.calls += 1;
    summary.inputTokens += r.input_tokens;
    summary.outputTokens += r.output_tokens;
    summary.cacheCreationTokens += r.cache_creation_tokens;
    summary.cacheReadTokens += r.cache_read_tokens;
    summary.totalTokens += total;
    summary.costUsd += cost;

    const f = byFeature.get(r.feature) ?? emptyItem(r.feature);
    f.calls += 1;
    f.inputTokens += r.input_tokens;
    f.outputTokens += r.output_tokens;
    f.totalTokens += total;
    f.costUsd += cost;
    byFeature.set(r.feature, f);

    const m = byModel.get(r.model) ?? emptyItem(r.model);
    m.calls += 1;
    m.inputTokens += r.input_tokens;
    m.outputTokens += r.output_tokens;
    m.totalTokens += total;
    m.costUsd += cost;
    byModel.set(r.model, m);
  }

  summary.byFeature = Array.from(byFeature.values()).sort((a, b) => b.costUsd - a.costUsd);
  summary.byModel = Array.from(byModel.values()).sort((a, b) => b.costUsd - a.costUsd);
  return summary;
}
