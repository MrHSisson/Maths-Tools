import type React from "react";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import type { AnyQuestion, DifficultyLevel, QOSnapshot } from "../types";
import { MathRenderer, InlineMath } from "./MathRenderer";
import { PAGE_BG, LV_COLORS, LV_LABELS, NEUTRAL_LV_COLORS } from "../colors";
import { ansEq } from "../helpers";
import { condensedOf, withoutPrompt } from "../prompts";
import type { ToolConfig, ToolShellDefaults } from "../types";
import { WORKSHEET_FONT_SIZES as fontSizes } from "../useWorksheetFit";
import { extras } from "../questionExtras";

interface WorksheetViewProps {
  config: ToolConfig;
  defaults: ToolShellDefaults;
  currentTool: string;
  questionRenderer: ((q: AnyQuestion, showAnswer: boolean, compact?: boolean, idx?: number, qo?: QOSnapshot, fontClass?: string) => JSX.Element | null) | undefined;
  answerRenderer: ((q: AnyQuestion, qo?: QOSnapshot) => JSX.Element | null) | undefined;
  hideFontControls: boolean;
  getInstruction: (tool?: string) => string;
  getQOSnapshot: () => QOSnapshot;
  regenQuestion: (idx: number) => void;
  sheet: {
    worksheet: AnyQuestion[];
    shownSheet: AnyQuestion[];
    showWorksheetAnswers: boolean;
    setShowWorksheetAnswers: React.Dispatch<React.SetStateAction<boolean>>;
    worksheetLayout: "grid" | "list";
    worksheetBorders: boolean;
    hideRepeatedText: boolean;
    condensedWording: boolean;
    flips: Set<string>;
    cellTap: (e: React.PointerEvent, key: string) => void;
    numQuestions: number;
    effCols: number;
    sheetPrompt: string | null;
    levelPrompt: (lv: DifficultyLevel) => string | null;
    promptBanner: React.JSX.Element | null;
  };
  diff: {
    isDifferentiated: boolean;
    diffLevels: DifficultyLevel[];
    diffSameSize: boolean;
    diffColorLevels: boolean;
  };
  fit: {
    wsFullscreen: boolean;
    setWsFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
    fsCols: number;
    setFsCols: React.Dispatch<React.SetStateAction<number>>;
    fsAuto: boolean;
    setFsAuto: React.Dispatch<React.SetStateAction<boolean>>;
    fsScrollRef: React.RefObject<HTMLDivElement>;
    fsSettled: boolean;
    fsProbe: boolean;
    fsFit: boolean;
    wfs: number;
    instrSizeCls: string;
    canIncrease: boolean;
    canDecrease: boolean;
    stepFont: (d: number) => void;
  };
  bg: {
    qBg: string;
    stepBg: string;
  };
}

export function WorksheetView(props: WorksheetViewProps) {
  const { config, defaults, currentTool, questionRenderer, answerRenderer, hideFontControls, getInstruction, getQOSnapshot, regenQuestion } = props;
  const { worksheet, shownSheet, showWorksheetAnswers, setShowWorksheetAnswers, worksheetLayout, worksheetBorders, hideRepeatedText, condensedWording, flips, cellTap, numQuestions, effCols, sheetPrompt, levelPrompt, promptBanner } = props.sheet;
  const { isDifferentiated, diffLevels, diffSameSize, diffColorLevels } = props.diff;
  const { wsFullscreen, setWsFullscreen, fsCols, setFsCols, fsAuto, setFsAuto, fsScrollRef, fsSettled, fsProbe, fsFit, wfs, instrSizeCls, canIncrease, canDecrease, stepFont } = props.fit;
  const { qBg, stepBg } = props.bg;
    const renderQCell = (qIn: AnyQuestion, idx: number, bgOverride?: string) => {
      const q = condensedWording ? condensedOf(qIn) : qIn;
      const ans = fsProbe || showWorksheetAnswers !== flips.has(q.key);   // this cell's answer is up (the sheet's switch, flipped by a double-tap on the cell)
      const tapProps = { onPointerUp: (e: React.PointerEvent) => cellTap(e, q.key), title: "Double-tap to flip between the question and its answer" };
      const bg = bgOverride ?? stepBg;
      const fsz = fontSizes[wfs];
      const borders = worksheetBorders || !!bgOverride;
      const suppressInstruction = !!extras(q)._sectionHeader;
      // Centred vertically (not top-aligned) so a cell stretched taller than its
      // own content — matching a level's tallest question, or every level's
      // tallest when "Fit all levels" is on — reads as one evenly-sized cell
      // rather than a tightly-wrapped question with dead space hanging below it.
      const cellStyle = borders
        ? { backgroundColor: bg, height: "100%", boxSizing: "border-box" as const, position: "relative" as const, borderRadius: "12px", border: "1px solid #e5e7eb", display: "flex" as const, flexDirection: "column" as const, justifyContent: "center" as const, userSelect: "none" as const, touchAction: "manipulation" as const }
        : { height: "100%", boxSizing: "border-box" as const, position: "relative" as const, display: "flex" as const, flexDirection: "column" as const, justifyContent: "center" as const, userSelect: "none" as const, touchAction: "manipulation" as const };
      const numEl = <span className="text-xs font-bold text-gray-400" style={{ position: "absolute", top: 4, left: 6 }}>{idx + 1}{ans && <span style={{ color: "#16a34a" }}> · answer</span>}</span>;
      const wrapperClass = borders ? "rounded-2xl p-4 shadow-card group" : "p-4 group";
      // text cells get a little less padding: the maths is the point of the cell, so it gets the room
      const textWrapperClass = borders ? "rounded-2xl px-3 py-3 shadow-card group" : "px-3 py-3 group";

      const regenBtn = extras(q)._qo ? (
        <button onClick={() => regenQuestion(idx)} onPointerUp={e => e.stopPropagation()} title="Regenerate this question"
          className="absolute top-1 right-1 w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
          style={{ zIndex: 10 }}>
          <RefreshCw size={12} />
        </button>
      ) : null;

      // If a custom questionRenderer is provided, use it for all question kinds
      if (questionRenderer) {
        return (
          <div className={wrapperClass} style={cellStyle} {...tapProps}>
            {numEl}{regenBtn}
            {/* a text question gives way to its answer (large); a picture keeps the picture and gets the answer under it */}
            {!(ans && q.kind === "worded") && questionRenderer(q, false, true, idx, getQOSnapshot(), fontSizes[wfs])}
            {ans && answerRenderer && (
              <div style={{ marginTop: 4 }}>{answerRenderer(q, getQOSnapshot())}</div>
            )}
            {ans && !answerRenderer && (
              <div className={`${fsz} ws-math font-semibold ${q.kind === "worded" ? "" : "mt-1"} text-center`} style={{ color: "#059669" }}>{extras(q)._answerAsMath && q.answerLatex ? <MathRenderer latex={ansEq(q.answerLatex)} /> : ansEq(q.answer)}</div>
            )}
          </div>
        );
      }

      if (q.kind === "simple") {
        const instrFsz = instrSizeCls;
        return (
          <div className={textWrapperClass} style={cellStyle} {...tapProps}>
            {numEl}{regenBtn}
            {!ans && !suppressInstruction && getInstruction() && <div className={`${instrFsz} font-medium text-center w-full mb-1`} style={{ color: "#475569", paddingTop: "0.15em" }}>{getInstruction()}</div>}
            {!ans && <div className={`${fsz} ws-math font-semibold text-center w-full`} style={{ color: "#000" }}>
              {q.displayLatex ? <MathRenderer latex={q.displayLatex} /> : q.display}
            </div>}
            {ans && (
              <div className={`${fsz} ws-math font-semibold text-center`} style={{ color: "#059669" }}>
                {q.answerLatex ? <MathRenderer latex={ansEq(q.answerLatex)} /> : <span>{ansEq(q.answer)}</span>}
              </div>
            )}
          </div>
        );
      }
      {
        const instrFsz = instrSizeCls;
        return (
          <div className={textWrapperClass} style={cellStyle} {...tapProps}>
            {numEl}{regenBtn}
            {!ans && !suppressInstruction && getInstruction() && <div className={`${instrFsz} font-medium text-center w-full mb-1`} style={{ color: "#475569" }}>{getInstruction()}</div>}
            {!ans && <div className={`${fsz} ws-math font-semibold w-full text-center`} style={{ color: "#000", lineHeight: 1.6 }}>
              {/* a prompt line ("Simplify:") above a line that is only maths reads as a quiet label, so the maths gets the room */}
              {q.lines.map((line, i, all) => {
                if (extras(q)._tagged) return i === 0
                  ? <div key={i}><InlineMath text={line} /></div>
                  : <div key={i} className="font-medium" style={{ color: "#475569", fontSize: "0.5em", lineHeight: 1.3 }}><InlineMath text={line} /></div>;
                const label = all.length > 1 && i < all.length - 1 && !line.includes("$") && /^\$[^$]+\$$/.test(all[all.length - 1].trim());
                return <div key={i} className={label ? `${instrSizeCls} font-medium` : undefined} style={label ? { color: "#475569", lineHeight: 1.4 } : undefined}><InlineMath text={line} /></div>;
              })}
            </div>}
            {ans && (
              <div className={`${fsz} ws-math font-semibold text-center`} style={{ color: "#059669" }}>
                {q.answerLatex ? <MathRenderer latex={ansEq(q.answerLatex)} /> : <span>{ansEq(q.answer)}</span>}
              </div>
            )}
          </div>
        );
      }
    };

    const renderSheet = () => {
      if (worksheet.length === 0) return (
        <div className="rounded-2xl border border-slate-300 shadow-card p-8 text-center" style={{ backgroundColor: qBg }}>
          <span className="text-2xl text-gray-400">Generate worksheet</span>
        </div>
      );
      // Chevrons stay hidden for diagram-first tools, except a text worksheet when the tool opts in (worksheetFontControls).
      const hideWsFontControls = hideFontControls && !(defaults.worksheetFontControls && !worksheet.some((q) => extras(q)._fixedSizeCell));
      const fs = wsFullscreen;
      const cols = fs ? (fsCols || Math.max(effCols, 3)) : effCols;   // fullscreen has the width for more columns
      // equal cells: columns are always equal widths; in fullscreen, once the text fits, the rows split the screen exactly (so every cell is the same size)
      const rowTrack = fs && fsAuto && fsFit ? "minmax(0, 1fr)" : "1fr";
      const sheetCls = fs ? "p-4 relative flex flex-col min-h-full" : "rounded-2xl border border-slate-300 shadow-card p-8 relative";
      const chevrons = hideWsFontControls ? null : (
        <>
          <button disabled={!canDecrease} onClick={() => canDecrease && stepFont(-1)}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canDecrease ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronDown size={20} /></button>
          <button disabled={!canIncrease} onClick={() => canIncrease && stepFont(1)}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canIncrease ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronUp size={20} /></button>
        </>
      );
      const fontSizeControls = fs ? null : (
        <div className="absolute top-4 right-4 flex items-center gap-1">
          {chevrons}
          <button onClick={() => setWsFullscreen(true)} title="Fullscreen" aria-label="Fullscreen"
            className="w-8 h-8 rounded flex items-center justify-center bg-blue-900 text-white hover:bg-blue-800 transition-colors"><Maximize2 size={16} /></button>
        </div>
      );
      const toolTitle = config.tools[currentTool].name;
      // "Fit all levels" cross-level equalisation used to be done by measuring
      // each cell's height in JS (a ResizeObserver) and applying the max as a
      // minHeight — fragile in practice (it depends on the observer firing and
      // the state update landing before the user looks, which isn't guaranteed
      // on every device/network). Pure CSS Grid does the same job for free and
      // deterministically: `subgrid` lets each level's own box reuse the OUTER
      // grid's row tracks, and an auto-sized grid's `1fr` rows always resolve
      // to the size of their single tallest cell — so every level's row N ends
      // up exactly as tall as the tallest row N anywhere, recomputed natively
      // by the browser on every reflow (KaTeX finishing, font load, resize),
      // no JS measurement or timing involved at all.
      if (isDifferentiated) return (
        <div className={sheetCls} style={{ backgroundColor: qBg }}>
          {fontSizeControls}
          {!fs && <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>}
          <div className="grid gap-4" style={{
            alignItems: fs && diffSameSize ? "stretch" : "start",
            gridTemplateColumns: `repeat(${diffLevels.length}, minmax(0, 1fr))`,
            ...(diffSameSize ? { gridTemplateRows: `auto repeat(${numQuestions}, ${rowTrack}) auto` } : {}),
            ...(fs && diffSameSize ? { flex: 1 } : {}),
          }}>
            {diffLevels.map((lv, colIdx) => {
              const lqsFull = worksheet.filter(q => q.difficulty === lv);
              const lp = hideRepeatedText ? levelPrompt(lv) : null;
              const lqs = lp ? lqsFull.map(withoutPrompt) : lqsFull;
              const c = diffColorLevels ? LV_COLORS[lv] : NEUTRAL_LV_COLORS;
              const promptLine = lp ? <div className={`${instrSizeCls} font-medium text-center mt-1`} style={{ color: "#475569" }}>{lp}</div> : null;
              // Each level's box spans the shared rows. Its bottom padding is a spacer row (not box padding), because a subgrid adds its padding
              // to the first / last track, which made the last cell of every column shorter than the rest.
              if (diffSameSize) return (
                <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl px-4 pt-4`}
                  style={{ gridColumn: colIdx + 1, gridRow: `1 / span ${numQuestions + 2}`, display: "grid", gridTemplateRows: "subgrid", gap: "0.75rem" }}>
                  <div style={{ gridRow: 1 }}>
                    <h3 className={`text-xl font-bold text-center ${c.text}`}>{LV_LABELS[lv]}</h3>
                    {promptLine}
                  </div>
                  {lqs.map((q, idx) => (
                    <div key={idx} style={{ gridRow: idx + 2, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      {renderQCell(q, idx, c.fill)}
                    </div>
                  ))}
                  <div style={{ gridRow: numQuestions + 2, height: "0.25rem" }} aria-hidden />
                </div>
              );
              return (
                <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}>
                  <h3 className={`text-xl font-bold text-center ${c.text} ${lp ? "" : "mb-4"}`}>{LV_LABELS[lv]}</h3>
                  {promptLine && <div className="mb-4">{promptLine}</div>}
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gridAutoRows: "1fr", gap: "0.75rem" }}>
                    {lqs.map((q, idx) => (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        {renderQCell(q, idx, c.fill)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
      if (worksheetLayout === "list") {
        const renderListItem = (qIn: AnyQuestion, idx: number) => {
          const q = condensedWording ? condensedOf(qIn) : qIn;
          const fsz = fontSizes[wfs];
          return (
            <div key={idx}>
              <div className="group flex items-baseline gap-2 py-1.5" style={{ breakInside: "avoid", position: "relative" }}>
                <span className="text-xs font-bold text-gray-400 flex-shrink-0" style={{ minWidth: "1.5rem" }}>{idx + 1})</span>
                <div className={`${fsz} ws-math font-semibold flex-1`} style={{ color: "#000" }}>
                  {getInstruction() && <span className={`${instrSizeCls} font-medium mr-1`} style={{ color: "#475569" }}>{getInstruction()}</span>}
                  {questionRenderer
                    ? questionRenderer(q, false, true, idx, getQOSnapshot(), fsz)
                    : q.kind === "simple"
                      ? (q.displayLatex ? <MathRenderer latex={q.displayLatex} /> : <span>{q.display}</span>)
                      : q.lines.map((line, i) => <span key={i}><InlineMath text={line} />{i < q.lines.length - 1 ? " " : ""}</span>)
                  }
                </div>
                {showWorksheetAnswers && (
                  <span className={`${fsz} font-semibold flex-shrink-0`} style={{ color: "#059669" }}>
                    {q.answerLatex ? <MathRenderer latex={ansEq(q.answerLatex)} /> : <span>{ansEq(q.answer)}</span>}
                  </span>
                )}
                {extras(q)._qo && (
                  <button onClick={() => regenQuestion(idx)} title="Regenerate"
                    className="w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
                    <RefreshCw size={10} />
                  </button>
                )}
              </div>
            </div>
          );
        };
        return (
          <div className={sheetCls} style={{ backgroundColor: qBg }}>
            {fontSizeControls}
            {!fs && <h2 className={`text-3xl font-bold text-center ${sheetPrompt ? "mb-3" : "mb-8"}`} style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>}
            {promptBanner}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, columnGap: "1.5rem" }}>
              {shownSheet.map((q, idx) => renderListItem(q, idx))}
            </div>
          </div>
        );
      }
      return (
        <div className={sheetCls} style={{ backgroundColor: qBg }}>
          {fontSizeControls}
          {!fs && <h2 className={`text-3xl font-bold text-center ${sheetPrompt ? "mb-3" : "mb-8"}`} style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>}
          {promptBanner}
          {/* gridAutoRows: "1fr" — same explicit-row-track convention used for a
              differentiated level's own question list below — so every cell in a
              row is forced to the row's tallest occupant. Left at the CSS default
              ("auto") this pairs with async KaTeX rendering (content height
              changing after the grid's first layout pass) to sometimes leave a
              row uneven, matching what "Fit all levels" hit before it moved to
              explicit tracks. */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: rowTrack, gap: "1rem", ...(fs ? { flex: 1 } : {}) }}>
            {shownSheet.map((q, idx) => <div key={idx} style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>{renderQCell(q, idx)}</div>)}
          </div>
        </div>
      );
    };

    // Fullscreen: the sheet fills the whole width (no page margins), with a slim bar for the controls a teacher needs while presenting it.
    const renderWorksheet = () => {
      const sheet = renderSheet();
      if (!wsFullscreen || worksheet.length === 0) return sheet;
      const colsNow = fsCols || Math.max(effCols, 3);
      const btn = "w-9 h-9 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-blue-900 hover:bg-slate-50";
      return (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: PAGE_BG, display: "flex", flexDirection: "column" }}>
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-white border-b border-slate-200 flex-shrink-0 flex-wrap">
            <div className="font-semibold text-gray-900 truncate">{config.tools[currentTool].name} — Worksheet</div>
            <div className="flex items-center gap-2">
              {!isDifferentiated && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  Columns
                  <button className={btn} onClick={() => setFsCols(Math.max(1, colsNow - 1))} aria-label="Fewer columns">−</button>
                  <span className="w-5 text-center font-semibold">{colsNow}</span>
                  <button className={btn} onClick={() => setFsCols(Math.min(8, colsNow + 1))} aria-label="More columns">+</button>
                </div>
              )}
              {!(hideFontControls && !defaults.worksheetFontControls) && <div className="flex items-center gap-1">
                <button className={btn} disabled={!canDecrease} onClick={() => canDecrease && stepFont(-1)} aria-label="Smaller text"><ChevronDown size={18} /></button>
                <button className={btn} disabled={!canIncrease} onClick={() => canIncrease && stepFont(1)} aria-label="Larger text"><ChevronUp size={18} /></button>
                {!fsAuto && <button className="px-3 h-9 rounded-lg bg-white border border-slate-200 text-blue-900 text-sm font-semibold hover:bg-slate-50" onClick={() => setFsAuto(true)} title="Fit the text size to the screen">Auto-fit</button>}
              </div>}
              <button onClick={() => setShowWorksheetAnswers(x => !x)} className="px-4 h-9 bg-blue-900 text-white rounded-lg font-semibold text-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={16} />{showWorksheetAnswers ? "Hide Answers" : "Show Answers"}</button>
              <button onClick={() => setWsFullscreen(false)} title="Exit Fullscreen (Esc)" aria-label="Exit fullscreen" className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#374151" }}><Minimize2 size={16} color="#ffffff" /></button>
            </div>
          </div>
          <div ref={fsScrollRef} className="flex-1 overflow-y-auto" style={{ visibility: fsAuto && !fsSettled ? "hidden" : "visible" }}>{sheet}</div>
        </div>
      );
    };

  return renderWorksheet();
}
