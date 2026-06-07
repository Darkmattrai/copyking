"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useState } from "react";

import { PillarIcon } from "@/components/brand/pillar-icon";
import { useUIStore } from "@/lib/ui/store";
import { useBrandStore } from "@/lib/brand/store";
import { getPillarCompletion } from "@/lib/brand/utils";
import { PILLAR_META } from "@/types/brand";
import { GENERATORS, GENERATOR_CATEGORIES } from "@/lib/generators/registry";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/lib/auth/use-role";
import { CLIENT_GENERATOR_SLUGS } from "@/lib/auth/roles";

function getGeneratorNavLabel(name: string) {
  return name
    .replace(" Generator", "")
    .replace(" Script & Funnel", " VSL Funnel")
    .replace("High Ticket Application Funnel", "High Ticket App")
    .replace("Irresistible Offer Builder", "Offer Builder");
}

function SectionLabel({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="pt-4 pb-1 px-2">
      <span className="text-[10px] font-medium uppercase tracking-widest text-text-tertiary flex items-center gap-1.5">
        <PillarIcon className="w-3 h-3" icon={icon} />
        {label}
      </span>
    </div>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const { brandDNA } = useBrandStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const role = useRole();
  const isClient = role === "client";
  const collapsed = sidebarCollapsed;
  const groupedGenerators = GENERATOR_CATEGORIES.map((category) => ({
    ...category,
    items: GENERATORS.filter((generator) => generator.category === category.key),
  })).filter((group) => group.items.length > 0);

  const clientTools = GENERATORS.filter((g) =>
    (CLIENT_GENERATOR_SLUGS as readonly string[]).includes(g.slug),
  );
  const [openGeneratorGroups, setOpenGeneratorGroups] = useState<Record<string, boolean>>({});
  const [pillarsExpanded, setPillarsExpanded] = useState(false);

  function toggleGeneratorGroup(key: string) {
    setOpenGeneratorGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 shrink-0 border-b border-border">
        <span className="h-7 w-7 shrink-0 rounded-lg bg-accent flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              animate={{ opacity: 1, width: "auto" }}
              className="text-sm font-semibold text-text-primary tracking-tight overflow-hidden whitespace-nowrap"
              exit={{ opacity: 0, width: 0 }}
              initial={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
            >
              CopyKing
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Client nav: only the two Foundation tools */}
      {isClient ? (
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {!collapsed && <SectionLabel icon="target" label="Your Tools" />}
          {collapsed && <div className="pt-2" />}
          {clientTools.map((generator) => (
            <NavItem
              key={generator.slug}
              collapsed={collapsed}
              href={`/generate/${generator.slug}`}
              icon={<PillarIcon className="w-[18px] h-[18px]" icon={generator.icon} />}
              isActive={pathname === `/generate/${generator.slug}`}
              label={getGeneratorNavLabel(generator.name)}
            />
          ))}
        </nav>
      ) : (
      /* Admin nav: full access */
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        <NavItem
          collapsed={collapsed}
          href="/brand"
          icon={
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          isActive={pathname === "/brand"}
          label="Overview"
        />

        {!collapsed && (
          <SectionLabel icon="sparkles" label="Generators" />
        )}
        {collapsed && <div className="pt-2" />}

        <NavItem
          collapsed={collapsed}
          href="/generate"
          icon={<PillarIcon className="w-[18px] h-[18px]" icon="sparkles" />}
          isActive={pathname === "/generate"}
          label="All Generators"
        />

        {!collapsed && groupedGenerators.map((group) => (
          <div key={group.key} className="mt-1">
            <button
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1 text-[11px] text-text-tertiary hover:text-text-secondary transition-colors"
              onClick={() => toggleGeneratorGroup(group.key)}
              type="button"
            >
              <span className="flex items-center gap-1.5">
                <PillarIcon className="w-3.5 h-3.5" icon={group.icon} />
                <span className="uppercase tracking-wide">{group.label}</span>
              </span>
              <svg
                className={clsx(
                  "w-3.5 h-3.5 transition-transform duration-200",
                  openGeneratorGroups[group.key] && "rotate-90",
                )}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <AnimatePresence initial={false}>
              {openGeneratorGroups[group.key] && (
                <motion.div
                  animate={{ height: "auto", opacity: 1 }}
                  className="overflow-hidden"
                  exit={{ height: 0, opacity: 0 }}
                  initial={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {group.items.map((generator) => (
                    <NavItem
                      key={generator.slug}
                      collapsed={collapsed}
                      href={`/generate/${generator.slug}`}
                      icon={<PillarIcon className="w-[16px] h-[16px]" icon={generator.icon} />}
                      isActive={pathname === `/generate/${generator.slug}`}
                      label={getGeneratorNavLabel(generator.name)}
                      compact
                      nested
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {!collapsed && (
          <SectionLabel icon="book" label="Brand DNA" />
        )}
        {collapsed && <div className="pt-2" />}

        {!collapsed && (
          <button
            className="w-full flex items-center justify-between gap-2 px-2.5 py-1 text-[11px] text-text-tertiary hover:text-text-secondary transition-colors"
            onClick={() => setPillarsExpanded((prev) => !prev)}
            type="button"
          >
            <span className="flex items-center gap-1.5 uppercase tracking-wide">
              <PillarIcon className="w-3.5 h-3.5" icon="target" />
              Pillars
            </span>
            <svg
              className={clsx("w-3.5 h-3.5 transition-transform duration-200", pillarsExpanded && "rotate-90")}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {!collapsed && (
          <AnimatePresence initial={false}>
            {pillarsExpanded && (
              <motion.div
                animate={{ height: "auto", opacity: 1 }}
                className="overflow-hidden"
                exit={{ height: 0, opacity: 0 }}
                initial={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {PILLAR_META.map((meta) => {
                  const href = `/brand/deepen/${meta.key}`;
                  const completion = getPillarCompletion(brandDNA, meta.key);
                  return (
                    <NavItem
                      key={meta.key}
                      collapsed={collapsed}
                      href={href}
                      icon={<PillarIcon className="w-[16px] h-[16px]" icon={meta.icon} />}
                      isActive={pathname === href}
                      label={meta.shortLabel}
                      trailing={
                        <span
                          className={clsx(
                            "w-1.5 h-1.5 rounded-full",
                            completion >= 80
                              ? "bg-success"
                              : completion >= 40
                                ? "bg-warning"
                                : "bg-border-hover",
                          )}
                        />
                      }
                      compact
                      nested
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {!collapsed && (
          <SectionLabel icon="mic" label="Discovery" />
        )}
        {collapsed && <div className="pt-2" />}

        <NavItem
          collapsed={collapsed}
          href="/onboarding"
          icon={<PillarIcon className="w-[18px] h-[18px]" icon="sparkles" />}
          isActive={pathname.startsWith("/onboarding")}
          label="Discover"
        />

        {!collapsed && <SectionLabel icon="target" label="Admin" />}
        {collapsed && <div className="pt-2" />}

        <NavItem
          collapsed={collapsed}
          href="/admin"
          icon={
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          isActive={pathname.startsWith("/admin")}
          label="Clients"
        />
      </nav>
      )}

      {/* Bottom actions */}
      <div className="shrink-0 border-t border-border p-2 space-y-1">
        <LogoutButton collapsed={collapsed} />
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={clsx(
            "w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors",
            collapsed && "justify-center",
          )}
          onClick={toggleSidebar}
        >
          <svg
            className={clsx("w-[18px] h-[18px] transition-transform", collapsed && "rotate-180")}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                animate={{ opacity: 1 }}
                className="text-xs overflow-hidden whitespace-nowrap"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}

function LogoutButton({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      aria-label="Sign out"
      className={clsx(
        "w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-text-tertiary hover:text-danger hover:bg-surface-hover transition-colors",
        collapsed && "justify-center",
      )}
      onClick={handleLogout}
      title={collapsed ? "Sign out" : undefined}
    >
      <svg
        className="w-[18px] h-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            animate={{ opacity: 1 }}
            className="text-xs overflow-hidden whitespace-nowrap"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            Sign out
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function NavItem({
  href,
  icon,
  label,
  isActive,
  collapsed,
  trailing,
  compact = false,
  nested = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  trailing?: React.ReactNode;
  compact?: boolean;
  nested?: boolean;
}) {
  return (
    <NextLink
      className={clsx(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
        compact && "text-[12.5px] py-1.5",
        nested && "ml-3",
        collapsed && "justify-center",
        isActive
          ? "bg-surface-hover text-text-primary font-medium"
          : "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
      )}
      href={href}
      title={collapsed ? label : undefined}
    >
      <span className="shrink-0">{icon}</span>
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            animate={{ opacity: 1, width: "auto" }}
            className="flex-1 overflow-hidden whitespace-nowrap"
            exit={{ opacity: 0, width: 0 }}
            initial={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      {!collapsed && trailing && (
        <span className="shrink-0 ml-auto">{trailing}</span>
      )}
    </NextLink>
  );
}

export function AppSidebar() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        className="hidden md:flex flex-col shrink-0 border-r border-border bg-background h-full overflow-hidden"
        initial={false}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile overlay */}
      <MobileSidebar />
    </>
  );
}

function MobileSidebar() {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

  return (
    <AnimatePresence>
      {mobileSidebarOpen && (
        <>
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
          />
          <motion.aside
            animate={{ x: 0 }}
            className="fixed inset-y-0 left-0 z-50 w-[240px] bg-background border-r border-border md:hidden"
            exit={{ x: -240 }}
            initial={{ x: -240 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <SidebarContent />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
