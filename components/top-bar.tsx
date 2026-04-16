"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { useUIStore } from "@/lib/ui/store";
import { useBrandStore } from "@/lib/brand/store";
import { PILLAR_META } from "@/types/brand";

function getBreadcrumb(pathname: string): { segments: { label: string; href?: string }[] } {
  if (pathname === "/brand") {
    return { segments: [{ label: "Brand DNA" }] };
  }

  const deepenMatch = pathname.match(/^\/brand\/deepen\/(.+)$/);
  if (deepenMatch) {
    const pillarKey = deepenMatch[1];
    const meta = PILLAR_META.find((m) => m.key === pillarKey);
    return {
      segments: [
        { label: "Brand DNA", href: "/brand" },
        { label: meta?.label || pillarKey },
      ],
    };
  }

  if (pathname.startsWith("/onboarding/deepen/")) {
    const pillarKey = pathname.split("/").pop() || "";
    const meta = PILLAR_META.find((m) => m.key === pillarKey);
    return {
      segments: [
        { label: "Discovery", href: "/onboarding" },
        { label: meta?.label || "Deepen" },
      ],
    };
  }

  if (pathname === "/onboarding/deepen") {
    return {
      segments: [
        { label: "Discovery", href: "/onboarding" },
        { label: "Pillars" },
      ],
    };
  }

  if (pathname === "/onboarding/reveal") {
    return {
      segments: [
        { label: "Discovery", href: "/onboarding" },
        { label: "Reveal" },
      ],
    };
  }

  if (pathname.startsWith("/onboarding")) {
    return { segments: [{ label: "Discovery" }] };
  }

  return { segments: [{ label: "CopyKing" }] };
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      aria-label="Toggle theme"
      className="w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function SyncStatus() {
  const { isSyncing, lastSyncedAt, syncError } = useBrandStore();

  if (syncError) {
    return (
      <span className="w-2 h-2 rounded-full bg-danger" title="Sync error" />
    );
  }

  if (isSyncing) {
    return (
      <span className="w-2 h-2 rounded-full bg-warning animate-pulse" title="Syncing..." />
    );
  }

  if (lastSyncedAt) {
    return (
      <span className="w-2 h-2 rounded-full bg-success" title="Synced" />
    );
  }

  return null;
}

export function TopBar() {
  const pathname = usePathname();
  const { setMobileSidebarOpen } = useUIStore();
  const { segments } = getBreadcrumb(pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-12 px-6 border-b border-border bg-background/80 backdrop-blur-lg shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          aria-label="Open menu"
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm">
          {segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <svg className="w-3.5 h-3.5 text-text-tertiary" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {seg.href ? (
                <a className="text-text-tertiary hover:text-text-secondary transition-colors" href={seg.href}>
                  {seg.label}
                </a>
              ) : (
                <span className="text-text-primary font-medium">{seg.label}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SyncStatus />
        <ThemeToggle />
      </div>
    </header>
  );
}
