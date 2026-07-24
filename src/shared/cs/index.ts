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
