import { Home, Layers } from "lucide-react";
import {
  MathRenderer,
  workings, quadraticFormulaSteps, solveLinearEquationSteps, solveFactorsSteps,
  substituteBackSteps, makeSubjectSteps, solveLinearlySteps,
  type WorkingStep, type Grain,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TECHNIQUE LIBRARY — a browsable, dev-mode view of every technique in
// src/shared/techniques, rendered on sample inputs so the pedagogy (titles +
// live-model fragments) is visible and reviewable, like the /skills page for
// skills. Registered enabled:false, so it only shows in Developing-tools mode.
// ═══════════════════════════════════════════════════════════════════════════════

interface Demo {
  name: string;
  desc: string;
  call: string;
  steps: WorkingStep[];
}

const DEMOS: Demo[] = [
  {
    name: "quadraticFormulaSteps(a, b, c, v)",
    desc: "Solve a quadratic with the formula — state it, substitute a, b, c in, then simplify the discriminant.",
    call: "quadraticFormulaSteps(2, 4, -8, \"x\")",
    steps: quadraticFormulaSteps(2, 4, -8, "x"),
  },
  {
    name: "solveFactorsSteps(roots, v)",
    desc: "Set each factor of a factorised expression to zero and read off the roots.",
    call: "solveFactorsSteps([\"1\", \"6\"], \"x\")",
    steps: solveFactorsSteps(["1", "6"], "x"),
  },
  {
    name: "substituteBackSteps(varName, body, { value, into })",
    desc: "Substitute a found value back to get the other unknown. Each line in body is its own row; the title names the value and the equation when given.",
    call: "substituteBackSteps(\"m\", [\"m = 5n + 2\", \"m = 20 + 2\", \"m = 22\"], { value: \"n = 4\", into: \"m = 5n + 2\" })",
    steps: substituteBackSteps("m", ["m = 5n + 2", "m = 20 + 2", "m = 22"], { value: "n = 4", into: "m = 5n + 2" }),
  },
  {
    name: "makeSubjectSteps(varName, resultLatex, eqLabel?)",
    desc: "Rearrange an equation to make a variable the subject.",
    call: "makeSubjectSteps(\"m\", \"m = 5n + 2\")",
    steps: makeSubjectSteps("m", "m = 5n + 2"),
  },
  {
    name: "solveLinearlySteps(v, chain)",
    desc: "Solve a linear equation — one row per move (they are separate equations, not one built-up line).",
    call: "solveLinearlySteps(\"n\", [\"30n + 12 + 4n = 148\", \"34n = 136\", \"n = 136 \\\\div 34\", \"n = 4\"])",
    steps: solveLinearlySteps("n", ["30n + 12 + 4n = 148", "34n = 136", "n = 136 \\div 34", "n = 4"]),
  },
];

// A whole method assembled through the workings() builder, to show composition.
const FULL_EXAMPLE = workings()
  .use(makeSubjectSteps("m", "m = 5n + 2"))
  .step("Substitute equation (2) into equation (1)", ["6(5n+2) + 4n = 148"])
  .use(solveLinearlySteps("n", ["30n + 12 + 4n = 148", "34n = 136", "n = 4"]))
  .use(substituteBackSteps("m", ["m = 5(4) + 2", "m = 22"], { value: "n = 4", into: "m = 5n + 2" }))
  .build();

const StepView = ({ s, i }: { s: WorkingStep; i: number }) => {
  const isNote = s.type === "tStep";
  const frags = s.frags && s.frags.length > 1 ? s.frags : null;
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Step {i + 1}</div>
      {s.label && <div className="text-slate-800 font-semibold mb-1.5">{s.label}</div>}
      {isNote ? (
        <div className="text-slate-600">{s.plain}</div>
      ) : (
        <div className="text-slate-900 text-lg"><MathRenderer latex={s.latex} /></div>
      )}
      {frags && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-slate-500">
          <span className="text-[11px] font-bold uppercase tracking-wide text-blue-500">Reveals in {frags.length}:</span>
          {frags.map((f, fi) => (
            <span key={fi} className="flex items-center gap-2">
              {fi > 0 && <span className="text-slate-300">›</span>}
              <span className="rounded bg-white border border-slate-200 px-2 py-0.5 text-sm"><MathRenderer latex={f} /></span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// The same move rendered at all three grains, side by side — the headline idea.
interface GrainDemo {
  name: string;
  desc: string;
  render: (grain: Grain) => WorkingStep[];
}
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

const GRAIN_META: Record<Grain, { label: string; hue: string }> = {
  brief: { label: "Brief", hue: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  standard: { label: "Standard", hue: "text-amber-600 bg-amber-50 border-amber-200" },
  full: { label: "Full", hue: "text-rose-600 bg-rose-50 border-rose-200" },
};

const GrainLadder = ({ demo }: { demo: GrainDemo }) => (
  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100">
      <h3 className="text-lg font-bold text-blue-900 font-mono">{demo.name}</h3>
      <p className="text-sm text-slate-500 mt-1">{demo.desc}</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {(["brief", "standard", "full"] as Grain[]).map((g) => (
        <div key={g} className="flex flex-col gap-2">
          <span className={`self-start text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${GRAIN_META[g].hue}`}>{GRAIN_META[g].label}</span>
          {demo.render(g).map((s, i) => <StepView key={i} s={s} i={i} />)}
        </div>
      ))}
    </div>
  </div>
);

const Card = ({ title, subtitle, call, steps }: { title: string; subtitle?: string; call?: string; steps: WorkingStep[] }) => (
  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100">
      <h3 className="text-lg font-bold text-blue-900 font-mono">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      {call && <pre className="mt-2 text-xs bg-slate-900 text-slate-100 rounded-lg px-3 py-2 overflow-x-auto">{call}</pre>}
    </div>
    <div className="px-6 py-4 flex flex-col gap-2">
      {steps.map((s, i) => <StepView key={i} s={s} i={i} />)}
    </div>
  </div>
);

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-900 text-white flex items-center justify-center"><Layers size={22} /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Technique Library</h1>
              <p className="text-sm text-slate-500">Reusable pedagogical working-step blocks — the engine behind natural worked examples.</p>
            </div>
          </div>
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold hover:border-blue-900 hover:text-blue-900">
            <Home size={18} /> Home
          </button>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-6 py-4 mb-6 text-sm text-slate-700">
          A <strong>technique</strong> encodes the pedagogy of one recurring maths move — its step titles and its
          live-model fragments — once, so every tool that performs the move gets complete, natural working. Tools
          assemble them through the <code className="font-mono">workings()</code> builder. Blocks marked
          <span className="text-blue-600 font-semibold"> “Reveals in N”</span> are written as fragments that appear one
          per press in the step-by-step Worked Example, and join into a single line everywhere else.
        </div>

        <h2 className="text-lg font-bold text-slate-800 mb-3">Grain — the same move at three levels of detail</h2>
        <p className="text-sm text-slate-500 mb-4">
          A tool picks the grain that suits its context: a prerequisite it doesn’t teach renders <strong>brief</strong>;
          the move being taught (or a skill) renders <strong>full</strong>. The <strong>full</strong> grain is the
          fundamental teaching pattern — the text spine of the matching skill.
        </p>
        <div className="flex flex-col gap-6 mb-8">
          {GRAIN_DEMOS.map((d) => <GrainLadder key={d.name} demo={d} />)}
        </div>

        <h2 className="text-lg font-bold text-slate-800 mb-3">All techniques</h2>
        <div className="flex flex-col gap-6">
          {DEMOS.map((d) => (
            <Card key={d.name} title={d.name} subtitle={d.desc} call={d.call} steps={d.steps} />
          ))}
          <Card
            title="workings() — full method"
            subtitle="A complete linear-substitution solution assembled from technique blocks + bespoke steps. The answer is shown once by the tool's answer box, never restated here."
            steps={FULL_EXAMPLE}
          />
        </div>
      </div>
    </div>
  );
}
