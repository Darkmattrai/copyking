import { createAdminClient } from "@/lib/supabase/admin";

// Shape of the Anthropic SDK's `usage` object (both Message.usage and the
// streamed finalMessage().usage). Fields are optional/nullable to stay tolerant.
export interface AnthropicUsage {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

export type UsageFeature =
  | "icp-generate"
  | "icp-chat"
  | "offer-enhance"
  | "offer-chat"
  | "offer-assistant";

// Records one Anthropic call's token usage. Best-effort: any failure is logged
// and swallowed so usage tracking never breaks a user-facing response.
export async function logUsage(opts: {
  userId: string;
  feature: UsageFeature;
  model: string;
  usage: AnthropicUsage | null | undefined;
}): Promise<void> {
  const { userId, feature, model, usage } = opts;
  if (!usage) return;
  try {
    const admin = createAdminClient();
    await admin.from("usage_events").insert({
      user_id: userId,
      feature,
      model,
      input_tokens: usage.input_tokens ?? 0,
      output_tokens: usage.output_tokens ?? 0,
      cache_creation_tokens: usage.cache_creation_input_tokens ?? 0,
      cache_read_tokens: usage.cache_read_input_tokens ?? 0,
    });
  } catch (err) {
    console.error("[usage] failed to log usage event:", err);
  }
}
