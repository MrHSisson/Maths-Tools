import { useEffect, useMemo, useRef, useState } from "react";
import { Home, Menu, X, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Maximize2, Minimize2, Rewind, FastForward } from "lucide-react";
import type { DecisionProblem, DecisionShellProps, GenerateContext, LegendItem, SolveStep } from "./types";
import type { InfoSection } from "../types";
import NetworkView, { EDGE_STYLE, NODE_ROLE_STYLE } from "./representations/NetworkView";
import MatrixView from "./representations/MatrixView";
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
const CARD = "bg-white rounded-xl shadow-lg min-w-0";
const BTN = "px-4 sm:px-6 py-2 rounded-xl font-bold text-base shadow-sm transition-colors flex items-center gap-2";
const BTN_PRIMARY = `${BTN} bg-blue-900 text-white hover:bg-blue-800`;
const BTN_PLAIN = `${BTN} bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50`;

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
  const ctxOf = (sub: string, opts: Record<string, string>): GenerateContext => ({ subTool: sub, options: opts });
  const [problem, setProblem] = useState<DecisionProblem>(() => generate(init.level, ctxOf(init.subTool, init.options)));
  // -1 = the question only; 0…last = the working, one step at a time; last+1 = the answer (when it fits on a line)
  const [stepIdx, setStepIdx] = useState(-1);
  const [showAll, setShowAll] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [colorScheme, setColorScheme] = useState("default");
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
  const visibleOptions = (config.options ?? []).filter((o) => !o.forSubTools || o.forSubTools.includes(subTool));
  const qBg = getQuestionBg(colorScheme);

  const newQuestion = (lv = level, sub = subTool, opts = options) => {
    setProblem(generate(lv, ctxOf(sub, opts)));
    setStepIdx(-1);
    setShowAll(false);
  };

  // keep the address bar bookmarkable
  useEffect(() => {
    const q = new URLSearchParams();
    if (config.subTools && subTool !== config.subTools[0]?.key) q.set("tool", subTool);
    if (level !== 1) q.set("level", String(level));
    for (const o of config.options ?? []) if (options[o.key] !== (o.defaultFor?.(level) ?? o.choices[0].value)) q.set(`o_${o.key}`, options[o.key]);
    const keep = new URLSearchParams(window.location.search).get("tpl"); // dev link: pinned template
    if (keep) q.set("tpl", keep);
    const s = q.toString();
    window.history.replaceState(null, "", window.location.pathname + (s ? `?${s}` : ""));
  }, [level, subTool, options]); // eslint-disable-line react-hooks/exhaustive-deps

  // ← / → step through a worked example; Esc leaves fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowRight") { setShowAll(false); setStepIdx((i) => Math.min(maxBeat, i + 1)); }
      if (e.key === "ArrowLeft") { setShowAll(false); setStepIdx((i) => Math.max(-1, i - 1)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maxBeat]);

  const infoSections: InfoSection[] = config.infoSections ?? [
    {
      title: config.pageTitle,
      icon: "🕸️",
      content: [
        { label: "Worked Example", detail: "Every question is worked through: the question and one large network, with the working beside it one step at a time (Next / Back, or the arrow keys). Earlier steps fade but stay on screen; Show all jumps to the end." },
      ],
    },
  ];

  const shown = (st: SolveStep | undefined) => (renderCanvas ? renderCanvas(problem, st) : <NetworkView network={problem.network} step={st} interactive background="#ffffff" />);
  const canvasStep = current; // undefined at the question: the network as given
  const footer = typeof config.canvasFooter === "function" ? config.canvasFooter(problem) : config.canvasFooter;

  // ── pieces ────────────────────────────────────────────────────────────────────
  const navBar = (
    <div className="bg-blue-900 shadow-lg">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8 py-2 sm:py-3 flex justify-between items-center">
        <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
          <Home size={24} />
          <span className="font-semibold text-lg">Home</span>
        </button>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
          {menuOpen && <MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={() => setMenuOpen(false)} onOpenInfo={() => setInfoOpen(true)} />}
        </div>
      </div>
    </div>
  );

  const tabBtn = (active: boolean) =>
    `px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-bold text-base sm:text-lg transition-all shadow-md ${active ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`;

  const controlBar = (
    <div className={`${CARD} p-3 sm:p-4 flex flex-col gap-3`}>
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
              className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${optionsPop.open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
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
        <div className="flex flex-wrap justify-center items-center gap-3">
          <button onClick={() => jump(-1)} disabled={atQuestion} title="Back to the question" className={`${BTN_PLAIN} disabled:opacity-40 disabled:cursor-not-allowed`}>
            <Rewind size={18} />
          </button>
          <button onClick={() => jump(stepIdx - 1)} disabled={atQuestion} className={`${BTN_PLAIN} disabled:opacity-40 disabled:cursor-not-allowed`}>
            <ChevronLeft size={18} /> Back
          </button>
          <div className="min-w-[120px] text-center font-bold text-gray-500">
            {atQuestion ? "Question" : onAnswer ? "Answer" : `Step ${idx + 1} of ${steps.length}`}
          </div>
          <button onClick={() => jump(stepIdx + 1)} disabled={stepIdx >= maxBeat} className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}>
            {atQuestion ? "Show working" : "Next"} <ChevronRight size={18} />
          </button>
          <button
            onClick={() => {
              if (showAll) jump(-1);
              else { setShowAll(true); setStepIdx(maxBeat); }
            }}
            className={BTN_PLAIN}
          >
            <FastForward size={18} /> {showAll ? "Step by step" : "Show all"}
          </button>
        </div>
      </div>
      <div className="flex justify-center items-center gap-2">
        <button onClick={() => jump(-1)} title="Question" style={{ width: 10, height: 10, borderRadius: 2, border: "none", cursor: "pointer", background: atQuestion ? "#1e3a8a" : "#d1d5db" }} />
        {steps.map((_, i) => (
          <button key={i} onClick={() => jump(i)} title={`Step ${i + 1}`} style={{ width: 10, height: 10, borderRadius: 5, border: "none", cursor: "pointer", background: !atQuestion && !onAnswer && i === idx ? "#1e3a8a" : "#d1d5db" }} />
        ))}
        {answerText && (
          <button onClick={() => jump(last + 1)} title="Answer" style={{ width: 24, height: 10, borderRadius: 5, border: "none", cursor: "pointer", background: onAnswer ? "#16a34a" : "#d1d5db" }} />
        )}
      </div>
      {levelCount > 1 && config.levelLabels?.[level - 1] && (
        <div className="text-center text-sm font-semibold text-gray-400">{config.levelLabels[level - 1]}</div>
      )}
    </div>
  );

  const questionBlock = (big: boolean) => (
    <div className="rounded-xl px-7 py-5" style={{ backgroundColor: qBg, border: "1px solid #e5e7eb" }}>
      <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">{config.instruction ?? "Question"}</div>
      <div className={`${big ? "text-2xl" : "text-lg"} font-semibold text-gray-900 leading-snug`}>{problem.prompt}</div>
    </div>
  );

  const canvasBox = (height: string) => (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white" style={{ height, minHeight: 380 }}>
      {shown(canvasStep)}
      <button
        onClick={() => setFullscreen(true)}
        title="Fullscreen"
        className="absolute top-3 left-3 w-9 h-9 rounded-lg flex items-center justify-center bg-black/5 hover:bg-black/10"
      >
        <Maximize2 size={18} color="#6b7280" />
      </button>
    </div>
  );

  const example = (
    <div className="p-3 sm:p-6 flex flex-wrap gap-6 items-start">
      {/* the graph stays in view while the working scrolls */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-3" style={{ flex: "1 1 620px", minWidth: 0 }}>
        {canvasBox("min(74vh, 800px)")}
        {footer && <div className="flex justify-center">{footer}</div>}
        {!atQuestion && config.legend && <Legend items={config.legend} />}
      </div>
      <div className="flex flex-col gap-4" style={{ flex: "1 1 360px", minWidth: 0 }}>
        {/* QUESTION */}
        {questionBlock(false)}
        {/* ANSWER — empty until asked for, then built up one step at a time */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Answer</div>
          {atQuestion ? (
            <div className="px-5 pb-5 flex flex-col items-start gap-3">
              <div className="text-base text-gray-500 leading-snug">The working and the answer appear here, one step at a time.</div>
              <button onClick={() => jump(0)} className={BTN_PRIMARY}>
                Show working <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <StepCascade steps={steps} idx={idx} answer={onAnswer ? answerText : null} all={showAll} />
          )}
        </div>
        {current?.route && current.route.length > 0 && <RouteCard route={current.route} />}
        {!config.hideMatrix && (!atQuestion || config.questionMatrix) && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 flex justify-center">
            <MatrixView network={problem.network} step={canvasStep} bare />
          </div>
        )}
      </div>
    </div>
  );

  // ── fullscreen: the graph, big, with the one thing the class needs next ──────────
  if (fullscreen)
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 bg-blue-900 text-white flex-shrink-0">
          <div className="font-bold text-lg">{config.pageTitle}</div>
          <button onClick={() => setFullscreen(false)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-800 font-semibold">
            <Minimize2 size={18} /> Exit fullscreen
          </button>
        </div>
        <div className="flex-1 min-h-0 relative">{shown(canvasStep)}</div>
        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-3 flex items-center gap-4 bg-gray-50">
          <button onClick={() => jump(stepIdx - 1)} disabled={atQuestion} className={`${BTN_PLAIN} disabled:opacity-40`}><ChevronLeft size={18} /> Back</button>
          <div className="flex-1 text-lg font-medium text-gray-900 leading-snug" style={{ whiteSpace: "pre-line", maxHeight: "22vh", overflowY: "auto" }}>
            {atQuestion ? (
              problem.prompt
            ) : onAnswer ? (
              <span className="font-bold text-green-800">Answer: {answerText}</span>
            ) : (
              <>
                <span className="font-bold text-blue-900 mr-2">{idx + 1}.</span>
                {current?.caption}
              </>
            )}
          </div>
          <button onClick={() => jump(stepIdx + 1)} disabled={stepIdx >= maxBeat} className={`${BTN_PRIMARY} disabled:opacity-40`}>{atQuestion ? "Show working" : "Next"} <ChevronRight size={18} /></button>
        </div>
      </div>
    );

  return (
    <div>
      {navBar}
      {infoOpen && <InfoModal infoSections={infoSections} onClose={() => setInfoOpen(false)} />}
      <div className="min-h-screen p-3 sm:px-8 sm:py-5" style={{ backgroundColor: "#f5f3f0" }}>
        <div className="max-w-[1500px] mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-3 sm:mb-4" style={{ color: "#000" }}>{config.pageTitle}</h1>
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
            <div className={`${CARD} overflow-hidden`}>{example}</div>
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

function StepCascade({ steps, idx, answer, all }: { steps: SolveStep[]; idx: number; answer: string | null; all: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [idx, answer, all]);
  const dim = (now: boolean) => (all || now ? 1 : 0.5);
  return (
    <div
      ref={box}
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      style={{
        maxHeight: "min(60vh, 640px)", overflowY: "auto", padding: "0 10px 12px",
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
                  <div style={{ fontSize: 17, fontWeight: 500, color: "#0f172a", lineHeight: 1.5, whiteSpace: "pre-line" }}>{st.caption}</div>
                </div>
              </div>
            </FadeIn>
          );
        })}
        {answer && (
          <FadeIn>
            <div style={{ position: "relative", display: "flex", gap: 12, padding: "10px 10px", borderRadius: 12, background: "#f0fdf4", boxShadow: "0 0 0 2px rgba(22,163,74,0.35)" }}>
              <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 13, fontSize: 13, fontWeight: 800, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#16a34a", color: "#ffffff", border: "2px solid #ffffff" }}>A</div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 19, fontWeight: 800, color: "#166534", lineHeight: 1.4, paddingTop: 1 }}>{answer}</div>
            </div>
          </FadeIn>
        )}
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
  if (kind === "current" || kind === "visited") {
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
