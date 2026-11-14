import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { DecisionProblem, SolveStep } from "./types";
import { givenLines, initialKnown } from "./dimSolve";
import { GIVEN_ITEMS } from "./dimBuild";

// The picture of a Dimensional Analysis question is the page a student would WRITE. At the top, a short strip of what is KNOWN (the given quantities, then each one
// built so far); below it the working in progress, aligned on its equals signs, the newest lines in blue. The step beside it says why each line is there.
// The page never scrolls: its size follows the panel it sits in (a base size from the panel's height, then shrunk to fit if the content is still too big), and the
// working stage by stage keeps the content small. Every row is KaTeX rendered to a string and the layout is inline styles, so the exam paper can print it.

const INK = "#0f172a";
const NEW = "#1d4ed8";
const GIVEN = "#475569";
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Block = { kind: "gap" } | { kind: "head"; text: string } | { kind: "free"; row: string; fresh: boolean } | { kind: "aligned"; rows: Array<{ row: string; fresh: boolean }> };

/** group the page's rows: consecutive rows with "&" are one aligned block, "" is a gap, anything else stands alone */
function blocks(lines: string[], fresh: number): Block[] {
  const firstFresh = lines.length - fresh;
  const out: Block[] = [];
  lines.forEach((row, i) => {
    const isNew = i >= firstFresh;
    if (row === "") { out.push({ kind: "gap" }); return; }
    if (row.startsWith("#")) { out.push({ kind: "head", text: row.slice(1) }); return; }
    if (row.includes("&")) {
      const last = out[out.length - 1];
      if (last && last.kind === "aligned") last.rows.push({ row, fresh: isNew });
      else out.push({ kind: "aligned", rows: [{ row, fresh: isNew }] });
    } else out.push({ kind: "free", row, fresh: isNew });
  });
  return out;
}

/** how wide a piece of TeX will be, roughly: its characters once the commands and braces are taken away */
const weight = (tex: string): number => tex.replace(/\\(left|right|displaystyle|mathrm|text|times|quad|,)/g, (m) => (m === "\\times" ? "x" : "")).replace(/\\[a-zA-Z]+/g, "x").replace(/[{}^_&\s]/g, "").length;
/** the widest a line of working gets before a follow-on step starts a new line */
const LINE_BUDGET = 40;
const colour = (tex: string, c: string): string => `{\\color{${c}}${tex}}`;
function blockTex(b: Block, base: string, budget: number = LINE_BUDGET): string {
  if (b.kind === "head") return "";
  if (b.kind === "free") return `\\displaystyle ${colour(b.row, b.fresh ? NEW : base)}`;
  if (b.kind === "aligned") {
    // two left-aligned columns: what is written on the left, then the "= …" that lines up under the first equals.
    // A follow-on step ("&= …") that is short continues along the same line as the one before it, rather than starting a new line;
    // a long one (or one that would make the line too wide) starts a new line, under the first equals.
    // A short follow-on step continues along the same line. When a line is full, the next step goes down but stays in line: its "=" sits under the
    // start of the last step of the line above (the indent is an invisible copy of what comes before it), so the working never jumps back to the left.
    type Line = { left: string; indent: string; broken: boolean; parts: Array<{ tex: string; fresh: boolean }>; w: number };
    const SEP = "\\;\\;";
    const lines: Line[] = [];
    for (const { row, fresh } of b.rows) {
      const at = row.indexOf("&");
      const left = row.slice(0, at);
      const right = row.slice(at + 1);
      const w = weight(right);
      const last = lines[lines.length - 1];
      if (left.trim() !== "" || !last) lines.push({ left, indent: "", broken: false, parts: [{ tex: right, fresh }], w });
      // once a working has broken onto a new line, every step after it goes on its own line too, all under the same "="
      else if (!last.broken && last.w + w <= budget) { last.parts.push({ tex: right, fresh }); last.w += w; }
      else {
        const before = last.parts.slice(0, -1).map((x) => x.tex).join(SEP);
        lines.push({ left: "", broken: true, indent: last.indent || (before ? `\\phantom{${before}}${SEP}` : ""), parts: [{ tex: right, fresh }], w: w });
      }
    }
    const tall = (l: Line): boolean => /\\frac|\\left|\\begin/.test(l.parts.map((x) => x.tex).join("") + l.left);
    const rows = lines.map((l) => {
      const anyFresh = l.parts.some((x) => x.fresh);
      return `\\displaystyle ${colour(l.left, anyFresh && l.parts.length === 1 ? NEW : base)} & \\displaystyle \\mkern-9mu ${l.indent}${l.parts.map((x) => colour(x.tex, x.fresh ? NEW : base)).join("\\;\\;")}`;
    });
    return `\\begin{array}{ll}${rows.map((r, i) => r + (i < rows.length - 1 ? ` \\\\[${tall(lines[i]) || tall(lines[i + 1]) ? "1.45em" : "0.85em"}] ` : "")).join("")}\\end{array}`;
  }
  return "";
}
/** plain text with maths between $…$ (the title and the small headings) */
function Prose({ text }: { text: string }) {
  return <>{text.split(/(\$[^$]+\$)/g).map((part, i) => (i % 2 === 1 ? <Tex key={i} t={part.slice(1, -1)} /> : <span key={i}>{part}</span>))}</>;
}
function Tex({ t }: { t: string }) {
  let html: string;
  try { html = katex.renderToString(t, { throwOnError: false, output: "html" }); } catch { html = t; }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
const label: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#64748b" };

export default function DimCanvas({ p, step }: { p: DecisionProblem; step: SolveStep | undefined }) {
  const d = p.dim;
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const v = step?.dimView;
  const known = v ? v.known : d ? initialKnown(d) : [];
  const knownFresh = v?.knownFresh ?? 0;
  // an exam-style question shows only what is known until a part is worked: its model or formula is part of what the parts ask, so it is not given away
  const lines = v ? v.lines : d && !p.exam ? givenLines(d) : [];
  const fresh = v?.fresh ?? 0;
  // shrink the page to fit the panel (never scroll): measure the natural size, then scale to the room there is
  useIso(() => {
    const b = box.current, i = inner.current;
    if (!b || !i || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const w = i.offsetWidth, h = i.offsetHeight; // layout size: a transform does not change it, so there is nothing to reset
      if (w > 0 && h > 0) setScale(Math.max(0.3, Math.min(1, (b.clientWidth - 20) / w, b.clientHeight / h)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    return () => ro.disconnect();
  }, [lines, known]);
  if (!d) return null;
  const base = v ? INK : GIVEN;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", overflow: "hidden", containerType: "size" } as CSSProperties}>
      <div style={{ position: "absolute", top: 12, left: 60, right: 12, fontSize: 16, fontWeight: 700, color: INK, lineHeight: 1.25 }}>{d.title && (v || !p.exam) ? <Prose text={d.title} /> : <span style={label}>{v ? "Written working" : "The question"}</span>}</div>
      <div ref={box} style={{ position: "absolute", top: 46, left: 14, right: 10, bottom: 8, overflow: "hidden", borderLeft: "2px solid #fecaca", paddingLeft: 14 }}>
        <div ref={inner} style={{ display: "inline-block", width: "max-content", maxWidth: "none", transformOrigin: "top left", transform: `scale(${scale})`, fontSize: "clamp(12px, 4cqh, 30px)", color: base }}>
          <div style={{ marginBottom: 14, maxWidth: "46em" }}>
            <div style={{ ...label, marginBottom: 5 }}>Known</div>
            {/* what is assumed (l, t, m, v, a), a rule, then what has been built up from them */}
            {[known.slice(0, GIVEN_ITEMS.length), known.slice(GIVEN_ITEMS.length)].map((group, g) => group.length > 0 && (
              <div key={g} style={{ ...(g === 1 ? { marginTop: "0.7em", paddingTop: "0.5em", borderTop: "1px solid #cbd5e1" } : {}) }}>
                {g === 1 && <div style={{ ...label, fontSize: 10, marginBottom: 4 }}>Built up</div>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35em 1.5em", fontSize: "0.9em", color: GIVEN }}>
                {group.map((k, j) => {
                  const i = g * GIVEN_ITEMS.length + j;
                  return <span key={i} style={{ whiteSpace: "nowrap", color: i >= known.length - knownFresh ? NEW : GIVEN }}><Tex t={k} /></span>;
                })}
                </div>
              </div>
            ))}
          </div>
          {lines.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.55em", borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
              {blocks(lines, fresh).map((b, i) => (b.kind === "gap" ? <div key={i} style={{ height: "0.4em" }} /> : b.kind === "head" ? <div key={i} style={{ ...label, textTransform: "none", letterSpacing: 0, fontSize: "0.62em", fontWeight: 600, paddingTop: "0.3em" }}><Prose text={b.text} /></div> : <div key={i}><Tex t={blockTex(b, base)} /></div>))}
            </div>
          )}
          {!v && !p.exam && lines.length === 0 && <div style={{ ...label, textTransform: "none", letterSpacing: 0, fontSize: 14, fontWeight: 500, paddingTop: 6 }}>Your working builds up here, one line at a time.</div>}
        </div>
      </div>
    </div>
  );
}

// ── the phone: the whole solution as one open page ──────────────────────────────────────────
/** the rows a step adds to the page */
const addedRows = (st: SolveStep): string[] => { const v = st.dimView; return v && v.fresh ? v.lines.slice(v.lines.length - v.fresh) : []; };
/** some rows of working, in the written layout, at a size a phone can read; long lines break earlier than on a laptop */
function PhoneRows({ rows }: { rows: string[] }) {
  const bs = blocks(rows, 0);
  return (
    <div className="flex flex-col gap-2 items-start" style={{ fontSize: 17, color: INK }}>
      {bs.map((b, i) => (b.kind === "gap" ? <div key={i} style={{ height: 4 }} /> : b.kind === "head" ? <div key={i} style={{ fontSize: 13, fontWeight: 600, color: "#64748b", paddingTop: 4 }}><Prose text={b.text} /></div> : <div key={i} style={{ maxWidth: "100%", overflowX: "auto" }}><Tex t={blockTex(b, INK, 22)} /></div>))}
    </div>
  );
}
function PhoneStep({ st }: { st: SolveStep }) {
  const [open, setOpen] = useState(false);
  const chevron = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "none" }}><path d="M3 6l5 5 5-5" /></svg>
  );
  if (st.more) {
    // a build: its one line, and the result; the parts behind a chevron
    const known = st.dimView!.known;
    return (
      <div>
        <div className="flex items-start gap-2">
          <div style={{ flex: 1, fontSize: 14, color: "#475569", lineHeight: 1.45 }}><Prose text={st.caption} /></div>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-label={open ? "Fold the steps away" : "Show the steps"} className="shrink-0 flex items-center justify-center text-slate-500" style={{ width: 40, height: 32 }}>{chevron}</button>
        </div>
        {!open && <div style={{ fontSize: 17, marginTop: 2 }}><Tex t={known[known.length - 1]} /></div>}
        {open && (
          <div className="flex flex-col gap-3 mt-2 ml-2 pl-3" style={{ borderLeft: "2px solid #c7d2fe" }}>
            {st.more.map((m, k) => (<div key={k}><div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.4 }}>{m.caption}</div><PhoneRows rows={addedRows(m)} /></div>))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.45, marginBottom: 4 }}><Prose text={st.caption} /></div>
      <PhoneRows rows={addedRows(st)} />
    </div>
  );
}
/** a Dimensional Analysis solution on a phone: what is known, then each step with its caption and what it adds to the page, on one open scrolling page */
export function DimSolution({ steps }: { steps: SolveStep[] }) {
  const first = steps[0]?.dimView;
  if (!first) return null;
  const knownGiven = first.known.slice(0, GIVEN_ITEMS.length);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-x-5 gap-y-1" style={{ fontSize: 15, color: "#475569" }}>{knownGiven.map((k, i) => <span key={i} style={{ whiteSpace: "nowrap" }}><Tex t={k} /></span>)}</div>
      {steps.map((st, i) => <PhoneStep key={i} st={st} />)}
    </div>
  );
}
