"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

import { PillarIcon } from "@/components/brand/pillar-icon";

// ── Geometry (SVG viewBox space) ─────────────────────────────────────────────
const VW = 1000;
const VH = 700;
const HUB = { x: 500, y: 350 };

type Pillar = {
  key: string;
  name: string;
  icon: string;
  color: string;
  node: { x: number; y: number };
  href: string;
  lines?: number; // fixed conduit count; omit for random 1–2
};

// NOTE: `href` targets are placeholders — they'll point at the real left-nav
// pillar sections once that structure is provided.
const PILLARS: Pillar[] = [
  { key: "foundation", name: "Foundation", icon: "lego", color: "#6366f1", node: { x: 178, y: 150 }, href: "#" },
  { key: "traffic", name: "Traffic System", icon: "megaphone", color: "#22d3ee", node: { x: 822, y: 150 }, href: "#" },
  { key: "lead-generation", name: "Lead Gen System", icon: "funnel", color: "#f59e0b", node: { x: 178, y: 550 }, href: "#", lines: 1 },
  { key: "sales", name: "Sales Machine", icon: "dollar", color: "#34d399", node: { x: 822, y: 550 }, href: "#" },
];

type Curve = { d: string; c: { x: number; y: number } };

// Build one randomly-bowed quadratic-bezier conduit from a node to the hub.
function makeCurve(node: { x: number; y: number }): Curve {
  const mx = (node.x + HUB.x) / 2;
  const my = (node.y + HUB.y) / 2;
  const dx = HUB.x - node.x;
  const dy = HUB.y - node.y;
  const len = Math.hypot(dx, dy) || 1;
  const mag = (50 + Math.random() * 110) * (Math.random() < 0.5 ? -1 : 1);
  const along = (Math.random() - 0.5) * 0.25; // slide control point along the axis
  const cx = mx + (-dy / len) * mag + dx * along;
  const cy = my + (dx / len) * mag + dy * along;
  return { d: `M ${node.x} ${node.y} Q ${cx} ${cy} ${HUB.x} ${HUB.y}`, c: { x: cx, y: cy } };
}

type Signal = { id: number; pillar: number; ci: number };

// A single glowing pulse that rides the bezier from its pillar to the heart.
function Signal({
  node,
  control,
  color,
  onDone,
}: {
  node: { x: number; y: number };
  control: { x: number; y: number };
  color: string;
  onDone: () => void;
}) {
  const t = useMotionValue(0);
  const x = useTransform(t, (v) => {
    const mt = 1 - v;
    return mt * mt * node.x + 2 * mt * v * control.x + v * v * HUB.x;
  });
  const y = useTransform(t, (v) => {
    const mt = 1 - v;
    return mt * mt * node.y + 2 * mt * v * control.y + v * v * HUB.y;
  });
  const opacity = useTransform(t, [0, 0.12, 0.85, 1], [0, 1, 1, 0]);

  useEffect(() => {
    const controls = animate(t, 1, {
      duration: 1.8,
      ease: "easeInOut",
      onComplete: onDone,
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.g style={{ x, y, opacity }}>
      <circle r={9} fill={color} opacity={0.4} filter="url(#signal-blur)" />
      <circle r={3.5} fill={color} />
      <circle r={1.5} fill="#ffffff" />
    </motion.g>
  );
}

// ── 3-lego-block icon: bottom two are static, the third drops onto the top ───
function LegoBlocks({ className }: { className?: string }) {
  const brick = (x: number, y: number) => (
    <>
      <rect x={x + 1.4} y={y - 1.6} width={2.4} height={1.8} rx={0.5} fill="currentColor" />
      <rect x={x + 5.2} y={y - 1.6} width={2.4} height={1.8} rx={0.5} fill="currentColor" />
      <rect x={x} y={y} width={9} height={6} rx={1.2} fill="currentColor" fillOpacity={0.22} stroke="currentColor" strokeWidth={1.3} />
    </>
  );
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      {brick(2.5, 13)}
      {brick(12.5, 13)}
      <motion.g
        initial={{ y: -11, opacity: 0 }}
        animate={{ y: [-11, 0, 0], opacity: [0, 1, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 1.9, ease: "easeOut", times: [0, 0.55, 1] }}
      >
        {brick(7.5, 5)}
      </motion.g>
    </svg>
  );
}

function NodeIcon({ pillar }: { pillar: Pillar }) {
  if (pillar.icon === "lego") return <LegoBlocks className="h-8 w-8" />;
  if (pillar.icon === "dollar")
    return <span className="text-[26px] font-bold leading-none">$</span>;
  return <PillarIcon className="h-7 w-7" icon={pillar.icon} />;
}

export default function OverviewPage() {
  const router = useRouter();
  const [curves, setCurves] = useState<Curve[][]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const nextId = useRef(0);

  const removeSignal = useCallback((id: number) => {
    setSignals((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Build randomized conduits (1–2 per pillar) and schedule signal pulses.
  // Done on the client to avoid SSR/CSR hydration mismatch from Math.random.
  useEffect(() => {
    const built = PILLARS.map((p) => {
      const count = p.lines ?? (Math.random() < 0.5 ? 1 : 2);
      return Array.from({ length: count }, () => makeCurve(p.node));
    });
    setCurves(built);

    let active = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    PILLARS.forEach((_, pillar) => {
      const schedule = () => {
        const delay = 2500 + Math.random() * 3000; // 2.5–5.5s, avg ~4s
        const t = setTimeout(() => {
          if (!active) return;
          const ci = Math.floor(Math.random() * built[pillar].length);
          setSignals((prev) => [...prev, { id: nextId.current++, pillar, ci }]);
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
          Every pillar feeds the heart. Pick a pillar to start building.
        </p>
      </motion.div>

      <div className="relative mx-auto w-full max-w-5xl aspect-[10/7]">
        {/* ambient glow behind the hub */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0) 70%)",
          }}
        />

        {/* ── SVG layer: conduits + travelling signals (behind the hub) ── */}
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
                x2={HUB.x}
                y2={HUB.y}
              >
                <stop offset="0%" stopColor={p.color} stopOpacity="0.45" />
                <stop offset="100%" stopColor={p.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* static conduits */}
          {curves.map((arr, pi) =>
            arr.map((c, ci) => (
              <path
                key={`${PILLARS[pi].key}-${ci}`}
                d={c.d}
                fill="none"
                stroke={`url(#line-${PILLARS[pi].key})`}
                strokeWidth={2}
                strokeLinecap="round"
              />
            )),
          )}

          {/* travelling signals */}
          {signals.map((s) => {
            const p = PILLARS[s.pillar];
            const curve = curves[s.pillar]?.[s.ci];
            if (!curve) return null;
            return (
              <Signal
                key={s.id}
                node={p.node}
                control={curve.c}
                color={p.color}
                onDone={() => removeSignal(s.id)}
              />
            );
          })}
        </svg>

        {/* ── Heart hub (above the conduits so signals are absorbed into it) ── */}
        <motion.img
          src="/heart.png"
          alt="Heart"
          draggable={false}
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 w-[26%] max-w-[280px] -translate-x-1/2 -translate-y-1/2 select-none"
          style={{ filter: "drop-shadow(0 0 24px rgba(99,102,241,0.35))" }}
          animate={{ scale: [1, 1.06, 1, 1.04, 1] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.12, 0.24, 0.36, 1],
          }}
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
                <NodeIcon pillar={p} />
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
