import type React from "react";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Maximize2, Minimize2, Table2 } from "lucide-react";
import type { AnyQuestion, DifficultyLevel, QOSnapshot, WorkingStep } from "../types";
import type { QuestionKeeperMenu } from "../questionKeeper";
import { DifficultyToggle } from "./DifficultyToggle";
import { PinButton } from "./PinButton";
import { ScaleToFit } from "./ScaleToFit";
import { QuestionDisplay, AnswerDisplay } from "./QuestionDisplay";
import { WorkedExampleSteps } from "./WorkedExampleSteps";

export interface WorkedExampleViewProps {
  answerRenderer: ((q: AnyQuestion, colorScheme: string, qo?: QOSnapshot) => JSX.Element | null) | undefined;
  questionRenderer: ((q: AnyQuestion, showAnswer: boolean, colorScheme: string, compact?: boolean, idx?: number, qo?: QOSnapshot, fontClass?: string) => JSX.Element | null) | undefined;
  stepRenderer: ((step: WorkingStep, colorScheme: string, qo?: QOSnapshot, reveal?: number) => JSX.Element | null) | undefined;
  stepVisualRenderer: ((step: WorkingStep, colorScheme: string, qo?: QOSnapshot) => JSX.Element | null | false) | undefined;
  stepVisualKeepsWorking: boolean | undefined;
  stepVisualPlacement: "side" | "top" | undefined;
  workingScaffold: { label: string; placement?: "workingBox" | "workingCorner" | "question"; cornerWidth?: number; render: (q: AnyQuestion, showAnswer: boolean, colorScheme: string, qo?: QOSnapshot) => JSX.Element | null; } | undefined;
  colorScheme: "default";
  compact: boolean | undefined;
  parkedMode: boolean;
  setOpenSkillId: React.Dispatch<React.SetStateAction<string | null>>;
  hideAnswerStep: boolean;
  workedExampleLayout: "single" | "stacked";
  workedResetNonce: number;
  levels: {
    difficulty: DifficultyLevel;
    toolLevels: DifficultyLevel[];
    showLevelToggle: boolean;
    levelInfoBtn: React.JSX.Element | null;
    setDifficultyGuarded: (v: DifficultyLevel) => void;
  };
  question: {
    currentQuestion: AnyQuestion;
    showAnswer: boolean;
    setShowAnswer: React.Dispatch<React.SetStateAction<boolean>>;
    stagedBtn: (answerShown: boolean) => React.JSX.Element | null;
    getQOSnapshot: () => QOSnapshot;
    handleNewQuestion: () => void;
    getInstruction: (tool?: string) => string;
    qoEl: (isDiff?: boolean) => React.JSX.Element;
    keeperOn: QuestionKeeperMenu | undefined;
  };
  font: {
    displayFontSize: number;
    setDisplayFontSize: React.Dispatch<React.SetStateAction<number>>;
    displayFontSizes: string[];
    canDisplayIncrease: boolean;
    canDisplayDecrease: boolean;
    hideFontControls: boolean;
  };
  panel: {
    weFullscreen: boolean;
    setWeFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
    weScaffoldShown: boolean;
    setWeScaffoldShown: React.Dispatch<React.SetStateAction<boolean>>;
  };
  bg: {
    qBg: string;
    fsToolbarBg: string;
  };
}

export function WorkedExampleView(props: WorkedExampleViewProps) {
  const { answerRenderer, questionRenderer, stepRenderer, stepVisualRenderer, stepVisualKeepsWorking, stepVisualPlacement, workingScaffold, colorScheme, compact, parkedMode, setOpenSkillId, hideAnswerStep, workedExampleLayout, workedResetNonce } = props;
  const { difficulty, toolLevels, showLevelToggle, levelInfoBtn, setDifficultyGuarded } = props.levels;
  const { currentQuestion, showAnswer, setShowAnswer, stagedBtn, getQOSnapshot, handleNewQuestion, getInstruction, qoEl, keeperOn } = props.question;
  const { displayFontSize, setDisplayFontSize, displayFontSizes, canDisplayIncrease, canDisplayDecrease, hideFontControls } = props.font;
  const { weFullscreen, setWeFullscreen, weScaffoldShown, setWeScaffoldShown } = props.panel;
  const { qBg, fsToolbarBg } = props.bg;
  // "single" keeps its original capped, internally-scrolling box unchanged.
  // "stacked" used to need a forced full-viewport-height parent (see the
  // removed `useFullHeightShell`) so its own internal scrollbox could size
  // correctly — that bounded box left a tall empty gap below any short
  // (1-3 step) example. WorkedExampleSteps' stacked layout now grows and
  // shrinks with its own content and relies on the real page/window
  // scrolling (its footer-position effect scrolls the window, not a local
  // box) — so it gets a plain, uncapped wrapper here instead of the
  // "single" box's overflow/maxHeight.
  const stacked = workedExampleLayout === "stacked";
  const stepsEl = (fullscreen: boolean) => (
    <WorkedExampleSteps
      working={currentQuestion.working}
      renderAnswer={() => answerRenderer ? answerRenderer(currentQuestion, colorScheme, getQOSnapshot()) : <AnswerDisplay q={currentQuestion} matchSteps />}
      colorScheme={colorScheme}
      stepRenderer={stepRenderer}
      stepVisualRenderer={stepVisualRenderer}
      keepWorking={stepVisualKeepsWorking}
      visualPlacement={stepVisualPlacement}
      qoSnapshot={getQOSnapshot()}
      stepThroughEnabled
      onOpenSkill={parkedMode ? setOpenSkillId : undefined}
      resetKey={workedResetNonce}
      layout={workedExampleLayout}
      hideAnswerStep={hideAnswerStep}
      compact={compact}
      fullscreen={fullscreen}
    />
  );

  // PHONE only: the representation the steps will use (place value table, BIDMAS pyramid…) can be brought up BEFORE the steps start,
  // with the same table button the Whiteboard has in the question box's corner. Off by default so the question looks as it always did;
  // from the first step the steps' own picture box takes over and updates.
  const weScaffoldOk = !!compact && !!workingScaffold && !showAnswer;
  const weScaffoldBtn = weScaffoldOk && workingScaffold ? (
    <button onClick={() => setWeScaffoldShown(v => !v)} title={`${weScaffoldShown ? "Hide" : "Show"} ${workingScaffold.label}`} aria-label={`${weScaffoldShown ? "Hide" : "Show"} ${workingScaffold.label}`}
      style={{ position: "absolute", top: 0, right: 0, background: weScaffoldShown ? "#374151" : "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
    ><Table2 size={16} color={weScaffoldShown ? "#ffffff" : "#6b7280"} /></button>
  ) : null;
  const weScaffold = (weScaffoldOk && weScaffoldShown && workingScaffold) ? (
    <div className="mt-3 flex w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      {workingScaffold.render(currentQuestion, false, colorScheme, getQOSnapshot())}
    </div>
  ) : null;

  // ── fullscreen: the same page as the ordinary worked example (question at the top, then the steps — with the picture beside them for
  // split tools), simply filling the screen, under a slim control bar. Phone width keeps the ordinary page (already full-width).
  if (weFullscreen && !compact) {
    // NOT `qo.fullscreen` — tools read that as "the whiteboard's fullscreen"; this is the ordinary worked example, just bigger
    const qEl = questionRenderer
      ? <>{compact && hideFontControls
              ? <div className="w-full" style={{ height: "34dvh" }}><ScaleToFit maxScale={1}>{questionRenderer(currentQuestion, showAnswer, colorScheme, false, undefined, getQOSnapshot(), "text-xl")}</ScaleToFit></div>
              : questionRenderer(currentQuestion, showAnswer, colorScheme, false, undefined, getQOSnapshot(), (compact ? "text-xl" : displayFontSizes[displayFontSize]))}{stagedBtn(showAnswer)}</>
      : <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]} />;
    const fontBtn = (enabled: boolean): React.CSSProperties => ({ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: enabled ? "pointer" : "not-allowed", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", opacity: enabled ? 1 : 0.35 });
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: qBg, display: "flex", flexDirection: "column" }}>
        {/* the same top bar as the whiteboard's fullscreen */}
        <div style={{ background: fsToolbarBg, borderBottom: "2px solid #000", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexShrink: 0, zIndex: 210 }}>
          {showLevelToggle && <div className="flex items-center gap-1.5"><DifficultyToggle value={difficulty} onChange={v => setDifficultyGuarded(v as DifficultyLevel)} levels={toolLevels} />{levelInfoBtn}</div>}
          {qoEl()}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <PinButton keeper={keeperOn} />
        <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-semibold text-base hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
            <button onClick={() => setShowAnswer(a => !a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-semibold text-base hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showAnswer ? "Hide Answer" : "Show Answer"}</button>
          </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col px-6 pb-3" style={{ backgroundColor: qBg }}>
          <div className={`relative text-center flex-shrink-0 ${showAnswer ? "py-3 max-h-[40%] overflow-y-auto" : "flex-1 flex flex-col items-center justify-center"}`}>
            {/* like the whiteboard's fullscreen: the text-size chevrons, then Exit fullscreen last in the question box's corner cluster */}
            <div style={{ position: "absolute", top: 8, right: 0, display: "flex", gap: 6 }}>
              {!hideFontControls && <>
                <button title="Smaller text" aria-label="Smaller text" style={fontBtn(canDisplayDecrease)} onClick={() => canDisplayDecrease && setDisplayFontSize(f => f - 1)}><ChevronDown size={16} color="#6b7280" /></button>
                <button title="Larger text" aria-label="Larger text" style={fontBtn(canDisplayIncrease)} onClick={() => canDisplayIncrease && setDisplayFontSize(f => f + 1)}><ChevronUp size={16} color="#6b7280" /></button>
              </>}
              <button onClick={() => setWeFullscreen(false)} title="Exit Fullscreen (Esc)" aria-label="Exit fullscreen" style={{ background: "#374151", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><Minimize2 size={16} color="#ffffff" /></button>
            </div>
            {getInstruction() && <div className={`${["text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl"][displayFontSize]} font-semibold mb-2`} style={{ color: "#000" }}>{getInstruction()}</div>}
            {qEl}
          </div>
          {showAnswer && <div className="flex-1 min-h-0 w-full mx-auto" style={{ maxWidth: 1500 }}>{stepsEl(true)}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "h-full" : stacked ? undefined : "overflow-y-auto"} style={compact || stacked ? undefined : { maxHeight: "120vh" }}>
      <div className={compact ? "p-3 w-full h-full flex flex-col min-h-0" : "p-8 w-full"} style={{ backgroundColor: qBg }}>
        <div className={compact ? "text-center py-2 relative shrink-0" : "text-center py-4 relative"}>
          {weScaffoldBtn}
          {(!compact && (!hideFontControls || !compact)) && <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 6 }}>
            {!hideFontControls && <>
            <button style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: canDisplayDecrease ? "pointer" : "not-allowed", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", opacity: canDisplayDecrease ? 1 : 0.35 }} onClick={() => canDisplayDecrease && setDisplayFontSize(f => f - 1)}><ChevronDown size={16} color="#6b7280" /></button>
            <button style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: canDisplayIncrease ? "pointer" : "not-allowed", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", opacity: canDisplayIncrease ? 1 : 0.35 }} onClick={() => canDisplayIncrease && setDisplayFontSize(f => f + 1)}><ChevronUp size={16} color="#6b7280" /></button>
            </>}
            {!compact && <button title="Fullscreen" onClick={() => setWeFullscreen(true)} style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><Maximize2 size={16} color="#6b7280" /></button>}
          </div>}
          {getInstruction() && <div className={`${["text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl"][displayFontSize]} font-semibold mb-2`} style={{ color: "#000" }}>{getInstruction()}</div>}
          {questionRenderer
            ? <>{questionRenderer(currentQuestion, showAnswer, colorScheme, false, undefined, getQOSnapshot(), displayFontSizes[displayFontSize])}{stagedBtn(showAnswer)}</>
            : <QuestionDisplay q={currentQuestion} cls={compact ? "text-xl" : displayFontSizes[displayFontSize]} tight={!!compact} />
          }
          {weScaffold}
        </div>
        {showAnswer && <div className={compact ? "flex-1 min-h-0" : undefined}>{stepsEl(false)}</div>}
      </div>
    </div>
  );
}
