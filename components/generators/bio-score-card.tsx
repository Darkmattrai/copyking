"use client";

import { useEffect, useState } from "react";

export interface BioScore {
  overall: number | null;
  clarity: { score: number | null; note: string };
  searchOpt: { score: number | null; note: string };
  ctaStrength: { score: number | null; note: string };
  charEfficiencyPct: number | null;
  threeSecondTest: string;
  threeSecondNote: string;
  improvements: string[];
}

interface Props {
  score: BioScore;
}

// Animated radial progress ring
function ScoreRing({
  label,
  score,
  note,
  size = 72,
}: {
  label: string;
  score: number | null;
  note: string;
  size?: number;
}) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const pct = score !== null ? (score / 10) * 100 : 0;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  const strokeColor =
    score === null
      ? "var(--color-border)"
      : score >= 8
        ? "#10b981"
        : score >= 6
          ? "#f59e0b"
          : "#ef4444";

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            className="text-border"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - animatedPct / 100)}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold text-text-primary" style={{ color: strokeColor }}>
            {score !== null ? score : "—"}
          </span>
        </div>
      </div>
      <p className="text-[11px] font-medium text-text-secondary mt-1.5">{label}</p>
      {note && (
        <p className="text-[10px] text-text-tertiary leading-tight mt-0.5 max-w-[7rem]">
          {note}
        </p>
      )}
    </div>
  );
}

// Large overall score ring
function OverallRing({ score }: { score: number | null }) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const size = 100;
  const pct = score !== null ? (score / 10) * 100 : 0;
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  const strokeColor =
    score === null
      ? "var(--color-border)"
      : score >= 8
        ? "#10b981"
        : score >= 6
          ? "#f59e0b"
          : "#ef4444";

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={5}
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - animatedPct / 100)}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: strokeColor }}>
          {score !== null ? score : "—"}
        </span>
        <span className="text-[9px] text-text-tertiary font-medium uppercase tracking-wider">
          Overall
        </span>
      </div>
    </div>
  );
}

export function BioScoreCard({ score }: Props) {
  const verdictTone =
    score.threeSecondTest.toLowerCase() === "pass"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
      : score.threeSecondTest.toLowerCase() === "fail"
        ? "bg-red-500/10 text-red-500 border-red-500/30"
        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";

  return (
    <div className="ck-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-5 flex items-center gap-2">
        <svg
          className="w-4 h-4 text-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
          />
        </svg>
        Bio Audit & Score
      </h3>

      {/* Score rings row */}
      <div className="flex items-start justify-center gap-6 mb-6 flex-wrap">
        <OverallRing score={score.overall} />
        <div className="flex gap-4 flex-wrap justify-center">
          <ScoreRing label="Clarity" score={score.clarity.score} note={score.clarity.note} />
          <ScoreRing label="SEO" score={score.searchOpt.score} note={score.searchOpt.note} />
          <ScoreRing label="CTA" score={score.ctaStrength.score} note={score.ctaStrength.note} />
        </div>
      </div>

      {/* Character efficiency bar */}
      {score.charEfficiencyPct !== null && (
        <div className="space-y-1 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium">Character efficiency</span>
            <span className="font-mono text-text-primary font-semibold">
              {score.charEfficiencyPct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-700"
              style={{ width: `${Math.min(100, score.charEfficiencyPct)}%` }}
            />
          </div>
        </div>
      )}

      {/* 3-second test */}
      {score.threeSecondTest && (
        <div
          className={`rounded-lg border px-3 py-2 mb-4 flex items-center gap-2 ${verdictTone}`}
        >
          <span className="text-[10px] uppercase tracking-wide font-bold whitespace-nowrap">
            3-second test
          </span>
          <span className="text-xs font-semibold">{score.threeSecondTest}</span>
          {score.threeSecondNote && (
            <span className="text-[11px] opacity-80">
              — {score.threeSecondNote}
            </span>
          )}
        </div>
      )}

      {/* Improvements */}
      {score.improvements.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-tertiary font-semibold mb-1.5">
            Top improvements
          </p>
          <ol className="space-y-1.5">
            {score.improvements.map((imp, i) => (
              <li
                key={i}
                className="flex gap-2 text-xs text-text-secondary leading-snug"
              >
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{imp}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
