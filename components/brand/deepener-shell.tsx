"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { PillarIcon } from "./pillar-icon";
import type { PillarMeta } from "@/types/brand";

interface DeepenerShellProps {
  meta: PillarMeta;
  children: React.ReactNode;
}

export function DeepenerShell({ meta, children }: DeepenerShellProps) {
  const router = useRouter();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: -10 }}
        >
          <button
            aria-label="Back to pillars"
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors mb-6 flex items-center gap-1"
            onClick={() => router.push("/onboarding/deepen")}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M15 19l-7-7 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to pillars
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center text-accent">
              <PillarIcon className="w-5 h-5" icon={meta.icon} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{meta.label}</h1>
              <p className="text-xs text-text-tertiary">{meta.description}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
