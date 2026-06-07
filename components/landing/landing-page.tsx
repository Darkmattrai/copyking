"use client";

import { useState } from "react";
import Link from "next/link";

/* ──────────────────────────────────────────────────────────────────────────
   Copy King marketing landing page.

   Layout, section order and visual language are modeled on a Kong-style
   direct-response SaaS page (dark theme, violet accent, white "highlight box"
   headlines, marquees, big alternating statement steps, red/green comparison,
   guarantee, pricing, FAQ). All copy here is original to Copy King.
   ─────────────────────────────────────────────────────────────────────── */

const VIOLET = "#7c3aed";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">
      {children}
    </span>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return <span className="ck-highlight">{children}</span>;
}

/* ── Nav ─────────────────────────────────────────────────────────────── */
function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-black text-white">
            CK
          </span>
          <span className="text-lg font-extrabold tracking-tight text-white">
            COPY KING
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#features" className="transition-colors hover:text-white">
            Features
          </a>
          <a href="#tools" className="transition-colors hover:text-white">
            Tools
          </a>
          <a href="#pricing" className="transition-colors hover:text-white">
            Pricing
          </a>
          <a href="#faq" className="transition-colors hover:text-white">
            FAQ
          </a>
        </nav>

        <Link
          href="/login"
          className="rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-transform hover:scale-[1.03]"
        >
          Login
        </Link>
      </div>
    </header>
  );
}

/* ── Hero ────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-20 pb-16 text-center">
      <div className="ck-glow left-1/2 top-0 h-[420px] w-[620px] -translate-x-1/2" />
      <div className="relative mx-auto max-w-4xl">
        <Pill>✦ AI copy trained on your brand DNA ✦</Pill>

        <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl md:text-6xl">
          Turn your brand into a copy machine that writes high-converting ads,
          emails & offers in <Highlight>seconds</Highlight>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-white/60 sm:text-lg">
          Feed Copy King your brand once. Ten seconds later you&apos;re generating
          on-brand, conversion-ready copy for every channel — no agency, no blank
          page, no guesswork.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="w-full rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-600/30 transition-transform hover:scale-[1.03] sm:w-auto"
          >
            Start free
          </Link>
          <a
            href="#how"
            className="w-full rounded-full border border-white/15 px-8 py-3.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5 sm:w-auto"
          >
            See how it works
          </a>
        </div>

        {/* Video placeholder */}
        <div className="relative mx-auto mt-12 aspect-video w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent">
          <div className="absolute inset-0 grid place-items-center">
            <button className="flex items-center gap-2 rounded-full bg-black/60 px-5 py-2.5 text-sm font-medium text-white backdrop-blur">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-black">
                ▶
              </span>
              Watch the 90-second demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Marquee of copy types ───────────────────────────────────────────── */
const COPY_TYPES = [
  "Facebook Ads",
  "Email Sequences",
  "Landing Pages",
  "Hooks & Angles",
  "VSL Scripts",
  "Irresistible Offers",
  "Instagram Captions",
  "Cold DMs",
  "Sales Pages",
  "Headlines",
  "Ad Variations",
  "Story Sets",
];

function Marquee() {
  const row = [...COPY_TYPES, ...COPY_TYPES];
  return (
    <section className="border-y border-white/5 bg-[#0d0d13] py-16">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
          Say goodbye to the blank page, generic AI slop, and{" "}
          <span className="text-violet-400">$5k-a-month agencies.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/50">
          One brand profile powers every piece of copy your business will ever
          need — written in your voice, built to convert.
        </p>
      </div>

      <div className="ck-marquee mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="ck-marquee-track gap-3">
          {row.map((t, i) => (
            <span
              key={i}
              className="whitespace-nowrap rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/80"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="ck-marquee mt-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="ck-marquee-track reverse gap-3">
          {row.reverse().map((t, i) => (
            <span
              key={i}
              className="whitespace-nowrap rounded-xl border border-violet-500/20 bg-violet-500/[0.07] px-5 py-3 text-sm font-medium text-violet-200"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── A small fake product/UI mock used in feature splits ─────────────── */
function MockPanel({ accent = false }: { accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent
          ? "border-violet-500/30 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="mb-3 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
      </div>
      <div className="space-y-2.5">
        <div className="h-3 w-2/3 rounded bg-white/15" />
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-5/6 rounded bg-white/10" />
        <div className="mt-4 h-3 w-1/2 rounded bg-violet-400/40" />
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-4/5 rounded bg-white/10" />
        <div className="mt-5 inline-block rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-xs font-semibold text-white">
          Generate copy
        </div>
      </div>
    </div>
  );
}

function FeatureSplit({
  badge,
  title,
  body,
  reverse,
  accent,
}: {
  badge: string;
  title: React.ReactNode;
  body: string;
  reverse?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`grid items-center gap-10 md:grid-cols-2 ${
        reverse ? "md:[&>*:first-child]:order-2" : ""
      }`}
    >
      <div>
        <Pill>{badge}</Pill>
        <h3 className="mt-5 text-2xl font-extrabold text-white sm:text-3xl">
          {title}
        </h3>
        <p className="mt-4 text-base leading-relaxed text-white/60">{body}</p>
      </div>
      <MockPanel accent={accent} />
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="px-5 py-24">
      <div className="mx-auto max-w-5xl space-y-24">
        <FeatureSplit
          badge="Built-in conversion DNA"
          accent
          title={
            <>
              Write copy that actually converts — without learning copywriting.
            </>
          }
          body="Copy King is trained on proven direct-response frameworks and tuned to your exact brand, audience and offer. Every line comes out structured to grab attention, build desire, and drive the click — not just sound nice."
        />
        <FeatureSplit
          badge="Cut your cost-per-result"
          reverse
          title={<>Cut your cost-per-lead from the very first campaign.</>}
          body="Better hooks and sharper angles mean higher CTRs and lower CPAs. Spin up dozens of on-brand variations in minutes, test them all, and let the winners scale your spend instead of burning it."
        />
      </div>
    </section>
  );
}

/* ── Story / "why it's this good" ────────────────────────────────────── */
function Story() {
  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-[#0d0d13] px-5 py-24">
      <div className="ck-glow left-1/4 top-1/2 h-[300px] w-[400px] -translate-y-1/2" />
      <div className="relative mx-auto max-w-3xl text-center">
        <Pill>✦ Why the copy is this good ✦</Pill>
        <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold text-white sm:text-4xl">
          It learns your business like a obsessed strategist would.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/60">
          Before it writes a single word, Copy King builds a deep profile of your
          brand: who you sell to, what keeps them up at night, the exact offer,
          the objections, the proof. Then it maps that against battle-tested
          direct-response playbooks. The result reads like a senior copywriter who
          has studied your market for years — generated in seconds, on demand,
          for every channel.
        </p>
      </div>
    </section>
  );
}

/* ── Testimonials ────────────────────────────────────────────────────── */
const QUOTES = [
  {
    q: "We replaced a $4k/mo agency in week one. The ad copy is sharper and we ship 10x faster.",
    name: "Jordan M.",
    role: "DTC founder",
  },
  {
    q: "Plugged in our brand, generated 30 ad variations, and our best one cut CPL by a third.",
    name: "Priya S.",
    role: "Growth lead",
  },
  {
    q: "I'm not a copywriter and now I don't need to be. It writes in our voice better than I do.",
    name: "Marcus T.",
    role: "Coach & creator",
  },
  {
    q: "The offer builder alone paid for the whole thing. Everything finally sounds on-brand.",
    name: "Elena R.",
    role: "Agency owner",
  },
];

function Testimonials() {
  return (
    <section className="px-5 py-24">
      <div className="mx-auto max-w-5xl text-center">
        <Pill>✦ Trusted by operators who hate fluff ✦</Pill>
        <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold text-white sm:text-4xl">
          Real copy. Real results. <span className="text-violet-400">No fluff.</span>
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUOTES.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left"
            >
              <div className="mb-3 text-violet-400">★★★★★</div>
              <p className="text-sm leading-relaxed text-white/80">“{t.q}”</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold text-white">
                  {t.name[0]}
                </span>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-white/40">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Rising-cost chart ───────────────────────────────────────────────── */
const BARS = [
  { y: "2019", v: 35 },
  { y: "2020", v: 42 },
  { y: "2021", v: 55 },
  { y: "2022", v: 68 },
  { y: "2023", v: 82 },
  { y: "2024", v: 100 },
];

function CostChart() {
  return (
    <section className="border-y border-white/5 bg-[#0d0d13] px-5 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          The cost of paid traffic only goes{" "}
          <span className="text-violet-400">up.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/50">
          When clicks keep getting more expensive, the businesses that win are the
          ones squeezing the most out of every impression. That edge is the copy.
        </p>

        <div className="mt-12 rounded-2xl border border-white/10 bg-black/30 p-6 sm:p-10">
          <div className="flex h-56 items-end justify-between gap-3 sm:gap-6">
            {BARS.map((b) => (
              <div key={b.y} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-violet-700 to-violet-400"
                  style={{ height: `${b.v}%` }}
                />
                <span className="text-xs text-white/40">{b.y}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-white/30">
            Illustrative trend in average ad costs over time.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── Before / After ──────────────────────────────────────────────────── */
function BeforeAfter() {
  const before = [
    "Blank-page paralysis every campaign",
    "Generic AI copy that sounds like everyone else",
    "Weeks of back-and-forth with freelancers",
    "Flat CTRs and rising cost-per-result",
  ];
  const after = [
    "Dozens of on-brand variations in minutes",
    "Copy tuned to your exact audience & offer",
    "Ship today — no agency, no waiting",
    "Higher CTRs, lower CPAs, more scale",
  ];
  return (
    <section className="px-5 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <Pill>✦ Live results ✦</Pill>
        <h2 className="mt-6 text-3xl font-extrabold text-white sm:text-4xl">
          Before Copy King vs After Copy King
        </h2>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-7 text-left">
            <h3 className="mb-5 text-center text-lg font-bold text-red-300">
              Without Copy King
            </h3>
            <ul className="space-y-3">
              {before.map((t, i) => (
                <li key={i} className="flex gap-3 text-sm text-white/70">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-500/80 text-xs text-white">
                    ✕
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-green-500/25 bg-green-500/[0.05] p-7 text-left">
            <h3 className="mb-5 text-center text-lg font-bold text-green-300">
              With Copy King
            </h3>
            <ul className="space-y-3">
              {after.map((t, i) => (
                <li key={i} className="flex gap-3 text-sm text-white/80">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green-500/80 text-xs text-white">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Big alternating steps ───────────────────────────────────────────── */
const STEPS = [
  "You paste in a few details about your business.",
  "You pick what you want to write.",
  "Copy King writes it in your brand voice.",
  "You ship it across every channel.",
  "Your CTRs climb and your CPAs drop.",
  "You make more money.",
];

function Steps() {
  return (
    <section id="how" className="border-y border-white/5 bg-[#0d0d13] px-5 py-28">
      <div className="mx-auto max-w-3xl text-center">
        <Pill>✦ How it works ✦</Pill>
        <div className="mt-12 space-y-12">
          {STEPS.map((s, i) => (
            <p
              key={i}
              className={`text-2xl font-extrabold leading-snug sm:text-4xl ${
                i % 2 === 0 ? "text-white" : "text-violet-400"
              }`}
            >
              {s}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Old way vs new way ──────────────────────────────────────────────── */
function OldVsNew() {
  const old = [
    "Hire expensive copywriters and agencies",
    "Wait days or weeks for a first draft",
    "Settle for off-brand, generic copy",
    "Watch CTRs flatline and CPAs climb",
    "Fight the blank page on every launch",
    "Burn cash and waste time",
  ];
  const nw = [
    "Generate killer copy instantly from your brand DNA",
    "Go from idea to shippable copy in minutes",
    "Stay perfectly on-brand, every single time",
    "Slash CPAs and lift CTRs across channels",
    "Spin up endless winning variations on demand",
    "Record-breaking months and profit",
  ];
  return (
    <section className="px-5 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-extrabold text-white sm:text-4xl">
          The old way vs the{" "}
          <Highlight>Copy King way</Highlight>
        </h2>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="mb-5 text-center text-lg font-semibold text-white/70">
              The old way
            </h3>
            <div className="space-y-3">
              {old.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-white/80"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-red-500 text-xs text-white">
                    ✕
                  </span>
                  {t}
                </div>
              ))}
              <div className="rounded-xl bg-red-500 px-4 py-3 text-center text-sm font-bold text-white">
                🔥 Burned cash & wasted time
              </div>
            </div>
          </div>
          <div>
            <h3 className="mb-5 text-center text-lg font-semibold text-violet-300">
              The Copy King way
            </h3>
            <div className="space-y-3">
              {nw.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-green-500/25 bg-green-500/[0.07] px-4 py-3 text-sm text-white/90"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green-500 text-xs text-white">
                    ✓
                  </span>
                  {t}
                </div>
              ))}
              <div className="rounded-xl bg-green-500 px-4 py-3 text-center text-sm font-bold text-black">
                🤑 Record-breaking months & profit
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 3 numbered ROI cards ────────────────────────────────────────────── */
const WAYS = [
  "Copy King unlocks more scale and profit from paid ads by sharpening hooks and slashing CPAs.",
  "Copy King kills wasted spend on weak creative by generating proven, on-brand variations to test.",
  "Copy King ends ad fatigue forever — endless fresh angles and copy, generated the moment you need them.",
];

function ThreeWays() {
  return (
    <section className="border-y border-white/5 bg-[#0d0d13] px-5 py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-extrabold text-white sm:text-4xl">
          3 ways Copy King instantly lifts your{" "}
          <Highlight>ROI</Highlight>
        </h2>
        <div className="mt-12 space-y-4">
          {WAYS.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="text-base text-white/75">{w}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Guarantee ───────────────────────────────────────────────────────── */
function Guarantee() {
  return (
    <section className="px-5 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-center gap-4 text-5xl text-violet-400">
          <span className="-scale-x-100">🌿</span>
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            The love-it-or-it&apos;s-<Highlight>free</Highlight> guarantee
          </h2>
          <span>🌿</span>
        </div>
        <p className="text-base text-white/60">
          Use Copy King for 14 days. If it doesn&apos;t save you hours and produce
          copy you&apos;d actually ship, we&apos;ll refund every cent — no forms, no
          hoops, no hard feelings.
        </p>
      </div>
    </section>
  );
}

/* ── Banner ──────────────────────────────────────────────────────────── */
function Banner() {
  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-[#0d0d13] px-5 py-20 text-center">
      <div className="ck-glow left-1/2 top-1/2 h-[260px] w-[520px] -translate-x-1/2 -translate-y-1/2" />
      <h2 className="relative mx-auto max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
        Better hooks. Higher CTRs.{" "}
        <span className="text-violet-400">Higher conversions.</span> Lower CPAs.
        More revenue.
      </h2>
    </section>
  );
}

/* ── Tools / "10x better" feature cards ──────────────────────────────── */
const TOOLS = [
  {
    title: "Brand DNA Engine",
    desc: "Capture your brand voice, positioning, audience and offer once. Every generation pulls from it so the copy is always unmistakably yours.",
    points: ["Voice & tone profile", "Positioning & differentiators", "Reusable across every tool"],
    accent: false,
  },
  {
    title: "ICP Map",
    desc: "Build a deep, stalker-level picture of your ideal customer — their pains, desires, triggers and objections — to aim every word.",
    points: ["Audience pains & desires", "Buying triggers & objections", "Segments that convert"],
    accent: true,
  },
  {
    title: "Irresistible Offers",
    desc: "Stack value, anchor price, add guarantees and scarcity, and assemble offers people feel stupid saying no to.",
    points: ["Value-stacked ladders", "Guarantees & scarcity", "Offers that close"],
    accent: false,
  },
];

function Tools() {
  return (
    <section id="tools" className="px-5 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-extrabold text-white sm:text-4xl">
          Built to outwrite 99% of{" "}
          <Highlight>copywriters</Highlight>
        </h2>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {TOOLS.map((t) => (
            <div
              key={t.title}
              className={`rounded-2xl border p-7 ${
                t.accent
                  ? "border-violet-500/40 bg-gradient-to-b from-violet-600/25 to-fuchsia-600/5"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <h3 className="text-xl font-bold text-white">{t.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                {t.desc}
              </p>
              <ul className="mt-5 space-y-2.5">
                {t.points.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-2.5 text-sm text-white/75"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-violet-500/80 text-[10px] text-white">
                      ✓
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ─────────────────────────────────────────────────────────── */
const PLANS = [
  {
    name: "Starter",
    price: { m: "Free", y: "Free" },
    note: "7 days of limited access — perfect for kicking the tires.",
    cta: "Get started",
    popular: false,
    features: [
      "Brand DNA (1 brand)",
      "10 generations / day",
      "Core ad & headline tools",
      "Markdown & HTML export",
    ],
  },
  {
    name: "Pro",
    price: { m: "$79", y: "$55" },
    note: "Best for founders and creators running their own copy.",
    cta: "Get started",
    popular: true,
    features: [
      "Everything in Starter",
      "Unlimited generations",
      "ICP Map + Irresistible Offers",
      "All 20+ generators",
      "Priority model speed",
    ],
  },
  {
    name: "Agency",
    price: { m: "$299", y: "$209" },
    note: "For agencies and teams running many brands & accounts.",
    cta: "Get started",
    popular: false,
    features: [
      "Everything in Pro",
      "Up to 25 brand profiles",
      "Team seats & sharing",
      "Bulk variation generation",
      "Dedicated support",
    ],
  },
];

function Pricing() {
  const [yearly, setYearly] = useState(true);
  return (
    <section id="pricing" className="border-y border-white/5 bg-[#0d0d13] px-5 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <Pill>🔥 Special launch pricing 🔥</Pill>
          <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold text-white sm:text-4xl">
            Start writing high-converting copy in{" "}
            <Highlight>seconds</Highlight>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/50">
            Every paid plan unlocks full access to the platform. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="mt-7 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1">
            <button
              onClick={() => setYearly(false)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                !yearly ? "bg-white/10 text-white" : "text-white/50"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                yearly
                  ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white"
                  : "text-white/50"
              }`}
            >
              Yearly · save 30%
            </button>
          </div>
        </div>

        <div className="mt-12 grid items-start gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-7 ${
                p.popular
                  ? "border-violet-500/50 bg-gradient-to-b from-violet-600/25 to-fuchsia-600/5"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-bold text-black">
                  🔥 Most popular 🔥
                </span>
              )}
              <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-300">
                {p.name}
              </h3>
              <div className="mt-2 flex items-end gap-1.5">
                <span className="text-4xl font-extrabold text-white">
                  {yearly ? p.price.y : p.price.m}
                </span>
                {p.price.m !== "Free" && (
                  <span className="pb-1 text-sm text-white/40">/ month</span>
                )}
              </div>
              <p className="mt-3 text-sm text-white/55">{p.note}</p>
              <Link
                href="/login"
                className={`mt-6 block rounded-full px-5 py-3 text-center text-sm font-semibold transition-transform hover:scale-[1.02] ${
                  p.popular
                    ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white"
                    : "border border-white/15 text-white"
                }`}
              >
                {p.cta}
              </Link>
              <ul className="mt-7 space-y-3">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-white/75"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-500/80 text-[10px] text-white">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-white/30">
          * Prices in USD. Yearly plans billed annually.
        </p>
      </div>
    </section>
  );
}

/* ── FAQ ─────────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "What exactly is Copy King?",
    a: "Copy King is an AI direct-response copywriting platform. You build a profile of your brand, audience and offer once, then generate on-brand, conversion-ready copy for ads, emails, landing pages, offers and more — in seconds.",
  },
  {
    q: "Do I need to know copywriting?",
    a: "No. Copy King is trained on proven direct-response frameworks, so the structure and persuasion are built in. You bring the brand details; it handles the craft.",
  },
  {
    q: "Will the copy actually sound like my brand?",
    a: "Yes. Every generation pulls from your Brand DNA — voice, tone, positioning and audience — so the output reads like you, not like generic AI.",
  },
  {
    q: "Is my data safe?",
    a: "Your brand data is private to your account and used only to generate your copy. We never sell it or train public models on it.",
  },
  {
    q: "What can I generate?",
    a: "Facebook & Meta ads, headlines, email sequences, landing and sales pages, Instagram captions and stories, irresistible offers, ICP maps, and 20+ more generators — all from one brand profile.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Plans are month-to-month (or yearly if you want the discount), and you can cancel in a couple of clicks. Plus you're covered by our 14-day guarantee.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="px-5 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <Pill>✦ Copy King ✦</Pill>
          <h2 className="mt-6 text-3xl font-extrabold text-white sm:text-4xl">
            Frequently asked{" "}
            <Highlight>questions</Highlight>
          </h2>
        </div>
        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-semibold text-white">{f.q}</span>
                <span className="text-xl text-violet-400">
                  {open === i ? "−" : "+"}
                </span>
              </button>
              {open === i && (
                <p className="px-6 pb-5 text-sm leading-relaxed text-white/60">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ───────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-[#0d0d13] px-5 py-28 text-center">
      <div className="ck-glow left-1/2 top-1/2 h-[300px] w-[560px] -translate-x-1/2 -translate-y-1/2" />
      <div className="relative mx-auto max-w-2xl">
        <Pill>🔥 What are you waiting for? 🔥</Pill>
        <h2 className="mt-6 text-4xl font-extrabold text-white sm:text-5xl">
          Seriously, <Highlight>let&apos;s go</Highlight>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base text-white/60">
          Stop fighting the blank page. Build your brand once and let Copy King
          write the copy that grows it.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-10 py-4 text-base font-semibold text-white shadow-xl shadow-violet-600/30 transition-transform hover:scale-[1.03]"
        >
          Start free
        </Link>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-[#0a0a0f] px-5 py-14 text-center">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-black text-white">
            CK
          </span>
          <span className="text-lg font-extrabold tracking-tight text-white">
            COPY KING
          </span>
        </div>
        <div className="mt-6 flex items-center justify-center gap-5 text-white/50">
          <a href="#" aria-label="Twitter" className="hover:text-white">
            𝕏
          </a>
          <a href="#" aria-label="LinkedIn" className="hover:text-white">
            in
          </a>
          <a href="#" aria-label="Instagram" className="hover:text-white">
            ◎
          </a>
        </div>
        <p className="mt-6 text-sm text-white/40">
          Copyright © Copy King {new Date().getFullYear()}. All rights reserved.
        </p>
        <div className="mt-3 flex items-center justify-center gap-4 text-sm text-white/50">
          <a href="#" className="hover:text-white">
            Support
          </a>
          <span className="text-white/20">|</span>
          <a href="#" className="hover:text-white">
            Terms of Service
          </a>
          <span className="text-white/20">|</span>
          <a href="#" className="hover:text-white">
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" style={{ ["--ck-violet" as string]: VIOLET }}>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Features />
        <Story />
        <Testimonials />
        <CostChart />
        <BeforeAfter />
        <Steps />
        <OldVsNew />
        <ThreeWays />
        <Guarantee />
        <Banner />
        <Tools />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
