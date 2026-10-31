// Ratio Manipulation → Ratio to Fraction. One generator for every level: the LEVEL is the kind of fraction (1 of the total,
// 2 of a part, 3 a mixture of the kinds) and Question Options choose everything else (parts, which part, one part or two
// together, "not" wording, bigger or smaller than 1). Brief: specs/ratio-manipulation-fraction-of.md.
import {
  step, mStep, tStep, randInt, pick, gcd, resolveMultiSelectValues, maskUnmetOptions,
  type DifficultyLevel, type WordedQuestion, type WorkingStep, type ToolMultiSelect, type ToolVariable, type BarModelData,
} from "../../shared";

// ── Question Options ──────────────────────────────────────────────────────────

const opt = (value: string, label: string, defaultActive: boolean, requires?: string[]) => ({ value, label, defaultActive, ...(requires ? { requires } : {}) });

const PARTS: ToolMultiSelect = { key: "parts", tab: "questions", label: "Parts", options: [opt("twoParts", "Two Parts", true), opt("threeParts", "Three Parts", false)] };
const NUMERATOR: ToolMultiSelect = { key: "numerator", tab: "questions", label: "Numerator", options: [opt("onePart", "One Part", true), opt("twoTogether", "Two Parts Together", false, ["threeParts"])] };
const PART_ASKED: ToolMultiSelect = { key: "partAsked", tab: "questions", label: "Part Asked About", options: [opt("askFirst", "First Part", true), opt("askSecond", "Second Part", true), opt("askThird", "Third Part", true, ["threeParts"])] };
const PART_NAMED: ToolMultiSelect = { key: "partNamed", tab: "questions", label: "Part Named", options: [opt("byName", "By Its Name", true), opt("byExclusion", "By Leaving Others Out", false)] };
const ANSWER_SIZE: ToolMultiSelect = { key: "answerSize", tab: "numbers", label: "Answer Size", options: [opt("lessThanOne", "Less Than 1", true), opt("moreThanOne", "More Than 1", true)] };
const FRACTION_OF: Record<"level2" | "level3", ToolMultiSelect> = {
  level2: { key: "fractionOf", tab: "questions", label: "Fraction Of", balanced: true, options: [opt("ofOtherPart", "One Other Part", true), opt("ofRest", "The Rest", false, ["threeParts"])] },
  level3: { key: "fractionOf", tab: "questions", label: "Fraction Of", balanced: true, options: [opt("ofTotal", "The Total", true), opt("ofOtherPart", "One Other Part", true), opt("ofRest", "The Rest", false, ["threeParts"])] },
};

const poolsFor = (level: DifficultyLevel): ToolMultiSelect[] =>
  level === "level1" ? [PARTS, NUMERATOR, PART_ASKED, PART_NAMED]
    : [PARTS, NUMERATOR, FRACTION_OF[level === "level2" ? "level2" : "level3"], PART_ASKED, PART_NAMED, ANSWER_SIZE];

/** What the Ratio to Fraction tab offers at a level (its pools and switches). Level 3 starts on the numbers-only method. */
export const fractionOfSettings = (level: DifficultyLevel): { variables: ToolVariable[]; dropdown: null; multiSelect: ToolMultiSelect[] } => ({
  variables: [
    { key: "simplestForm", tab: "display" as const, label: "Simplest Form", defaultValue: true },
    { key: "numerical", tab: "method" as const, label: "Numerical method", displayOnly: true, defaultValue: level === "level3" },
  ],
  dropdown: null,
  multiSelect: poolsFor(level),
});

// ── Contexts ──────────────────────────────────────────────────────────────────

interface Ctx {
  names: string[];
  /** After "What fraction of …": "the beads", "people playing sports". */
  of: string;
  /** How a part is named when it is a quantity ("red beads"). */
  phrase?: (i: number) => string;
  qty: "number" | "amount";
  /** Plain colour words, so "What fraction of red are blue?" reads sensibly. */
  colours?: boolean;
  /** A natural name for two parts together, with the part it leaves out. */
  composite?: { label: string; leftOut: number };
}
const coloured = (noun: string) => (names: string[]) => (i: number) => `${names[i]} ${noun}`;
const BEADS = coloured("beads"), MARBLES = coloured("marbles"), COUNTERS = coloured("counters");
const chose = (names: string[]) => (i: number) => `people who chose ${names[i]}`;

const TWO: Ctx[] = [
  { names: ["red", "blue"], of: "the beads", phrase: BEADS(["red", "blue"]), qty: "number", colours: true },
  { names: ["boys", "girls"], of: "the students", qty: "number" },
  { names: ["wins", "losses"], of: "the games", qty: "number" },
  { names: ["red", "blue"], of: "the marbles", phrase: MARBLES(["red", "blue"]), qty: "number", colours: true },
  { names: ["green", "yellow"], of: "the counters", phrase: COUNTERS(["green", "yellow"]), qty: "number", colours: true },
  { names: ["apples", "oranges"], of: "the fruit", qty: "number" },
  { names: ["bananas", "grapes"], of: "the fruit", qty: "number" },
  { names: ["pound coins", "fifty pence coins"], of: "the coins", qty: "number" },
  { names: ["ten pound notes", "five pound notes"], of: "the notes", qty: "number" },
  { names: ["Year 7s", "Year 8s"], of: "the pupils", qty: "number" },
  { names: ["adults", "children"], of: "the people", qty: "number" },
];
const THREE: Ctx[] = [
  { names: ["football", "squash", "tennis"], of: "people playing sports", phrase: chose(["football", "squash", "tennis"]), qty: "number", composite: { label: "racket sports", leftOut: 0 } },
  { names: ["football", "rugby", "tennis"], of: "people playing sports", phrase: chose(["football", "rugby", "tennis"]), qty: "number", composite: { label: "team sports", leftOut: 2 } },
  { names: ["swimming", "football", "tennis"], of: "people playing sports", phrase: chose(["swimming", "football", "tennis"]), qty: "number", composite: { label: "ball sports", leftOut: 0 } },
  { names: ["flour", "milk", "eggs"], of: "the ingredients", qty: "amount", composite: { label: "wet ingredients", leftOut: 0 } },
  { names: ["red", "blue", "green"], of: "the beads", phrase: BEADS(["red", "blue", "green"]), qty: "number", colours: true },
  { names: ["strawberry", "lemon", "orange"], of: "the sweets", phrase: (i) => `${["strawberry", "lemon", "orange"][i]} sweets`, qty: "number" },
  { names: ["roses", "tulips", "daisies"], of: "the flowers", qty: "number" },
];

// ── Wording ───────────────────────────────────────────────────────────────────

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const rs = (...x: number[]) => `$${x.join(" : ")}$`;
const frac = (n: number, d: number) => `\\frac{${n}}{${d}}`;
const list = (xs: string[]) => (xs.length < 3 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

type Kind = "total" | "part" | "rest";
interface Pick { ctx: Ctx; k: 2 | 3; v: number[]; kind: Kind; num: number[]; den: number[]; named: "name" | "exclusion"; asked: number }

/** The question's second sentence: the language is the point (the lesson's emphasis), so it follows the rules in the brief. */
function wording(p: Pick): string {
  const { ctx, kind, num, den, named, asked } = p;
  const n = ctx.names, ph = (i: number) => (ctx.phrase ? ctx.phrase(i) : n[i]);
  // "people who chose squash" needs "the number of" in front of it to read as a quantity
  const people = !!ctx.phrase && ctx.phrase(0).startsWith("people who");
  const np = (i: number) => (people ? `the number of ${ph(i)}` : ph(i));
  const pickLine = (lines: string[]) => pick(lines);
  if (kind === "total") {
    if (named === "exclusion") {
      return pickLine([`What fraction of ${ctx.of} are not ${n[asked]}?`, `Find the fraction of ${ctx.of} that are not ${n[asked]}.`, ...(ctx.of.startsWith("the ") ? [`Write ${ctx.of} that are not ${n[asked]} as a fraction of the total.`] : [])]);
    }
    if (num.length === 1) {
      const i = num[0];
      return pickLine([`What fraction of ${ctx.of} are ${n[i]}?`, `Find the fraction of ${ctx.of} that are ${n[i]}.`, `Write ${n[i]} as a fraction of the total.`]);
    }
    const [i, j] = num;
    if (ctx.composite && ctx.composite.leftOut === asked) return pickLine([`What fraction of ${ctx.of} are ${ctx.composite.label}?`, `Find the fraction that are ${ctx.composite.label}.`]);
    return pickLine([`What fraction are ${n[i]} or ${n[j]}?`, `Find the fraction that are ${n[i]} or ${n[j]}.`, `Write ${n[i]} or ${n[j]} as a fraction of the total.`]);
  }
  if (kind === "rest") {
    const i = num[0], others = den.map((d) => n[d]);
    return pickLine([`Write ${np(i)} as a fraction of the rest (${list(others)} together).`, `Find ${np(i)} as a fraction of the rest (${list(others)} together).`]);
  }
  // of a part
  const j = den[0];
  if (num.length === 2) {
    if (named === "exclusion") return pickLine([`Write ${ctx.of} that are not ${n[j]} as a fraction of ${np(j)}.`]);
    const pair = people ? `the number of people who chose ${n[num[0]]} or ${n[num[1]]}` : `${ph(num[0])} and ${ph(num[1])} together`;
    return pickLine([`Write ${pair} as a fraction of ${np(j)}.`, `Find ${pair} as a fraction of ${np(j)}.`]);
  }
  const i = num[0];
  return pickLine([
    `Write the ${ctx.qty} of ${ph(i)} as a fraction of the ${ctx.qty} of ${ph(j)}.`,
    `Find ${np(i)} as a fraction of ${np(j)}.`,
    ...(ctx.colours ? [`What fraction of ${n[j]} are ${n[i]}?`] : []),
  ]);
}

// ── Working ───────────────────────────────────────────────────────────────────

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
/** A short, stable tag for the wording, so two worded versions of one question have different keys without any random id. */
const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(36); };

function barRows(p: Pick, roles: Record<number, "numerator" | "denominator" | "dim"> = {}): BarModelData["rows"] {
  return p.ctx.names.map((name, i) => ({ name: cap(name), units: p.v[i], ...(roles[i] ? { role: roles[i] } : {}) }));
}
const barStep = (caption: string, data: BarModelData): WorkingStep => ({ type: "fracBar", latex: "", plain: caption, extra: data });

/** The bar-model scaffold (Levels 1 and 2 unless Numerical method is on): a row of boxes per part, then what the fraction compares. */
function barSteps(p: Pick, T: number, d: number, n: number): WorkingStep[] {
  const { ctx, kind, num, den } = p, names = ctx.names;
  const first = barStep("Bar model: draw a row of boxes for each part of the ratio.", { parts: [], rows: barRows(p) });
  const numNames = list(num.map((i) => names[i])), roles: Record<number, "numerator" | "denominator" | "dim"> = {};
  num.forEach((i) => { roles[i] = "numerator"; });
  if (kind === "total") {
    return [first, barStep(`Shade the ${numNames} boxes (${n}). The total is every box: ${T} parts.`, { parts: [], rows: barRows(p, roles), sideBrace: { label: `total: ${T} parts` } })];
  }
  if (kind === "rest") {
    den.forEach((i) => { roles[i] = "denominator"; });
    return [first, barStep(`Shade the ${numNames} boxes (${n}). The rest is every other box: ${d} parts, not the total.`, { parts: [], rows: barRows(p, roles) })];
  }
  den.forEach((i) => { roles[i] = "denominator"; });
  names.forEach((_, i) => { if (!num.includes(i) && !den.includes(i)) roles[i] = "dim"; });
  const unused = names.filter((_, i) => roles[i] === "dim");
  return [first, barStep(`Compare the ${numNames} boxes (${n}) with the ${names[den[0]]} boxes (${d})${unused.length ? `. The ${list(unused)} boxes are not used` : ""}.`, { parts: [], rows: barRows(p, roles) })];
}

function numericSteps(p: Pick, T: number, n: number, d: number, simplest: boolean): WorkingStep[] {
  const { ctx, kind, num, den, v } = p, names = ctx.names, N = names.map(cap);
  const out: WorkingStep[] = [];
  if (p.named === "exclusion") out.push(tStep(`"Not ${names[p.asked]}" means ${list(num.map((i) => names[i]))}.`));
  const reduced = () => {
    const g = gcd(n, d), sn = n / g, sd = d / g;
    if (!simplest) return [];
    return sn === n ? [tStep("Already in simplest form")] : [step(`${frac(n, d)} = ${frac(sn, sd)}`)];
  };
  if (kind === "total") {
    out.push(step(`${v.join(" + ")} = ${T}`, `Total parts = ${T}`));
    out.push(tStep("The denominator is the total: every part added."));
    if (num.length === 1) out.push(mStep(`${N[num[0]]} =`, frac(n, d)));
    else {
      out.push(step(`${num.map((i) => v[i]).join(" + ")} = ${n}`, `${list(num.map((i) => names[i]))} = ${n}`));
      out.push(mStep("Fraction =", frac(n, d)));
    }
    return [...out, ...reduced()];
  }
  if (kind === "rest") {
    out.push(step(`${den.map((i) => v[i]).join(" + ")} = ${d}`, `The rest (${list(den.map((i) => names[i]))}) = ${d} parts`));
    out.push(tStep("The denominator is the rest, not the total: do not add every part."));
    out.push(mStep(`${N[num[0]]} =`, frac(n, d)));
    return [...out, ...reduced()];
  }
  // of a part
  const j = den[0];
  if (num.length === 2) {
    out.push(step(`${num.map((i) => v[i]).join(" + ")} = ${n}`, `${list(num.map((i) => names[i]))} together = ${n}`));
  }
  out.push(mStep(`${num.length === 1 ? N[num[0]] : "Together"} =`, `${n}`));
  out.push(mStep(`${N[j]} =`, `${d}`));
  out.push(tStep(`${N[j]} is the denominator: this is part : part, not part : whole.`));
  if (p.k === 3 && num.length === 1) out.push(tStep(`${cap(names.find((_, i) => i !== num[0] && i !== j)!)} is not used.`));
  out.push(step(frac(n, d)));
  out.push(tStep("Do not add the parts: we are not finding a fraction of the total."));
  out.push(...reduced());
  out.push(tStep(`Answer: ${num.length === 1 ? names[num[0]] : "together they are"} ${simplest ? `${n / gcd(n, d)}/${d / gcd(n, d)}` : `${n}/${d}`} of ${names[j]}`));
  return out;
}

// ── The generator ─────────────────────────────────────────────────────────────

const activeValues = (pool: ToolMultiSelect, values: Record<string, boolean>, ok: (value: string) => boolean = () => true) =>
  pool.options.filter((o) => values[o.value] && ok(o.value)).map((o) => o.value);

export const genRatioToFraction = (level: DifficultyLevel, variables: Record<string, boolean>, msv: Record<string, boolean> = {}): WordedQuestion => {
  const pools = poolsFor(level);
  const values = maskUnmetOptions(pools, resolveMultiSelectValues(pools, msv));
  const simplest = variables.simplestForm !== false;
  const numerical = variables.numerical ?? level === "level3";
  const fractionOf = level === "level1" ? null : FRACTION_OF[level === "level2" ? "level2" : "level3"];
  const sizes = level === "level1" ? [] : activeValues(ANSWER_SIZE, values);

  for (let attempt = 0; attempt < 600; attempt++) {
    const k: 2 | 3 = (pick(activeValues(PARTS, values).length ? activeValues(PARTS, values) : ["twoParts"]) === "threeParts" ? 3 : 2);
    // the kind of fraction: Level 1 is always of the total
    const kinds = level === "level1" ? ["ofTotal"] : activeValues(fractionOf!, values, (x) => k === 3 || x !== "ofRest");
    const kindValue = pick(kinds.length ? kinds : [level === "level3" ? "ofTotal" : "ofOtherPart"]);
    const kind: Kind = kindValue === "ofTotal" ? "total" : kindValue === "ofRest" ? "rest" : "part";
    // one part, or two together (three parts only, and never for "the rest")
    const together = k === 3 && kind !== "rest" && activeValues(NUMERATOR, values).includes("twoTogether") && (!activeValues(NUMERATOR, values).includes("onePart") || Math.random() < 0.5);
    // "not X" wording needs a part to leave out: any total question, or a part-of-a-part with two parts together
    const exclusionOn = activeValues(PART_NAMED, values).includes("byExclusion") && (!activeValues(PART_NAMED, values).includes("byName") || Math.random() < 0.5);
    const exclusion = exclusionOn && ((kind === "total" && (k === 2 || together)) || (kind === "part" && together));
    const askedChoices = activeValues(PART_ASKED, values, (x) => k === 3 || x !== "askThird");
    const asked = ({ askFirst: 0, askSecond: 1, askThird: 2 } as Record<string, number>)[pick(askedChoices.length ? askedChoices : ["askFirst", "askSecond"])];

    const ctx = pick(k === 2 ? TWO : THREE);
    const v = Array.from({ length: k }, () => (k === 2 ? randInt(2, 12) : randInt(1, 10)));
    if (new Set(v).size === 1) continue;                        // never a ratio like 4 : 4
    const idx = Array.from({ length: k }, (_, i) => i);
    // numerator and denominator parts
    let num: number[], den: number[];
    if (exclusion && k === 2) num = idx.filter((i) => i !== asked);
    else if (exclusion || together) num = idx.filter((i) => i !== asked);          // the part named (asked) is the one left out
    else num = [asked];
    if (kind === "total") den = idx;
    else if (kind === "rest") den = idx.filter((i) => !num.includes(i));
    else den = together || exclusion ? [asked] : [pick(idx.filter((i) => i !== asked))];
    const n = sum(num.map((i) => v[i])), d = sum(den.map((i) => v[i]));
    if (kind !== "total") {
      if (n === d || n % d === 0) continue;                      // never 1, and never a whole number such as 20/1
      const wanted = pick(sizes.length ? sizes : ["lessThanOne", "moreThanOne"]);
      if (wanted === "lessThanOne" ? n > d : n < d) continue;
    }
    const T = sum(v);
    const p: Pick = { ctx, k, v, kind, num, den, named: exclusion ? "exclusion" : "name", asked };
    const g = gcd(n, d), sn = simplest ? n / g : n, sd = simplest ? d / g : d;
    // the ratio, in words and in numbers, is a line of its own; the question follows on the next line
    const ratioLine = `${ctx.names.join(" : ")} = ${rs(...v)}`;
    const ask = wording(p);
    const working = [...(numerical ? [] : barSteps(p, T, d, n)), ...numericSteps(p, T, n, d, simplest)];
    return {
      kind: "worded", lines: [ratioLine, ask], answer: `${sn}/${sd}`, answerLatex: frac(sn, sd), working,
      key: `rtf-${level}-${kind}-${k}-${v.join("_")}-${num.join("")}-${den.join("")}-${p.named}-${simplest ? "s" : "u"}-${hash(ratioLine + ask)}`, difficulty: level,
    };
  }
  // unreachable with valid options; a plain Level 1 question keeps the generator total
  const a = randInt(2, 12), b = randInt(2, 12), T = a + b, g = gcd(a, T);
  return { kind: "worded", lines: [`red : blue = ${rs(a, b)}`, "What fraction of the beads are red?"], answer: `${a / g}/${T / g}`, answerLatex: frac(a / g, T / g), working: [step(`${a} + ${b} = ${T}`, `Total parts = ${T}`), mStep("Red =", frac(a, T))], key: `rtf-fallback-${a}-${b}`, difficulty: level };
};
