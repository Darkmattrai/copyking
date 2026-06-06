"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { DeepenerShell } from "../deepener-shell";
import { AutosaveIndicator } from "../autosave-indicator";
import { useBrandStore } from "@/lib/brand/store";
import { useAutosave } from "@/lib/hooks/use-autosave";
import { PILLAR_META } from "@/types/brand";
import type { Messaging } from "@/types/brand";

export function MessagingGenerator() {
  const meta = PILLAR_META[6];
  const { brandDNA, updatePillar } = useBrandStore();
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const msg = brandDNA.messaging;

  const [oneLiner, setOneLiner] = useState(msg.oneLiner);
  const [tagline, setTagline] = useState(msg.tagline);
  const [keyMessages, setKeyMessages] = useState(msg.keyMessages.join("\n"));
  const [brandScript, setBrandScript] = useState(msg.brandScript);

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/brand/generate-messaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandDNA }),
      });

      const data: Messaging = await res.json();

      setOneLiner(data.oneLiner);
      setTagline(data.tagline);
      setKeyMessages(data.keyMessages.join("\n"));
      setBrandScript(data.brandScript);
      setGenerated(true);
      toast.success("Messaging generated");
    } catch {
      toast.error("Failed to generate messaging");
    } finally {
      setLoading(false);
    }
  };

  const payload = {
    oneLiner,
    tagline,
    keyMessages: keyMessages.split("\n").filter(Boolean),
    brandScript,
  };

  const status = useAutosave(payload, (p) => updatePillar("messaging", p));

  const handleSave = () => {
    updatePillar("messaging", payload);
    toast.success("Messaging saved");
  };

  return (
    <DeepenerShell meta={meta}>
      <div className="space-y-6">
        {!generated && !oneLiner && (
          <div className="border border-dashed border-border-hover rounded-lg p-8 text-center">
            <p className="text-text-secondary text-sm mb-4">
              This pillar is AI-generated from your other brand pillars. The
              more you&apos;ve filled in, the better the output.
            </p>
            <button
              className="ck-btn-primary"
              disabled={loading}
              onClick={handleGenerate}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                "Generate My Messaging"
              )}
            </button>
          </div>
        )}

        {(generated || oneLiner) && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
            initial={{ opacity: 0, y: 10 }}
          >
            <div className="ck-section space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">Core Messages</h3>
              <div>
                <label className="ck-sublabel">One-Liner</label>
                <input className="ck-input" value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} />
              </div>
              <div>
                <label className="ck-sublabel">Tagline</label>
                <input className="ck-input" value={tagline} onChange={(e) => setTagline(e.target.value)} />
              </div>
              <div>
                <label className="ck-sublabel">Key Messages (one per line)</label>
                <textarea className="ck-input resize-none" rows={3} value={keyMessages} onChange={(e) => setKeyMessages(e.target.value)} />
              </div>
            </div>

            <div className="ck-section space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">StoryBrand BrandScript</h3>

              <div>
                <label className="ck-sublabel">Hero</label>
                <input className="ck-input" value={brandScript.hero} onChange={(e) => setBrandScript((p) => ({ ...p, hero: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <label className="ck-sublabel">Problem</label>
                <input className="ck-input" placeholder="External problem" value={brandScript.problem.external} onChange={(e) => setBrandScript((p) => ({ ...p, problem: { ...p.problem, external: e.target.value } }))} />
                <input className="ck-input" placeholder="Internal problem" value={brandScript.problem.internal} onChange={(e) => setBrandScript((p) => ({ ...p, problem: { ...p.problem, internal: e.target.value } }))} />
                <input className="ck-input" placeholder="Philosophical problem" value={brandScript.problem.philosophical} onChange={(e) => setBrandScript((p) => ({ ...p, problem: { ...p.problem, philosophical: e.target.value } }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="ck-sublabel">Guide: Empathy</label>
                  <input className="ck-input" value={brandScript.guide.empathy} onChange={(e) => setBrandScript((p) => ({ ...p, guide: { ...p.guide, empathy: e.target.value } }))} />
                </div>
                <div>
                  <label className="ck-sublabel">Guide: Authority</label>
                  <input className="ck-input" value={brandScript.guide.authority} onChange={(e) => setBrandScript((p) => ({ ...p, guide: { ...p.guide, authority: e.target.value } }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="ck-sublabel">CTA: Direct</label>
                  <input className="ck-input" value={brandScript.cta.direct} onChange={(e) => setBrandScript((p) => ({ ...p, cta: { ...p.cta, direct: e.target.value } }))} />
                </div>
                <div>
                  <label className="ck-sublabel">CTA: Transitional</label>
                  <input className="ck-input" value={brandScript.cta.transitional} onChange={(e) => setBrandScript((p) => ({ ...p, cta: { ...p.cta, transitional: e.target.value } }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="ck-sublabel">Failure (if they don&apos;t act)</label>
                  <input className="ck-input" value={brandScript.failure} onChange={(e) => setBrandScript((p) => ({ ...p, failure: e.target.value }))} />
                </div>
                <div>
                  <label className="ck-sublabel">Success</label>
                  <input className="ck-input" value={brandScript.success} onChange={(e) => setBrandScript((p) => ({ ...p, success: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-3">
                <button
                  className="ck-btn-secondary flex-1"
                  disabled={loading}
                  onClick={handleGenerate}
                >
                  {loading ? "Regenerating..." : "Regenerate"}
                </button>
                <button
                  className="ck-btn-primary flex-1"
                  onClick={handleSave}
                >
                  Save Messaging
                </button>
              </div>
              <AutosaveIndicator status={status} />
            </div>
          </motion.div>
        )}
      </div>
    </DeepenerShell>
  );
}
