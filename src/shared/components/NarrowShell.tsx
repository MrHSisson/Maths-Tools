import type React from "react";
import { RefreshCw, Eye, SlidersHorizontal, X } from "lucide-react";
import { useLayoutMode } from "../layoutMode";
import type { AnyQuestion, DifficultyLevel, QOSnapshot, ToolConfig, InfoSection, ToolEntry } from "../types";
import type { QuestionKeeperMenu } from "../questionKeeper";
import type { DepthItem, DepthOptionInfo } from "../depth";
import { PAGE_BG } from "../colors";
import { WORKSHEET_FONT_SIZES as fontSizes } from "../useWorksheetFit";
import { DifficultyToggle } from "./DifficultyToggle";
import { PinButton } from "./PinButton";
import { QuestionDisplay, AnswerDisplay } from "./QuestionDisplay";
import { InlineQOPanel } from "./QOPopovers";
import { RotateHint } from "./RotateHint";
import { DepthMode } from "./DepthMode";
import { SkillOverlay } from "../skills";

interface NarrowShellProps {
  config: ToolConfig;
  infoSections?: InfoSection[];
  toolKeys: string[];
  currentTool: string;
  questionRenderer: ((q: AnyQuestion, showAnswer: boolean, compact?: boolean, idx?: number, qo?: QOSnapshot, fontClass?: string) => JSX.Element | null) | undefined;
  answerRenderer: ((q: AnyQuestion, qo?: QOSnapshot) => JSX.Element | null) | undefined;
  layout: ReturnType<typeof useLayoutMode>;
  isTablet: boolean;
  qBg: string;
  renderNavBar: (compact: boolean, title?: string, crumbs?: Array<{ label: string; onClick: () => void; }>) => React.JSX.Element;
  renderWorkedExample: (compact?: boolean) => React.JSX.Element;
  getToolSettings: () => ToolEntry;
  getInstruction: (tool?: string) => string;
  getQOSnapshot: () => QOSnapshot;
  keeperOn: QuestionKeeperMenu | undefined;
  nav: {
    mode: "whiteboard" | "single" | "worksheet" | "teach" | "depth";
    setMode: React.Dispatch<React.SetStateAction<"whiteboard" | "single" | "worksheet" | "teach" | "depth">>;
    narrowStarted: boolean;
    setNarrowStarted: React.Dispatch<React.SetStateAction<boolean>>;
    launchStep: "topic" | "mode";
    setLaunchStep: React.Dispatch<React.SetStateAction<"topic" | "mode">>;
    narrowDrawerOpen: boolean;
    setNarrowDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
    infoModal: React.JSX.Element | null;
    openSkillId: string | null;
    setOpenSkillId: React.Dispatch<React.SetStateAction<string | null>>;
    levelInfoDialog: React.JSX.Element | null;
  };
  levels: {
    difficulty: DifficultyLevel;
    toolLevels: DifficultyLevel[];
    showLevelToggle: boolean;
    levelInfoBtn: React.JSX.Element | null;
    setDifficultyGuarded: (v: DifficultyLevel) => void;
    selectTool: (k: string) => void;
  };
  options: {
    toolMultiSelect: Record<string, Record<string, boolean>>;
    getDropdownValue: () => string;
    setDropdownValue: (v: string) => void;
    getVariableValues: () => Record<string, boolean>;
    setVariableValue: (k: string, v: boolean) => void;
    setMultiSelectValue: (k: string, v: boolean) => void;
  };
  depth: {
    showDepth: boolean;
    toolDepthItems: DepthItem[];
    depthItemId: string | null;
    setDepthItemId: React.Dispatch<React.SetStateAction<string | null>>;
    depthOptionInfo: DepthOptionInfo;
    depthActiveOptions: Set<string>;
  };
  question: {
    showAnswer: boolean;
    setShowAnswer: React.Dispatch<React.SetStateAction<boolean>>;
    handleNewQuestion: () => void;
  };
  sheet: {
    numQuestions: number;
    setNumQuestions: React.Dispatch<React.SetStateAction<number>>;
    worksheet: AnyQuestion[];
    showWorksheetAnswers: boolean;
    setShowWorksheetAnswers: React.Dispatch<React.SetStateAction<boolean>>;
    worksheetFontSize: number;
    narrowRevealed: Set<number>;
    setNarrowRevealed: React.Dispatch<React.SetStateAction<Set<number>>>;
    handleGenerateWorksheet: () => void;
  };
}

export function NarrowShell(props: NarrowShellProps) {
  const { config, toolKeys, currentTool, questionRenderer, answerRenderer, layout, isTablet, qBg, renderNavBar, renderWorkedExample, getToolSettings, getInstruction, getQOSnapshot, keeperOn } = props;
  const { mode, setMode, narrowStarted, setNarrowStarted, launchStep, setLaunchStep, narrowDrawerOpen, setNarrowDrawerOpen, infoModal, openSkillId, setOpenSkillId, levelInfoDialog } = props.nav;
  const { difficulty, toolLevels, showLevelToggle, levelInfoBtn, setDifficultyGuarded, selectTool } = props.levels;
  const { toolMultiSelect, getDropdownValue, setDropdownValue, getVariableValues, setVariableValue, setMultiSelectValue } = props.options;
  const { showDepth, toolDepthItems, depthItemId, setDepthItemId, depthOptionInfo, depthActiveOptions } = props.depth;
  const { showAnswer, setShowAnswer, handleNewQuestion } = props.question;
  const { numQuestions, setNumQuestions, worksheet, showWorksheetAnswers, setShowWorksheetAnswers, worksheetFontSize, narrowRevealed, setNarrowRevealed, handleGenerateWorksheet } = props.sheet;
  const toolName = config.tools[currentTool].name;
  const toggleNarrowReveal = (idx: number) => {
    // A no-op while "Show All" is on — every card already reads as revealed
    // via showWorksheetAnswers, so recording it here too would let it stay
    // stuck revealed after "Hide All" turns showWorksheetAnswers back off.
    if (showWorksheetAnswers) return;
    setNarrowRevealed(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const modeChoices: Array<{ m: "whiteboard" | "single" | "worksheet" | "depth"; label: string; sub: string }> = [
    ...(isTablet ? [{ m: "whiteboard" as const, label: "Whiteboard", sub: "Show it to the class" }] : []),
    { m: "single", label: "Worked example", sub: "Step through a full solution" },
    { m: "worksheet", label: "Worksheet", sub: "A set of questions to try" },
    ...(showDepth ? [{ m: "depth" as const, label: "Depth", sub: "Diagnose, explain and extend" }] : []),
  ];
  if (!narrowStarted) {
    return (
      <div>
        {renderNavBar(true, config.pageTitle)}
        <RotateHint show={isTablet && layout.portrait} />
        {infoModal}{levelInfoDialog}
        <div className="min-h-screen px-4 pt-6 pb-10" style={{ backgroundColor: PAGE_BG }}>
          <div className={`${isTablet ? "max-w-xl" : "max-w-md"} mx-auto flex flex-col gap-3`}>
            {launchStep === "mode" && toolKeys.length > 1 && (
              <button onClick={() => setLaunchStep("topic")} className="self-start text-sm font-semibold text-blue-900 mb-1">‹ {toolName}</button>
            )}
            <h2 className="text-xl font-semibold text-slate-900 mb-1">{launchStep === "topic" ? "What are we working on?" : "How would you like to use it?"}</h2>
            {launchStep === "topic"
              ? toolKeys.map(k => (
                  <button key={k} onClick={() => { selectTool(k); setLaunchStep("mode"); }}
                    className="flex items-center justify-between text-left bg-white rounded-2xl border border-slate-300 shadow-card px-5 py-4 font-semibold text-slate-900 text-base active:bg-slate-50">
                    {config.tools[k].name}<span className="text-slate-300 text-xl">›</span>
                  </button>))
              : modeChoices.map(c => (
                  <button key={c.m} onClick={() => { setMode(c.m); setNarrowStarted(true); }}
                    className="flex items-center justify-between text-left bg-white rounded-2xl border border-slate-300 shadow-card px-5 py-4 active:bg-slate-50">
                    <span><span className="block font-semibold text-slate-900 text-base">{c.label}</span><span className="block text-sm text-slate-500 mt-0.5">{c.sub}</span></span>
                    <span className="text-slate-300 text-xl">›</span>
                  </button>))}
          </div>
        </div>
      </div>
    );
  }

  const backTo = (step: "topic" | "mode") => () => { setLaunchStep(step); setNarrowStarted(false); };
  const crumbs = [
    ...(toolKeys.length > 1 ? [{ label: toolName, onClick: backTo("topic") }] : []),
    { label: mode === "worksheet" ? "Worksheet" : mode === "depth" ? "Depth" : "Example", onClick: backTo("mode") },
    { label: `L${difficulty.replace("level", "")}`, onClick: () => setNarrowDrawerOpen(true) },
  ];
  return (
    <div>
      {renderNavBar(true, config.pageTitle, crumbs)}
      <RotateHint show={isTablet && layout.portrait} />
      {infoModal}{levelInfoDialog}
      {openSkillId && <SkillOverlay skillId={openSkillId} onClose={() => setOpenSkillId(null)} />}

      <div className="min-h-screen px-3 pt-3 pb-24" style={{ backgroundColor: PAGE_BG }}>
        <div className={`${isTablet ? "max-w-4xl" : "max-w-md"} mx-auto`}>
          {mode === "depth" && showDepth ? (
            <DepthMode narrow items={toolDepthItems} level={difficulty} onLevelChange={l => setDifficultyGuarded(l)} itemId={depthItemId} onItemChange={setDepthItemId} optionInfo={depthOptionInfo} activeOptions={depthActiveOptions} />
          ) : mode === "worksheet" ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg px-1">
                  <button onClick={() => setNumQuestions(n => Math.max(1, n - 1))} className="w-7 h-7 flex items-center justify-center text-gray-500 font-bold">−</button>
                  <span className="w-6 text-center font-bold text-sm text-gray-800">{numQuestions}</span>
                  <button onClick={() => setNumQuestions(n => Math.min(24, n + 1))} className="w-7 h-7 flex items-center justify-center text-gray-500 font-bold">+</button>
                </div>
              </div>
              <div className={isTablet && !layout.portrait ? "grid grid-cols-2 gap-3" : "flex flex-col gap-2.5"}>
                {worksheet.length === 0 && (
                  <div className="text-center text-gray-400 py-10 bg-white rounded-xl border border-gray-200">Generate a set of questions</div>
                )}
                {worksheet.map((q, idx) => {
                  const revealed = showWorksheetAnswers || narrowRevealed.has(idx);
                  return (
                    <button key={idx} onClick={() => toggleNarrowReveal(idx)}
                      className="text-left bg-white rounded-xl shadow-sm border border-gray-200 p-3.5" style={{ backgroundColor: qBg }}>
                      <div className="text-xs font-bold text-gray-400 mb-1">{idx + 1}</div>
                      {getInstruction() && <div className="text-sm font-semibold mb-1" style={{ color: "#000" }}>{getInstruction()}</div>}
                      {questionRenderer
                        ? questionRenderer(q, revealed, true, idx, getQOSnapshot(), fontSizes[worksheetFontSize])
                        : <QuestionDisplay q={q} cls="text-base" />
                      }
                      {revealed && !questionRenderer && (
                        <div className="mt-2 pt-2 text-center font-bold text-sm" style={{ borderTop: "1px solid rgba(0,0,0,0.08)", color: "#059669" }}>
                          {answerRenderer ? answerRenderer(q, getQOSnapshot()) : <AnswerDisplay q={q} />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-300 shadow-card overflow-clip" style={showAnswer ? { height: "calc(100dvh - 12.35rem - env(safe-area-inset-bottom))", minHeight: "26rem" } : undefined}>
                {renderWorkedExample(true)}
              </div>
            </>
          )}
        </div>
      </div>

      {(
        <div className={`fixed bottom-0 inset-x-0 z-40 bg-white px-3 flex gap-2 pt-2 border-t ${mode === "single" && showAnswer ? "border-transparent" : "border-slate-200"}`} style={{ ...(isTablet ? { paddingLeft: "max(0.75rem, calc((100vw - 56rem) / 2))", paddingRight: "max(4.75rem, calc((100vw - 56rem) / 2))" } : {}), paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))", height: "calc(4.1rem + env(safe-area-inset-bottom))", boxShadow: mode === "single" && showAnswer ? "none" : "0 -4px 16px rgba(0,0,0,0.06)" }}>
          {mode === "depth" ? (
            <button onClick={() => setNarrowDrawerOpen(true)} aria-label="Options" className="flex-1 h-12 gap-2 font-semibold text-base bg-white border border-slate-200 text-blue-900 rounded-xl flex items-center justify-center active:bg-slate-50"><SlidersHorizontal size={20} /> Options</button>
          ) : mode === "worksheet" ? (
            <>
              <button onClick={() => setNarrowDrawerOpen(true)} aria-label="Options" className={`${isTablet ? "px-5 gap-2 font-semibold" : "w-14"} h-12 shrink-0 bg-white border border-slate-200 text-blue-900 rounded-xl flex items-center justify-center active:bg-slate-50`}><SlidersHorizontal size={20} />{isTablet && "Options"}</button>
              <button onClick={handleGenerateWorksheet} className="flex-1 h-12 bg-blue-900 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 active:bg-blue-800"><RefreshCw size={18} /> Generate</button>
              {worksheet.length > 0 && <button onClick={() => setShowWorksheetAnswers(x => !x)} className="flex-1 h-12 bg-blue-900 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 active:bg-blue-800"><Eye size={18} /> {showWorksheetAnswers ? "Hide all" : "Show all"}</button>}
            </>
          ) : (
            // one dock with the stepper above it: Options and New sit in the same two side columns as the step arrows, the answer button in the middle
            <>
              <button onClick={() => setNarrowDrawerOpen(true)} aria-label="Options" className={`${isTablet ? "px-5 gap-2 font-semibold" : "w-14"} h-12 shrink-0 bg-white border border-slate-200 text-blue-900 rounded-xl flex items-center justify-center active:bg-slate-50`}><SlidersHorizontal size={20} />{isTablet && "Options"}</button>
              <button onClick={() => setShowAnswer(x => !x)} className="flex-1 h-12 bg-blue-900 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 active:bg-blue-800"><Eye size={18} /> {showAnswer ? "Hide answer" : "Show answer"}</button>
              <PinButton keeper={keeperOn} size="phone" />
              <button onClick={handleNewQuestion} aria-label="New question" title="New question" className={`${isTablet ? "px-5 gap-2 font-semibold" : "w-14"} h-12 shrink-0 bg-white border border-slate-200 text-blue-900 rounded-xl flex items-center justify-center active:bg-slate-50`}><RefreshCw size={20} />{isTablet && "New"}</button>
            </>
          )}
        </div>
      )}

      {narrowDrawerOpen && (
        // Full-screen sheet: a clean page of its own for the options, with one big Done at the thumb
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: PAGE_BG }}>
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="min-w-0">
              <div className="font-bold text-gray-900 text-base leading-tight">Question options</div>
              <div className="text-xs text-gray-500 truncate">{config.pageTitle}</div>
            </div>
            <button onClick={() => setNarrowDrawerOpen(false)} aria-label="Close" className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"><X size={22} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 text-center">Mode</div>
              <div className="flex flex-wrap justify-center gap-2">
                {modeChoices.map(c => (
                  <button key={c.m} onClick={() => setMode(c.m)}
                    className={`px-4 py-2.5 rounded-xl font-semibold text-sm border transition-colors ${mode === c.m ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-slate-200 text-slate-700"}`}>{c.label}</button>
                ))}
              </div>
            </div>
            {toolKeys.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 text-center">Topic</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {toolKeys.map(k => (
                    <button key={k} onClick={() => selectTool(k)}
                      className={`px-4 py-2.5 rounded-xl font-semibold text-sm border transition-colors ${currentTool === k ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-200 text-gray-700"}`}>
                      {config.tools[k].name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {showLevelToggle && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center gap-1 mb-3"><span className="text-xs font-bold uppercase tracking-wider text-gray-400">Difficulty</span>{levelInfoBtn}</div>
                <DifficultyToggle fullWidth value={difficulty} onChange={v => setDifficultyGuarded(v as DifficultyLevel)} levels={toolLevels} />
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Question options</div>
              <InlineQOPanel
                centerTabs
                toolEntry={getToolSettings()}
                level={difficulty}
                variables={getVariableValues()}
                onVariableChange={setVariableValue}
                dropdownValue={getDropdownValue()}
                onDropdownChange={setDropdownValue}
                multiSelectValues={toolMultiSelect[currentTool] ?? {}}
                onMultiSelectChange={setMultiSelectValue}
                hideWorksheetOnly={mode !== "worksheet"}
              />
            </div>
          </div>
          <div className="flex-shrink-0 bg-white border-t border-gray-200 px-3 pt-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
            <button onClick={() => setNarrowDrawerOpen(false)} className="w-full h-12 bg-blue-900 text-white rounded-xl font-bold text-base active:bg-blue-800">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
