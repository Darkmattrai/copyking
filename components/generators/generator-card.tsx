"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { PillarIcon } from "@/components/brand/pillar-icon";
import type { GeneratorDef } from "@/lib/generators/types";

interface GeneratorCardProps {
  generator: GeneratorDef;
  index: number;
}

export function GeneratorCard({ generator, index }: GeneratorCardProps) {
  const hasParams = generator.params && generator.params.length > 0;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
    >
      <Link href={`/generate/${generator.slug}`}>
        <div className="ck-card group relative p-6 cursor-pointer h-full">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center text-accent">
              <PillarIcon className="w-5 h-5" icon={generator.icon} />
            </div>
            {hasParams && (
              <span className="ck-badge bg-surface-hover text-text-tertiary">
                {generator.params!.length} input{generator.params!.length > 1 ? "s" : ""}
              </span>
            )}
            {!hasParams && (
              <span className="ck-badge bg-accent/10 text-accent">
                1-click
              </span>
            )}
          </div>

          <h3 className="font-semibold text-sm text-text-primary mb-1">
            {generator.name}
          </h3>
          <p className="text-xs text-text-tertiary leading-relaxed">
            {generator.description}
          </p>

          <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ring-1 ring-accent/30" />
        </div>
      </Link>
    </motion.div>
  );
}
