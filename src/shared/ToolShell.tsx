import { useState, useEffect, useLayoutEffect, useRef, useCallback, type ReactNode } from "react";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, PanelRightClose, PanelRightOpen } from "lucide-react";
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
  InlineQOPanel,
} from "./components/QOPopovers";
import { InfoModal } from "./components/InfoModal";
import { MenuDropdown } from "./components/MenuDropdown";
import { PrintSplitButton } from "./components/PrintSplitButton";
import { handlePrint } from "./print";
import { WorksheetBuilder } from "./WorksheetBuilder";

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
  /** Custom print handler for diagram tools. Receives the worksheet array, print mode, and the worksheet container DOM element (for SVG extraction). */
  customPrintHandler?: (questions: AnyQuestion[], printMode: PrintMode, worksheetEl: HTMLElement | null) => void;
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
        if (!outerRef.current || !innerRef.current) return;
        const availW = outerRef.current.clientWidth, availH = outerRef.current.clientHeight;
        // Measure the diagram's real painted size; divide out the current scale.
        const target = (innerRef.current.querySelector("svg") as SVGElement | null) ?? innerRef.current;
        const rect = target.getBoundingClientRect();
        const cur = scaleRef.current || 1;
        const natW = rect.width / cur, natH = rect.height / cur;
        if (!natW || !natH) return;
        const s = Math.min((availW * 0.96) / natW, (availH * 0.96) / natH);
        const clamped = Math.max(1, Math.min(maxScale, s));
        if (Math.abs(clamped - scaleRef.current) > 0.005) setScale(clamped);
      });
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(outer); ro.observe(inner);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [maxScale]);
  return (
    <div ref={outerRef} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div ref={innerRef} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", transform: `scale(${scale})`, transformOrigin: "center", transition: "transform 0.1s ease-out" }}>
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
  // The advanced-builder groups and the differentiated per-level QO are NOT in
  // the URL (too large to encode), so they were lost on reload. Persist them to
  // sessionStorage (per tool route) so a refresh restores the full setup.
  interface WBPersist {
    worksheetMode?: "standard" | "advanced";
    advGroups?: AdvGroup[];
    advSelectedId?: number;
    advShuffle?: boolean;
    advDividers?: number[];
    sectionShuffles?: Record<number, boolean>;
    worksheetLayout?: "grid" | "list";
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

  interface AdvGroup {
    id: number;
    level: DifficultyLevel;
    count: number;
    variables: Record<string, boolean>;
    dropdownValue: string;
    multiSelectValues: Record<string, boolean>;
  }

  const makeDefaultAdvGroup = (id: number, lv: DifficultyLevel = "level1"): AdvGroup => {
    const t = config.tools[currentTool];
    const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
    const vars = t.difficultySettings?.[lv]?.variables ?? t.variables;
    const ms = normalizeMultiSelect(t.difficultySettings?.[lv]?.multiSelect ?? t.multiSelect);
    const variables: Record<string, boolean> = {};
    vars.forEach(v => { variables[v.key] = v.defaultValue; });
    const multiSelectValues: Record<string, boolean> = {};
    ms.forEach(g => g.options.forEach(o => { multiSelectValues[o.value] = o.defaultActive; }));
    return { id, level: lv, count: 5, variables, dropdownValue: dd?.defaultValue ?? "", multiSelectValues };
  };

  // Fill any QO options/variables missing from a group with the CURRENT sub-tool's
  // defaults. Advanced groups are first created against the default sub-tool (whose
  // level may have no options), so switching sub-tools — or restoring a saved/partial
  // group — could leave options unset. An unset option reads as "active" in the
  // generator (undefined ≠ false), silently re-enabling everything; hydrating keeps
  // the on-screen selection and the generated questions in sync. Existing choices are
  // preserved (only missing keys are added).
  const hydrateAdvGroup = (g: AdvGroup): AdvGroup => {
    const t = config.tools[currentTool];
    const ms = normalizeMultiSelect(t.difficultySettings?.[g.level]?.multiSelect ?? t.multiSelect);
    const multiSelectValues = { ...g.multiSelectValues };
    ms.forEach(grp => grp.options.forEach(o => { if (!(o.value in multiSelectValues)) multiSelectValues[o.value] = o.defaultActive; }));
    const vars = t.difficultySettings?.[g.level]?.variables ?? t.variables;
    const variables = { ...g.variables };
    (vars ?? []).forEach(v => { if (!(v.key in variables)) variables[v.key] = v.defaultValue; });
    return { ...g, multiSelectValues, variables };
  };

  const [advGroups, setAdvGroups] = useState<AdvGroup[]>(() =>
    (wbInit?.advGroups?.length ? wbInit.advGroups : [makeDefaultAdvGroup(1)]).map(hydrateAdvGroup));
  const [advSelectedId, setAdvSelectedId] = useState<number>(wbInit?.advSelectedId ?? 1);
  const advNextId = useRef(wbInit?.advGroups?.length ? Math.max(...wbInit.advGroups.map(g => g.id)) + 1 : 2);
  const [advShuffle] = useState(wbInit?.advShuffle ?? false);
  const [advDividers, setAdvDividers] = useState<Set<number>>(() => new Set(wbInit?.advDividers ?? []));
  const [sectionShuffles, setSectionShuffles] = useState<Record<number, boolean>>(wbInit?.sectionShuffles ?? {});
  const [worksheetLayout, setWorksheetLayout] = useState<"grid" | "list">(wbInit?.worksheetLayout ?? "grid");
  // When the active sub-tool changes, re-hydrate the advanced groups so their QO
  // options reflect the new sub-tool's defaults (the initial mount is already
  // hydrated by the initializer above, so skip that first run).
  const advToolRef = useRef(currentTool);
  useEffect(() => {
    if (advToolRef.current === currentTool) return;
    advToolRef.current = currentTool;
    setAdvGroups(gs => gs.map(hydrateAdvGroup));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTool]);
  const totalAdvQuestions = advGroups.reduce((s, g) => s + g.count, 0);
  const _advDragNodeIdx = useRef<number | null>(null);
  const _advListRef = useRef<HTMLDivElement>(null);
  void _advDragNodeIdx; void _advListRef;

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

  const computeSections = (groups: AdvGroup[], dividers: Set<number>): AdvGroup[][] => {
    const sections: AdvGroup[][] = [[]];
    groups.forEach((g, i) => {
      sections[sections.length - 1].push(g);
      if (dividers.has(g.id) && i < groups.length - 1) sections.push([]);
    });
    return sections;
  };

  const handleGenerateAdvanced = () => {
    const usedKeys = new Set<string>();
    const questions: AnyQuestion[] = [];
    const sections = computeSections(advGroups, advDividers);
    sections.forEach((sectionGroups, secIdx) => {
      const secQs: AnyQuestion[] = [];
      sectionGroups.forEach(g => {
        const snap: QOSnapshot = { level: g.level, variables: g.variables, dropdownValue: g.dropdownValue, multiSelectValues: g.multiSelectValues };
        for (let i = 0; i < g.count; i++)
          secQs.push(stampQO(generateUniqueQ(currentTool, g.level, g.variables, g.dropdownValue, usedKeys, g.multiSelectValues), snap));
      });
      if (sectionShuffles[secIdx]) {
        for (let i = secQs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [secQs[i], secQs[j]] = [secQs[j], secQs[i]];
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      secQs.forEach(q => { (q as any)._sectionIdx = secIdx; });
      questions.push(...secQs);
    });
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

  useEffect(() => {
    if (mode !== "worksheet" || worksheetMode !== "advanced") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const idx = advGroups.findIndex(g => g.id === advSelectedId);
      if (idx === -1) return;
      const next = e.key === "ArrowLeft" ? idx - 1 : idx + 1;
      if (next >= 0 && next < advGroups.length) { setAdvSelectedId(advGroups[next].id); e.preventDefault(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mode, worksheetMode, advGroups, advSelectedId]);

  const qoFingerprint = [
    getDropdownValue(),
    JSON.stringify(getVariableValues()),
    JSON.stringify(toolMultiSelect[currentTool] ?? {}),
  ].join("|");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (mode === "worksheet") return;
    if (reformatQuestion) {
      const snap = getQOSnapshot();
      const reformatted = reformatQuestion(currentQuestion, snap);
      if (reformatted !== null) { setCurrentQuestion(reformatted); setShowAnswer(false); return; }
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

  // Persist the worksheet-builder state (advanced groups + differentiated
  // per-level QO) so a refresh restores it — these are not encoded in the URL.
  useEffect(() => {
    if (!wbStorageKey) return;
    try {
      sessionStorage.setItem(wbStorageKey, JSON.stringify({
        worksheetMode, advGroups, advSelectedId, advShuffle,
        advDividers: [...advDividers], sectionShuffles, worksheetLayout,
        levelVariables, levelDropdowns, levelMultiSelect,
      } satisfies WBPersist));
    } catch { /* ignore quota / serialisation errors */ }
  }, [wbStorageKey, worksheetMode, advGroups, advSelectedId, advShuffle, advDividers, sectionShuffles, worksheetLayout, levelVariables, levelDropdowns, levelMultiSelect]);

  // A link that points straight at a worksheet generates it on arrival —
  // a bookmarked worksheet link is ready to teach from without extra clicks.
  // Honour the restored builder mode so an advanced setup regenerates correctly.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (urlInit.mode !== "worksheet") return;
    if (worksheetMode === "advanced") handleGenerateAdvanced();
    else handleGenerateWorksheet();
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
    const cellStyle = { backgroundColor: bg, height: "100%", boxSizing: "border-box" as const, position: "relative" as const, borderRadius: "12px", border: "1px solid #e5e7eb" };
    const numEl = <span style={{ position: "absolute", top: 0, left: 0, fontSize: "0.65em", fontWeight: 700, color: "#000", lineHeight: 1, padding: "5px 5px 7px 5px", borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>{idx + 1})</span>;
    const wrapperClass = "rounded-xl p-4 shadow group";

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
          {getInstruction() && <div className={`${instrFsz} font-semibold text-center w-full mb-1`} style={{ color: "#000", paddingTop: "0.15em" }}>{getInstruction()}</div>}
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
          {getInstruction() && <div className={`${instrFsz} font-semibold text-center w-full mb-1`} style={{ color: "#000" }}>{getInstruction()}</div>}
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
        {getInstruction() && <div className={`${instrFsz} font-semibold text-center w-full mb-1`} style={{ color: "#000" }}>{getInstruction()}</div>}
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

  const renderAdvancedWorksheet = () => {
    const lvColor  = (lv: DifficultyLevel) => lv === "level1" ? "bg-green-600" : lv === "level2" ? "bg-yellow-500" : "bg-red-600";
    const lvBorder = (lv: DifficultyLevel) => lv === "level1" ? "#16a34a" : lv === "level2" ? "#eab308" : "#dc2626";
    const canAdd = advGroups.length < 10;
    const updateGroup = (id: number, patch: Partial<AdvGroup>) =>
      setAdvGroups(gs => gs.map(g => g.id === id ? { ...g, ...patch } : g));
    const selectedGroup = advGroups.find(g => g.id === advSelectedId) ?? advGroups[0];

    const sections = computeSections(advGroups, advDividers);
    const toggleDivider = (groupId: number) => {
      setAdvDividers(prev => {
        const next = new Set(prev);
        if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
        return next;
      });
    };
    const toggleSectionShuffle = (secIdx: number) => {
      setSectionShuffles(prev => ({ ...prev, [secIdx]: !prev[secIdx] }));
    };

    let globalGroupIdx = 0;

    return (
      <div className="flex gap-3" style={{ minHeight: 300 }}>
        <div className="flex flex-col rounded-xl border-2 border-gray-300 overflow-hidden" style={{ width: "62%", flexShrink: 0, backgroundColor: "#fff" }}>
          <div className="flex-1 overflow-y-auto">
            {sections.map((secGroups, secIdx) => (
              <div key={secIdx}>
                <div className="relative flex items-center justify-center gap-3 px-4 py-3 border-b border-gray-100" style={{ backgroundColor: "#f3f4f6" }}>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Section {secIdx + 1}</span>
                    <button onClick={() => toggleSectionShuffle(secIdx)}
                      className={`text-xs font-semibold px-3 py-1 rounded transition-colors ${sectionShuffles[secIdx] ? "bg-blue-900 text-white" : "bg-gray-200 text-gray-500 hover:bg-gray-300"}`}>
                      Shuffle
                    </button>
                    {secIdx > 0 && (
                      <button onClick={() => {
                        const prevGroupId = sections[secIdx - 1][sections[secIdx - 1].length - 1]?.id;
                        if (prevGroupId !== undefined) toggleDivider(prevGroupId);
                      }}
                        className="absolute right-4 w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors" title="Remove section">
                        <X size={12} />
                      </button>
                    )}
                </div>
                {secGroups.map((g) => {
                  const idx = globalGroupIdx++;
                  const isSel = g.id === advSelectedId;
                  return (
                    <div key={g.id}>
                      <div onClick={() => setAdvSelectedId(g.id)}
                        className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-100"
                        style={{ borderLeft: `3px solid ${isSel ? lvBorder(g.level) : "transparent"}`, backgroundColor: isSel ? "#f0f4ff" : undefined }}>
                        <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0 tabular-nums">{idx + 1}</span>
                        <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden flex-shrink-0" onClick={e => e.stopPropagation()}>
                          {(["level1", "level2", "level3"] as DifficultyLevel[]).map((lv, li) => {
                            const isLvDisabled = comingSoon.includes(lv);
                            return (
                              <button key={lv} onClick={() => { if (!isLvDisabled) { updateGroup(g.id, { ...makeDefaultAdvGroup(g.id, lv), id: g.id }); setAdvSelectedId(g.id); } }}
                                className={`px-4 py-1.5 font-bold text-xs transition-colors ${isLvDisabled ? "bg-gray-100 text-gray-300 cursor-not-allowed" : g.level === lv ? `${lvColor(lv)} text-white` : "bg-white text-gray-400 hover:bg-gray-50"}`}>
                                Level {li + 1}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex-1" />
                        <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-1 py-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <button onClick={() => updateGroup(g.id, { count: Math.max(1, g.count - 1) })} disabled={g.count <= 1}
                            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-white hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-base leading-none">−</button>
                          <span className="w-7 text-center text-sm font-bold text-gray-800 tabular-nums">{g.count}</span>
                          <button onClick={() => updateGroup(g.id, { count: Math.min(24, g.count + 1) })} disabled={g.count >= 24}
                            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-white hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-base leading-none">+</button>
                        </div>
                        <button onClick={e => {
                          e.stopPropagation();
                          if (advGroups.length <= 1) return;
                          setAdvDividers(prev => { const next = new Set(prev); next.delete(g.id); return next; });
                          const rem = advGroups.filter(ag => ag.id !== g.id);
                          setAdvGroups(rem);
                          if (g.id === advSelectedId) setAdvSelectedId(rem[Math.max(0, advGroups.indexOf(g) - 1)]?.id ?? rem[0].id);
                        }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${advGroups.length > 1 ? "text-gray-300 hover:bg-red-50 hover:text-red-400" : "invisible"}`}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
            {canAdd ? (
              <div className="flex gap-2">
                <button onClick={() => { const newId = advNextId.current++; setAdvGroups(g => [...g, makeDefaultAdvGroup(newId)]); setAdvSelectedId(newId); }}
                  className="flex-1 py-2 rounded-lg border-2 border-dashed border-gray-200 text-xs font-bold text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors">
                  + Add group
                </button>
                <button onClick={() => {
                  const lastGroup = advGroups[advGroups.length - 1];
                  if (lastGroup && !advDividers.has(lastGroup.id)) {
                    setAdvDividers(prev => new Set([...prev, lastGroup.id]));
                    const newId = advNextId.current++;
                    setAdvGroups(g => [...g, makeDefaultAdvGroup(newId)]);
                    setAdvSelectedId(newId);
                  }
                }}
                  disabled={!advGroups.length || advDividers.has(advGroups[advGroups.length - 1]?.id)}
                  className="aspect-square self-stretch rounded-lg border-2 border-dashed border-gray-200 text-xs font-bold text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                  title="Add section divider">
                  + Section
                </button>
              </div>
            ) : (
              <p className="text-center text-xs text-gray-400 font-semibold py-1">Maximum 10 groups reached</p>
            )}
          </div>
        </div>

        <div className="flex-1 rounded-xl border-2 border-gray-300 px-5 py-4 overflow-y-auto" style={{ backgroundColor: "#fff" }}>
          {selectedGroup && (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Group {advGroups.indexOf(selectedGroup) + 1} · {selectedGroup.level === "level1" ? "Level 1" : selectedGroup.level === "level2" ? "Level 2" : "Level 3"} · Options
              </p>
              <InlineQOPanel
                toolEntry={config.tools[currentTool]}
                level={selectedGroup.level}
                variables={selectedGroup.variables}
                onVariableChange={(k, v) => updateGroup(selectedGroup.id, { variables: { ...selectedGroup.variables, [k]: v } })}
                dropdownValue={selectedGroup.dropdownValue}
                onDropdownChange={v => updateGroup(selectedGroup.id, { dropdownValue: v })}
                multiSelectValues={selectedGroup.multiSelectValues}
                onMultiSelectChange={(k, v) => updateGroup(selectedGroup.id, { multiSelectValues: { ...selectedGroup.multiSelectValues, [k]: v } })}
              />
            </>
          )}
        </div>
      </div>
    );
  };

  const renderControlBar = () => {
    if (mode === "worksheet") {
      const isAdv = worksheetMode === "advanced";
      return (
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="flex items-center gap-3 px-6 pt-4 pb-0">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setWorksheetMode(isAdv ? "standard" : "advanced")}
                className={`w-11 h-6 rounded-full transition-colors relative ${isAdv ? "bg-blue-900" : "bg-gray-300"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAdv ? "translate-x-6" : "translate-x-1"}`} />
              </div>
              <span className="text-sm font-bold text-gray-500">Advanced</span>
            </label>
            {isAdv && (
              <div className="ml-auto flex items-center gap-4">
                <span className="text-sm font-bold text-gray-600">{totalAdvQuestions} questions total</span>
              </div>
            )}
          </div>

          {!isAdv ? (
            <div className="p-6">
              <div className="flex justify-center items-center gap-6 mb-4">
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
                {(() => { const diffDisabled = comingSoon.length > 0; return (
                <button onClick={() => { if (!diffDisabled) setIsDifferentiated(!isDifferentiated); }}
                  className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${diffDisabled ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed" : isDifferentiated ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>
                  Differentiated
                </button>
                ); })()}
              </div>
              <div className="flex justify-center items-center gap-6 mb-4">
                {qoEl(isDifferentiated)}
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
                <div className="flex rounded-lg border-2 border-gray-300 overflow-hidden">
                  <button onClick={() => setWorksheetLayout("grid")}
                    className={`px-3 py-1.5 text-sm font-bold transition-colors ${worksheetLayout === "grid" ? "bg-blue-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                    Grid
                  </button>
                  <button onClick={() => setWorksheetLayout("list")}
                    className={`px-3 py-1.5 text-sm font-bold transition-colors ${worksheetLayout === "list" ? "bg-blue-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                    Textbook
                  </button>
                </div>
              </div>
              <div className="flex justify-center items-center gap-4">
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
                        ? customPrintHandler(worksheet, m, worksheetWrapRef.current)
                        : handlePrint(worksheet, config.tools[currentTool].name, difficulty, isDifferentiated, numColumns, getInstruction(), m, worksheetLayout)}
                      printMode={printMode} setPrintMode={setPrintMode}
                    />
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 pt-4">
              {renderAdvancedWorksheet()}
              <div className="flex justify-center items-center gap-4 flex-wrap mt-4">
                {!defaults.fixedColumns && (
                  <div className="flex items-center gap-2">
                    <label className="text-base font-semibold text-gray-700">Columns:</label>
                    <input type="number" min="1" max={defaults.maxColumns ?? 4} value={numColumns}
                      onChange={e => setNumColumns(Math.max(1, Math.min(defaults.maxColumns ?? 4, parseInt(e.target.value) || (defaults.numColumns ?? 3))))}
                      className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center" />
                  </div>
                )}
                <div className="flex rounded-lg border-2 border-gray-300 overflow-hidden">
                  <button onClick={() => setWorksheetLayout("grid")}
                    className={`px-3 py-1.5 text-sm font-bold transition-colors ${worksheetLayout === "grid" ? "bg-blue-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                    Grid
                  </button>
                  <button onClick={() => setWorksheetLayout("list")}
                    className={`px-3 py-1.5 text-sm font-bold transition-colors ${worksheetLayout === "list" ? "bg-blue-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                    Textbook
                  </button>
                </div>
                <button onClick={handleGenerateAdvanced} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
                  <RefreshCw size={18} /> Generate
                </button>
                {worksheet.length > 0 && (
                  <>
                    <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
                      <Eye size={18} /> {showWorksheetAnswers ? "Hide Answers" : "Show Answers"}
                    </button>
                    <PrintSplitButton
                      onPrint={m => customPrintHandler
                        ? customPrintHandler(worksheet, m, worksheetWrapRef.current)
                        : handlePrint(worksheet, config.tools[currentTool].name, "advanced", false, numColumns, getInstruction(), m, worksheetLayout)}
                      printMode={printMode} setPrintMode={setPrintMode}
                    />
                  </>
                )}
              </div>
            </div>
          )}
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

  const renderWorkedExample = () => (
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
            <div className="space-y-4 mt-8">
              {currentQuestion.working.map((s, i) => {
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
              })}
            </div>
            <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: stepBg }}>
              <span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}>
                {answerRenderer ? answerRenderer(currentQuestion, colorScheme, getQOSnapshot()) : <AnswerDisplay q={currentQuestion} />}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasSec = worksheet.some(q => ((q as any)._sectionIdx ?? 0) > 0);
      return (
        <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: qBg }}>
          {fontSizeControls}
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>
          <div style={{ columnCount: numColumns, columnGap: "1.5rem" }}>
            {worksheet.map((q, idx) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const secIdx = (q as any)._sectionIdx as number | undefined;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const prevSec = idx > 0 ? ((worksheet[idx - 1] as any)._sectionIdx ?? 0) : 0;
              const showDivider = hasSec && idx > 0 && (secIdx ?? 0) !== prevSec;
              const fsz = fontSizes[worksheetFontSize];
              return (
                <div key={idx}>
                  {showDivider && <div style={{ width: "60%", margin: "0.5rem auto", borderTop: "1px solid #d1d5db" }} />}
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
            })}
          </div>
        </div>
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasSec = worksheet.some(q => ((q as any)._sectionIdx ?? 0) > 0);
    return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: qBg }}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>
        {(() => {
          if (!hasSec) return (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${numColumns},1fr)`, gridAutoRows: "1fr", gap: "1rem" }}>
              {worksheet.map((q, idx) => <div key={idx} style={{ minHeight: 0 }}>{renderQCell(q, idx)}</div>)}
            </div>
          );
          const segments: { secIdx: number; items: { q: AnyQuestion; globalIdx: number }[] }[] = [];
          let curSec = -1;
          worksheet.forEach((q, idx) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const si = (q as any)._sectionIdx ?? 0;
            if (si !== curSec) { segments.push({ secIdx: si, items: [] }); curSec = si; }
            segments[segments.length - 1].items.push({ q, globalIdx: idx });
          });
          return segments.map((seg, si) => (
            <div key={si}>
              {si > 0 && <div style={{ width: "60%", margin: "1rem auto", borderTop: "1px solid #d1d5db" }} />}
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${numColumns},1fr)`, gridAutoRows: "1fr", gap: "1rem" }}>
                {seg.items.map(({ q, globalIdx }) => <div key={globalIdx} style={{ minHeight: 0 }}>{renderQCell(q, globalIdx)}</div>)}
              </div>
            </div>
          ));
        })()}
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
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {isMenuOpen && <MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={() => setIsMenuOpen(false)} onOpenInfo={() => setIsInfoOpen(true)} />}
          </div>
        </div>
      </div>
      {isInfoOpen && <InfoModal infoSections={infoSections} onClose={() => setIsInfoOpen(false)} />}
      <div className="min-h-screen p-8" style={{ backgroundColor: "#f5f3f0" }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: "#000" }}>{config.pageTitle}</h1>
          <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>
          {toolKeys.length > 1 && (
            <>
              <div className="flex justify-center gap-4 mb-6">
                {toolKeys.map(k => (
                  <button key={k} onClick={() => { if (mode === "builder") return; setCurrentTool(k); }}
                    className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode !== "builder" && currentTool === k ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                    {config.tools[k].name}
                  </button>
                ))}
                <div className="w-px bg-gray-300 mx-1 self-stretch" />
                <button onClick={() => { setMode(mode === "builder" ? "whiteboard" : "builder"); setPresenterMode(false); setWbFullscreen(false); }}
                  className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode === "builder" ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                  Builder
                </button>
              </div>
              <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>
            </>
          )}
          {mode !== "builder" && (
            <div className="flex justify-center gap-4 mb-8">
              {(["whiteboard", "single", "worksheet"] as const).map((m, i) => {
                const label = ["Whiteboard", "Worked Example", "Worksheet"][i];
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
            />
          )}
          {mode === "worksheet" && <>{renderControlBar()}<div ref={worksheetWrapRef}>{renderWorksheet()}</div></>}
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
