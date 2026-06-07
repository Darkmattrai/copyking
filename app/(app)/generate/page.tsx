"use client";

import { motion } from "framer-motion";

import { GeneratorCard } from "@/components/generators/generator-card";
import { PillarIcon } from "@/components/brand/pillar-icon";
import {
  getGeneratorsByCategory,
  GENERATOR_CATEGORIES,
} from "@/lib/generators/registry";
import { useRole } from "@/lib/auth/use-role";
import { CLIENT_GENERATOR_SLUGS } from "@/lib/auth/roles";

export default function GenerateHubPage() {
  const role = useRole();
  const isClient = role === "client";
  const grouped = getGeneratorsByCategory();
  let globalIndex = 0;

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center text-accent">
            <PillarIcon className="w-4.5 h-4.5" icon="sparkles" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Content Generators
          </h1>
        </div>
        <p className="text-sm text-text-tertiary">
          Generate world-class copy powered by your Brand DNA. Each generator
          uses proven copywriting frameworks tailored to your brand.
        </p>
      </motion.div>

      {GENERATOR_CATEGORIES.map((category) => {
        const generators = grouped[category.key];
        if (!generators?.length) return null;

        return (
          <section key={category.key} className="mb-10">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-accent-muted flex items-center justify-center text-accent">
                <PillarIcon className="w-4 h-4" icon={category.icon} />
              </div>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                {category.label}
              </h2>
              <span className="text-xs text-text-tertiary">
                {generators.length} generator{generators.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {generators.map((gen) => {
                const idx = globalIndex++;
                const locked =
                  isClient &&
                  !(CLIENT_GENERATOR_SLUGS as readonly string[]).includes(
                    gen.slug,
                  );
                return (
                  <GeneratorCard
                    key={gen.slug}
                    generator={gen}
                    index={idx}
                    locked={locked}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
