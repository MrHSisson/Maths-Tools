import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { MathRenderer } from "../shared/components/MathRenderer";
import { loadKaTeX } from "../shared/katex";

// ─────────────────────────────────────────────────────────────────────────────
// The equation editor: a visual maths field (MathLive) where a fraction, power or root is typed as it looks, a
// palette of the structures a maths teacher reaches for, and the LaTeX underneath for anyone who prefers it.
// MathLive is loaded only when the editor opens, and reuses the KaTeX fonts the site already bundles (no CDN).
// Slides draw maths with KaTeX, so the result is checked with KaTeX before it can be used.
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = () => window as any;
const kErr = (latex: string): string | null => {
  const k = w().katex;
  if (!k || !latex.trim()) return null;
  try { k.renderToString(latex, { throwOnError: true }); return null; } catch (e) { return String((e as Error).message ?? e).replace(/^KaTeX parse error: /, ""); }
};

/** `#0` is where the selection goes, `#?` an empty box to fill (MathLive's insert syntax). `show` is what the button draws. */
const PALETTE: { group: string; items: { show: string; insert: string; title: string }[] }[] = [
  { group: "Structure", items: [
    { show: "\\frac{a}{b}", insert: "\\frac{#0}{#?}", title: "Fraction" },
    { show: "2\\tfrac{1}{3}", insert: "#?\\tfrac{#?}{#?}", title: "Mixed number" },
    { show: "x^{n}", insert: "#0^{#?}", title: "Power" },
    { show: "x_{n}", insert: "#0_{#?}", title: "Subscript" },
    { show: "\\sqrt{x}", insert: "\\sqrt{#0}", title: "Square root" },
    { show: "\\sqrt[n]{x}", insert: "\\sqrt[#?]{#0}", title: "Root" },
    { show: "(x)", insert: "\\left(#0\\right)", title: "Brackets" },
    { show: "|x|", insert: "\\left|#0\\right|", title: "Modulus" },
    { show: "\\binom{a}{b}", insert: "\\begin{pmatrix}#?\\\\#?\\end{pmatrix}", title: "Column vector" },
    { show: "a\\times10^{n}", insert: "#?\\times10^{#?}", title: "Standard form" },
    { show: "0.\\dot{3}", insert: "\\dot{#?}", title: "Recurring dot" },
  ] },
  { group: "Symbols", items: [
    { show: "\\times", insert: "\\times", title: "Times" }, { show: "\\div", insert: "\\div", title: "Divide" },
    { show: "\\pm", insert: "\\pm", title: "Plus or minus" }, { show: "\\approx", insert: "\\approx", title: "Approximately" },
    { show: "\\neq", insert: "\\neq", title: "Not equal" }, { show: "\\leq", insert: "\\leq", title: "Less than or equal" },
    { show: "\\geq", insert: "\\geq", title: "Greater than or equal" }, { show: "\\pi", insert: "\\pi", title: "Pi" },
    { show: "\\theta", insert: "\\theta", title: "Theta" }, { show: "x^{\\circ}", insert: "^{\\circ}", title: "Degrees" },
    { show: "\\to", insert: "\\to", title: "Arrow" }, { show: "\\therefore", insert: "\\therefore", title: "Therefore" },
    { show: "\\square", insert: "\\square", title: "Box (a missing number)" },
  ] },
];

interface MathField extends HTMLElement { value: string; executeCommand: (c: unknown) => boolean; focus: () => void }

export function EquationEditor({ initial, title = "Equation", action = "Use this", onDone, onClose }: {
  initial: string; title?: string; action?: string; onDone: (latex: string) => void; onClose: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const field = useRef<MathField | null>(null);
  const [latex, setLatex] = useState(initial);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let gone = false;
    void (async () => {
      try {
        await loadKaTeX();
        const ml = await import("mathlive");
        if (gone || !host.current) return;
        ml.MathfieldElement.fontsDirectory = null;      // the KaTeX fonts are already on the page
        ml.MathfieldElement.soundsDirectory = null;
        const mf = new ml.MathfieldElement() as unknown as MathField;
        mf.value = initial;
        mf.style.cssText = "display:block;width:100%;font-size:2rem;padding:12px 14px;border:1px solid #cbd5e1;border-radius:12px;";
        mf.addEventListener("input", () => setLatex(mf.value));
        host.current.replaceChildren(mf);
        field.current = mf;
        setReady(true);
        requestAnimationFrame(() => mf.focus());
      } catch { setFailed(true); }
    })();
    return () => { gone = true; };
  }, [initial]);

  const insert = (s: string) => { const mf = field.current; if (!mf) return; mf.executeCommand(["insert", s, { focus: true }]); setLatex(mf.value); mf.focus(); };
  const typed = (s: string) => { setLatex(s); if (field.current) field.current.value = s; };
  const err = kErr(latex);

  return (
    <div className="fixed inset-0 z-[3100] flex items-center justify-center bg-slate-900/40 p-4" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl border border-slate-300 bg-white p-5 shadow-lift">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="ml-auto rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>
        <p className="mt-1 text-sm text-slate-500">Type as it looks: <b>/</b> makes a fraction, <b>^</b> a power, arrow keys move between the boxes. Or pick from below.</p>
        {/* MathLive owns this box's contents, so React never puts anything inside it */}
        <div ref={host} className="mt-3" />
        {!ready && !failed && <div className="py-4 text-sm text-slate-400">Loading…</div>}
        {failed && <div className="mt-2 text-sm text-amber-700">The visual editor could not load; type LaTeX below instead.</div>}
        {PALETTE.map((g) => (
          <div key={g.group} className="mt-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{g.group}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {g.items.map((it) => (
                <button key={it.title} title={it.title} onPointerDown={(e) => e.preventDefault()} onClick={() => (field.current ? insert(it.insert) : typed(latex + it.insert.replace(/#0|#\?/g, "{}")))}
                  className="flex h-11 min-w-[2.75rem] items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-lg hover:bg-slate-50"><MathRenderer latex={it.show} /></button>
              ))}
            </div>
          </div>
        ))}
        <details className="mt-3" open={failed}>
          <summary className="cursor-pointer text-xs font-semibold text-slate-500">LaTeX</summary>
          <input value={latex} onChange={(e) => typed(e.target.value)} spellCheck={false} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 font-mono text-sm" />
        </details>
        {failed && latex && !err && <div className="mt-2 text-2xl"><MathRenderer latex={latex} /></div>}
        {err && <div className="mt-2 text-xs text-red-600">{err}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button disabled={!latex.trim() || !!err} onClick={() => onDone(latex)} className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40">{action}</button>
        </div>
      </div>
    </div>
  );
}
