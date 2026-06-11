// Shared attachment model for every guided chat (offer, ICP, and any future
// chat). Files are normalized client-side into a compact, transport-friendly
// shape; the server (lib/chat/attachments-server.ts) turns them into Anthropic
// content blocks. Keeping this layer shared means a new guided chat gets file
// support for free by reusing <ChatAttachmentBar> + this util + the server util.

// "image" → sent to Claude as a vision block.
// "pdf"   → sent as a native PDF document block.
// "document" → Word/Excel/CSV/plain text; the server extracts its text.
export type AttachmentKind = "image" | "pdf" | "document" | "audio";

export type ChatAttachment = {
  id: string;
  name: string;
  // Original mime as reported by the browser (best-effort; may be "").
  mime: string;
  kind: AttachmentKind;
  // Byte size of the ORIGINAL file (pre-base64), for display + limits.
  size: number;
  // Base64 (no data: prefix). For images this is a downscaled JPEG; for
  // everything else it's the raw file bytes.
  data: string;
};

// What the file picker advertises. Video is intentionally excluded — Claude
// can't read it — and is rejected with a friendly message if force-selected.
export const ATTACHMENT_ACCEPT =
  "image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,audio/*,.mp3,.m4a,.wav,.ogg,.aac";

// Hard cap on the ORIGINAL file size. Big enough for real docs, small enough
// that re-sending attachments on every chat turn stays reasonable.
export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_ATTACHMENTS = 6;

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i;
const PDF_EXT = /\.pdf$/i;
const DOC_EXT = /\.(docx?|pptx?|xlsx?|csv|txt|md|tsv|rtf)$/i;
const AUDIO_EXT = /\.(mp3|m4a|wav|ogg|oga|aac|mpga|flac)$/i;
const VIDEO_EXT = /\.(mp4|mov|m4v|avi|mkv|wmv|flv|mpeg|mpg)$/i;

export class AttachmentError extends Error {}

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function classify(file: File): AttachmentKind {
  const name = file.name || "";
  const mime = file.type || "";
  if (mime.startsWith("video/") || VIDEO_EXT.test(name)) {
    throw new AttachmentError(
      `Video isn't supported yet — Claude can't read "${file.name}". Try a PDF, doc, spreadsheet, or image instead.`,
    );
  }
  if (mime.startsWith("image/") || IMAGE_EXT.test(name)) return "image";
  if (mime === "application/pdf" || PDF_EXT.test(name)) return "pdf";
  if (mime.startsWith("audio/") || AUDIO_EXT.test(name)) return "audio";
  if (DOC_EXT.test(name) || mime.startsWith("text/")) return "document";
  // Unknown binary types fall through to "document"; the server will try text
  // extraction and skip gracefully if it can't read them.
  return "document";
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)),
    );
  }
  return btoa(binary);
}

// Downscale + re-encode an image to a JPEG data URL to keep payloads small.
// Falls back to the raw file if the canvas pipeline isn't available.
function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1600;
        let w = img.width;
        let h = img.height;
        if (w > max || h > max) {
          const k = max / Math.max(w, h);
          w = Math.round(w * k);
          h = Math.round(h * k);
        }
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, w, h);
        // toDataURL → strip the "data:image/jpeg;base64," prefix.
        resolve(cv.toDataURL("image/jpeg", 0.82).split(",")[1] ?? "");
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function rawToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(arrayBufferToBase64(reader.result as ArrayBuffer));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Convert a picked File into a normalized ChatAttachment. Throws
// AttachmentError with a user-facing message for video or oversized files.
export async function fileToAttachment(file: File): Promise<ChatAttachment> {
  const kind = classify(file);
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new AttachmentError(
      `"${file.name}" is too large (max ${Math.round(
        MAX_ATTACHMENT_BYTES / (1024 * 1024),
      )} MB).`,
    );
  }
  const data = kind === "image" ? await imageToBase64(file) : await rawToBase64(file);
  return {
    id: uid(),
    name: file.name || "attachment",
    mime: file.type || "",
    kind,
    size: file.size,
    data,
  };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
