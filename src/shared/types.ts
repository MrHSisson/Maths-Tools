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

export interface ToolDropdown {
  key: string;
  label: string;
  useTwoLineButtons?: boolean;
  options: { value: string; label: string; sub?: string }[];
  defaultValue: string;
}

export interface ToolMultiSelect {
  key: string;
  label: string;
  /** Optional ⓘ note shown next to the group's header label, revealed on hover. */
  info?: string;
  options: { value: string; label: string; sub?: string; divider?: boolean; defaultActive: boolean }[];
  /** Allow every option in this group to be deselected at once (e.g. a group
   *  of optional add-on flags where "all off" is a valid, simplest-form
   *  state). Default false — the last active option cannot be turned off,
   *  for "pick at least one type" pools. */
  allowEmpty?: boolean;
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
}
