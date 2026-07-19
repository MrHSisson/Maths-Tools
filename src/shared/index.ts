// Barrel export — import everything a new tool needs from here.
//
// Minimal new tool:
//   import { ToolShell, ToolConfig, InfoSection, DifficultyLevel, AnyQuestion } from '../../shared';
//   import { randInt, pick, step, mStep, tStep, fmt, fracStr, mStr } from '../../shared';

export type {
  DifficultyLevel,
  PrintMode,
  AnyQuestion,
  SimpleQuestion,
  WordedQuestion,
  WorkingStep,
  ToolConfig,
  ToolEntry,
  ToolDropdown,
  ToolMultiSelect,
  ToolMultiSelectConfig,
  ToolVariable,
  DifficultyLevelSettings,
  InfoSection,
  InfoItem,
  QOSnapshot,
  ToolShellDefaults,
} from "./types";

export { ToolShell } from "./ToolShell";
export type { ToolShellProps } from "./ToolShell";

export { TeachingDeck, SlideDeck, slideMaxStep } from "./TeachingDeck";
export type { TeachingSlide, TeachBlock, TeachBar, TeachScene, TeachCategory } from "./TeachingDeck";

export { SKILLS, getSkill, SkillLabel, SkillOverlay } from "./skills";
export type { SkillDef } from "./skills";

export { WorksheetBuilder } from "./WorksheetBuilder";
export type { WorksheetBuilderProps } from "./WorksheetBuilder";

export { loadKaTeX } from "./katex";
export { handlePrint } from "./print";
export { handleDiagramPrint } from "./printDiagram";
export type { PrintContext } from "./printDiagram";

export { LV_COLORS, LV_LABELS, LV_HEADER_COLORS, getQuestionBg, getStepBg } from "./colors";

export { randInt, pick, fracStr, mStr, pickActive, normalizeMultiSelect, step, tStep, mStep, fmt, ansEq, makeUniqueQ, stripSkillMarkers, SKILL_MARKER_RE } from "./helpers";

export { MathRenderer, InlineMath } from "./components/MathRenderer";
export { QuestionDisplay, AnswerDisplay } from "./components/QuestionDisplay";
export { DifficultyToggle } from "./components/DifficultyToggle";
export {
  usePopover,
  TogglePill,
  SegButtons,
  DropdownSection,
  MultiSelectSection,
  VariablesSection,
  StandardQOPopover,
  DiffQOPopover,
  InlineQOPanel,
} from "./components/QOPopovers";
export { InfoModal } from "./components/InfoModal";
export { MenuDropdown } from "./components/MenuDropdown";
export { PrintSplitButton } from "./components/PrintSplitButton";

// SmartGrapher — embeddable canvas graphing component + its maths engine.
export { SmartGrapher } from "./grapher/SmartGrapher";
export type { SmartGrapherProps, GrapherConfig, GraphSeries } from "./grapher/SmartGrapher";
export {
  computeFOIs, computeFrame, buildCurveSpec, findFunctionIntersections,
  getLinearFOIs, getQuadraticFOIs, getCubicFOIs, getCircleFOIs,
  quadraticRoots, cubicRoots, niceStep,
  mathToScreenX, mathToScreenY, screenToMathX, screenToMathY,
} from "./grapher/mathEngine";
export type { EquationType, FOI, Viewport, CurveSpec, FrameOptions } from "./grapher/mathEngine";
export type { ShadeRegion, Guide } from "./grapher/drawGraph";
export {
  quadraticInequality, linearQuadraticIntersection, linearInequality, areaBetweenCurves,
} from "./grapher/recipes";
export type { GrapherRecipe, InequalityOp } from "./grapher/recipes";
