export interface EnhanceContext {
  who?: string;
  dream?: string;
  offerName?: string;
}

function offerContext(ctx: EnhanceContext): string {
  const bits: string[] = [];
  if (ctx.who) bits.push("Audience: " + ctx.who);
  if (ctx.dream) bits.push("Their dream outcome: " + ctx.dream);
  if (ctx.offerName) bits.push("Offer name: " + ctx.offerName);
  return bits.length ? "\n\nContext about this offer:\n" + bits.join("\n") : "";
}

export function buildEnhancePrompt(
  label: string,
  value: string,
  context: EnhanceContext
): string {
  return (
    `You are an expert direct-response copywriter helping a business owner fill in their offer builder. ` +
    `The field they are writing is: "${label}".${offerContext(context)}\n\nTheir current draft:\n"""\n${value}\n"""\n\n` +
    `Rewrite and elaborate this draft. Keep their specific facts, numbers, and intent, but make it sharper, more vivid, more persuasive, and more complete. ` +
    `Match the field — keep single-line fields concise, and let longer fields breathe into a few sentences. ` +
    `Return ONLY the improved text, with no preamble, no quotation marks, and no explanation.`
  );
}
