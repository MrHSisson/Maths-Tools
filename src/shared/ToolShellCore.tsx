import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import { useDevMode } from "../devMode";
import { RefreshCw, Eye, Home, Menu, X } from "lucide-react";
import type { DifficultyLevel, AnyQuestion, WorkingStep, ToolConfig, InfoSection, PrintMode, QOSnapshot, ToolShellDefaults } from "./types";
import { PAGE_BG, getQuestionBg, getStepBg } from "./colors";
import { commonPrompt, withoutPrompt } from "./prompts";
import { normalizeMultiSelect, resolveMultiSelectValues, makeUniqueQ } from "./helpers";
import { loadKaTeX } from "./katex";
import { DifficultyToggle } from "./components/DifficultyToggle";
import { generateSeeded } from "./seededGenerate";
import { LevelInfoButton, LevelInfoDialog } from "./components/LevelInfoDialog";
import {
  StandardQOPopover,
  DiffQOPopover,
  
} from "./components/QOPopovers";
import { InfoModal } from "./components/InfoModal";
import { shouldAutoOpenAbout, markAboutSeen } from "./about";
import { MenuDropdown } from "./components/MenuDropdown";
import { type ToolLesson, type TeachHandoff } from "./lessons";
import type { PrintContext } from "./printDiagram";
import { WorksheetBuilder } from "./WorksheetBuilder";
import { LESSON_CHROME_REM } from "./slideSize";
import { TeachingDeck, SlideDeck, type TeachingSlide, type TeachLesson } from "./TeachingDeck";
import { DepthMode } from "./components/DepthMode";
import { depthOnTool, type DepthItem, type DepthOptionInfo } from "./depth";
import { SkillOverlay } from "./skills";
import { useQuestionKeeper } from "./questionKeeper";
import { PinButton } from "./components/PinButton";
import { useLayoutMode } from "./layoutMode";
import { LessonsPage } from "./components/LessonsPage";
import { useFullscreenFlag } from "./fullscreenFlag";
import { type LessonControls } from "./components/LessonBar";
import { levelOptionGroups } from "./levelOptions";
import { useWorksheetFit, WORKSHEET_FONT_SIZES as fontSizes } from "./useWorksheetFit";
import { buildWorksheet, regenerateWorksheetQuestion, type WorksheetBlock } from "./worksheetGenerate";
import { loadWbPersist, saveWbPersist, type WBPersist } from "./shellPersist";
import { ShellPartBoundary } from "./components/ShellPartBoundary";
import { reportShellFault, describeFault } from "./shellDiagnostics";
import { useVisualiser } from "./useVisualiser";
import { NarrowShell } from "./components/NarrowShell";
import { WorksheetView } from "./components/WorksheetView";
import { WorkedExampleView } from "./components/WorkedExampleView";
import { WhiteboardView } from "./components/WhiteboardView";
import { WorksheetControls } from "./components/WorksheetControls";
import { planQoChange, adaptQuestion } from "./questionLifecycle";
import { onlyDisplayOptionsChanged, initToolVariables, initToolDropdowns, initToolMultiSelect } from "./shellOptions";
import { readShellUrl, buildShellQuery, ALL_LEVELS } from "./shellUrl";
import { extras } from "./questionExtras";
import { printPrintable, type Printable } from "./printables";


export interface ToolShellProps {
  config: ToolConfig;
  /** Only for older notes; "About this tool" now reads the tool's purpose and levels from `<Tool>.about.ts` and its options from the config. */
  infoSections?: InfoSection[];
  /** Optional lessons for this tool: ordered steps (Depth, Whiteboard, Worksheet…) listed in the burger menu. */
  lessons?: ToolLesson[];
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
  stepRenderer?: (step: WorkingStep, qo?: QOSnapshot, reveal?: number) => JSX.Element | null;
  /** For steps whose working is a *visual that evolves* (a place value table filling in). Return the
   *  visual for such a step (null for any other). In the cascade and Show All, those steps then show
   *  only their caption in the list, and ONE visual — the current step's — updates in place beside it,
   *  instead of reprinting the whole table on every step. */
  stepVisualRenderer?: (step: WorkingStep, qo?: QOSnapshot) => JSX.Element | null | false;
  /** With `stepVisualRenderer`: keep each step's full working (its maths) in the list beside the picture,
   *  instead of a caption-only timeline. For equation-led tools whose picture (a SmartGrapher `step` build)
   *  grows alongside the working. */
  stepVisualKeepsWorking?: boolean;
  /** Where the `stepVisualRenderer` picture sits: beside the steps (default) or full width above them
   *  (wide, short pictures such as a number line). */
  stepVisualPlacement?: "side" | "top";
  /** Replaces QuestionDisplay in all modes. compact=true in worksheet cells, false in worked example/fullscreen, undefined in regular whiteboard. idx is the worksheet question index (only provided in worksheet cells). qo is the live QO state snapshot — use it for render-time reformatting (e.g. decimal/fraction toggle). */
  questionRenderer?: (q: AnyQuestion, showAnswer: boolean, compact?: boolean, idx?: number, qo?: QOSnapshot, fontClass?: string) => JSX.Element | null;
  /** Replaces the final answer box (AnswerDisplay). Shown when showAnswer=true. qo is the live QO state snapshot. */
  answerRenderer?: (q: AnyQuestion, qo?: QOSnapshot) => JSX.Element | null;
  /** Called when a QO option changes before falling back to full regeneration. Return a reformatted copy of the question, or null to trigger a new question instead. Use this for instant display-mode switches (e.g. decimal ↔ fraction) where the maths doesn't change. */
  reformatQuestion?: (q: AnyQuestion, qo: QOSnapshot) => AnyQuestion | null;
  /** Custom print handler for diagram tools. Receives the worksheet array, print mode, the worksheet container DOM element (for SVG extraction), and the live print context (columns, differentiated, etc.). Diagram tools should pass this to the shared handleDiagramPrint. */
  customPrintHandler?: (questions: AnyQuestion[], printMode: PrintMode, worksheetEl: HTMLElement | null, ctx: PrintContext) => void;
  /** Optional extra burger-menu items (e.g. "Print blank number lines"). `onClick` runs on a genuine click, so it may open a print window. */
  /** Ready-made A4 sheets (blank number lines, place value tables…) listed under "Printables" in the burger menu. */
  printables?: Printable[];
  /** Optional curated teaching slides. When provided, a "Teach" mode is shown
   *  that runs the slides as a PowerPoint-style deck (see TeachingDeck). */
  teachingSlides?: TeachingSlide[];
  /** Optional. Teach lessons (one per sub-tool topic) in place of the category deck: the Teach menu lists the lessons on the current tab. */
  teachingLessons?: TeachLesson[];
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
    render: (q: AnyQuestion, showAnswer: boolean, qo?: QOSnapshot) => JSX.Element | null;
  };
}


// Below this viewport width, ToolShell swaps its desktop chrome for a compact
// narrow layout — see isNarrow and renderNarrowShell further down.
const NARROW_BREAKPOINT = 640;

// Used for a differentiated worksheet's level columns when the teacher turns
// off "Colour levels" in Settings — plain neutral styling instead of each
// level's green/yellow/red tint. `fill` is left undefined so renderQCell
// falls back to its normal (non-differentiated) cell background.

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

export const ToolShellCore = ({ config, infoSections, generateQuestion, generateUniqueQ: generateUniqueQProp, defaults = {}, stepRenderer, stepVisualRenderer, stepVisualKeepsWorking, stepVisualPlacement, questionRenderer, answerRenderer, reformatQuestion, customPrintHandler, printables, teachingSlides, teachingLessons, depthItems, workingScaffold, lessonControls, onHandoff }: ToolShellProps & { lessonControls?: LessonControls; onHandoff?: (to: TeachHandoff) => void }) => {
  const generateUniqueQ = generateUniqueQProp ?? makeUniqueQ(generateQuestion);
  const toolKeys = Object.keys(config.tools);
  // Seeds a smaller default question font size on a narrow viewport (the
  // desktop/whiteboard default is sized for a projector, not a phone) — see
  // isNarrow below for the live viewport tracking used everywhere else.
  const narrowInit = typeof window !== "undefined" && window.innerWidth <= NARROW_BREAKPOINT;

  // ── Shareable links: read the initial state from the URL (parsed once; see shellUrl.ts) ──
  const [urlInit] = useState(() => readShellUrl(typeof window === "undefined" ? "" : window.location.search, config, defaults, narrowInit));

  // ── Worksheet builder persistence ─────────────────────────────────────────
  // The worksheet mode/layout and the differentiated per-level QO are NOT in the
  // URL (too large to encode), so they were lost on reload. Persist them to
  // sessionStorage (per tool route) so a refresh restores the setup. The advanced
  // builder's own group state lives inside <WorksheetBuilder> and is session-only.
  const wbStorageKey = typeof window === "undefined" ? "" : `mt-wb:${window.location.pathname}`;
  const [wbInit] = useState<WBPersist | null>(() => loadWbPersist(wbStorageKey));

  const [currentTool, setCurrentTool] = useState<string>(urlInit.tool);
  const [mode, setMode] = useState<"whiteboard" | "single" | "worksheet" | "teach" | "depth">(urlInit.mode);
  // Teach decks, lessons and the skill drill-downs are not live: they sit behind Developing-tools mode, like a tool that is not live.
  const devMode = useDevMode();
  const showTeach = !!(devMode && ((teachingSlides && teachingSlides.length) || (teachingLessons && teachingLessons.length)));
  // Depth (curated diagnose / explain / extend questions) is live for any tool that passes `depthItems`.
  const [depthItemId, setDepthItemId] = useState<string | null>(urlInit.item);
  const toolDepthItems = useMemo(
    () => (depthItems ?? []).filter((i) => depthOnTool(i, currentTool)),
    [depthItems, currentTool],
  );
  const showDepth = toolDepthItems.length > 0;
  // A lesson's Depth step plays inside the deck surface (same size and chrome as a Teach deck), not the Depth tab.
  const lessonDepthItem = (() => {
    const a = lessonControls?.active;
    const st = a && a.index !== null ? a.lesson.steps[a.index] : undefined;
    return st?.kind === "depth" && st.item ? (depthItems ?? []).find((i) => i.id === st.item) : undefined;
  })();
  // a lesson step's deck / Depth slide: the page drops its title, tabs and padding so the slide can be bigger
  const inLessonDeck = !!lessonControls?.active && (mode === "teach" || (mode === "depth" && !!lessonDepthItem));
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
  const [levelInfoOpen, setLevelInfoOpen] = useState(false);
  const toolLevelLabels = config.tools[currentTool]?.levelLabels;
  const levelInfoBtn = toolLevelLabels ? <LevelInfoButton onClick={() => setLevelInfoOpen(true)} /> : null;
  const levelInfoDialog = levelInfoOpen && toolLevelLabels
    ? <LevelInfoDialog title={config.tools[currentTool]?.name} labels={toolLevelLabels.slice(0, toolLevels.length)} level={toolLevels.indexOf(difficulty) + 1} onClose={() => setLevelInfoOpen(false)}
        optionsAt={i => levelOptionGroups(config.tools[currentTool], toolLevels[i])} onPickLevel={i => setDifficultyGuarded(toolLevels[i])} />
    : null;
  const setDifficultyGuarded = (v: DifficultyLevel) => { if (toolLevels.includes(v)) setDifficulty(v); };

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
  const availableLevels = toolLevels;
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
    const avail = levelsOf(k);
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

  const [toolVariables, setToolVariables] = useState(() => initToolVariables(config, urlInit));

  const [toolDropdowns, setToolDropdowns] = useState(() => initToolDropdowns(config, urlInit));

  const [toolMultiSelect, setToolMultiSelect] = useState(() => initToolMultiSelect(config, urlInit));

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

  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion>(() =>
    generateSeeded(() => generateQuestion(urlInit.tool, urlInit.level, toolVariables[urlInit.tool]?.[urlInit.level] ?? {}, toolDropdowns[`${urlInit.tool}__${urlInit.level}`] ?? "", toolMultiSelect[urlInit.tool] ?? {})));
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  // Staged reveal — a question may set `_stagedReveal: "<label>"` to insert one step
  // before the answer (e.g. "Show Plot"). The first press shows the preview (renderers
  // read qo.preview); the next shows the answer. Hiding the answer resets both.
  // `_stagedReveal` may also be a list of labels (["Show Ends", "Show Plot"]): each press shows the next step
  // (qo.previewStage counts them); the last step's button then hides it again.
  const [previewStage, setPreviewStage] = useState(0);
  useEffect(() => { setPreviewStage(0); }, [currentQuestion]);
  const previewShown = previewStage >= 1;
  const stagedRaw = extras(currentQuestion)._stagedReveal;
  const stagedLabels = stagedRaw ? (Array.isArray(stagedRaw) ? stagedRaw : [stagedRaw]) : [];
  // The preview button lives inside the question box (not the toolbar's Show Answer).
  // It hides once the answer is up, since the answer includes the preview.
  const stagedBtn = (answerShown: boolean) => stagedLabels.length && !answerShown ? (
    <button onClick={() => setPreviewStage(p => (p < stagedLabels.length ? p + 1 : p - 1))}
      className="mt-1 px-5 py-1.5 rounded-lg font-bold text-sm border-2 border-blue-900 text-blue-900 bg-white/70 hover:bg-white flex items-center gap-1.5">
      <Eye size={14} /> {previewStage < stagedLabels.length ? stagedLabels[previewStage] : stagedLabels[stagedLabels.length - 1].replace(/^Show/, "Hide")}
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
  const colorScheme = "default";   // the colour picker was removed (a future accessibility update); renderers still receive the value
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  // "About this tool" opens by itself the first time a live tool is opened on this device from a plain address (never from a shared link,
  // a lesson step or a set-up worksheet), then stays out of the way. The address is read at arrival, before the shell writes its own state to it.
  const arrivalSearch = useRef(typeof window === "undefined" ? "" : window.location.search);
  useEffect(() => {
    const path = window.location.pathname;
    if (shouldAutoOpenAbout(path, arrivalSearch.current)) { markAboutSeen(path); setIsInfoOpen(true); }
  }, []);
  const infoModal = isInfoOpen ? <InfoModal infoSections={infoSections ?? []} title={config.pageTitle} config={config} current={currentTool} onClose={() => setIsInfoOpen(false)} /> : null;
  const [lessonsOpen, setLessonsOpen] = useState(false);

  // ── Narrow-viewport layout ─────────────────────────────────────────────────
  // Below NARROW_BREAKPOINT, ToolShell swaps its desktop chrome for a compact
  // single-column layout limited to Worked Example + a light Worksheet list
  // (no Whiteboard/Teach — see renderNarrowShell near the end of this file).
  // Driven purely by viewport width, not a URL/user toggle, so shrinking a
  // desktop window narrow enough previews it too.
  // The three screen sizes (src/shared/layoutMode.ts): a phone and a tablet both use this narrow, touch-first flow (click-through start,
  // fixed bottom bar); a tablet lays it out wider and keeps the Whiteboard (the phone has none).
  const layout = useLayoutMode();
  const isPhone = layout.phone, isTablet = layout.tablet;
  const isNarrow = !layout.laptop;
  // Whiteboard and Teach have no narrow layout — coerce a stale mode=whiteboard
  // link (or a desktop session shrunk mid-Whiteboard) back to Worked Example.
  useEffect(() => { if (isPhone && (mode === "whiteboard" || mode === "teach")) setMode("single"); }, [isPhone, mode]);
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
  // plain random-order generation. Only shown in the Settings popover when
  // this tool is calibrated or has a balanced pool (see hasSmartProgressor) —
  // it's a no-op otherwise, so there's nothing to toggle.
  const [smartProgressorEnabled, setSmartProgressorEnabled] = useState(wbInit?.smartProgressorEnabled ?? true);
  const [hideRepeatedText, setHideRepeatedText] = useState(wbInit?.hideRepeatedText ?? true);
  const [condensedWording, setCondensedWording] = useState(wbInit?.condensedWording ?? false);
  const [wsSettingsOpen, setWsSettingsOpen] = useState(false);

  const [wbFullscreen, setWbFullscreen] = useState(false);
  const [weFullscreen, setWeFullscreen] = useState(false); // Worked Example fullscreen (steps fill the screen)
  const [wsFullscreen, setWsFullscreen] = useState(false); // Worksheet fullscreen (the sheet fills the screen's width)
  // Worksheet cells: with answers up a cell shows its ANSWER, large, instead of the question with the answer squeezed under it; a double-tap
  // flips one cell between the two (so answers can also be revealed one at a time). `flips` holds the cells flipped from the sheet's setting.
  const [flips, setFlips] = useState<Set<string>>(() => new Set());
  const lastTap = useRef<{ t: number; x: number; y: number; key: string } | null>(null);
  const cellTap = (e: React.PointerEvent, key: string) => {
    if ((e.target as HTMLElement).closest("button")) return;   // the regenerate button is its own target, never half of a double-tap
    const now = performance.now(), l = lastTap.current;
    if (l && l.key === key && now - l.t < 400 && Math.hypot(e.clientX - l.x, e.clientY - l.y) < 30) {
      lastTap.current = null;
      setFlips(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
    } else lastTap.current = { t: now, x: e.clientX, y: e.clientY, key };
  };
  const [fsCols, setFsCols] = useState(0);                  // columns while the worksheet is fullscreen (0 = follow the sheet, at least 3)
  const [splitPct, setSplitPct] = useState(40);
  const [scaffoldHidden, setScaffoldHidden] = useState(false);
  const [weScaffoldShown, setWeScaffoldShown] = useState(false); // Worked Example: representation box up before the steps (off by default)
  const [workingCollapsed, setWorkingCollapsed] = useState(defaults.collapseWorkingByDefault ?? false);
  const vis = useVisualiser(`${wbFullscreen}${workingCollapsed}`);
  const { presenterMode, setPresenterMode, camDevices, currentCamId, camError, camDropdownOpen, setCamDropdownOpen, videoRef, camDropdownRef, longPressTimer, didLongPress, startCam } = vis;
  useFullscreenFlag(presenterMode || wbFullscreen || weFullscreen || wsFullscreen);   // the lesson step bar hides itself meanwhile

  const worksheetWrapRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadKaTeX(); }, []);
  // If Teach isn't available (dev mode off, or a stale mode=teach link), fall back.
  useEffect(() => { if (mode === "teach" && !showTeach) setMode("whiteboard"); }, [mode, showTeach]);
  useEffect(() => { if (mode === "depth" && !showDepth) setMode(isNarrow ? "single" : "whiteboard"); }, [mode, showDepth, isNarrow]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setPresenterMode(false); setWbFullscreen(false); setWeFullscreen(false); setWsFullscreen(false); } };
    document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h);
  }, [setPresenterMode]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberate: getMultiSelectConfig is rebuilt every render; its result only changes with these three
  }, [currentTool, difficulty, config]);
  const depthActiveOptions = useMemo(() => {
    const vals = resolveMultiSelectValues(getMultiSelectConfig(), toolMultiSelect[currentTool] ?? {});
    return new Set(Object.keys(depthOptionInfo).filter(v => vals[v]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberate: getMultiSelectConfig is rebuilt every render; its result only changes with these inputs
  }, [currentTool, difficulty, config, toolMultiSelect, depthOptionInfo]);

  // Whether the "Smart Progressor" Settings toggle is worth showing: the tool is calibrated (orders easy to hard) or has a `balanced`
  // multiSelect pool at some level (spreads its options evenly). It's a no-op otherwise.
  const hasSmartProgressor = config.calibrated === true || (() => {
    const t = getToolSettings();
    const allGroups = [
      ...normalizeMultiSelect(t.multiSelect),
      ...(["level1", "level2", "level3"] as DifficultyLevel[]).flatMap(lv => normalizeMultiSelect(t.difficultySettings?.[lv]?.multiSelect)),
    ];
    return allGroups.some(g => g.balanced === true);
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
  const maxCols = defaults.maxColumnsByTool?.[currentTool] ?? defaults.maxColumnsByLevel?.[difficulty] ?? defaults.maxColumns ?? 4;
  const effCols = Math.min(numColumns, colCap, maxCols);
  // fullscreen worksheet: the text size fits the screen by itself (see useWorksheetFit)
  const { fsAuto, setFsAuto, fsAutoIdx, fsScrollRef, fsSettled, fsProbe, fsFit } = useWorksheetFit({ active: wsFullscreen, cols: fsCols, effCols, worksheet, showAnswers: showWorksheetAnswers });
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
    previewStage,
    scaffoldVisible: !!workingScaffold && mode === "whiteboard" && !scaffoldHidden
      && (workingScaffold.placement === "question" || (!presenterMode && !workingCollapsed)),
  });

  const generateNow = (): AnyQuestion =>
    generateQuestion(currentTool, difficulty, getVariableValues(), getDropdownValue(), toolMultiSelect[currentTool] ?? {});
  const makeQuestion = (): AnyQuestion => generateSeeded(generateNow);

  // Where the shell is, recorded with any failure so it names the setup it broke under.
  const faultContext = { tool: currentTool, level: difficulty, mode };
  // A generator that throws must not freeze the page: the failure is recorded, a note names it, and the question / sheet on screen stays.
  const [generationFault, setGenerationFault] = useState<string | null>(null);
  const attempt = <T,>(part: string, fn: () => T): T | undefined => {
    try { const r = fn(); setGenerationFault(null); return r; }
    catch (e) { setGenerationFault(describeFault(reportShellFault(part, e, faultContext))); return undefined; }
  };
  /** One screen of the shell, isolated: if it fails to draw, only it is replaced by a message naming it. */
  const screen = (part: string, node: ReactNode, resetKey?: unknown) => (
    <ShellPartBoundary part={part} context={faultContext} resetKey={resetKey}>{node}</ShellPartBoundary>
  );

  const handleNewQuestion = () => {
    const q = attempt("Question generator", makeQuestion);
    if (!q) return;
    setCurrentQuestion(q);
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
    setWorkedResetNonce(n => n + 1);
  };

  const handleGenerateWorksheet = () => {
    const t = getToolSettings();
    const blocks: WorksheetBlock[] = isDifferentiated
      ? diffLevels.map(lv => {
          const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
          const msVals = getLevelMultiSelectValues(lv);
          return {
            level: lv, variables: levelVariables[lv] ?? {}, dropdownValue: levelDropdowns[lv] ?? (dd?.defaultValue ?? ""),
            groups: normalizeMultiSelect(t.difficultySettings?.[lv]?.multiSelect ?? t.multiSelect), multiSelectValues: msVals, calibratedMultiSelectValues: msVals,
          };
        })
      : (() => {
          const msVals = toolMultiSelect[currentTool] ?? {};
          return [{
            level: difficulty, variables: getVariableValues(), dropdownValue: getDropdownValue(), groups: getMultiSelectConfig(),
            multiSelectValues: msVals, calibratedMultiSelectValues: resolveMultiSelectValues(getMultiSelectConfig(), msVals),
          }];
        })();
    const sheet = attempt("Worksheet generation", () => buildWorksheet({ tool: currentTool, numQuestions, smartProgressor: smartProgressorEnabled, generateQuestion, generateUniqueQ, blocks }));
    if (!sheet) return;
    setWorksheet(sheet);
    setShowWorksheetAnswers(false);
  };


  const regenQuestion = (idx: number) => {
    const replacement = attempt("Question generator", () => regenerateWorksheetQuestion(worksheet, idx, currentTool, generateQuestion));
    if (replacement) setWorksheet(prev => prev.map((w, i) => i === idx ? replacement : w));
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
  const restoredQ = useRef<AnyQuestion | null>(null);   // set when a recent / pinned question is put back: the setup change that follows must not regenerate it

  const prevQoRef = useRef({ dd: getDropdownValue(), vars: getVariableValues(), ms: (toolMultiSelect[currentTool] ?? {}) as Record<string, boolean> });

  // Changing a Question Option never throws the current question away: the next one follows the new options, so a teacher can
  // change their mind without losing the question on screen. The one exception is an option that only changes how the SAME
  // question is shown (`displayOnly`, or a method dropdown): the question is then redrawn at once from its saved seed.
  // A level or sub-tool switch always gives a fresh question.
  useEffect(() => {
    const levelOrToolChanged = prevDiffRef.current !== difficulty || prevToolRef.current !== currentTool;
    prevDiffRef.current = difficulty;
    prevToolRef.current = currentTool;
    const before = prevQoRef.current;
    const after = { dd: getDropdownValue(), vars: getVariableValues(), ms: (toolMultiSelect[currentTool] ?? {}) as Record<string, boolean> };
    prevQoRef.current = after;
    const action = planQoChange({ mode, restoredCurrent: !!restoredQ.current && restoredQ.current === currentQuestion, levelOrToolChanged });
    if (action === "ignore") return;
    if (action === "fresh") { handleNewQuestion(); return; }
    const next = attempt("Question options change", () => adaptQuestion(
      currentQuestion,
      reformatQuestion ? () => reformatQuestion(currentQuestion, getQOSnapshot()) : undefined,
      onlyDisplayOptionsChanged(before, after, getDropdownConfig(), getVariablesConfig() ?? [], getMultiSelectConfig()),
      generateNow,
    ));
    if (next) { setCurrentQuestion(next); setShowAnswer(false); setWorkedResetNonce(n => n + 1); }
  }, [difficulty, currentTool, qoFingerprint]); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: runs only when the level, sub-tool or options change, and reads the latest values of everything else
  useEffect(() => { restoredQ.current = null; });   // after the effect above has had its say

  // ── Recent and pinned questions (burger menu; this visit only) ───────────────
  type KeptState = { q: AnyQuestion; tool: string; level: DifficultyLevel; vars: Record<string, boolean>; ms: Record<string, boolean>; dd: string };
  const keptLabel = (q: AnyQuestion) => {
    const plain = (t: string) => t.replace(/\$/g, "").replace(/\\times/g, "×").replace(/\\div/g, "÷").replace(/\\cdot/g, "·").replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1/$2)").replace(/\\(left|right)/g, "").replace(/\\[a-zA-Z]+/g, "").replace(/[{}\\]/g, "");
    const text = plain(q.kind === "worded" ? q.lines.join(" ") : q.display || q.displayLatex || "").replace(/\s+/g, " ").trim();
    return `${toolKeys.length > 1 ? `${config.tools[currentTool].name} · ` : ""}L${difficulty.slice(-1)} · ${text.length > 60 ? `${text.slice(0, 58)}…` : text}`;
  };
  const keeper = useQuestionKeeper<KeptState>(
    { id: currentQuestion.key, label: keptLabel(currentQuestion), state: { q: currentQuestion, tool: currentTool, level: difficulty, vars: getVariableValues(), ms: toolMultiSelect[currentTool] ?? {}, dd: getDropdownValue() } },
    (k) => {
      restoredQ.current = k.q;
      if (mode === "worksheet" || mode === "teach" || mode === "depth") setMode(isNarrow ? "single" : "whiteboard");
      setCurrentTool(k.tool);
      setDifficulty(k.level);
      setToolVariables(p => ({ ...p, [k.tool]: { ...(p[k.tool] ?? {}), [k.level]: k.vars } }));
      setToolMultiSelect(p => ({ ...p, [k.tool]: k.ms }));
      if (k.dd) setToolDropdowns(p => ({ ...p, [`${k.tool}__${k.level}`]: k.dd }));
      setCurrentQuestion(k.q);
      setShowWhiteboardAnswer(false);
      setShowAnswer(false);
      setWorkedResetNonce(n => n + 1);
    },
  );
  const keeperOn = mode === "worksheet" ? undefined : keeper;   // worksheets are many questions: no pin / recent

  // ── Shareable links: keep the URL in sync with the current setup ───────────
  // Only non-default values are written, so a freshly opened tool keeps a clean
  // URL. replaceState (not pushState), keeping any phone start-screen marker on the entry.
  useEffect(() => {
    const p = buildShellQuery({ currentTool, mode, difficulty, toolDropdowns, toolVariables, toolMultiSelect, numQuestions, numColumns, isDifferentiated, diffLevels, availableLevels, diffSameSize, diffColorLevels, depthItemId }, config, defaults);
    // A running lesson keeps its markers in the link, so a refresh or a shared link resumes the same step.
    const lessonNow = new URLSearchParams(window.location.search);
    if (lessonNow.get("lesson")) {
      p.set("lesson", lessonNow.get("lesson") ?? "");
      if (lessonNow.get("step") !== null) p.set("step", lessonNow.get("step") ?? "0");
    }
    const qs = p.toString();
    window.history.replaceState(window.history.state, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [currentTool, mode, difficulty, toolDropdowns, toolVariables, toolMultiSelect, numQuestions, numColumns, isDifferentiated, diffLevels, diffSameSize, diffColorLevels, depthItemId]); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: config, defaults and availableLevels are fixed for a sub-tool, and defaults is a fresh object each render

  // Persist the worksheet mode/layout and differentiated per-level QO so a refresh
  // restores it — these are not encoded in the URL.
  useEffect(() => {
    saveWbPersist(wbStorageKey, { worksheetMode, worksheetLayout, worksheetBorders, smartProgressorEnabled, hideRepeatedText, condensedWording, levelVariables, levelDropdowns, levelMultiSelect });
  }, [wbStorageKey, worksheetMode, worksheetLayout, worksheetBorders, smartProgressorEnabled, hideRepeatedText, condensedWording, levelVariables, levelDropdowns, levelMultiSelect]);

  // A link that points straight at a worksheet generates it on arrival —
  // a bookmarked worksheet link is ready to teach from without extra clicks.
  // The advanced builder generates on demand from its own Generate button.
  useEffect(() => {
    if (urlInit.mode !== "worksheet") return;
    if (worksheetMode !== "advanced") handleGenerateWorksheet();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: once, on arrival from a worksheet link

  const displayFontSizes = ["text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl"];
  const canDisplayIncrease = displayFontSize < displayFontSizes.length - 1;
  const canDisplayDecrease = displayFontSize > 0;

  // the instruction ("Simplify:") is a quiet label above the maths, so it is a step smaller and never larger than text-base at the default size
  // the worksheet text size in use: fullscreen fits itself to the screen (until a text-size button is pressed), otherwise the chevrons' size
  const wfs = wsFullscreen && fsAuto ? fsAutoIdx : worksheetFontSize;
  const instrSizeCls = wfs <= 1 ? "text-base" : fontSizes[Math.min(wfs - 1, 3)];
  const canIncrease = wfs < fontSizes.length - 1;
  const canDecrease = wfs > 0;
  const stepFont = (d: number) => { setWorksheetFontSize(Math.max(0, Math.min(fontSizes.length - 1, wfs + d))); setFsAuto(false); };
  useEffect(() => { setFlips(new Set()); }, [worksheet, showWorksheetAnswers]);

  // A prompt every question shares ("Simplify:") is said once above the sheet on screen, not in every cell (standard sheets of plain
  // text questions only; print is unchanged). The Settings popover can switch it off.
  const promptsOn = !getInstruction() && !questionRenderer;
  const levelPrompt = (lv: DifficultyLevel) => (promptsOn ? commonPrompt(worksheet.filter(q => q.difficulty === lv)) : null);   // differentiated: each level says its own prompt once
  const sharedPrompt = !isDifferentiated ? (promptsOn ? commonPrompt(worksheet) : null) : diffLevels.map(levelPrompt).find(Boolean) ?? null;
  const sheetPrompt = hideRepeatedText ? sharedPrompt : null;
  const shownSheet = sheetPrompt ? worksheet.map(withoutPrompt) : worksheet;
  const promptBanner = sheetPrompt ? <div className={`${fontSizes[Math.min(fontSizes.length - 1, wfs + 1)]} font-semibold text-center mb-5`} style={{ color: "#111827" }}>{sheetPrompt}</div> : null;

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
      return (
        screen("Worksheet controls", <WorksheetControls
          advancedToggle={advancedToggle} config={config} defaults={defaults} currentTool={currentTool} customPrintHandler={customPrintHandler}
          getInstruction={getInstruction} qoEl={qoEl}
          showLevelToggle={showLevelToggle} toolLevels={toolLevels} availableLevels={availableLevels} difficulty={difficulty}
          diffToggle={diffToggle} diffLevels={diffLevels} isDifferentiated={isDifferentiated} toggleDiffLevel={toggleDiffLevel} toggleDiffMode={toggleDiffMode}
          diffSameSize={diffSameSize} setDiffSameSize={setDiffSameSize} diffColorLevels={diffColorLevels} setDiffColorLevels={setDiffColorLevels}
          numQuestions={numQuestions} setNumQuestions={setNumQuestions} effCols={effCols} maxCols={maxCols} colCap={colCap} setNumColumns={setNumColumns}
          wsSettingsOpen={wsSettingsOpen} setWsSettingsOpen={setWsSettingsOpen}
          worksheetLayout={worksheetLayout} setWorksheetLayout={setWorksheetLayout} worksheetBorders={worksheetBorders} setWorksheetBorders={setWorksheetBorders}
          condensedWording={condensedWording} setCondensedWording={setCondensedWording}
          sharedPrompt={sharedPrompt} hideRepeatedText={hideRepeatedText} setHideRepeatedText={setHideRepeatedText}
          hasSmartProgressor={hasSmartProgressor} smartProgressorEnabled={smartProgressorEnabled} setSmartProgressorEnabled={setSmartProgressorEnabled}
          worksheet={worksheet} worksheetWrapRef={worksheetWrapRef} handleGenerateWorksheet={handleGenerateWorksheet}
          showWorksheetAnswers={showWorksheetAnswers} setShowWorksheetAnswers={setShowWorksheetAnswers} printMode={printMode} setPrintMode={setPrintMode}
        />)
      );
    }

    return (
      <div className="px-5 py-4 rounded-2xl border border-slate-200" style={{ backgroundColor: qBg }}>
        <div className="flex flex-wrap items-center justify-between gap-x-2 xl:gap-x-4 gap-y-3 [&_button]:whitespace-nowrap">
          {showLevelToggle && <div className="flex items-center gap-1.5"><DifficultyToggle value={difficulty} onChange={v => setDifficultyGuarded(v as DifficultyLevel)} levels={toolLevels} />{levelInfoBtn}</div>}
          {qoEl()}
          <div className="flex gap-2 xl:gap-3 items-center">
            <PinButton keeper={keeperOn} />
            <button onClick={handleNewQuestion} className="px-4 xl:px-6 py-2 bg-blue-900 text-white rounded-xl font-semibold text-base hover:bg-blue-800 flex items-center gap-2">
              <RefreshCw size={18} /> New Question
            </button>
            <button onClick={() => mode === "whiteboard" ? setShowWhiteboardAnswer(!showWhiteboardAnswer) : setShowAnswer(!showAnswer)}
              className="px-4 xl:px-6 py-2 bg-blue-900 text-white rounded-xl font-semibold text-base hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18} /> {(mode === "whiteboard" ? showWhiteboardAnswer : showAnswer) ? "Hide Answer" : "Show Answer"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWhiteboard = () => (
    screen("Whiteboard", <WhiteboardView
      questionRenderer={questionRenderer} answerRenderer={answerRenderer} workingScaffold={workingScaffold}
      levels={{ difficulty, toolLevels, showLevelToggle, levelInfoBtn, setDifficultyGuarded }}
      question={{ currentQuestion, showWhiteboardAnswer, setShowWhiteboardAnswer, stagedBtn, getQOSnapshot, handleNewQuestion, getInstruction, qoEl, keeperOn }}
      font={{ displayFontSize, setDisplayFontSize, displayFontSizes, canDisplayIncrease, canDisplayDecrease, hideFontControls }}
      panel={{ wbFullscreen, setWbFullscreen, workingCollapsed, setWorkingCollapsed, scaffoldHidden, setScaffoldHidden, splitPct, setSplitPct, isDraggingRef, splitContainerRef }}
      vis={{ presenterMode, setPresenterMode, camDevices, currentCamId, camError, camDropdownOpen, setCamDropdownOpen, videoRef, camDropdownRef, longPressTimer, didLongPress, startCam }}
      bg={{ qBg, stepBg, fsToolbarBg, fsQuestionBg, fsWorkingBg }}
    />, currentQuestion.key)
  );

  // `compact` (narrow layout only) trims the padding sized for a desktop
  // whiteboard panel down to something reasonable on a phone-width column —
  // the desktop call site (renderWorkedExample()) is unaffected.
  const renderWorkedExample = (compact?: boolean) => (
    screen("Worked Example", <WorkedExampleView
      answerRenderer={answerRenderer} questionRenderer={questionRenderer} stepRenderer={stepRenderer} stepVisualRenderer={stepVisualRenderer} stepVisualKeepsWorking={stepVisualKeepsWorking} stepVisualPlacement={stepVisualPlacement} workingScaffold={workingScaffold} compact={compact} skillLinks={devMode} setOpenSkillId={setOpenSkillId} hideAnswerStep={hideAnswerStep} workedExampleLayout={workedExampleLayout} workedResetNonce={workedResetNonce}
      levels={{ difficulty, toolLevels, showLevelToggle, levelInfoBtn, setDifficultyGuarded }}
      question={{ currentQuestion, showAnswer, setShowAnswer, stagedBtn, getQOSnapshot, handleNewQuestion, getInstruction, qoEl, keeperOn }}
      font={{ displayFontSize, setDisplayFontSize, displayFontSizes, canDisplayIncrease, canDisplayDecrease, hideFontControls }}
      panel={{ weFullscreen, setWeFullscreen, weScaffoldShown, setWeScaffoldShown }}
      bg={{ qBg, fsToolbarBg }}
    />, currentQuestion.key)
  );

  const renderWorksheet = () => (
    screen("Worksheet", <WorksheetView
      config={config} defaults={defaults} currentTool={currentTool} questionRenderer={questionRenderer} answerRenderer={answerRenderer} hideFontControls={hideFontControls} getInstruction={getInstruction} getQOSnapshot={getQOSnapshot} regenQuestion={regenQuestion}
      sheet={{ worksheet, shownSheet, showWorksheetAnswers, setShowWorksheetAnswers, worksheetLayout, worksheetBorders, hideRepeatedText, condensedWording, flips, cellTap, numQuestions, effCols, sheetPrompt, levelPrompt, promptBanner }}
      diff={{ isDifferentiated, diffLevels, diffSameSize, diffColorLevels }}
      fit={{ wsFullscreen, setWsFullscreen, fsCols, setFsCols, fsAuto, setFsAuto, fsScrollRef, fsSettled, fsProbe, fsFit, wfs, instrSizeCls, canIncrease, canDecrease, stepFont }}
      bg={{ qBg, stepBg }}
    />, worksheet)
  );

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
          {lessonsOpen && lessonControls && <LessonsPage title={config.pageTitle} lessons={lessonControls.lessons} onPick={(id) => { setLessonsOpen(false); lessonControls.start(id); }} onClose={() => setLessonsOpen(false)} />}
          {isMenuOpen && <MenuDropdown onClose={() => setIsMenuOpen(false)} onOpenInfo={() => setIsInfoOpen(true)} lessons={lessonControls?.lessons} onOpenLessons={() => setLessonsOpen(true)} printables={printables?.map((p) => ({ label: p.label, hint: p.hint, onClick: () => printPrintable(p) }))} keeper={keeperOn} />}
        </div>
      </div>
    </div>
  );

  // Narrow layout: Worked Example + a light, in-app Worksheet list — no
  // Whiteboard/Teach, no differentiated builder, no print-oriented grid.
  // Built entirely from state/handlers already defined above, so it works for
  // every tool with zero per-tool code (diagram tools' questionRenderer /
  // answerRenderer overrides are respected exactly as in the desktop paths).
  const renderNarrowShell = () => (
    screen("Phone layout", <NarrowShell
      config={config} infoSections={infoSections} toolKeys={toolKeys} currentTool={currentTool} questionRenderer={questionRenderer} answerRenderer={answerRenderer} layout={layout} isTablet={isTablet} qBg={qBg} renderNavBar={renderNavBar} renderWorkedExample={renderWorkedExample} getToolSettings={getToolSettings} getInstruction={getInstruction} getQOSnapshot={getQOSnapshot} keeperOn={keeperOn}
      nav={{ mode, setMode, narrowStarted, setNarrowStarted, launchStep, setLaunchStep, narrowDrawerOpen, setNarrowDrawerOpen, infoModal, openSkillId, setOpenSkillId, levelInfoDialog }}
      levels={{ difficulty, toolLevels, showLevelToggle, levelInfoBtn, setDifficultyGuarded, selectTool }}
      options={{ toolMultiSelect, getDropdownValue, setDropdownValue, getVariableValues, setVariableValue, setMultiSelectValue }}
      depth={{ showDepth, toolDepthItems, depthItemId, setDepthItemId, depthOptionInfo, depthActiveOptions }}
      question={{ showAnswer, setShowAnswer, handleNewQuestion }}
      sheet={{ numQuestions, setNumQuestions, worksheet, showWorksheetAnswers, setShowWorksheetAnswers, worksheetFontSize, narrowRevealed, setNarrowRevealed, handleGenerateWorksheet }}
    />, currentQuestion.key)
  );

  // a tablet starts on the touch start screens like a phone; once it has chosen Whiteboard (or Teach) it uses the big-screen page for that mode
  const faultNote = generationFault && (
    <div role="alert" className="fixed inset-x-3 top-3 z-[300] mx-auto flex max-w-xl items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-slate-800 shadow-lift">
      <span className="min-w-0 flex-1 break-words"><b className="font-semibold">That did not work.</b> Your question is unchanged. <span className="font-mono text-xs text-slate-500">{generationFault}</span></span>
      <button onClick={() => setGenerationFault(null)} className="shrink-0 font-semibold text-blue-900">Dismiss</button>
    </div>
  );

  if (isNarrow && !(isTablet && narrowStarted && (mode === "whiteboard" || mode === "teach"))) return <>{faultNote}{renderNarrowShell()}</>;

  return (
    <div>
      {faultNote}
      {renderNavBar(false)}
      {infoModal}{levelInfoDialog}
      {openSkillId && <SkillOverlay skillId={openSkillId} onClose={() => setOpenSkillId(null)} />}
      <div className={inLessonDeck ? "min-h-screen px-8 pt-3 pb-4" : "min-h-screen p-8"} style={{ backgroundColor: PAGE_BG }}>
        <div className={inLessonDeck ? "mx-auto" : "max-w-6xl mx-auto"}>
          {!inLessonDeck && <div>
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
              {([...(["whiteboard", "single", "worksheet"] as const), ...(showTeach && teachingSlides && teachingSlides.length ? (["teach"] as const) : []), ...(showDepth ? (["depth"] as const) : [])] as const)
                .map(m => {
                  const label = m === "whiteboard" ? "Whiteboard" : m === "single" ? "Worked Example" : m === "teach" ? "Teach" : m === "depth" ? "Depth" : "Worksheet";
                  return (
                    <button key={m} onClick={() => { setMode(m); setNarrowStarted(true); setPresenterMode(false); setWbFullscreen(false); setWeFullscreen(false); setWsFullscreen(false); }}
                      className={`pb-3 -mb-px text-base font-semibold border-b-2 transition-colors ${mode === m ? "border-blue-900 text-blue-900" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
                      {label}
                    </button>
                  );
                })}
            </div>
          </div>}

          {mode === "worksheet" && (
            worksheetMode === "advanced"
              ? screen("Advanced worksheet builder", <WorksheetBuilder
                  config={config}
                  generateQuestion={generateQuestion}
                  questionRenderer={questionRenderer}
                  customPrintHandler={customPrintHandler}
                  hideFontControls={hideFontControls}
                  initialTool={currentTool}
                  headerSlot={advancedToggle}
                />)
              : <>
                  {renderControlBar()}
                  <div ref={worksheetWrapRef}>{renderWorksheet()}</div>
                </>
          )}
          {mode === "teach" && showTeach && (
            screen("Teach deck", <TeachingDeck slides={teachingSlides} lessons={teachingLessons} tool={currentTool} onHandoff={onHandoff} initialLesson={new URLSearchParams(window.location.search).get("deck") ?? undefined} onFinish={lessonControls?.active ? () => lessonControls.go(1) : undefined} onBack={lessonControls?.active ? lessonControls.overview : undefined} />)
          )}
          {mode === "depth" && lessonDepthItem && lessonControls?.active && (
            <div>
              <button onClick={lessonControls.overview} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900">← Lesson</button>
              <SlideDeck key={lessonDepthItem.id} slides={[{ kind: "depth", category: "concept", title: lessonDepthItem.title, item: lessonDepthItem }]} color="#1e3a8a" onDone={() => lessonControls.go(1)} doneLabel="Next step ▸" chromeRem={LESSON_CHROME_REM} />
            </div>
          )}
          {mode === "depth" && showDepth && !lessonDepthItem && (
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-slate-300 shadow-card bg-white p-4 flex flex-wrap items-center justify-center gap-4">
                <div className="flex items-center gap-1.5"><DifficultyToggle value={difficulty} onChange={v => setDifficultyGuarded(v as DifficultyLevel)} levels={toolLevels} />{levelInfoBtn}</div>
                {/* the same Question Options as every other mode: they decide which Depth questions are possible */}
                {Object.keys(depthOptionInfo).length > 0 && qoEl()}
              </div>
              {screen("Depth", <DepthMode items={toolDepthItems} level={difficulty} onLevelChange={l => setDifficultyGuarded(l)} itemId={depthItemId} onItemChange={setDepthItemId} optionInfo={depthOptionInfo} activeOptions={depthActiveOptions} />)}
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
