import type { ReactNode, RefObject } from "react";
import type { AnyQuestion, DifficultyLevel, PrintMode, ToolConfig, ToolShellDefaults } from "../types";
import type { ToolShellProps } from "../ToolShellCore";
import { RefreshCw, Eye, ChevronDown, SlidersHorizontal } from "lucide-react";
import { LV_LABELS, LV_SELECTOR } from "../colors";
import { hasCondensed } from "../prompts";
import { handlePrint } from "../print";
import { PrintSplitButton } from "./PrintSplitButton";
import { SegButtons } from "./QOPopovers";

type Set<T> = (v: T) => void;

export interface WorksheetControlsProps {
  advancedToggle: ReactNode;
  config: ToolConfig;
  defaults: ToolShellDefaults;
  currentTool: string;
  customPrintHandler?: ToolShellProps["customPrintHandler"];
  getInstruction: () => string;
  qoEl: (isDiff?: boolean) => ReactNode;
  // levels and the differentiated sheet
  showLevelToggle: boolean;
  toolLevels: DifficultyLevel[];
  availableLevels: DifficultyLevel[];
  difficulty: DifficultyLevel;
  diffToggle: boolean;
  diffLevels: DifficultyLevel[];
  isDifferentiated: boolean;
  toggleDiffLevel: (lv: DifficultyLevel) => void;
  toggleDiffMode: () => void;
  diffSameSize: boolean; setDiffSameSize: Set<boolean>;
  diffColorLevels: boolean; setDiffColorLevels: Set<boolean>;
  // questions, columns and the settings popover
  numQuestions: number; setNumQuestions: Set<number>;
  effCols: number; maxCols: number; colCap: number; setNumColumns: Set<number>;
  wsSettingsOpen: boolean; setWsSettingsOpen: (v: boolean | ((o: boolean) => boolean)) => void;
  worksheetLayout: "grid" | "list"; setWorksheetLayout: Set<"grid" | "list">;
  worksheetBorders: boolean; setWorksheetBorders: Set<boolean>;
  condensedWording: boolean; setCondensedWording: Set<boolean>;
  sharedPrompt: string | null; hideRepeatedText: boolean; setHideRepeatedText: Set<boolean>;
  toolHasWeightedPool: boolean; smartProgressorEnabled: boolean; setSmartProgressorEnabled: Set<boolean>;
  // the sheet and its actions
  worksheet: AnyQuestion[];
  worksheetWrapRef: RefObject<HTMLDivElement | null>;
  handleGenerateWorksheet: () => void;
  showWorksheetAnswers: boolean; setShowWorksheetAnswers: Set<boolean>;
  printMode: PrintMode; setPrintMode: Set<PrintMode>;
}

/** The standard Worksheet tab's control panel: levels, Question Options, Differentiated, questions, columns, settings, generate, answers, print. */
export function WorksheetControls(P: WorksheetControlsProps) {
  const {
    advancedToggle, config, defaults, currentTool, customPrintHandler, getInstruction, qoEl,
    showLevelToggle, toolLevels, availableLevels, difficulty, diffToggle, diffLevels, isDifferentiated, toggleDiffLevel, toggleDiffMode,
    diffSameSize, setDiffSameSize, diffColorLevels, setDiffColorLevels,
    numQuestions, setNumQuestions, effCols, maxCols, colCap, setNumColumns, wsSettingsOpen, setWsSettingsOpen,
    worksheetLayout, setWorksheetLayout, worksheetBorders, setWorksheetBorders, condensedWording, setCondensedWording,
    sharedPrompt, hideRepeatedText, setHideRepeatedText, toolHasWeightedPool, smartProgressorEnabled, setSmartProgressorEnabled,
    worksheet, worksheetWrapRef, handleGenerateWorksheet, showWorksheetAnswers, setShowWorksheetAnswers, printMode, setPrintMode,
  } = P;
  const bordersDisabled = worksheetLayout !== "grid";
  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-card mb-6">
      <div className="px-6 py-4 border-b-2 border-gray-200">
        {advancedToggle}
      </div>
      <div className="p-6">
        {/* Row 1: levels · QO · differentiated */}
        <div className="flex justify-center items-center gap-6 mb-5">
          {showLevelToggle && <div className="flex rounded-xl border border-slate-200 overflow-hidden ">
            {toolLevels.map((val) => {
              const label = LV_LABELS[val];
              const col = LV_SELECTOR[val];
              const active = diffToggle ? diffLevels.includes(val) : difficulty === val;
              return (
                <button key={val} onClick={() => toggleDiffLevel(val)}
                  className={`px-5 py-2 font-bold text-base transition-colors ${active ? `${col.bg} ${col.text}` : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                  {label}
                </button>
              );
            })}
          </div>}
          {qoEl(isDifferentiated)}
          {showLevelToggle && (() => { const diffDisabled = availableLevels.length < 2; return (
            <button onClick={toggleDiffMode}
              className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${diffDisabled ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed" : diffToggle ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>
              Differentiated
            </button>
          ); })()}
        </div>

        {/* Row 2: questions · columns · settings */}
        <div className="flex justify-center items-center gap-6 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions:</label>
            <input type="number" min="1" max="24" value={numQuestions}
              onChange={e => setNumQuestions(Math.max(1, Math.min(24, parseInt(e.target.value) || (defaults.numQuestions ?? 15))))}
              className="w-20 px-4 py-2 border border-slate-200 rounded-lg text-base font-semibold text-center" />
          </div>
          {!defaults.fixedColumns && (
            <div className="flex items-center gap-3">
              <label className="text-base font-semibold text-gray-700">Columns:</label>
              <input type="number" min="1" max={Math.min(maxCols, colCap)} value={isDifferentiated ? diffLevels.length : effCols}
                onChange={e => { if (!isDifferentiated) setNumColumns(Math.max(1, Math.min(Math.min(maxCols, colCap), parseInt(e.target.value) || (defaults.numColumns ?? 3)))); }}
                disabled={isDifferentiated}
                className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center transition-colors ${isDifferentiated ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 bg-white"}`} />
            </div>
          )}

          {/* Layout & borders tucked into a settings popover, labelled to
              match the Questions/Columns selectors */}
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Settings:</label>
            <div className="relative">
            <button onClick={() => setWsSettingsOpen(o => !o)}
              className={`px-4 py-2 rounded-lg font-semibold text-base border-2 transition-colors flex items-center gap-2 ${wsSettingsOpen ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>
              <SlidersHorizontal size={18} /> <ChevronDown size={16} className={`transition-transform ${wsSettingsOpen ? "rotate-180" : ""}`} />
            </button>
            {wsSettingsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setWsSettingsOpen(false)} />
                <div className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-slate-200 p-4" style={{ minWidth: 220 }}>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Layout</div>
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden mb-4">
                    <button onClick={() => setWorksheetLayout("grid")}
                      className={`flex-1 px-4 py-2 text-sm font-bold transition-colors ${worksheetLayout === "grid" ? "bg-blue-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                      Worksheet
                    </button>
                    <button onClick={() => setWorksheetLayout("list")}
                      className={`flex-1 px-4 py-2 text-sm font-bold transition-colors ${worksheetLayout === "list" ? "bg-blue-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                      Textbook
                    </button>
                  </div>
                  <label className={`flex items-center justify-between gap-3 ${bordersDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
                    <span className="text-sm font-semibold text-gray-600">Borders</span>
                    <div onClick={() => { if (!bordersDisabled) setWorksheetBorders(!worksheetBorders); }}
                      className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${worksheetBorders && !bordersDisabled ? "bg-blue-900" : "bg-gray-300"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${worksheetBorders ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                  </label>
                  {worksheet.some(hasCondensed) && (
                    <label className="flex items-center justify-between gap-3 cursor-pointer mt-3">
                      <span className="text-sm font-semibold text-gray-600">Condensed wording</span>
                      <div onClick={() => setCondensedWording(!condensedWording)}
                        className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${condensedWording ? "bg-blue-900" : "bg-gray-300"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${condensedWording ? "translate-x-4" : "translate-x-0.5"}`} />
                      </div>
                    </label>
                  )}
                  {sharedPrompt && (
                    <label className="flex items-center justify-between gap-3 cursor-pointer mt-3">
                      <span className="text-sm font-semibold text-gray-600">Say the prompt once</span>
                      <div onClick={() => setHideRepeatedText(!hideRepeatedText)}
                        className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${hideRepeatedText ? "bg-blue-900" : "bg-gray-300"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hideRepeatedText ? "translate-x-4" : "translate-x-0.5"}`} />
                      </div>
                    </label>
                  )}
                  {toolHasWeightedPool && (
                    <label className="flex items-center justify-between gap-3 cursor-pointer mt-3">
                      <span className="text-sm font-semibold text-gray-600">Smart Progressor</span>
                      <div onClick={() => setSmartProgressorEnabled(!smartProgressorEnabled)}
                        className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${smartProgressorEnabled ? "bg-blue-900" : "bg-gray-300"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${smartProgressorEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
                      </div>
                    </label>
                  )}
                  {isDifferentiated && (
                    <>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-2">Differentiated</div>
                      <div className="text-xs font-semibold text-gray-500 mb-1">Question Cell Size</div>
                      <SegButtons
                        value={diffSameSize ? "same" : "fit"}
                        onChange={v => setDiffSameSize(v === "same")}
                        opts={[
                          { value: "fit", label: "Fit each level" },
                          { value: "same", label: "Fit all levels" },
                        ]}
                      />
                      <label className="flex items-center justify-between gap-3 cursor-pointer mt-3">
                        <span className="text-sm font-semibold text-gray-600">Colour levels</span>
                        <div onClick={() => setDiffColorLevels(!diffColorLevels)}
                          className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${diffColorLevels ? "bg-blue-900" : "bg-gray-300"}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${diffColorLevels ? "translate-x-4" : "translate-x-0.5"}`} />
                        </div>
                      </label>
                    </>
                  )}
                </div>
              </>
            )}
            </div>
          </div>
        </div>

        {/* Row 3: actions — generate · answers · print */}
        <div className="flex justify-center items-center gap-4 flex-wrap">
          <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-semibold text-base hover:bg-blue-800 flex items-center gap-2">
            <RefreshCw size={18} /> Generate
          </button>
          {worksheet.length > 0 && (
            <>
              <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-semibold text-base hover:bg-blue-800 flex items-center gap-2">
                <Eye size={18} /> {showWorksheetAnswers ? "Hide Answers" : "Show Answers"}
              </button>
              <PrintSplitButton
                onPrint={m => customPrintHandler
                  ? customPrintHandler(worksheet, m, worksheetWrapRef.current, {
                      toolName: config.tools[currentTool].name, difficulty, isDifferentiated, diffLevels, diffSameSize, diffColorLevels,
                      numColumns: effCols, instruction: getInstruction(), layout: worksheetLayout, showBorders: worksheetBorders,
                    })
                  : handlePrint(worksheet, config.tools[currentTool].name, difficulty, isDifferentiated, diffLevels, effCols, getInstruction(), m, worksheetLayout, worksheetBorders, diffSameSize, diffColorLevels)}
                printMode={printMode} setPrintMode={setPrintMode}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );

}
