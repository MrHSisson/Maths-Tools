// Bar model: a core representation (docs/reference/pictures.md), here as a plain data shape that decks and tools share.
// A bar is a row of equal boxes (one per unit), coloured by part; braces mark any span of boxes above or below it
// ("total 5", "red 3"). Colour is never the only cue: a part is named by its brace label.
//
//   { parts: [{ units: 3, tone: 0 }, { units: 2, tone: 1 }],
//     braces: [{ from: 0, to: 3, label: "red: 3", below: true }, { from: 0, to: 5, label: "total: 5" }] }

export interface BarPart { units: number; tone?: number }
/** A span of boxes `from` (included) to `to` (not included), labelled; above the bar unless `below`. `$…$` is maths. */
export interface BarBrace { from: number; to: number; label: string; below?: boolean }
export interface BarModelData {
  parts: BarPart[];
  /** Text in every box ("?" or "1"); none by default. */
  unitLabel?: string;
  braces?: BarBrace[];
}

/** How the picture starts: all of it, the boxes only, or empty boxes to colour in and label. */
export type BarFill = "filled" | "structure" | "blank";

/** Fill and stroke for a part's tone (blue, violet, orange, teal, pink, grey): none is green, yellow or red, the level colours. */
export const BAR_TONES: { fill: string; stroke: string }[] = [
  { fill: "#bfdbfe", stroke: "#1e3a8a" }, { fill: "#ddd6fe", stroke: "#5b21b6" }, { fill: "#fed7aa", stroke: "#9a3412" },
  { fill: "#99f6e4", stroke: "#115e59" }, { fill: "#fbcfe8", stroke: "#9d174d" }, { fill: "#e2e8f0", stroke: "#475569" },
];
export const MAX_BAR_UNITS = 24;

export const barUnits = (d: BarModelData) => d.parts.reduce((n, p) => n + Math.max(0, Math.floor(p.units)), 0);

/** Clicks a staged bar takes after its first part: one per further part, then one per brace. */
export const barStages = (d: BarModelData) => Math.max(0, d.parts.length - 1) + (d.braces?.length ?? 0);

/** The bar as it stands after `stage` clicks: the first part, then each further part, then each brace in order. */
export function barAtStage(d: BarModelData, stage: number): BarModelData {
  const partsShown = Math.min(d.parts.length, 1 + Math.max(0, stage));
  const bracesShown = Math.max(0, stage - (d.parts.length - 1));
  return { ...d, parts: d.parts.slice(0, partsShown), braces: (d.braces ?? []).slice(0, bracesShown) };
}

/** Which row each brace sits on, counted outwards from the bar, so braces that overlap on one side stack instead of colliding. */
export function braceRows(braces: BarBrace[]): number[] {
  const rows: number[] = braces.map(() => 0);
  for (const below of [false, true]) {
    const mine = braces.map((b, i) => ({ b, i })).filter(({ b }) => !!b.below === below).sort((x, y) => (x.b.to - x.b.from) - (y.b.to - y.b.from));
    const placed: { from: number; to: number; row: number }[] = [];
    for (const { b, i } of mine) {
      let row = 0;
      while (placed.some((p) => p.row === row && p.from < b.to && b.from < p.to)) row++;
      placed.push({ from: b.from, to: b.to, row }); rows[i] = row;
    }
  }
  return rows;
}

/** A bar that can be drawn: at least one part, whole numbers of boxes, braces inside the bar. */
export function barProblems(d: BarModelData): string[] {
  const out: string[] = [];
  const n = barUnits(d);
  if (!d.parts.length || n < 1) out.push("the bar has no boxes");
  if (n > MAX_BAR_UNITS) out.push(`the bar has ${n} boxes (at most ${MAX_BAR_UNITS})`);
  if (d.parts.some((p) => !Number.isInteger(p.units) || p.units < 1)) out.push("every part needs a whole number of boxes, at least 1");
  for (const b of d.braces ?? []) if (!(Number.isInteger(b.from) && Number.isInteger(b.to) && b.from >= 0 && b.to <= n && b.from < b.to)) out.push(`the brace "${b.label}" does not sit inside the bar`);
  return out;
}
