import { useState, useEffect, useLayoutEffect, useRef, useCallback, type ReactNode } from "react";
import { RefreshCw, Eye, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Home, Menu, X, Video, Maximize2, Minimize2, PanelRightClose, PanelRightOpen, LayoutGrid, SlidersHorizontal } from "lucide-react";
import type { DifficultyLevel, AnyQuestion, WorkingStep, ToolConfig, InfoSection, PrintMode, QOSnapshot, ToolShellDefaults } from "./types";
import { LV_COLORS, getQuestionBg, getStepBg } from "./colors";
import { normalizeMultiSelect, ansEq, makeUniqueQ } from "./helpers";
import { loadKaTeX } from "./katex";
import { MathRenderer, InlineMath } from "./components/MathRenderer";
import { QuestionDisplay, AnswerDisplay } from "./components/QuestionDisplay";
import { DifficultyToggle } from "./components/DifficultyToggle";
import {
  StandardQOPopover,
  DiffQOPopover,
} from "./components/QOPopovers";
import { InfoModal } from "./components/InfoModal";
import { MenuDropdown } from "./components/MenuDropdown";
import { PrintSplitButton } from "./components/PrintSplitButton";
import { handlePrint } from "./print";
import type { PrintContext } from "./printDiagram";
import { WorksheetBuilder } from "./WorksheetBuilder";
import { useDevMode } from "../devMode";

export interface ToolShellProps {
  config: ToolConfig;
  infoSections: InfoSection[];
  generateQuestion: (
    tool: string,
    level: DifficultyLevel,
    variables: Record<string, boolean>,
    dropdownValue: string,
    multiSelectValues?: Record<string, boolean>,
  ) => AnyQuestion;
  /** Optional — ToolShell wraps generateQuestion with the standard
   *  retry-until-unique loop (makeUniqueQ) when this is omitted. Only supply
   *  it for tools needing non-standard uniqueness handling. */
  generateUniqueQ?: (
    tool: string,
    level: DifficultyLevel,
    variables: Record<string, boolean>,
    dropdownValue: string,
    usedKeys: Set<string>,
    multiSelectValues?: Record<string, boolean>,
  ) => AnyQuestion;
  defaults?: ToolShellDefaults;
  stepRenderer?: (step: WorkingStep, colorScheme: string, qo?: QOSnapshot) => JSX.Element | null;
  /** Replaces QuestionDisplay in all modes. compact=true in worksheet cells, false in worked example/fullscreen, undefined in regular whiteboard. idx is the worksheet question index (only provided in worksheet cells). qo is the live QO state snapshot — use it for render-time reformatting (e.g. decimal/fraction toggle). */
  questionRenderer?: (q: AnyQuestion, showAnswer: boolean, colorScheme: string, compact?: boolean, idx?: number, qo?: QOSnapshot, fontClass?: string) => JSX.Element | null;
  /** Replaces the final answer box (AnswerDisplay). Shown when showAnswer=true. qo is the live QO state snapshot. */
  answerRenderer?: (q: AnyQuestion, colorScheme: string, qo?: QOSnapshot) => JSX.Element | null;
  /** Called when a QO option changes before falling back to full regeneration. Return a reformatted copy of the question, or null to trigger a new question instead. Use this for instant display-mode switches (e.g. decimal ↔ fraction) where the maths doesn't change. */
  reformatQuestion?: (q: AnyQuestion, qo: QOSnapshot) => AnyQuestion | null;
  /** Custom print handler for diagram tools. Receives the worksheet array, print mode, the worksheet container DOM element (for SVG extraction), and the live print context (columns, differentiated, etc.). Diagram tools should pass this to the shared handleDiagramPrint. */
  customPrintHandler?: (questions: AnyQuestion[], printMode: PrintMode, worksheetEl: HTMLElement | null, ctx: PrintContext) => void;
}

/** Scales its content up to fill the available space (never shrinks below 1x).
 *  Used when the working/visualiser panel is collapsed so the diagram/SVG
 *  genuinely grows into the reclaimed space — like dragging the splitter wide,
 *  but past the tool's own maxWidth cap. Content renders at its natural size
 *  first (width:100% preserved), then a CSS transform scales it up to fit. */
function ScaleToFit({ children, maxScale = 3 }: { children: ReactNode; maxScale?: number }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);
  scaleRef.current = scale;
  useLayoutEffect(() => {
    const outer = outerRef.current, inner = innerRef.current;
    if (!outer || !inner) return;
    let raf = 0;
    const recompute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const o = outerRef.current, n = innerRef.current;
        if (!o || !n) return;
        const availW = o.clientWidth, availH = o.clientHeight;
        // Measure the *natural* content size with the transform neutralised, so
        // the reading never depends on the current scale. Use the union of the
        // inner's children rather than querySelector("svg") — KaTeX renders roots
        // (\sqrt) as inline <svg>, which the old selector grabbed instead of the
        // content, producing a wild zoom whenever a root appeared.
        const prev = n.style.transform;
        n.style.transform = "none";
        const kids = Array.from(n.children) as HTMLElement[];
        let natW = 0, natH = 0;
        if (kids.length) {
          let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
          for (const k of kids) {
            const r = k.getBoundingClientRect();
            left = Math.min(left, r.left); top = Math.min(top, r.top);
            right = Math.max(right, r.right); bottom = Math.max(bottom, r.bottom);
          }
          natW = right - left; natH = bottom - top;
        } else {
          const r = n.getBoundingClientRect();
          natW = r.width; natH = r.height;
        }
        n.style.transform = prev;
        if (!natW || !natH) return;
        const s = Math.min((availW * 0.96) / natW, (availH * 0.96) / natH);
        const clamped = Math.max(1, Math.min(maxScale, s));
        if (Math.abs(clamped - scaleRef.current) > 0.01) setScale(clamped);
      });
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(outer); ro.observe(inner);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [maxScale]);
  return (
    <div ref={outerRef} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div ref={innerRef} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", transform: `scale(${scale})`, transformOrigin: "center" }}>
        {children}
      </div>
    </div>
  );
}

export const ToolShell = ({ config, infoSections, generateQuestion, generateUniqueQ: generateUniqueQProp, defaults = {}, stepRenderer, questionRenderer, answerRenderer, reformatQuestion, customPrintHandler }: ToolShellProps) => {
  const generateUniqueQ = generateUniqueQProp ?? makeUniqueQ(generateQuestion);
  const toolKeys = Object.keys(config.tools);

  // ── Shareable links: read the initial state from the URL (parsed once) ─────
  // ?tool=key&mode=example|worksheet&level=2&dd=value&vars=a,-b&ms=x,-y&n=20&cols=2&diff=1
  // Tokens in vars/ms set a key on; a "-" prefix sets it off. Invalid or stale
  // values fall back to defaults, so old bookmarks never break a tool.
  const [urlInit] = useState(() => {
    const p = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
    const toggles = (param: string | null): Record<string, boolean> => {
      const out: Record<string, boolean> = {};
      for (const tok of (param ?? "").split(",")) {
        const off = tok.startsWith("-");
        const key = off ? tok.slice(1) : tok;
        if (key) out[key] = !off;
      }
      return out;
    };
    const toolParam = p.get("tool");
    const modeMap: Record<string, "whiteboard" | "single" | "worksheet" | "builder"> = { whiteboard: "whiteboard", example: "single", worksheet: "worksheet", builder: "builder" };
    const levelMap: Record<string, DifficultyLevel> = { "1": "level1", "2": "level2", "3": "level3" };
    const levelParam = levelMap[p.get("level") ?? ""];
    const intParam = (key: string, min: number, max: number): number | null => {
      const n = parseInt(p.get(key) ?? "", 10);
      return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : null;
    };
    return {
      tool: toolParam && toolKeys.includes(toolParam) ? toolParam : toolKeys[0],
      mode: modeMap[p.get("mode") ?? ""] ?? "whiteboard",
      level: levelParam && !(defaults.comingSoonLevels ?? []).includes(levelParam) ? levelParam : "level1" as DifficultyLevel,
      vars: toggles(p.get("vars")),
      ms: toggles(p.get("ms")),
      dd: p.get("dd"),
      n: defaults.fixedQuestions ? null : intParam("n", 1, 24),
      cols: defaults.fixedColumns ? null : intParam("cols", 1, defaults.maxColumns ?? 4),
      diff: p.get("diff") === "1",
    };
  });

  // ── Worksheet builder persistence ─────────────────────────────────────────
  // The worksheet mode/layout and the differentiated per-level QO are NOT in the
  // URL (too large to encode), so they were lost on reload. Persist them to
  // sessionStorage (per tool route) so a refresh restores the setup. The advanced
  // builder's own group state lives inside <WorksheetBuilder> and is session-only.
  interface WBPersist {
    worksheetMode?: "standard" | "advanced";
    worksheetLayout?: "grid" | "list";
    worksheetBorders?: boolean;
    levelVariables?: Record<string, Record<string, boolean>>;
    levelDropdowns?: Record<string, string>;
    levelMultiSelect?: Record<string, Record<string, boolean>>;
  }
  const wbStorageKey = typeof window === "undefined" ? "" : `mt-wb:${window.location.pathname}`;
  const [wbInit] = useState<WBPersist | null>(() => {
    if (!wbStorageKey) return null;
    try { const raw = sessionStorage.getItem(wbStorageKey); return raw ? (JSON.parse(raw) as WBPersist) : null; }
    catch { return null; }
  });

  const [currentTool, setCurrentTool] = useState<string>(urlInit.tool);
  const [mode, setMode] = useState<"whiteboard" | "single" | "worksheet" | "builder">(urlInit.mode);
  // Worked Example is always available; only its step-by-step navigation (one
  // step at a time) is reserved for Developing mode.
  const devMode = useDevMode();
  const comingSoon = defaults.comingSoonLevels ?? [];
  const hideFontControls = defaults.hideFontControls ?? false;
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(urlInit.level);
  const setDifficultyGuarded = (v: DifficultyLevel) => { if (!comingSoon.includes(v)) setDifficulty(v); };

  const [toolVariables, setToolVariables] = useState<Record<string, Record<string, Record<string, boolean>>>>(() => {
    const init: Record<string, Record<string, Record<string, boolean>>> = {};
    toolKeys.forEach(k => {
      init[k] = {};
      (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
        init[k][lv] = {};
        const vars = config.tools[k].difficultySettings?.[lv]?.variables ?? config.tools[k].variables;
        vars.forEach(v => { init[k][lv][v.key] = v.defaultValue; });
      });
    });
    Object.entries(urlInit.vars).forEach(([k, v]) => {
      if (k in (init[urlInit.tool]?.[urlInit.level] ?? {})) init[urlInit.tool][urlInit.level][k] = v;
    });
    return init;
  });

  const [toolDropdowns, setToolDropdowns] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    toolKeys.forEach(k => {
      const t = config.tools[k];
      (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
        const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
        if (dd) init[`${k}__${lv}`] = dd.defaultValue;
      });
    });
    const t0 = config.tools[urlInit.tool];
    const dd0 = t0.difficultySettings?.[urlInit.level]?.dropdown ?? t0.dropdown;
    if (urlInit.dd && dd0?.options.some(o => o.value === urlInit.dd)) init[`${urlInit.tool}__${urlInit.level}`] = urlInit.dd;
    return init;
  });

  const [toolMultiSelect, setToolMultiSelect] = useState<Record<string, Record<string, boolean>>>(() => {
    const init: Record<string, Record<string, boolean>> = {};
    toolKeys.forEach(k => {
      init[k] = {};
      const t = config.tools[k];
      normalizeMultiSelect(t.multiSelect).forEach(ms => { ms.options.forEach(o => { init[k][o.value] = o.defaultActive; }); });
      (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
        normalizeMultiSelect(t.difficultySettings?.[lv]?.multiSelect).forEach(ms => {
          ms.options.forEach(o => { if (!(o.value in init[k])) init[k][o.value] = o.defaultActive; });
        });
      });
    });
    Object.entries(urlInit.ms).forEach(([k, v]) => {
      if (k in (init[urlInit.tool] ?? {})) init[urlInit.tool][k] = v;
    });
    return init;
  });

  const [levelVariables, setLevelVariables] = useState<Record<string, Record<string, boolean>>>(wbInit?.levelVariables ?? { level1: {}, level2: {}, level3: {} });
  const [levelDropdowns, setLevelDropdowns] = useState<Record<string, string>>(() => {
    if (wbInit?.levelDropdowns) return wbInit.levelDropdowns;
    const init: Record<string, string> = {};
    const firstTool = toolKeys[0];
    const t = config.tools[firstTool];
    (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
      const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
      if (dd) init[lv] = dd.defaultValue;
    });
    return init;
  });
  const [levelMultiSelect, setLevelMultiSelect] = useState<Record<string, Record<string, boolean>>>(wbInit?.levelMultiSelect ?? { level1: {}, level2: {}, level3: {} });

  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion>(() => {
    const t = config.tools[urlInit.tool];
    const ddCfg = t.difficultySettings?.[urlInit.level]?.dropdown ?? t.dropdown;
    const ddVal = urlInit.dd && ddCfg?.options.some(o => o.value === urlInit.dd) ? urlInit.dd : (ddCfg?.defaultValue ?? "");
    const vars: Record<string, boolean> = {};
    (t.difficultySettings?.[urlInit.level]?.variables ?? t.variables).forEach(v => { vars[v.key] = urlInit.vars[v.key] ?? v.defaultValue; });
    const ms: Record<string, boolean> = {};
    normalizeMultiSelect(t.multiSelect).forEach(g => g.options.forEach(o => { ms[o.value] = urlInit.ms[o.value] ?? o.defaultActive; }));
    (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
      normalizeMultiSelect(t.difficultySettings?.[lv]?.multiSelect).forEach(g => g.options.forEach(o => {
        if (!(o.value in ms)) ms[o.value] = urlInit.ms[o.value] ?? o.defaultActive;
      }));
    });
    return generateQuestion(urlInit.tool, urlInit.level, vars, ddVal, ms);
  });
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [steppedMode, setSteppedMode] = useState(true);
  const [workedStepIdx, setWorkedStepIdx] = useState(0);
  const [numQuestions, setNumQuestions] = useState(urlInit.n ?? defaults.numQuestions ?? 15);
  const [numColumns, setNumColumns] = useState(urlInit.cols ?? defaults.numColumns ?? 3);
  const [worksheet, setWorksheet] = useState<AnyQuestion[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>("both");
  const [isDifferentiated, setIsDifferentiated] = useState(urlInit.diff && comingSoon.length === 0);
  const [worksheetMode, setWorksheetMode] = useState<"standard" | "advanced">(wbInit?.worksheetMode ?? "standard");
  const [displayFontSize, setDisplayFontSize] = useState(defaults.displayFontSize ?? 2);
  const [worksheetFontSize, setWorksheetFontSize] = useState(defaults.worksheetFontSize ?? 1);
  const [colorScheme, setColorScheme] = useState("default");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const [worksheetLayout, setWorksheetLayout] = useState<"grid" | "list">(wbInit?.worksheetLayout ?? "grid");
  const [worksheetBorders, setWorksheetBorders] = useState(wbInit?.worksheetBorders ?? true);
  const [wsSettingsOpen, setWsSettingsOpen] = useState(false);

  const [presenterMode, setPresenterMode] = useState(false);
  const [wbFullscreen, setWbFullscreen] = useState(false);
  const [splitPct, setSplitPct] = useState(40);
  const [workingCollapsed, setWorkingCollapsed] = useState(defaults.collapseWorkingByDefault ?? false);
  const [camDevices, setCamDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentCamId, setCurrentCamId] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [camDropdownOpen, setCamDropdownOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const worksheetWrapRef = useRef<HTMLDivElement>(null);
  const camDropdownRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const isDraggingRef = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadKaTeX(); }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCam = useCallback(async (deviceId?: string) => {
    stopStream(); setCamError(null);
    try {
      let targetDeviceId = deviceId;
      if (!targetDeviceId) {
        const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tmp.getTracks().forEach(t => t.stop());
        const all = await navigator.mediaDevices.enumerateDevices();
        const builtInPattern = /facetime|built.?in|integrated|internal|front|rear/i;
        const ext = all.filter(d => d.kind === "videoinput").find(d => d.label && !builtInPattern.test(d.label));
        if (ext) targetDeviceId = ext.deviceId;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: targetDeviceId ? { deviceId: { exact: targetDeviceId } } : true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCurrentCamId(stream.getVideoTracks()[0].getSettings().deviceId ?? null);
      setCamDevices((await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "videoinput"));
    } catch (e: unknown) { setCamError((e instanceof Error ? e.message : null) ?? "Camera unavailable"); }
  }, [stopStream]);

  useEffect(() => { if (presenterMode) startCam(); else stopStream(); }, [presenterMode]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (presenterMode && streamRef.current && videoRef.current) videoRef.current.srcObject = streamRef.current; }, [wbFullscreen, workingCollapsed]);
  useEffect(() => {
    if (!camDropdownOpen) return;
    const h = (e: MouseEvent) => { if (camDropdownRef.current && !camDropdownRef.current.contains(e.target as Node)) setCamDropdownOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [camDropdownOpen]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setPresenterMode(false); setWbFullscreen(false); } };
    document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h);
  }, []);

  const qBg = getQuestionBg(colorScheme);
  const stepBg = getStepBg(colorScheme);
  const isDefaultScheme = colorScheme === "default";
  const fsToolbarBg = isDefaultScheme ? "#ffffff" : stepBg;
  const fsQuestionBg = isDefaultScheme ? "#ffffff" : qBg;
  const fsWorkingBg  = isDefaultScheme ? "#f5f3f0" : qBg;

  const getToolSettings = () => config.tools[currentTool];
  const getDropdownConfig = () => getToolSettings().difficultySettings?.[difficulty]?.dropdown ?? getToolSettings().dropdown;
  const getVariablesConfig = () => getToolSettings().difficultySettings?.[difficulty]?.variables ?? getToolSettings().variables;
  const getMultiSelectConfig = () => normalizeMultiSelect(getToolSettings().difficultySettings?.[difficulty]?.multiSelect ?? getToolSettings().multiSelect);
  const getDropdownValue = () => toolDropdowns[`${currentTool}__${difficulty}`] ?? getDropdownConfig()?.defaultValue ?? "";
  const setDropdownValue = (v: string) => setToolDropdowns(p => ({ ...p, [`${currentTool}__${difficulty}`]: v }));
  const getVariableValues = () => toolVariables[currentTool]?.[difficulty] ?? {};
  const setVariableValue = (k: string, v: boolean) => setToolVariables(p => ({
    ...p, [currentTool]: { ...(p[currentTool] ?? {}), [difficulty]: { ...(p[currentTool]?.[difficulty] ?? {}), [k]: v } },
  }));
  const setMultiSelectValue = (k: string, v: boolean) => setToolMultiSelect(p => ({ ...p, [currentTool]: { ...(p[currentTool] ?? {}), [k]: v } }));
  const handleLevelVarChange = (lv: string, k: string, v: boolean) => setLevelVariables(p => ({ ...p, [lv]: { ...p[lv], [k]: v } }));
  const handleLevelDDChange  = (lv: string, v: string) => setLevelDropdowns(p => ({ ...p, [lv]: v }));
  const handleLevelMSChange  = (lv: string, k: string, v: boolean) => setLevelMultiSelect(p => ({ ...p, [lv]: { ...(p[lv] ?? {}), [k]: v } }));
  const getInstruction = (tool = currentTool) => config.tools[tool]?.instruction ?? "";
  const getQOSnapshot = (): QOSnapshot => ({
    level: difficulty,
    variables: getVariableValues(),
    dropdownValue: getDropdownValue(),
    multiSelectValues: toolMultiSelect[currentTool] ?? {},
  });

  const makeQuestion = (): AnyQuestion =>
    generateQuestion(currentTool, difficulty, getVariableValues(), getDropdownValue(), toolMultiSelect[currentTool] ?? {});

  const handleNewQuestion = () => {
    setCurrentQuestion(makeQuestion());
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
    setWorkedStepIdx(0);
  };

  const stampQO = (q: AnyQuestion, snap: QOSnapshot): AnyQuestion => ({ ...q, _qo: snap } as AnyQuestion);

  const handleGenerateWorksheet = () => {
    const usedKeys = new Set<string>();
    const questions: AnyQuestion[] = [];
    if (isDifferentiated) {
      (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
        const t = getToolSettings();
        const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
        const vars = levelVariables[lv] ?? {};
        const ddVal = levelDropdowns[lv] ?? (dd?.defaultValue ?? "");
        const msVals = levelMultiSelect[lv] ?? {};
        const snap: QOSnapshot = { level: lv, variables: vars, dropdownValue: ddVal, multiSelectValues: msVals };
        for (let i = 0; i < numQuestions; i++)
          questions.push(stampQO(generateUniqueQ(currentTool, lv, vars, ddVal, usedKeys, msVals), snap));
      });
    } else {
      const snap: QOSnapshot = { level: difficulty, variables: getVariableValues(), dropdownValue: getDropdownValue(), multiSelectValues: toolMultiSelect[currentTool] ?? {} };
      for (let i = 0; i < numQuestions; i++)
        questions.push(stampQO(generateUniqueQ(currentTool, difficulty, getVariableValues(), getDropdownValue(), usedKeys, toolMultiSelect[currentTool] ?? {}), snap));
    }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };


  const regenQuestion = (idx: number) => {
    const q = worksheet[idx];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snap = (q as any)._qo as QOSnapshot | undefined;
    if (!snap) return;
    const existing = new Set(worksheet.map(w => w.key));
    existing.delete(q.key);
    let replacement: AnyQuestion | null = null;
    for (let attempt = 0; attempt < 100; attempt++) {
      const candidate = generateQuestion(currentTool, snap.level, snap.variables, snap.dropdownValue, snap.multiSelectValues);
      if (!existing.has(candidate.key)) { replacement = stampQO(candidate, snap); break; }
    }
    if (!replacement) return;
    setWorksheet(prev => prev.map((w, i) => i === idx ? replacement! : w));
  };

  const stdQOProps = {
    variables: getVariablesConfig() ?? [],
    variableValues: getVariableValues(),
    onVariableChange: setVariableValue,
    dropdown: getDropdownConfig() ?? null,
    dropdownValue: getDropdownValue(),
    onDropdownChange: setDropdownValue,
    multiSelect: getMultiSelectConfig(),
    multiSelectValues: toolMultiSelect[currentTool] ?? {},
    onMultiSelectChange: setMultiSelectValue,
  };

  const diffQOProps = {
    toolSettings: getToolSettings(),
    levelVariables,
    onLevelVariableChange: handleLevelVarChange,
    levelDropdowns,
    onLevelDropdownChange: handleLevelDDChange,
    levelMultiSelect,
    onLevelMultiSelectChange: handleLevelMSChange,
  };

  const qoEl = (isDiff = false) => isDiff
    ? <DiffQOPopover {...diffQOProps} />
    : <StandardQOPopover {...stdQOProps} />;

  const qoFingerprint = [
    getDropdownValue(),
    JSON.stringify(getVariableValues()),
    JSON.stringify(toolMultiSelect[currentTool] ?? {}),
  ].join("|");

  // Track the last difficulty/tool the current question was generated for, so we
  // can tell a level/sub-tool switch apart from a plain QO-option change.
  const prevDiffRef = useRef(difficulty);
  const prevToolRef = useRef(currentTool);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const levelOrToolChanged = prevDiffRef.current !== difficulty || prevToolRef.current !== currentTool;
    prevDiffRef.current = difficulty;
    prevToolRef.current = currentTool;
    if (mode === "worksheet") return;
    // reformatQuestion only applies to pure QO-option changes (same maths, new
    // display). A level or sub-tool switch must always yield a fresh question.
    if (!levelOrToolChanged && reformatQuestion) {
      const snap = getQOSnapshot();
      const reformatted = reformatQuestion(currentQuestion, snap);
      if (reformatted !== null) { setCurrentQuestion(reformatted); setShowAnswer(false); setWorkedStepIdx(0); return; }
    }
    handleNewQuestion();
  }, [difficulty, currentTool, qoFingerprint]);

  // ── Shareable links: keep the URL in sync with the current setup ───────────
  // Only non-default values are written, so a freshly opened tool keeps a clean
  // URL. replaceState (not pushState) — Back still leaves the tool in one step.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const p = new URLSearchParams();
    if (currentTool !== toolKeys[0]) p.set("tool", currentTool);
    if (mode !== "whiteboard") p.set("mode", mode === "single" ? "example" : mode === "builder" ? "builder" : "worksheet");
    if (difficulty !== "level1") p.set("level", difficulty.slice(-1));
    const t = config.tools[currentTool];
    const ddCfg = t.difficultySettings?.[difficulty]?.dropdown ?? t.dropdown;
    const ddVal = toolDropdowns[`${currentTool}__${difficulty}`];
    if (ddCfg && ddVal && ddVal !== ddCfg.defaultValue) p.set("dd", ddVal);
    const varTokens: string[] = [];
    (t.difficultySettings?.[difficulty]?.variables ?? t.variables).forEach(v => {
      const cur = toolVariables[currentTool]?.[difficulty]?.[v.key];
      if (cur !== undefined && cur !== v.defaultValue) varTokens.push(cur ? v.key : `-${v.key}`);
    });
    if (varTokens.length) p.set("vars", varTokens.join(","));
    const msTokens: string[] = [];
    const seenMS = new Set<string>();
    const msGroups = [
      ...normalizeMultiSelect(t.multiSelect),
      ...(["level1", "level2", "level3"] as DifficultyLevel[]).flatMap(lv => normalizeMultiSelect(t.difficultySettings?.[lv]?.multiSelect)),
    ];
    msGroups.forEach(g => g.options.forEach(o => {
      if (seenMS.has(o.value)) return;
      seenMS.add(o.value);
      const cur = toolMultiSelect[currentTool]?.[o.value];
      if (cur !== undefined && cur !== o.defaultActive) msTokens.push(cur ? o.value : `-${o.value}`);
    }));
    if (msTokens.length) p.set("ms", msTokens.join(","));
    if (mode === "worksheet") {
      if (numQuestions !== (defaults.numQuestions ?? 15)) p.set("n", String(numQuestions));
      if (!isDifferentiated && numColumns !== (defaults.numColumns ?? 3)) p.set("cols", String(numColumns));
      if (isDifferentiated) p.set("diff", "1");
    }
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [currentTool, mode, difficulty, toolDropdowns, toolVariables, toolMultiSelect, numQuestions, numColumns, isDifferentiated]);

  // Persist the worksheet mode/layout and differentiated per-level QO so a refresh
  // restores it — these are not encoded in the URL.
  useEffect(() => {
    if (!wbStorageKey) return;
    try {
      sessionStorage.setItem(wbStorageKey, JSON.stringify({
        worksheetMode, worksheetLayout, worksheetBorders,
        levelVariables, levelDropdowns, levelMultiSelect,
      } satisfies WBPersist));
    } catch { /* ignore quota / serialisation errors */ }
  }, [wbStorageKey, worksheetMode, worksheetLayout, worksheetBorders, levelVariables, levelDropdowns, levelMultiSelect]);

  // A link that points straight at a worksheet generates it on arrival —
  // a bookmarked worksheet link is ready to teach from without extra clicks.
  // The advanced builder generates on demand from its own Generate button.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (urlInit.mode !== "worksheet") return;
    if (worksheetMode !== "advanced") handleGenerateWorksheet();
  }, []);

  const displayFontSizes = ["text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl"];
  const canDisplayIncrease = displayFontSize < displayFontSizes.length - 1;
  const canDisplayDecrease = displayFontSize > 0;

  const fontSizes = ["text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl"];
  const canIncrease = worksheetFontSize < fontSizes.length - 1;
  const canDecrease = worksheetFontSize > 0;

  const renderQCell = (q: AnyQuestion, idx: number, bgOverride?: string) => {
    const bg = bgOverride ?? stepBg;
    const fsz = fontSizes[worksheetFontSize];
    const borders = worksheetBorders || !!bgOverride;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const suppressInstruction = !!(q as any)._sectionHeader;
    const cellStyle = borders
      ? { backgroundColor: bg, height: "100%", boxSizing: "border-box" as const, position: "relative" as const, borderRadius: "12px", border: "1px solid #e5e7eb" }
      : { height: "100%", boxSizing: "border-box" as const, position: "relative" as const };
    const numEl = <span className="text-xs font-bold text-gray-400" style={{ position: "absolute", top: 4, left: 6 }}>{idx + 1}</span>;
    const wrapperClass = borders ? "rounded-xl p-4 shadow group" : "p-4 group";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const regenBtn = (q as any)._qo ? (
      <button onClick={() => regenQuestion(idx)} title="Regenerate this question"
        className="absolute top-1 right-1 w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
        style={{ zIndex: 10 }}>
        <RefreshCw size={12} />
      </button>
    ) : null;

    // If a custom questionRenderer is provided, use it for all question kinds
    if (questionRenderer) {
      return (
        <div className={wrapperClass} style={cellStyle}>
          {numEl}{regenBtn}
          {questionRenderer(q, false, colorScheme, true, idx, getQOSnapshot(), fontSizes[worksheetFontSize])}
          {showWorksheetAnswers && answerRenderer && (
            <div style={{ marginTop: 4 }}>{answerRenderer(q, colorScheme, getQOSnapshot())}</div>
          )}
          {showWorksheetAnswers && !answerRenderer && (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <div className={`${fsz} font-semibold mt-1 text-center`} style={{ color: "#059669" }}>{ansEq((q as any).answer)}</div>
          )}
        </div>
      );
    }

    if (q.kind === "simple") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyQ = q as any;
      const instrFsz = fontSizes[Math.max(0, worksheetFontSize - 1)];
      return (
        <div className={wrapperClass} style={cellStyle}>
          {numEl}{regenBtn}
          {!suppressInstruction && getInstruction() && <div className={`${instrFsz} font-semibold text-center w-full mb-1`} style={{ color: "#000", paddingTop: "0.15em" }}>{getInstruction()}</div>}
          <div className={`${fsz} font-semibold text-center w-full`} style={{ color: "#000" }}>
            {anyQ.displayLatex ? <MathRenderer latex={anyQ.displayLatex} /> : anyQ.display}
          </div>
          {showWorksheetAnswers && (
            <div className={`${fsz} font-semibold mt-1 text-center`} style={{ color: "#059669" }}>
              {anyQ.answerLatex ? <MathRenderer latex={ansEq(anyQ.answerLatex)} /> : <span>{ansEq(anyQ.answer)}</span>}
            </div>
          )}
        </div>
      );
    }
    if ("lines" in q) {
      const instrFsz = fontSizes[Math.max(0, worksheetFontSize - 1)];
      return (
        <div className={wrapperClass} style={cellStyle}>
          {numEl}{regenBtn}
          {!suppressInstruction && getInstruction() && <div className={`${instrFsz} font-semibold text-center w-full mb-1`} style={{ color: "#000" }}>{getInstruction()}</div>}
          <div className={`${fsz} font-semibold w-full text-center`} style={{ color: "#000", lineHeight: 1.6 }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(q as any).lines.map((line: string, i: number) => <div key={i}><InlineMath text={line} /></div>)}
          </div>
          {showWorksheetAnswers && (
            <div className={`${fsz} font-semibold mt-1 text-center`} style={{ color: "#059669" }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(q as any).answerLatex ? <MathRenderer latex={ansEq((q as any).answerLatex)} /> : <span>{ansEq((q as any).answer)}</span>}
            </div>
          )}
        </div>
      );
    }
    // "frac" kind
    const instrFsz = fontSizes[Math.max(0, worksheetFontSize - 1)];
    return (
      <div className={wrapperClass} style={cellStyle}>
        {numEl}{regenBtn}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {!suppressInstruction && getInstruction() && <div className={`${instrFsz} font-semibold text-center w-full mb-1`} style={{ color: "#000" }}>{getInstruction()}</div>}
        <div className={`${fsz} font-semibold text-center w-full`} style={{ color: "#000" }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <span>Find </span><MathRenderer latex={(q as any).latex?.replace(/\\text\{ of \}.*/, '') ?? ''} /><span> of {(q as any).latex?.replace(/.*\\text\{ of \}/, '').trim()}</span>
        </div>
        {showWorksheetAnswers && (
          <div className={`${fsz} font-semibold mt-1 text-center`} style={{ color: "#059669" }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <MathRenderer latex={ansEq((q as any).answerLatex)} />
          </div>
        )}
      </div>
    );
  };

  const advancedToggle = (
    <label className="flex items-center gap-2 cursor-pointer">
      <div onClick={() => setWorksheetMode(worksheetMode === "advanced" ? "standard" : "advanced")}
        className={`w-11 h-6 rounded-full transition-colors relative ${worksheetMode === "advanced" ? "bg-blue-900" : "bg-gray-300"}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${worksheetMode === "advanced" ? "translate-x-6" : "translate-x-1"}`} />
      </div>
      <span className="text-sm font-bold text-gray-500">Advanced</span>
    </label>
  );

  const renderControlBar = () => {
    if (mode === "worksheet") {
      // Standard mode only — advanced mode renders via the WorksheetBuilder header slot.
      const bordersDisabled = worksheetLayout !== "grid";
      return (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 mb-6">
          <div className="px-6 py-4 border-b-2 border-gray-200">
            {advancedToggle}
          </div>
          <div className="p-6">
            {/* Row 1: levels · QO · differentiated */}
            <div className="flex justify-center items-center gap-6 mb-5">
              <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
                {(["level1", "level2", "level3"] as DifficultyLevel[]).map((val, i) => {
                  const [label, col] = [["Level 1", "bg-green-600"], ["Level 2", "bg-yellow-500"], ["Level 3", "bg-red-600"]][i] as [string, string];
                  const isLvDisabled = comingSoon.includes(val);
                  return (
                    <button key={val} onClick={() => { setDifficultyGuarded(val); setIsDifferentiated(false); }}
                      className={`px-5 py-2 font-bold text-base transition-colors ${isLvDisabled ? "bg-gray-100 text-gray-300 cursor-not-allowed" : !isDifferentiated && difficulty === val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
              {qoEl(isDifferentiated)}
              {(() => { const diffDisabled = comingSoon.length > 0; return (
              <button onClick={() => { if (!diffDisabled) setIsDifferentiated(!isDifferentiated); }}
                className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${diffDisabled ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed" : isDifferentiated ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>
                Differentiated
              </button>
              ); })()}
            </div>

            {/* Row 2: questions · columns · settings */}
            <div className="flex justify-center items-center gap-6 mb-5 flex-wrap">
              {!defaults.fixedQuestions && (
                <div className="flex items-center gap-3">
                  <label className="text-base font-semibold text-gray-700">Questions:</label>
                  <input type="number" min="1" max="24" value={numQuestions}
                    onChange={e => setNumQuestions(Math.max(1, Math.min(24, parseInt(e.target.value) || (defaults.numQuestions ?? 15))))}
                    className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center" />
                </div>
              )}
              {!defaults.fixedColumns && (
                <div className="flex items-center gap-3">
                  <label className="text-base font-semibold text-gray-700">Columns:</label>
                  <input type="number" min="1" max={defaults.maxColumns ?? 4} value={isDifferentiated ? 3 : numColumns}
                    onChange={e => { if (!isDifferentiated) setNumColumns(Math.max(1, Math.min(defaults.maxColumns ?? 4, parseInt(e.target.value) || (defaults.numColumns ?? 3)))); }}
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
                    <div className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border-2 border-gray-200 p-4" style={{ minWidth: 220 }}>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Layout</div>
                      <div className="flex rounded-lg border-2 border-gray-300 overflow-hidden mb-4">
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
                    </div>
                  </>
                )}
                </div>
              </div>
            </div>

            {/* Row 3: actions — generate · answers · print */}
            <div className="flex justify-center items-center gap-4 flex-wrap">
              <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
                <RefreshCw size={18} /> Generate
              </button>
              {worksheet.length > 0 && (
                <>
                  <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
                    <Eye size={18} /> {showWorksheetAnswers ? "Hide Answers" : "Show Answers"}
                  </button>
                  <PrintSplitButton
                    onPrint={m => customPrintHandler
                      ? customPrintHandler(worksheet, m, worksheetWrapRef.current, {
                          toolName: config.tools[currentTool].name, difficulty, isDifferentiated,
                          numColumns, instruction: getInstruction(), layout: worksheetLayout, showBorders: worksheetBorders,
                        })
                      : handlePrint(worksheet, config.tools[currentTool].name, difficulty, isDifferentiated, numColumns, getInstruction(), m, worksheetLayout, worksheetBorders)}
                    printMode={printMode} setPrintMode={setPrintMode}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="px-5 py-4 rounded-xl" style={{ backgroundColor: qBg }}>
        <div className="flex items-center justify-between gap-4">
          <DifficultyToggle value={difficulty} onChange={v => setDifficultyGuarded(v as DifficultyLevel)} disabledLevels={comingSoon} />
          {qoEl()}
          <div className="flex gap-3 items-center">
            <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <RefreshCw size={18} /> New Question
            </button>
            <button onClick={() => mode === "whiteboard" ? setShowWhiteboardAnswer(!showWhiteboardAnswer) : setShowAnswer(!showAnswer)}
              className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18} /> {(mode === "whiteboard" ? showWhiteboardAnswer : showAnswer) ? "Hide Answer" : "Show Answer"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWhiteboard = () => {
    const fsToolbar = (
      <div style={{ background: fsToolbarBg, borderBottom: "2px solid #000", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexShrink: 0, zIndex: 210 }}>
        <DifficultyToggle value={difficulty} onChange={v => setDifficultyGuarded(v as DifficultyLevel)} disabledLevels={comingSoon} />
        {qoEl()}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
          <button onClick={() => setShowWhiteboardAnswer(a => !a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWhiteboardAnswer ? "Hide Answer" : "Show Answer"}</button>
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
    const qBoxControls = (
      (!hideFontControls || workingCollapsed) && <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 20 }}>
        {!hideFontControls && <>
          <button style={fontBtnStyle(canDisplayDecrease)} onClick={() => canDisplayDecrease && setDisplayFontSize(f => f - 1)}><ChevronDown size={16} color="#6b7280" /></button>
          <button style={fontBtnStyle(canDisplayIncrease)} onClick={() => canDisplayIncrease && setDisplayFontSize(f => f + 1)}><ChevronUp size={16} color="#6b7280" /></button>
        </>}
        {workingCollapsed && expandBtn}
      </div>
    );
    const fit = (content: ReactNode) => workingCollapsed ? <ScaleToFit>{content}</ScaleToFit> : content;

    const questionBox = () => (
      <div className="rounded-xl flex items-center justify-center p-8" style={{ position: "relative", width: workingCollapsed ? "auto" : "480px", flex: workingCollapsed ? "1 1 auto" : "0 0 auto", height: "100%", backgroundColor: stepBg }}>
        {qBoxControls}
        {fit(
          <div className="w-full text-center flex flex-col gap-4 items-center">
            {getInstruction() && !questionRenderer && <div className={`${["text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl"][displayFontSize]} font-semibold`} style={{ color: "#000" }}>{getInstruction()}</div>}
            {questionRenderer
              ? questionRenderer(currentQuestion, showWhiteboardAnswer, colorScheme, undefined, undefined, getQOSnapshot(), displayFontSizes[displayFontSize])
              : <>
                  <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]} />
                  {showWhiteboardAnswer && <div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>
                    {answerRenderer ? answerRenderer(currentQuestion, colorScheme, getQOSnapshot()) : <AnswerDisplay q={currentQuestion} />}
                  </div>}
                </>
            }
          </div>
        )}
      </div>
    );

    const questionBoxFS = () => (
      <div style={{ position: "relative", width: workingCollapsed ? "100%" : `${splitPct}%`, height: "100%", backgroundColor: fsQuestionBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, boxSizing: "border-box", flexShrink: 0, overflowY: "auto", gap: 16 }}>
        {qBoxControls}
        {fit(
          <>
            {getInstruction() && !questionRenderer && <div className={`${["text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl"][displayFontSize]} font-semibold`} style={{ color: "#000" }}>{getInstruction()}</div>}
            {questionRenderer
              ? questionRenderer(currentQuestion, showWhiteboardAnswer, colorScheme, false, undefined, getQOSnapshot(), displayFontSizes[displayFontSize])
              : <>
                  <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]} />
                  {showWhiteboardAnswer && <div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>
                    {answerRenderer ? answerRenderer(currentQuestion, colorScheme, getQOSnapshot()) : <AnswerDisplay q={currentQuestion} />}
                  </div>}
                </>
            }
          </>
        )}
      </div>
    );

    const makeRightPanel = (isFS: boolean) => (
      <div style={{ flex: 1, height: "100%", position: "relative", overflow: "hidden", backgroundColor: presenterMode ? "#000" : (isFS ? fsWorkingBg : stepBg), borderRadius: isFS ? 0 : undefined }} className={isFS ? "" : "flex-1 rounded-xl"}>
        {presenterMode && (
          <>
            <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            {camError && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", padding: "2rem", textAlign: "center", zIndex: 1 }}>{camError}</div>}
          </>
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
  };

  const renderWorkedExample = () => {
    const totalSteps = currentQuestion.working.length;
    const atAnswer = workedStepIdx >= totalSteps;
    const canPrev = workedStepIdx > 0;
    const canNext = workedStepIdx <= totalSteps;
    // Step-by-step (one step at a time, < > arrows) is a Developing-mode feature.
    // General use shows the full worked solution at once.
    const stepped = devMode && steppedMode;

    const renderStep = (s: WorkingStep, i: number) => {
      const custom = stepRenderer ? stepRenderer(s, colorScheme, getQOSnapshot()) : null;
      return (
        <div key={i} className="rounded-xl p-6" style={{ backgroundColor: stepBg }}>
          <h4 className="text-xl font-bold mb-2" style={{ color: "#000" }}>Step {i + 1}</h4>
          <div className="text-2xl" style={{ color: "#000" }}>
            {custom ?? (s.type === "tStep"
              ? <span>{s.plain}</span>
              : s.type === "mStep"
                ? <div className="flex flex-col gap-1">
                    <span className="text-left">{s.label}</span>
                    <div className="text-center"><MathRenderer latex={s.latex} />{s.unit && <span> {s.unit}</span>}</div>
                  </div>
                : <div className="text-center"><MathRenderer latex={s.latex} /></div>
            )}
          </div>
        </div>
      );
    };

    const navArrowStyle = (enabled: boolean): React.CSSProperties => ({
      background: enabled ? "#1e3a8a" : "rgba(0,0,0,0.08)",
      color: enabled ? "#fff" : "#9ca3af",
      border: "none", borderRadius: 12, cursor: enabled ? "pointer" : "not-allowed",
      width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
      opacity: enabled ? 1 : 0.4, transition: "background 0.15s",
    });

    const steppedToggle = (
      <button onClick={() => { setSteppedMode(m => !m); setWorkedStepIdx(0); }}
        className="px-4 py-1.5 rounded-lg font-bold text-sm transition-colors border-2"
        style={{
          background: steppedMode ? "#1e3a8a" : "#fff",
          color: steppedMode ? "#fff" : "#6b7280",
          borderColor: steppedMode ? "#1e3a8a" : "#d1d5db",
        }}>
        {steppedMode ? "Step-by-Step" : "Show All"}
      </button>
    );

    return (
      <div className="overflow-y-auto" style={{ maxHeight: "120vh" }}>
        <div className="p-8 w-full" style={{ backgroundColor: qBg }}>
          <div className="text-center py-4 relative">
            {!hideFontControls && <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 6 }}>
              <button style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: canDisplayDecrease ? "pointer" : "not-allowed", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", opacity: canDisplayDecrease ? 1 : 0.35 }} onClick={() => canDisplayDecrease && setDisplayFontSize(f => f - 1)}><ChevronDown size={16} color="#6b7280" /></button>
              <button style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: canDisplayIncrease ? "pointer" : "not-allowed", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", opacity: canDisplayIncrease ? 1 : 0.35 }} onClick={() => canDisplayIncrease && setDisplayFontSize(f => f + 1)}><ChevronUp size={16} color="#6b7280" /></button>
            </div>}
            {getInstruction() && !questionRenderer && <div className={`${["text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl"][displayFontSize]} font-semibold mb-2`} style={{ color: "#000" }}>{getInstruction()}</div>}
            {questionRenderer
              ? questionRenderer(currentQuestion, showAnswer, colorScheme, false, undefined, getQOSnapshot(), displayFontSizes[displayFontSize])
              : <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]} />
            }
          </div>
          {showAnswer && (
            <>
              {stepped ? (
                <>
                  <div className="flex items-center justify-between mt-6 mb-4">
                    <button style={navArrowStyle(canPrev)} onClick={() => canPrev && setWorkedStepIdx(i => i - 1)}>
                      <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-500">
                        {atAnswer ? "Answer" : `Step ${workedStepIdx + 1} of ${totalSteps}`}
                      </span>
                      {steppedToggle}
                    </div>
                    <button style={navArrowStyle(canNext && !atAnswer)} onClick={() => canNext && !atAnswer && setWorkedStepIdx(i => i + 1)}>
                      <ChevronRight size={24} />
                    </button>
                  </div>
                  {!atAnswer ? (
                    <div className="space-y-4">
                      {renderStep(currentQuestion.working[workedStepIdx], workedStepIdx)}
                    </div>
                  ) : (
                    <div className="rounded-xl p-6 text-center" style={{ backgroundColor: stepBg }}>
                      <span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>
                        {answerRenderer ? answerRenderer(currentQuestion, colorScheme, getQOSnapshot()) : <AnswerDisplay q={currentQuestion} />}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: totalSteps + 1 }, (_, i) => (
                      <button key={i} onClick={() => setWorkedStepIdx(i)}
                        style={{
                          width: i === totalSteps ? 24 : 10, height: 10, borderRadius: 5, border: "none", cursor: "pointer",
                          background: i === workedStepIdx ? "#1e3a8a" : "#d1d5db", transition: "background 0.15s",
                        }}
                        title={i === totalSteps ? "Answer" : `Step ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {devMode && (
                    <div className="flex justify-end mt-6 mb-4">
                      {steppedToggle}
                    </div>
                  )}
                  <div className="space-y-4">
                    {currentQuestion.working.map((s, i) => renderStep(s, i))}
                  </div>
                  <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: stepBg }}>
                    <span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>
                      {answerRenderer ? answerRenderer(currentQuestion, colorScheme, getQOSnapshot()) : <AnswerDisplay q={currentQuestion} />}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderWorksheet = () => {
    if (worksheet.length === 0) return (
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: qBg }}>
        <span className="text-2xl text-gray-400">Generate worksheet</span>
      </div>
    );
    const fontSizeControls = hideFontControls ? null : (
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button disabled={!canDecrease} onClick={() => canDecrease && setWorksheetFontSize(f => f - 1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canDecrease ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronDown size={20} /></button>
        <button disabled={!canIncrease} onClick={() => canIncrease && setWorksheetFontSize(f => f + 1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canIncrease ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronUp size={20} /></button>
      </div>
    );
    const toolTitle = config.tools[currentTool].name;
    if (isDifferentiated) return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: qBg }}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4" style={{ alignItems: "start" }}>
          {(["level1", "level2", "level3"] as DifficultyLevel[]).map((lv, li) => {
            const lqs = worksheet.filter(q => q.difficulty === lv);
            const c = LV_COLORS[lv];
            return (
              <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}>
                <h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>Level {li + 1}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gridAutoRows: "1fr", gap: "0.75rem" }}>
                  {lqs.map((q, idx) => <div key={idx} style={{ minHeight: 0 }}>{renderQCell(q, idx, c.fill)}</div>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
    if (worksheetLayout === "list") {
      const renderListItem = (q: AnyQuestion, idx: number) => {
        const fsz = fontSizes[worksheetFontSize];
        return (
          <div key={idx}>
            <div className="group flex items-baseline gap-2 py-1.5" style={{ breakInside: "avoid", position: "relative" }}>
              <span className="text-xs font-bold text-gray-400 flex-shrink-0" style={{ minWidth: "1.5rem" }}>{idx + 1})</span>
              <div className={`${fsz} font-semibold flex-1`} style={{ color: "#000" }}>
                {getInstruction() && <span className={`${fontSizes[Math.max(0, worksheetFontSize - 1)]} font-semibold mr-1`}>{getInstruction()}</span>}
                {questionRenderer
                  ? questionRenderer(q, false, colorScheme, true, idx, getQOSnapshot(), fsz)
                  : q.kind === "simple"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? ((q as any).displayLatex ? <MathRenderer latex={(q as any).displayLatex} /> : <span>{(q as any).display}</span>)
                    : "lines" in q
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      ? (q as any).lines.map((line: string, i: number) => <span key={i}><InlineMath text={line} />{i < (q as any).lines.length - 1 ? " " : ""}</span>)
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      : <MathRenderer latex={(q as any).latex ?? ""} />
                }
              </div>
              {showWorksheetAnswers && (
                <span className={`${fsz} font-semibold flex-shrink-0`} style={{ color: "#059669" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(q as any).answerLatex ? <MathRenderer latex={ansEq((q as any).answerLatex)} /> : <span>{ansEq((q as any).answer)}</span>}
                </span>
              )}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(q as any)._qo && (
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
        <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: qBg }}>
          {fontSizeControls}
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${numColumns}, 1fr)`, columnGap: "1.5rem" }}>
            {worksheet.map((q, idx) => renderListItem(q, idx))}
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: qBg }}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${numColumns},1fr)`, gap: "1rem" }}>
          {worksheet.map((q, idx) => <div key={idx}>{renderQCell(q, idx)}</div>)}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} /><span className="font-semibold text-lg">Home</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => { setMode(mode === "builder" ? "whiteboard" : "builder"); setPresenterMode(false); setWbFullscreen(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${mode === "builder" ? "bg-white text-blue-900" : "text-white hover:bg-blue-800"}`}>
              <LayoutGrid size={18} /><span>Builder</span>
            </button>
            <div className="relative">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
              {isMenuOpen && <MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={() => setIsMenuOpen(false)} onOpenInfo={() => setIsInfoOpen(true)} />}
            </div>
          </div>
        </div>
      </div>
      {isInfoOpen && <InfoModal infoSections={infoSections} onClose={() => setIsInfoOpen(false)} />}
      <div className="min-h-screen p-8" style={{ backgroundColor: "#f5f3f0" }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: "#000" }}>{config.pageTitle}</h1>
          <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>
          {toolKeys.length > 1 && mode !== "builder" && (
            <>
              <div className="flex justify-center gap-4 mb-6">
                {toolKeys.map(k => (
                  <button key={k} onClick={() => { setCurrentTool(k); }}
                    className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${currentTool === k ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                    {config.tools[k].name}
                  </button>
                ))}
              </div>
              <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>
            </>
          )}
          {mode !== "builder" && (
            <div className="flex justify-center gap-4 mb-8">
              {(["whiteboard", "single", "worksheet"] as const)
                .map(m => {
                  const label = m === "whiteboard" ? "Whiteboard" : m === "single" ? "Worked Example" : "Worksheet";
                  return (
                    <button key={m} onClick={() => { setMode(m); setPresenterMode(false); setWbFullscreen(false); }}
                      className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode === m ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                      {label}
                    </button>
                  );
                })}
            </div>
          )}

          {mode === "builder" && (
            <WorksheetBuilder
              config={config}
              generateQuestion={generateQuestion}
              questionRenderer={questionRenderer}
              customPrintHandler={customPrintHandler}
              comingSoonLevels={comingSoon}
              hideFontControls={hideFontControls}
              classic={!devMode}
            />
          )}
          {mode === "worksheet" && (
            worksheetMode === "advanced"
              ? <WorksheetBuilder
                  config={config}
                  generateQuestion={generateQuestion}
                  questionRenderer={questionRenderer}
                  customPrintHandler={customPrintHandler}
                  comingSoonLevels={comingSoon}
                  hideFontControls={hideFontControls}
                  lockedTool={currentTool}
                  headerSlot={advancedToggle}
                  classic={!devMode}
                />
              : <>
                  {renderControlBar()}
                  <div ref={worksheetWrapRef}>{renderWorksheet()}</div>
                </>
          )}
          {mode !== "worksheet" && mode !== "builder" && (
            <div className="flex flex-col gap-6">
              <div className="rounded-xl shadow-lg">
                {renderControlBar()}
              </div>
              <div className="rounded-xl shadow-lg overflow-hidden">
                {mode === "whiteboard" && renderWhiteboard()}
                {mode === "single" && renderWorkedExample()}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
