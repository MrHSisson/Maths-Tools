import type { WorkingStep } from "./types";
// Question generation helpers. Import these in every new tool.

export const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const pick = <T,>(arr: readonly T[]): T => arr[randInt(0, arr.length - 1)];

// Wraps a fraction as an InlineMath-compatible string: e.g. fracStr(3,4) → "$\frac{3}{4}$"
export const fracStr = (n: number | string, d: number | string) => `$\\frac{${n}}{${d}}$`;

// Wraps any mathematical content (numbers, operators, ratios) for InlineMath rendering.
// e.g. "A bag weighs " + mStr(16) + " kg."
export const mStr = (x: number | string) => `$${x}$`;

// Picks a random active value from a multiSelect option set.
export const pickActive = (values: Record<string, boolean>, options: { value: string }[]): string => {
  const active = options.filter(o => values[o.value] !== false);
  return active.length > 0 ? active[Math.floor(Math.random() * active.length)].value : options[0].value;
};

// Smart Progressor — reorders a worksheet's questions by ascending
// `_difficultyScore` (the band a calibrated tool stamps on each question, see
// calibration.ts). A stable sort — equal-score questions keep their original
// (random) relative order, so there's no robotic re-shuffling within a band.
// Questions without `_difficultyScore` are returned unchanged.
export const sortByDifficulty = <Q extends { key: string }>(questions: Q[]): Q[] => {
  const score = (q: Q) => (q as unknown as { _difficultyScore?: number })._difficultyScore;
  if (!questions.some(q => score(q) !== undefined)) return questions;
  return [...questions].sort((a, b) => (score(a) ?? 0) - (score(b) ?? 0));
};

// Smart Progressor, calibrated tools — "generate extra, then pick". A calibrated tool's questions carry `_difficultyScore` = a band 1–8
// (see calibration.ts). Rather than hoping n random draws spread across the bands, ToolShell generates a pool of candidates and this picks
// n of them spread as EVENLY as the pool allows across the bands that are present (so ticking only easy options gives an even ramp over the
// low bands, not a lopsided one). A band that runs short hands its slots to the others. Random within a band; returned ascending by band
// (stable), so same-band questions mingle.
export const spreadByBand = <Q extends { key: string }>(candidates: Q[], n: number, rng: () => number = Math.random): Q[] => {
  const band = (q: Q) => (q as unknown as { _difficultyScore?: number })._difficultyScore ?? 0;
  const byBand = new Map<number, Q[]>();
  for (const q of candidates) byBand.set(band(q), [...(byBand.get(band(q)) ?? []), q]);
  const bands = [...byBand.keys()].sort((a, b) => a - b);
  if (!bands.length || n >= candidates.length) return sortByDifficulty(candidates).slice(0, n);
  for (const b of bands) { const xs = byBand.get(b)!; for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; } }
  const take = new Map<number, number>(bands.map(b => [b, 0]));
  let left = n;
  while (left > 0) {
    const open = bands.filter(b => take.get(b)! < byBand.get(b)!.length);
    if (!open.length) break;
    const least = Math.min(...open.map(b => take.get(b)!));
    const tied = open.filter(b => take.get(b) === least);
    // fewest-taken bands first; among ties, random bands receive the remainder
    const order = tied.map(b => [rng(), b] as const).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    for (const b of order) { if (left <= 0) break; take.set(b, take.get(b)! + 1); left--; }
  }
  return bands.flatMap(b => byBand.get(b)!.slice(0, take.get(b)!));
};

// Independent per-question random draws — natural variety, e.g. a genuine
// 6/5/4 across three equally-active options over 15 questions, not the same
// exact split every single time — but the whole batch is retried if any
// option's count strays more than 1 away from the fair share
// (numQuestions/count of active options), so an unconstrained draw's
// occasional lopsided outcome (e.g. 9/4/2) never reaches the worksheet.
// "Roughly a third each" (the actual ask — see docs/PROJECTS.md's Smart
// Progressor prong), not "exactly a third each". Falls back to the nearest
// exact largest-remainder split if 200 tries don't land inside tolerance —
// rare, and only realistically possible with very few questions spread
// across several active options.
const balancedSlots = (values: string[], numQuestions: number): string[] => {
  const ideal = numQuestions / values.length;
  for (let attempt = 0; attempt < 200; attempt++) {
    const slots = Array.from({ length: numQuestions }, () => values[Math.floor(Math.random() * values.length)]);
    if (values.every(v => Math.abs(slots.filter(s => s === v).length - ideal) <= 1)) return slots;
  }
  const base = Math.floor(numQuestions / values.length);
  const rem = numQuestions % values.length;
  const slots: string[] = [];
  values.forEach((v, i) => { for (let n = 0; n < base + (i < rem ? 1 : 0); n++) slots.push(v); });
  return slots;
};

// ToolShell-internal wiring, never called from a tool file. Builds one
// multiSelectValues override per worksheet question so a `balanced` group
// lands roughly evenly across its active options (see balancedSlots)
// instead of leaving representation entirely to chance via pickActive's
// per-question random draw, which can land arbitrarily skewed over a short
// worksheet. Every OTHER group (e.g. a "Units" pool) is passed through
// completely untouched, so it keeps varying freely and randomly per
// question — the balancing is opt-in per group.
export const buildQuotaOverrides = (
  groups: { key: string; balanced?: boolean; options: { value: string }[] }[],
  baseValues: Record<string, boolean>,
  numQuestions: number,
): Record<string, boolean>[] => {
  const quotaGroups = groups
    .filter(g => g.balanced)
    .map(g => ({ group: g, active: g.options.filter(o => baseValues[o.value] !== false) }))
    .filter(g => g.active.length > 1); // a single active option needs no balancing
  if (quotaGroups.length === 0) return Array.from({ length: numQuestions }, () => baseValues);

  const assignments = quotaGroups.map(({ group, active }) => ({ group, slots: balancedSlots(active.map(o => o.value), numQuestions) }));

  return Array.from({ length: numQuestions }, (_, i) => {
    const overrides = { ...baseValues };
    assignments.forEach(({ group, slots }) => {
      const chosen = slots[i];
      group.options.forEach(o => { overrides[o.value] = o.value === chosen; });
    });
    return overrides;
  });
};

// A tool's `multiSelect` may be a single group or an array of independent groups
// (each rendered as its own pool in the QO popover). Normalize to an array.
export const normalizeMultiSelect = <T extends { key: string }>(ms?: T | T[] | null): T[] =>
  ms ? (Array.isArray(ms) ? ms : [ms]) : [];

// Resolves a multiSelect group's *effective* on/off values by filling in each
// option's own `defaultActive` before layering explicit overrides on top.
// Feeding a raw overrides object straight into pickActive() is unsafe once any
// option can be left unset (e.g. a differentiated-worksheet level nobody has
// opened the QO popover for) — pickActive treats "not === false" as active, so
// an empty/partial overrides object would silently treat every option as
// active, including ones whose defaultActive is false.
export const resolveMultiSelectValues = (
  groups: { options: { value: string; defaultActive: boolean }[] }[],
  overrides: Record<string, boolean>,
): Record<string, boolean> => {
  const values: Record<string, boolean> = {};
  groups.forEach(g => g.options.forEach(o => { values[o.value] = o.defaultActive; }));
  return { ...values, ...overrides };
};

// Option dependencies (ToolMultiSelect option `requires`): the clauses an option still needs that the current values
// don't meet, or [] when it is available. A clause naming a value that no pool offers is skipped (as DepthItem.needs does).
export const unmetRequires = (
  requires: (string | string[])[] | undefined,
  values: Record<string, boolean>,
  offered?: ReadonlySet<string>,
): (string | string[])[] =>
  (requires ?? []).filter((need) => {
    const clause = (Array.isArray(need) ? need : [need]).filter((v) => !offered || offered.has(v));
    return clause.length > 0 && !clause.some((v) => values[v]);
  });

/** Values with every option whose `requires` isn't met switched off — except that a pool is never left with nothing on
 *  (then it is returned as the teacher set it, and the generator's own fallback applies). Use in a generator before pickActive. */
export const maskUnmetOptions = (
  groups: { options: { value: string; requires?: (string | string[])[] }[] }[],
  values: Record<string, boolean>,
): Record<string, boolean> => {
  const offered = new Set(groups.flatMap((g) => g.options.map((o) => o.value)));
  const out = { ...values };
  for (const g of groups) {
    const unmet = g.options.filter((o) => values[o.value] && unmetRequires(o.requires, values, offered).length > 0);
    if (unmet.length && unmet.length < g.options.filter((o) => values[o.value]).length) unmet.forEach((o) => { out[o.value] = false; });
  }
  return out;
};

// ── Skill-link markers ────────────────────────────────────────────────────────
// A prose label may mark a term as a drill-down into the skill library:
//   mStep("Find the common denominator — the [[lcm|LCM]] of 11 and 13:", "143")
// In the dev-gated Worked Example the marked term renders underlined and opens
// the skill's slides in an overlay; everywhere else only the term shows.

export const SKILL_MARKER_RE = /\[\[([a-z0-9-]+)\|([^\]]+)\]\]/g;

// Replaces every [[skill-id|term]] marker with its bare term.
export const stripSkillMarkers = (s: string): string => s.replace(SKILL_MARKER_RE, "$2");

// step()/mStep() accept the latex as a string[] of ordered fragments — the line
// then reveals one fragment per press in the dev-gated step-by-step Worked
// Example ("live modelling": the line is written in the order a teacher would
// write it). latex is always the joined string, so print, show-all mode and the
// smoke tests see one normal KaTeX string and fragments can never diverge.
const joinFrags = (latex: string | string[]): { latex: string; frags?: string[] } =>
  Array.isArray(latex) ? { latex: latex.join(" "), frags: latex } : { latex };

// Pure KaTeX step — use for any line containing maths.
export const step = (latex: string | string[], plain?: string) => {
  const j = joinFrags(latex);
  return { type: "step", latex: j.latex, plain: plain ?? j.latex, ...(j.frags ? { frags: j.frags } : {}) };
};

// Plain text step — use ONLY for genuinely numberless prose. May contain
// [[skill-id|term]] markers; they are stripped from the latex fallback.
// LaTeX specials (% # & _) are escaped in the latex fallback — a bare % would
// otherwise start a KaTeX comment and fail the smoke tests' render check.
export const tStep = (text: string) =>
  ({ type: "tStep", latex: `\\text{${stripSkillMarkers(text).replace(/([%#&_])/g, "\\$1")}}`, plain: text });

// Prose label + KaTeX on the right. The label may contain [[skill-id|term]]
// markers; `plain` gets the stripped label so markers never leak into text output.
export const mStep = (label: string, latex: string | string[], unit?: string) => {
  const j = joinFrags(latex);
  return {
    type: "mStep", latex: j.latex,
    plain: `${stripSkillMarkers(label)} ${j.latex}${unit ? " " + unit : ""}`,
    label, unit,
    ...(j.frags ? { frags: j.frags } : {}),
  };
};

// Formats a number to dp decimal places, stripping trailing zeros.
export const fmt = (n: number, dp = 2): string => n.toFixed(dp).replace(/\.?0+$/, "");

// Renders an answer with its leading "= ". Bare-value answers ("10", "\frac{3}{4}")
// get the "= " prefix; full-equation answers ("x = 10") already read correctly on
// their own and are returned unchanged — prevents "= x = 10" ever being shown.
// An answer that is the question's own number with a digit underlined (Identify Sig. Figs) is not "= …" either.
export const ansEq = (answer: string): string => (/=|\\underline\{/.test(answer) ? answer : `= ${answer}`);

// Wraps a generateQuestion function with the standard retry-until-unique loop.
// ToolShell uses this automatically when a tool doesn't supply its own
// generateUniqueQ — new tools only need to write generateQuestion.
export const makeUniqueQ = <Q extends { key: string }, L extends string = string>(
  generate: (
    tool: string,
    level: L,
    variables: Record<string, boolean>,
    dropdownValue: string,
    multiSelectValues?: Record<string, boolean>,
  ) => Q,
) => (
  tool: string,
  level: L,
  variables: Record<string, boolean>,
  dropdownValue: string,
  usedKeys: Set<string>,
  multiSelectValues: Record<string, boolean> = {},
): Q => {
  let q: Q;
  let attempts = 0;
  do { q = generate(tool, level, variables, dropdownValue, multiSelectValues); attempts++; }
  while (usedKeys.has(q.key) && attempts < 100);
  usedKeys.add(q.key);
  return q;
};

/**
 * Split the final result of an inline chain into its own step. A last step written in fragments that ends in a
 * "= result" link — `x = 180° − 146°` · `= 34°` — becomes TWO steps: the working (`x = 180° − 146°`) and, as a step
 * of its own, the answer — labelled "Answer:" — (`x = 34°`), built from the chain's own left-hand side. In the worked example the answer
 * step is the green, prominent one. Anything that doesn't fit that shape is returned unchanged.
 */
export const splitAnswerStep = (steps: WorkingStep[]): WorkingStep[] => {
  const last = steps[steps.length - 1];
  const f = last?.frags;
  if (!f || f.length < 2 || last.unit || !/^\s*=/.test(f[f.length - 1]) || !/=/.test(f[0])) return steps;
  const rest = f.slice(0, -1);
  const working = last.label !== undefined ? mStep(last.label, rest) : step(rest);
  const answer = mStep("Answer:", `${f[0].split("=")[0].trim()} ${f[f.length - 1].trim()}`);
  return [...steps.slice(0, -1), working, answer];
};
