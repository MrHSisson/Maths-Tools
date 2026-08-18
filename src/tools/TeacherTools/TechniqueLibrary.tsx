import { useEffect } from "react";
import { Home, Layers } from "lucide-react";
import {
  loadKaTeX,
  workings, quadraticFormulaSteps, solveLinearEquationSteps, solveFactorsSteps,
  substituteBackSteps, makeSubjectSteps, solveLinearlySteps,
  type WorkingStep, type Grain,
} from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// TECHNIQUE LIBRARY — browse every technique in src/shared/techniques. The
// working-step sibling of the Skill Library, and structured to match it: an
// index of cards, click one to go to its own real tool page — an accurate
// preview rendered through the SAME WorkedExampleSteps component every real
// tool uses (see TechniquePreviewPage). (Two earlier shapes: a flat dump of
// every technique's full step output on one page, titled with raw function
// signatures — stopped scaling almost immediately; then a near-fullscreen
// popup overlay per card — dropped once every technique got its own page,
// since a page gives an honest URL, no popup chrome, and matches what a
// teacher actually sees in a real Worked Example.)
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT = "#9333ea"; // purple-600 — the Algebra strand accent (techniques are algebra-heavy)

// ── Technique definitions — data only, feeds the index grid ──
interface TechniqueDef {
  id: string;
  /** Human-facing name — what the card leads with. */
  title: string;
  /** The underlying function call, shown small/secondary (dev-facing detail,
   *  not the headline) so the raw signature never has to double as a name. */
  signature: string;
  desc: string;
  /** Present (true) for techniques that take a Grain param — used for the
   *  card's "3 grains" badge; the page itself owns the actual picker. */
  grains?: true;
  render: (grain: Grain) => WorkingStep[];
  /** This technique's own real tool page — every technique has one. */
  pageUrl: string;
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
    pageUrl: "/techniques/quadratic-formula",
  },
  {
    id: "solveLinearEquation", title: "Solving a Linear Equation", grains: true,
    signature: "solveLinearEquationSteps(2, 3, 11)",
    desc: "Solving 2x + 3 = 11. Full names each both-sides move — the fundamental teaching pattern; brief just states the answer.",
    render: (g) => solveLinearEquationSteps(2, 3, 11, "x", g),
    pageUrl: "/techniques/solving-a-linear-equation",
  },
  {
    id: "solveFactors", title: "Reading Roots from Factors",
    signature: "solveFactorsSteps([\"1\", \"6\"], \"x\")",
    desc: "Set each factor of a factorised expression to zero and read off the roots.",
    render: () => solveFactorsSteps(["1", "6"], "x"),
    pageUrl: "/techniques/reading-roots-from-factors",
  },
  {
    id: "substituteBack", title: "Substituting Back",
    signature: "substituteBackSteps(\"m\", [...], { value, into })",
    desc: "Substitute a found value back to get the other unknown; the title names the value and the equation.",
    render: () => substituteBackSteps("m", ["m = 5(4) + 2", "m = 22"], { value: "n = 4", into: "m = 5n + 2" }),
    pageUrl: "/techniques/substituting-back",
  },
  {
    id: "makeSubject", title: "Making the Subject",
    signature: "makeSubjectSteps(\"m\", \"m = 5n + 2\")",
    desc: "Rearrange an equation to make a variable the subject.",
    render: () => makeSubjectSteps("m", "m = 5n + 2"),
    pageUrl: "/techniques/making-the-subject",
  },
  {
    id: "solveLinearly", title: "Solving a Linear Chain",
    signature: "solveLinearlySteps(\"n\", [...])",
    desc: "Solve a linear equation from a pre-built chain — one row per move.",
    render: () => solveLinearlySteps("n", ["34n = 136", "n = 4"]),
    pageUrl: "/techniques/solving-a-linear-chain",
  },
  {
    id: "fullExample", title: "Full Worked Example",
    signature: "workings() — full method",
    desc: "A complete linear-substitution solution assembled from technique blocks + bespoke steps — shows how a real tool composes them.",
    render: () => FULL_EXAMPLE,
    pageUrl: "/techniques/full-worked-example",
  },
];

// ── Index card — no step content, just enough to decide what to open, then
// navigates straight to the technique's own page.
const TechniqueCard = ({ t }: { t: TechniqueDef }) => {
  const stepCount = t.render("standard").length;
  return (
    <button onClick={() => { window.location.href = t.pageUrl; }}
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

export default function App() {
  useEffect(() => { loadKaTeX(); }, []);

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
            {TECHNIQUES.map((t) => <TechniqueCard key={t.id} t={t} />)}
          </div>
        </div>
      </div>
    </>
  );
}
