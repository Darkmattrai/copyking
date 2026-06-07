// Export helpers for the account "Brand DNA" tab. No external dependencies:
// the PDF path opens a print-ready window and calls window.print() (users pick
// "Save as PDF"); the .doc path downloads a Word-compatible HTML blob.

import type { AnswerGroup } from "./brand-dna-answers";

interface ExportMeta {
  brandName?: string;
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const nl2br = (s: string) => esc(s).replace(/\n/g, "<br/>");

// A field counts as "answered" if it has any value or an AI rewrite.
function hasContent(g: AnswerGroup): boolean {
  return g.fields.some((f) => f.value.trim() || f.enhanced?.trim());
}

function fieldHtml(question: string, value: string, original?: string, enhanced?: string): string {
  // When an AI-enhanced version exists, show both the original answer and the
  // rewrite so the document captures everything the user produced.
  if (enhanced?.trim() && original?.trim() && original.trim() !== enhanced.trim()) {
    return `<div class="field">
      <div class="q">${esc(question)}</div>
      <div class="sub">Original answer</div>
      <div class="a orig">${nl2br(original)}</div>
      <div class="sub">AI-enhanced version</div>
      <div class="a enh">${nl2br(enhanced)}</div>
    </div>`;
  }
  if (!value.trim()) return "";
  return `<div class="field">
    <div class="q">${esc(question)}</div>
    <div class="a">${nl2br(value)}</div>
  </div>`;
}

function buildBodyHtml(groups: AnswerGroup[]): string {
  const sections = groups
    .filter(hasContent)
    .map((g) => {
      const fields = g.fields
        .map((f) => fieldHtml(f.question, f.value, f.original, f.enhanced))
        .filter(Boolean)
        .join("\n");
      if (!fields) return "";
      return `<section class="group">
        <h2>${esc(g.category)} <span class="tag">${esc(g.feature)}</span></h2>
        ${fields}
      </section>`;
    })
    .filter(Boolean)
    .join("\n");
  return sections;
}

function buildDocument(groups: AnswerGroup[], meta: ExportMeta): string {
  const title = meta.brandName ? `${meta.brandName} — Brand DNA` : "Brand DNA";
  const date = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; margin: 40px; line-height: 1.5; }
  .doc-header { border-bottom: 3px solid #6b46ff; padding-bottom: 12px; margin-bottom: 24px; }
  .doc-header h1 { font-size: 26px; margin: 0 0 4px; }
  .doc-header .meta { font-size: 12px; color: #666; }
  section.group { margin: 0 0 28px; page-break-inside: avoid; }
  section.group h2 { font-size: 17px; margin: 0 0 12px; padding-bottom: 6px; border-bottom: 1px solid #ddd; }
  .tag { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;
         color: #6b46ff; border: 1px solid #6b46ff; border-radius: 4px; padding: 1px 6px; margin-left: 8px;
         vertical-align: middle; }
  .field { margin: 0 0 14px; }
  .q { font-weight: bold; font-size: 13px; color: #333; margin-bottom: 3px; }
  .a { font-size: 13px; color: #1a1a1a; white-space: normal; }
  .sub { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 6px 0 2px; }
  .a.orig { color: #777; }
  .a.enh { color: #1a1a1a; }
  @media print { body { margin: 0.6in; } }
</style>
</head>
<body>
  <div class="doc-header">
    <h1>${esc(title)}</h1>
    <div class="meta">Exported ${esc(date)}</div>
  </div>
  ${buildBodyHtml(groups)}
</body>
</html>`;
}

// Opens a print window so the user can "Save as PDF".
export function exportAnswersPdf(groups: AnswerGroup[], meta: ExportMeta = {}): void {
  const html = buildDocument(groups, meta);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  // Give the new document a tick to lay out before invoking the print dialog.
  win.onload = () => {
    win.focus();
    win.print();
  };
}

// Downloads a Word-compatible .doc file built from the same HTML.
export function exportAnswersDoc(groups: AnswerGroup[], meta: ExportMeta = {}): void {
  const html = buildDocument(groups, meta);
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const base = (meta.brandName || "brand-dna")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  a.href = url;
  a.download = `${base || "brand-dna"}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
