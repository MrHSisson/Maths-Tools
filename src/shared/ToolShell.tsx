import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from "react";
import { useDevMode } from "../devMode";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, PanelRightClose, PanelRightOpen, SlidersHorizontal, Table2 } from "lucide-react";
import type { DifficultyLevel, AnyQuestion, WorkingStep, ToolConfig, InfoSection, PrintMode, QOSnapshot, ToolShellDefaults } from "./types";
import { LV_COLORS, LV_LABELS, LV_SELECTOR, PAGE_BG, getQuestionBg, getStepBg } from "./colors";
import { normalizeMultiSelect, resolveMultiSelectValues, ansEq, makeUniqueQ, sortByDifficulty, buildQuotaOverrides } from "./helpers";
import { loadKaTeX } from "./katex";
import { MathRenderer, InlineMath } from "./components/MathRenderer";
import { QuestionDisplay, AnswerDisplay } from "./components/QuestionDisplay";
import { DifficultyToggle } from "./components/DifficultyToggle";
import { WorkedExampleSteps } from "./components/WorkedExampleSteps";
import { ScaleToFit } from "./components/ScaleToFit";
import {
  StandardQOPopover,
  DiffQOPopover,
  SegButtons,
  InlineQOPanel,
} from "./components/QOPopovers";
import { InfoModal } from "./components/InfoModal";
import { MenuDropdown } from "./components/MenuDropdown";
import { PrintSplitButton } from "./components/PrintSplitButton";
import { handlePrint } from "./print";
import type { PrintContext } from "./printDiagram";
import { WorksheetBuilder } from "./WorksheetBuilder";
import { TeachingDeck, type TeachingSlide } from "./TeachingDeck";
import { DepthMode } from "./components/DepthMode";
import { depthOnTool, type DepthItem, type DepthOptionInfo } from "./depth";
import { SkillOverlay } from "./skills";
import { useParkedMode } from "../parkedMode";

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
  stepRenderer?: (step: WorkingStep, colorScheme: string, qo?: QOSnapshot, reveal?: number) => JSX.Element | null;
  /** For steps whose working is a *visual that evolves* (a place value table filling in). Return the
   *  visual for such a step (null for any other). In the cascade and Show All, those steps then show
   *  only their caption in the list, and ONE visual — the current step's — updates in place beside it,
   *  instead of reprinting the whole table on every step. */
  stepVisualRenderer?: (step: WorkingStep, colorScheme: string, qo?: QOSnapshot) => JSX.Element | null | false;
  /** With `stepVisualRenderer`: keep each step's full working (its maths) in the list beside the picture,
   *  instead of a caption-only timeline. For equation-led tools whose picture (a SmartGrapher `step` build)
   *  grows alongside the working. */
  stepVisualKeepsWorking?: boolean;
  /** Where the `stepVisualRenderer` picture sits: beside the steps (default) or full width above them
   *  (wide, short pictures such as a number line). */
  stepVisualPlacement?: "side" | "top";
  /** Replaces QuestionDisplay in all modes. compact=true in worksheet cells, false in worked example/fullscreen, undefined in regular whiteboard. idx is the worksheet question index (only provided in worksheet cells). qo is the live QO state snapshot — use it for render-time reformatting (e.g. decimal/fraction toggle). */
  questionRenderer?: (q: AnyQuestion, showAnswer: boolean, colorScheme: string, compact?: boolean, idx?: number, qo?: QOSnapshot, fontClass?: string) => JSX.Element | null;
  /** Replaces the final answer box (AnswerDisplay). Shown when showAnswer=true. qo is the live QO state snapshot. */
  answerRenderer?: (q: AnyQuestion, colorScheme: string, qo?: QOSnapshot) => JSX.Element | null;
  /** Called when a QO option changes before falling back to full regeneration. Return a reformatted copy of the question, or null to trigger a new question instead. Use this for instant display-mode switches (e.g. decimal ↔ fraction) where the maths doesn't change. */
  reformatQuestion?: (q: AnyQuestion, qo: QOSnapshot) => AnyQuestion | null;
  /** Custom print handler for diagram tools. Receives the worksheet array, print mode, the worksheet container DOM element (for SVG extraction), and the live print context (columns, differentiated, etc.). Diagram tools should pass this to the shared handleDiagramPrint. */
  customPrintHandler?: (questions: AnyQuestion[], printMode: PrintMode, worksheetEl: HTMLElement | null, ctx: PrintContext) => void;
  /** Optional curated teaching slides. When provided, a "Teach" mode is shown
   *  that runs the slides as a PowerPoint-style deck (see TeachingDeck). */
  teachingSlides?: TeachingSlide[];
  /** Optional curated Depth questions (diagnose / explain / extend). When provided, a "Depth" mode
   *  appears (behind Developing-tools mode while piloting). See src/shared/depth.ts. */
  depthItems?: DepthItem[];
  /** Optional scaffold drawn inside the whiteboard's working box (e.g. a place
   *  value table to model on). A toolbar button in the box hides/shows it so the
   *  teacher can remove the scaffold; the box is otherwise free working space.
   *  Whiteboard only (embedded and fullscreen). `label` names the button tooltip. */
  workingScaffold?: {
    label: string;
    /** Where it is drawn: the working box (default) or inside the question box
     *  below the question — pair "question" with `collapseWorkingByDefault` for a
     *  full-width scaffold (the hide button then lives in the question box). */
    placement?: "workingBox" | "workingCorner" | "question";
    /** For "workingCorner": the width in px of the small scaffold pinned top-left of the working
     *  box (default 190; grows in fullscreen). The rest of the box stays free to write in. */
    cornerWidth?: number;
    render: (q: AnyQuestion, showAnswer: boolean, colorScheme: string, qo?: QOSnapshot) => JSX.Element | null;
  };
}

const ALL_LEVELS: DifficultyLevel[] = ["level1", "level2", "level3"];

// Below this viewport width, ToolShell swaps its desktop chrome for a compact
// narrow layout — see isNarrow and renderNarrowShell further down.
const NARROW_BREAKPOINT = 640;

// Used for a differentiated worksheet's level columns when the teacher turns
// off "Colour levels" in Settings — plain neutral styling instead of each
// level's green/yellow/red tint. `fill` is left undefined so renderQCell
// falls back to its normal (non-differentiated) cell background.
const NEUTRAL_LV_COLORS = { bg: "bg-white", border: "border-gray-300", text: "text-gray-800", fill: undefined as string | undefined };

/** Tints the phone's status bar (the `theme-color` meta) to the nav bar's navy while that bar is
 *  on screen, and back to the light page colour once it has scrolled away — so on an installed
 *  app the status bar reads as part of the nav bar at the top, then as plain page below it. */
function StatusBarTint({ barId }: { barId: string }) {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const prev = meta.getAttribute("content");
    const update = () => {
      const bar = document.getElementById(barId);
      const visible = !!bar && bar.getBoundingClientRect().bottom > 0;
      meta.setAttribute("content", visible ? "#1e3a8a" : PAGE_BG);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (prev) meta.setAttribute("content", prev);
    };
  }, [barId]);
  return null;
}

export const ToolShell = ({ config, infoSections, generateQuestion, generateUniqueQ: generateUniqueQProp, defaults = {}, stepRenderer, stepVisualRenderer, stepVisualKeepsWorking, stepVisualPlacement, questionRenderer, answerRenderer, reformatQuestion, customPrintHandler, teachingSlides, depthItems, workingScaffold }: ToolShellProps) => {
  const generateUniqueQ = generateUniqueQProp ?? makeUniqueQ(generateQuestion);
  const toolKeys = Object.keys(config.tools);
  // Seeds a smaller default question font size on a narrow viewport (the
  // desktop/whiteboard default is sized for a projector, not a phone) — see
  // isNarrow below for the live viewport tracking used everywhere else.
  const narrowInit = typeof window !== "undefined" && window.innerWidth <= NARROW_BREAKPOINT;

  // ── Shareable links: read the initial state from the URL (parsed once) ─────
  // ?tool=key&mode=example|worksheet&level=2&dd=value&vars=a,-b&ms=x,-y&n=20&cols=2&diff=1&diffLv=1,3&diffSame=0&diffColor=0
  // Tokens in vars/ms set a key on; a "-" prefix sets it off. Invalid or stale
  // values fall back to defaults, so old bookmarks never break a tool. `diffLv`
  // is an optional comma list of level numbers (e.g. "1,3") selecting a subset
  // of levels for the Differentiated worksheet; omitted or invalid, it falls
  // back to every available (non coming-soon) level, matching old links.
  // `diffSame=0` opts into per-level cell sizing; omitted (or any other value)
  // keeps the default shared-height sizing. `diffColor=0` turns off each
  // level's green/yellow/red tint; omitted (or any other value) keeps it on.
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
    // "builder" used to be its own top-level mode (a standalone nav-bar tab); it's
    // now folded into Worksheet mode's Advanced toggle. Old `mode=builder` links
    // still work — they land on Worksheet mode with Advanced already on (see
    // `builderRequested` below and its use for the initial worksheetMode state).
    const modeMap: Record<string, "whiteboard" | "single" | "worksheet" | "teach" | "depth"> = { whiteboard: "whiteboard", example: "single", worksheet: "worksheet", builder: "worksheet", teach: "teach", depth: "depth" };
    const levelMap: Record<string, DifficultyLevel> = { "1": "level1", "2": "level2", "3": "level3" };
    const levelParam = levelMap[p.get("level") ?? ""];
    const intParam = (key: string, min: number, max: number): number | null => {
      const n = parseInt(p.get(key) ?? "", 10);
      return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : null;
    };
    const tool = toolParam && toolKeys.includes(toolParam) ? toolParam : toolKeys[0];
    const toolLvls = config.tools[tool]?.levels ?? ALL_LEVELS;
    return {
      tool,
      // On a narrow first paint with no explicit mode= param, seed "single"
      // directly rather than "whiteboard" — narrow has no Whiteboard mode, so
      // defaulting to "whiteboard" here left neither narrow toggle button
      // highlighted for one frame until the mode-coercion effect corrected it.
      mode: modeMap[p.get("mode") ?? ""] ?? (narrowInit ? "single" : "whiteboard"),
      builderRequested: p.get("mode") === "builder",
      item: p.get("item"),
      level: levelParam && toolLvls.includes(levelParam) && !(defaults.comingSoonLevels ?? []).includes(levelParam) ? levelParam : toolLvls[0],
      vars: toggles(p.get("vars")),
      ms: toggles(p.get("ms")),
      dd: p.get("dd"),
      n: defaults.fixedQuestions ? null : intParam("n", 1, 24),
      cols: defaults.fixedColumns ? null : intParam("cols", 1, defaults.maxColumns ?? 4),
      diff: p.get("diff") === "1",
      diffLv: p.get("diffLv"),
      diffSame: p.get("diffSame") !== "0",
      diffColor: p.get("diffColor") !== "0",
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
    smartProgressorEnabled?: boolean;
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
  const [mode, setMode] = useState<"whiteboard" | "single" | "worksheet" | "teach" | "depth">(urlInit.mode);
  // The Teach deck is dormant content, not in-progress work, so it's gated by
  // the separate, unadvertised parkedMode rather than Developing-tools mode —
  // see src/parkedMode.ts.
  const parkedMode = useParkedMode();
  const showTeach = !!(parkedMode && teachingSlides && teachingSlides.length);
  // Depth (curated diagnose / explain / extend questions) is live for any tool that passes `depthItems`.
  const [depthItemId, setDepthItemId] = useState<string | null>(urlInit.item);
  const toolDepthItems = useMemo(
    () => (depthItems ?? []).filter((i) => depthOnTool(i, currentTool)),
    [depthItems, currentTool],
  );
  const showDepth = toolDepthItems.length > 0;
  const comingSoon = defaults.comingSoonLevels ?? [];
  const hideFontControls = defaults.hideFontControls ?? false;
  // Step-by-Step is the cascading ("stacked") layout for every tool; "single" (one card replaced per press) is opt-in.
  const workedExampleLayout = defaults.workedExampleLayout ?? "stacked";
  const hideAnswerStep = defaults.hideAnswerStep ?? false;
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(urlInit.level);
  // The levels the current sub-tool actually has (ToolEntry.levels) — unlisted
  // levels are hidden, not "coming soon". Defaults to all three.
  const levelsOf = (k: string): DifficultyLevel[] => config.tools[k]?.levels ?? ALL_LEVELS;
  const toolLevels = levelsOf(currentTool);
  const showLevelToggle = toolLevels.length > 1;
  const setDifficultyGuarded = (v: DifficultyLevel) => { if (!comingSoon.includes(v) && toolLevels.includes(v)) setDifficulty(v); };

  // The main level row doubles as the differentiated-level picker: normally
  // (diffToggle off) it's mutually exclusive — clicking a level sets
  // `difficulty` and `diffLevels` always tracks that same single level, kept
  // in sync so flipping the toggle on starts from whatever's on screen. Once
  // `diffToggle` is on, clicking a level instead toggles its membership in
  // `diffLevels` (multi-select) — the worksheet only actually differentiates
  // once 2+ levels are selected (see the `isDifferentiated` derivation below);
  // with exactly one selected it behaves as an ordinary single-level sheet.
  // `availableLevels` excludes coming-soon levels — the toggle itself is
  // disabled when fewer than two levels are available to pick from.
  const availableLevels = toolLevels.filter(l => !comingSoon.includes(l));
  const [diffLevels, setDiffLevels] = useState<DifficultyLevel[]>(() => {
    const numToLevel: Record<string, DifficultyLevel> = { "1": "level1", "2": "level2", "3": "level3" };
    if (urlInit.diff) {
      const raw = urlInit.diffLv;
      if (raw) {
        const parsed = Array.from(new Set(
          raw.split(",").map(t => numToLevel[t.trim()]).filter((l): l is DifficultyLevel => !!l && availableLevels.includes(l)),
        ));
        if (parsed.length >= 2) return ALL_LEVELS.filter(l => parsed.includes(l));
      }
      return availableLevels;
    }
    return [urlInit.level];
  });
  const [diffToggle, setDiffToggle] = useState(urlInit.diff && availableLevels.length >= 2);
  // The worksheet is only actually differentiated once the toggle has taken
  // the level row out of single-select AND 2+ levels are currently checked.
  const isDifferentiated = diffToggle && diffLevels.length >= 2;
  const toggleDiffLevel = (lv: DifficultyLevel) => {
    if (!diffToggle) { setDifficultyGuarded(lv); setDiffLevels([lv]); return; }
    setDiffLevels(prev => {
      const next = prev.includes(lv)
        ? (prev.length > 1 ? prev.filter(l => l !== lv) : prev)
        : ALL_LEVELS.filter(l => l === lv || prev.includes(l));
      if (next.length === 1) setDifficulty(next[0]);
      return next;
    });
  };
  const toggleDiffMode = () => {
    if (availableLevels.length < 2) return;
    setDiffToggle(prev => {
      const next = !prev;
      if (next) {
        // Turning multi-select on: start from every available level, not
        // just whichever single one was showing.
        setDiffLevels(availableLevels);
      } else if (diffLevels.length > 1) {
        const collapsed = diffLevels[0];
        setDifficulty(collapsed);
        setDiffLevels([collapsed]);
      }
      return next;
    });
  };
  // Keep diffLevels mirroring the single active difficulty whenever the level
  // row isn't in multi-select mode — covers difficulty changes made through
  // other UI (e.g. the whiteboard/worked-example DifficultyToggle) so turning
  // multi-select on always starts from whatever level is currently showing.
  useEffect(() => { if (!diffToggle) setDiffLevels([difficulty]); }, [difficulty, diffToggle]);
  // Switching sub-tool: clamp the level state to the new sub-tool's levels in
  // the same batch as the tool change, so generateQuestion is never called
  // with a level the sub-tool doesn't have.
  const selectTool = (k: string) => {
    const avail = levelsOf(k).filter(l => !comingSoon.includes(l));
    if (!avail.includes(difficulty)) setDifficulty(avail[0]);
    const keptDiff = diffLevels.filter(l => avail.includes(l));
    if (avail.length < 2) { setDiffToggle(false); setDiffLevels([avail.includes(difficulty) ? difficulty : avail[0]]); }
    else if (diffToggle) setDiffLevels(keptDiff.length >= 1 ? keptDiff : avail);
    setCurrentTool(k);
  };
  // true (default): every differentiated cell shares one height (the tallest
  // question across every selected level). false: each level's column sizes
  // to its own tallest question, so a simpler level doesn't inflate to match
  // a harder level's bigger diagrams/working.
  const [diffSameSize, setDiffSameSize] = useState(urlInit.diffSame);
  // true (default): each selected level's column keeps its green/yellow/red
  // tint. false: plain neutral styling — for teachers who don't want the
  // colour-coding on a differentiated worksheet.
  const [diffColorLevels, setDiffColorLevels] = useState(urlInit.diffColor);

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
  // Staged reveal — a question may set `_stagedReveal: "<label>"` to insert one step
  // before the answer (e.g. "Show Plot"). The first press shows the preview (renderers
  // read qo.preview); the next shows the answer. Hiding the answer resets both.
  const [previewShown, setPreviewShown] = useState(false);
  useEffect(() => { setPreviewShown(false); }, [currentQuestion]);
  const stagedLabel = (currentQuestion as unknown as { _stagedReveal?: string })._stagedReveal;
  // The preview button lives inside the question box (not the toolbar's Show Answer).
  // It hides once the answer is up, since the answer includes the preview.
  const stagedBtn = (answerShown: boolean) => stagedLabel && !answerShown ? (
    <button onClick={() => setPreviewShown(p => !p)}
      className="mt-1 px-5 py-1.5 rounded-lg font-bold text-sm border-2 border-blue-900 text-blue-900 bg-white/70 hover:bg-white flex items-center gap-1.5">
      <Eye size={14} /> {previewShown ? stagedLabel.replace(/^Show/, "Hide") : stagedLabel}
    </button>
  ) : null;
  // Bumped whenever the Worked Example's underlying example genuinely changes
  // (new question, or a reformat) — tells WorkedExampleSteps to reset position
  // back to the start. Step-by-Step/Show All itself lives inside that component.
  const [workedResetNonce, setWorkedResetNonce] = useState(0);
  // Skill drill-down overlay, opened from a [[skill-id|term]] marker in a step label.
  const [openSkillId, setOpenSkillId] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState(urlInit.n ?? defaults.numQuestions ?? 15);
  const [numColumns, setNumColumns] = useState(urlInit.cols ?? defaults.numColumns ?? 3);
  const [worksheet, setWorksheet] = useState<AnyQuestion[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>("both");
  const [worksheetMode, setWorksheetMode] = useState<"standard" | "advanced">(
    urlInit.builderRequested ? "advanced" : (wbInit?.worksheetMode ?? "standard"),
  );
  const [displayFontSize, setDisplayFontSize] = useState(defaults.displayFontSize ?? (narrowInit ? 0 : 2));
  const [worksheetFontSize, setWorksheetFontSize] = useState(defaults.worksheetFontSize ?? 1);
  const [pickedScheme, setColorScheme] = useState("default");
  const colorScheme = useDevMode() ? pickedScheme : "default";   // colour schemes are dev-gated for now
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // ── Narrow-viewport layout ─────────────────────────────────────────────────
  // Below NARROW_BREAKPOINT, ToolShell swaps its desktop chrome for a compact
  // single-column layout limited to Worked Example + a light Worksheet list
  // (no Whiteboard/Teach — see renderNarrowShell near the end of this file).
  // Driven purely by viewport width, not a URL/user toggle, so shrinking a
  // desktop window narrow enough previews it too.
  const [isNarrow, setIsNarrow] = useState(narrowInit);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(max-width: ${NARROW_BREAKPOINT}px)`);
    const handler = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  // Whiteboard and Teach have no narrow layout — coerce a stale mode=whiteboard
  // link (or a desktop session shrunk mid-Whiteboard) back to Worked Example.
  useEffect(() => { if (isNarrow && (mode === "whiteboard" || mode === "teach")) setMode("single"); }, [isNarrow, mode]);
  const [narrowDrawerOpen, setNarrowDrawerOpen] = useState(false);
  // Phone: a click-through start (topic → mode) before the tool itself; a shared link that already names a setup skips it.
  const [narrowStarted, setNarrowStarted] = useState(() => typeof window !== "undefined" && /[?&](mode|tool|level)=/.test(window.location.search));
  const [launchStep, setLaunchStep] = useState<"topic" | "mode">(() => (Object.keys(config.tools).length > 1 ? "topic" : "mode"));
  // Phone Back: the start screens (topic → mode → tool) are React state, so the phone's Back swipe would skip
  // straight past them to the landing page. Mirror the stage into history — one entry per screen — so Back steps
  // out one screen at a time. Stage: 0 = first start screen, 1 = mode screen (multi-topic tools), last = the tool.
  const multiTopic = toolKeys.length > 1;
  const narrowStage = isNarrow ? (narrowStarted ? (multiTopic ? 2 : 1) : (multiTopic && launchStep === "mode" ? 1 : 0)) : 0;
  // phone: every new screen (start, topic, mode, a different sub-tool or question set) opens at the top with the header showing —
  // the page is one long document, so without this it keeps whatever scroll the previous screen (or a restored reload) had.
  useEffect(() => { if (isNarrow) window.scrollTo({ top: 0 }); }, [isNarrow, narrowStage, mode, currentTool]);
  // …and a reload doesn't bring back an old scroll position either
  useEffect(() => { if (isNarrow) try { window.history.scrollRestoration = "manual"; } catch { /* not supported */ } }, [isNarrow]);
  const histStage = useRef(narrowStage);   // stage the current history entry represents
  const baseStage = useRef(narrowStage);   // stage of the entry the page loaded on (it carries no marker)
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (!isNarrow) return;
      const m = (e.state as { mtStage?: number } | null)?.mtStage;
      const target = typeof m === "number" ? m : baseStage.current;
      histStage.current = target;
      setNarrowStarted(target >= (multiTopic ? 2 : 1));
      setLaunchStep(multiTopic && target < 1 ? "topic" : "mode");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isNarrow, multiTopic]);
  useEffect(() => {
    if (!isNarrow || narrowStage === histStage.current) return;
    if (narrowStage > histStage.current) {
      for (let st = histStage.current + 1; st <= narrowStage; st++) window.history.pushState({ mtStage: st }, "", window.location.href);
    } else if (narrowStage >= baseStage.current) {
      window.history.go(-(histStage.current - narrowStage));   // tapped a crumb / ‹: drop the entries it skipped over
    } else {
      window.history.replaceState({ mtStage: narrowStage }, "", window.location.href);   // went back past where the page opened
      baseStage.current = narrowStage;
    }
    histStage.current = narrowStage;
  }, [isNarrow, narrowStage]);
  // Per-card reveal for the narrow Worksheet list, independent of the desktop
  // grid's showWorksheetAnswers (reused here too, as a "reveal all" toggle) —
  // reset whenever a new set is generated.
  const [narrowRevealed, setNarrowRevealed] = useState<Set<number>>(new Set());
  useEffect(() => { setNarrowRevealed(new Set()); }, [worksheet]);

  const [worksheetLayout, setWorksheetLayout] = useState<"grid" | "list">(wbInit?.worksheetLayout ?? "grid");
  const [worksheetBorders, setWorksheetBorders] = useState(wbInit?.worksheetBorders ?? true);
  // Standard worksheet mode only (see handleGenerateWorksheet) — off restores
  // plain random-order generation, exactly as it worked before the Smart
  // Progressor existed. Only shown in the Settings popover when this tool
  // actually has a weighted multiSelect pool (see toolHasWeightedPool) —
  // it's a no-op otherwise, so there's nothing to toggle.
  const [smartProgressorEnabled, setSmartProgressorEnabled] = useState(wbInit?.smartProgressorEnabled ?? true);
  const [wsSettingsOpen, setWsSettingsOpen] = useState(false);

  const [presenterMode, setPresenterMode] = useState(false);
  const [wbFullscreen, setWbFullscreen] = useState(false);
  const [weFullscreen, setWeFullscreen] = useState(false); // Worked Example fullscreen (steps fill the screen)
  const [splitPct, setSplitPct] = useState(40);
  const [scaffoldHidden, setScaffoldHidden] = useState(false);
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
  // If Teach isn't available (dev mode off, or a stale mode=teach link), fall back.
  useEffect(() => { if (mode === "teach" && !showTeach) setMode("whiteboard"); }, [mode, showTeach]);
  useEffect(() => { if (mode === "depth" && !showDepth) setMode(isNarrow ? "single" : "whiteboard"); }, [mode, showDepth, isNarrow]);

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
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setPresenterMode(false); setWbFullscreen(false); setWeFullscreen(false); } };
    document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h);
  }, []);

  const qBg = getQuestionBg(colorScheme);
  const stepBg = getStepBg(colorScheme);
  const isDefaultScheme = colorScheme === "default";
  const fsToolbarBg = isDefaultScheme ? "#ffffff" : stepBg;
  const fsQuestionBg = isDefaultScheme ? "#ffffff" : qBg;
  const fsWorkingBg  = isDefaultScheme ? PAGE_BG : qBg;

  const getToolSettings = () => config.tools[currentTool];
  const getDropdownConfig = () => getToolSettings().difficultySettings?.[difficulty]?.dropdown ?? getToolSettings().dropdown;
  const getVariablesConfig = () => getToolSettings().difficultySettings?.[difficulty]?.variables ?? getToolSettings().variables;
  const getMultiSelectConfig = () => normalizeMultiSelect(getToolSettings().difficultySettings?.[difficulty]?.multiSelect ?? getToolSettings().multiSelect);

  // Depth reads the SAME Question Options as the other modes: which multiSelect options this sub-tool + level
  // offers, and which are switched on, decide which curated questions are possible (DepthItem.needs).
  const depthOptionInfo = useMemo(() => {
    const info: DepthOptionInfo = {};
    getMultiSelectConfig().forEach(g => g.options.forEach(o => { info[o.value] = { pool: g.label, label: o.label }; }));
    return info;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTool, difficulty, config]);
  const depthActiveOptions = useMemo(() => {
    const vals = resolveMultiSelectValues(getMultiSelectConfig(), toolMultiSelect[currentTool] ?? {});
    return new Set(Object.keys(depthOptionInfo).filter(v => vals[v]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTool, difficulty, config, toolMultiSelect, depthOptionInfo]);

  // Whether the current tool has any weighted multiSelect option at all,
  // across every level — decides whether the "Smart Progressor" Settings
  // toggle is worth showing (it's a no-op for a tool with no weighted pool,
  // so there's nothing to toggle).
  const toolHasWeightedPool = (() => {
    const t = getToolSettings();
    const allGroups = [
      ...normalizeMultiSelect(t.multiSelect),
      ...(["level1", "level2", "level3"] as DifficultyLevel[]).flatMap(lv => normalizeMultiSelect(t.difficultySettings?.[lv]?.multiSelect)),
    ];
    return allGroups.some(g => g.options.some(o => o.weight !== undefined));
  })();

  // Differentiated per-level multiSelect state (`levelMultiSelect`) only ever
  // records EXPLICIT overrides the teacher makes in the differentiated QO
  // popover — a level nobody has touched stays `{}`. Reading that raw object
  // straight into pickActive() is wrong: pickActive treats "not === false" as
  // active, so an untouched level would treat every option (including ones
  // whose defaultActive is false, e.g. "Crossing zero") as active, silently
  // ignoring the tool's defaults. Always resolve through this helper — for
  // both worksheet generation and the popover's checkbox display — so an
  // untouched level falls back to the SAME per-option defaultActive the
  // standard (non-differentiated) view uses, with explicit overrides layered
  // on top.
  const getLevelMultiSelectValues = (lv: DifficultyLevel): Record<string, boolean> => {
    const t = getToolSettings();
    const groups = normalizeMultiSelect(t.difficultySettings?.[lv]?.multiSelect ?? t.multiSelect);
    return resolveMultiSelectValues(groups, levelMultiSelect[lv] ?? {});
  };
  const getDropdownValue = () => toolDropdowns[`${currentTool}__${difficulty}`] ?? getDropdownConfig()?.defaultValue ?? "";
  const setDropdownValue = (v: string) => setToolDropdowns(p => ({ ...p, [`${currentTool}__${difficulty}`]: v }));
  const getVariableValues = () => toolVariables[currentTool]?.[difficulty] ?? {};
  // A variable flagged `capsColumns` (e.g. "grids on worksheet") limits the worksheet's columns while on.
  const colCap = (() => {
    const vals = getVariableValues();
    return (getVariablesConfig() ?? []).reduce((cap, v) => (v.capsColumns && vals[v.key] ? Math.min(cap, v.capsColumns) : cap), Infinity);
  })();
  const effCols = Math.min(numColumns, colCap);
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
    preview: previewShown,
    scaffoldVisible: !!workingScaffold && mode === "whiteboard" && !scaffoldHidden
      && (workingScaffold.placement === "question" || (!presenterMode && !workingCollapsed)),
  });

  const makeQuestion = (): AnyQuestion =>
    generateQuestion(currentTool, difficulty, getVariableValues(), getDropdownValue(), toolMultiSelect[currentTool] ?? {});

  const handleNewQuestion = () => {
    setCurrentQuestion(makeQuestion());
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
    setWorkedResetNonce(n => n + 1);
  };

  const stampQO = (q: AnyQuestion, snap: QOSnapshot): AnyQuestion => ({ ...q, _qo: snap } as AnyQuestion);

  const handleGenerateWorksheet = () => {
    const usedKeys = new Set<string>();
    const questions: AnyQuestion[] = [];
    if (isDifferentiated) {
      diffLevels.forEach(lv => {
        const t = getToolSettings();
        const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
        const vars = levelVariables[lv] ?? {};
        const ddVal = levelDropdowns[lv] ?? (dd?.defaultValue ?? "");
        const msVals = getLevelMultiSelectValues(lv);
        // Smart Progressor (standard worksheet mode only — the advanced
        // WorksheetBuilder never calls this function, so it's naturally
        // exempt — and only when the "Smart Progressor" Settings toggle is
        // on): keep a weighted group's active options roughly even (e.g.
        // all 3 difficulty rungs ticked → ~a third of this level's
        // questions each, genuine variety allowed — 6/5/4 is a normal
        // outcome, not just 5/5/5 every time) instead of leaving it fully
        // to chance — see buildQuotaOverrides. Unweighted groups (e.g.
        // Units) are untouched and still vary randomly per question. With
        // the toggle off, every slot gets the same unmodified msVals and
        // the block is left in its generated (random) order — exactly the
        // pre-Smart-Progressor behaviour.
        const groups = normalizeMultiSelect(t.difficultySettings?.[lv]?.multiSelect ?? t.multiSelect);
        const overrides = smartProgressorEnabled
          ? buildQuotaOverrides(groups, msVals, numQuestions)
          : Array.from({ length: numQuestions }, () => msVals);
        const levelQuestions: AnyQuestion[] = [];
        for (let i = 0; i < numQuestions; i++) {
          // Stamp each question with the QO snapshot for ITS OWN slot override
          // (not the shared pre-balancing msVals) — otherwise regenQuestion
          // later regenerates against the full (unbalanced) pool and a
          // Smart-Progressor-tiered question loses its tier on regeneration.
          const slotSnap: QOSnapshot = { level: lv, variables: vars, dropdownValue: ddVal, multiSelectValues: overrides[i] };
          levelQuestions.push(stampQO(generateUniqueQ(currentTool, lv, vars, ddVal, usedKeys, overrides[i]), slotSnap));
        }
        // Smart Progressor: order each level's own block easy-to-hard by
        // _difficultyScore (see sortByDifficulty) — a no-op for tools that
        // don't attach one, and skipped entirely when the toggle is off.
        questions.push(...(smartProgressorEnabled ? sortByDifficulty(levelQuestions) : levelQuestions));
      });
    } else {
      const msVals = toolMultiSelect[currentTool] ?? {};
      const overrides = smartProgressorEnabled
        ? buildQuotaOverrides(getMultiSelectConfig(), msVals, numQuestions)
        : Array.from({ length: numQuestions }, () => msVals);
      const flatQuestions: AnyQuestion[] = [];
      for (let i = 0; i < numQuestions; i++) {
        // See the differentiated branch above — stamp each question with its
        // OWN slot override, not the shared pre-balancing msVals, so a
        // regenerated question keeps its Smart Progressor tier.
        const slotSnap: QOSnapshot = { level: difficulty, variables: getVariableValues(), dropdownValue: getDropdownValue(), multiSelectValues: overrides[i] };
        flatQuestions.push(stampQO(generateUniqueQ(currentTool, difficulty, getVariableValues(), getDropdownValue(), usedKeys, overrides[i]), slotSnap));
      }
      questions.push(...(smartProgressorEnabled ? sortByDifficulty(flatQuestions) : flatQuestions));
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
    variables: (getVariablesConfig() ?? []).filter(v => !v.worksheetOnly || mode === "worksheet"),
    variableValues: getVariableValues(),
    onVariableChange: setVariableValue,
    dropdown: getDropdownConfig() ?? null,
    dropdownValue: getDropdownValue(),
    onDropdownChange: setDropdownValue,
    multiSelect: getMultiSelectConfig(),
    multiSelectValues: toolMultiSelect[currentTool] ?? {},
    onMultiSelectChange: setMultiSelectValue,
    // A dropdown flagged workedExampleOnly (e.g. a "Method" choice that only
    // swaps the displayed working) has nothing to offer a printed worksheet.
    hideWorkedExampleOnly: mode === "worksheet",
    columns: defaults.qoColumns,
  };

  const diffQOProps = {
    toolSettings: getToolSettings(),
    levelVariables,
    onLevelVariableChange: handleLevelVarChange,
    levelDropdowns,
    onLevelDropdownChange: handleLevelDDChange,
    levelMultiSelect: {
      level1: getLevelMultiSelectValues("level1"),
      level2: getLevelMultiSelectValues("level2"),
      level3: getLevelMultiSelectValues("level3"),
    },
    onLevelMultiSelectChange: handleLevelMSChange,
    levels: diffLevels,
    hideWorkedExampleOnly: mode === "worksheet",
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
    if (mode === "worksheet" || mode === "teach" || mode === "depth") return;
    // reformatQuestion only applies to pure QO-option changes (same maths, new
    // display). A level or sub-tool switch must always yield a fresh question.
    if (!levelOrToolChanged && reformatQuestion) {
      const snap = getQOSnapshot();
      const reformatted = reformatQuestion(currentQuestion, snap);
      if (reformatted !== null) { setCurrentQuestion(reformatted); setShowAnswer(false); setWorkedResetNonce(n => n + 1); return; }
    }
    handleNewQuestion();
  }, [difficulty, currentTool, qoFingerprint]);

  // ── Shareable links: keep the URL in sync with the current setup ───────────
  // Only non-default values are written, so a freshly opened tool keeps a clean
  // URL. replaceState (not pushState), keeping any phone start-screen marker on the entry.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const p = new URLSearchParams();
    if (currentTool !== toolKeys[0]) p.set("tool", currentTool);
    if (mode !== "whiteboard") p.set("mode", mode === "single" ? "example" : mode === "teach" ? "teach" : mode === "depth" ? "depth" : "worksheet");
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
      if (isDifferentiated) {
        p.set("diff", "1");
        const levelToNum: Record<DifficultyLevel, string> = { level1: "1", level2: "2", level3: "3" };
        const isFullSet = diffLevels.length === availableLevels.length && diffLevels.every(l => availableLevels.includes(l));
        if (!isFullSet) p.set("diffLv", diffLevels.map(l => levelToNum[l]).join(","));
        if (!diffSameSize) p.set("diffSame", "0");
        if (!diffColorLevels) p.set("diffColor", "0");
      }
    }
    if (mode === "depth" && depthItemId) p.set("item", depthItemId);
    const qs = p.toString();
    window.history.replaceState(window.history.state, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [currentTool, mode, difficulty, toolDropdowns, toolVariables, toolMultiSelect, numQuestions, numColumns, isDifferentiated, diffLevels, diffSameSize, diffColorLevels, depthItemId]);

  // Persist the worksheet mode/layout and differentiated per-level QO so a refresh
  // restores it — these are not encoded in the URL.
  useEffect(() => {
    if (!wbStorageKey) return;
    try {
      sessionStorage.setItem(wbStorageKey, JSON.stringify({
        worksheetMode, worksheetLayout, worksheetBorders, smartProgressorEnabled,
        levelVariables, levelDropdowns, levelMultiSelect,
      } satisfies WBPersist));
    } catch { /* ignore quota / serialisation errors */ }
  }, [wbStorageKey, worksheetMode, worksheetLayout, worksheetBorders, smartProgressorEnabled, levelVariables, levelDropdowns, levelMultiSelect]);

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
    // Centred vertically (not top-aligned) so a cell stretched taller than its
    // own content — matching a level's tallest question, or every level's
    // tallest when "Fit all levels" is on — reads as one evenly-sized cell
    // rather than a tightly-wrapped question with dead space hanging below it.
    const cellStyle = borders
      ? { backgroundColor: bg, height: "100%", boxSizing: "border-box" as const, position: "relative" as const, borderRadius: "12px", border: "1px solid #e5e7eb", display: "flex" as const, flexDirection: "column" as const, justifyContent: "center" as const }
      : { height: "100%", boxSizing: "border-box" as const, position: "relative" as const, display: "flex" as const, flexDirection: "column" as const, justifyContent: "center" as const };
    const numEl = <span className="text-xs font-bold text-gray-400" style={{ position: "absolute", top: 4, left: 6 }}>{idx + 1}</span>;
    const wrapperClass = borders ? "rounded-2xl p-4 shadow-card group" : "p-4 group";

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
                  const isLvDisabled = comingSoon.includes(val);
                  const active = diffToggle ? diffLevels.includes(val) : difficulty === val;
                  return (
                    <button key={val} onClick={() => { if (!isLvDisabled) toggleDiffLevel(val); }}
                      className={`px-5 py-2 font-bold text-base transition-colors ${isLvDisabled ? "bg-gray-100 text-gray-300 cursor-not-allowed" : active ? `${col.bg} ${col.text}` : "bg-white text-gray-500 hover:bg-gray-50"}`}>
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
              {!defaults.fixedQuestions && (
                <div className="flex items-center gap-3">
                  <label className="text-base font-semibold text-gray-700">Questions:</label>
                  <input type="number" min="1" max="24" value={numQuestions}
                    onChange={e => setNumQuestions(Math.max(1, Math.min(24, parseInt(e.target.value) || (defaults.numQuestions ?? 15))))}
                    className="w-20 px-4 py-2 border border-slate-200 rounded-lg text-base font-semibold text-center" />
                </div>
              )}
              {!defaults.fixedColumns && (
                <div className="flex items-center gap-3">
                  <label className="text-base font-semibold text-gray-700">Columns:</label>
                  <input type="number" min="1" max={Math.min(defaults.maxColumns ?? 4, colCap)} value={isDifferentiated ? diffLevels.length : effCols}
                    onChange={e => { if (!isDifferentiated) setNumColumns(Math.max(1, Math.min(Math.min(defaults.maxColumns ?? 4, colCap), parseInt(e.target.value) || (defaults.numColumns ?? 3)))); }}
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

    return (
      <div className="px-5 py-4 rounded-2xl border border-slate-200" style={{ backgroundColor: qBg }}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 [&_button]:whitespace-nowrap">
          {showLevelToggle && <DifficultyToggle value={difficulty} onChange={v => setDifficultyGuarded(v as DifficultyLevel)} disabledLevels={comingSoon} levels={toolLevels} />}
          {qoEl()}
          <div className="flex gap-3 items-center">
            <button onClick={handleNewQuestion} className="px-4 sm:px-6 py-2 bg-blue-900 text-white rounded-xl font-semibold text-base hover:bg-blue-800 flex items-center gap-2">
              <RefreshCw size={18} /> New Question
            </button>
            <button onClick={() => mode === "whiteboard" ? setShowWhiteboardAnswer(!showWhiteboardAnswer) : setShowAnswer(!showAnswer)}
              className="px-4 sm:px-6 py-2 bg-blue-900 text-white rounded-xl font-semibold text-base hover:bg-blue-800 flex items-center gap-2">
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
        {showLevelToggle && <DifficultyToggle value={difficulty} onChange={v => setDifficultyGuarded(v as DifficultyLevel)} disabledLevels={comingSoon} levels={toolLevels} />}
        {qoEl()}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
  };

  // `compact` (narrow layout only) trims the padding sized for a desktop
  // whiteboard panel down to something reasonable on a phone-width column —
  // the desktop call site (renderWorkedExample()) is unaffected.
  const renderWorkedExample = (compact?: boolean) => {
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
        answerFontClass={displayFontSizes[displayFontSize]}
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
          <div style={{ background: fsToolbarBg, borderBottom: "2px solid #000", padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              {showLevelToggle && <DifficultyToggle value={difficulty} onChange={v => setDifficultyGuarded(v as DifficultyLevel)} disabledLevels={comingSoon} levels={toolLevels} />}
              {qoEl()}
            </div>
            {/* one row at every width: the buttons keep their words from 1100px up and are icons below that */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              <button onClick={handleNewQuestion} title="New Question" aria-label="New Question" className="px-3 min-[1100px]:px-5 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> <span className="hidden min-[1100px]:inline">New Question</span></button>
              <button onClick={() => setShowAnswer(a => !a)} title={showAnswer ? "Hide Answer" : "Show Answer"} aria-label={showAnswer ? "Hide Answer" : "Show Answer"} className="px-3 min-[1100px]:px-5 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> <span className="hidden min-[1100px]:inline">{showAnswer ? "Hide Answer" : "Show Answer"}</span></button>
              <button onClick={() => setWeFullscreen(false)} title="Exit Fullscreen (Esc)" aria-label="Exit fullscreen" className="px-3 min-[1100px]:px-4 py-2 rounded-xl font-bold text-base border border-slate-200 text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"><Minimize2 size={18} /> <span className="hidden min-[1100px]:inline">Exit</span></button>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex flex-col px-6 pb-3" style={{ backgroundColor: qBg }}>
            <div className={`relative text-center flex-shrink-0 ${showAnswer ? "py-3 max-h-[40%] overflow-y-auto" : "flex-1 flex flex-col items-center justify-center"}`}>
              {!hideFontControls && <div style={{ position: "absolute", top: 8, right: 0, display: "flex", gap: 6 }}>
                <button title="Smaller text" aria-label="Smaller text" style={fontBtn(canDisplayDecrease)} onClick={() => canDisplayDecrease && setDisplayFontSize(f => f - 1)}><ChevronDown size={16} color="#6b7280" /></button>
                <button title="Larger text" aria-label="Larger text" style={fontBtn(canDisplayIncrease)} onClick={() => canDisplayIncrease && setDisplayFontSize(f => f + 1)}><ChevronUp size={16} color="#6b7280" /></button>
              </div>}
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
          </div>
          {showAnswer && <div className={compact ? "flex-1 min-h-0" : undefined}>{stepsEl(false)}</div>}
        </div>
      </div>
    );
  };

  const renderWorksheet = () => {
    if (worksheet.length === 0) return (
      <div className="rounded-2xl border border-slate-300 shadow-card p-8 text-center" style={{ backgroundColor: qBg }}>
        <span className="text-2xl text-gray-400">Generate worksheet</span>
      </div>
    );
    // Chevrons stay hidden for diagram-first tools, except a text worksheet when the tool opts in (worksheetFontControls).
    const hideWsFontControls = hideFontControls && !(defaults.worksheetFontControls && !worksheet.some((q) => (q as unknown as { _fixedSizeCell?: boolean })._fixedSizeCell));
    const fontSizeControls = hideWsFontControls ? null : (
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button disabled={!canDecrease} onClick={() => canDecrease && setWorksheetFontSize(f => f - 1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canDecrease ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronDown size={20} /></button>
        <button disabled={!canIncrease} onClick={() => canIncrease && setWorksheetFontSize(f => f + 1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canIncrease ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronUp size={20} /></button>
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
      <div className="rounded-2xl border border-slate-300 shadow-card p-8 relative" style={{ backgroundColor: qBg }}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>
        <div className="grid gap-4" style={{
          alignItems: "start",
          gridTemplateColumns: `repeat(${diffLevels.length}, 1fr)`,
          ...(diffSameSize ? { gridTemplateRows: `auto repeat(${numQuestions}, 1fr)` } : {}),
        }}>
          {diffLevels.map((lv, colIdx) => {
            const lqs = worksheet.filter(q => q.difficulty === lv);
            const c = diffColorLevels ? LV_COLORS[lv] : NEUTRAL_LV_COLORS;
            if (diffSameSize) return (
              <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}
                style={{ gridColumn: colIdx + 1, gridRow: `1 / span ${numQuestions + 1}`, display: "grid", gridTemplateRows: "subgrid", gap: "0.75rem" }}>
                <h3 className={`text-xl font-bold text-center ${c.text}`} style={{ gridRow: 1 }}>{LV_LABELS[lv]}</h3>
                {lqs.map((q, idx) => (
                  <div key={idx} style={{ gridRow: idx + 2, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    {renderQCell(q, idx, c.fill)}
                  </div>
                ))}
              </div>
            );
            return (
              <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}>
                <h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>{LV_LABELS[lv]}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gridAutoRows: "1fr", gap: "0.75rem" }}>
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
        <div className="rounded-2xl border border-slate-300 shadow-card p-8 relative" style={{ backgroundColor: qBg }}>
          {fontSizeControls}
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${effCols}, 1fr)`, columnGap: "1.5rem" }}>
            {worksheet.map((q, idx) => renderListItem(q, idx))}
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-slate-300 shadow-card p-8 relative" style={{ backgroundColor: qBg }}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>
        {/* gridAutoRows: "1fr" — same explicit-row-track convention used for a
            differentiated level's own question list below — so every cell in a
            row is forced to the row's tallest occupant. Left at the CSS default
            ("auto") this pairs with async KaTeX rendering (content height
            changing after the grid's first layout pass) to sometimes leave a
            row uneven, matching what "Fit all levels" hit before it moved to
            explicit tracks. */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${effCols},1fr)`, gridAutoRows: "1fr", gap: "1rem" }}>
          {worksheet.map((q, idx) => <div key={idx} style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>{renderQCell(q, idx)}</div>)}
        </div>
      </div>
    );
  };

  // Shared by both the narrow and desktop shells below — same Home button +
  // hamburger menu, just sized down (compact=true) for the narrow layout's
  // tighter chrome. One definition so a future change to the header (a new
  // menu item, an info-modal tweak) can't land in one layout and not the other.
  const renderNavBar = (compact: boolean, title?: string, crumbs?: Array<{ label: string; onClick: () => void }>) => (
    <div id="tool-nav-bar" className="bg-blue-900 shadow-lg">
      <StatusBarTint barId="tool-nav-bar" />
      <div className={compact ? "px-2 py-1.5 flex justify-between items-center gap-2" : "max-w-6xl mx-auto px-8 py-4 flex justify-between items-center"}>
        <button onClick={() => { window.location.href = "/"; }} className={compact ? "flex items-center gap-1.5 text-white hover:bg-blue-800 px-2.5 py-1.5 rounded-lg transition-colors" : "flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"}>
          <Home size={compact ? 20 : 24} />{!compact && <span className="font-semibold text-lg">Home</span>}
        </button>
        {compact && title && (
          <div className="flex-1 min-w-0 text-center leading-tight">
            <div className="text-white font-semibold text-[15px] truncate">{title}</div>
            {crumbs && crumbs.length > 0 && (
              // a breadcrumb back to the start screens: each part reopens the step where it was chosen
              <div className="flex items-center justify-center gap-1 text-[12px] text-blue-200 whitespace-nowrap overflow-hidden">
                {crumbs.map((c, i) => (
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
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={compact ? "text-white hover:bg-blue-800 p-1.5 rounded-lg transition-colors" : "text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"}>
            {isMenuOpen ? <X size={compact ? 22 : 28} /> : <Menu size={compact ? 22 : 28} />}
          </button>
          {isMenuOpen && <MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={() => setIsMenuOpen(false)} onOpenInfo={() => setIsInfoOpen(true)} />}
        </div>
      </div>
    </div>
  );

  // Narrow layout: Worked Example + a light, in-app Worksheet list — no
  // Whiteboard/Teach, no differentiated builder, no print-oriented grid.
  // Built entirely from state/handlers already defined above, so it works for
  // every tool with zero per-tool code (diagram tools' questionRenderer /
  // answerRenderer overrides are respected exactly as in the desktop paths).
  const renderNarrowShell = () => {
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

    const modeChoices: Array<{ m: "single" | "worksheet" | "depth"; label: string; sub: string }> = [
      { m: "single", label: "Worked example", sub: "Step through a full solution" },
      { m: "worksheet", label: "Worksheet", sub: "A set of questions to try" },
      ...(showDepth ? [{ m: "depth" as const, label: "Depth", sub: "Diagnose, explain and extend" }] : []),
    ];
    if (!narrowStarted) {
      return (
        <div>
          {renderNavBar(true, config.pageTitle)}
          {isInfoOpen && <InfoModal infoSections={infoSections} onClose={() => setIsInfoOpen(false)} />}
          <div className="min-h-screen px-4 pt-6 pb-10" style={{ backgroundColor: PAGE_BG }}>
            <div className="max-w-md mx-auto flex flex-col gap-3">
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
        {isInfoOpen && <InfoModal infoSections={infoSections} onClose={() => setIsInfoOpen(false)} />}
        {openSkillId && <SkillOverlay skillId={openSkillId} onClose={() => setOpenSkillId(null)} />}

        <div className="min-h-screen px-3 pt-3 pb-24" style={{ backgroundColor: PAGE_BG }}>
          <div className="max-w-md mx-auto">
            {mode === "depth" && showDepth ? (
              <DepthMode narrow items={toolDepthItems} level={difficulty} onLevelChange={l => setDifficultyGuarded(l)} itemId={depthItemId} onItemChange={setDepthItemId} optionInfo={depthOptionInfo} activeOptions={depthActiveOptions} />
            ) : mode === "worksheet" ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                  {!defaults.fixedQuestions && (
                    <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg px-1">
                      <button onClick={() => setNumQuestions(n => Math.max(1, n - 1))} className="w-7 h-7 flex items-center justify-center text-gray-500 font-bold">−</button>
                      <span className="w-6 text-center font-bold text-sm text-gray-800">{numQuestions}</span>
                      <button onClick={() => setNumQuestions(n => Math.min(24, n + 1))} className="w-7 h-7 flex items-center justify-center text-gray-500 font-bold">+</button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2.5">
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
                          ? questionRenderer(q, revealed, colorScheme, true, idx, getQOSnapshot(), fontSizes[worksheetFontSize])
                          : <QuestionDisplay q={q} cls="text-base" />
                        }
                        {revealed && !questionRenderer && (
                          <div className="mt-2 pt-2 text-center font-bold text-sm" style={{ borderTop: "1px solid rgba(0,0,0,0.08)", color: "#059669" }}>
                            {answerRenderer ? answerRenderer(q, colorScheme, getQOSnapshot()) : <AnswerDisplay q={q} />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl border border-slate-300 shadow-card overflow-clip" style={showAnswer ? { height: "calc(100dvh - 12rem - env(safe-area-inset-bottom))", minHeight: "26rem" } : undefined}>
                  {renderWorkedExample(true)}
                </div>
              </>
            )}
          </div>
        </div>

        {(
          <div className={`fixed bottom-0 inset-x-0 z-40 bg-white px-3 flex gap-2 pt-2 border-t ${mode === "single" && showAnswer ? "border-transparent" : "border-slate-200"}`} style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))", height: "calc(3.75rem + env(safe-area-inset-bottom))", boxShadow: mode === "single" && showAnswer ? "none" : "0 -4px 16px rgba(0,0,0,0.06)" }}>
            {mode === "depth" ? (
              <button onClick={() => setNarrowDrawerOpen(true)} aria-label="Options" className="flex-1 h-12 gap-2 font-semibold text-base bg-white border border-slate-200 text-blue-900 rounded-xl flex items-center justify-center active:bg-slate-50"><SlidersHorizontal size={20} /> Options</button>
            ) : mode === "worksheet" ? (
              <>
                <button onClick={() => setNarrowDrawerOpen(true)} aria-label="Options" className="w-14 h-12 shrink-0 bg-white border border-slate-200 text-blue-900 rounded-xl flex items-center justify-center active:bg-slate-50"><SlidersHorizontal size={20} /></button>
                <button onClick={handleGenerateWorksheet} className="flex-1 h-12 bg-blue-900 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 active:bg-blue-800"><RefreshCw size={18} /> Generate</button>
                {worksheet.length > 0 && <button onClick={() => setShowWorksheetAnswers(x => !x)} className="flex-1 h-12 bg-blue-900 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 active:bg-blue-800"><Eye size={18} /> {showWorksheetAnswers ? "Hide all" : "Show all"}</button>}
              </>
            ) : (
              // one dock with the stepper above it: Options and New sit in the same two side columns as the step arrows, the answer button in the middle
              <>
                <button onClick={() => setNarrowDrawerOpen(true)} aria-label="Options" className="w-14 h-12 shrink-0 bg-white border border-slate-200 text-blue-900 rounded-xl flex items-center justify-center active:bg-slate-50"><SlidersHorizontal size={20} /></button>
                <button onClick={() => setShowAnswer(x => !x)} className="flex-1 h-12 bg-blue-900 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 active:bg-blue-800"><Eye size={18} /> {showAnswer ? "Hide answer" : "Show answer"}</button>
                <button onClick={handleNewQuestion} aria-label="New question" title="New question" className="w-14 h-12 shrink-0 bg-white border border-slate-200 text-blue-900 rounded-xl flex items-center justify-center active:bg-slate-50"><RefreshCw size={20} /></button>
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
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Difficulty</div>
                  <DifficultyToggle fullWidth value={difficulty} onChange={v => setDifficultyGuarded(v as DifficultyLevel)} disabledLevels={comingSoon} levels={toolLevels} />
                </div>
              )}
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Question options</div>
                <InlineQOPanel
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
  };

  if (isNarrow) return renderNarrowShell();

  return (
    <div>
      {renderNavBar(false)}
      {isInfoOpen && <InfoModal infoSections={infoSections} onClose={() => setIsInfoOpen(false)} />}
      {openSkillId && <SkillOverlay skillId={openSkillId} onClose={() => setOpenSkillId(null)} />}
      <div className="min-h-screen p-8" style={{ backgroundColor: PAGE_BG }}>
        <div className="max-w-6xl mx-auto">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-center mb-6" style={{ color: "#0f172a" }}>{config.pageTitle}</h1>
            {toolKeys.length > 1 && mode !== "teach" && (
              <>
                <div className="flex flex-col items-center gap-2.5 mb-6">
                  {(() => {
                    const rowSizes = defaults.toolTabRows ?? [toolKeys.length];
                    const rows: string[][] = [];
                    let idx = 0;
                    for (const size of rowSizes) { rows.push(toolKeys.slice(idx, idx + size)); idx += size; }
                    if (idx < toolKeys.length) rows.push(toolKeys.slice(idx));
                    return rows.map((row, ri) => (
                      <div key={ri} className="flex flex-wrap justify-center gap-2.5">
                        {row.map(k => (
                          <button key={k} onClick={() => { selectTool(k); }}
                            className={`px-5 py-2 rounded-full font-semibold text-[15px] transition-colors ${currentTool === k ? "bg-blue-900 border border-blue-900 text-white shadow-sm" : "bg-white border border-slate-300 text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-400"}`}>
                            {config.tools[k].name}
                          </button>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              </>
            )}
            <div className="flex justify-center gap-7 mb-6 border-b border-slate-300">
              {([...(["whiteboard", "single", "worksheet"] as const), ...(showTeach ? (["teach"] as const) : []), ...(showDepth ? (["depth"] as const) : [])] as const)
                .map(m => {
                  const label = m === "whiteboard" ? "Whiteboard" : m === "single" ? "Worked Example" : m === "teach" ? "Teach" : m === "depth" ? "Depth" : "Worksheet";
                  return (
                    <button key={m} onClick={() => { setMode(m); setPresenterMode(false); setWbFullscreen(false); setWeFullscreen(false); }}
                      className={`pb-3 -mb-px text-base font-semibold border-b-2 transition-colors ${mode === m ? "border-blue-900 text-blue-900" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
                      {label}
                    </button>
                  );
                })}
            </div>
          </div>

          {mode === "worksheet" && (
            worksheetMode === "advanced"
              ? <WorksheetBuilder
                  config={config}
                  generateQuestion={generateQuestion}
                  questionRenderer={questionRenderer}
                  customPrintHandler={customPrintHandler}
                  comingSoonLevels={comingSoon}
                  hideFontControls={hideFontControls}
                  initialTool={currentTool}
                  headerSlot={advancedToggle}
                />
              : <>
                  {renderControlBar()}
                  <div ref={worksheetWrapRef}>{renderWorksheet()}</div>
                </>
          )}
          {mode === "teach" && showTeach && teachingSlides && (
            <TeachingDeck slides={teachingSlides} />
          )}
          {mode === "depth" && showDepth && (
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-slate-300 shadow-card bg-white p-4 flex flex-wrap items-center justify-center gap-4">
                <DifficultyToggle value={difficulty} onChange={v => setDifficultyGuarded(v as DifficultyLevel)} disabledLevels={comingSoon} levels={toolLevels} />
                {/* the same Question Options as every other mode: they decide which Depth questions are possible */}
                {Object.keys(depthOptionInfo).length > 0 && qoEl()}
              </div>
              <DepthMode items={toolDepthItems} level={difficulty} onLevelChange={l => setDifficultyGuarded(l)} itemId={depthItemId} onItemChange={setDepthItemId} optionInfo={depthOptionInfo} activeOptions={depthActiveOptions} />
            </div>
          )}
          {mode !== "worksheet" && mode !== "teach" && mode !== "depth" && (
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-slate-300 shadow-card flex-shrink-0">
                {renderControlBar()}
              </div>
              <div className="rounded-2xl border border-slate-300 shadow-card overflow-hidden">
                {mode === "whiteboard" && renderWhiteboard()}
                {mode === "single" && renderWorkedExample()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
