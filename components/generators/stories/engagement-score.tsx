"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { ParsedStorySlide } from "@/components/generators/story-slide-card";

interface ParsedOverview {
  objective: string;
  hookAngle: string;
  primaryCta: string;
  postingTime: string;
}

interface EngagementScoreProps {
  slides: ParsedStorySlide[];
  overview: ParsedOverview;
  objective?: string;
}

interface ScoreDimension {
  label: string;
  score: number;
  max: number;
  color: string;
  detail: string;
}

const VALUE_ROLES = new Set(["value", "proof", "story", "pain", "possibility"]);
const ENGAGE_ROLES = new Set(["engage", "cta", "bridge"]);
const CONNECTION_ROLES = new Set(["hook", "story", "pain", "possibility"]);

function computeScore(
  slides: ParsedStorySlide[],
  overview: ParsedOverview,
  objective?: string,
): { total: number; dimensions: ScoreDimension[]; tips: string[] } {
  const tips: string[] = [];
  const total = slides.length;
  if (total === 0) {
    return {
      total: 0,
      dimensions: [],
      tips: ["Generate a story series first."],
    };
  }

  // 1. Copy compliance (25 pts)
  let copyScore = 25;
  let headlineViolations = 0;
  let bodyViolations = 0;
  for (const s of slides) {
    const hw = s.headline.trim().split(/\s+/).filter(Boolean).length;
    const bw =
      s.body && s.body !== "—"
        ? s.body.trim().split(/\s+/).filter(Boolean).length
        : 0;
    if (hw > 6) headlineViolations++;
    if (bw > 20) bodyViolations++;
  }
  const violationPenalty =
    ((headlineViolations + bodyViolations) / (total * 2)) * 25;
  copyScore = Math.round(25 - violationPenalty);
  if (headlineViolations > 0)
    tips.push(
      `${headlineViolations} headline(s) exceed 6 words — trim for faster read.`,
    );
  if (bodyViolations > 0)
    tips.push(
      `${bodyViolations} body text(s) exceed 20 words — cut filler.`,
    );

  // 2. Sticker diversity (20 pts)
  const stickerTypes = new Set(
    slides
      .map((s) => s.sticker.type.toLowerCase())
      .filter((t) => t !== "none" && t !== ""),
  );
  const noneStickerCount = slides.filter(
    (s) =>
      s.sticker.type.toLowerCase() === "none" || s.sticker.type === "",
  ).length;
  const stickerRatio = 1 - noneStickerCount / total;
  const diversityBase = Math.min(stickerTypes.size / 3, 1) * 12;
  const coverageBase = stickerRatio * 8;
  const stickerScore = Math.round(diversityBase + coverageBase);
  if (stickerTypes.size < 3)
    tips.push(
      `Only ${stickerTypes.size} sticker type(s) used — add variety (aim for 3+).`,
    );
  const stickerDetail =
    stickerTypes.size > 0
      ? `${stickerTypes.size} types: ${Array.from(stickerTypes).join(", ")}`
      : "No stickers used";

  // 3. Signal coverage (15 pts)
  const signals = new Set(
    slides
      .map((s) => s.expectedSignal.toLowerCase())
      .filter(Boolean),
  );
  const signalScore = Math.round(Math.min(signals.size / 4, 1) * 15);
  if (signals.size < 3)
    tips.push(
      `Only ${signals.size} unique signal(s) — diversify across dm, save, share, watch-time.`,
    );

  // 4. Funnel balance (15 pts)
  const roleValues = slides.filter((s) =>
    VALUE_ROLES.has(s.funnelRole.toLowerCase()),
  ).length;
  const roleEngage = slides.filter((s) =>
    ENGAGE_ROLES.has(s.funnelRole.toLowerCase()),
  ).length;
  const roleConnection = slides.filter((s) =>
    CONNECTION_ROLES.has(s.funnelRole.toLowerCase()),
  ).length;

  const valuePct = roleValues / total;
  const engagePct = roleEngage / total;
  const connectionPct = roleConnection / total;
  // 50/30/20 ideal — measure distance
  const dist =
    Math.abs(valuePct - 0.5) + Math.abs(engagePct - 0.3) + Math.abs(connectionPct - 0.2);
  const funnelScore = Math.round(Math.max(0, 15 - dist * 15));
  if (dist > 0.3)
    tips.push(
      `Funnel balance is off — aim for ~50% value, ~30% engage, ~20% connection roles.`,
    );

  // 5. Retention variety (10 pts)
  const tactics = new Set(
    slides
      .map((s) => s.retentionTactic.toLowerCase())
      .filter(Boolean),
  );
  const retentionScore = Math.round(Math.min(tactics.size / 4, 1) * 10);
  if (tactics.size < 3)
    tips.push("Use more varied retention tactics across slides.");

  // 6. CTA clarity (15 pts)
  let ctaScore = 0;
  const ctaSlides = slides.filter(
    (s) => s.funnelRole.toLowerCase() === "cta",
  );
  if (ctaSlides.length > 0) ctaScore += 7;
  else tips.push("No slide with a CTA funnel role — add one.");

  if (overview.primaryCta) ctaScore += 4;
  else tips.push("Missing a clear primary CTA in the series overview.");

  // DM-related sticker for DM objectives
  const hasDmSticker = slides.some(
    (s) =>
      s.sticker.type.toLowerCase() === "reveal" ||
      s.sticker.type.toLowerCase() === "question",
  );
  if (
    objective &&
    (objective === "dm" || objective === "dm-keyword") &&
    !hasDmSticker
  ) {
    tips.push(
      'DM objective but no reveal/question sticker — add one to drive DMs.',
    );
  } else if (hasDmSticker || !objective) {
    ctaScore += 4;
  }

  const dimensions: ScoreDimension[] = [
    {
      label: "Copy compliance",
      score: copyScore,
      max: 25,
      color: "bg-blue-500",
      detail: `${headlineViolations + bodyViolations} violation(s)`,
    },
    {
      label: "Sticker diversity",
      score: stickerScore,
      max: 20,
      color: "bg-purple-500",
      detail: stickerDetail,
    },
    {
      label: "Signal coverage",
      score: signalScore,
      max: 15,
      color: "bg-emerald-500",
      detail: `${signals.size} unique signals`,
    },
    {
      label: "Funnel balance",
      score: funnelScore,
      max: 15,
      color: "bg-amber-500",
      detail: `V:${Math.round(valuePct * 100)}% E:${Math.round(engagePct * 100)}% C:${Math.round(connectionPct * 100)}%`,
    },
    {
      label: "Retention tactics",
      score: retentionScore,
      max: 10,
      color: "bg-pink-500",
      detail: `${tactics.size} unique tactics`,
    },
    {
      label: "CTA clarity",
      score: ctaScore,
      max: 15,
      color: "bg-cyan-500",
      detail: ctaSlides.length > 0 ? "CTA slide present" : "No CTA slide",
    },
  ];

  const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0);

  return { total: totalScore, dimensions, tips };
}

function getScoreGrade(score: number): {
  label: string;
  color: string;
  ringColor: string;
} {
  if (score >= 90)
    return {
      label: "Exceptional",
      color: "text-emerald-500",
      ringColor: "stroke-emerald-500",
    };
  if (score >= 75)
    return {
      label: "Strong",
      color: "text-blue-500",
      ringColor: "stroke-blue-500",
    };
  if (score >= 60)
    return {
      label: "Good",
      color: "text-amber-500",
      ringColor: "stroke-amber-500",
    };
  if (score >= 40)
    return {
      label: "Needs work",
      color: "text-orange-500",
      ringColor: "stroke-orange-500",
    };
  return {
    label: "Weak",
    color: "text-rose-500",
    ringColor: "stroke-rose-500",
  };
}

export function EngagementScore({
  slides,
  overview,
  objective,
}: EngagementScoreProps) {
  const { total, dimensions, tips } = useMemo(
    () => computeScore(slides, overview, objective),
    [slides, overview, objective],
  );

  const grade = getScoreGrade(total);
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (total / 100) * circumference;

  if (slides.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Radial score */}
      <div className="flex items-center gap-5">
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              className="stroke-border"
              strokeWidth="6"
            />
            <motion.circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              className={grade.ringColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className={`text-xl font-bold ${grade.color}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {total}
            </motion.span>
            <span className="text-[9px] text-text-tertiary">/100</span>
          </div>
        </div>

        <div>
          <p className={`text-sm font-bold ${grade.color}`}>{grade.label}</p>
          <p className="text-xs text-text-tertiary mt-0.5">
            Pre-publish engagement score based on algorithm best practices.
          </p>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="space-y-2">
        {dimensions.map((d) => (
          <div key={d.label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] font-medium text-text-secondary">
                {d.label}
              </span>
              <span className="text-[10px] text-text-tertiary">
                {d.score}/{d.max} — {d.detail}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${d.color}`}
                initial={{ width: 0 }}
                animate={{
                  width: `${(d.score / d.max) * 100}%`,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
          <p className="text-[11px] font-semibold text-amber-600 mb-1.5 flex items-center gap-1.5">
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
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            Quick wins to boost your score
          </p>
          <ul className="space-y-1">
            {tips.map((tip, i) => (
              <li
                key={i}
                className="text-[11px] text-text-secondary pl-3 relative before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-amber-500/50"
              >
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
