"use client";

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

function ScoreRow({
  label,
  score,
  note,
}: {
  label: string;
  score: number | null;
  note: string;
}) {
  const pct = score !== null ? (score / 10) * 100 : 0;
  const tone =
    score === null
      ? "bg-surface-hover"
      : score >= 8
        ? "bg-emerald-500"
        : score >= 6
          ? "bg-amber-500"
          : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary font-medium">{label}</span>
        <span className="font-mono text-text-primary font-semibold">
          {score !== null ? `${score}/10` : "—"}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
        <div
          className={`h-full ${tone} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {note && <p className="text-[11px] text-text-tertiary leading-snug">{note}</p>}
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
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

        {score.overall !== null && (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-text-tertiary font-semibold">
              Overall
            </p>
            <p className="text-2xl font-bold text-accent leading-none">
              {score.overall}
              <span className="text-sm text-text-tertiary font-normal">/10</span>
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <ScoreRow
          label="Clarity"
          score={score.clarity.score}
          note={score.clarity.note}
        />
        <ScoreRow
          label="Search optimization"
          score={score.searchOpt.score}
          note={score.searchOpt.note}
        />
        <ScoreRow
          label="CTA strength"
          score={score.ctaStrength.score}
          note={score.ctaStrength.note}
        />

        {score.charEfficiencyPct !== null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">
                Character efficiency
              </span>
              <span className="font-mono text-text-primary font-semibold">
                {score.charEfficiencyPct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${Math.min(100, score.charEfficiencyPct)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {score.threeSecondTest && (
        <div
          className={`rounded-lg border px-3 py-2 mb-4 flex items-start gap-2 ${verdictTone}`}
        >
          <span className="text-[10px] uppercase tracking-wide font-bold">
            3-second test
          </span>
          <span className="text-xs font-semibold">{score.threeSecondTest}</span>
          {score.threeSecondNote && (
            <span className="text-[11px] opacity-80 ml-1">
              — {score.threeSecondNote}
            </span>
          )}
        </div>
      )}

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
