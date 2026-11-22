import { useEffect, useState } from "react";
import { ChevronLeft, Check, Home, Info, ArrowRight, BookOpen, Presentation } from "lucide-react";
import { PAGE_BG } from "../../shared/colors";
import { useLayoutMode } from "../../shared/layoutMode";

// The simplex roadmap: the route a class follows through the simplex tools, stage by stage, the way it would follow a textbook chapter. Every practice button opens the
// Simplex tool on the sub-tool, level and option the stage needs (`?tool=…&level=…&o_…`, read by DecisionShell), so the page is the front door to the tool.
// The stages are data below; the written version with the reasoning is docs/roadmaps/linear-programming.md (keep the two in step). A tick on a stage is kept on this device only.
// The textbook numbers were recorded when the chapters were read (specs/corpus/linear-programming-styles.md): the page says to check them against your own copy.

const TOOL = "/lp-simplex";
const DECK = "/decks/lp-simplex-process";
const href = (tool: string, level: number, opts: Record<string, string> = {}): string =>
  `${TOOL}?tool=${tool}&level=${level}${Object.entries(opts).map(([k, v]) => `&o_${k}=${v}`).join("")}`;

interface Practice { label: string; sub: string; href: string; note?: string }
interface Stop { book: "Cambridge" | "Oxford"; refs: string; what?: string }
interface Stage { n: number; title: string; blurb: string; can: string[]; practice: Practice[]; deck?: string; stops: Stop[]; tip?: string }

const STAGES: Stage[] = [
  {
    n: 1, title: "The start", blurb: "Slack variables, the objective row, the initial tableau, and reading one.",
    can: ["Add a slack variable to each constraint", "Write the objective as P − 2x − 3y = 0", "Write the initial tableau", "Read the value of every variable and of P from a tableau"],
    practice: [
      { label: "Set up the tableau", sub: "Level 1", href: href("setup", 1) },
      { label: "Read a tableau", sub: "Level 1: the optimal tableau", href: href("interpret", 1) },
    ],
    stops: [
      { book: "Cambridge", refs: "Ex4C 1", what: "the initial tableau" }, { book: "Cambridge", refs: "Ex4C 4", what: "read the values" },
      { book: "Cambridge", refs: "MP5", what: "equations with slack variables" }, { book: "Oxford", refs: "Assessment 1a", what: "name the slacks" },
    ],
  },
  {
    n: 2, title: "Why it works", blurb: "The idea before the procedure: the graph beside the table.",
    can: ["Say why the most negative entry is the way to go", "Say what the ratio test is for", "Say what the row operations do", "Say what the bottom row says when it stops"],
    practice: [], deck: DECK, stops: [{ book: "Cambridge", refs: "the deck's worked problem" }],
    tip: "Run this as the lesson on the board; there is no tool practice here.",
  },
  {
    n: 3, title: "One step, then the whole run", blurb: "The pivot, then every iteration to the optimum.",
    can: ["Choose the pivot column, then the row from the θ-values", "Divide the pivot row and clear the column", "Repeat until no negative is left in the objective row"],
    practice: [
      { label: "One pivot", sub: "Level 1, pivot given: the row operations only", href: href("pivot", 1, { sxPivot: "given" }) },
      { label: "One pivot", sub: "Level 1, the student chooses", href: href("pivot", 1) },
      { label: "Solve a problem", sub: "Level 1: two iterations", href: href("solve", 1) },
    ],
    stops: [
      { book: "Cambridge", refs: "Ex4C 2, 5", what: "choose the pivot" }, { book: "Cambridge", refs: "Ex4C 6", what: "one iteration" }, { book: "Cambridge", refs: "Ex4C 7", what: "solve" },
      { book: "Cambridge", refs: "WE4.12, 4.13, 4.15" }, { book: "Cambridge", refs: "MP2, MP8" },
    ],
  },
  {
    n: 4, title: "In words, three variables", blurb: "From a story or a table; what a slack means; not yet optimal.",
    can: ["Simplify the constraints and set up from a story", "Take three iterations", "Say what a slack variable means in the story, with its units", "Say why a tableau is not optimal"],
    practice: [
      { label: "Set up the tableau", sub: "Level 2", href: href("setup", 2) },
      { label: "One pivot", sub: "Level 2: part-way through a run", href: href("pivot", 2) },
      { label: "Solve a problem", sub: "Level 2: words or a table", href: href("solve", 2) },
      { label: "Read a tableau", sub: "Level 2: not yet optimal", href: href("interpret", 2) },
    ],
    stops: [
      { book: "Cambridge", refs: "Ex4C 8, 9, 10", what: "context; a zero slack" }, { book: "Cambridge", refs: "WE4.14 to 4.17" }, { book: "Cambridge", refs: "MP10, MP14" },
      { book: "Oxford", refs: "Ex30.1A 2, 4" }, { book: "Oxford", refs: "Ex30.1B 6, 7", what: "tables of decimal amounts" }, { book: "Oxford", refs: "Assessment 4" },
    ],
  },
  {
    n: 5, title: "Whole numbers", blurb: "The fractional optimum cannot be made: the best practical plan.",
    can: ["Say why a fractional optimum is not practical", "Find the best whole-number plan (round down, add where there is room, check the bound)", "Know that rounding to the nearest can break a constraint"],
    practice: [
      { label: "Is it practical?", sub: "Level 1", href: href("practical", 1) },
      { label: "Is it practical?", sub: "Level 2", href: href("practical", 2) },
      { label: "Is it practical?", sub: "Level 3: rounding to the nearest breaks a constraint", href: href("practical", 3) },
    ],
    stops: [
      { book: "Cambridge", refs: "Ex4B 9, 10", what: "integers, graphically; and the “common error” after WE4.8" }, { book: "Oxford", refs: "Ex30.1B 8", what: "boxes of vegetables" },
    ],
  },
  {
    n: 6, title: "When it does not start at the origin", blurb: "Minimise, ≥, a lower bound, an equality: a change of form first.",
    can: ["Minimise by maximising P = −C", "Rewrite a ≥ constraint and start by pivoting on a negative entry", "Handle y ≥ 4 by Y = y − 4 or as one more constraint", "Handle an equation as two inequalities or as a row", "Go from a tableau back to the problem"],
    practice: [
      { label: "Solve: Minimise", sub: "Level 3", href: href("solve", 3, { sxForms: "min" }) },
      { label: "Solve: A ≥ constraint", sub: "Level 3", href: href("solve", 3, { sxForms: "ge" }) },
      { label: "Solve: A lower bound", sub: "Level 3", href: href("solve", 3, { sxForms: "lower" }) },
      { label: "Solve: An equality", sub: "Level 3", href: href("solve", 3, { sxForms: "eq" }) },
      { label: "Lower bound and equality as rows", sub: "Level 3, Method: Use As Rows", href: href("solve", 3, { sxForms: "lower,eq", sxMethod: "rows" }) },
      { label: "One pivot", sub: "Level 3: a negative right-hand side", href: href("pivot", 3) },
      { label: "Read a tableau", sub: "Level 3: the problem the tableau shows", href: href("interpret", 3) },
    ],
    stops: [
      { book: "Cambridge", refs: "WE4.17, Ex4C 9, MP14", what: "minimise" }, { book: "Oxford", refs: "Ex 4, review 3", what: "a ≥ start" },
      { book: "Oxford", refs: "Ex30.1B 2", what: "lower bounds" }, { book: "Oxford", refs: "Ex30.1B 11", what: "an equality" }, { book: "Cambridge", refs: "MP8", what: "from a tableau back to the problem" },
    ],
  },
];

const NOT_IN_TOOLS: Array<{ what: string; where: string }> = [
  { what: "The parameter k in a tableau, a tableau that shows the problem is unbounded, a miscopied number that makes it infeasible", where: "Cambridge MP12, MP6; Oxford Ex30.1B 12. Left for the exam-style pass." },
  { what: "The full exam chains", where: "Cambridge MP10 and MP11 are AQA past-paper questions. The tools build the skills; the chain is the exam-style pass, not built yet." },
  { what: "A zero-sum game as a linear programme", where: "Oxford section 30.2. It belongs to the game theory chapter." },
];

const ABOUT =
  "A route through the simplex tools for a class to follow in order. Each stage says what students should be able to do, then gives one button for each piece of practice: it opens the Simplex tool on the right sub-tool and level, with the option the stage needs already set. " +
  "Levels do not overlap: when a stage is too easy go to the next level of the same sub-tool, not back. The textbook numbers were recorded when the chapters were read, so check them against your own copy. " +
  "Option buttons with an asterisk in the tool are extensions that are unlikely to come up: leave them for the last. The ticks are kept on this device only.";

const KEY = "mt-lp-roadmap-done";
function readDone(): number[] {
  try { const v = JSON.parse(window.localStorage.getItem(KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "number") : []; } catch { return []; }
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
            <p className="mt-1 text-slate-500">Six stages, in order. Each button opens the tool ready for that stage.</p>
          </div>
          <button type="button" onClick={() => setAboutOpen((o) => !o)} aria-expanded={aboutOpen} aria-label="About this roadmap"
            className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${aboutOpen ? "bg-blue-900 text-white" : "text-slate-400 hover:bg-slate-100 hover:text-blue-900"}`}>
            <Info size={20} />
          </button>
        </div>
        {aboutOpen && <p role="note" className="mt-3 rounded-xl bg-slate-900 p-3 text-sm leading-snug text-white">{ABOUT}</p>}
        <p className="mt-4 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 shadow-card">
          <b className="font-semibold text-slate-800">Assumed:</b> formulating is done. Students can write a model from a story and read the corners of a region; this starts at the slack variables.
        </p>

        <ol className="mt-5 flex flex-col gap-4">
          {STAGES.map((s) => {
            const ticked = done.includes(s.n);
            return (
              <li key={s.n} className={`rounded-2xl border bg-white shadow-card ${ticked ? "border-emerald-300" : "border-slate-300"}`}>
                <div className="flex items-start gap-3 p-4 sm:p-5">
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${ticked ? "bg-emerald-600 text-white" : "bg-blue-900 text-white"}`}>{ticked ? <Check size={16} /> : s.n}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">{s.title}</h2>
                        <p className="text-sm text-slate-500">{s.blurb}</p>
                      </div>
                      <button type="button" onClick={() => toggle(s.n)} aria-pressed={ticked}
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${ticked ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>{ticked ? "Done" : "Mark done"}</button>
                    </div>
                    <div className="mt-3 text-sm font-semibold text-slate-700">Students can…</div>
                    <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">{s.can.map((c) => <li key={c}>{c}</li>)}</ul>

                    {(s.deck || s.practice.length > 0) && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {s.deck && (
                          <button type="button" onClick={() => go(s.deck!)} className="flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-left hover:bg-blue-50">
                            <Presentation size={18} className="shrink-0 text-blue-900" />
                            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">The deck: how the simplex works</span><span className="block text-xs text-slate-500">Lesson slides, the graph beside the table</span></span>
                            <ArrowRight size={16} className="shrink-0 text-slate-400" />
                          </button>
                        )}
                        {s.practice.map((p) => (
                          <button key={p.label + p.sub} type="button" onClick={() => go(p.href)} className="flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-left hover:bg-blue-50">
                            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">{p.label}</span><span className="block text-xs text-slate-500">{p.sub}</span></span>
                            <ArrowRight size={16} className="shrink-0 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    )}
                    {s.tip && <p className="mt-3 text-sm text-slate-500">{s.tip}</p>}

                    <div className="mt-4 flex items-start gap-2 border-t border-slate-200 pt-3">
                      <BookOpen size={16} className="mt-0.5 shrink-0 text-slate-400" />
                      <div className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-700">Textbook stop-offs.</span>{" "}
                        {s.stops.map((t, i) => (
                          <span key={i}>{i > 0 && "; "}<span className="font-medium text-slate-800">{t.book === "Cambridge" ? "Cambridge" : "Oxford"} {t.refs}</span>{t.what ? ` (${t.what})` : ""}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 rounded-2xl border border-slate-300 bg-white p-4 shadow-card sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">The gate at the end</h2>
          <p className="mt-1 text-sm text-slate-700">A student can take a worded problem, set it up, solve it by the tableau, state the answer in context with the meaning of each slack variable, and say whether it is practical.</p>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-card sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">Not in the tools: use the books</h2>
          <ul className="mt-2 flex flex-col gap-2 text-sm text-slate-700">
            {NOT_IN_TOOLS.map((n) => <li key={n.what}><span className="font-medium text-slate-800">{n.what}.</span> {n.where}</li>)}
          </ul>
        </div>
        <p className="mt-4 text-xs text-slate-400">Cambridge is chapter 4 of the Cambridge book; Oxford is chapter 30 of the Oxford book. Check the exercise numbers against your own copy before the lesson.</p>
      </div>
    </div>
  );
}
