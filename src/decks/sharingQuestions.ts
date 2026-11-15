import type { WorkingStep, WordedQuestion } from "../shared";
import { stripSkillMarkers } from "../shared/helpers";
import { buildSharing, buildKnown, buildDifference, fa, type SharingSpec, type KnownSpec, type DiffSpec } from "../tools/Proportion/ratioSharing";
import type { BarRow } from "../shared/barModel";
import { newQuestion } from "./questions";
import { pictureLine } from "./WorkedPicture";
import type { CuratedQuestion } from "./types";

// Fixed Ratio Sharing questions for a deck: the tool's own wording and working (`ratioSharing.ts`, the same builders its
// generators use), with the bar model steps kept as pictures in the explanation lines (as `fromWorked` does for Ratio Manipulation).

type Bar = { person: string; boxes: number; value?: number; total?: number; isKnown?: boolean; knownAmount?: number | null };

const rowsOf = (step: WorkingStep): BarRow[] | null => {
  const d = (step.extra ?? {}) as Record<string, unknown>;
  const bars = d.bars as Bar[] | undefined;
  if (!bars) return null;
  const ctx = d.ctx as string | undefined;
  const label = (n: number) => (ctx && ctx !== "money" ? String(n) : fa(ctx, n));   // a box is small: a quantity shows its number only
  if (step.type === "bar_empty") return bars.map((b) => ({ name: b.person, units: b.boxes }));
  if (step.type === "bar_part") return bars.map((b) => ({ name: b.person, units: b.boxes, unitLabel: label(b.value!) }));   // the value of one part in every box
  if (step.type === "ka_part_val") return bars.map((b) => ({ name: b.person, units: b.boxes, unitLabel: label(b.value!), ...(b.isKnown ? { known: true, given: true, total: fa(ctx, b.knownAmount!) } : {}) }));
  if (step.type === "diff_part_val") {
    const hi = d.largerPerson as number, lo = d.smallerPerson as number;
    return bars.map((b, i) => ({ name: b.person, units: b.boxes, unitLabel: label(b.value!), ...(i === hi ? { extraFrom: bars[lo].boxes } : {}) }));
  }
  if (step.type === "bar_filled") return bars.map((b) => ({ name: b.person, units: b.boxes, unitLabel: label(b.value!), total: fa(ctx, b.total!) }));
  if (step.type === "ka_bar_known") return bars.map((b) => ({ name: b.person, units: b.boxes, ...(b.isKnown ? { known: true, given: true, total: fa(ctx, b.knownAmount!) } : {}) }));
  if (step.type === "diff_bar") {
    const hi = d.largerPerson as number, lo = d.smallerPerson as number;
    return bars.map((b, i) => ({ name: b.person, units: b.boxes, ...(i === hi ? { extraFrom: bars[lo].boxes } : {}) }));
  }
  return null;
};

const line = (w: WorkingStep): string => {
  const rows = rowsOf(w);
  if (rows) return pictureLine(w.plain ?? "", "bar", { parts: [], rows });
  if (w.type === "mStep") return `${stripSkillMarkers(w.label ?? "")} $${w.latex}$`.trim();
  return w.plain ?? "";
};

const curated = (q: WordedQuestion, id: string): CuratedQuestion => ({
  ...newQuestion("ratio-sharing"), id, title: q.lines.join(" ").replace(/\$/g, "").slice(0, 100), level: "level1", purpose: "practice", format: "open", status: "ready",
  question: [...q.lines], answer: [q.answer ?? ""], explanation: q.working.map(line),
});

export const shareQuestion = (id: string, s: SharingSpec) => curated(buildSharing(s), id);
export const knownQuestion = (id: string, s: KnownSpec) => curated(buildKnown(s), id);
export const diffQuestion = (id: string, s: DiffSpec) => curated(buildDifference(s), id);
