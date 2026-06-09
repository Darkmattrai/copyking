import type { GeneratedICP } from "./schema";
import { readFileSync } from "fs";
import { join } from "path";

const SEG_HEX = [
  { accent: "#1a5276", bg: "#d6eaf8" },
  { accent: "#1e8449", bg: "#d5f5e3" },
  { accent: "#7d3c98", bg: "#e8daef" },
  { accent: "#c0392b", bg: "#fadbd8" },
  { accent: "#9a7d0a", bg: "#fef9e7" },
  { accent: "#784212", bg: "#fdebd0" },
];

const BAR_DIMS = [
  { key: "painIntensity", label: "Pain intensity", color: "#b03a2e" },
  { key: "goalClarity", label: "Goal clarity", color: "#9a7d0a" },
  { key: "buyingUrgency", label: "Buying urgency", color: "#1e8449" },
  { key: "priceSensitivity", label: "Price sensitivity", color: "#9a7d0a" },
  { key: "skepticism", label: "Skepticism", color: "#7d3c98" },
] as const;

const EMOTION_KEYS = [
  "frustration",
  "hope",
  "envy",
  "determination",
  "cynicism",
  "optimism",
  "urgency",
  "ambition",
];
const EMOTION_LABELS: Record<string, { label: string; cls: string }> = {
  frustration: { label: "Frustration", cls: "ep-frustration" },
  hope: { label: "Hope", cls: "ep-hope" },
  envy: { label: "Envy", cls: "ep-envy" },
  determination: { label: "Determination", cls: "ep-determination" },
  cynicism: { label: "Cynicism", cls: "ep-cynicism" },
  optimism: { label: "Optimism", cls: "ep-optimism" },
  urgency: { label: "Urgency", cls: "ep-urgency" },
  ambition: { label: "Ambition", cls: "ep-ambition" },
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bulletList(items: string[], liClass = ""): string {
  return `<ul>${items.map((i) => `<li${liClass ? ` class="${liClass}"` : ""}>${esc(i)}</li>`).join("")}</ul>`;
}

function card(
  label: string,
  labelColor: string,
  items: string[],
  borderColor?: string
): string {
  const style = borderColor ? ` style="border-left:3px solid ${borderColor}"` : "";
  return `<div class="card"${style}>
    <div class="card-label" style="color:${labelColor}">${label}</div>
    ${bulletList(items)}
  </div>`;
}

function detectEmotions(fingerprint: string): string {
  const lower = fingerprint.toLowerCase();
  const found = EMOTION_KEYS.filter((k) => lower.includes(k));
  const pills = (found.length > 0 ? found : ["frustration", "hope"]).map((k) => {
    const e = EMOTION_LABELS[k];
    return `<span class="epill ${e.cls}">${e.label}</span>`;
  });
  return pills.join("");
}

export function generateStandaloneHTML(
  icp: GeneratedICP,
  logoDataUrl?: string
): string {
  let css: string;
  try {
    css = readFileSync(join(process.cwd(), "lib/icp/icp.css"), "utf-8");
  } catch (err) {
    // Don't silently ship an unstyled map — surface it in server logs.
    console.error("[icp/serialize] failed to read lib/icp/icp.css:", err);
    css = "/* icp.css not found */";
  }

  let brainDataUrl = "";
  try {
    const brainBuf = readFileSync(join(process.cwd(), "public/brain.png"));
    brainDataUrl = `data:image/png;base64,${brainBuf.toString("base64")}`;
  } catch (err) {
    // The brain centrepiece going missing is exactly the prod bug we hit —
    // log loudly rather than swallowing so a missing asset is debuggable.
    console.error("[icp/serialize] failed to read public/brain.png:", err);
  }

  const u = icp.universal;
  const slug = icp.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const logoHtml = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="${esc(icp.businessName)}" class="cover-logo" />`
    : "";

  const intensityCards = icp.segments
    .map((seg, i) => {
      const c = SEG_HEX[i];
      const ordinal = String(i + 1).padStart(2, "0");
      const bars = BAR_DIMS.map(
        (d) => `
      <div class="bar-row">
        <div class="bar-top"><span>${d.label}</span><span>${seg.intensity[d.key]}%</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${seg.intensity[d.key]}%;background:${d.color}"></div></div>
      </div>`
      ).join("");
      return `<div class="intensity-card">
      <div class="intensity-title" style="color:${c.accent}">Audience Segment ${ordinal} · ${esc(seg.name)}</div>
      ${bars}
    </div>`;
    })
    .join("\n");

  const navLinks = [
    ["cover", "Overview"],
    ["pillars", "Psychology"],
    ["universal", "Universal"],
    ["segments", "Audience Segments"],
    ["intensity", "Intensity"],
  ]
    .map(
      ([id, label]) =>
        `<button class="nav-link" data-target="${id}" onclick="scrollTo2('${id}')">${label}</button>`
    )
    .join("");

  const brainImg = brainDataUrl
    ? `<img class="brain-img" src="${brainDataUrl}" alt="" aria-hidden="true"/>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${esc(icp.businessName)} — ICP Map</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <style>${css}</style>
</head>
<body>

<nav class="top-nav" id="icp-nav">
  <span class="nav-brand">Copy King</span>
  ${navLinks}
  <div class="nav-right">
    <span class="nav-badge">${icp.segments.length} Audience Segment${icp.segments.length !== 1 ? "s" : ""}</span>
  </div>
</nav>

<div id="cover" data-section="cover" class="cover">
  ${logoHtml}
  <div class="eyebrow">Ideal Customer Profile Map · Strategic Document · Confidential</div>
  <div class="cover-title">${esc(icp.businessName)} — ICP Map</div>
  <div class="cover-meta">
    <div class="meta-grid">
      <div><div class="meta-label">Client</div><div class="meta-val">${esc(icp.businessName)}</div></div>
      <div><div class="meta-label">Industry</div><div class="meta-val">${esc(icp.industryLabel)}</div></div>
      <div><div class="meta-label">Audience Segments</div><div class="meta-val">${icp.segments.length}</div></div>
      <div><div class="meta-label">Prepared by</div><div class="meta-val">Copy King · ${esc(icp.monthYear)}</div></div>
    </div>
    <div class="meta-foot">
      <span>Prepared by Copy King</span>
      <span>${esc(slug)} · Confidential</span>
    </div>
  </div>
</div>

<div id="pillars" data-section="pillars" class="section">
  <div class="section-eyebrow">Psychological Architecture</div>
  <div class="section-title">Diving into the audience&rsquo;s mind</div>
  <p class="section-sub">Every ICP map is built around 6 core psychological pillars — the complete mental landscape driving your audience&rsquo;s decisions.</p>
  <div class="brain-stage">
  <div class="brain-wrap">
    ${brainImg}
    <div class="pillar-card" style="top:20px;left:0">
      <div class="pillar-card-pill"><span class="pillar-card-emoji">⚡</span>Pillar 1</div>
      <div class="pillar-card-name">Pain &amp; Problems</div>
      <div class="pillar-card-desc">Core frustrations, what they&rsquo;ve tried, why they stay stuck</div>
    </div>
    <div class="pillar-card" style="top:210px;left:0">
      <div class="pillar-card-pill"><span class="pillar-card-emoji">🌟</span>Pillar 2</div>
      <div class="pillar-card-name">Goals &amp; Dreams</div>
      <div class="pillar-card-desc">The outcomes they&rsquo;re chasing — success in 6–12 months</div>
    </div>
    <div class="pillar-card" style="bottom:20px;left:0">
      <div class="pillar-card-pill"><span class="pillar-card-emoji">🧠</span>Pillar 3</div>
      <div class="pillar-card-name">Beliefs &amp; Mindset</div>
      <div class="pillar-card-desc">False beliefs and limiting stories blocking action</div>
    </div>
    <div class="pillar-card" style="top:20px;right:0">
      <div class="pillar-card-pill"><span class="pillar-card-emoji">❤️</span>Pillar 4</div>
      <div class="pillar-card-name">Emotional Core</div>
      <div class="pillar-card-desc">Feelings driving every decision — frustration, hope, envy</div>
    </div>
    <div class="pillar-card" style="top:210px;right:0">
      <div class="pillar-card-pill"><span class="pillar-card-emoji">💸</span>Pillar 5</div>
      <div class="pillar-card-name">Buying Triggers</div>
      <div class="pillar-card-desc">What finally moves them to invest — proof, social validation</div>
    </div>
    <div class="pillar-card" style="bottom:20px;right:0">
      <div class="pillar-card-pill"><span class="pillar-card-emoji">🚧</span>Pillar 6</div>
      <div class="pillar-card-name">Objections</div>
      <div class="pillar-card-desc">Hesitations and stories they tell themselves to not act</div>
    </div>
    <svg class="brain-overlay" viewBox="0 0 1000 560" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M 192,92 C 255,82 280,140 348,170" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="6,3" fill="none"/>
      <circle cx="348" cy="170" r="3.2" fill="#ffffff"/>
      <path d="M 192,272 C 245,266 280,272 338,278" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="6,3" fill="none"/>
      <circle cx="338" cy="278" r="3.2" fill="#ffffff"/>
      <path d="M 192,440 C 255,448 290,418 348,390" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="6,3" fill="none"/>
      <circle cx="348" cy="390" r="3.2" fill="#ffffff"/>
      <path d="M 808,92 C 745,82 720,140 652,170" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="6,3" fill="none"/>
      <circle cx="652" cy="170" r="3.2" fill="#ffffff"/>
      <path d="M 808,272 C 755,266 720,272 662,278" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="6,3" fill="none"/>
      <circle cx="662" cy="278" r="3.2" fill="#ffffff"/>
      <path d="M 808,440 C 745,448 710,418 652,390" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="6,3" fill="none"/>
      <circle cx="652" cy="390" r="3.2" fill="#ffffff"/>
    </svg>
  </div>
  </div>
</div>

<div id="universal" data-section="universal" class="section">
  <span class="badge-uni">Universal · All Audience Segments</span>
  <div class="sub-label" style="color:#b03a2e">⚡ Shared Pain &amp; Problems</div>
  <div class="grid-3">
    ${card("Biggest challenge", "#b03a2e", u.painChallenge, "#b03a2e")}
    ${card("What keeps them up at night", "#b03a2e", u.painNight, "#b03a2e")}
    ${card("What they've already tried", "#8c8880", u.painTried, "#b03a2e")}
  </div>
  <div class="sub-label" style="color:#9a7d0a">🌟 Goals, Dreams &amp; Emotional Core</div>
  <div class="grid-2">
    ${card("Ultimate aspirations", "#9a7d0a", u.goals, "#9a7d0a")}
    <div class="dark-card">
      <div class="card-label">Emotional drivers</div>
      <div class="pill-row">${detectEmotions(u.emotionalFingerprint)}</div>
      <p>&ldquo;${esc(u.emotionalFingerprint)}&rdquo;</p>
    </div>
  </div>
  <div class="sub-label" style="color:#1a5276">💸 Buying Triggers &amp; 🚧 Objections</div>
  <div class="grid-3">
    ${card("What pushes them to invest", "#1e8449", u.triggers, "#1e8449")}
    ${card("What makes them hesitate", "#b03a2e", u.hesitations, "#b03a2e")}
    ${card("Common objections", "#1a5276", u.objections, "#1a5276")}
  </div>
</div>

<div id="segments" data-section="segments" class="seg-section-hd">
  <div class="eyebrow">Breakdown</div>
  <div class="seg-section-title">🎯 Audience Segment Breakdown</div>
</div>

<div style="padding:20px 64px 4px;display:flex;gap:10px">
  <button class="expand-all-btn" id="expandAllBtn" onclick="expandAll()">Expand all audience segments ▼</button>
</div>

<div class="seg-grid">
${icp.segments
  .map((seg, i) => {
    const c = SEG_HEX[i];
    const ordinal = String(i + 1).padStart(2, "0");
    return `  <div class="seg-block" id="segment-${i}" data-section="segment-${i}">
    <div class="seg-hd" style="background:${c.bg};color:${c.accent}" onclick="toggleSeg(this)">
      <div>
        <div class="seg-hd-eyebrow">Audience Segment ${ordinal}</div>
        <div class="seg-hd-name">${esc(seg.name)}</div>
        <div class="seg-hd-desc">${esc(seg.oneLine)}</div>
      </div>
      <span class="seg-hd-toggle">▼</span>
    </div>
    <div class="seg-inner">
      <div class="seg-part seg-part-default">
        <span class="seg-part-label" style="color:#b03a2e">⚡ Core Pain</span>
        ${bulletList(seg.pain)}
      </div>
      <div class="seg-part seg-part-default">
        <span class="seg-part-label" style="color:#9a7d0a">🌟 Goals</span>
        ${bulletList(seg.goals)}
      </div>
      <div class="seg-part seg-part-default">
        <span class="seg-part-label" style="color:#7d3c98">🧠 Mindset</span>
        ${bulletList(seg.mindset)}
      </div>
      <div class="seg-part seg-part-obj">
        <span class="seg-part-label">🚧 Objections</span>
        ${bulletList(seg.objections)}
      </div>
      <div class="seg-part seg-part-buy">
        <span class="seg-part-label">💸 Buying Triggers</span>
        ${bulletList(seg.triggers)}
      </div>
    </div>
  </div>`;
  })
  .join("\n")}
</div>

<div id="intensity" data-section="intensity" class="intensity-section">
  <div class="eyebrow" style="padding-bottom:14px">Comparative Insight · Pillar intensity by audience segment</div>
  <div class="intensity-grid">
    ${intensityCards}
  </div>
</div>

<footer class="icp-footer">
  <span class="footer-brand">Copy King</span>
  <span class="footer-right">${esc(slug)} · ${esc(icp.monthYear)} · Confidential</span>
</footer>

<script>
function scrollTo2(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}
function toggleSeg(hd) {
  const inner = hd.nextElementSibling;
  const toggle = hd.querySelector('.seg-hd-toggle');
  const isOpen = inner.style.display === 'flex';
  inner.style.display = isOpen ? 'none' : 'flex';
  toggle.classList.toggle('open', !isOpen);
}
function expandAll() {
  const btn = document.getElementById('expandAllBtn');
  const inners = document.querySelectorAll('.seg-inner');
  const toggles = document.querySelectorAll('.seg-hd-toggle');
  const allOpen = [...inners].every(el => el.style.display === 'flex');
  inners.forEach(el => el.style.display = allOpen ? 'none' : 'flex');
  toggles.forEach(el => el.classList.toggle('open', !allOpen));
  btn.textContent = allOpen ? 'Expand all audience segments ▼' : 'Collapse all audience segments ▲';
}
const navBtns = document.querySelectorAll('.nav-link[data-target]');
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.getAttribute('data-section');
      navBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-target') === id));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('[data-section]').forEach(s => obs.observe(s));
document.querySelectorAll('.seg-inner').forEach(el => el.style.display = 'none');
</script>
</body>
</html>`;
}
