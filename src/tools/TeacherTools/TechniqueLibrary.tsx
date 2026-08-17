import { useState, useEffect } from "react";
import { Home, Layers, X } from "lucide-react";
import {
  MathRenderer, loadKaTeX, WorkedExampleSteps, getQuestionBg,
  workings, quadraticFormulaSteps, solveLinearEquationSteps, solveFactorsSteps,
  substituteBackSteps, makeSubjectSteps, solveLinearlySteps,
  type WorkingStep, type Grain,
} from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// TECHNIQUE LIBRARY — browse every technique in src/shared/techniques. The
// working-step sibling of the Skill Library, and structured to match it: an
// index of cards, click one to open an accurate preview, sized close to
// full-screen the same way the Skill Library's slide overlay is. (An earlier
// version dumped every technique's full step output inline on one page — a
// 3-column brief/standard/full ladder plus a flat card per technique, each
// titled with its raw function-call signature. That stopped scaling almost
// immediately, and the signatures read as backend detail, not a front-of-house
// name. The index+overlay shape here is the fix, and doubles as the honest
// preview — the overlay renders through the SAME WorkedExampleSteps component
// every real tool uses.)
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT = "#9333ea"; // purple-600 — the Algebra strand accent (techniques are algebra-heavy)

// A depth ramp (light → deep) — reads as "more detail", and stays clear of the
// green/amber/red Level colours so grain is never mistaken for difficulty.
const GRAIN_META: Record<Grain, { label: string }> = {
  brief: { label: "Brief" },
  standard: { label: "Standard" },
  full: { label: "Full" },
};
const LAYOUT_META: Record<"single" | "stacked", string> = {
  single: "Single card",
  stacked: "Stacked",
};

// ── Technique definitions — data only, feeds both the index grid and the overlay ──
interface TechniqueDef {
  id: string;
  /** Human-facing name — what the card and overlay lead with. */
  title: string;
  /** The underlying function call, shown small/secondary (dev-facing detail,
   *  not the headline) so the raw signature never has to double as a name. */
  signature: string;
  desc: string;
  /** Present (true) for techniques that take a Grain param — gets the picker. */
  grains?: true;
  render: (grain: Grain) => WorkingStep[];
}

const FULL_EXAMPLE = workings()
  .use(makeSubjectSteps("m", "m = 5n + 2"))
  .step("Substitute equation (2) into equation (1)", ["6(5n+2) + 4n = 148"])
  .use(solveLinearlySteps("n", ["30n + 12 + 4n = 148", "34n = 136", "n = 4"]))
  .use(substituteBackSteps("m", ["m = 5(4) + 2", "m = 22"], { value: "n = 4", into: "m = 5n + 2" }))
  .build();

const TECHNIQUES: TechniqueDef[] = [
  {
    id: "quadraticFormula", title: "Quadratic Formula", grains: true,
    signature: "quadraticFormulaSteps(2, 4, -8)",
    desc: "Solving a quadratic with the formula. Brief assumes the substitution; full is the skill-level teaching (discriminant, ± split, decimals).",
    render: (g) => quadraticFormulaSteps(2, 4, -8, "x", g),
  },
  {
    id: "solveLinearEquation", title: "Solving a Linear Equation", grains: true,
    signature: "solveLinearEquationSteps(2, 3, 11)",
    desc: "Solving 2x + 3 = 11. Full names each both-sides move — the fundamental teaching pattern; brief just states the answer.",
    render: (g) => solveLinearEquationSteps(2, 3, 11, "x", g),
  },
  {
    id: "solveFactors", title: "Reading Roots from Factors",
    signature: "solveFactorsSteps([\"1\", \"6\"], \"x\")",
    desc: "Set each factor of a factorised expression to zero and read off the roots.",
    render: () => solveFactorsSteps(["1", "6"], "x"),
  },
  {
    id: "substituteBack", title: "Substituting Back",
    signature: "substituteBackSteps(\"m\", [...], { value, into })",
    desc: "Substitute a found value back to get the other unknown; the title names the value and the equation.",
    render: () => substituteBackSteps("m", ["m = 5(4) + 2", "m = 22"], { value: "n = 4", into: "m = 5n + 2" }),
  },
  {
    id: "makeSubject", title: "Making the Subject",
    signature: "makeSubjectSteps(\"m\", \"m = 5n + 2\")",
    desc: "Rearrange an equation to make a variable the subject.",
    render: () => makeSubjectSteps("m", "m = 5n + 2"),
  },
  {
    id: "solveLinearly", title: "Solving a Linear Chain",
    signature: "solveLinearlySteps(\"n\", [...])",
    desc: "Solve a linear equation from a pre-built chain — one row per move.",
    render: () => solveLinearlySteps("n", ["34n = 136", "n = 4"]),
  },
  {
    id: "fullExample", title: "Full Worked Example",
    signature: "workings() — full method",
    desc: "A complete linear-substitution solution assembled from technique blocks + bespoke steps — shows how a real tool composes them.",
    render: () => FULL_EXAMPLE,
  },
];

// ── Index card — no step content, just enough to decide what to open ──
const TechniqueCard = ({ t, onOpen }: { t: TechniqueDef; onOpen: () => void }) => {
  const stepCount = t.render("standard").length;
  return (
    <button onClick={onOpen}
      className="group bg-white rounded-xl shadow-lg p-6 text-left transition-all hover:shadow-xl hover:-translate-y-0.5 flex flex-col gap-2"
      style={{ borderLeft: `6px solid ${ACCENT}` }}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xl font-bold text-gray-900 group-hover:text-blue-900 transition-colors">{t.title}</span>
        <span className="text-xs font-bold uppercase tracking-wider flex-shrink-0 mt-1" style={{ color: ACCENT }}>
          {t.grains ? "3 grains" : `${stepCount} step${stepCount !== 1 ? "s" : ""}`}
        </span>
      </div>
      <p className="text-sm text-gray-500 leading-relaxed">{t.desc}</p>
      <code className="text-xs text-gray-400 font-mono break-all mt-1">{t.signature}</code>
    </button>
  );
};

// ── Overlay — the accurate, near-full-screen preview for ONE technique,
// rendered through the real WorkedExampleSteps viewer. Sized to match the
// Skill Library's own slide overlay (near-fullscreen, slim dimmed rim), not
// the old 3-columns-squeezed layout or a small cramped modal.
const TechniqueOverlay = ({ t, onClose }: { t: TechniqueDef; onClose: () => void }) => {
  const [grain, setGrain] = useState<Grain>("standard");
  const [layout, setLayout] = useState<"single" | "stacked">("stacked");
  const steps = t.render(t.grains ? grain : "standard");
  const lastLatex = steps.length ? steps[steps.length - 1].latex : "";

  return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 300, background: "rgba(15, 23, 42, 0.55)", padding: 12 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="rounded-2xl shadow-2xl w-full flex flex-col"
        style={{ maxWidth: 1200, height: "100%", backgroundColor: "#f5f3f0", padding: 16 }}>
        <div className="flex items-start justify-between gap-3 mb-1 flex-shrink-0">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: ACCENT }}>Technique</span>
            <h3 className="text-2xl font-bold text-gray-900">{t.title}</h3>
            <code className="text-xs text-gray-400 font-mono">{t.signature}</code>
          </div>
          <button onClick={onClose} title="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-3 flex-shrink-0">{t.desc}</p>
        <div className="flex flex-wrap items-center gap-3 mb-3 flex-shrink-0">
          {t.grains && (
            <div className="flex rounded-lg border-2 overflow-hidden" style={{ borderColor: "#d1d5db" }}>
              {(["brief", "standard", "full"] as Grain[]).map((g) => (
                <button key={g} onClick={() => setGrain(g)}
                  className="px-3 py-1.5 text-sm font-bold transition-colors"
                  style={{ background: grain === g ? "#1e3a8a" : "#fff", color: grain === g ? "#fff" : "#6b7280" }}>
                  {GRAIN_META[g].label}
                </button>
              ))}
            </div>
          )}
          <div className="flex rounded-lg border-2 overflow-hidden" style={{ borderColor: "#d1d5db" }}>
            {(["single", "stacked"] as const).map((l) => (
              <button key={l} onClick={() => setLayout(l)}
                className="px-3 py-1.5 text-sm font-bold transition-colors"
                style={{ background: layout === l ? ACCENT : "#fff", color: layout === l ? "#fff" : "#6b7280" }}
                title="Only visible difference is in Step-by-Step mode">
                {LAYOUT_META[l]}
              </button>
            ))}
          </div>
        </div>
        {/* flex flex-col + minHeight:0 gives WorkedExampleSteps' stacked layout a
            real, bounded height to fill (its own body scrolls + nav pins as a
            footer inside it). overflow-y-auto here too as a fallback for single
            layout, which doesn't bound its own height — harmless when stacked,
            since the inner flex chain already keeps it from ever overflowing. */}
        <div className="flex-1 overflow-y-auto rounded-xl p-6 flex flex-col" style={{ backgroundColor: getQuestionBg("default"), minHeight: 0 }}>
          <WorkedExampleSteps
            working={steps}
            renderAnswer={() => <MathRenderer latex={lastLatex} />}
            colorScheme="default"
            answerFontClass="text-3xl"
            stepThroughEnabled
            resetKey={`${t.id}-${grain}`}
            layout={layout}
          />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  useEffect(() => { loadKaTeX(); }, []);
  const [openId, setOpenId] = useState<string | null>(null);
  const openTechnique = TECHNIQUES.find((t) => t.id === openId) ?? null;

  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => { window.location.href = "/"; }}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} /><span className="font-semibold text-lg">Home</span>
          </button>
          <div className="flex items-center gap-2 text-blue-200">
            <Layers size={20} />
            <span className="font-semibold">{TECHNIQUES.length} techniques</span>
          </div>
        </div>
      </div>
      {openTechnique && <TechniqueOverlay t={openTechnique} onClose={() => setOpenId(null)} />}
      <div className="min-h-screen p-8" style={{ backgroundColor: "#f5f3f0" }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-4" style={{ color: "#000" }}>Technique Library</h1>
          <p className="text-center text-gray-500 text-lg mb-10 max-w-2xl mx-auto">
            Reusable working-step blocks — the engine behind natural worked examples. Each encodes
            one recurring maths move once, so every tool that performs it gets complete, titled,
            live-modelled working. Click a card for an accurate preview — brief/standard/full where
            it applies, rendered through the real Worked Example viewer.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TECHNIQUES.map((t) => <TechniqueCard key={t.id} t={t} onOpen={() => setOpenId(t.id)} />)}
          </div>
        </div>
      </div>
    </>
  );
}
