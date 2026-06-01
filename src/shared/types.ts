// Shared types for the tool shell. Import these instead of redefining locally.

export type DifficultyLevel = "level1" | "level2" | "level3";
export type PrintMode = "both" | "questions" | "answers";

export interface WorkingStep {
  type: string;
  latex: string;
  plain: string;
  label?: string;
  unit?: string;
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
  options: { value: string; label: string; defaultActive: boolean }[];
}

export interface ToolVariable {
  key: string;
  label: string;
  defaultValue: boolean;
}

export interface DifficultyLevelSettings {
  dropdown?: ToolDropdown | null;
  variables?: ToolVariable[];
  multiSelect?: ToolMultiSelect;
}

export interface ToolEntry {
  name: string;
  instruction?: string;
  useSubstantialBoxes: boolean;
  variables: ToolVariable[];
  dropdown: ToolDropdown | null;
  multiSelect?: ToolMultiSelect;
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
}
