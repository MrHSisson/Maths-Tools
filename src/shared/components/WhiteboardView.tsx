import type { ReactNode } from "react";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Video, Maximize2, Minimize2, PanelRightClose, PanelRightOpen, Table2 } from "lucide-react";
import type React from "react";
import type { AnyQuestion, DifficultyLevel, QOSnapshot } from "../types";
import type { QuestionKeeperMenu } from "../questionKeeper";
import { DifficultyToggle } from "./DifficultyToggle";
import { PinButton } from "./PinButton";
import { ScaleToFit } from "./ScaleToFit";
import { QuestionDisplay, AnswerDisplay } from "./QuestionDisplay";

export interface WhiteboardViewProps {
  questionRenderer: ((q: AnyQuestion, showAnswer: boolean, colorScheme: string, compact?: boolean, idx?: number, qo?: QOSnapshot, fontClass?: string) => JSX.Element | null) | undefined;
  answerRenderer: ((q: AnyQuestion, colorScheme: string, qo?: QOSnapshot) => JSX.Element | null) | undefined;
  workingScaffold: { label: string; placement?: "workingBox" | "workingCorner" | "question"; cornerWidth?: number; render: (q: AnyQuestion, showAnswer: boolean, colorScheme: string, qo?: QOSnapshot) => JSX.Element | null; } | undefined;
  colorScheme: "default";
  levels: {
    difficulty: DifficultyLevel;
    toolLevels: DifficultyLevel[];
    showLevelToggle: boolean;
    levelInfoBtn: React.JSX.Element | null;
    setDifficultyGuarded: (v: DifficultyLevel) => void;
  };
  question: {
    currentQuestion: AnyQuestion;
    showWhiteboardAnswer: boolean;
    setShowWhiteboardAnswer: React.Dispatch<React.SetStateAction<boolean>>;
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
    wbFullscreen: boolean;
    setWbFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
    workingCollapsed: boolean;
    setWorkingCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    scaffoldHidden: boolean;
    setScaffoldHidden: React.Dispatch<React.SetStateAction<boolean>>;
    splitPct: number;
    setSplitPct: React.Dispatch<React.SetStateAction<number>>;
    isDraggingRef: React.MutableRefObject<boolean>;
    splitContainerRef: React.RefObject<HTMLDivElement>;
  };
  vis: {
    presenterMode: boolean;
    setPresenterMode: React.Dispatch<React.SetStateAction<boolean>>;
    camDevices: MediaDeviceInfo[];
    currentCamId: string | null;
    camError: string | null;
    camDropdownOpen: boolean;
    setCamDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
    videoRef: React.RefObject<HTMLVideoElement>;
    camDropdownRef: React.RefObject<HTMLDivElement>;
    longPressTimer: React.MutableRefObject<NodeJS.Timeout | null>;
    didLongPress: React.MutableRefObject<boolean>;
    startCam: (deviceId?: string) => Promise<void>;
  };
  bg: {
    qBg: string;
    stepBg: string;
    fsToolbarBg: string;
    fsQuestionBg: string;
    fsWorkingBg: string;
  };
}

export function WhiteboardView(P: WhiteboardViewProps) {
  const { questionRenderer, answerRenderer, workingScaffold, colorScheme } = P;
  const { difficulty, toolLevels, showLevelToggle, levelInfoBtn, setDifficultyGuarded } = P.levels;
  const { currentQuestion, showWhiteboardAnswer, setShowWhiteboardAnswer, stagedBtn, getQOSnapshot, handleNewQuestion, getInstruction, qoEl, keeperOn } = P.question;
  const { displayFontSize, setDisplayFontSize, displayFontSizes, canDisplayIncrease, canDisplayDecrease, hideFontControls } = P.font;
  const { wbFullscreen, setWbFullscreen, workingCollapsed, setWorkingCollapsed, scaffoldHidden, setScaffoldHidden, splitPct, setSplitPct, isDraggingRef, splitContainerRef } = P.panel;
  const { presenterMode, setPresenterMode, camDevices, currentCamId, camError, camDropdownOpen, setCamDropdownOpen, videoRef, camDropdownRef, longPressTimer, didLongPress, startCam } = P.vis;
  const { qBg, stepBg, fsToolbarBg, fsQuestionBg, fsWorkingBg } = P.bg;
  const fsToolbar = (
    <div style={{ background: fsToolbarBg, borderBottom: "2px solid #000", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexShrink: 0, zIndex: 210 }}>
      {showLevelToggle && <div className="flex items-center gap-1.5"><DifficultyToggle value={difficulty} onChange={v => setDifficultyGuarded(v as DifficultyLevel)} levels={toolLevels} />{levelInfoBtn}</div>}
      {qoEl()}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <PinButton keeper={keeperOn} />
        <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-semibold text-base hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
        <button onClick={() => setShowWhiteboardAnswer(a => !a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-semibold text-base hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWhiteboardAnswer ? "Hide Answer" : "Show Answer"}</button>
      </div>
    </div>
  );

  const fontBtnStyle = (enabled: boolean) => ({
    background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8,
    cursor: enabled ? "pointer" : "not-allowed", width: 32, height: 32,
    display: "flex", alignItems: "center", justifyContent: "center",
    opacity: enabled ? 1 : 0.35,
  });

  // Re-open control that lives inside the question box, so the working/
  // visualiser panel is always recoverable — including fullscreen-expanded.
  const expandBtn = (
    <button title="Show working / visualiser" onClick={() => setWorkingCollapsed(false)}
      style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.15)")}
      onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
    ><PanelRightOpen size={16} color="#6b7280" /></button>
  );
  const scaffoldInQ = workingScaffold?.placement === "question";
  const scaffoldToggle = scaffoldInQ && workingScaffold && (
    <button onClick={() => setScaffoldHidden(h => !h)} title={`${scaffoldHidden ? "Show" : "Hide"} ${workingScaffold.label}`}
      style={{ background: scaffoldHidden ? "rgba(0,0,0,0.08)" : "#374151", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
    ><Table2 size={16} color={scaffoldHidden ? "#6b7280" : "#ffffff"} /></button>
  );
  const scaffoldInQuestion = (fullscreen: boolean) => (scaffoldInQ && workingScaffold && !scaffoldHidden)
    ? <div className="w-full">{workingScaffold.render(currentQuestion, showWhiteboardAnswer, colorScheme, fullscreen ? { ...getQOSnapshot(), fullscreen: true } as QOSnapshot : getQOSnapshot())}</div>
    : null;
  // A tool that hides the size chevrons (its scaffold — a table — is the content) gets them back
  // while that scaffold is hidden, since the question alone is then ordinary text to resize. The
  // box also stops auto-growing the question to fill (maxScale 1), or the chevrons would do nothing.
  const scaffoldOff = scaffoldInQ && scaffoldHidden;
  const fontControlsOn = !hideFontControls || scaffoldOff;
  const qBoxControls = (
    (fontControlsOn || workingCollapsed || scaffoldInQ) && <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 20 }}>
      {fontControlsOn && <>
        <button style={fontBtnStyle(canDisplayDecrease)} onClick={() => canDisplayDecrease && setDisplayFontSize(f => f - 1)}><ChevronDown size={16} color="#6b7280" /></button>
        <button style={fontBtnStyle(canDisplayIncrease)} onClick={() => canDisplayIncrease && setDisplayFontSize(f => f + 1)}><ChevronUp size={16} color="#6b7280" /></button>
      </>}
      {scaffoldToggle}
      {workingCollapsed && expandBtn}
      {/* With the working panel collapsed its own fullscreen button is gone, so keep one here — last, matching its position in the open panel. */}
      {workingCollapsed && (
        <button onClick={() => setWbFullscreen(f => !f)} title={wbFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          style={{ background: wbFullscreen ? "#374151" : "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
        >{wbFullscreen ? <Minimize2 size={16} color="#ffffff" /> : <Maximize2 size={16} color="#6b7280" />}</button>
      )}
    </div>
  );
  const fit = (content: ReactNode) => workingCollapsed ? <ScaleToFit maxScale={scaffoldOff ? 1 : 3}>{content}</ScaleToFit> : content;

  // Fullscreen ALWAYS fit-scales: grow-to-fill when the panel is collapsed,
  // shrink-to-fit (maxScale 1) in the split view — so dragging the splitter
  // wider grows the diagram only up to the viable height and the box never
  // needs a scrollbar. Content is wrapped in a div because ScaleToFit
  // measures the union of its children.
  const fitFS = (content: ReactNode) => (
    <ScaleToFit maxScale={workingCollapsed && !scaffoldOff ? 3 : 1}>{content}</ScaleToFit>
  );

  const questionBox = () => (
    <div className="rounded-xl border border-slate-300 shadow-pane flex items-center justify-center p-8" style={{ position: "relative", width: workingCollapsed ? "auto" : "480px", flex: workingCollapsed ? "1 1 auto" : "0 0 auto", height: "100%", backgroundColor: stepBg }}>
      {qBoxControls}
      {fit(
        <div className="w-full text-center flex flex-col gap-4 items-center">
          {getInstruction() && <div className={`${["text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl"][displayFontSize]} font-semibold`} style={{ color: "#000" }}>{getInstruction()}</div>}
          {questionRenderer
            ? <>{questionRenderer(currentQuestion, showWhiteboardAnswer, colorScheme, undefined, undefined, getQOSnapshot(), displayFontSizes[displayFontSize])}{stagedBtn(showWhiteboardAnswer)}{scaffoldInQuestion(false)}</>
            : <>
                <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]} />
                {showWhiteboardAnswer && <div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>
                  {answerRenderer ? answerRenderer(currentQuestion, colorScheme, getQOSnapshot()) : <AnswerDisplay q={currentQuestion} />}
                </div>}
                {scaffoldInQuestion(false)}
              </>
          }
        </div>
      )}
    </div>
  );

  const questionBoxFS = () => (
    <div style={{ position: "relative", width: workingCollapsed ? "100%" : `${splitPct}%`, height: "100%", backgroundColor: fsQuestionBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, boxSizing: "border-box", flexShrink: 0, overflow: "hidden", gap: 16 }}>
      {qBoxControls}
      {fitFS(
        <>
          {getInstruction() && <div className={`${["text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl"][displayFontSize]} font-semibold`} style={{ color: "#000" }}>{getInstruction()}</div>}
          {questionRenderer
            ? <>{questionRenderer(currentQuestion, showWhiteboardAnswer, colorScheme, false, undefined, { ...getQOSnapshot(), fullscreen: true }, displayFontSizes[displayFontSize])}{stagedBtn(showWhiteboardAnswer)}{scaffoldInQuestion(true)}</>
            : <>
                <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]} />
                {showWhiteboardAnswer && <div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>
                  {answerRenderer ? answerRenderer(currentQuestion, colorScheme, getQOSnapshot()) : <AnswerDisplay q={currentQuestion} />}
                </div>}
                {scaffoldInQuestion(true)}
              </>
          }
        </>
      )}
    </div>
  );

  const makeRightPanel = (isFS: boolean) => (
    <div style={{ flex: 1, height: "100%", position: "relative", overflow: "hidden", backgroundColor: presenterMode ? "#000" : (isFS ? fsWorkingBg : stepBg), borderRadius: isFS ? 0 : undefined }} className={isFS ? "" : "flex-1 rounded-xl border border-slate-300 shadow-pane"}>
      {presenterMode && (
        <>
          <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          {camError && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", padding: "2rem", textAlign: "center", zIndex: 1 }}>{camError}</div>}
        </>
      )}
      {workingScaffold && workingScaffold.placement === "workingCorner" && !presenterMode && !scaffoldHidden && (
        <div style={{ position: "absolute", top: 10, left: 10, width: (workingScaffold.cornerWidth ?? 190) * (isFS ? 1.4 : 1), zIndex: 5 }}>
          {workingScaffold.render(currentQuestion, showWhiteboardAnswer, colorScheme, getQOSnapshot())}
        </div>
      )}
      {workingScaffold && (workingScaffold.placement ?? "workingBox") === "workingBox" && !presenterMode && !scaffoldHidden && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "56px 16px 16px", boxSizing: "border-box", zIndex: 5 }}>
          <ScaleToFit maxScale={isFS ? 1.6 : 1}>
            <div className="w-full">{workingScaffold.render(currentQuestion, showWhiteboardAnswer, colorScheme, getQOSnapshot())}</div>
          </ScaleToFit>
        </div>
      )}
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 20 }}>
        {presenterMode ? (
          <div style={{ position: "relative" }} ref={camDropdownRef}>
            <button title="Exit Visualiser (hold for cameras)"
              onMouseDown={() => { didLongPress.current = false; longPressTimer.current = setTimeout(() => { didLongPress.current = true; setCamDropdownOpen(o => !o); }, 500); }}
              onMouseUp={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); if (!didLongPress.current) setPresenterMode(false); }}
              onMouseLeave={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
              style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.75)")}
            ><Video size={16} color="rgba(255,255,255,0.85)" /></button>
            {camDropdownOpen && (
              <div style={{ position: "absolute", top: 40, right: 0, background: "rgba(12,12,12,0.96)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, minWidth: 200, overflow: "hidden", zIndex: 30 }}>
                <div style={{ padding: "6px 14px", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Camera</div>
                {camDevices.map((d, i) => (
                  <div key={d.deviceId} onClick={() => { setCamDropdownOpen(false); if (d.deviceId !== currentCamId) startCam(d.deviceId); }}
                    style={{ padding: "10px 14px", fontSize: "0.75rem", color: d.deviceId === currentCamId ? "#60a5fa" : "rgba(255,255,255,0.65)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  ><div style={{ width: 5, height: 5, borderRadius: "50%", background: d.deviceId === currentCamId ? "#60a5fa" : "transparent", flexShrink: 0 }} />{d.label || `Camera ${i + 1}`}</div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => setPresenterMode(true)} title="Visualiser mode"
            style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.15)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
          ><Video size={16} color="#6b7280" /></button>
        )}
        {workingScaffold && workingScaffold.placement !== "question" && !presenterMode && (
          <button onClick={() => setScaffoldHidden(h => !h)} title={`${scaffoldHidden ? "Show" : "Hide"} ${workingScaffold.label}`}
            style={{ background: scaffoldHidden ? "rgba(0,0,0,0.08)" : "#374151", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
          ><Table2 size={16} color={scaffoldHidden ? "#6b7280" : "#ffffff"} /></button>
        )}
        <button onClick={() => setWorkingCollapsed(true)} title="Collapse working / visualiser"
          style={{ background: presenterMode ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.08)", border: presenterMode ? "1px solid rgba(255,255,255,0.15)" : "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: presenterMode ? "blur(6px)" : "none" }}
          onMouseEnter={e => (e.currentTarget.style.background = presenterMode ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.15)")}
          onMouseLeave={e => (e.currentTarget.style.background = presenterMode ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.08)")}
        ><PanelRightClose size={16} color={presenterMode ? "rgba(255,255,255,0.85)" : "#6b7280"} /></button>
        <button onClick={() => setWbFullscreen(f => !f)} title={wbFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          style={{ background: wbFullscreen ? "#374151" : (presenterMode ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.08)"), border: presenterMode ? "1px solid rgba(255,255,255,0.15)" : "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: presenterMode ? "blur(6px)" : "none" }}
          onMouseEnter={e => (e.currentTarget.style.background = wbFullscreen ? "#1f2937" : (presenterMode ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.15)"))}
          onMouseLeave={e => (e.currentTarget.style.background = wbFullscreen ? "#374151" : (presenterMode ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.08)"))}
        >{wbFullscreen ? <Minimize2 size={16} color="#ffffff" /> : <Maximize2 size={16} color={presenterMode ? "rgba(255,255,255,0.85)" : "#6b7280"} />}</button>
      </div>
    </div>
  );

  if (wbFullscreen) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: fsToolbarBg, display: "flex", flexDirection: "column" }}>
      {fsToolbar}
      <div ref={splitContainerRef} style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {questionBoxFS()}
        {!workingCollapsed && <>
        <div
          style={{ position: "relative", width: 2, backgroundColor: "#000", flexShrink: 0, cursor: "col-resize" }}
          onMouseDown={e => {
            isDraggingRef.current = true;
            const onMove = (ev: MouseEvent) => {
              if (!isDraggingRef.current || !splitContainerRef.current) return;
              const rect = splitContainerRef.current.getBoundingClientRect();
              let pct = ((ev.clientX - rect.left) / rect.width) * 100;
              pct = Math.min(75, Math.max(25, pct));
              if (pct >= 38 && pct <= 42) pct = 40;
              setSplitPct(pct);
            };
            const onUp = () => { isDraggingRef.current = false; document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
            e.preventDefault();
          }}
        >
          <div style={{ position: "absolute", top: 0, bottom: 0, left: -5, width: 12, cursor: "col-resize" }} />
        </div>
        {makeRightPanel(true)}
        </>}
      </div>
    </div>
  );

  return (
    <div className="p-8" style={{ backgroundColor: qBg, height: "480px", boxSizing: "border-box" }}>
      <div className="flex gap-6" style={{ height: "100%" }}>
        {questionBox()}
        {!workingCollapsed && makeRightPanel(false)}
      </div>
    </div>
  );
}
