"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { PillarIcon } from "@/components/brand/pillar-icon";

// ── Geometry (SVG viewBox space) ─────────────────────────────────────────────
const VW = 1000;
const VH = 700;
const BRAIN = { x: 500, y: 350 };

type Pillar = {
  key: string;
  name: string;
  icon: string;
  color: string;
  node: { x: number; y: number };
  href: string;
};

// NOTE: `href` targets are placeholders — they'll point at the real left-nav
// pillar sections once that structure is provided.
const PILLARS: Pillar[] = [
  { key: "foundation", name: "Foundation", icon: "gem", color: "#6366f1", node: { x: 178, y: 150 }, href: "#" },
  { key: "traffic", name: "Traffic", icon: "megaphone", color: "#22d3ee", node: { x: 822, y: 150 }, href: "#" },
  { key: "lead-generation", name: "Lead Generation", icon: "funnel", color: "#f59e0b", node: { x: 178, y: 550 }, href: "#" },
  { key: "sales", name: "Sales", icon: "sales", color: "#34d399", node: { x: 822, y: 550 }, href: "#" },
];

// Quadratic-bezier control point: bow each conduit perpendicular to the
// node→brain line so all four sweep in the same rotational direction.
function controlPoint(node: { x: number; y: number }) {
  const mx = (node.x + BRAIN.x) / 2;
  const my = (node.y + BRAIN.y) / 2;
  const dx = BRAIN.x - node.x;
  const dy = BRAIN.y - node.y;
  const len = Math.hypot(dx, dy) || 1;
  const bow = 90;
  return { x: mx + (-dy / len) * bow, y: my + (dx / len) * bow };
}

// Sample points along the quadratic bezier for the travelling signal to follow.
function sampleCurve(
  node: { x: number; y: number },
  c: { x: number; y: number },
  steps = 24,
) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    xs.push(mt * mt * node.x + 2 * mt * t * c.x + t * t * BRAIN.x);
    ys.push(mt * mt * node.y + 2 * mt * t * c.y + t * t * BRAIN.y);
  }
  return { xs, ys };
}

const CURVES = PILLARS.map((p) => {
  const c = controlPoint(p.node);
  return {
    control: c,
    d: `M ${p.node.x} ${p.node.y} Q ${c.x} ${c.y} ${BRAIN.x} ${BRAIN.y}`,
    ...sampleCurve(p.node, c),
  };
});

type Signal = { id: number; pillar: number };

export default function OverviewPage() {
  const router = useRouter();
  const [signals, setSignals] = useState<Signal[]>([]);
  const nextId = useRef(0);

  const removeSignal = useCallback((id: number) => {
    setSignals((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Each pillar fires a signal toward the brain at a slow, random cadence
  // (~1 every 4s on average).
  useEffect(() => {
    let active = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    PILLARS.forEach((_, pillar) => {
      const schedule = () => {
        const delay = 2500 + Math.random() * 3000; // 2.5–5.5s, avg ~4s
        const t = setTimeout(() => {
          if (!active) return;
          setSignals((prev) => [...prev, { id: nextId.current++, pillar }]);
          schedule();
        }, delay);
        timers.push(t);
      };
      schedule();
    });

    return () => {
      active = false;
      timers.forEach(clearTimeout);
    };
  }, []);

  const go = (href: string) => {
    if (href && href !== "#") router.push(href);
  };

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center"
      >
        <h1 className="text-2xl font-bold text-text-primary">Your Growth Engine</h1>
        <p className="text-sm text-text-tertiary">
          Every pillar feeds the brain. Pick a pillar to start building.
        </p>
      </motion.div>

      <div className="relative mx-auto w-full max-w-5xl aspect-[10/7]">
        {/* ambient glow behind the brain */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0) 70%)",
          }}
        />

        {/* ── SVG layer: connecting lines + travelling signals (behind brain) ── */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${VW} ${VH}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="signal-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
            {PILLARS.map((p) => (
              <linearGradient
                key={p.key}
                id={`line-${p.key}`}
                gradientUnits="userSpaceOnUse"
                x1={p.node.x}
                y1={p.node.y}
                x2={BRAIN.x}
                y2={BRAIN.y}
              >
                <stop offset="0%" stopColor={p.color} stopOpacity="0.45" />
                <stop offset="100%" stopColor={p.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* static conduits */}
          {PILLARS.map((p, i) => (
            <path
              key={p.key}
              d={CURVES[i].d}
              fill="none"
              stroke={`url(#line-${p.key})`}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}

          {/* travelling signals */}
          <AnimatePresence>
            {signals.map((s) => {
              const p = PILLARS[s.pillar];
              const curve = CURVES[s.pillar];
              return (
                <motion.g
                  key={s.id}
                  initial={{ x: p.node.x, y: p.node.y, opacity: 0 }}
                  animate={{ x: curve.xs, y: curve.ys, opacity: [0, 1, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.6,
                    ease: "easeInOut",
                    opacity: { times: [0, 0.15, 0.85, 1] },
                  }}
                  onAnimationComplete={() => removeSignal(s.id)}
                >
                  <circle r={9} fill={p.color} opacity={0.4} filter="url(#signal-blur)" />
                  <circle r={3.5} fill={p.color} />
                  <circle r={1.5} fill="#ffffff" />
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>

        {/* ── Brain (sits above the conduits so signals are absorbed into it) ── */}
        <motion.img
          src="/brain.png"
          alt="Brain"
          draggable={false}
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 w-[34%] max-w-[340px] -translate-x-1/2 -translate-y-1/2 select-none"
          style={{ filter: "drop-shadow(0 0 24px rgba(99,102,241,0.35))" }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── Pillar nodes (clickable, top layer) ── */}
        {PILLARS.map((p, i) => (
          <button
            key={p.key}
            type="button"
            onClick={() => go(p.href)}
            className="group absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 outline-none"
            style={{
              left: `${(p.node.x / VW) * 100}%`,
              top: `${(p.node.y / VH) * 100}%`,
            }}
          >
            <span className="relative flex h-16 w-16 items-center justify-center">
              {/* pulsing halo */}
              <motion.span
                className="absolute inset-0 rounded-2xl"
                style={{ backgroundColor: p.color }}
                animate={{ opacity: [0.18, 0.32, 0.18], scale: [1, 1.18, 1] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.4,
                }}
              />
              {/* node face */}
              <span
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl border bg-surface-raised backdrop-blur-sm transition-transform duration-200 group-hover:scale-110"
                style={{
                  borderColor: `${p.color}66`,
                  boxShadow: `0 0 18px ${p.color}40`,
                  color: p.color,
                }}
              >
                <PillarIcon className="h-7 w-7" icon={p.icon} />
              </span>
            </span>
            <span className="text-sm font-semibold text-text-primary transition-colors group-hover:text-accent">
              {p.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
