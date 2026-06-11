"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCompletion } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";

import { useBrandStore } from "@/lib/brand/store";
import { useRole } from "@/lib/auth/use-role";
import { createMockBrandDNA } from "@/lib/brand/utils";
import { useHistoryStore, type GenerationEntry } from "@/lib/generators/history-store";
import { getGenerator } from "@/lib/generators/registry";
import { PillarIcon } from "@/components/brand/pillar-icon";
import {
  InstagramPreview,
  type PreviewLink,
  type PreviewHighlight,
  type PreviewPinnedPost,
} from "@/components/generators/instagram-preview";
import { BioVariationCard, countChars } from "@/components/generators/bio-variation-card";
import { MarkdownRenderer } from "@/components/generators/markdown-renderer";
import { type BioScore } from "@/components/generators/bio-score-card";
import { ConnectInstagram } from "@/components/generators/instagram/connect-instagram";
import { ProfileAudit } from "@/components/generators/instagram/profile-audit";
import { BioContentTab } from "@/components/generators/instagram/bio-content-tab";
import { BioLoadingPhases } from "@/components/generators/bio-loading-phases";
import { BioIntakeForm } from "@/components/generators/instagram/bio-intake-form";
import { BioQuickCopyBar } from "@/components/generators/bio-quick-copy-bar";
import { BioComparisonView } from "@/components/generators/bio-comparison-view";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

interface ParsedBio {
  label: string;
  formula: string;
  text: string;
  explanation: string;
  bestFor: string;
}

interface ParsedPinnedPost {
  label: string;
  format: string;
  topic: string;
  hook: string;
  why: string;
}

interface ParsedOutput {
  nameOptions: string[];
  bios: ParsedBio[];
  multiLinkSection: string;
  actionButtonsSection: string;
  pinnedPosts: ParsedPinnedPost[];
  highlightsSection: string;
  profilePhotoSection: string;
  score: BioScore;
  antiPatternsSection: string;
  raw: string;
}

// ────────────────────────────────────────────────────────────────
// Parsing helpers (unchanged — these work well)
// ────────────────────────────────────────────────────────────────

function extractH2Section(md: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^##\\s+${escaped}\\s*$`, "mi");
  const match = md.match(pattern);
  if (!match) return "";

  const startIdx = md.indexOf(match[0]) + match[0].length;
  const nextH2 = md.slice(startIdx).search(/^##\s+/m);
  return nextH2 === -1
    ? md.slice(startIdx).trim()
    : md.slice(startIdx, startIdx + nextH2).trim();
}

function extractLabeledValue(section: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `\\*\\*${escaped}\\*\\*\\s*[:\\-]?\\s*([^\\n]+(?:\\n(?!\\*\\*|##|###|\\d+\\.|-)[^\\n]+)*)`,
    "i",
  );
  const match = section.match(pattern);
  return match ? match[1].trim() : "";
}

function cleanBioLine(line: string): string {
  let cleaned = line.trim();
  cleaned = cleaned
    .replace(/^[-•]\s*/, "")
    .replace(/^>\s*/, "")
    .replace(/\s*\(\d+\s*chars?\)\s*$/i, "")
    .trim();
  cleaned = cleaned.replace(
    /^\**\s*(what you do|who you help|result they get|result)\s*\**\s*[:\-]?\s*/i,
    "",
  );
  cleaned = cleaned
    .replace(/\*\*/g, "")
    .replace(/^_+|_+$/g, "")
    .replace(/^\*+|\*+$/g, "")
    .trim();
  return cleaned;
}

function parseNameOptions(section: string): string[] {
  if (!section) return [];
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => {
      const stripped = line.replace(/^\d+\.\s+/, "");
      const firstDash = stripped.search(/\s+[—–-]\s+/);
      const text = firstDash === -1 ? stripped : stripped.slice(0, firstDash);
      return text
        .replace(/\(\d+\s*chars?\)/i, "")
        .replace(/\*\*/g, "")
        .trim();
    })
    .filter(Boolean);
}

const FORMULA_LABELS = [
  { label: "Authority Style", formula: "Identity/Title + Transformation + CTA + Link" },
  { label: "Proof-Led Style", formula: "Proof/Results + Transformation + CTA + Link" },
  { label: "Mission-Driven Style", formula: "Purpose + Transformation + CTA + Link" },
  { label: "Personality Style", formula: "Identity + Personal touch + CTA + Link" },
  { label: "Transformation Arc Style", formula: "From X → To Y + CTA + Link" },
  { label: "Lowercase Aesthetic", formula: "All lowercase, minimal punctuation, 2026 trend" },
];

// Hard safety net: a bio must NEVER exceed Instagram's 150-char limit. Trims
// trailing words from the longest line until it fits (preserves the 4-line / link
// structure as much as possible). Runs on every parse, so an over-limit bio can
// never reach the UI, the preview, or the copy button — regardless of the model.
function trimBioToLimit(text: string, limit = 150): string {
  let out = text;
  let guard = 0;
  while (countChars(out) > limit && guard++ < 300) {
    const lines = out.split("\n");
    let idx = 0;
    for (let i = 1; i < lines.length; i++) {
      if (countChars(lines[i]) > countChars(lines[idx])) idx = i;
    }
    const words = lines[idx].trimEnd().split(/\s+/);
    if (words.length > 1) {
      words.pop();
      lines[idx] = words.join(" ");
    } else {
      // single long word — hard-cut a character
      lines[idx] = lines[idx].slice(0, -1);
    }
    out = lines.join("\n");
  }
  return out;
}

function parseBioVariations(raw: string): ParsedBio[] {
  const bios: ParsedBio[] = [];

  for (const { label, formula } of FORMULA_LABELS) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `###\\s+(?:Bio Variation \\d+\\s*[—–-]\\s*)?${escaped}[^\\n]*`,
      "i",
    );
    const match = raw.match(pattern);
    if (!match) continue;

    const startIdx = raw.indexOf(match[0]) + match[0].length;
    const remaining = raw.slice(startIdx);
    const nextHeading = remaining.search(/^(?:###|##)\s+/m);
    const section =
      nextHeading === -1 ? remaining.trim() : remaining.slice(0, nextHeading).trim();

    const lines = section.split("\n").map((l) => l.trim());
    const bioLines: string[] = [];
    let explanation = "";
    let bestFor = "";
    let pastBio = false;

    for (const line of lines) {
      if (!line) continue;
      if (/^\*?\*?Formula\*?\*?\s*[:\-]/i.test(line)) continue;
      if (/^\(/.test(line) && /chars?\)/.test(line)) {
        pastBio = true;
        continue;
      }

      const charCountInline = /\(\d+\s*chars?\)/i.test(line);

      const whyMatch = line.match(
        /^\*?\*?Why this works\*?\*?\s*[:\-]\s*(.+)/i,
      );
      if (whyMatch) {
        explanation = whyMatch[1].replace(/\*\*/g, "").trim();
        pastBio = true;
        continue;
      }

      const bestForMatch = line.match(
        /^\*?\*?Best for\*?\*?\s*[:\-]\s*(.+)/i,
      );
      if (bestForMatch) {
        bestFor = bestForMatch[1].replace(/\*\*/g, "").trim();
        pastBio = true;
        continue;
      }

      if (charCountInline) {
        const cleaned = cleanBioLine(line);
        if (cleaned) bioLines.push(cleaned);
        pastBio = true;
        continue;
      }

      if (!pastBio) {
        const cleaned = cleanBioLine(line);
        if (cleaned) bioLines.push(cleaned);
      }
    }

    if (bioLines.length > 0) {
      bios.push({
        label,
        formula,
        text: trimBioToLimit(bioLines.join("\n")),
        explanation,
        bestFor,
      });
    }
  }

  return bios;
}

function parsePinnedPosts(raw: string): ParsedPinnedPost[] {
  const posts: ParsedPinnedPost[] = [];
  const pattern =
    /###\s+Pinned Post\s+\d+\s*[—–-]\s*(My Story|How To Start With Me|Proof[^"\n]*|Results[^"\n]*|Testimonials[^"\n]*|Lead Magnet[^"\n]*|Awareness|Consideration|Conversion)([^\n]*)\n([\s\S]*?)(?=###\s+Pinned Post|\n##\s+|$)/gim;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw)) !== null) {
    const label = match[1].trim().replace(/\s*\/\s*$/, "");
    const body = match[3] || "";
    const format = extractLabeledValue(body, "Format");
    const topic = extractLabeledValue(body, "Topic");
    const hook = extractLabeledValue(body, "Hook");
    const why = extractLabeledValue(body, "Why pinned");
    posts.push({ label, format, topic, hook, why });
  }

  return posts;
}

function parseNumberOutOf10(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
}

function parsePercent(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
}

function splitScoreLine(raw: string): { score: number | null; note: string } {
  const score = parseNumberOutOf10(raw);
  const noteMatch = raw.match(/—\s*(.+)$/) || raw.match(/-\s+(.+)$/);
  const note = noteMatch ? noteMatch[1].trim() : "";
  return { score, note };
}

function parseScore(section: string): BioScore {
  if (!section) {
    return {
      overall: null,
      clarity: { score: null, note: "" },
      searchOpt: { score: null, note: "" },
      ctaStrength: { score: null, note: "" },
      charEfficiencyPct: null,
      threeSecondTest: "",
      threeSecondNote: "",
      improvements: [],
    };
  }

  const overall = parseNumberOutOf10(extractLabeledValue(section, "Overall Score"));
  const clarity = splitScoreLine(extractLabeledValue(section, "Clarity"));
  const searchOpt = splitScoreLine(
    extractLabeledValue(section, "Search optimization"),
  );
  const ctaStrength = splitScoreLine(extractLabeledValue(section, "CTA strength"));
  const charEfficiencyPct = parsePercent(
    extractLabeledValue(section, "Character efficiency"),
  );

  const threeSecondRaw = extractLabeledValue(section, "3-second test");
  const verdictMatch = threeSecondRaw.match(/^(Pass|Borderline|Fail)/i);
  const threeSecondTest = verdictMatch ? verdictMatch[1] : "";
  const noteAfterDash = threeSecondRaw.match(/—\s*(.+)$/);
  const threeSecondNote = noteAfterDash ? noteAfterDash[1].trim() : "";

  const impSectionMatch = section.match(
    /\*\*Top 3 specific improvements\*\*[:\s]*\n([\s\S]*)/i,
  );
  const improvements: string[] = [];
  if (impSectionMatch) {
    const lines = impSectionMatch[1].split("\n");
    for (const line of lines) {
      const m = line.match(/^\s*\d+\.\s+(.+)/);
      if (m) {
        improvements.push(m[1].replace(/\*\*/g, "").trim());
      } else if (line.trim() === "" && improvements.length > 0) {
        break;
      }
    }
  }

  return {
    overall,
    clarity,
    searchOpt,
    ctaStrength,
    charEfficiencyPct,
    threeSecondTest,
    threeSecondNote,
    improvements,
  };
}

function parseOutput(raw: string): ParsedOutput {
  const nameSection = extractH2Section(raw, "Name Field Options");
  const multiLinkSection = extractH2Section(raw, "Native Multi-Link Strategy");
  const actionButtonsSection = extractH2Section(raw, "Action Buttons");
  const pinnedSection = extractH2Section(raw, "Pinned Posts Strategy");
  const highlightsSection = extractH2Section(raw, "Highlights Strategy");
  const profilePhotoSection = extractH2Section(raw, "Profile Photo Direction");
  const scoreSection = extractH2Section(raw, "Bio Audit & Score");
  const antiPatternsSection = extractH2Section(raw, "Anti-Patterns Caught");

  return {
    nameOptions: parseNameOptions(nameSection),
    bios: parseBioVariations(raw),
    multiLinkSection,
    actionButtonsSection,
    pinnedPosts: parsePinnedPosts(pinnedSection),
    highlightsSection,
    profilePhotoSection,
    score: parseScore(scoreSection),
    antiPatternsSection,
    raw,
  };
}

// ────────────────────────────────────────────────────────────────
// Preview-data extraction
// ────────────────────────────────────────────────────────────────

function extractPreviewLinks(section: string): PreviewLink[] {
  if (!section) return [];
  return section
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\d+\.\s+/.test(l))
    .map((line) => {
      const stripped = line.replace(/^\d+\.\s+/, "").replace(/^`|`$/g, "");
      const firstDash = stripped.search(/\s+[—–-]\s+/);
      const title = firstDash === -1 ? stripped : stripped.slice(0, firstDash);
      return {
        title: title
          .replace(/\*\*/g, "")
          .replace(/^`|`$/g, "")
          .replace(/\(.{0,40}\)\s*$/, "")
          .trim(),
      };
    })
    .slice(0, 5);
}

function extractActionButtonChips(section: string): string[] {
  if (!section) return [];
  const labels = ["Book Now", "Reserve", "Order Food", "Email", "Call", "View Shop"];
  return labels.filter((l) =>
    new RegExp(`\\b${l.replace(/\s+/g, "\\s+")}\\b`, "i").test(section),
  );
}

const HIGHLIGHT_PALETTE = [
  "#E1306C",
  "#833AB4",
  "#F77737",
  "#0095F6",
  "#10B981",
  "#F59E0B",
  "#6366F1",
];

function extractPreviewHighlights(section: string): PreviewHighlight[] {
  if (!section) return [];
  return section
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\d+\.\s+/.test(l))
    .map((line, idx) => {
      const stripped = line.replace(/^\d+\.\s+/, "").replace(/^`|`$/g, "");
      const firstDash = stripped.search(/\s+[—–-]\s+/);
      const name = (firstDash === -1 ? stripped : stripped.slice(0, firstDash))
        .replace(/\*\*/g, "")
        .replace(/^`|`$/g, "")
        .trim();
      const letter = name.replace(/[^a-zA-Z0-9]/g, "").charAt(0).toUpperCase() || "•";
      return {
        name,
        letter,
        color: HIGHLIGHT_PALETTE[idx % HIGHLIGHT_PALETTE.length],
      };
    })
    .slice(0, 7);
}

function pinnedToPreview(posts: ParsedPinnedPost[]): PreviewPinnedPost[] {
  return posts.slice(0, 3).map((p) => ({
    label: (p.topic || p.label || "").slice(0, 28),
    role: p.label,
  }));
}

// ────────────────────────────────────────────────────────────────
// Page component
// ────────────────────────────────────────────────────────────────

export default function InstagramBioPage() {
  const router = useRouter();
  const brandDNA = useBrandStore((s) => s.brandDNA);
  const setBrandDNA = useBrandStore((s) => s.setBrandDNA);
  const setInterviewCompleted = useBrandStore((s) => s.setInterviewCompleted);
  const interviewCompleted = useBrandStore((s) => s.interviewCompleted);
  const addEntry = useHistoryStore((s) => s.addEntry);
  const allEntries = useHistoryStore((s) => s.entries);
  const role = useRole();
  const generator = getGenerator("instagram-bio");

  const brandIsEmpty =
    !interviewCompleted || (brandDNA?.completionScore ?? 0) === 0;

  // Core generation state
  const [selectedBioIdx, setSelectedBioIdx] = useState(0);
  const [selectedNameIdx, setSelectedNameIdx] = useState(0);
  const [hasAddedToHistory, setHasAddedToHistory] = useState(false);
  const [restoredOutput, setRestoredOutput] = useState<string | null>(null);
  const [previewUsername, setPreviewUsername] = useState("yourusername");

  // Live Instagram profile (when connected) — drives the preview's identity + counts.
  const [igProfile, setIgProfile] = useState<{
    connected: boolean;
    username?: string;
    name?: string;
    profilePictureUrl?: string | null;
    posts?: string;
    followers?: string;
    following?: string;
  }>({ connected: false });

  useEffect(() => {
    fetch("/api/instagram/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d?.connected && d.profile) {
          setIgProfile({
            connected: true,
            username: d.profile.username,
            name: d.profile.name,
            profilePictureUrl: d.profile.profilePictureUrl,
            posts: d.profile.mediaCount != null ? String(d.profile.mediaCount) : undefined,
            followers: d.profile.followersCount != null ? String(d.profile.followersCount) : undefined,
            following: d.profile.followsCount != null ? String(d.profile.followsCount) : undefined,
          });
          if (d.profile.username) setPreviewUsername(d.profile.username);
        }
      })
      .catch(() => {});
  }, []);

  // Pillar hub: which of the 4 sub-tools is open (null = hub landing).
  const [pillar, setPillar] = useState<"audit" | "bio" | "highlights" | "pinned" | null>(null);

  // New UI state
  const [showHistory, setShowHistory] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [editedBios, setEditedBios] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const completionRef = useRef<string>("");

  const { completion, isLoading, complete, setCompletion, error } = useCompletion({
    api: "/api/generate",
    streamProtocol: "text",
    onFinish: (_prompt, text) => {
      completionRef.current = text;
    },
  });

  // Fall back to ref if SWR hasn't reflected the final completion yet
  const activeOutput = restoredOutput ?? (completion || completionRef.current);
  const parsed = useMemo(() => parseOutput(activeOutput), [activeOutput]);

  // Apply inline edits to parsed bios
  const displayBios = useMemo(() => {
    return parsed.bios.map((bio, i) => ({
      ...bio,
      text: editedBios[i] ?? bio.text,
    }));
  }, [parsed.bios, editedBios]);

  const previewLinks = useMemo(
    () => extractPreviewLinks(parsed.multiLinkSection),
    [parsed.multiLinkSection],
  );
  const previewHighlights = useMemo(
    () => extractPreviewHighlights(parsed.highlightsSection),
    [parsed.highlightsSection],
  );
  const previewPinned = useMemo(
    () => pinnedToPreview(parsed.pinnedPosts),
    [parsed.pinnedPosts],
  );

  // History auto-save — fires once when a generation finishes.
  useEffect(() => {
    if (!isLoading && completion && !hasAddedToHistory) {
      addEntry({ slug: "instagram-bio", output: completion });
      setHasAddedToHistory(true);
    }
  }, [isLoading, completion, addEntry, hasAddedToHistory]);

  const history = useMemo(
    () => allEntries.filter((e) => e.slug === "instagram-bio"),
    [allEntries],
  );

  const runGenerate = useCallback(
    async (params: Record<string, string>) => {
      setRestoredOutput(null);
      setSelectedBioIdx(0);
      setSelectedNameIdx(0);
      setHasAddedToHistory(false);
      setEditedBios({});
      setShowComparison(false);
      setSubmitted(true);
      completionRef.current = "";
      setCompletion("");
      const result = await complete("", {
        body: { slug: "instagram-bio", params, brandDNA },
      });
      if (typeof result === "string" && result) {
        completionRef.current = result;
      }
    },
    [brandDNA, complete, setCompletion],
  );

  const handleQuickGenerate = useCallback(() => {
    runGenerate({});
  }, [runGenerate]);

  // Restart: clear the output and return to the Build-your-bio intake form.
  const handleStartOver = useCallback(() => {
    setSubmitted(false);
    setRestoredOutput(null);
    completionRef.current = "";
    setCompletion("");
  }, [setCompletion]);

  const handleRestore = (entry: GenerationEntry) => {
    setRestoredOutput(entry.output);
    setSelectedBioIdx(0);
    setSelectedNameIdx(0);
    setEditedBios({});
    setShowHistory(false);
    setSubmitted(true);
  };

  const handleBioEdit = useCallback((idx: number, newText: string) => {
    setEditedBios((prev) => ({ ...prev, [idx]: newText }));
  }, []);

  // Preview data
  const previewBio = displayBios[selectedBioIdx]?.text ?? "";
  const previewName = igProfile.connected
    ? igProfile.name || (igProfile.username ? `@${igProfile.username}` : "Your Name")
    : "Your Name | Your Expertise";

  // Comparison data for the comparison view
  const comparisonBios = useMemo(
    () =>
      displayBios.map((bio) => ({
        label: bio.label,
        formula: bio.formula,
        text: bio.text,
        bestFor: bio.bestFor,
      })),
    [displayBios],
  );

  // The sub-tools (pillars) shown on the hub landing. The Account Audit (live
  // Instagram connection) is admin-only for now; clients get the 3 generators.
  const PILLARS = [
    { key: "audit" as const, title: "Instagram Account Audit", desc: "Connect a profile and grade it against the criteria." },
    { key: "bio" as const, title: "Bio Generator", desc: "Craft the 150-character bio from a guided intake." },
    { key: "highlights" as const, title: "Highlights Generator", desc: "Script My Story, How I Can Help & more." },
    { key: "pinned" as const, title: "Pinned Posts Generator", desc: "Script About Me, What to Expect & more." },
    // Audit is admin-only; hide it only for confirmed clients (role loads async,
    // so don't hide it while role is still null or it'd vanish for admins too).
  ].filter((p) => p.key !== "audit" || role !== "client");
  const PILLAR_LABEL: Record<string, string> = Object.fromEntries(
    PILLARS.map((p) => [p.key, p.title]),
  );

  return (
    <div className="p-6 lg:p-8 h-full">
      {/* Back button + Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => router.push("/generate")}
          className="flex items-center gap-1.5 text-text-tertiary hover:text-text-primary text-sm mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All Generators
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] flex items-center justify-center text-white shrink-0">
            <PillarIcon className="w-6 h-6" icon="instagram" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Instagram Bio Generator
            </h1>
            <p className="text-sm text-text-tertiary mt-1 max-w-xl">
              Four tools in one — audit a profile, craft the bio, and script your Highlights &amp; Pinned Posts, all from your Brand DNA.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                <PillarIcon className="w-3.5 h-3.5" icon="book" />
                Uses your Brand DNA
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                6 bio variations + full strategy
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Tuned for the 2026 algorithm
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Breadcrumb (inside a pillar) */}
      {pillar && (
        <nav className="flex items-center gap-1.5 text-sm mb-4">
          <button
            onClick={() => setPillar(null)}
            className="text-text-tertiary hover:text-accent transition-colors"
          >
            Instagram
          </button>
          <span className="text-text-tertiary">/</span>
          <span className="text-text-primary font-medium">{PILLAR_LABEL[pillar]}</span>
        </nav>
      )}

      {/* Hub landing — pick a pillar */}
      {pillar === null && (
        <div className="grid sm:grid-cols-2 gap-4">
          {PILLARS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPillar(p.key)}
              className="ck-card p-5 text-left hover:border-accent/50 transition-colors group"
            >
              <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
                {p.title}
              </h3>
              <p className="text-sm text-text-tertiary mt-1">{p.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Pillar: Instagram Account Audit */}
      {pillar === "audit" && (
        <>
          <ConnectInstagram />
          <ProfileAudit />
        </>
      )}

      {/* Pillar: Highlights Generator */}
      {pillar === "highlights" && <BioContentTab kind="highlights" brandDNA={brandDNA} />}

      {/* Pillar: Pinned Posts Generator */}
      {pillar === "pinned" && <BioContentTab kind="pinned" brandDNA={brandDNA} />}

      {/* Pillar: Bio Generator — 2-column flow */}
      {pillar === "bio" && (
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* LEFT COLUMN — Generation + Output */}
        <div className="space-y-5">
          {/* ═══════════════════════════════════════════════════════ */}
          {/* Pre-generation state                                    */}
          {/* ═══════════════════════════════════════════════════════ */}
          {!submitted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Brand DNA empty warning */}
              {brandIsEmpty && (
                <div className="ck-card p-4 border-amber-500/40 bg-amber-500/5 flex items-start gap-3">
                  <svg
                    className="w-4 h-4 text-amber-500 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary mb-0.5">
                      Brand DNA is empty
                    </p>
                    <p className="text-xs text-text-tertiary mb-2">
                      Without it, the generator can&apos;t write copy specific to
                      your brand. Complete onboarding, or load a demo brand to
                      test the generator right now.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setBrandDNA(createMockBrandDNA());
                          setInterviewCompleted(true);
                        }}
                        className="ck-btn-primary px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
                      >
                        <PillarIcon className="w-3.5 h-3.5" icon="sparkles" />
                        Load Demo Brand DNA
                      </button>
                      <button
                        onClick={() => router.push("/onboarding")}
                        className="ck-btn-secondary px-3 py-1.5 rounded-lg text-xs font-medium"
                      >
                        Start Brand Discovery
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Build your bio — guided intake (pre-filled from Brand DNA) */}
              <BioIntakeForm
                brandDNA={brandDNA}
                isLoading={isLoading}
                brandIsEmpty={brandIsEmpty}
                onSubmit={runGenerate}
                onQuickGenerate={handleQuickGenerate}
              />

              {/* History quick-access */}
              {history.length > 0 && (
                <div className="ck-card p-4">
                  <button
                    onClick={() => setShowHistory((v) => !v)}
                    className="w-full flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2 font-medium text-text-secondary">
                      <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Previous Generations
                    </span>
                    <span className="text-xs text-text-tertiary">{history.length} saved</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* Loading state — phased animation                       */}
          {/* ═══════════════════════════════════════════════════════ */}
          {submitted && isLoading && !activeOutput && <BioLoadingPhases />}

          {/* Error */}
          {error && (
            <div className="ck-card p-4 border-red-500/40 bg-red-500/5">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-500">Generation failed</p>
                  <p className="text-xs text-text-tertiary mt-0.5">Check your connection and try again.</p>
                </div>
                <button
                  onClick={handleQuickGenerate}
                  className="ml-auto ck-btn-secondary px-3 py-1.5 rounded-lg text-xs font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* Streaming output — live markdown                       */}
          {/* ═══════════════════════════════════════════════════════ */}
          {submitted && isLoading && activeOutput && (
            <div className="ck-card p-6">
              <MarkdownRenderer content={activeOutput} />
              <div className="mt-4 flex items-center gap-2 text-text-tertiary">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:300ms]" />
                </div>
                <span className="text-xs">Still writing...</span>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* Completed output — structured tabs                     */}
          {/* ═══════════════════════════════════════════════════════ */}
          {submitted && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              {/* ── Action bar ─────────────────────────────────── */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleStartOver}
                  className="ck-btn-primary px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  Edit answers &amp; regenerate
                </button>

                {displayBios.length >= 2 && (
                  <button
                    onClick={() => setShowComparison((v) => !v)}
                    className={`ck-btn-secondary px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${showComparison ? "border-accent/50 bg-accent/5" : ""}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                    Compare
                  </button>
                )}

                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className={`ck-btn-secondary px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${showHistory ? "border-accent/50 bg-accent/5" : ""}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  History ({history.length})
                </button>

                {/* Mobile preview toggle */}
                <button
                  onClick={() => setShowMobilePreview((v) => !v)}
                  className={`xl:hidden ck-btn-secondary px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${showMobilePreview ? "border-accent/50 bg-accent/5" : ""}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                  Preview
                </button>
              </div>

              {/* ── Comparison view ────────────────────────────── */}
              <AnimatePresence>
                {showComparison && comparisonBios.length >= 2 && (
                  <BioComparisonView
                    bios={comparisonBios}
                    onClose={() => setShowComparison(false)}
                  />
                )}
              </AnimatePresence>

              {/* ── Mobile preview sheet ───────────────────────── */}
              <AnimatePresence>
                {showMobilePreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="xl:hidden overflow-hidden"
                  >
                    <div className="ck-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                          </svg>
                          Live Preview
                        </h3>
                        <button
                          onClick={() => setShowMobilePreview(false)}
                          className="text-text-tertiary hover:text-text-primary p-1 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex justify-center">
                        <InstagramPreview
                          nameField={previewName}
                          bioText={previewBio}
                          username={previewUsername}
                          onUsernameChange={setPreviewUsername}
                          category=""
                          links={previewLinks}
                          highlights={previewHighlights}
                          pinnedPosts={previewPinned}
                          profileImageUrl={igProfile.profilePictureUrl}
                          posts={igProfile.posts}
                          followers={igProfile.followers}
                          following={igProfile.following}
                          compact
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Bio variations ─────────────────────────────── */}
              <div className="space-y-3">
                {displayBios.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        <PillarIcon className="w-4 h-4 text-accent" icon="pen" />
                        Bio Variations
                        <span className="text-[11px] font-normal text-text-tertiary">
                          — click to preview, edit inline
                        </span>
                      </h3>
                      {displayBios.length > 0 && (
                        <span className="text-[10px] font-mono text-text-tertiary">
                          {countChars(displayBios[selectedBioIdx]?.text ?? "")}/150 chars
                        </span>
                      )}
                    </div>
                    {displayBios.map((bio, i) => (
                      <BioVariationCard
                        key={i}
                        label={bio.label}
                        formula={bio.formula}
                        bioText={bio.text}
                        explanation={bio.explanation}
                        bestFor={bio.bestFor}
                        isSelected={selectedBioIdx === i}
                        isRecommended={i === 0}
                        onSelect={() => setSelectedBioIdx(i)}
                        onBioEdit={(newText) => handleBioEdit(i, newText)}
                      />
                    ))}
                  </>
                ) : (
                  <div className="ck-card p-6">
                    <MarkdownRenderer content={activeOutput} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* RIGHT COLUMN — Phone preview (sticky, desktop only)    */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="hidden xl:block sticky top-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
              Live Preview
            </h3>
            <InstagramPreview
              nameField={previewName}
              bioText={previewBio}
              username={previewUsername}
              onUsernameChange={setPreviewUsername}
              category=""
              links={previewLinks}
              highlights={previewHighlights}
              pinnedPosts={previewPinned}
              profileImageUrl={igProfile.profilePictureUrl}
              posts={igProfile.posts}
              followers={igProfile.followers}
              following={igProfile.following}
            />
            {previewBio && (
              <p className="text-[11px] text-text-tertiary text-center">
                Click a bio variation to update the preview
              </p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* History panel (expandable)                              */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {pillar === "bio" && showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-6"
          >
            <div className="ck-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Generation History
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-text-tertiary hover:text-text-primary p-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {history.length === 0 ? (
                <p className="text-sm text-text-tertiary">
                  No previous generations yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((entry, i) => {
                    const date = new Date(entry.createdAt);
                    const timeStr = date.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const preview = entry.output.slice(0, 80).replace(/\n/g, " ") + "…";
                    return (
                      <button
                        key={entry.createdAt + i}
                        onClick={() => handleRestore(entry)}
                        className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-accent/40 bg-surface hover:bg-surface-hover transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-text-secondary">
                            {timeStr}
                          </span>
                          <span className="text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                            Restore
                          </span>
                        </div>
                        <p className="text-xs text-text-tertiary truncate">
                          {preview}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Quick copy bar (fixed bottom, shows when output ready)  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {pillar === "bio" && submitted && !isLoading && activeOutput && (
          <BioQuickCopyBar
            bioText={previewBio}
            nameText={previewName}
            linksText={parsed.multiLinkSection}
            fullOutput={activeOutput}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
