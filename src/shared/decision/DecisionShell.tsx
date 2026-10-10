import { useEffect, useMemo, useRef, useState } from "react";
import { useDevMode } from "../../devMode";
import { Home, Menu, X, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Maximize2, Minimize2, FastForward, Move, SlidersHorizontal } from "lucide-react";
import type { DecisionProblem, DecisionShellProps, GenerateContext, LegendItem, SolveStep, StepList, StepListItem } from "./types";
import type { InfoSection } from "../types";
import NetworkView, { EDGE_STYLE, NODE_ROLE_STYLE } from "./representations/NetworkView";
import MatrixView from "./representations/MatrixView";
import { SandboxOverlay } from "./representations/SandboxBoard";
import { DifficultyToggle } from "../components/DifficultyToggle";
import { MenuDropdown } from "../components/MenuDropdown";
import { InfoModal } from "../components/InfoModal";
import { SegButtons, usePopover } from "../components/QOPopovers";
import { getQuestionBg } from "../colors";

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
const CARD = "bg-white rounded-2xl border border-slate-200 shadow-card min-w-0";
const BTN = "px-4 sm:px-6 py-2 rounded-xl font-semibold text-base transition-colors flex items-center gap-2";
const BTN_PRIMARY = `${BTN} bg-blue-900 text-white hover:bg-blue-800`;

const defaultOptions = (config: DecisionShellProps["config"], level: number): Record<string, string> =>
  Object.fromEntries((config.options ?? []).map((o) => [o.key, o.defaultFor?.(level) ?? o.choices[0].value]));

// ── URL ⇄ state (only non-default values) ───────────────────────────────────────
function readUrl(config: DecisionShellProps["config"]) {
  const q = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const levels = config.levels ?? 1;
  const lv = parseInt(q.get("level") ?? "", 10);
  const level = lv >= 1 && lv <= levels ? lv : 1;
  const tool = q.get("tool");
  const subTool = config.subTools?.some((t) => t.key === tool) ? (tool as string) : config.subTools?.[0]?.key ?? "";
  const options = defaultOptions(config, level);
  for (const o of config.options ?? []) {
    const v = q.get(`o_${o.key}`);
    if (v && o.choices.some((c) => c.value === v)) options[o.key] = v;
  }
  return { level, subTool, options };
}

export default function DecisionShell({ generate, solve, renderCanvas, config }: DecisionShellProps) {
  const init = useMemo(() => readUrl(config), []); // eslint-disable-line react-hooks/exhaustive-deps
  const levelCount = config.levels ?? 1;
  const [level, setLevel] = useState(init.level);
  const [subTool, setSubTool] = useState(init.subTool);
  const [options, setOptions] = useState<Record<string, string>>(init.options);
  // the generator only ever sees the options that are on offer for this sub-tool (a hidden one never leaks in)
  const shownFor = (sub: string) => (o: NonNullable<DecisionShellProps["config"]["options"]>[number]) => o.top || !o.forSubTools || o.forSubTools.includes(sub);
  const ctxOf = (sub: string, opts: Record<string, string>): GenerateContext => ({
    subTool: sub,
    options: Object.fromEntries((config.options ?? []).filter(shownFor(sub)).map((o) => [o.key, opts[o.key]])),
  });
  const [failed, setFailed] = useState(false); // generate() gave up: the page asks for a reload
  const [problem, setProblem] = useState<DecisionProblem>(() => generate(init.level, ctxOf(init.subTool, init.options)));
  // -1 = the question only; 0…last = the working, one step at a time; last+1 = the answer (when it fits on a line)
  const [stepIdx, setStepIdx] = useState(-1);
  const [showAll, setShowAll] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [sandbox, setSandbox] = useState(false); // the picture opened in the sandbox (the question's own picture never moves)
  const resumeAt = useRef(-1); // where the class was before Show all
  // Phone layout — the same ≤640px switch ToolShell uses: compact header, one settings banner + drawer instead of the tab rows and control bar
  const [stageTab, setStageTab] = useState<"graph" | "table" | null>(null); // phone: which picture the pinned stage shows (null = automatic)
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches);
  const [drawer, setDrawer] = useState(false);
  // Phone: click-through start (the big either/or option, then the question type) before the tool; a link naming a setup skips it.
  const [started, setStarted] = useState(() => typeof window !== "undefined" && /[?&](tool|level)=/.test(window.location.search));
  const [launchIdx, setLaunchIdx] = useState(0);
  useEffect(() => setStageTab(null), [stepIdx]);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
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
  const topOptions = (config.options ?? []).filter((o) => o.top && (!o.forSubTools || o.forSubTools.includes(subTool)));
  const visibleOptions = (config.options ?? []).filter((o) => !o.top && (!o.forSubTools || o.forSubTools.includes(subTool)));
  const qBg = getQuestionBg(colorScheme);
  // level labels may differ by question type (the TSP table question has no "complete network" level)
  const levelLabel = (Array.isArray(config.levelLabels) ? config.levelLabels : config.levelLabels?.[subTool])?.[level - 1];

  const newQuestion = (lv = level, sub = subTool, opts = options) => {
    try {
      setProblem(generate(lv, ctxOf(sub, opts)));
      setStepIdx(-1);
      setShowAll(false);
    } catch {
      setFailed(true);
    }
  };

  // keep the address bar bookmarkable
  useEffect(() => {
    const q = new URLSearchParams();
    if (config.subTools && subTool !== config.subTools[0]?.key) q.set("tool", subTool);
    if (level !== 1) q.set("level", String(level));
    for (const o of config.options ?? []) if (shownFor(subTool)(o) && options[o.key] !== (o.defaultFor?.(level) ?? o.choices[0].value)) q.set(`o_${o.key}`, options[o.key]);
    const keep = new URLSearchParams(window.location.search).get("tpl"); // dev link: pinned template
    if (keep) q.set("tpl", keep);
    const s = q.toString();
    window.history.replaceState(null, "", window.location.pathname + (s ? `?${s}` : ""));
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

  const infoSections: InfoSection[] = config.infoSections ?? [
    {
      title: config.pageTitle,
      icon: "🕸️",
      content: [
        { label: "Worked Example", detail: "Every question is worked through: the question and one large network, with the working beside it one step at a time (Next / Back, or the arrow keys). Earlier steps fade but stay on screen; Show all jumps to the end." },
      ],
    },
  ];

  const questionNet = problem.vertexOnlyQuestion ? { ...problem.network, edges: [] } : problem.network; // a table-only question draws just the vertices
  const shown = (st: SolveStep | undefined) =>
    renderCanvas ? renderCanvas(problem, st) : <NetworkView network={st?.network ?? (!st ? questionNet : problem.network)} step={st} background="#ffffff" />;
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
            {started && (
              // breadcrumb: each part reopens the start screen where it was chosen
              <div className="flex items-center justify-center gap-1 text-[12px] text-blue-200 whitespace-nowrap overflow-hidden">
                {[
                  ...topOptions.map((o, i) => ({ label: o.choices.find((c) => c.value === options[o.key])?.label ?? o.label, onClick: () => { setLaunchIdx(i); setStarted(false); } })),
                  ...((config.subTools?.length ?? 0) > 1 ? [{ label: config.subTools!.find((t) => t.key === subTool)?.label ?? "", onClick: () => { setLaunchIdx(topOptions.length); setStarted(false); } }] : []),
                  ...(levelCount > 1 ? [{ label: `L${level}`, onClick: () => setDrawer(true) }] : []),
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
          {menuOpen && <MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={() => setMenuOpen(false)} onOpenInfo={() => setInfoOpen(true)} />}
        </div>
      </div>
    </div>
  );

  const tabBtn = (active: boolean) =>
    `px-4 py-2 sm:px-5 rounded-full font-semibold text-sm sm:text-[15px] transition-colors ${active ? "bg-blue-900 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`;

  const controlRow = (
      <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-3">
        {levelCount > 1 && (
          <DifficultyToggle
            value={levelKey(level)}
            levels={Array.from({ length: levelCount }, (_, i) => levelKey(i + 1))}
            onChange={(v) => {
              const lv = parseInt(v.replace("level", ""), 10);
              setLevel(lv);
              // options with a per-level default follow the level; the teacher's own choices stay put
              const opts = { ...options };
              for (const o of config.options ?? []) if (o.defaultFor) opts[o.key] = o.defaultFor(lv);
              setOptions(opts);
              newQuestion(lv, subTool, opts);
            }}
          />
        )}
        {visibleOptions.length > 0 && (
          <div className="relative" ref={optionsPop.ref}>
            <button
              onClick={() => optionsPop.setOpen(!optionsPop.open)}
              className={`px-4 py-2 rounded-xl border font-semibold text-base transition-colors flex items-center gap-2 ${optionsPop.open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            >
              Question Options
              <ChevronDown size={18} style={{ transition: "transform 0.2s", transform: optionsPop.open ? "rotate(180deg)" : "rotate(0)" }} />
            </button>
            {optionsPop.open && (
              <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-[min(24rem,86vw)] p-5 flex flex-col gap-5">
                {visibleOptions.map((o) => (
                  <div key={o.key}>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{o.label}</div>
                    <SegButtons
                      value={options[o.key]}
                      opts={o.choices}
                      onChange={(v) => {
                        const opts = { ...options, [o.key]: v };
                        setOptions(opts);
                        newQuestion(level, subTool, opts);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <button onClick={() => newQuestion()} className={BTN_PRIMARY}>
          <RefreshCw size={18} /> New Question
        </button>
      </div>
  );

  const controlBar = (
    <div className={`${CARD} p-3 sm:p-4 flex flex-col gap-3`}>
      {controlRow}
      {levelCount > 1 && levelLabel && (
        <div className="text-center text-sm font-semibold text-gray-400">{levelLabel}</div>
      )}
    </div>
  );

  // Step controls live at the foot of the Answer section (as in the other tools' worked examples), not in the
  // question control bar: ◀ back · where we are · Show all ⇄ Step by step · next ▶, then a dot strip.
  // `gutter`: fullscreen leaves room on the right for the floating pen (ink) button so it never sits on Next
  const stepNavFor = (gutter: boolean) => (
    <div className={`border-t border-gray-200 bg-gray-50 ${gutter ? "pl-4 pr-16" : "px-4"} py-3`}>
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => jump(stepIdx - 1)}
          disabled={atQuestion}
          title="Back"
          className="w-12 h-12 rounded-xl border-2 border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={26} />
        </button>
        <div className="flex flex-col items-center gap-1 min-w-0">
          <div className="font-bold text-gray-600 text-base text-center whitespace-nowrap">
            {atQuestion ? "Question" : onAnswer ? "Answer" : `Step ${idx + 1} of ${steps.length}`}
          </div>
          <button
            onClick={() => {
              // a second press in the same place puts the class back where they were, never at the start or the end
              if (showAll) jump(resumeAt.current);
              else { resumeAt.current = stepIdx; setShowAll(true); setStepIdx(maxBeat); }
            }}
            className="text-sm font-bold text-blue-900 underline-offset-2 hover:underline flex items-center gap-1 whitespace-nowrap"
          >
            <FastForward size={14} /> {showAll ? "Step by step" : "Show all"}
          </button>
        </div>
        <button
          onClick={() => jump(stepIdx + 1)}
          disabled={stepIdx >= maxBeat}
          title={atQuestion ? "Show working" : "Next"}
          className="h-12 px-4 rounded-xl bg-blue-900 text-white font-bold flex items-center gap-1.5 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {atQuestion && <span className="hidden sm:inline">Show working</span>}
          <ChevronRight size={26} />
        </button>
      </div>
      <div className="mt-3 flex justify-center items-center gap-2">
        <button onClick={() => jump(-1)} title="Question" style={{ width: 10, height: 10, borderRadius: 2, border: "none", cursor: "pointer", background: atQuestion ? "#1e3a8a" : "#d1d5db" }} />
        {steps.map((_, i) => (
          <button key={i} onClick={() => jump(i)} title={`Step ${i + 1}`} style={{ width: 10, height: 10, borderRadius: 5, border: "none", cursor: "pointer", background: !atQuestion && !onAnswer && i === idx ? "#1e3a8a" : "#d1d5db" }} />
        ))}
        {answerText && (
          <button onClick={() => jump(last + 1)} title="Answer" style={{ width: 24, height: 10, borderRadius: 5, border: "none", cursor: "pointer", background: onAnswer ? "#16a34a" : "#d1d5db" }} />
        )}
      </div>
    </div>
  );
  const stepNav = stepNavFor(false);

  const questionBlock = (big: boolean) => (
    <div className={`rounded-xl ${big ? (short ? "px-5 py-3" : "px-6 py-4") : "px-7 py-5"} flex-shrink-0`} style={{ backgroundColor: qBg, border: "1px solid #e5e7eb" }}>
      <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">{config.instruction ?? "Question"}</div>
      <div className={`${big ? (short ? "text-lg" : "text-xl xl:text-2xl") : "text-lg"} font-semibold text-gray-900 leading-snug`}>{problem.prompt}</div>
    </div>
  );

  const canvasBox = (height: string) => (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white" style={{ height, minHeight: narrow ? 200 : 380 }}>
      {shown(canvasStep)}
      <button
        onClick={() => setFullscreen(true)}
        title="Fullscreen"
        className="absolute top-3 left-3 w-9 h-9 rounded-lg flex items-center justify-center bg-black/5 hover:bg-black/10"
      >
        <Maximize2 size={18} color="#6b7280" />
      </button>
      <button
        onClick={() => setSandbox(true)}
        title="Open this picture in the sandbox — move vertices, zoom and annotate"
        className="absolute top-3 left-14 h-9 px-2.5 rounded-lg flex items-center gap-1.5 bg-black/5 hover:bg-black/10 text-gray-500 font-bold text-sm"
      >
        <Move size={17} /> <span className={narrow ? "hidden" : ""}>Sandbox</span>
      </button>
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
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
      <div className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Answer</div>
      {/* fixed height, so the controls below never move as steps are added */}
      <div style={{ height: narrow ? "min(36vh, 300px)" : "min(46vh, 480px)", minHeight: narrow ? 200 : 260 }}>
        {atQuestion ? (
          <div className="px-5 pb-5 text-base text-gray-500 leading-snug">The working and the answer appear here, one step at a time.</div>
        ) : (
          <StepCascade steps={steps} idx={idx} answer={onAnswer ? answerText : null} all={showAll} />
        )}
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
      {canvasBox(narrow ? "250px" : "min(74vh, 800px)")}
      {footer && <div className="flex justify-center">{footer}</div>}
      {!atQuestion && legendItems && <Legend items={legendItems} />}
    </>
  );

  const example = narrow ? (
    // phone: the question and the picture are pinned at the top while the working scrolls under them, so what is being
    // worked on is never pushed off screen; the table and the graph share the stage (a switch, automatic when a step builds the table)
    <div className="flex flex-col">
      <div className="sticky top-0 z-20 flex flex-col gap-2 p-2 border-b border-gray-200" style={{ backgroundColor: "#f8f9fb" }}>
        <details className="rounded-lg bg-white border border-gray-200 px-3 py-1.5">
          <summary className="text-sm font-semibold text-gray-800 leading-snug cursor-pointer list-none flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Question</span>
            <span className="truncate">{problem.prompt}</span>
          </summary>
          <div className="pt-1 pb-1 text-sm text-gray-800 leading-snug">{problem.prompt}</div>
        </details>
        {showMatrix && (
          <div className="flex rounded-lg border border-gray-300 overflow-hidden self-center text-sm font-bold">
            {(["graph", "table"] as const).map((t) => (
              <button key={t} onClick={() => setStageTab(t)} className={`px-4 py-1 ${stageView === t ? "bg-blue-900 text-white" : "bg-white text-gray-600"}`}>{t === "graph" ? "Graph" : "Table"}</button>
            ))}
          </div>
        )}
        {showMatrix && stageView === "table"
          ? <div className="overflow-auto rounded-xl border border-gray-200 bg-white p-2 flex justify-center" style={{ maxHeight: "36dvh" }}>{matrixInner}</div>
          : canvasBox(showMatrix ? "30dvh" : "36dvh")}
      </div>
      <div className="p-2 flex flex-col gap-3">
        {!atQuestion && legendItems && <Legend items={legendItems} />}
        {answerCard}
        {workingExtras}
      </div>
    </div>
  ) : (
    <div className="p-3 sm:p-6 grid gap-4 sm:gap-6 items-start" style={{ gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)" }}>
      {/* the graph stays in view while the working scrolls */}
      <div className="flex flex-col gap-4 sticky top-3 min-w-0">
        {canvasCol}
      </div>
      <div className="flex flex-col gap-4 min-w-0">
        {questionBlock(false)}
        {matrixCard}
        {answerCard}
        {workingExtras}
      </div>
    </div>
  );

  if (failed)
    return (
      <div>
        {navBar}
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ backgroundColor: "#f8f9fb" }}>
          <div className="text-2xl font-bold text-gray-900">Something went wrong building that question.</div>
          <button onClick={() => window.location.reload()} className={BTN_PRIMARY}><RefreshCw size={18} /> Reload the page</button>
        </div>
      </div>
    );

  // ── fullscreen: the whole working area — the network AND the question, working and step controls — filling the screen ──
  if (fullscreen)
    return (
      <div className="fixed inset-0 z-[200] flex flex-col" style={{ backgroundColor: "#f8f9fb" }}>
        {overlay}
        <div className="flex items-center justify-between px-5 py-2.5 bg-blue-900 text-white flex-shrink-0">
          <div className="font-bold text-lg">{config.pageTitle}{levelCount > 1 && levelLabel ? <span className="ml-3 text-sm font-semibold text-blue-200">Level {level} — {levelLabel}</span> : null}</div>
          <div className="flex items-center gap-1">
            <button onClick={() => setSandbox(true)} title="Open this picture in the sandbox" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-800 font-semibold">
              <Move size={18} /> Sandbox
            </button>
            <button onClick={() => setFullscreen(false)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-800 font-semibold">
              <Minimize2 size={18} /> Exit fullscreen
            </button>
          </div>
        </div>
        {/* the same level, options and New Question controls as the page, so a class never has to leave fullscreen to change question */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2">{controlRow}</div>
        <div className="flex-1 min-h-0 overflow-auto md:overflow-hidden p-3 flex flex-col md:flex-row gap-3">
          <div className="flex flex-col gap-2 min-w-0 md:flex-[5] min-h-[60vh] md:min-h-0">
            <div className="relative flex-1 min-h-[320px] rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="absolute inset-0">{shown(canvasStep)}</div>
            </div>
            {footer && <div className="flex justify-center flex-shrink-0">{footer}</div>}
            {!atQuestion && legendItems && <div className="flex-shrink-0"><Legend items={legendItems} /></div>}
          </div>
          <div className="thin-scroll flex flex-col gap-3 min-w-0 min-h-0 md:flex-[3] md:max-w-[620px] md:overflow-y-auto">
            {questionBlock(true)}
            {matrixCard && <div className="flex-shrink-0">{matrixCard}</div>}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col flex-1 min-h-[300px]">
              <div className="px-5 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Answer</div>
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
      ...topOptions.map((o) => ({ title: o.label, choices: o.choices, pick: (v: string) => { const opts = { ...options, [o.key]: v }; setOptions(opts); newQuestion(level, subTool, opts); } })),
      ...((config.subTools?.length ?? 0) > 1 ? [{ title: "What are we practising?", choices: config.subTools!.map((t) => ({ value: t.key, label: t.label })), pick: (v: string) => { setSubTool(v); newQuestion(level, v, options); } }] : []),
    ];
    if (!started && launchSteps.length) {
      const st = launchSteps[Math.min(launchIdx, launchSteps.length - 1)];
      return (
        <div>
          {navBar}
          <div className="min-h-screen px-4 pt-6 pb-10" style={{ backgroundColor: "#f8f9fb" }}>
            <div className="max-w-md mx-auto flex flex-col gap-3">
              {launchIdx > 0 && <button onClick={() => setLaunchIdx(launchIdx - 1)} className="self-start text-sm font-semibold text-blue-900 mb-1">‹ Back</button>}
              <h2 className="text-xl font-semibold text-slate-900 mb-1">{st.title}</h2>
              {st.choices.map((c) => (
                <button key={c.value} onClick={() => { st.pick(c.value); if (launchIdx + 1 >= launchSteps.length) setStarted(true); else setLaunchIdx(launchIdx + 1); }}
                  className="flex items-center justify-between text-left bg-white rounded-2xl border border-slate-200 shadow-card px-5 py-4 font-semibold text-slate-900 text-base active:bg-slate-50">
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
        {overlay}
        {infoOpen && <InfoModal infoSections={infoSections} onClose={() => setInfoOpen(false)} />}
        <div className="min-h-screen px-3 pt-3 pb-24" style={{ backgroundColor: "#f8f9fb" }}>
          <div className={`${CARD} overflow-clip`}>{example}</div>
        </div>
        {!drawer && (
          <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 px-3 pt-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))", boxShadow: "0 -4px 16px rgba(0,0,0,0.08)" }}>
            <div className="flex gap-2">
              <button onClick={() => newQuestion()} className="flex-1 h-12 bg-blue-900 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 active:bg-blue-800"><RefreshCw size={18} /> New question</button>
              <button onClick={() => setDrawer(true)} aria-label="Options" className="w-12 h-12 shrink-0 bg-white border border-slate-200 text-blue-900 rounded-xl flex items-center justify-center active:bg-slate-50"><SlidersHorizontal size={20} /></button>
            </div>
          </div>
        )}
        {drawer && (
          // full-screen sheet: a clean page of its own for the options, one big Done at the thumb
          <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "#f8f9fb" }}>
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
              <div className="min-w-0">
                <div className="font-bold text-gray-900 text-base leading-tight">Question options</div>
                <div className="text-xs text-gray-500 truncate">{config.pageTitle}</div>
              </div>
              <button onClick={() => setDrawer(false)} aria-label="Close" className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"><X size={22} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-4 flex flex-col gap-4">
                {topOptions.map((o) => (
                  <div key={o.key} className="bg-white rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{o.label}</div>
                    <SegButtons value={options[o.key]} opts={o.choices} onChange={(v) => { const opts = { ...options, [o.key]: v }; setOptions(opts); newQuestion(level, subTool, opts); }} />
                  </div>
                ))}
                {(config.subTools?.length ?? 0) > 1 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Question type</div>
                    <div className="flex flex-col gap-1.5">
                      {config.subTools!.map((t) => (
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
                {levelCount > 1 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Level</div>
                    <DifficultyToggle fullWidth
                      value={levelKey(level)}
                      levels={Array.from({ length: levelCount }, (_, i) => levelKey(i + 1))}
                      onChange={(v) => {
                        const lv = parseInt(v.replace("level", ""), 10);
                        setLevel(lv);
                        const opts = { ...options };
                        for (const o of config.options ?? []) if (o.defaultFor) opts[o.key] = o.defaultFor(lv);
                        setOptions(opts);
                        newQuestion(lv, subTool, opts);
                      }}
                    />
                  </div>
                )}
                {visibleOptions.map((o) => (
                  <div key={o.key} className="bg-white rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{o.label}</div>
                    <SegButtons value={options[o.key]} opts={o.choices} onChange={(v) => { const opts = { ...options, [o.key]: v }; setOptions(opts); newQuestion(level, subTool, opts); }} />
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
      {infoOpen && <InfoModal infoSections={infoSections} onClose={() => setInfoOpen(false)} />}
      <div className="min-h-screen p-3 sm:px-8 sm:py-5" style={{ backgroundColor: "#f8f9fb" }}>
        <div className="max-w-[1500px] mx-auto">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-3 sm:mb-5" style={{ color: "#0f172a" }}>{config.pageTitle}</h1>
          {/* TOP TIER: the big either/or (e.g. capacity only ⇄ min and max) — it changes the whole kind of network */}
          {topOptions.map((o) => (
            <div key={o.key} className="flex justify-center mb-4">
              <div className="inline-flex gap-1 rounded-xl bg-slate-200/60 p-1">
                {o.choices.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      const opts = { ...options, [o.key]: c.value };
                      setOptions(opts);
                      newQuestion(level, subTool, opts);
                    }}
                    className={`px-5 sm:px-8 py-2 rounded-lg font-semibold text-sm sm:text-base transition-colors ${options[o.key] === c.value ? "bg-white text-blue-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {/* SECOND TIER: the question styles */}
          {(config.subTools?.length ?? 0) > 1 && (
            <>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4">
                {config.subTools!.map((t) => (
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
            {controlBar}
            <div className={`${CARD} overflow-clip`}>{example}</div>
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
function FadeIn({ children }: { children: React.ReactNode }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div style={{ opacity: on ? 1 : 0, transition: "opacity 0.7s ease" }}>{children}</div>;
}

function StepCascade({ steps, idx, answer, all, big }: { steps: SolveStep[]; idx: number; answer: string | null; all: boolean; big?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  // Follow the newest step: show it from its TOP when it is taller than the box (never cut off its first line),
  // otherwise keep the end in view so the earlier steps stay above it.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      const last = el.querySelector<HTMLElement>("[data-newest]");
      if (last && last.offsetHeight > el.clientHeight - 24) el.scrollTo({ top: Math.max(0, last.offsetTop - 14), behavior: "smooth" });
      else el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 30);
    return () => window.clearTimeout(t);
  }, [idx, answer, all, big]);
  const dim = (now: boolean) => (all || now ? 1 : 0.5);
  return (
    <div
      ref={box}
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      style={{
        height: "100%", overflowY: "auto", overflowX: "hidden", padding: "6px 12px 16px",
        ...(scrolled ? { WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 3rem)", maskImage: "linear-gradient(to bottom, transparent 0, #000 3rem)" } : null),
      }}
    >
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 22, top: 16, bottom: 16, width: 2, background: "#e2e8f0" }} />
        {steps.slice(0, idx + 1).map((st, i) => {
          const now = i === idx && !answer;
          return (
            <FadeIn key={i}>
              <div
                {...(i === idx && !answer ? { "data-newest": "1" } : {})}
                style={{
                  position: "relative", display: "flex", gap: 12, padding: "10px 10px", borderRadius: 12,
                  opacity: dim(now), transition: "opacity 0.3s ease",
                  background: now ? "#eff6ff" : "transparent", boxShadow: now ? "0 0 0 2px rgba(30,58,138,0.25)" : "none",
                }}
              >
                <div
                  style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: 13, fontSize: 13, fontWeight: 800, zIndex: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: now ? "#1e3a8a" : "#e2e8f0", color: now ? "#ffffff" : "#334155", border: "2px solid #ffffff",
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {(st.phase || (now && st.runningTotal !== undefined)) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      {st.phase && <span style={{ background: "#e0e7ff", color: "#1e3a8a", fontWeight: 800, fontSize: 12, borderRadius: 999, padding: "2px 9px" }}>{st.phase}</span>}
                      {now && st.runningTotal !== undefined && (
                        <span style={{ marginLeft: "auto", background: "#dcfce7", border: "1px solid #86efac", color: "#15803d", borderRadius: 8, padding: "2px 9px", fontWeight: 800, fontSize: 14 }}>
                          {st.totalLabel ?? "Total"} {st.runningTotal}
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: big ? 18 : 17, fontWeight: 500, color: "#0f172a", lineHeight: 1.5, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{st.caption}</div>
                </div>
              </div>
            </FadeIn>
          );
        })}
        {answer && (
          <FadeIn>
            <div data-newest="1" style={{ position: "relative", display: "flex", gap: 12, padding: "10px 10px", borderRadius: 12, background: "#f0fdf4", boxShadow: "0 0 0 2px rgba(22,163,74,0.35)" }}>
              <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 13, fontSize: 13, fontWeight: 800, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#16a34a", color: "#ffffff", border: "2px solid #ffffff" }}>A</div>
              <div style={{ flex: 1, minWidth: 0, fontSize: big ? 21 : 19, fontWeight: 800, color: "#166534", lineHeight: 1.4, paddingTop: 1, overflowWrap: "anywhere" }}>{answer}</div>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
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
