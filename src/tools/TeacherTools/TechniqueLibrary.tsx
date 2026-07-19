import { useEffect } from "react";
import { Home, Layers } from "lucide-react";
import {
  MathRenderer, loadKaTeX,
  workings, quadraticFormulaSteps, solveLinearEquationSteps, solveFactorsSteps,
  substituteBackSteps, makeSubjectSteps, solveLinearlySteps,
  type WorkingStep, type Grain,
} from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// TECHNIQUE LIBRARY — browse every technique in src/shared/techniques, rendered
// on sample inputs so the titles and live-model fragments are visible. The
// working-step sibling of the Skill Library, and styled to match it. Registered
// enabled:false, so it only shows in Developing-tools mode.
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT = "#9333ea"; // purple-600 — the Algebra strand accent (techniques are algebra-heavy)

// ── One rendered step (title + maths, with a fragment breakdown when live-modelled) ──
const StepView = ({ s, i }: { s: WorkingStep; i: number }) => {
  const isNote = s.type === "tStep";
  const frags = s.frags && s.frags.length > 1 ? s.frags : null;
  return (
    <div className="rounded-lg bg-[#faf8f5] border border-gray-200 px-4 py-3">
      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Step {i + 1}</div>
      {s.label && <div className="text-gray-800 font-semibold mb-1.5">{s.label}</div>}
      {isNote
        ? <div className="text-gray-600">{s.plain}</div>
        : <div className="text-gray-900 text-lg"><MathRenderer latex={s.latex} /></div>}
      {frags && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: ACCENT }}>Reveals in {frags.length}:</span>
          {frags.map((f, fi) => (
            <span key={fi} className="flex items-center gap-2">
              {fi > 0 && <span className="text-gray-300">›</span>}
              <span className="rounded bg-white border border-gray-200 px-2 py-0.5 text-sm"><MathRenderer latex={f} /></span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ── The grain ladder: one move at three grains, side by side ──
interface GrainDemo { name: string; desc: string; render: (grain: Grain) => WorkingStep[]; }
const GRAIN_DEMOS: GrainDemo[] = [
  {
    name: "quadraticFormulaSteps(2, 4, -8)",
    desc: "Solving a quadratic with the formula. Brief assumes the substitution; full is the skill-level teaching (discriminant, ± split, decimals).",
    render: (g) => quadraticFormulaSteps(2, 4, -8, "x", g),
  },
  {
    name: "solveLinearEquationSteps(2, 3, 11)",
    desc: "Solving 2x + 3 = 11. Full names each both-sides move — the fundamental teaching pattern; brief just states the answer.",
    render: (g) => solveLinearEquationSteps(2, 3, 11, "x", g),
  },
];

// A depth ramp (light → deep) — reads as "more detail", and stays clear of the
// green/amber/red Level colours so grain is never mistaken for difficulty.
const GRAIN_META: Record<Grain, { label: string; cls: string }> = {
  brief: { label: "Brief", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  standard: { label: "Standard", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  full: { label: "Full", cls: "bg-blue-900 text-white border-blue-900" },
};

const GrainLadder = ({ demo }: { demo: GrainDemo }) => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ borderLeft: `6px solid ${ACCENT}` }}>
    <div className="px-6 py-4 border-b border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 font-mono">{demo.name}</h3>
      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{demo.desc}</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
      {(["brief", "standard", "full"] as Grain[]).map((g) => (
        <div key={g} className="flex flex-col gap-2">
          <span className={`self-start text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${GRAIN_META[g].cls}`}>{GRAIN_META[g].label}</span>
          {demo.render(g).map((s, i) => <StepView key={i} s={s} i={i} />)}
        </div>
      ))}
    </div>
  </div>
);

// ── A single-grain technique card ──
interface Demo { name: string; desc: string; call: string; steps: WorkingStep[]; }
const DEMOS: Demo[] = [
  { name: "solveFactorsSteps(roots, v)", desc: "Set each factor of a factorised expression to zero and read off the roots.",
    call: "solveFactorsSteps([\"1\", \"6\"], \"x\")", steps: solveFactorsSteps(["1", "6"], "x") },
  { name: "substituteBackSteps(varName, body, ctx)", desc: "Substitute a found value back to get the other unknown; the title names the value and the equation.",
    call: "substituteBackSteps(\"m\", [\"m = 5(4) + 2\", \"m = 22\"], { value: \"n = 4\", into: \"m = 5n + 2\" })",
    steps: substituteBackSteps("m", ["m = 5(4) + 2", "m = 22"], { value: "n = 4", into: "m = 5n + 2" }) },
  { name: "makeSubjectSteps(varName, resultLatex)", desc: "Rearrange an equation to make a variable the subject.",
    call: "makeSubjectSteps(\"m\", \"m = 5n + 2\")", steps: makeSubjectSteps("m", "m = 5n + 2") },
  { name: "solveLinearlySteps(v, chain)", desc: "Solve a linear equation from a pre-built chain — one row per move.",
    call: "solveLinearlySteps(\"n\", [\"34n = 136\", \"n = 4\"])", steps: solveLinearlySteps("n", ["34n = 136", "n = 4"]) },
];

const FULL_EXAMPLE = workings()
  .use(makeSubjectSteps("m", "m = 5n + 2"))
  .step("Substitute equation (2) into equation (1)", ["6(5n+2) + 4n = 148"])
  .use(solveLinearlySteps("n", ["30n + 12 + 4n = 148", "34n = 136", "n = 4"]))
  .use(substituteBackSteps("m", ["m = 5(4) + 2", "m = 22"], { value: "n = 4", into: "m = 5n + 2" }))
  .build();

const Card = ({ name, desc, call, steps }: Demo) => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ borderLeft: `6px solid ${ACCENT}` }}>
    <div className="px-6 py-4 border-b border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 font-mono">{name}</h3>
      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{desc}</p>
      {call && <code className="inline-block mt-2 text-xs bg-gray-100 text-gray-700 rounded px-2 py-1 font-mono break-all">{call}</code>}
    </div>
    <div className="px-6 py-4 flex flex-col gap-2">
      {steps.map((s, i) => <StepView key={i} s={s} i={i} />)}
    </div>
  </div>
);

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-4 mb-6">
    <h2 className="text-2xl font-bold" style={{ color: ACCENT }}>{children}</h2>
    <div className="flex-1 h-px bg-gray-300" />
  </div>
);

export default function App() {
  useEffect(() => { loadKaTeX(); }, []);
  const count = GRAIN_DEMOS.length + DEMOS.length;
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
            <span className="font-semibold">{count} techniques</span>
          </div>
        </div>
      </div>
      <div className="min-h-screen p-8" style={{ backgroundColor: "#f5f3f0" }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-4" style={{ color: "#000" }}>Technique Library</h1>
          <p className="text-center text-gray-500 text-lg mb-10 max-w-2xl mx-auto">
            Reusable working-step blocks — the engine behind natural worked examples. Each encodes
            one recurring maths move once, so every tool that performs it gets complete, titled,
            live-modelled working.
          </p>

          <section className="mb-12">
            <SectionHeader>Grain — one move, three levels of detail</SectionHeader>
            <p className="text-gray-500 mb-6 max-w-3xl">
              A tool picks the grain that suits its context: a prerequisite it doesn't teach renders <strong>brief</strong>;
              the move being taught (or a skill) renders <strong>full</strong> — the fundamental teaching pattern.
            </p>
            <div className="flex flex-col gap-6">
              {GRAIN_DEMOS.map((d) => <GrainLadder key={d.name} demo={d} />)}
            </div>
          </section>

          <section className="mb-12">
            <SectionHeader>All techniques</SectionHeader>
            <div className="flex flex-col gap-6">
              {DEMOS.map((d) => <Card key={d.name} {...d} />)}
              <Card name="workings() — full method" call=""
                desc="A complete linear-substitution solution assembled from technique blocks + bespoke steps. The answer is shown once by the tool's answer box, never restated here."
                steps={FULL_EXAMPLE} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
