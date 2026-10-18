import { useEffect, useMemo, useRef, useState } from "react";
import { useDevMode } from "../../devMode";
import { Home, Menu, X, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Maximize2, Minimize2, Info as InfoIcon, FastForward, Move, SlidersHorizontal, Eye } from "lucide-react";
import type { DecisionProblem, DecisionShellProps, GenerateContext, LegendItem, SolveStep, StepList, StepListItem } from "./types";
import type { InfoSection } from "../types";
import NetworkView, { EDGE_STYLE, NODE_ROLE_STYLE } from "./representations/NetworkView";
import MatrixView from "./representations/MatrixView";
import { SandboxOverlay } from "./representations/SandboxBoard";
import ExamView from "./ExamView";
import { useQuestionKeeper } from "../questionKeeper";
import { PinButton } from "../components/PinButton";
import { STAGE_H } from "./layout";
import { printExam } from "./printExam";
import { PrintSplitButton } from "../components/PrintSplitButton";
import { useLayoutMode } from "../layoutMode";
import { RotateHint } from "../components/RotateHint";
import type { PrintMode } from "../types";
import TopicChooser from "./TopicChooser";
import { DifficultyToggle } from "../components/DifficultyToggle";
import { MenuDropdown } from "../components/MenuDropdown";
import { InfoModal } from "../components/InfoModal";
import { OptionGrid, SegButtons, usePopover } from "../components/QOPopovers";
import { PAGE_BG, getQuestionBg } from "../colors";
import StepCascade, { StepDots } from "./StepCascade";
import PrintTemplates from "./PrintTemplates";

// ═══════════════════════════════════════════════════════════════════════════
// DecisionShell — the shell for Decision Maths question generators. It follows the
// standard tool shell's page (nav bar · title · tool tabs · control bar ·
// content card) but is built for network questions, not worksheets:
//   Every question is a Worked Example: the question, ONE large network (kept in view as you
//   scroll) and a fading cascade of steps beside it — Back / Next / Show all.
// There is no worksheet / print mode: these questions are taught from the board.
// The page scrolls normally; the graph gets the width. The setup lives in the URL
// (tool, level, options) so a link reopens exactly what is on screen.
// ═══════════════════════════════════════════════════════════════════════════

const levelKey = (n: number) => `level${n}`;
/** on a tablet the fixed bars keep their buttons in the same 68rem column as the page */
const BAR_INSET = { paddingLeft: "max(0.75rem, calc((100vw - 68rem) / 2))", paddingRight: "max(4.75rem, calc((100vw - 68rem) / 2))" } as const;   // the right side leaves room for the pen (ink) button
const CARD = "bg-white rounded-2xl border border-slate-300 shadow-card min-w-0";
const BTN = "px-4 sm:px-6 py-2 rounded-xl font-semibold text-base transition-colors flex items-center gap-2";
const BTN_PRIMARY = `${BTN} bg-blue-900 text-white hover:bg-blue-800`;

const defaultOptions = (config: DecisionShellProps["config"], level: number): Record<string, string> =>
  Object.fromEntries((config.options ?? []).map((o) => [o.key, o.multi ? "" : o.defaultFor?.(level) ?? o.choices[0].value]));
/** The ticks a multi option shows and the generator sees: the teacher's own, or what the level and sub-tool call for (a comma list). */
const ticksOf = (o: NonNullable<DecisionShellProps["config"]["options"]>[number], value: string | undefined, level: number, sub: string): string[] => {
  const raw = value || o.defaultFor?.(level, sub) || o.choices[0].value;
  const ok = raw.split(",").filter((v) => o.choices.some((c) => c.value === v));
  return ok.length ? ok : [o.choices[0].value];
};

// ── URL ⇄ state (only non-default values) ───────────────────────────────────────
/** Does this tab / option's `when` hold for these option values? */
const whenOk = (w: { key: string; values: string[] } | { key: string; values: string[] }[] | undefined, opts: Record<string, string>): boolean =>
  !w || (Array.isArray(w) ? w : [w]).every((c) => c.values.includes(opts[c.key]));
/** An option that is no longer on offer (its `when` fails) goes back to its default, so a hidden choice can never keep the page on a tab that is not there. */
const settle = (config: DecisionShellProps["config"], opts: Record<string, string>, level: number): Record<string, string> => {
  const out = { ...opts };
  for (const o of config.options ?? []) if (o.when && !whenOk(o.when, out)) out[o.key] = o.multi ? "" : o.defaultFor?.(level) ?? o.choices[0].value;
  return out;
};
/** The question-type tabs on offer for these option values (an AS / A-level choice can hide some). */
const tabsFor = (config: DecisionShellProps["config"], opts: Record<string, string>) => (config.subTools ?? []).filter((t) => whenOk(t.when, opts));

function readUrl(config: DecisionShellProps["config"]) {
  const q = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const levels = config.levels ?? 1;
  const lv = parseInt(q.get("level") ?? "", 10);
  const level = lv >= 1 && lv <= levels ? lv : 1;
  const tool = q.get("tool");
  let options = defaultOptions(config, level);
  for (const o of config.options ?? []) {
    const v = q.get(`o_${o.key}`);
    if (v && (o.multi ? v.split(",").every((x) => o.choices.some((c) => c.value === x)) : o.choices.some((c) => c.value === v))) options[o.key] = v;
  }
  options = settle(config, options, level);
  const tabs = tabsFor(config, options);
  const subTool = tabs.some((t) => t.key === tool) ? (tool as string) : tabs[0]?.key ?? "";
  return { level, subTool, options };
}

let problemCount = 0;
export default function DecisionShell({ generate, solve, renderCanvas, config }: DecisionShellProps) {
  const init = useMemo(() => readUrl(config), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [level, setLevel] = useState(init.level);
  const [subTool, setSubTool] = useState(init.subTool);
  // a tab may have fewer levels than the tool (its own `levels`); the level picker follows the current tab
  const levelCount = config.subTools?.find((t) => t.key === subTool)?.levels ?? config.levels ?? 1;
  const hasLevels = config.levels != null; // a tool with levels always shows the level buttons, even with just Level 1
  const [options, setOptions] = useState<Record<string, string>>(init.options);
  // the generator only ever sees the options that are on offer for this sub-tool (a hidden one never leaks in)
  const shownFor = (sub: string, opts: Record<string, string>) => (o: NonNullable<DecisionShellProps["config"]["options"]>[number]) => (o.top || !o.forSubTools || o.forSubTools.includes(sub)) && whenOk(o.when, opts);
  const ctxOf = (sub: string, opts: Record<string, string>, lv: number): GenerateContext => ({
    subTool: sub,
    options: Object.fromEntries((config.options ?? []).filter(shownFor(sub, opts)).map((o) => [o.key, o.multi ? ticksOf(o, opts[o.key], lv, sub).join(",") : opts[o.key]])),
  });
  const [failed, setFailed] = useState(false); // generate() gave up: the page asks for a reload
  const [problem, setProblem] = useState<DecisionProblem>(() => generate(init.level, ctxOf(init.subTool, init.options, init.level)));
  // -1 = the question only; 0…last = the working, one step at a time; last+1 = the answer (when it fits on a line)
  const [stepIdx, setStepIdx] = useState(-1);
  const [showAll, setShowAll] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [sandbox, setSandbox] = useState(false); // the picture opened in the sandbox (the question's own picture never moves)
  const resumeAt = useRef(-1); // where the class was before Show all
  // Phone layout — the same ≤640px switch ToolShell uses: compact header, one settings banner + drawer instead of the tab rows and control bar
  const [stageTab, setStageTab] = useState<"graph" | "table" | null>(null); // phone: which picture the pinned stage shows (null = automatic)
  // The three screen sizes (src/shared/layoutMode.ts): a phone and a tablet both use the click-through start screens and the fixed bottom
  // bar (`narrow`); the tablet lays them out landscape, picture beside question and steps.
  const layout = useLayoutMode();
  const isPhone = layout.phone, isTablet = layout.tablet;
  const tabletLand = isTablet && !layout.portrait;   // a tablet held upright keeps the phone's stacked arrangement
  const narrow = !layout.laptop;
  const [drawer, setDrawer] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false); // phone: with the answer showing, the question shrinks to two lines — tap for all of it
  // Phone: click-through start (the big either/or option, then the question type) before the tool; a link naming a setup skips it.
  const [started, setStarted] = useState(() => typeof window !== "undefined" && /[?&](tool|level)=/.test(window.location.search));
  const [launchIdx, setLaunchIdx] = useState(0);
  useEffect(() => setStageTab(null), [stepIdx]);
  useEffect(() => setPromptOpen(false), [problem]);
  // a short screen (a laptop, a projector at 720p) gives the fullscreen working less height: smaller question text keeps the steps from being squeezed
  const [short, setShort] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-height: 820px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-height: 820px)");
    const on = () => setShort(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [levelInfoOpen, setLevelInfoOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [pickedScheme, setColorScheme] = useState("default");
  const colorScheme = useDevMode() ? pickedScheme : "default";   // colour schemes are dev-gated for now
  const optionsPop = usePopover();

  const steps = useMemo<SolveStep[]>(() => solve(problem), [problem, solve]);
  const last = steps.length - 1;
  const answerText = problem.answer?.text && problem.answer.text.length <= 160 ? problem.answer.text : null;
  const maxBeat = last + (answerText ? 1 : 0);
  const atQuestion = stepIdx < 0;
  const onAnswer = !!answerText && stepIdx > last;
  const idx = Math.min(Math.max(stepIdx, 0), last);
  const current: SolveStep | undefined = atQuestion ? undefined : steps[idx];
  const jump = (b: number) => {
    setShowAll(false);
    setStepIdx(Math.max(-1, Math.min(maxBeat, b)));
  };
  const topOptions = (config.options ?? []).filter((o) => o.top && (!o.forSubTools || o.forSubTools.includes(subTool)) && whenOk(o.when, options));
  const tabs = tabsFor(config, options);
  // picking a top-tier option can hide the current tab (AS has fewer): move to the first tab that is still on offer
  const chooseTop = (key: string, value: string) => {
    const opts = settle(config, { ...options, [key]: value }, level);
    const t = tabsFor(config, opts);
    const sub = t.some((x) => x.key === subTool) ? subTool : t[0]?.key ?? subTool;
    setOptions(opts); setSubTool(sub); newQuestion(level, sub, opts);
  };

  // Phone Back: the start screens are React state, so a Back swipe would skip them and leave the tool. Mirror the
  // stage into history (one entry per screen) so Back steps out one screen at a time — same scheme as ToolShell.
  const chooser = narrow ? undefined : config.chooser;   // phone keeps the click-through start screens (course → practice → topic), which suit a thumb better than an expanding panel
  const chooserFilters = chooser ? topOptions.filter((o) => chooser.filters.includes(o.key)) : [];
  const nSteps = chooser ? 0 : topOptions.length + (tabs.length > 1 ? 1 : 0);
  const narrowStage = narrow && nSteps > 0 ? (started ? nSteps : Math.min(launchIdx, nSteps - 1)) : 0;
  const histStage = useRef(narrowStage);   // stage the current history entry represents
  const baseStage = useRef(narrowStage);   // stage of the entry the page loaded on (it carries no marker)
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (!narrow || nSteps === 0) return;
      const m = (e.state as { mtStage?: number } | null)?.mtStage;
      const target = typeof m === "number" ? m : baseStage.current;
      histStage.current = target;
      setStarted(target >= nSteps);
      setLaunchIdx(Math.min(target, nSteps - 1));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [narrow, nSteps]);
  useEffect(() => {
    if (!narrow || narrowStage === histStage.current) return;
    if (narrowStage > histStage.current) {
      for (let st = histStage.current + 1; st <= narrowStage; st++) window.history.pushState({ mtStage: st }, "", window.location.href);
    } else if (narrowStage >= baseStage.current) {
      window.history.go(-(histStage.current - narrowStage));   // tapped a crumb / ‹: drop the entries it skipped over
    } else {
      window.history.replaceState({ mtStage: narrowStage }, "", window.location.href);   // went back past where the page opened
      baseStage.current = narrowStage;
    }
    histStage.current = narrowStage;
  }, [narrow, narrowStage]);
  const visibleOptions = (config.options ?? []).filter((o) => !o.top && (!o.forSubTools || o.forSubTools.includes(subTool)) && whenOk(o.when, options));
  const qBg = getQuestionBg(colorScheme);
  // level labels may differ by question type (the TSP table question has no "complete network" level)
  const levelLabelList = Array.isArray(config.levelLabels) ? config.levelLabels : config.levelLabels?.[subTool] ?? config.levelLabels?.default;

  const newQuestion = (lv = level, sub = subTool, opts = options) => {
    try {
      setProblem(generate(lv, ctxOf(sub, opts, lv)));
      setStepIdx(-1);
      setShowAll(false);
    } catch {
      setFailed(true);
    }
  };

  // ── Recent and pinned questions (burger menu; this visit only) ───────────────
  const problemIds = useRef(new WeakMap<object, number>());
  const problemNo = (p: DecisionProblem) => { let n = problemIds.current.get(p); if (!n) { n = ++problemCount; problemIds.current.set(p, n); } return n; };
  // a recent question is told apart by its number and its own sentence (the question's numbers), not the boilerplate opening
  const sentences = (problem.exam ? problem.exam.intro : problem.prompt).split(/(?<=[.?!])\s+/);
  const keeper = useQuestionKeeper<{ problem: DecisionProblem; level: number; subTool: string; options: Record<string, string> }>(
    { id: `q${problemNo(problem)}`, label: `#${problemNo(problem)} · ${tabs.find((t) => t.key === subTool)?.label ?? config.pageTitle}${levelCount > 1 ? ` · L${level}` : ""} · ${sentences[sentences.length > 1 ? 1 : 0]}`, state: { problem, level, subTool, options } },
    (k) => { setLevel(k.level); setSubTool(k.subTool); setOptions(k.options); setProblem(k.problem); setStepIdx(-1); setShowAll(false); setStarted(true); setSheetMode(false); },
    !(narrow && !started && !config.chooser && (config.options ?? []).some((o) => o.top)),   // not while the phone start screens are choosing: those questions were never shown
  );

  // keep the address bar bookmarkable
  useEffect(() => {
    const q = new URLSearchParams();
    if (tabs.length && subTool !== tabs[0]?.key) q.set("tool", subTool);
    if (level !== 1) q.set("level", String(level));
    for (const o of config.options ?? []) if (shownFor(subTool, options)(o) && options[o.key] !== (o.multi ? "" : o.defaultFor?.(level) ?? o.choices[0].value)) q.set(`o_${o.key}`, options[o.key]);
    const keep = new URLSearchParams(window.location.search).get("tpl"); // dev link: pinned template
    if (keep) q.set("tpl", keep);
    const s = q.toString();
    window.history.replaceState(window.history.state, "", window.location.pathname + (s ? `?${s}` : ""));
  }, [level, subTool, options]); // eslint-disable-line react-hooks/exhaustive-deps

  // ← / → step through a worked example; Esc leaves fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sandbox) setFullscreen(false);
      const t = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey || infoOpen || (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName))) return; // never step while typing or while a dialog is open
      if (e.key === "ArrowRight") { setShowAll(false); setStepIdx((i) => Math.min(maxBeat, i + 1)); }
      if (e.key === "ArrowLeft") { setShowAll(false); setStepIdx((i) => Math.max(-1, i - 1)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maxBeat, infoOpen, sandbox]);

  const infoBase: InfoSection[] = config.infoSections ?? [
    {
      title: config.pageTitle,
      icon: "🕸️",
      content: [
        { label: "Worked Example", detail: "Every question is worked through: the question and one large network, with the working beside it one step at a time (Next / Back, or the arrow keys). Earlier steps fade but stay on screen; Show all jumps to the end." },
      ],
    },
  ];

  // what each level means lives in the Info (burger menu), as in the other tools, not under the toolbar
  const defaultLevelLabels = Array.isArray(config.levelLabels) ? config.levelLabels : config.levelLabels?.default;
  const infoSections: InfoSection[] = defaultLevelLabels && levelCount > 1 && !config.levelInfo
    ? [...infoBase, { title: "Levels", icon: "📶", content: defaultLevelLabels.slice(0, levelCount).map((d, i) => ({ label: `Level ${i + 1}`, detail: d })) }]
    : infoBase;

  const questionNet = problem.vertexOnlyQuestion ? { ...problem.network, edges: [] } : problem.network; // a table-only question draws just the vertices
  const shownCanvas = (st: SolveStep | undefined) =>
    renderCanvas ? renderCanvas(problem, st) : <NetworkView network={st?.network ?? (!st ? questionNet : problem.network)} step={st} background="#ffffff" />;
  // `problem.caption` sits under the picture as the question is first shown (the working carries its own running figures)
  const shown = (st: SolveStep | undefined) => problem.caption && !st ? (
    <div className="absolute inset-0 flex flex-col">
      <div className="relative min-h-0 flex-1">{shownCanvas(st)}</div>
      <div className="shrink-0 py-2 text-center text-base font-semibold text-gray-800">{problem.caption}</div>
    </div>
  ) : shownCanvas(st);
  // ── Exam worksheets, as in the other tools' Worksheet mode: choose how many, Generate, look at them, Show Answers, Print (Both / Questions / Answers) ──
  const [sheetMode, setSheetMode] = useState(false);
  const [sheetN, setSheetN] = useState(3);
  const [sheet, setSheet] = useState<DecisionProblem[]>([]);
  const [sheetAnswers, setSheetAnswers] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>("both");
  const inSheet = sheetMode && !!problem.exam;
  const [sheetBusy, setSheetBusy] = useState<string | null>(null);
  const [sheetNote, setSheetNote] = useState<string | null>(null);
  // one question at a time, giving the page a breath between them (a big exam-sized network can take a second or two each)
  const generateSheet = async () => {
    if (sheetBusy) return;
    const out: DecisionProblem[] = [];
    setSheetNote(null);
    for (let guard = 0; out.length < sheetN && guard < sheetN * 4; guard++) {
      setSheetBusy(`Generating question ${out.length + 1} of ${sheetN}…`);
      await new Promise((r) => setTimeout(r, 20));
      try { const q = generate(level, ctxOf(subTool, options, level)); if (q.exam) out.push(q); } catch { /* try again */ }
    }
    setSheet(out);
    setSheetAnswers(false);
    setSheetBusy(null);
    if (out.length < sheetN) setSheetNote(`Only ${out.length} of ${sheetN} questions could be made with these options. Try Generate again, or change the options.`);
  };
  const printSheet = async (mode: PrintMode) => {
    if (!sheet.length) return;
    const win = window.open("", "_blank");   // opened here, at the click, before the slow rendering below
    if (!win) { alert("Please allow popups to use the PDF export."); return; }
    try {
      const { renderToStaticMarkup } = await import("react-dom/server");
      const inputs = sheet.map((pr) => {
        const draw = (view?: unknown) => renderToStaticMarkup(<>{renderCanvas ? renderCanvas(pr, view ? { caption: "", edgeStates: {}, flowView: view as SolveStep["flowView"] } : undefined) : null}</>);
        const drawStep = (st: SolveStep) => renderToStaticMarkup(<>{renderCanvas ? renderCanvas(pr, st) : null}</>);
        const hasAug = pr.exam!.parts.some((x) => x.role === "augment");
        return {
          title: config.pageTitle, exam: pr.exam!, questionFigure: draw(), answerFigures: pr.exam!.parts.map((p) => (p.stepView ? drawStep(p.stepView) : p.view ? draw(p.view) : null)),
          // where the student draws (potentials, flow augmentation) they get the network with nothing on it: no capacities, no flows
          blankFigures: pr.exam!.parts.map((p) => {
            if (p.blankStep) return drawStep(p.blankStep);
            if (!p.view || !(p.role === "potentials" || p.role === "augment" || (p.role === "superAdd" && hasAug))) return null;
            // the student ADDS the supersource / supersink, so none of these networks has them: they draw them on the first one and work on it
            const addsSuper = pr.exam!.parts.some((x) => x.role === "superAdd");
            const base = (pr.flow?.examView ?? {}) as { net?: unknown; labelPos?: unknown };
            const v = (p.role === "superAdd" || (p.role === "augment" && addsSuper) ? base : p.view) as { net?: unknown; labelPos?: unknown };
            return draw({ net: v.net, labelPos: v.labelPos ?? pr.flow?.labelPos, hideBounds: true });
          }),
        };
      });
      printExam(inputs, { papers: mode !== "answers", schemes: mode !== "questions", win });
    } catch {
      win.close();
      alert("Sorry, the print sheet could not be prepared. Please try again.");
    }
  };
  const legendItems = problem.legend ?? config.legend;
  const matrixMode = problem.matrixMode ?? (config.hideMatrix ? "off" : config.questionMatrix ? "question" : "working");
  const showMatrix = matrixMode === "question" || (matrixMode === "working" && !atQuestion);
  const canvasStep = current; // undefined at the question: the network as given
  const footer = typeof config.canvasFooter === "function" ? config.canvasFooter(problem) : config.canvasFooter;

  // ── pieces ────────────────────────────────────────────────────────────────────
  const navBar = (
    <div className="bg-blue-900 shadow-lg">
      <div className="max-w-[1500px] mx-auto px-2 sm:px-8 py-1.5 sm:py-3 flex justify-between items-center gap-2">
        <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-1.5 sm:gap-2 text-white hover:bg-blue-800 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors">
          <Home size={narrow ? 20 : 24} />
          {!narrow && <span className="font-semibold text-lg">Home</span>}
        </button>
        {narrow && (
          <div className="flex-1 min-w-0 text-center leading-tight">
            <div className="text-white font-semibold text-[15px] truncate">{config.pageTitle}</div>
            {started && !chooser && (
              // breadcrumb: each part reopens the start screen where it was chosen
              <div className="flex items-center justify-center gap-1 text-[12px] text-blue-200 whitespace-nowrap overflow-hidden">
                {[
                  ...topOptions.map((o, i) => ({ label: o.choices.find((c) => c.value === options[o.key])?.label ?? o.label, onClick: () => { setLaunchIdx(i); setStarted(false); } })),
                  ...(tabs.length > 1 ? [{ label: tabs.find((t) => t.key === subTool)?.label ?? "", onClick: () => { setLaunchIdx(topOptions.length); setStarted(false); } }] : []),
                  ...(hasLevels ? [{ label: `L${level}`, onClick: () => setDrawer(true) }] : []),
                ].filter((c) => c.label).map((c, i) => (
                  <span key={c.label + i} className="flex items-center gap-1 min-w-0">
                    {i > 0 && <span className="text-blue-400">›</span>}
                    <button onClick={c.onClick} className="underline decoration-blue-400/60 underline-offset-2 truncate active:text-white">{c.label}</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-white hover:bg-blue-800 p-1.5 sm:p-2 rounded-lg transition-colors">
            {menuOpen ? <X size={narrow ? 22 : 28} /> : <Menu size={narrow ? 22 : 28} />}
          </button>
          {menuOpen && <MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={() => setMenuOpen(false)} onOpenInfo={() => setInfoOpen(true)} keeper={keeper} menuItems={[...(config.menuItems ?? []), ...(config.printTemplates ? [{ label: "Print templates…", hint: "Blank grids and boxes to plot histograms and Gantt charts", onClick: () => setPrintOpen(true) }] : [])]}  />}
        </div>
      </div>
    </div>
  );

  const tabBtn = (active: boolean) =>
    `px-4 py-2 sm:px-5 rounded-full font-semibold text-sm sm:text-[15px] transition-colors ${active ? "bg-blue-900 border border-blue-900 text-white shadow-sm" : "bg-white border border-slate-300 text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-400"}`;

  const levelInfoDialog = levelInfoOpen && levelLabelList ? (
    <div className="fixed inset-0 z-[400] flex items-center justify-center px-4" style={{ backgroundColor: "rgba(15,23,42,0.45)" }} onClick={() => setLevelInfoOpen(false)}>
      <div className="bg-white rounded-2xl border border-slate-300 shadow-lift w-full max-w-md p-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-slate-900">Levels</div>
            <div className="text-sm text-slate-500">{tabs.find((x) => x.key === subTool)?.label}</div>
          </div>
          <button onClick={() => setLevelInfoOpen(false)} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-2">
          {levelLabelList.slice(0, levelCount).map((l, i) => (
            <div key={i} className={`rounded-xl border px-3 py-2 ${i + 1 === level ? "border-blue-900 bg-blue-50" : "border-slate-200"}`}>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Level {i + 1}{i + 1 === level ? " · now" : ""}</div>
              <div className="text-base text-slate-900 leading-snug">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  const controlRow = (
      // three cells like ToolShell's toolbar: the level buttons at the start, Question Options always in the exact centre (whatever the number of
      // levels), pin and New Question at the end. Narrower windows wrap instead.
      <div className="flex flex-wrap items-center justify-between gap-x-2 xl:gap-x-4 gap-y-3 lg:grid lg:grid-cols-[1fr_auto_1fr] [&_button]:whitespace-nowrap">
        <div className="flex justify-start">{hasLevels && (
          <div className="relative flex items-center">
          <DifficultyToggle
            value={levelKey(Math.min(level, levelCount))}
            levels={Array.from({ length: levelCount }, (_, i) => levelKey(i + 1))}
            onChange={(v) => {
              const lv = parseInt(v.replace("level", ""), 10);
              setLevel(lv);
              // options with a per-level default follow the level; the teacher's own choices stay put
              const opts = { ...options };
              for (const o of config.options ?? []) if (o.defaultFor && !o.multi && opts[o.key] === o.defaultFor(level)) opts[o.key] = o.defaultFor(lv);
              setOptions(opts);
              newQuestion(lv, subTool, opts);
            }}
          />
          {config.levelInfo && levelLabelList && (
            <button onClick={() => setLevelInfoOpen(true)} title="What the levels mean" aria-label="What the levels mean" className="ml-1.5 w-8 h-8 rounded-full inline-flex items-center justify-center align-middle text-slate-400 hover:text-blue-900 hover:bg-slate-100">
              <InfoIcon size={18} />
            </button>
          )}
          </div>
        )}</div>
        {/* always present, always in the same place; greyed when this question type has nothing to choose */}
        {(
          <div className="relative" ref={optionsPop.ref}>
            <button
              onClick={() => { if (visibleOptions.length > 0) optionsPop.setOpen(!optionsPop.open); }}
              disabled={visibleOptions.length === 0}
              title={visibleOptions.length === 0 ? "No options for this question type" : undefined}
              className={`px-4 py-2 rounded-xl border font-semibold text-base transition-colors flex items-center gap-2 ${visibleOptions.length === 0 ? "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed" : optionsPop.open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            >
              Question Options
              <ChevronDown size={18} style={{ transition: "transform 0.2s", transform: optionsPop.open ? "rotate(180deg)" : "rotate(0)" }} />
            </button>
            {optionsPop.open && visibleOptions.length > 0 && (
              (() => {
                // a long list splits into two columns with a thin grey divider (the Split QO layout)
                const split = visibleOptions.length > 4;
                const half = Math.ceil(visibleOptions.length / 2);
                const cols = split ? [visibleOptions.slice(0, half), visibleOptions.slice(half)] : [visibleOptions];
                return (
                  <div className={`absolute top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-5 flex ${split ? "left-1/2 -translate-x-1/2 w-[min(44rem,92vw)]" : "left-0 min-w-[min(24rem,86vw)]"}`}>
                    {cols.map((col, ci) => (
                      <div key={ci} className={`flex flex-col gap-5 flex-1 min-w-0 ${ci > 0 ? "border-l border-gray-200 pl-5 ml-5" : ""}`}>
                        {col.map((o) => (
                          <div key={o.key}>
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{o.label}</div>
                            <OptionControl o={o} value={options[o.key]} level={level} sub={subTool}
                              onChange={(v) => {
                                const opts = { ...options, [o.key]: v };
                                setOptions(opts);
                                newQuestion(level, subTool, opts);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        )}
        {!inSheet ? <div className="flex gap-2 xl:gap-3 items-center justify-end ml-auto lg:ml-0">
          <PinButton keeper={keeper} />
          <button onClick={() => newQuestion()} className="px-4 xl:px-6 py-2 bg-blue-900 text-white rounded-xl font-semibold text-base hover:bg-blue-800 flex items-center gap-2">
            <RefreshCw size={18} /> New Question
          </button>
        </div> : <div />}
      </div>
  );

  // the tiles for every combination of the chooser's filters (course × practice…), so the open chooser keeps one height whatever is chosen
  const chooserVariants = chooser ? chooserFilters.reduce<Array<Record<string, string>>>((acc, o) => acc.flatMap((a) => o.choices.map((c) => ({ ...a, [o.key]: c.value }))), [{}]).map((values) => ({ values, tabs: tabsFor(config, settle(config, { ...options, ...values }, level)) })) : undefined;
  const topicChooser = chooser ? (
    <TopicChooser chooser={chooser} filters={chooserFilters} options={options} tabs={tabs} variants={chooserVariants} subTool={subTool} narrow={narrow}
      mode={problem.exam ? { value: sheetMode ? "worksheet" : "practice", choices: [{ value: "practice", label: "Practice" }, { value: "worksheet", label: "Worksheet" }], onChange: (v) => setSheetMode(v === "worksheet") } : undefined}
      startOpen={typeof window !== "undefined" && !/[?&](tool|level)=/.test(window.location.search)}
      onFilter={chooseTop} onTopic={(k) => { setSubTool(k); newQuestion(level, k, options); }} />
  ) : null;

  const controlBar = (
    <div className={`${CARD} px-3 py-3 sm:px-5 sm:py-4 flex flex-col gap-3`}>
      {controlRow}
    </div>
  );

  // Step controls live at the foot of the Answer section (as in the other tools' worked examples), not in the
  // question control bar: ◀ back · where we are · Show all ⇄ Step by step · next ▶, then a dot strip.
  // `gutter`: fullscreen leaves room on the right for the floating pen (ink) button so it never sits on Next
  const stepNavFor = (gutter: boolean) => (
    <div className={`border-t border-gray-200 bg-gray-50 ${gutter ? "pl-4 pr-16" : "px-4"} py-3 flex flex-col gap-2`}>
      {/* row 1: back, then ONE wide primary button (Show working / Next step) so the label never wraps or gets squeezed */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => jump(stepIdx - 1)}
          disabled={atQuestion}
          title="Back"
          className="w-12 h-12 shrink-0 rounded-xl border-2 border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={26} />
        </button>
        <button
          onClick={() => jump(stepIdx + 1)}
          disabled={stepIdx >= maxBeat}
          className="flex-1 min-w-0 h-12 px-3 rounded-xl bg-blue-900 text-white font-bold text-base whitespace-nowrap flex items-center justify-center gap-1.5 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="truncate">{atQuestion ? "Show working" : onAnswer ? "Answer shown" : stepIdx + 1 >= maxBeat && answerText ? "Show answer" : "Next step"}</span>
          <ChevronRight size={22} className="shrink-0" />
        </button>
      </div>
      {/* row 2: where we are, the dots (one line, fading at the edges) and Show all */}
      <div className="flex items-center justify-between gap-3">
        <div className="font-bold text-gray-600 text-sm whitespace-nowrap shrink-0">
          {atQuestion ? "Question" : onAnswer ? "Answer" : `Step ${idx + 1} of ${steps.length}`}
        </div>
        <StepDots n={steps.length} cur={atQuestion ? -1 : onAnswer ? steps.length : idx} hasAnswer={!!answerText} onJump={(i) => jump(i >= steps.length ? last + 1 : i)} />
        <button
          onClick={() => {
            // a second press in the same place puts the class back where they were, never at the start or the end
            if (showAll) jump(resumeAt.current);
            else { resumeAt.current = stepIdx; setShowAll(true); setStepIdx(maxBeat); }
          }}
          className="text-sm font-bold text-blue-900 underline-offset-2 hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
        >
          <FastForward size={14} /> {showAll ? "Step by step" : "Show all"}
        </button>
      </div>
    </div>
  );
  const stepNav = stepNavFor(false);

  // once the working starts the question folds to one line (tap to read it in full) so the working gets the room
  const [qOpen, setQOpen] = useState(false);
  useEffect(() => { if (atQuestion) setQOpen(false); }, [atQuestion, problem]);
  const questionBlock = (big: boolean) => {
    const folded = !atQuestion && !qOpen;
    return (
      <div className={`rounded-xl ${folded ? "px-4 py-2" : big ? (short ? "px-5 py-3" : "px-6 py-4") : "px-4 py-2.5"} flex-shrink-0`} style={{ backgroundColor: qBg, border: "1px solid #e5e7eb" }}>
        {atQuestion ? (
          <>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">{config.instruction ?? "Question"}</div>
            <div className={`${big ? (short ? "text-lg" : "text-xl xl:text-2xl") : "text-base"} font-semibold text-gray-900 leading-snug`}>{problem.prompt}</div>
          </>
        ) : (
          <button type="button" onClick={() => setQOpen(!qOpen)} title={qOpen ? "Fold the question" : "Show the whole question"} className="w-full text-left flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-0.5">{config.instruction ?? "Question"}</div>
              <div className={`${big ? (short ? "text-lg" : "text-xl") : "text-base"} font-semibold text-gray-900 leading-snug ${qOpen ? "" : "truncate"}`}>{problem.prompt}</div>
            </div>
            <ChevronDown size={18} className="mt-1 flex-shrink-0 text-slate-400" style={{ transition: "transform 0.2s", transform: qOpen ? "rotate(180deg)" : "rotate(0)" }} />
          </button>
        )}
      </div>
    );
  };

  const canvasBox = (height: string) => (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white" style={{ height, minHeight: narrow ? 200 : 300 }}>
      {shown(canvasStep)}
      <button
        onClick={() => setFullscreen(true)}
        title="Fullscreen"
        className="absolute top-3 left-3 w-9 h-9 rounded-lg flex items-center justify-center bg-black/5 hover:bg-black/10"
      >
        <Maximize2 size={18} color="#6b7280" />
      </button>
      {!config.noSandbox && (
      <button
        onClick={() => setSandbox(true)}
        title="Open this picture in the sandbox — move vertices, zoom and annotate"
        className="absolute top-3 left-14 h-9 px-2.5 rounded-lg flex items-center gap-1.5 bg-black/5 hover:bg-black/10 text-gray-500 font-bold text-sm"
      >
        <Move size={17} /> <span className={narrow ? "hidden" : ""}>Sandbox</span>
      </button>
      )}
    </div>
  );

  const overlay = sandbox ? (
    <SandboxOverlay
      title={config.pageTitle}
      problem={problem}
      step={current}
      steps={steps}
      idx={Math.min(stepIdx, last)}
      onStep={jump}
      renderCanvas={renderCanvas}
      matrixMissing={config.matrixMissing}
      footer={footer}
      onClose={() => setSandbox(false)}
    />
  ) : null;

  // ANSWER — empty until asked for, then built up one step at a time; the controls sit at its foot
  const answerCard = (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col flex-1 min-h-[300px] lg:min-h-[190px]">
      <div className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Answer</div>
      {/* the steps fill the space the card is given, so the controls below never move as steps are added */}
      <div className="relative flex-1 min-h-[7rem]">
        <div className="absolute inset-0">
          {atQuestion ? (
            <div className="px-5 pb-5 text-base text-gray-500 leading-snug">The working and the answer appear here, one step at a time.</div>
          ) : (
            <StepCascade steps={steps} idx={idx} answer={onAnswer ? answerText : null} all={showAll} />
          )}
        </div>
      </div>
      {stepNav}
    </div>
  );
  // The table is the working's main object, so it sits right under the question — above the step text, always in view with it
  const matrixInner = (
    <div className="mx-auto w-fit">
      <MatrixView network={problem.network} step={canvasStep} bare missing={config.matrixMissing} />
    </div>
  );
  const matrixCard = showMatrix ? (
    <div className="rounded-xl border border-gray-200 bg-white p-4 overflow-x-auto">{matrixInner}</div>
  ) : null;
  const stageView: "graph" | "table" = stageTab ?? (current?.matrix ? "table" : "graph");
  const workingExtras = (
    <>
      {current?.list && current.list.items.length > 0 && <ListCard list={current.list} />}
      {current?.route && current.route.length > 0 && <RouteCard route={current.route} />}
    </>
  );
  const canvasCol = (
    <>
      {narrow ? canvasBox("250px") : <div className="flex-1 min-h-0">{canvasBox("100%")}</div>}
      {footer && <div className="flex justify-center">{footer}</div>}
      {!atQuestion && legendItems && <Legend items={legendItems} />}
    </>
  );

  // tablet (landscape): the phone's way of working (question, picture, then the working appears, the stepper and buttons fixed at the foot)
  // with the picture beside the question and steps instead of above them
  const exampleTablet = (
    <div className="grid gap-4 p-4 h-full" style={{ gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)" }}>
      <div className="flex flex-col gap-2 min-w-0 min-h-0">
        {showMatrix && (
          <div className="flex rounded-lg border border-gray-300 overflow-hidden self-center text-sm font-bold shrink-0">
            {(["graph", "table"] as const).map((t) => (
              <button key={t} onClick={() => setStageTab(t)} className={`px-5 py-1.5 ${stageView === t ? "bg-blue-900 text-white" : "bg-white text-gray-600"}`}>{t === "graph" ? "Graph" : "Table"}</button>
            ))}
          </div>
        )}
        <div className="flex-1 min-h-0">
          {showMatrix && stageView === "table"
            ? <div className="h-full overflow-auto rounded-xl border border-gray-200 bg-white p-2 flex justify-center">{matrixInner}</div>
            : canvasBox("100%")}
        </div>
        {footer && <div className="flex justify-center shrink-0">{footer}</div>}
        {legendItems && <div className="shrink-0"><Legend items={legendItems} /></div>}
      </div>
      <div className="flex flex-col gap-3 min-w-0 min-h-0">
        <div className="shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-lg font-semibold text-gray-900 leading-snug overflow-y-auto" style={{ maxHeight: "42%" }}>{problem.prompt}</div>
        {((current?.list && current.list.items.length > 0) || (current?.route && current.route.length > 0)) && (
          <div className="flex flex-col gap-2 shrink-0 overflow-y-auto" style={{ maxHeight: "16%" }}>{workingExtras}</div>
        )}
        <div className="relative flex-1 min-h-[8rem] rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden">
          <div className="absolute inset-0">
            {atQuestion
              ? <div className="p-5 text-base text-gray-500 leading-snug">Press Show answer to work it through, one step at a time.</div>
              : <StepCascade steps={steps} idx={idx} answer={onAnswer ? answerText : null} all={showAll} />}
          </div>
        </div>
      </div>
    </div>
  );

  const example = tabletLand ? exampleTablet : narrow ? (
    // phone: laid out like the other tools' phone Worked Example — the whole question, the picture, then (once the answer is
    // asked for) the working in its own closed box that scrolls inside itself; the stepper and buttons are fixed at the bottom.
    // The table and the graph share the stage (a switch, automatic when a step builds the table).
    <div className={`flex flex-col gap-2.5 p-3 ${atQuestion ? "" : "h-full"}`}>
      {atQuestion
        ? <div className="text-center font-semibold text-gray-900 leading-snug shrink-0 text-xl py-1">{problem.prompt}</div>
        : <button type="button" onClick={() => setPromptOpen((o) => !o)} aria-expanded={promptOpen}
            className={`text-center font-semibold text-gray-900 leading-snug shrink-0 text-sm ${promptOpen ? "" : "line-clamp-2"}`}>{problem.prompt}</button>}
      {showMatrix && (
        <div className="flex rounded-lg border border-gray-300 overflow-hidden self-center text-sm font-bold shrink-0">
          {(["graph", "table"] as const).map((t) => (
            <button key={t} onClick={() => setStageTab(t)} className={`px-4 py-1 ${stageView === t ? "bg-blue-900 text-white" : "bg-white text-gray-600"}`}>{t === "graph" ? "Graph" : "Table"}</button>
          ))}
        </div>
      )}
      {showMatrix && stageView === "table"
        ? <div className="overflow-auto rounded-xl border border-gray-200 bg-white p-2 flex justify-center shrink-0" style={{ maxHeight: atQuestion ? "40dvh" : "24dvh" }}>{matrixInner}</div>
        : canvasBox(atQuestion ? (showMatrix ? "34dvh" : "40dvh") : (showMatrix ? "22dvh" : "24dvh"))}
      {atQuestion && legendItems && <Legend items={legendItems} />}
      {!atQuestion && (
        <>
          {legendItems && (
            <details className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1">
              <summary className="text-xs font-bold uppercase tracking-wider text-gray-400 cursor-pointer">Key</summary>
              <div className="pt-1"><Legend items={legendItems} /></div>
            </details>
          )}
          {((current?.list && current.list.items.length > 0) || (current?.route && current.route.length > 0)) && (
            <div className="flex flex-col gap-2 shrink-0 overflow-y-auto" style={{ maxHeight: "12dvh" }}>{workingExtras}</div>
          )}
          <div className="relative min-h-[8rem] flex-1 rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden">
            <div className="absolute inset-0">
              <StepCascade steps={steps} idx={idx} answer={onAnswer ? answerText : null} all={showAll} />
            </div>
          </div>
        </>
      )}
    </div>
  ) : (
    <div className="p-3 sm:p-4 grid gap-4 sm:gap-5 items-stretch grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:h-[calc(var(--stage)+2rem)]" style={{ ["--stage" as string]: STAGE_H }}>
      {/* on a big screen both columns are exactly one laptop screen tall: the picture fills its column, the steps fill theirs; on a narrower one they stack */}
      <div className="flex flex-col gap-3 min-w-0 h-[46dvh] min-h-[300px] lg:min-h-0 lg:h-auto">
        {canvasCol}
      </div>
      <div className="flex flex-col gap-3 min-w-0 min-h-0 lg:overflow-y-auto">
        {questionBlock(false)}
        {matrixCard}
        {answerCard}
        {workingExtras}
      </div>
    </div>
  );

  // Practice | Worksheet, only for exam-style questions (on a phone, as tabs; on a big screen it lives in the topic chooser)
  const examTabs = problem.exam ? (
    <div className="flex justify-center gap-7 border-b border-slate-300">
      {([["Practice", false], ["Worksheet", true]] as const).map(([label, on]) => (
        <button key={label} onClick={() => setSheetMode(on)}
          className={`pb-3 -mb-px text-base font-semibold border-b-2 transition-colors ${sheetMode === on ? "border-blue-900 text-blue-900" : "border-transparent text-slate-600 hover:text-slate-900"}`}>{label}</button>
      ))}
    </div>
  ) : null;
  const [sheetPreview, setSheetPreview] = useState<number | null>(null);
  // like the other tools' Worksheet mode: its own settings (level, options, how many), then Generate; it does not use the question on screen
  const sheetPanel = (
    <div className="p-4 sm:p-6 flex flex-col gap-5">
      <div className="[&>div]:justify-center [&>div]:gap-x-6">{controlRow}</div>
      <div className="flex justify-center items-center gap-3 flex-wrap">
        <label className="text-base font-semibold text-gray-700">Questions:</label>
        <input type="number" min={1} max={10} value={sheetN} onChange={(e) => setSheetN(Math.max(1, Math.min(10, parseInt(e.target.value) || 3)))}
          className="w-20 px-4 py-2 border border-slate-200 rounded-lg text-base font-semibold text-center" />
      </div>
      <div className="flex justify-center items-center gap-3 sm:gap-4 flex-wrap">
        <button onClick={generateSheet} disabled={!!sheetBusy} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-semibold text-base hover:bg-blue-800 disabled:opacity-60 flex items-center gap-2"><RefreshCw size={18} className={sheetBusy ? "animate-spin" : ""} /> {sheetBusy ? "Generating…" : "Generate"}</button>
        {sheet.length > 0 && (
          <>
            <button onClick={() => setSheetAnswers(!sheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-semibold text-base hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {sheetAnswers ? "Hide Answers" : "Show Answers"}</button>
            <PrintSplitButton onPrint={printSheet} printMode={printMode} setPrintMode={setPrintMode} />
          </>
        )}
      </div>
      {sheetBusy && <div className="text-center text-gray-500 text-base">{sheetBusy}</div>}
      {sheetNote && !sheetBusy && <div className="text-center text-amber-700 text-sm font-semibold">{sheetNote}</div>}
      {sheet.length === 0 && !sheetBusy && <div className="text-center text-gray-500 text-base">Choose the level, options and how many questions, then Generate.</div>}
      <div className="grid gap-4" style={{ gridTemplateColumns: isPhone ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))" }}>
        {sheet.map((pr, n) => (
          <button key={n} type="button" onClick={() => setSheetPreview(n)} title="Click to preview this question and its parts"
            className="text-left rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col hover:border-blue-900 hover:shadow-card transition-shadow">
            <div className="px-4 pt-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400"><span>Question {n + 1} · {pr.exam!.totalMarks} marks</span><span className="text-blue-900 normal-case tracking-normal">Preview</span></div>
            <div className="px-4 pt-1 text-sm font-semibold text-gray-900 leading-snug">{pr.exam!.intro}</div>
            <div className="relative m-3 rounded-lg border border-gray-200 overflow-hidden pointer-events-none" style={{ height: 220 }}>{renderCanvas ? renderCanvas(pr, undefined) : null}</div>
            <div className="px-4 pb-4 flex flex-col gap-2">
              {pr.exam!.parts.map((pt, k) => (
                <div key={k} className="text-sm leading-snug">
                  <div className="flex gap-2"><b>{pt.label}</b><span className="flex-1 text-gray-900">{pt.prompt}</span><span className="font-bold text-gray-500 whitespace-nowrap">[{pt.marks}]</span></div>
                  {sheetAnswers && (
                    <div className="mt-1 ml-7 rounded-md bg-slate-50 border border-slate-200 px-2.5 py-1.5 text-gray-800 font-semibold">
                      {pt.onDiagram ? "Shown on the network" : pt.model.map((l, j) => <div key={j} style={{ whiteSpace: "pre-line" }}>{l}</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
  // a generated question opened in full: the picture and its parts, answers and working, as when practising
  const previewQ = sheetPreview !== null ? sheet[sheetPreview] : undefined;
  const previewDialog = previewQ ? (
    <div className="fixed inset-0 z-[300] overflow-y-auto" style={{ backgroundColor: PAGE_BG }}>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white border-b border-gray-200 px-4 py-3">
        <div className="font-semibold text-slate-900">Question {sheetPreview! + 1} of {sheet.length}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSheetPreview(Math.max(0, sheetPreview! - 1))} disabled={sheetPreview === 0} className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center text-blue-900 disabled:opacity-40"><ChevronLeft size={18} /></button>
          <button onClick={() => setSheetPreview(Math.min(sheet.length - 1, sheetPreview! + 1))} disabled={sheetPreview === sheet.length - 1} className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center text-blue-900 disabled:opacity-40"><ChevronRight size={18} /></button>
          <button onClick={() => setSheetPreview(null)} className="px-4 py-2 rounded-xl bg-blue-900 text-white font-semibold">Close</button>
        </div>
      </div>
      <div className="max-w-[1180px] mx-auto">
        <ExamView key={previewQ.exam!.id} problem={previewQ} shown={(st) => (renderCanvas ? renderCanvas(previewQ, st) : null)} narrow={isPhone} tablet={isTablet}
          footer={typeof config.canvasFooter === "function" ? config.canvasFooter(previewQ) : config.canvasFooter} />
      </div>
    </div>
  ) : null;

  // an exam-style question has its own layout (the picture and lettered parts with marks); everything else is the stepped working above
  const body = inSheet ? sheetPanel : problem.exam ? <ExamView key={problem.exam.id} problem={problem} shown={shown} footer={footer} narrow={isPhone} tablet={isTablet} /> : example;

  if (failed)
    return (
      <div>
        {navBar}
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ backgroundColor: PAGE_BG }}>
          <div className="text-2xl font-bold text-gray-900">Something went wrong building that question.</div>
          <button onClick={() => window.location.reload()} className={BTN_PRIMARY}><RefreshCw size={18} /> Reload the page</button>
        </div>
      </div>
    );

  // ── fullscreen: the whole working area — the network AND the question, working and step controls — filling the screen ──
  if (fullscreen)
    return (
      <div className="fixed inset-0 z-[200] flex flex-col" style={{ backgroundColor: PAGE_BG }}>
        {overlay}
        {previewDialog}{levelInfoDialog}{printOpen && <PrintTemplates onClose={() => setPrintOpen(false)} />}
        {/* the same level, options and New Question controls as the page, so a class never has to leave fullscreen to change question */}
        <div className="flex-shrink-0 px-4 pt-3 pb-2">{controlRow}</div>
        <div className="flex-1 min-h-0 overflow-auto md:overflow-hidden px-4 pb-4 pt-0 flex flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-2 min-w-0 md:flex-[5] min-h-[60vh] md:min-h-0">
            <div className="relative flex-1 min-h-[320px] rounded-2xl border border-slate-300 shadow-card bg-white overflow-hidden">
              <div className="absolute inset-0">{shown(canvasStep)}</div>
              {/* in the same corner as the page's Fullscreen button, which this one replaces */}
              <button onClick={() => setFullscreen(false)} title="Exit fullscreen" className="absolute top-3 left-3 w-9 h-9 rounded-lg flex items-center justify-center bg-black/5 hover:bg-black/10">
                <Minimize2 size={18} color="#6b7280" />
              </button>
              {!config.noSandbox && (
                <button onClick={() => setSandbox(true)} title="Open this picture in the sandbox — move vertices, zoom and annotate" className="absolute top-3 left-14 h-9 px-2.5 rounded-lg flex items-center gap-1.5 bg-black/5 hover:bg-black/10 text-gray-500 font-bold text-sm">
                  <Move size={17} /> Sandbox
                </button>
              )}
            </div>
            {footer && <div className="flex justify-center flex-shrink-0">{footer}</div>}
            {!atQuestion && legendItems && <div className="flex-shrink-0"><Legend items={legendItems} /></div>}
          </div>
          <div className="flex flex-col gap-3 min-w-0 min-h-0 md:flex-[3] md:max-w-[620px] md:overflow-y-auto">
            {questionBlock(true)}
            {matrixCard && <div className="flex-shrink-0">{matrixCard}</div>}
            <div className="rounded-2xl border border-slate-300 shadow-card bg-white overflow-hidden flex flex-col flex-1 min-h-[300px]">
              <div className="px-5 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Working</div>
              <div className="flex-1 min-h-0">
                {atQuestion ? (
                  <div className="px-5 pb-5 text-lg text-gray-500 leading-snug">The working and the answer appear here, one step at a time.</div>
                ) : (
                  <StepCascade steps={steps} idx={idx} answer={onAnswer ? answerText : null} all={showAll} big />
                )}
              </div>
              {stepNavFor(true)}
            </div>
            {current?.list && current.list.items.length > 0 && <div className="flex-shrink-0"><ListCard list={current.list} /></div>}
            {current?.route && current.route.length > 0 && <div className="flex-shrink-0"><RouteCard route={current.route} /></div>}
          </div>
        </div>
      </div>
    );

  if (narrow) {
    const launchSteps: Array<{ title: string; choices: Array<{ value: string; label: string }>; pick: (v: string) => void }> = [
      ...topOptions.map((o) => ({ title: o.label, choices: o.choices, pick: (v: string) => chooseTop(o.key, v) })),
      ...(tabs.length > 1 ? [{ title: "What are we practising?", choices: tabs.map((t) => ({ value: t.key, label: t.label })), pick: (v: string) => { setSubTool(v); newQuestion(level, v, options); } }] : []),
    ];
    if (!started && launchSteps.length && !chooser) {
      const st = launchSteps[Math.min(launchIdx, launchSteps.length - 1)];
      return (
        <div>
          {navBar}
          <RotateHint show={isTablet && layout.portrait} />
          <div className="min-h-screen px-4 pt-6 pb-10" style={{ backgroundColor: PAGE_BG }}>
            <div className={`${isTablet ? "max-w-xl" : "max-w-md"} mx-auto flex flex-col gap-3`}>
              {launchIdx > 0 && <button onClick={() => setLaunchIdx(launchIdx - 1)} className="self-start text-sm font-semibold text-blue-900 mb-1">‹ Back</button>}
              <h2 className="text-xl font-semibold text-slate-900 mb-1">{st.title}</h2>
              {st.choices.map((c) => (
                <button key={c.value} onClick={() => { st.pick(c.value); if (launchIdx + 1 >= launchSteps.length) setStarted(true); else setLaunchIdx(launchIdx + 1); }}
                  className="flex items-center justify-between text-left bg-white rounded-2xl border border-slate-300 shadow-card px-5 py-4 font-semibold text-slate-900 text-base active:bg-slate-50">
                  {c.label}<span className="text-slate-300 text-xl">›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div>
        {navBar}
        <RotateHint show={isTablet && layout.portrait} />
        {overlay}
        {previewDialog}
        {infoOpen && <InfoModal infoSections={infoSections} onClose={() => setInfoOpen(false)} />}{levelInfoDialog}{printOpen && <PrintTemplates onClose={() => setPrintOpen(false)} />}
        <div className="min-h-screen px-3 pt-3 pb-24" style={{ backgroundColor: PAGE_BG }}>
          <div className={isTablet ? "max-w-[68rem] mx-auto" : undefined}>
            {topicChooser && <div className="sticky top-0 z-30 -mx-3 px-3 pb-2 pt-1" style={{ backgroundColor: PAGE_BG }}>{topicChooser}</div>}
            {examTabs && <div className="mb-3">{examTabs}</div>}
            <div className={`${CARD} overflow-clip`} style={
              tabletLand && !problem.exam && !inSheet ? { height: `calc(100dvh - ${atQuestion ? "9.5rem" : "12.5rem"} - env(safe-area-inset-bottom))`, minHeight: "24rem" }
              : atQuestion || inSheet ? undefined : { height: "calc(100dvh - 12rem - env(safe-area-inset-bottom))", minHeight: "26rem" }}>{body}</div>
          </div>
        </div>
        {!drawer && !inSheet && (
          <>
            {!atQuestion && (
              // the stepper: fixed just above the buttons, in the same columns as them (as in the other tools' phone Worked Example)
              <div className="fixed inset-x-0 z-30 px-3 pt-2 pb-1 bg-white border-t border-slate-200" style={{ bottom: "calc(3.75rem + env(safe-area-inset-bottom))", ...(isTablet ? BAR_INSET : {}) }}>
                <div className="flex items-center justify-between">
                  <button onClick={() => jump(stepIdx - 1)} aria-label="Previous step" disabled={stepIdx <= 0}
                    className="w-14 h-12 rounded-xl flex items-center justify-center bg-blue-900 text-white disabled:bg-black/10 disabled:text-gray-400 disabled:opacity-40"><ChevronLeft size={24} /></button>
                  <div className="flex flex-1 min-w-0 flex-col items-center gap-1.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">{onAnswer ? "Answer" : `Step ${idx + 1} of ${steps.length}`}</span>
                      <button
                        onClick={() => { if (showAll) jump(resumeAt.current); else { resumeAt.current = stepIdx; setShowAll(true); setStepIdx(maxBeat); } }}
                        className="px-4 py-1.5 rounded-lg font-bold text-sm border-2"
                        style={{ background: showAll ? "#fff" : "#1e3a8a", color: showAll ? "#6b7280" : "#fff", borderColor: showAll ? "#d1d5db" : "#1e3a8a" }}>
                        {showAll ? "Show All" : "Step-by-Step"}
                      </button>
                    </div>
                    <div className="flex w-full gap-1">
                      {Array.from({ length: steps.length + (answerText ? 1 : 0) }, (_, i) => (
                        <button key={i} aria-label={i === steps.length ? "Answer" : `Step ${i + 1}`} onClick={() => jump(i)}
                          className="h-1.5 flex-1 rounded-full" style={{ background: i <= (onAnswer ? steps.length : idx) ? "#1e3a8a" : "#e2e8f0" }} />
                      ))}
                    </div>
                  </div>
                  <button onClick={() => jump(stepIdx + 1)} aria-label="Next step" disabled={stepIdx >= maxBeat}
                    className="w-14 h-12 rounded-xl flex items-center justify-center bg-blue-900 text-white disabled:bg-black/10 disabled:text-gray-400 disabled:opacity-40"><ChevronRight size={24} /></button>
                </div>
              </div>
            )}
            <div className={`fixed bottom-0 inset-x-0 z-40 bg-white px-3 flex gap-2 ${atQuestion ? "pt-2 border-t border-slate-200" : "pt-1"}`} style={{ ...(isTablet ? BAR_INSET : {}), paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))", height: "calc(3.75rem + env(safe-area-inset-bottom))", boxShadow: atQuestion ? "0 -4px 16px rgba(0,0,0,0.06)" : "none" }}>
              <button onClick={() => setDrawer(true)} aria-label="Options" className={`${isTablet ? "px-5 gap-2 font-semibold" : "w-14"} h-12 shrink-0 bg-white border border-slate-200 text-blue-900 rounded-xl flex items-center justify-center active:bg-slate-50`}><SlidersHorizontal size={20} />{isTablet && "Options"}</button>
              {problem.exam ? (
                // an exam-style question reveals its answers part by part inside the question, so the bar just offers the next question
                <>
                  <PinButton keeper={keeper} size="phone" />
                  <button onClick={() => newQuestion()} className="flex-1 h-12 bg-blue-900 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 active:bg-blue-800"><RefreshCw size={18} /> New question</button>
                </>
              ) : (
                <>
                  <button onClick={() => jump(atQuestion ? 0 : -1)} className="flex-1 h-12 bg-blue-900 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 active:bg-blue-800"><Eye size={18} /> {atQuestion ? "Show answer" : "Hide answer"}</button>
                  <PinButton keeper={keeper} size="phone" />
                  <button onClick={() => newQuestion()} aria-label="New question" title="New question" className={`${isTablet ? "px-5 gap-2 font-semibold" : "w-14"} h-12 shrink-0 bg-white border border-slate-200 text-blue-900 rounded-xl flex items-center justify-center active:bg-slate-50`}><RefreshCw size={20} />{isTablet && "New"}</button>
                </>
              )}
            </div>
          </>
        )}
        {drawer && (
          // full-screen sheet: a clean page of its own for the options, one big Done at the thumb
          <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: PAGE_BG }}>
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
              <div className="min-w-0">
                <div className="font-bold text-gray-900 text-base leading-tight">Question options</div>
                <div className="text-xs text-gray-500 truncate">{config.pageTitle}</div>
              </div>
              <button onClick={() => setDrawer(false)} aria-label="Close" className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"><X size={22} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-4 flex flex-col gap-4">
                {!chooser && topOptions.map((o) => (
                  <div key={o.key} className="bg-white rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{o.label}</div>
                    <SegButtons value={options[o.key]} opts={o.choices} onChange={(v) => chooseTop(o.key, v)} />
                  </div>
                ))}
                {!chooser && tabs.length > 1 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Question type</div>
                    <div className="flex flex-col gap-1.5">
                      {tabs.map((t) => (
                        <button
                          key={t.key}
                          onClick={() => { setSubTool(t.key); newQuestion(level, t.key, options); setDrawer(false); }}
                          className={`w-full text-left px-3.5 py-2 rounded-lg font-semibold text-sm border transition-colors ${subTool === t.key ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-200 text-gray-700"}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {hasLevels && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Level</div>
                    <DifficultyToggle fullWidth
                      value={levelKey(Math.min(level, levelCount))}
                      levels={Array.from({ length: levelCount }, (_, i) => levelKey(i + 1))}
                      onChange={(v) => {
                        const lv = parseInt(v.replace("level", ""), 10);
                        setLevel(lv);
                        const opts = { ...options };
                        for (const o of config.options ?? []) if (o.defaultFor && !o.multi && opts[o.key] === o.defaultFor(level)) opts[o.key] = o.defaultFor(lv);
                        setOptions(opts);
                        newQuestion(lv, subTool, opts);
                      }}
                    />
                  </div>
                )}
                {visibleOptions.map((o) => (
                  <div key={o.key} className="bg-white rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{o.label}</div>
                    <OptionControl o={o} value={options[o.key]} level={level} sub={subTool} onChange={(v) => { const opts = { ...options, [o.key]: v }; setOptions(opts); newQuestion(level, subTool, opts); }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-3 pt-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
              <button onClick={() => setDrawer(false)} className="w-full h-12 bg-blue-900 text-white rounded-xl font-bold text-base active:bg-blue-800">Done</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {navBar}
      {overlay}
      {previewDialog}
      {infoOpen && <InfoModal infoSections={infoSections} onClose={() => setInfoOpen(false)} />}{levelInfoDialog}{printOpen && <PrintTemplates onClose={() => setPrintOpen(false)} />}
      <div className="min-h-screen p-3 sm:px-8 sm:py-5" style={{ backgroundColor: PAGE_BG }}>
        <div className="max-w-[1180px] mx-auto">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-3 sm:mb-5" style={{ color: "#0f172a" }}>{config.pageTitle}</h1>
          {/* TOP TIER: the big either/or (e.g. capacity only ⇄ min and max) — it changes the whole kind of network */}
          {!chooser && topOptions.map((o) => (
            <div key={o.key} className="flex justify-center mb-4">
              <div className="inline-flex gap-1 rounded-xl bg-slate-200/60 p-1">
                {o.choices.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => chooseTop(o.key, c.value)}
                    className={`px-5 sm:px-8 py-2 rounded-lg font-semibold text-sm sm:text-base transition-colors ${options[o.key] === c.value ? "bg-white text-blue-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {/* SECOND TIER: the question styles */}
          {!chooser && tabs.length > 1 && (
            <>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => {
                      setSubTool(t.key);
                      newQuestion(level, t.key, options);
                    }}
                    className={tabBtn(subTool === t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="flex flex-col gap-4">
            {topicChooser}
            {!chooser && examTabs}
            {!inSheet && controlBar}
            <div className={`${CARD} overflow-clip`}>{body}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── The working, as the other tools show theirs ────────────────────────────────
// A numbered timeline in a scrolling box. Each new step fades in; earlier steps stay on screen at half strength
// so the class can see what came before; the box follows the newest step and fades out at the top once older
// steps have scrolled away. The answer arrives last, as a green "A" line. (Show all: everything at full strength.)
// One Question Option: one choice from several (segmented), or — for a `multi` option — any of them ticked (never none). Ticking exactly what the level
// would have selected goes back to "" so the option keeps following the level.
function OptionControl({ o, value, onChange, level, sub }: { o: NonNullable<DecisionShellProps["config"]["options"]>[number]; value: string; onChange: (v: string) => void; level: number; sub: string }) {
  // single buttons, never more than two to a row; an odd last one sits centred on a row of its own
  const on = o.multi ? ticksOf(o, value, level, sub) : [value];
  const auto = o.multi ? ticksOf(o, "", level, sub) : [];
  const press = (v: string) => {
    if (!o.multi) { onChange(v); return; }
    const next = on.includes(v) ? on.filter((x) => x !== v) : [...on, v];
    if (!next.length) return; // never none
    const ordered = o.choices.map((c) => c.value).filter((x) => next.includes(x));
    onChange(ordered.length === auto.length && ordered.every((x) => auto.includes(x)) ? "" : ordered.join(","));
  };
  return <OptionGrid items={o.choices.map((c) => ({ ...c, active: on.includes(c.value) }))} onPress={press} />;
}

const CHIP_TONE: Record<NonNullable<StepListItem["tone"]>, { bg: string; border: string; fg: string; strike?: boolean }> = {
  pending: { bg: "#f1f5f9", border: "#cbd5e1", fg: "#334155" },
  current: { bg: "#fef3c7", border: "#f59e0b", fg: "#92400e" },
  good: { bg: "#dcfce7", border: "#16a34a", fg: "#166534" },
  bad: { bg: "#fee2e2", border: "#fca5a5", fg: "#991b1b", strike: true },
  note: { bg: "#e0e7ff", border: "#a5b4fc", fg: "#1e3a8a" },
};

// A titled row of chips: Kruskal's edges in order, Prim's candidates, the tour so far…
function ListCard({ list }: { list: StepList }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{list.title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {list.items.map((it, i) => {
          const t = CHIP_TONE[it.tone ?? "pending"];
          return (
            <span
              key={i}
              style={{
                padding: "3px 9px", borderRadius: 8, fontWeight: 800, fontSize: 15, background: t.bg, color: t.fg,
                border: `1.5px solid ${t.border}`, textDecoration: t.strike ? "line-through" : undefined, whiteSpace: "nowrap",
              }}
            >
              {it.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function RouteCard({ route }: { route: string[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Route so far</div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        {route.map((v, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {i > 0 && <span style={{ color: "#94a3b8", fontWeight: 700 }}>→</span>}
            <span
              style={{
                minWidth: 30, textAlign: "center", padding: "3px 8px", borderRadius: 8, fontWeight: 800, fontSize: 15, color: "#1e3a8a",
                background: i === route.length - 1 ? "#fef3c7" : "#f1f5f9",
                border: `1px solid ${i === route.length - 1 ? "#f59e0b" : "#cbd5e1"}`,
              }}
            >
              {v}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 16px" }}>
      {items.map((it) => (
        <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#334155", fontWeight: 600, whiteSpace: "nowrap" }}>
          <Swatch kind={it.swatch} />
          {it.label}
        </div>
      ))}
    </div>
  );
}

function Swatch({ kind }: { kind: LegendItem["swatch"] }) {
  if (kind === "indirect") return <span style={{ width: 28, textAlign: "center", fontStyle: "italic", fontWeight: 700, color: "#1d4ed8" }}>12</span>;
  if (kind === "current" || kind === "visited" || kind === "deleted") {
    const s = NODE_ROLE_STYLE[kind];
    return (
      <svg width={20} height={20} style={{ flexShrink: 0 }}>
        <circle cx={10} cy={10} r={8} fill={s.fill} stroke={s.stroke} strokeWidth={2.5} />
      </svg>
    );
  }
  const s = EDGE_STYLE[kind];
  return (
    <svg width={28} height={20} style={{ flexShrink: 0 }}>
      <line x1={2} y1={10} x2={26} y2={10} stroke={s.stroke} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinecap="round" opacity={s.opacity} />
    </svg>
  );
}
