// The page frame every printed sheet shares (exam papers and mark schemes, skill worksheets and answers, Critical Path's A4 sheets): the same page
// margins, type, header (the tool and what it is, with Name and Date), numbering line and "answers" tag, so a basket of mixed questions looks like one set.

export const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const FRAME_CSS = `
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #111827; font-size: 10.5pt; margin: 0; }
  header { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; border-bottom: 0.5mm solid #1e3a8a; padding-bottom: 1.5mm; margin-bottom: 3mm; }
  header h1 { font-size: 13pt; margin: 0; color: #1e3a8a; min-width: 0; }
  header .who { font-size: 9.5pt; color: #374151; white-space: nowrap; }
  .meta { font-size: 9.5pt; color: #4b5563; margin-bottom: 3mm; }
  .tag { font-size: 8.5pt; font-weight: 700; color: #fff; background: #166534; border-radius: 1mm; padding: 0 1.5mm; margin-left: 2mm; vertical-align: middle; }
`;

/** the header: the tool and what the sheet is ("Dimensional Analysis — Find the powers · Level 2"), and Name and Date on a question page (an answers page has an `answers` tag instead) */
export function frameHeader(title: string, subtitle: string | undefined, opts: { tag?: string; who?: boolean } = {}): string {
  const who = opts.who !== false;
  return `<header><h1>${esc(title)}${subtitle ? ` — ${esc(subtitle)}` : ""}${opts.tag ? `<span class="tag">${esc(opts.tag)}</span>` : ""}</h1><div class="who">${who ? "Name ______________________ &nbsp; Date __________" : ""}</div></header>`;
}
