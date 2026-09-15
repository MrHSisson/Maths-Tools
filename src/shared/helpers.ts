// Question generation helpers. Import these in every new tool.

export const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

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

// Smart Progressor — looks up a picked multiSelect option's difficulty
// `weight` (0 if unweighted or not found). A generator calls this after
// pickActive() to score the question it just built; ToolShell's worksheet
// loop uses that score (see sortByDifficulty) to order easy-to-hard.
export const weightOf = (options: { value: string; weight?: number }[], value: string): number =>
  options.find(o => o.value === value)?.weight ?? 0;

// Smart Progressor — reorders a worksheet's questions by ascending
// `_difficultyScore` (a question field a generator sets via weightOf) so
// earlier questions are the easier weighted options and later ones the
// harder. A stable sort — equal-score questions keep their original
// (random) relative order, so there's no robotic re-shuffling within a tier.
// Tools that never attach `_difficultyScore` are returned unchanged, making
// this a no-op for every tool that hasn't opted into weighted QO pools.
export const sortByDifficulty = <Q extends { key: string }>(questions: Q[]): Q[] => {
  const score = (q: Q) => (q as unknown as { _difficultyScore?: number })._difficultyScore;
  if (!questions.some(q => score(q) !== undefined)) return questions;
  return [...questions].sort((a, b) => (score(a) ?? 0) - (score(b) ?? 0));
};

// Smart Progressor — ToolShell-internal wiring, never called from a tool
// file. Builds one multiSelectValues override per worksheet question so a
// *weighted* group (any multiSelect group with at least one option carrying
// a `weight`) is forced to an even split across its active options, instead
// of leaving representation to chance via pickActive's per-question random
// draw (which, over only e.g. 15 questions, can easily land 7/5/3 instead of
// 5/5/5). Every OTHER group (e.g. a "Units" pool with no weighted options)
// is passed through completely untouched, so it keeps varying freely and
// randomly per question exactly as before — the quota is opt-in per group,
// scoped to exactly the groups the Smart Progressor already orders by.
// Order within the split doesn't matter: sortByDifficulty re-sorts the
// finished batch afterwards, so a block assignment (all of option A's
// questions, then all of option B's, ...) is exactly as good as a shuffled
// one and far simpler.
export const buildQuotaOverrides = (
  groups: { key: string; options: { value: string; weight?: number }[] }[],
  baseValues: Record<string, boolean>,
  numQuestions: number,
): Record<string, boolean>[] => {
  const quotaGroups = groups
    .filter(g => g.options.some(o => o.weight !== undefined))
    .map(g => ({ group: g, active: g.options.filter(o => baseValues[o.value] !== false) }))
    .filter(g => g.active.length > 1); // a single active option needs no forcing
  if (quotaGroups.length === 0) return Array.from({ length: numQuestions }, () => baseValues);

  const slotsFor = (active: { value: string }[]): string[] => {
    const base = Math.floor(numQuestions / active.length);
    const rem = numQuestions % active.length;
    const slots: string[] = [];
    active.forEach((o, i) => { for (let n = 0; n < base + (i < rem ? 1 : 0); n++) slots.push(o.value); });
    return slots;
  };
  const assignments = quotaGroups.map(({ group, active }) => ({ group, slots: slotsFor(active) }));

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
export const ansEq = (answer: string): string => (/=/.test(answer) ? answer : `= ${answer}`);

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
