import { useEffect, useState } from "react";
import { ChevronLeft, Check, Home, Info, ArrowRight, Presentation, Compass } from "lucide-react";
import { PAGE_BG } from "../../shared/colors";
import { useLayoutMode } from "../../shared/layoutMode";

// The simplex roadmap: the route a class follows through the simplex tools, stage by stage, the way it would follow a textbook chapter. Every practice button opens the Simplex tool on
// the sub-tool, level and option the stage needs (`?tool=…&level=…&o_…`, read by DecisionShell), so the page is the front door to the tool. Each stage says what it does and what it builds
// towards, and its scale (how many variables, in what form), so the route reads as one climb. The stages are data below; the written version with the reasoning is
// docs/roadmaps/linear-programming.md (keep the two in step). A tick on a stage is kept on this device only.
// Textbook exercises are given whole, after the route, and only where everything in them can be done (EXERCISES below); the question numbers were recorded when the chapters were read
// (specs/corpus/linear-programming-styles.md), so the page says to check them against your own copy.

const TOOL = "/lp-simplex";
const DECK = "/decks/lp-simplex-process";
const href = (tool: string, level: number, opts: Record<string, string> = {}): string =>
  `${TOOL}?tool=${tool}&level=${level}${Object.entries(opts).map(([k, v]) => `&o_${k}=${v}`).join("")}`;

interface Practice { label: string; sub: string; href: string; group?: string }
interface PlannedDeck { title: string; blurb: string }
interface Stage {
  n: number; title: string;
  /** how big the problems are at this stage: variables, and what the student is given */
  scale: string;
  /** one line for the overview strip */
  short: string;
  /** what this stage is doing, in a few sentences */
  does: string;
  can: string[]; practice: Practice[]; deck?: string; plannedDeck?: PlannedDeck; tip?: string;
  /** what the stage hands on to the next one */
  towards: string;
}

const STAGES: Stage[] = [
  {
    n: 1, title: "The start", scale: "2 variables · the inequalities given", short: "Build and read a tableau",
    does: "Turns a problem into the table the algorithm works on. Nothing is solved yet: students learn the language (slack variable, objective row, which variables are in the table's unit columns) and the layout, and practise reading a finished tableau back into values.",
    can: ["Add a slack variable to each constraint", "Write the objective as P − 2x − 3y = 0", "Write the initial tableau", "Read the value of every variable and of P from a tableau"],
    practice: [
      { label: "Set up the tableau", sub: "Level 1", href: href("setup", 1) },
      { label: "Read a tableau", sub: "Level 1: the optimal tableau", href: href("interpret", 1) },
    ],
    towards: "A student who can read a tableau can see what each row operation changes, which is what the next stage explains and the one after it practises.",
  },
  {
    n: 2, title: "Why it works", scale: "2 variables · the graph and the table together", short: "The idea before the procedure",
    does: "Gives the reasons before the rules. A tableau is a corner of the feasible region; a pivot moves to a neighbouring corner that is better; the algorithm stops when no neighbour improves P. The deck sets the graph beside the table so every step has a picture.",
    can: ["Say why the most negative entry is the way to go", "Say what the ratio test is for", "Say what the row operations do", "Say what the bottom row says when it stops"],
    practice: [], deck: DECK,
    tip: "Run this as the lesson on the board; there is no tool practice here.",
    towards: "The pivot rules arrive in the next stage as reasons, not recipes: why that column, why the smallest θ, why the pivot row is divided first.",
  },
  {
    n: 3, title: "One step, then the whole run", scale: "2 variables · one step, then to the optimum", short: "The procedure, on its own",
    does: "Practises the procedure with nothing else going on. First one pivot, with the pivot given so the arithmetic is separate from the choice, then the student chooses it, then the whole run to the optimum. Fractions and the θ-values are met here, on small numbers.",
    can: ["Choose the pivot column, then the row from the θ-values", "Divide the pivot row and clear the column", "Repeat until no negative is left in the objective row"],
    practice: [
      { label: "One pivot", sub: "Level 1, pivot given: the row operations only", href: href("pivot", 1, { sxPivot: "given" }), group: "One step" },
      { label: "One pivot", sub: "Level 1, the student chooses", href: href("pivot", 1), group: "One step" },
      { label: "Solve a problem", sub: "Level 1: two iterations", href: href("solve", 1), group: "The whole run" },
    ],
    towards: "A secure two-variable run is the base for everything after it: from here the problem changes, the procedure does not.",
  },
  {
    n: 4, title: "In words, three variables", scale: "3 variables · a story or a table", short: "A real situation, three variables",
    does: "The same procedure with a context. The problem arrives as a story or a table, so students must formulate, simplify and set up before they pivot, and read the answer back in the story: what each slack variable means, with its units. Three variables mean three pivots and a tableau they can no longer check on a graph.",
    can: ["Simplify the constraints and set up from a story", "Take three iterations", "Say what a slack variable means in the story, with its units", "Say why a tableau is not optimal"],
    practice: [
      { label: "Set up the tableau", sub: "Level 2", href: href("setup", 2), group: "Setting up" },
      { label: "One pivot", sub: "Level 2: part-way through a run", href: href("pivot", 2), group: "The run" },
      { label: "Solve a problem", sub: "Level 2: words or a table", href: href("solve", 2), group: "The run" },
      { label: "Read a tableau", sub: "Level 2: not yet optimal", href: href("interpret", 2), group: "Reading it back" },
    ],
    towards: "Students can now run the algorithm on a real problem and explain the answer. The next two stages ask harder questions of the answer and of the setup.",
  },
  {
    n: 5, title: "Whole numbers", scale: "2 to 3 variables · interpreting the answer", short: "Is the answer practical?",
    does: "Asks whether the answer makes sense. A fractional optimum cannot be made, so students use the optimum as an upper bound, look at the whole-number points near it and choose the best practical plan. It is a different kind of thinking from the algorithm, and the point where the tableau stops being the whole story.",
    can: ["Say why a fractional optimum is not practical", "Find the best whole-number plan (round down, add where there is room, check the bound)", "Know that rounding to the nearest can break a constraint"],
    practice: [
      { label: "Is it practical?", sub: "Level 1", href: href("practical", 1) },
      { label: "Is it practical?", sub: "Level 2", href: href("practical", 2) },
      { label: "Is it practical?", sub: "Level 3: rounding to the nearest breaks a constraint", href: href("practical", 3) },
    ],
    plannedDeck: { title: "Why rounding fails", blurb: "The graph with the whole-number points near the optimum: the bound, the points that fit, and why rounding to the nearest can break a constraint" },
    towards: "This closes the loop between the algorithm and the situation it came from; the last stage widens which problems the algorithm can be started on.",
  },
  {
    n: 6, title: "When it does not start at the origin", scale: "3 to 4 variables · a change of form first", short: "Minimise, ≥, bounds, equalities",
    does: "Problems the algorithm cannot start on as they stand. A minimise, a ≥ constraint, a lower bound or an equality each needs a change of form before the first pivot, and a tableau read backwards recovers the problem. Take the four forms one at a time before mixing them, and treat a lower bound or equation as a row only once the substitution method is secure.",
    can: ["Minimise by maximising P = −C", "Rewrite a ≥ constraint and start by pivoting on a negative entry", "Handle y ≥ 4 by Y = y − 4 or as one more constraint", "Handle an equation as two inequalities or as a row", "Go from a tableau back to the problem"],
    practice: [
      { label: "Solve: Minimise", sub: "Level 3", href: href("solve", 3, { sxForms: "min" }), group: "Each starting form on its own" },
      { label: "Solve: A ≥ constraint", sub: "Level 3", href: href("solve", 3, { sxForms: "ge" }), group: "Each starting form on its own" },
      { label: "Solve: A lower bound", sub: "Level 3", href: href("solve", 3, { sxForms: "lower" }), group: "Each starting form on its own" },
      { label: "Solve: An equality", sub: "Level 3", href: href("solve", 3, { sxForms: "eq" }), group: "Each starting form on its own" },
      { label: "Lower bound and equality as rows", sub: "Level 3, Method: Use As Rows", href: href("solve", 3, { sxForms: "lower,eq", sxMethod: "rows" }), group: "A second method" },
      { label: "One pivot", sub: "Level 3: a negative right-hand side", href: href("pivot", 3), group: "The start, and back again" },
      { label: "Read a tableau", sub: "Level 3: the problem the tableau shows", href: href("interpret", 3), group: "The start, and back again" },
    ],
    plannedDeck: { title: "Not starting at the origin", blurb: "The geometry of a ≥ constraint and a negative right-hand side, why the origin is not feasible, and why minimising is maximising −C" },
    towards: "The whole of DD3 and DD4 in one setting. What is left is the exam-style chain (below), which the tools do not build.",
  },
];

/** whole exercises only: placed where everything in them can be done */
const EXERCISES: Array<{ name: string; when?: string; why: string }> = [
  { name: "Cambridge Exercise 4C", when: "After stage 6", why: "Every question recorded from it (1 to 10) is a skill covered by the end of stage 6: the initial tableau, choosing the pivot, one iteration, solving, reading the values, a story with a zero slack, minimising, and the study-and-sleep problem. Question 8 also asks whether a different first pivot column changes the final tableau: students can try that by hand (the tool does not ask it)." },
  { name: "Cambridge Exercises 4A and 4B", why: "4A is formulating, which this route assumes, and 4B is solving graphically (including the whole-number question). They belong with formulating and the graphical tool, which is not built yet." },
  { name: "Cambridge Mixed practice", why: "It mixes graphical and simplex questions, so it can only be set once the graphical work is done as well." },
  { name: "Oxford Exercises 30.1A and 30.1B", why: "Parts of them fit stages 4, 5 and 6, but 30.1B includes a question about a miscopied number that makes the problem infeasible or unbounded, which neither the tools nor this route cover, so it cannot be set whole. 30.1A is still to be placed once its questions are checked against the book." },
];

const NOT_IN_TOOLS: Array<{ what: string; where: string }> = [
  { what: "The parameter k in a tableau, a tableau that shows the problem is unbounded, a miscopied number that makes it infeasible", where: "Cambridge MP12, MP6; Oxford Ex30.1B 12. Left for the exam-style pass." },
  { what: "The full exam chains", where: "Cambridge MP10 and MP11 are AQA past-paper questions. The tools build the skills; the chain is the exam-style pass, not built yet." },
  { what: "A zero-sum game as a linear programme", where: "Oxford section 30.2. It belongs to the game theory chapter." },
];

const ABOUT =
  "A route through the simplex tools for a class to follow in order. Each stage says what it is doing and what it builds towards, how big its problems are, and what students should be able to do; then it gives one button for each piece of practice, which opens the Simplex tool on the right sub-tool and level with the option the stage needs already set. " +
  "Levels do not overlap: when a stage is too easy go to the next level of the same sub-tool, not back. Textbook exercises are set whole, at the end, once everything in them can be done. " +
  "Option buttons with an asterisk in the tool are extensions that are unlikely to come up: leave them for the last. The ticks are kept on this device only.";

const KEY = "mt-lp-roadmap-done";
function readDone(): number[] {
  try { const v = JSON.parse(window.localStorage.getItem(KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "number") : []; } catch { return []; }
}

function PracticeButton({ p, go }: { p: Practice; go: (to: string) => void }) {
  return (
    <button type="button" onClick={() => go(p.href)} className="flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-left hover:bg-blue-50">
      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">{p.label}</span><span className="block text-xs text-slate-500">{p.sub}</span></span>
      <ArrowRight size={16} className="shrink-0 text-slate-400" />
    </button>
  );
}

export default function App() {
  const { phone } = useLayoutMode();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [done, setDone] = useState<number[]>([]);
  useEffect(() => { setDone(readDone()); }, []);
  const toggle = (n: number) => setDone((d) => {
    const next = d.includes(n) ? d.filter((x) => x !== n) : [...d, n];
    try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* the tick just is not remembered */ }
    return next;
  });
  const go = (to: string) => { window.location.href = to; };
  const jump = (n: number) => { document.getElementById(`stage-${n}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <div className={`mx-auto max-w-4xl ${phone ? "px-4 py-4" : "px-6 py-8"}`}>
        <div className="mb-3 flex items-center gap-4">
          <button onClick={() => go("/")} className="inline-flex items-center gap-2 rounded-xl py-1 pr-2 text-sm font-semibold text-slate-600 hover:text-slate-900"><Home size={18} /> Home</button>
          <button onClick={() => go("/decision-overview")} className="inline-flex items-center gap-1 rounded-xl py-1 pr-2 text-sm font-semibold text-slate-600 hover:text-slate-900"><ChevronLeft size={18} /> Decision Maths</button>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">The simplex roadmap</h1>
            <p className="mt-1 text-slate-500">Six stages, each building on the last. Every button opens the tool ready for that stage.</p>
          </div>
          <button type="button" onClick={() => setAboutOpen((o) => !o)} aria-expanded={aboutOpen} aria-label="About this roadmap"
            className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${aboutOpen ? "bg-blue-900 text-white" : "text-slate-400 hover:bg-slate-100 hover:text-blue-900"}`}>
            <Info size={20} />
          </button>
        </div>
        {aboutOpen && <p role="note" className="mt-3 rounded-xl bg-slate-900 p-3 text-sm leading-snug text-white">{ABOUT}</p>}

        {/* the whole climb at a glance: where each stage sits and how big its problems are */}
        <nav aria-label="The stages" className="mt-5 rounded-2xl border border-slate-300 bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">The route</h2>
            <span className="text-xs text-slate-500">{done.length} of {STAGES.length} done</span>
          </div>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((s) => {
              const ticked = done.includes(s.n);
              return (
                <li key={s.n}>
                  <button type="button" onClick={() => jump(s.n)} className="flex w-full items-start gap-3 rounded-xl border border-slate-200 px-3 py-2 text-left hover:bg-slate-50">
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${ticked ? "bg-emerald-600" : "bg-blue-900"}`}>{ticked ? <Check size={13} /> : s.n}</span>
                    <span className="min-w-0"><span className="block text-sm font-semibold text-slate-900">{s.title}</span><span className="block text-xs text-slate-500">{s.short}</span></span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-xs text-slate-500"><b className="font-semibold text-slate-600">Assumed:</b> formulating is done. Students can write a model from a story and read the corners of a region; this starts at the slack variables.</p>
        </nav>

        <ol className="mt-5 flex flex-col gap-3">
          {STAGES.map((s, idx) => {
            const ticked = done.includes(s.n);
            const groups = Array.from(new Set(s.practice.map((p) => p.group ?? "")));
            return (
              <li key={s.n} id={`stage-${s.n}`} className="scroll-mt-4">
                <div className={`rounded-2xl border bg-white shadow-card ${ticked ? "border-emerald-300" : "border-slate-300"}`}>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${ticked ? "bg-emerald-600 text-white" : "bg-blue-900 text-white"}`}>{ticked ? <Check size={16} /> : s.n}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="text-xl font-semibold text-slate-900">{s.title}</h2>
                            <span className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{s.scale}</span>
                          </div>
                          <button type="button" onClick={() => toggle(s.n)} aria-pressed={ticked}
                            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${ticked ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>{ticked ? "Done" : "Mark done"}</button>
                        </div>

                        <p className="mt-3 text-sm leading-relaxed text-slate-700">{s.does}</p>

                        <div className="mt-4 text-sm font-semibold text-slate-700">Students can…</div>
                        <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">{s.can.map((c) => <li key={c}>{c}</li>)}</ul>

                        {s.deck && (
                          <div className="mt-4">
                            <button type="button" onClick={() => go(s.deck!)} className="flex min-h-[48px] w-full items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-left hover:bg-blue-50 sm:w-1/2">
                              <Presentation size={18} className="shrink-0 text-blue-900" />
                              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">The deck: how the simplex works</span><span className="block text-xs text-slate-500">Lesson slides, the graph beside the table</span></span>
                              <ArrowRight size={16} className="shrink-0 text-slate-400" />
                            </button>
                          </div>
                        )}
                        {s.plannedDeck && (
                          <div className="mt-4">
                            <div aria-disabled className="flex min-h-[48px] w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-left sm:w-2/3">
                              <Presentation size={18} className="shrink-0 text-slate-300" />
                              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-500">Deck: {s.plannedDeck.title} <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">planned</span></span><span className="block text-xs text-slate-400">{s.plannedDeck.blurb}</span></span>
                            </div>
                          </div>
                        )}
                        {groups.map((g) => (
                          <div key={g} className="mt-4">
                            {g && <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{g}</div>}
                            <div className="grid gap-2 sm:grid-cols-2">{s.practice.filter((p) => (p.group ?? "") === g).map((p) => <PracticeButton key={p.label + p.sub} p={p} go={go} />)}</div>
                          </div>
                        ))}
                        {s.tip && <p className="mt-3 text-sm text-slate-500">{s.tip}</p>}

                      </div>
                    </div>
                  </div>
                  {/* what the stage hands on: the bridge to the next one */}
                  <div className="flex items-start gap-2 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:px-5">
                    <Compass size={16} className="mt-0.5 shrink-0 text-blue-900" />
                    <p><span className="font-semibold text-slate-800">{idx < STAGES.length - 1 ? "Builds towards stage " + STAGES[idx + 1].n + ". " : "Builds towards the exam. "}</span>{s.towards}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 rounded-2xl border border-slate-300 bg-white p-4 shadow-card sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">Textbook exercises</h2>
          <p className="mt-1 text-sm text-slate-600">Set a whole exercise, not single questions, and only once everything in it can be done. So they come at the end of the route, not stage by stage.</p>
          <ul className="mt-3 flex flex-col gap-3 text-sm text-slate-700">
            {EXERCISES.map((e) => (
              <li key={e.name}>
                <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-slate-900">{e.name}</span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.when ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{e.when ?? "not placed on this route"}</span></div>
                <p className="mt-0.5 text-slate-600">{e.why}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-400">Cambridge is chapter 4 of the Cambridge book; Oxford is chapter 30 of the Oxford book. The questions were recorded when the chapters were read: check an exercise against your own copy before you set it.</p>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-card sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">The gate at the end</h2>
          <p className="mt-1 text-sm text-slate-700">A student can take a worded problem, set it up, solve it by the tableau, state the answer in context with the meaning of each slack variable, and say whether it is practical.</p>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-card sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">Not in the tools: use the books</h2>
          <ul className="mt-2 flex flex-col gap-2 text-sm text-slate-700">
            {NOT_IN_TOOLS.map((n) => <li key={n.what}><span className="font-medium text-slate-800">{n.what}.</span> {n.where}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
