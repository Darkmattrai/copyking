import type Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import type { ChatAttachment } from "./attachments";

// Transcribe an audio attachment via OpenAI Whisper → text.
async function transcribeAttachment(a: ChatAttachment): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return "[audio attachment — transcription not configured]";
  try {
    const buffer = Buffer.from(a.data, "base64");
    const fd = new FormData();
    fd.append("file", new Blob([buffer]), a.name || "audio");
    fd.append("model", "whisper-1");
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: fd,
    });
    if (!res.ok) return "[audio attachment — couldn't transcribe]";
    const data = await res.json();
    return (data.text as string) || "";
  } catch {
    return "[audio attachment — couldn't transcribe]";
  }
}

// Extract slide text from a .pptx (zip of slide XML).
async function extractPptx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)?.[1] || "0", 10);
      const nb = parseInt(b.match(/slide(\d+)/)?.[1] || "0", 10);
      return na - nb;
    });
  const out: string[] = [];
  for (let i = 0; i < slideNames.length; i++) {
    const xml = await zip.files[slideNames[i]].async("string");
    const runs = Array.from(xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)).map((m) => m[1]);
    if (runs.length) out.push(`# Slide ${i + 1}\n${runs.join(" ")}`);
  }
  return out.join("\n\n").trim();
}

// Server-side half of the shared attachment layer. Turns the normalized
// ChatAttachment list (from the client) into Anthropic content blocks:
//   image    → image block (native vision)
//   pdf      → document block (native PDF support)
//   document → text extracted from Word/Excel/CSV/plain text, inlined as text
// Used by every guided-chat route so file support is consistent everywhere.

export type ChatClientMessage = {
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
};

// Guard against a single giant spreadsheet/doc swamping the context window.
const MAX_TEXT_CHARS = 200_000;

function clip(text: string): string {
  return text.length > MAX_TEXT_CHARS
    ? text.slice(0, MAX_TEXT_CHARS) + "\n…[truncated]"
    : text;
}

async function extractText(a: ChatAttachment): Promise<string> {
  const buffer = Buffer.from(a.data, "base64");
  const name = a.name.toLowerCase();

  try {
    if (name.endsWith(".docx")) {
      const { value } = await mammoth.extractRawText({ buffer });
      return value.trim();
    }
    if (name.endsWith(".doc")) {
      // Legacy .doc isn't parseable by mammoth; fall back to best-effort text.
      return buffer.toString("utf8").replace(/[^\x09\x0a\x0d\x20-\x7e]+/g, " ").trim();
    }
    if (name.endsWith(".pptx")) {
      return await extractPptx(buffer);
    }
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const wb = XLSX.read(buffer, { type: "buffer" });
      return wb.SheetNames.map((sheet) => {
        const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheet]);
        return `# Sheet: ${sheet}\n${csv}`;
      })
        .join("\n\n")
        .trim();
    }
    // csv / tsv / txt / md / unknown → treat as UTF-8 text.
    return buffer.toString("utf8").trim();
  } catch {
    return "";
  }
}

// Build the Anthropic content blocks for one user turn's attachments.
export async function attachmentBlocks(
  attachments: ChatAttachment[],
): Promise<Anthropic.ContentBlockParam[]> {
  const blocks: Anthropic.ContentBlockParam[] = [];
  for (const a of attachments) {
    if (a.kind === "image") {
      blocks.push({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: a.data },
      });
    } else if (a.kind === "pdf") {
      blocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: a.data,
        },
        title: a.name,
      });
    } else if (a.kind === "audio") {
      const transcript = clip(await transcribeAttachment(a));
      blocks.push({
        type: "text",
        text: `[Audio file: ${a.name}] transcript:\n\n${transcript || "(empty)"}`,
      });
    } else {
      const text = clip(await extractText(a));
      blocks.push({
        type: "text",
        text: text
          ? `[Attached file: ${a.name}]\n\n${text}`
          : `[Attached file: ${a.name} — couldn't read its contents.]`,
      });
    }
  }
  return blocks;
}

// Convert the client's message list (strings + optional attachments) into the
// Anthropic messages array. Messages without attachments stay plain strings;
// messages with attachments become a content-block array (text first, then the
// files). Attachments ride along in history so context persists across turns.
export async function toAnthropicMessages(
  messages: ChatClientMessage[],
): Promise<Anthropic.MessageParam[]> {
  const out: Anthropic.MessageParam[] = [];
  for (const m of messages) {
    const atts = Array.isArray(m.attachments) ? m.attachments : [];
    if (m.role === "user" && atts.length) {
      const blocks: Anthropic.ContentBlockParam[] = [];
      const text = (m.content || "").trim();
      blocks.push({
        type: "text",
        text: text || "(See the attached file(s).)",
      });
      blocks.push(...(await attachmentBlocks(atts)));
      out.push({ role: "user", content: blocks });
    } else {
      out.push({ role: m.role, content: m.content });
    }
  }
  return out;
}
