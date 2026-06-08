// Anthropic per-model pricing, in USD per 1,000,000 tokens. Cost is computed on
// read from this table (not stored), so when Anthropic changes rates you only
// edit here. Update these if the published pricing changes.
// Source: https://www.anthropic.com/pricing  (input / output / cache write / cache read)

export interface ModelPricing {
  input: number;
  output: number;
  cacheWrite: number; // 5-minute cache write
  cacheRead: number;
}

// Keyed by model id prefix; lookup falls back to the longest matching prefix.
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Opus 4.x family
  "claude-opus-4": { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 },
  // Sonnet 4.x family
  "claude-sonnet-4": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  // Haiku 4.x family
  "claude-haiku-4": { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 },
};

// Fallback when no prefix matches (use Sonnet rates as a middle-ground guess).
const DEFAULT_PRICING: ModelPricing = {
  input: 3,
  output: 15,
  cacheWrite: 3.75,
  cacheRead: 0.3,
};

export function pricingForModel(model: string): ModelPricing {
  let best: ModelPricing | null = null;
  let bestLen = 0;
  for (const [prefix, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.startsWith(prefix) && prefix.length > bestLen) {
      best = pricing;
      bestLen = prefix.length;
    }
  }
  return best ?? DEFAULT_PRICING;
}

export interface TokenCounts {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_tokens?: number | null;
  cache_read_tokens?: number | null;
}

// Cost in USD for a single usage record (or an aggregate of the same model).
export function costForUsage(model: string, t: TokenCounts): number {
  const p = pricingForModel(model);
  const input = t.input_tokens ?? 0;
  const output = t.output_tokens ?? 0;
  const cacheWrite = t.cache_creation_tokens ?? 0;
  const cacheRead = t.cache_read_tokens ?? 0;
  return (
    (input * p.input +
      output * p.output +
      cacheWrite * p.cacheWrite +
      cacheRead * p.cacheRead) /
    1_000_000
  );
}

export function formatUsd(n: number): string {
  if (n === 0) return "$0.00";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}
