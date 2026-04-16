"use client";

import { useState } from "react";
import { toast } from "sonner";

import { DeepenerShell } from "../deepener-shell";
import { useBrandStore } from "@/lib/brand/store";
import { PILLAR_META } from "@/types/brand";

function TagInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();

    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput("");
    }
  };

  return (
    <div className="space-y-2">
      <label className="ck-label">{label}</label>
      <div className="flex gap-2">
        <input
          className="ck-input flex-1"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
        />
        <button
          className="px-3 py-2 rounded-md bg-accent-muted text-accent text-sm hover:bg-accent/25 transition-colors"
          onClick={add}
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="ck-chip cursor-pointer hover:bg-danger/20 hover:text-danger transition-colors flex items-center gap-1"
              onClick={() => onChange(value.filter((t) => t !== tag))}
            >
              {tag} &times;
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ICPBuilder() {
  const meta = PILLAR_META[1];
  const { brandDNA, updatePillar } = useBrandStore();
  const icp = brandDNA.icp;

  const [name, setName] = useState(icp.name);
  const [ageRange, setAgeRange] = useState(icp.demographics.ageRange);
  const [gender, setGender] = useState(icp.demographics.gender);
  const [location, setLocation] = useState(icp.demographics.location);
  const [incomeRange, setIncomeRange] = useState(icp.demographics.incomeRange);
  const [jobTitle, setJobTitle] = useState(icp.demographics.jobTitle);
  const [painPoints, setPainPoints] = useState(icp.painPoints);
  const [dreamOutcome, setDreamOutcome] = useState(icp.dreamOutcome);
  const [failedSolutions, setFailedSolutions] = useState(icp.failedSolutions);
  const [platforms, setPlatforms] = useState(icp.platforms);
  const [fears, setFears] = useState(icp.psychographics.fears);
  const [desires, setDesires] = useState(icp.psychographics.desires);
  const [values, setValues] = useState(icp.psychographics.values);

  const handleSave = () => {
    updatePillar("icp", {
      name,
      demographics: { ageRange, gender, location, incomeRange, jobTitle },
      psychographics: { values, beliefs: icp.psychographics.beliefs, fears, desires },
      painPoints,
      dreamOutcome,
      failedSolutions,
      platforms,
    });
    toast.success("Avatar saved");
  };

  return (
    <DeepenerShell meta={meta}>
      <div className="space-y-6">
        <div className="ck-section space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Avatar Identity</h3>
          <div>
            <label className="ck-label">Avatar Name</label>
            <input
              className="ck-input"
              placeholder='e.g. "Frustrated Frank" or "Stressed Sarah"'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ck-sublabel">Age Range</label>
              <input className="ck-input" placeholder="25-35" value={ageRange} onChange={(e) => setAgeRange(e.target.value)} />
            </div>
            <div>
              <label className="ck-sublabel">Gender</label>
              <input className="ck-input" placeholder="Female" value={gender} onChange={(e) => setGender(e.target.value)} />
            </div>
            <div>
              <label className="ck-sublabel">Location</label>
              <input className="ck-input" placeholder="US, Urban" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="ck-sublabel">Income</label>
              <input className="ck-input" placeholder="$50k-$100k" value={incomeRange} onChange={(e) => setIncomeRange(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="ck-sublabel">Job Title</label>
            <input className="ck-input" placeholder="Marketing Manager" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </div>
        </div>

        <div className="ck-section space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Pains & Dreams</h3>

          <div>
            <label className="ck-label">Dream Outcome</label>
            <textarea
              className="ck-input resize-none"
              placeholder="What does their ideal life/result look like after working with you?"
              rows={2}
              value={dreamOutcome}
              onChange={(e) => setDreamOutcome(e.target.value)}
            />
          </div>

          <TagInput label="Pain Points" onChange={setPainPoints} placeholder="Add a pain point" value={painPoints} />
          <TagInput label="Failed Solutions" onChange={setFailedSolutions} placeholder="What have they tried?" value={failedSolutions} />
        </div>

        <div className="ck-section space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Psychographics</h3>
          <TagInput label="Fears" onChange={setFears} placeholder="What keeps them up at night?" value={fears} />
          <TagInput label="Desires" onChange={setDesires} placeholder="What do they secretly want?" value={desires} />
          <TagInput label="Values" onChange={setValues} placeholder="What matters most to them?" value={values} />
          <TagInput label="Platforms" onChange={setPlatforms} placeholder="Where do they hang out online?" value={platforms} />
        </div>

        <button className="ck-btn-primary w-full" onClick={handleSave}>
          Save Avatar
        </button>
      </div>
    </DeepenerShell>
  );
}
