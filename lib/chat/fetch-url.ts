// Fetch a public web page and return its readable text. Used by the assistant's
// read_url tool. The URL comes from the chat user (a deliberate action), but we
// still guard against fetching internal/private addresses (basic SSRF defense).

const BLOCKED_HOST =
  /^(localhost$|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)/i;

const MAX_CHARS = 50_000;

export async function fetchUrlText(rawUrl: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return `Couldn't parse that URL: ${rawUrl}`;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "Only http/https URLs can be read.";
  }
  if (BLOCKED_HOST.test(url.hostname)) {
    return "That URL points to a private/internal address, so I can't read it.";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "CopyKingBot/1.0 (+offer-assistant)" },
    });
    clearTimeout(timer);
    if (!res.ok) return `Couldn't fetch ${url} (HTTP ${res.status}).`;

    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();

    let text = raw;
    if (contentType.includes("html") || /<html[\s>]/i.test(raw)) {
      text = raw
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/\s+/g, " ")
        .trim();
    }
    if (!text) return `Fetched ${url} but found no readable text.`;
    return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + "\n…[truncated]" : text;
  } catch (e) {
    clearTimeout(timer);
    return `Couldn't read ${rawUrl}: ${e instanceof Error ? e.message : "error"}`;
  }
}
