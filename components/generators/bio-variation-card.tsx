"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface BioVariationCardProps {
  label: string;
  formula: string;
  bioText: string;
  explanation?: string;
  bestFor?: string;
  isSelected: boolean;
  isRecommended?: boolean;
  onSelect: () => void;
  onBioEdit?: (newText: string) => void;
}

function countChars(text: string): number {
  let count = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code > 0x1f600 && code < 0x1faff) {
      count += 2;
    } else if (char !== "\n") {
      count += 1;
    }
  }
  return count;
}

export { countChars };

export function BioVariationCard({
  label,
  formula,
  bioText,
  explanation,
  bestFor,
  isSelected,
  isRecommended,
  onSelect,
  onBioEdit,
}: BioVariationCardProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(bioText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayText = isEditing ? editText : bioText;
  const charCount = countChars(displayText);
  const isOverLimit = charCount > 150;

  // Sync editText with bioText when not editing
  useEffect(() => {
    if (!isEditing) setEditText(bioText);
  }, [bioText, isEditing]);

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  }, [isEditing, editText]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing) {
      onBioEdit?.(editText);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleEditCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditText(bioText);
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      onClick={onSelect}
      className={`group relative rounded-xl border-2 p-4 transition-all cursor-pointer ${
        isSelected
          ? "border-accent bg-accent/5 shadow-sm"
          : "border-border hover:border-accent/40 bg-surface"
      }`}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute -top-2.5 left-4">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold shadow-sm">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Recommended
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0 ${
              isSelected
                ? "bg-accent text-white"
                : "bg-surface-hover text-text-secondary"
            }`}
          >
            {label.charAt(0)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-text-primary">{label}</span>
              {bestFor && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-medium">
                  {bestFor}
                </span>
              )}
            </div>
            <span className="block text-[11px] text-text-tertiary">{formula}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Char count badge */}
          <span
            className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full ${
              isOverLimit
                ? "bg-red-500/10 text-red-500"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {charCount}/150
          </span>

          {/* Edit button */}
          {onBioEdit && (
            <button
              onClick={handleEditToggle}
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg transition-colors ${
                isEditing
                  ? "bg-accent/10 text-accent"
                  : "bg-surface-hover hover:bg-accent/10 text-text-secondary hover:text-accent"
              }`}
            >
              {isEditing ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Save
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                  Edit
                </>
              )}
            </button>
          )}

          {/* Cancel edit */}
          {isEditing && (
            <button
              onClick={handleEditCancel}
              className="flex items-center text-[11px] font-medium px-2 py-1 rounded-lg bg-surface-hover hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-surface-hover hover:bg-accent/10 text-text-secondary hover:text-accent transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bio text \u2014 editable or static */}
      <div className="bg-background rounded-lg p-3 mb-2 border border-border/50">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => {
              e.stopPropagation();
              setEditText(e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-sm text-text-primary leading-relaxed resize-none outline-none focus:ring-0 min-h-[4rem]"
            placeholder="Edit your bio..."
          />
        ) : (
          displayText.split("\n").map((line, i) => (
            <span key={i} className="block text-sm text-text-primary leading-relaxed">
              {line || "\u00A0"}
            </span>
          ))
        )}
      </div>

      {/* Live char count bar when editing */}
      {isEditing && (
        <div className="mb-2">
          <div className="h-1 rounded-full bg-surface-hover overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors ${isOverLimit ? "bg-red-500" : "bg-accent"}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((charCount / 150) * 100, 100)}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
        </div>
      )}

      {/* Explanation */}
      {explanation && !isEditing && (
        <p className="text-[12px] text-text-tertiary italic leading-snug">
          {explanation}
        </p>
      )}

      {/* Selected indicator */}
      {isSelected && !isRecommended && (
        <div className="absolute top-3 right-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        </div>
      )}
    </motion.div>
  );
}
