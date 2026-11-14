import type { CSSProperties } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { DecisionProblem, SolveStep } from "./types";
import { BASE, fstr } from "./dim";
import { symTex, frTex } from "./dimTex";

// The exponent grid: one row per quantity, columns M · L · T, each cell the exponent. The working reads it a column at a time (the column lights up and the
// equation it gives appears below), then the powers found fill in. Every symbol, formula and equation is KaTeX (rendered to a string, so there are no hooks and the
// exam paper can print it with renderToStaticMarkup); the layout uses inline styles only.
// A dimension the question gives is always shown; one the student must recall shows "?" until the working reveals it.

const COLS = [0, 1, 2] as const;
const TONE = ["#1e3a8a", "#7c3aed", "#166534"]; // M, L, T
const faint: CSSProperties = { color: "#cbd5e1" };

/** TeX as an inline KaTeX span */
function Tex({ t, size }: { t: string; size?: number }) {
  let html: string;
  try { html = katex.renderToString(t, { throwOnError: false, output: "html" }); } catch { html = t; }
  return <span style={size ? { fontSize: size } : undefined} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function DimCanvas({ p, step }: { p: DecisionProblem; step: SolveStep | undefined }) {
  const d = p.dim;
  if (!d) return null;
  const v = step?.dimView;
  const reveal = new Set(v?.reveal ?? []);
  const cols = new Set(v?.cols ?? []);
  const marks = new Set(v?.mark ?? []);
  const shown = (i: number) => d.rows[i].given || reveal.has(i);
  const hasPower = d.rows.some((r) => r.power || r.exp);
  const cell = (extra: CSSProperties = {}): CSSProperties => ({ padding: "6px 14px", textAlign: "center", fontSize: 20, fontVariantNumeric: "tabular-nums", ...extra });
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 12, overflow: "auto", background: "#fff" }}>
      {d.formula && d.kind !== "dimsName" && d.kind !== "dimsUnits" && d.kind !== "dimsConst" && (
        <div style={{ fontSize: 22, fontWeight: 600, color: "#0f172a", textAlign: "center" }}><Tex t={d.formula} /></div>
      )}
      <table style={{ borderCollapse: "collapse", maxWidth: "100%" }}>
        <thead>
          <tr>
            <th style={cell({ textAlign: "left", fontSize: 13, color: "#64748b", fontWeight: 600 })} />
            {hasPower && <th style={cell({ fontSize: 13, color: "#64748b", fontWeight: 600 })}>power</th>}
            {COLS.map((c) => (
              <th key={c} style={cell({ fontWeight: 700, color: TONE[c], background: cols.has(c) ? "#eef2ff" : undefined, borderBottom: "2px solid #cbd5e1", borderTopLeftRadius: 6, borderTopRightRadius: 6 })}>{BASE[c]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {d.rows.map((r, i) => {
            const vis = shown(i);
            const isTop = i === 0;
            const solved = r.power ? v?.powers?.[r.power] : undefined;
            const rowBg = marks.has(i) ? "#fee2e2" : undefined;
            return (
              <tr key={i} style={{ background: rowBg, borderTop: isTop ? undefined : "1px solid #e2e8f0" }}>
                <td style={cell({ textAlign: "left", fontSize: 18, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" })}>
                  <Tex t={r.sym} />
                  {r.name && <div style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>{r.name}</div>}
                </td>
                {hasPower && (
                  <td style={cell({ fontSize: 17, color: "#0f172a" })}>
                    {r.power ? (solved ? <span style={{ color: "#166534", fontWeight: 700 }}><Tex t={`${symTex(r.power)} = ${solved}`} /></span> : <Tex t={symTex(r.power)} />)
                      : r.exp ? (r.exp[0] === 1 && r.exp[1] === 1 ? "" : <Tex t={frTex(r.exp)} />) : null}
                  </td>
                )}
                {COLS.map((c) => (
                  <td key={c} style={cell({ background: cols.has(c) ? "#eef2ff" : undefined, fontWeight: isTop ? 700 : 500, ...(vis ? {} : faint) })}>
                    {vis ? (r.dim[c][1] === 1 ? fstr(r.dim[c]) : <Tex t={frTex(r.dim[c])} />) : "?"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {v?.eqs && v.eqs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start", fontSize: 18, color: "#0f172a", maxWidth: "100%", overflowX: "auto" }}>
          {v.eqs.map((e, i) => {
            // "M: α + γ = 0" has a coloured column label; a whole chain "[F] = [ma] = …" is just maths
            const m = e.match(/^([MLT]): (.*)$/);
            const col = m ? BASE.indexOf(m[1] as "M" | "L" | "T") : -1;
            return (
              <div key={i} style={{ whiteSpace: "nowrap", opacity: !m || cols.size === 0 || cols.size > 1 || cols.has(col as 0) ? 1 : 0.55 }}>
                {m ? (<><span style={{ fontWeight: 700, color: TONE[col] }}>{m[1]}:</span> <Tex t={m[2]} /></>) : <Tex t={e} />}
              </div>
            );
          })}
        </div>
      )}
      {v?.note && <div style={{ fontSize: 18, fontWeight: 700, color: "#166534", background: "#dcfce7", borderRadius: 8, padding: "6px 14px", textAlign: "center" }}><Tex t={v.note} /></div>}
    </div>
  );
}
