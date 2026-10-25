import type { AnyQuestion, DifficultyLevel, QOSnapshot, ToolMultiSelect } from "./types";
import { sortByDifficulty, spreadByBand, buildQuotaOverrides } from "./helpers";

type Generate = (tool: string, level: DifficultyLevel, variables: Record<string, boolean>, dropdownValue: string, multiSelectValues?: Record<string, boolean>) => AnyQuestion;
type GenerateUnique = (tool: string, level: DifficultyLevel, variables: Record<string, boolean>, dropdownValue: string, usedKeys: Set<string>, multiSelectValues?: Record<string, boolean>) => AnyQuestion;

/** One block of the worksheet: a level with the options it is generated under. A standard worksheet has one; a differentiated one has one per level. */
export interface WorksheetBlock {
  level: DifficultyLevel;
  variables: Record<string, boolean>;
  dropdownValue: string;
  /** The pool groups, for the Smart Progressor's even split across weighted options. */
  groups: ToolMultiSelect[];
  /** The ticked options the quota split and the generator start from. */
  multiSelectValues: Record<string, boolean>;
  /** The same options with the tool's defaults filled in, used by the calibrated path. */
  calibratedMultiSelectValues: Record<string, boolean>;
}

export interface WorksheetSetup {
  tool: string;
  numQuestions: number;
  /** The Settings "Smart Progressor" switch: with it off, no calibration, no balancing, no easy-to-hard sort. */
  smartProgressor: boolean;
  generateQuestion: Generate;
  generateUniqueQ: GenerateUnique;
  blocks: WorksheetBlock[];
}

const stampQO = (q: AnyQuestion, snap: QOSnapshot): AnyQuestion => ({ ...q, _qo: snap } as AnyQuestion);

/**
 * Calibrated tools (questions carry `_rawDifficulty` and a band in `_difficultyScore`): generate a pool of candidates and pick n spread
 * evenly across the bands present (`spreadByBand`). Returns null for any other tool, which then uses the quota + sort path.
 */
function calibratedBlock(s: WorksheetSetup, b: WorksheetBlock, usedKeys: Set<string>): AnyQuestion[] | null {
  if (!s.smartProgressor) return null;
  const msVals = b.calibratedMultiSelectValues;
  const snap: QOSnapshot = { level: b.level, variables: b.variables, dropdownValue: b.dropdownValue, multiSelectValues: msVals };
  const probe = s.generateQuestion(s.tool, b.level, b.variables, b.dropdownValue, msVals);
  if (typeof (probe as unknown as { _rawDifficulty?: number })._rawDifficulty !== "number") return null;
  const pool: AnyQuestion[] = [];
  const poolSize = Math.min(400, Math.max(60, s.numQuestions * 8));
  const poolKeys = new Set<string>(usedKeys);
  for (let i = 0; i < poolSize; i++) { const q = s.generateUniqueQ(s.tool, b.level, b.variables, b.dropdownValue, poolKeys, msVals); poolKeys.add(q.key); pool.push(stampQO(q, snap)); }
  const picked = spreadByBand(pool, s.numQuestions);
  picked.forEach(q => usedKeys.add(q.key));
  return picked;
}

/**
 * Generate a worksheet. Smart Progressor (standard and differentiated sheets only; the advanced WorksheetBuilder never comes through
 * here): keep a weighted group's active options roughly even (three ticked rungs give about a third each, 6/5/4 is a normal outcome)
 * instead of leaving it to chance (`buildQuotaOverrides`), then order the block easy to hard by `_difficultyScore`. Unweighted groups
 * (Units) are untouched and still vary randomly per question. Each question is stamped with the options of ITS OWN slot, so a
 * regenerated question keeps its tier. With the switch off every slot gets the same options and the block stays in generated order.
 */
export function buildWorksheet(s: WorksheetSetup): AnyQuestion[] {
  const usedKeys = new Set<string>();
  const questions: AnyQuestion[] = [];
  for (const b of s.blocks) {
    const calibrated = calibratedBlock(s, b, usedKeys);
    if (calibrated) { questions.push(...calibrated); continue; }
    const overrides = s.smartProgressor
      ? buildQuotaOverrides(b.groups, b.multiSelectValues, s.numQuestions)
      : Array.from({ length: s.numQuestions }, () => b.multiSelectValues);
    const block: AnyQuestion[] = [];
    for (let i = 0; i < s.numQuestions; i++) {
      const slotSnap: QOSnapshot = { level: b.level, variables: b.variables, dropdownValue: b.dropdownValue, multiSelectValues: overrides[i] };
      block.push(stampQO(s.generateUniqueQ(s.tool, b.level, b.variables, b.dropdownValue, usedKeys, overrides[i]), slotSnap));
    }
    questions.push(...(s.smartProgressor ? sortByDifficulty(block) : block));
  }
  return questions;
}
