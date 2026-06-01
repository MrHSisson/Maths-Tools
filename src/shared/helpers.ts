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

// Pure KaTeX step — use for any line containing maths.
export const step = (latex: string, plain?: string) =>
  ({ type: "step", latex, plain: plain ?? latex });

// Plain text step — use ONLY for genuinely numberless prose.
export const tStep = (text: string) =>
  ({ type: "tStep", latex: `\\text{${text}}`, plain: text });

// Prose label + KaTeX on the right.
export const mStep = (label: string, latex: string, unit?: string) =>
  ({ type: "mStep", latex, plain: `${label} ${latex}${unit ? " " + unit : ""}`, label, unit });

// Formats a number to dp decimal places, stripping trailing zeros.
export const fmt = (n: number, dp = 2): string => n.toFixed(dp).replace(/\.?0+$/, "");
