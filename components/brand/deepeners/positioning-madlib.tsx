"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { DeepenerShell } from "../deepener-shell";
import { useBrandStore } from "@/lib/brand/store";
import { PILLAR_META } from "@/types/brand";

export function PositioningMadlib() {
  const meta = PILLAR_META[3];
  const { brandDNA, updatePillar } = useBrandStore();
  const pos = brandDNA.positioning;

  const [who, setWho] = useState("");
  const [outcome, setOutcome] = useState("");
  const [method, setMethod] = useState("");
  const [without, setWithout] = useState("");
  const [uniqueMechanism, setUniqueMechanism] = useState(pos.uniqueMechanism);
  const [categoryOwned, setCategoryOwned] = useState(pos.categoryOwned);
  const [pointOfView, setPointOfView] = useState(pos.pointOfView);

  useState(() => {
    const stmt = pos.positioningStatement;
    const match = stmt.match(/I help (.+?) achieve (.+?) using (.+?) without (.+)/i);

    if (match) {
      setWho(match[1]);
      setOutcome(match[2]);
      setMethod(match[3]);
      setWithout(match[4]);
    }
  });

  const statement = `I help ${who || "___"} achieve ${outcome || "___"} using ${method || "___"} without ${without || "___"}`;
  const isComplete = who && outcome && method && without;

  const handleSave = () => {
    updatePillar("positioning", {
      uniqueMechanism,
      categoryOwned,
      positioningStatement: statement,
      pointOfView,
    });
    toast.success("Positioning saved");
  };

  return (
    <DeepenerShell meta={meta}>
      <div className="space-y-6">
        <div className="ck-section !p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4 text-center">
            Build Your Positioning Statement
          </h3>

          <motion.div
            className="text-center text-lg leading-relaxed mb-6 p-4 rounded-lg bg-surface-raised"
            layout
          >
            <span className="text-text-tertiary">I help </span>
            <span className={who ? "text-accent font-semibold" : "text-text-tertiary"}>
              {who || "[who]"}
            </span>
            <span className="text-text-tertiary"> achieve </span>
            <span className={outcome ? "text-success font-semibold" : "text-text-tertiary"}>
              {outcome || "[what outcome]"}
            </span>
            <br />
            <span className="text-text-tertiary"> using </span>
            <span className={method ? "text-accent-hover font-semibold" : "text-text-tertiary"}>
              {method || "[what method]"}
            </span>
            <span className="text-text-tertiary"> without </span>
            <span className={without ? "text-warning font-semibold" : "text-text-tertiary"}>
              {without || "[what objection]"}
            </span>
          </motion.div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-accent mb-1 font-medium">Who do you help?</label>
              <input className="ck-input" placeholder="e.g. busy moms over 30" value={who} onChange={(e) => setWho(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-success mb-1 font-medium">Achieve what?</label>
              <input className="ck-input" placeholder="e.g. lose 20 lbs and keep it off" value={outcome} onChange={(e) => setOutcome(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-accent-hover mb-1 font-medium">Using what method?</label>
              <input className="ck-input" placeholder="e.g. my 90-day metabolic reset protocol" value={method} onChange={(e) => setMethod(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-warning mb-1 font-medium">Without what?</label>
              <input className="ck-input" placeholder="e.g. restrictive dieting or 2-hour gym sessions" value={without} onChange={(e) => setWithout(e.target.value)} />
            </div>
          </div>

          {isComplete && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center text-xs text-success"
              initial={{ opacity: 0, y: 5 }}
            >
              Your positioning statement is ready
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="ck-label">Unique Mechanism</label>
            <input className="ck-input" placeholder="Your proprietary method, framework, or process name" value={uniqueMechanism} onChange={(e) => setUniqueMechanism(e.target.value)} />
          </div>
          <div>
            <label className="ck-label">Category You Own</label>
            <input className="ck-input" placeholder="The category you want to be THE name in" value={categoryOwned} onChange={(e) => setCategoryOwned(e.target.value)} />
          </div>
          <div>
            <label className="ck-label">Your Point of View</label>
            <textarea className="ck-input resize-none" placeholder="What does everyone in your industry get wrong? What's your contrarian take?" rows={3} value={pointOfView} onChange={(e) => setPointOfView(e.target.value)} />
          </div>
        </div>

        <button className="ck-btn-primary w-full" onClick={handleSave}>
          Save Positioning
        </button>
      </div>
    </DeepenerShell>
  );
}
