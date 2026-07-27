// Computer Science revision shell — shared library barrel.
// See CS_SHELL_PLAN.md for the architecture and migration plan.

export {
  NAVY, CARD_SHADOW, TAB_SHADOW,
  shuffleArr, parseCloze, useIsMobile, boldText,
  BeyondBadge, SegRow,
} from "./ui";

export {
  type CSTooltip, type CSGlossarySegment,
  registerTooltip, showTooltip, TooltipOverlay, parseGlossaryText,
} from "./tooltip";

export {
  MARK_FORMATS, COMMAND_GUIDE,
  type SpecTag, type ExamFormat,
  type FlashCard, type ClozeExercise, type ExamQuestion, type SynopticQuestion,
  type MythItem, type Flow, type LessonStep, type Lesson, type InfoItem, type InfoSection,
  type SchematicNode, type SchematicContainer, type SchematicText, type SchematicBus,
  type SchematicConfig, type TraceRow, type TraceConfig,
} from "./types";

export { BoxSchematic, TraceTable } from "./representations";

export { TopicProvider, useTopic, GlossaryText, SpecBadge } from "./context";

export {
  FlashcardMode, StudyMode, QuizMode, SpotMistakeMode, FillInMode,
} from "./modes";
