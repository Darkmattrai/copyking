"use client";

import { useParams } from "next/navigation";

import { PillarChat } from "@/components/brand/pillar-chat";
import { PILLAR_KEYS, type PillarKey } from "@/types/brand";

export default function AppPillarDeepenPage() {
  const params = useParams();
  const pillar = params.pillar as string;

  if (!PILLAR_KEYS.includes(pillar as PillarKey)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-secondary">Pillar not found</p>
      </div>
    );
  }

  return <PillarChat pillarKey={pillar as PillarKey} returnTo="/brand" />;
}
