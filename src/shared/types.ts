// Shared types for the tool shell. Import these instead of redefining locally.

export type DifficultyLevel = "level1" | "level2" | "level3";
export type PrintMode = "both" | "questions" | "answers";

export interface WorkingStep {
  type: string;
  latex: string;
  plain: string;
  label?: string;
  unit?: string;
  /** Reveal-in-parts fragments (live modelling). Set automatically when the
   *  step()/mStep() helpers are given a string[] — latex is the joined string,
   *  so print/show-all/tests see one normal KaTeX string. Only the dev-gated
   *  step-by-step Worked Example mode walks the fragments one press at a time. */
  frags?: string[];
  extra?: unknown;
}

export interface SimpleQuestion {
  kind: "simple";
  display: string;
  displayLatex?: string;
  answer: string;
  answerLatex?: string;
  answerSuffix?: string;
  working: WorkingStep[];
  key: string;
  difficulty: string;
  _qo?: unknown;
}

export interface WordedQuestion {
  kind: "worded";
  lines: string[];
  answer: string;
  answerLatex?: string;
  answerSuffix?: string;
  working: WorkingStep[];
  key: string;
  difficulty: string;
  _qo?: unknown;
}

export type AnyQuestion = SimpleQuestion | WordedQuestion;

// Ratio table — a core representation for proportional scaling (compound
// measures, currency conversion, recipe scaling…). Column `headers` are plain
// prose; each `rows` entry is a KaTeX string per column (same length as
// headers); `operations` holds the scale factor shown between each
// consecutive row pair (length = rows.length - 1). Built via rStep(), never
// constructed directly — see src/shared/ratioTable.ts.
export interface RatioTableData {
  headers: string[];
  rows: string[][];
  operations: string[];
}

export interface ToolDropdown {
  key: string;
  label: string;
  useTwoLineButtons?: boolean;
  options: { value: string; label: string; sub?: string }[];
  defaultValue: string;
  /** True when this dropdown only changes how the working steps are shown
   *  (e.g. a "Method" choice that swaps step-by-step working but leaves the
   *  question and answer unchanged) — it has no effect on a printed
   *  worksheet, so ToolShell hides it from the Worksheet mode QO popover
   *  (standard and differentiated) while still showing it in Whiteboard and
   *  Worked Example mode. Only set this when the question/answer are
   *  genuinely identical across every option — if the dropdown changes the
   *  numbers or structure of the question, leave it unset. */
  workedExampleOnly?: boolean;
}

export interface ToolMultiSelect {
  key: string;
  label: string;
  /** Optional ⓘ note shown next to the group's header label, revealed on hover. */
  info?: string;
  /** Optional difficulty weight for the Smart Progressor — see `weightOf` /
   *  `sortByDifficulty` in helpers.ts. Prefer this ordinal-pool shape over a
   *  boolean `ToolVariable` whenever an option represents "harder", not just
   *  "different", so a worksheet can be ordered easy-to-hard by weight. */
  options: { value: string; label: string; sub?: string; divider?: boolean; defaultActive: boolean; weight?: number }[];
  /** Allow every option in this group to be deselected at once (e.g. a group
   *  of optional add-on flags where "all off" is a valid, simplest-form
   *  state). Default false — the last active option cannot be turned off,
   *  for "pick at least one type" pools. */
  allowEmpty?: boolean;
  /** Renders this exactly-2-option pool as the compact None/Mixed/Exclusive
   *  cycle button (see `CycleSelect` in QOPopovers.tsx), same visual as a
   *  weighted 2-option pool gets automatically — but WITHOUT opting into the
   *  Smart Progressor (`weight`-less options never trigger `buildQuotaOverrides`/
   *  `sortByDifficulty`). Use this for a common/rare toggle pair (read via a
   *  custom picker like `pickRare`, not `pickActive`/`weightOf`) that wants the
   *  compact control but must NOT be forced toward a roughly-even split when
   *  both options are active — a genuine difficulty ladder should use `weight`
   *  instead and get the cycle button for free. */
  cycleDisplay?: true;
  /** Overrides the compact cycle button's three state labels (None → Mixed →
   *  Exclusive order). Use this when the generic labels don't say what's
   *  actually being toggled or what "Mixed" means for this pool — e.g. a
   *  rare-trap pool read via `pickRare` (not a weighted difficulty ladder)
   *  where "Mixed" means a fixed rare probability, not roughly 50/50:
   *  `["Off", "Mixed (~8%)", "Always"]`. Omit to keep the generic labels. */
  cycleStateLabels?: [string, string, string];
}

// A tool may need several independent option pools at once (e.g. "Constants"
// and "Larger x on" both active simultaneously). Pass an array to render each
// as its own group in the QO popover; option `value`s must be unique across
// all groups since their active-states share one flat record.
export type ToolMultiSelectConfig = ToolMultiSelect | ToolMultiSelect[];

export interface ToolVariable {
  key: string;
  label: string;
  defaultValue: boolean;
}

export interface DifficultyLevelSettings {
  dropdown?: ToolDropdown | null;
  variables?: ToolVariable[];
  multiSelect?: ToolMultiSelectConfig;
}

export interface ToolEntry {
  name: string;
  instruction?: string;
  variables: ToolVariable[];
  dropdown: ToolDropdown | null;
  multiSelect?: ToolMultiSelectConfig;
  difficultySettings: Record<string, DifficultyLevelSettings> | null;
}

export interface ToolConfig {
  pageTitle: string;
  tools: Record<string, ToolEntry>;
}

export interface InfoItem {
  label: string;
  detail: string;
}

export interface InfoSection {
  title: string;
  icon: string;
  content: InfoItem[];
}

export interface QOSnapshot {
  level: DifficultyLevel;
  variables: Record<string, boolean>;
  dropdownValue: string;
  multiSelectValues: Record<string, boolean>;
  /** True when the question is being rendered in the fullscreen whiteboard.
   *  Lets a questionRenderer that swaps in the answer on "Show Answer" (rather
   *  than drawing it on the diagram) do so in fullscreen too, where compact is
   *  otherwise indistinguishable from the worked-example view. */
  fullscreen?: boolean;
}

export interface ToolShellDefaults {
  displayFontSize?: number;    // 0–5, default 2 (text-3xl)
  worksheetFontSize?: number;  // 0–5, default 1 (text-xl)
  numQuestions?: number;       // default 15
  fixedQuestions?: boolean;    // locks and hides the questions count input
  numColumns?: number;         // default 3
  fixedColumns?: boolean;      // locks and hides the columns input
  maxColumns?: number;         // caps the column input maximum (e.g. 3 prevents 4-col)
  comingSoonLevels?: DifficultyLevel[]; // levels shown but disabled with "Coming soon" tooltip
  hideFontControls?: boolean;  // hides the text size up/down chevrons (e.g. diagram-only tools)
  collapseWorkingByDefault?: boolean; // whiteboard opens with the working/visualiser panel collapsed (still re-openable)
  /** Worked Example mode's step layout. "single" (default) replaces the card
   *  each press, with a dot-strip to jump between steps. "stacked" builds a
   *  growing vertical list instead — earlier steps stay visible (dimmed) as
   *  you press through, cascading down the page. Previously only used by the
   *  Technique Library preview; opt a real tool in per-tool via this flag. */
  workedExampleLayout?: "single" | "stacked";
  /** Splits the sub-tool tab buttons across multiple rows instead of one —
   *  e.g. [3, 2] for a 5-sub-tool tool. Each number is how many buttons that
   *  row holds, in order; omit for the default single row (unaffected). */
  toolTabRows?: number[];
  /** Worked Example mode: skip the separate green answer box after the last
   *  working step. Only opt a tool in once its last working step already
   *  states the exact final answer in every case (verify with a stress test
   *  across every sub-tool/level — a mismatched last step would otherwise go
   *  unnoticed with no box left to catch it). Passed straight through as
   *  WorkedExampleSteps' own `hideAnswerStep` prop; defaults to false so
   *  every tool that hasn't been audited is unaffected. */
  hideAnswerStep?: boolean;
}
