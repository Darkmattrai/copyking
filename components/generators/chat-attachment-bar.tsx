"use client";

import { useRef, useState } from "react";
import {
  ATTACHMENT_ACCEPT,
  AttachmentError,
  MAX_ATTACHMENTS,
  fileToAttachment,
  formatBytes,
  type ChatAttachment,
} from "@/lib/chat/attachments";

// Reusable attachment strip for any guided chat. Renders the pending-file chips
// plus an "Attach" button, and normalizes picked files into ChatAttachments.
// Drop it into a chat footer above the input row and feed its state into the
// request body — that's all a new guided chat needs for file support.

const KIND_ICON: Record<ChatAttachment["kind"], string> = {
  image: "🖼️",
  pdf: "📄",
  document: "📎",
  audio: "🎧",
};

export function ChatAttachmentBar({
  attachments,
  onChange,
  disabled,
}: {
  attachments: ChatAttachment[];
  onChange: (next: ChatAttachment[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError("");
    setBusy(true);
    const room = MAX_ATTACHMENTS - attachments.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    if (Array.from(files).length > room) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
    }
    const next: ChatAttachment[] = [];
    for (const file of picked) {
      try {
        next.push(await fileToAttachment(file));
      } catch (e) {
        setError(
          e instanceof AttachmentError
            ? e.message
            : `Couldn't read "${file.name}".`,
        );
      }
    }
    if (next.length) onChange([...attachments, ...next]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (id: string) =>
    onChange(attachments.filter((a) => a.id !== id));

  const atLimit = attachments.length >= MAX_ATTACHMENTS;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {attachments.map((a) => (
          <span
            key={a.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface pl-2 pr-1 py-1 text-xs text-text-secondary max-w-[220px]"
          >
            <span className="shrink-0">{KIND_ICON[a.kind]}</span>
            <span className="truncate" title={a.name}>
              {a.name}
            </span>
            <span className="text-text-tertiary shrink-0">
              {formatBytes(a.size)}
            </span>
            <button
              type="button"
              onClick={() => remove(a.id)}
              disabled={disabled}
              className="ml-0.5 w-4 h-4 rounded-full text-text-tertiary hover:text-danger transition-colors shrink-0 leading-none"
              aria-label={`Remove ${a.name}`}
            >
              ✕
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy || atLimit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-1 text-xs text-text-tertiary hover:text-text-primary hover:border-border-hover transition-colors disabled:opacity-40"
          title="Attach a PDF, doc, spreadsheet, or image"
        >
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
              d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
            />
          </svg>
          {busy ? "Reading…" : "Attach"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ATTACHMENT_ACCEPT}
          multiple
          hidden
          onChange={(e) => pick(e.target.files)}
        />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
