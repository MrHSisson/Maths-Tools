import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { DecisionProblem, SolveStep } from "./types";
import { givenLines, initialKnown } from "./dimSolve";

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
function blockTex(b: Block, base: string): string {
  if (b.kind === "head") return "";
  if (b.kind === "free") return `\\displaystyle ${colour(b.row, b.fresh ? NEW : base)}`;
  if (b.kind === "aligned") {
    // two left-aligned columns: what is written on the left, then the "= …" that lines up under the first equals.
    // A follow-on step ("&= …") that is short continues along the same line as the one before it, rather than starting a new line;
    // a long one (or one that would make the line too wide) starts a new line, under the first equals.
    // A short follow-on step continues along the same line. When a line is full, the next step goes down but stays in line: its "=" sits under the
    // start of the last step of the line above (the indent is an invisible copy of what comes before it), so the working never jumps back to the left.
    type Line = { left: string; indent: string; parts: Array<{ tex: string; fresh: boolean }>; w: number };
    const SEP = "\\;\\;";
    const lines: Line[] = [];
    for (const { row, fresh } of b.rows) {
      const at = row.indexOf("&");
      const left = row.slice(0, at);
      const right = row.slice(at + 1);
      const w = weight(right);
      const last = lines[lines.length - 1];
      if (left.trim() !== "" || !last) lines.push({ left, indent: "", parts: [{ tex: right, fresh }], w });
      // once a working has broken onto a new line, every step after it goes on its own line too, all under the same "="
      else if (!last.indent && last.w + w <= LINE_BUDGET) { last.parts.push({ tex: right, fresh }); last.w += w; }
      else {
        const before = last.parts.slice(0, -1).map((x) => x.tex).join(SEP);
        lines.push({ left: "", indent: last.indent || (before ? `\\phantom{${before}}${SEP}` : ""), parts: [{ tex: right, fresh }], w: w });
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
const label: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#94a3b8" };

export default function DimCanvas({ p, step }: { p: DecisionProblem; step: SolveStep | undefined }) {
  const d = p.dim;
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const v = step?.dimView;
  const known = v ? v.known : d ? initialKnown(d) : [];
  const knownFresh = v?.knownFresh ?? 0;
  const lines = v ? v.lines : d ? givenLines(d) : [];
  const fresh = v?.fresh ?? 0;
  // shrink the page to fit the panel (never scroll): measure the natural size, then scale to the room there is
  useIso(() => {
    const b = box.current, i = inner.current;
    if (!b || !i || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const w = i.offsetWidth, h = i.offsetHeight; // layout size: a transform does not change it, so there is nothing to reset
      if (w > 0 && h > 0) setScale(Math.max(0.3, Math.min(1, b.clientWidth / w, b.clientHeight / h)));
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
      <div style={{ position: "absolute", top: 12, left: 60, right: 12, fontSize: 16, fontWeight: 700, color: INK, lineHeight: 1.25 }}>{d.title ? <Prose text={d.title} /> : <span style={label}>{v ? "Written working" : "The question"}</span>}</div>
      <div ref={box} style={{ position: "absolute", top: 46, left: 14, right: 10, bottom: 8, overflow: "hidden", borderLeft: "2px solid #fecaca", paddingLeft: 14 }}>
        <div ref={inner} style={{ display: "inline-block", width: "max-content", maxWidth: "none", transformOrigin: "top left", transform: `scale(${scale})`, fontSize: "clamp(12px, 4cqh, 30px)", color: base }}>
          <div style={{ marginBottom: 10, maxWidth: "26em" }}>
            <div style={{ ...label, marginBottom: 3 }}>Known</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 1.1em", fontSize: "0.9em", color: GIVEN }}>
              {known.map((k, i) => (
                <span key={i} style={{ whiteSpace: "nowrap", color: i >= known.length - knownFresh ? NEW : GIVEN }}><Tex t={k} /></span>
              ))}
            </div>
          </div>
          {lines.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.55em", borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
              {blocks(lines, fresh).map((b, i) => (b.kind === "gap" ? <div key={i} style={{ height: "0.4em" }} /> : b.kind === "head" ? <div key={i} style={{ ...label, textTransform: "none", letterSpacing: 0, fontSize: "0.62em", fontWeight: 600, paddingTop: "0.3em" }}><Prose text={b.text} /></div> : <div key={i}><Tex t={blockTex(b, base)} /></div>))}
            </div>
          )}
          {!v && lines.length === 0 && <div style={{ ...label, textTransform: "none", letterSpacing: 0, fontSize: 14, fontWeight: 500, paddingTop: 6 }}>Your working builds up here, one line at a time.</div>}
        </div>
      </div>
    </div>
  );
}
