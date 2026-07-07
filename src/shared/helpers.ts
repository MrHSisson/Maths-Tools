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

// A tool's `multiSelect` may be a single group or an array of independent groups
// (each rendered as its own pool in the QO popover). Normalize to an array.
export const normalizeMultiSelect = <T extends { key: string }>(ms?: T | T[] | null): T[] =>
  ms ? (Array.isArray(ms) ? ms : [ms]) : [];

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
export const tStep = (text: string) =>
  ({ type: "tStep", latex: `\\text{${stripSkillMarkers(text)}}`, plain: text });

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
