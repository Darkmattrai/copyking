"use client";

import { useEffect, useState } from "react";

export interface PreviewLink {
  title: string;
}

export interface PreviewHighlight {
  name: string;
  letter: string;
  color: string;
}

export interface PreviewPinnedPost {
  label: string;
  role: string;
}

interface InstagramPreviewProps {
  nameField: string;
  bioText: string;
  username?: string;
  onUsernameChange?: (value: string) => void;
  category?: string;
  links?: PreviewLink[];
  actionButtons?: string[];
  highlights?: PreviewHighlight[];
  pinnedPosts?: PreviewPinnedPost[];
  compact?: boolean;
  // Live-profile data (when Instagram is connected). When absent, the preview
  // uses placeholders + random-looking counts.
  profileImageUrl?: string | null;
  posts?: string;
  followers?: string;
  following?: string;
}

// Default highlight covers shown when no real highlights are supplied.
const DEFAULT_HIGHLIGHTS: PreviewHighlight[] = [
  { name: "Start Here", letter: "S", color: "#A855F7" },
  { name: "How I Help", letter: "H", color: "#3B82F6" },
  { name: "Results", letter: "R", color: "#10B981" },
  { name: "Free Stuff", letter: "F", color: "#F59E0B" },
];

function fmtCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

const ROLE_TONES: Record<string, string> = {
  "my story": "bg-gradient-to-br from-purple-500/30 to-pink-500/30",
  "how to start with me": "bg-gradient-to-br from-blue-500/30 to-cyan-500/30",
  "proof": "bg-gradient-to-br from-emerald-500/30 to-teal-500/30",
  "results": "bg-gradient-to-br from-emerald-500/30 to-teal-500/30",
  "testimonials": "bg-gradient-to-br from-emerald-500/30 to-teal-500/30",
  "lead magnet": "bg-gradient-to-br from-amber-500/30 to-orange-500/30",
  "awareness": "bg-gradient-to-br from-purple-500/30 to-pink-500/30",
  "consideration": "bg-gradient-to-br from-blue-500/30 to-cyan-500/30",
  "conversion": "bg-gradient-to-br from-emerald-500/30 to-teal-500/30",
};

export function InstagramPreview({
  nameField,
  bioText,
  username = "yourusername",
  onUsernameChange,
  category,
  links = [],
  highlights = [],
  pinnedPosts = [],
  compact = false,
  profileImageUrl,
  posts,
  followers,
  following,
}: InstagramPreviewProps) {
  const [isDark, setIsDark] = useState(false);
  const [stats, setStats] = useState({ posts: "—", followers: "—", following: "—" });
  const [editingStat, setEditingStat] = useState<string | null>(null);

  // Counts: live data when connected, otherwise random-looking (client only, to
  // avoid a hydration mismatch from Math.random during SSR).
  useEffect(() => {
    if (posts || followers || following) {
      setStats({ posts: posts ?? "0", followers: followers ?? "0", following: following ?? "0" });
    } else {
      setStats({
        posts: fmtCount(40 + Math.floor(Math.random() * 220)),
        followers: fmtCount(900 + Math.floor(Math.random() * 9000)),
        following: fmtCount(120 + Math.floor(Math.random() * 700)),
      });
    }
  }, [posts, followers, following]);

  const bioLines = bioText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Show only ONE link in the mockup.
  const visibleLinks = links.slice(0, 1);
  const visibleHighlights = (highlights.length > 0 ? highlights : DEFAULT_HIGHLIGHTS).slice(0, 7);
  const visiblePinned = pinnedPosts.slice(0, 3);

  // Dark mode color overrides
  const bg = isDark ? "bg-black" : "bg-background";
  const text = isDark ? "text-white" : "text-text-primary";
  const textSecondary = isDark ? "text-gray-300" : "text-text-secondary";
  const textTertiary = isDark ? "text-gray-500" : "text-text-tertiary";
  const border = isDark ? "border-gray-800" : "border-border";
  const surface = isDark ? "bg-gray-900" : "bg-surface";
  const surfaceHover = isDark ? "bg-gray-800" : "bg-surface-hover";

  function handleStatClick(key: string) {
    setEditingStat(key);
  }

  function handleStatChange(key: string, value: string) {
    setStats((prev) => ({ ...prev, [key]: value }));
  }

  function StatCell({ label, statKey }: { label: string; statKey: string }) {
    const isEditing = editingStat === statKey;
    return (
      <div className="text-center cursor-pointer" onClick={() => handleStatClick(statKey)}>
        {isEditing ? (
          <input
            type="text"
            value={stats[statKey as keyof typeof stats]}
            onChange={(e) => handleStatChange(statKey, e.target.value)}
            onBlur={() => setEditingStat(null)}
            onKeyDown={(e) => e.key === "Enter" && setEditingStat(null)}
            autoFocus
            className={`block w-12 mx-auto text-sm font-bold text-center ${text} bg-transparent border-b ${border} outline-none`}
          />
        ) : (
          <span className={`block text-sm font-bold ${text}`}>
            {stats[statKey as keyof typeof stats]}
          </span>
        )}
        <span className={`block text-[10px] ${textTertiary}`}>{label}</span>
      </div>
    );
  }

  return (
    <div className={`w-full ${compact ? "max-w-[280px]" : "max-w-[320px]"} mx-auto`}>
      {/* Dark/light toggle */}
      <div className="flex items-center justify-end gap-1.5 mb-2">
        <button
          onClick={() => setIsDark(false)}
          className={`p-1.5 rounded-lg transition-all ${!isDark ? "bg-accent/10 text-accent" : "text-text-tertiary hover:text-text-secondary"}`}
          title="Light mode"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        </button>
        <button
          onClick={() => setIsDark(true)}
          className={`p-1.5 rounded-lg transition-all ${isDark ? "bg-accent/10 text-accent" : "text-text-tertiary hover:text-text-secondary"}`}
          title="Dark mode"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        </button>
      </div>

      {/* Phone frame */}
      <div className={`rounded-[2rem] border-2 ${border} ${bg} overflow-hidden shadow-lg transition-colors duration-300`}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1">
          <span className={`text-[11px] font-semibold ${text}`}>9:41</span>
          <div className="flex items-center gap-1">
            <svg className={`w-3.5 h-3.5 ${text}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 18c3.31 0 6-2.69 6-6s-2.69-6-6-6-6 2.69-6 6 2.69 6 6 6zm0-10c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z" /><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z" /></svg>
            <svg className={`w-4 h-4 ${text}`} fill="currentColor" viewBox="0 0 24 24"><rect x="2" y="6" width="3" height="12" rx="0.5" /><rect x="7" y="4" width="3" height="14" rx="0.5" /><rect x="12" y="2" width="3" height="16" rx="0.5" /><rect x="17" y="0" width="3" height="18" rx="0.5" /></svg>
            <div className={`w-6 h-3 rounded-sm border ${isDark ? "border-gray-600" : "border-text-primary/50"} relative ml-0.5`}>
              <div className={`absolute inset-0.5 rounded-[1px] ${isDark ? "bg-white/80" : "bg-text-primary/80"}`} style={{ width: "70%" }} />
            </div>
          </div>
        </div>

        {/* Instagram header */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${border}`}>
          <div className="flex items-center gap-1">
            <svg className={`w-3 h-3 ${text}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            {onUsernameChange ? (
              <input
                type="text"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                className={`text-sm font-semibold ${text} bg-transparent border-none outline-none w-full min-w-0 focus:ring-0 p-0`}
                placeholder="yourusername"
              />
            ) : (
              <span className={`text-sm font-semibold ${text}`}>{username}</span>
            )}
          </div>
          <svg className={`w-5 h-5 ${text}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
        </div>

        {/* Profile section */}
        <div className="px-4 pt-4 pb-3">
          {/* Avatar + stats row */}
          <div className="flex items-center gap-5 mb-3">
            {profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileImageUrl} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </div>
            )}
            <div className="flex-1 flex justify-around text-center">
              <StatCell label="Posts" statKey="posts" />
              <StatCell label="Followers" statKey="followers" />
              <StatCell label="Following" statKey="following" />
            </div>
          </div>

          {/* Name field */}
          <p className={`text-[13px] font-semibold ${text} leading-snug mb-0.5`}>
            {nameField || "Your Name | Keyword"}
          </p>

          {/* Category */}
          {category && (
            <p className={`text-[11px] ${textTertiary} leading-snug mb-1`}>
              {category}
            </p>
          )}

          {/* Bio text — full bio, no truncation */}
          <div className={`text-[13px] ${textSecondary} leading-snug mb-2 min-h-[3rem]`}>
            {bioLines.length > 0 ? (
              bioLines.map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))
            ) : (
              <span className={`${textTertiary} italic`}>Your bio will appear here...</span>
            )}
          </div>

          {/* Native multi-link button */}
          {visibleLinks.length > 0 && (
            <div className="mb-3">
              <button className={`w-full text-left px-2.5 py-1.5 rounded-lg border ${border} ${surface} flex items-center justify-between`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <svg className={`w-3 h-3 ${text} shrink-0`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.51a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374" />
                  </svg>
                  <span className={`text-[11px] font-medium ${text} truncate`}>
                    {visibleLinks[0].title}
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Default action buttons */}
          <div className="flex gap-1.5 mb-3">
            <button className="flex-1 py-1.5 rounded-lg bg-accent text-white text-[11px] font-semibold text-center">
              Follow
            </button>
            <button className={`flex-1 py-1.5 rounded-lg ${surfaceHover} border ${border} ${text} text-[11px] font-semibold text-center`}>
              Message
            </button>
            <button className={`py-1.5 px-2.5 rounded-lg ${surfaceHover} border ${border} ${text}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>

          {/* Highlights row */}
          {visibleHighlights.length > 0 && (
            <div className="mb-3 -mx-1">
              <div className="flex gap-2.5 px-1 overflow-x-auto pb-1 scrollbar-none">
                {visibleHighlights.map((h, i) => (
                  <div key={i} className="flex flex-col items-center shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full p-[2px] border ${border}`}
                      style={{ background: `linear-gradient(135deg, ${h.color}, ${h.color}aa)` }}
                    >
                      <div className={`w-full h-full rounded-full ${bg} flex items-center justify-center`}>
                        <span className="text-sm font-bold" style={{ color: h.color }}>
                          {h.letter}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] ${textSecondary} mt-1 max-w-[3.25rem] truncate`}>
                      {h.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid: pinned posts first, then placeholders */}
          <div className={`border-t ${border} pt-2`}>
            <div className="grid grid-cols-3 gap-0.5">
              {visiblePinned.map((p, i) => (
                <div
                  key={`pin-${i}`}
                  className={`relative aspect-square rounded-sm overflow-hidden flex items-center justify-center text-center px-1 ${
                    ROLE_TONES[p.role.toLowerCase()] ??
                    Object.entries(ROLE_TONES).find(([k]) => p.role.toLowerCase().includes(k))?.[1] ??
                    surfaceHover
                  }`}
                >
                  <svg className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 9V4l1-1V2H7v1l1 1v5L5 11.5V13h6v8l1 1 1-1v-8h6v-1.5L16 9z" />
                  </svg>
                  <span className={`text-[9px] font-semibold ${text} leading-tight px-0.5`}>
                    {p.label}
                  </span>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 6 - visiblePinned.length) }).map(
                (_, i) => (
                  <div key={`ph-${i}`} className={`aspect-square ${surfaceHover} rounded-sm`} />
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
