import { useState, useEffect, useRef, useCallback, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

const w = () => window as any;
const loadKaTeX = (() => {
  let promise: Promise<void> | null = null;
  return () => {
    if (promise) return promise;
    promise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || w().katex) { resolve(); return; }
      const link = document.createElement("link"); link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
      script.onload = () => resolve(); script.onerror = reject;
      document.head.appendChild(script);
    });
    return promise;
  };
})();

const MathRenderer = ({ latex, style, className }: { latex: string; style?: CSSProperties; className?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(() => typeof window !== "undefined" && !!w().katex);
  useEffect(() => { loadKaTeX().then(() => setReady(true)); }, []);
  useEffect(() => {
    if (!ready || !ref.current) return;
    try { w().katex.render(latex, ref.current, { displayMode: false, throwOnError: false, output: "html" }); }
    catch { if (ref.current) ref.current.textContent = latex; }
  }, [latex, ready]);
  const hasFrac = latex.includes("\\frac");
  return <span ref={ref} className={className} style={{ display: "inline", verticalAlign: "baseline", fontSize: hasFrac ? "1em" : "0.826em", ...style }} />;
};

// Renders a line of text that may contain $LaTeX$ fragments inline with prose.
const InlineMath = ({ text, className, style }: { text: string; className?: string; style?: CSSProperties }) => {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span className={className} style={{ display: "inline", lineHeight: "2", ...style }}>
      {parts.map((part, i) =>
        part.startsWith("$") && part.endsWith("$")
          ? <MathRenderer key={i} latex={part.slice(1, -1)} style={{ margin: "0 0.1em" }} />
          : <span key={i}>{part}</span>
      )}
    </span>
  );
};

const usePopover = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return { open, setOpen, ref };
};

const PopoverButton = ({ open, onClick }: { open: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
    Question Options <ChevronDown size={18} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
  </button>
);

const LV_LABELS: Record<string, string> = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
const LV_HEADER_COLORS: Record<string, string> = { level1: "text-green-600", level2: "text-yellow-500", level3: "text-red-600" };

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

type ToolType = "formingRatios" | "fractionToRatio" | "ratioToFraction";
type DifficultyLevel = "level1" | "level2" | "level3";

const TOOL_CONFIG = {
  pageTitle: "Fractions & Ratios",
  tools: {
    formingRatios: {
      name: "Forming Ratios", useSubstantialBoxes: true,
      variables: [
        { key: "threeWay", label: "3-Way Ratio", defaultValue: false },
        { key: "simplestForm", label: "Simplest Form", defaultValue: false },
      ],
      dropdown: null, difficultySettings: null,
    },
    fractionToRatio: {
      name: "Fraction to Ratio", useSubstantialBoxes: true,
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null },
        level2: { variables: [{ key: "findCommonDenominators", label: "Different Denominators", defaultValue: false }], dropdown: null },
        level3: {
          variables: [],
          dropdown: { key: "given", label: "Given", useTwoLineButtons: false, options: [{ value: "partA", label: "Part A" }, { value: "partB", label: "Part B" }, { value: "total", label: "Total" }, { value: "mixed", label: "Mixed" }], defaultValue: "mixed" },
        },
      },
    },
    ratioToFraction: {
      name: "Ratio to Fraction", useSubstantialBoxes: true,
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null },
        level2: {
          variables: [{ key: "simplestForm", label: "Simplest Form", defaultValue: true }],
          dropdown: { key: "target", label: "Target", useTwoLineButtons: false, options: [{ value: "singlePart", label: "Single" }, { value: "composite", label: "Composite" }, { value: "mixed", label: "Mixed" }], defaultValue: "mixed" },
        },
        level3: { variables: [], dropdown: null },
      },
    },
  } as Record<string, {
    name: string; instruction?: string; useSubstantialBoxes: boolean;
    variables: { key: string; label: string; defaultValue: boolean }[];
    dropdown: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[]; defaultValue: string } | null;
    difficultySettings: Record<string, { dropdown?: any; variables?: { key: string; label: string; defaultValue: boolean }[] }> | null;
  }>,
};

const INFO_SECTIONS = [
  { title: "Forming Ratios", icon: "🔢", content: [
    { label: "Overview", detail: "Form ratios from counts, totals with remainders, or constraint-based descriptions." },
    { label: "Level 1 — Green", detail: "Direct count: given the number of each item, write the ratio in the requested order." },
    { label: "Level 2 — Yellow", detail: "Total with remainder: given the total and some counts, find the rest then form the ratio." },
    { label: "Level 3 — Red", detail: "Constraint-based: a percentage or fraction of the total is given for one part; calculate all parts then form the ratio." },
    { label: "Options", detail: "3-Way Ratio: introduces a third part. Simplest Form: requires cancelling common factors in the answer." },
  ]},
  { title: "Fraction to Ratio", icon: "➗", content: [
    { label: "Overview", detail: "Convert a fraction (part-of-whole) into a part:part or multi-part ratio." },
    { label: "Level 1 — Green", detail: "One fraction given; find the complementary part and write the two-part ratio." },
    { label: "Level 2 — Yellow", detail: "Two fractions given; find the third part (the remainder) and write the three-part ratio in any order." },
    { label: "Level 3 — Red", detail: "An actual quantity is also given (total, Part A, or Part B). Work out all quantities then write the ratio as actual amounts." },
  ]},
  { title: "Ratio to Fraction", icon: "½", content: [
    { label: "Overview", detail: "Convert a ratio into a fraction of the total or a fraction of one part relative to another." },
    { label: "Level 1 — Green", detail: "Two-part ratio; write one part as a fraction of the total (part-to-whole)." },
    { label: "Level 2 — Yellow", detail: "Three-part ratio; write one part (or a composite of two parts) as a fraction of the total." },
    { label: "Level 3 — Red", detail: "Part-to-part comparison: write one quantity as a fraction of the other (not of the total)." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard", detail: "Single question on the left, working space on the right. Visualiser available." },
    { label: "Worked Example", detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet", detail: "Grid of questions with PDF export." },
  ]},
];

// ── Question interfaces ───────────────────────────────────────────────────────

interface WorkingStep { type: string; latex: string; plain: string; label?: string; unit?: string; }

interface WordedQuestion {
  kind: "worded";
  lines: string[];
  answer: string;
  answerLatex: string;
  working: WorkingStep[];
  key: string;
  difficulty: string;
}
type AnyQuestion = WordedQuestion;

// ── Maths helpers ─────────────────────────────────────────────────────────────

const gcd = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd(b, a % b);
const gcdThree = (a: number, b: number, c: number) => gcd(gcd(a, b), c);
const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b);
const simplifyRatioParts = (parts: number[]): number[] => {
  const d = parts.length === 3 ? gcdThree(parts[0], parts[1], parts[2]) : gcd(parts[0], parts[1]);
  return parts.map(p => p / d);
};

// fracStr(n,d) → "$\frac{n}{d}$" for use in InlineMath lines
const fracStr = (n: number, d: number) => `$\\frac{${n}}{${d}}$`;
// frac(n,d) → LaTeX string for use directly in step()/mStep()
const frac = (n: number, d: number) => `\\frac{${n}}{${d}}`;
// mStr → wraps a number or expression for KaTeX in InlineMath lines
const mStr = (x: number | string) => `$${x}$`;
// rLatex → ratio as a KaTeX string e.g. "3 : 4" for use in step()/mStep()/answerLatex
const rLatex = (...parts: number[]) => parts.join(" : ");
// rStr → InlineMath-ready ratio: "$3 : 4$"
const rStr = (...parts: number[]) => `$${rLatex(...parts)}$`;

const getSimplificationSteps = (parts: number[]): WorkingStep[] => {
  const steps: WorkingStep[] = []; let cur = [...parts];
  const primes = [2, 3, 5, 7, 11, 13];
  while (true) {
    let found = false;
    for (const p of primes) {
      if (cur.every(n => n % p === 0)) {
        const next = cur.map(n => n / p);
        steps.push(step(`${rLatex(...cur)} \\div ${p} = ${rLatex(...next)}`));
        cur = next; found = true; break;
      }
    }
    if (!found) break;
  }
  return steps;
};

const generateSimplestFraction = (): { num: number; den: number } => {
  while (true) {
    const den = Math.floor(Math.random() * 10) + 3;
    const num = Math.floor(Math.random() * (den - 1)) + 1;
    const g = gcd(num, den); const sn = num / g, sd = den / g;
    if (sn === 1 && sd === 2) continue;
    return { num: sn, den: sd };
  }
};

const convertToCommonDenominator = (f1: { num: number; den: number }, f2: { num: number; den: number }) => {
  const lcd = lcm(f1.den, f2.den); const m1 = lcd / f1.den, m2 = lcd / f2.den;
  return {
    newNum1: f1.num * m1, newNum2: f2.num * m2, lcd,
    steps: [
      mStep("LCD:", `${f1.den} \\text{ and } ${f2.den} \\Rightarrow ${lcd}`),
      step(`${frac(f1.num, f1.den)} = ${frac(f1.num * m1, lcd)}`),
      step(`${frac(f2.num, f2.den)} = ${frac(f2.num * m2, lcd)}`),
    ],
  };
};

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

// Working step helpers
const step  = (latex: string, plain?: string): WorkingStep => ({ type: "step",  latex, plain: plain ?? latex });
const tStep = (text: string): WorkingStep => ({ type: "tStep", latex: `\\text{${text}}`, plain: text });
const mStep = (label: string, latex: string, unit?: string): WorkingStep => ({ type: "mStep", latex, plain: `${label} ${latex}${unit ? " " + unit : ""}`, label, unit });

// ── ratioToFraction ───────────────────────────────────────────────────────────

const genRatioToFraction = (level: DifficultyLevel, variables: Record<string, boolean>, dropdownValue: string): WordedQuestion => {
  const id = randInt(0, 999999);

  if (level === "level1") {
    const ctx = pick([
      { scenario: "beads", parts: ["red", "blue"] },
      { scenario: "students", parts: ["boys", "girls"] },
      { scenario: "games", parts: ["wins", "losses"] },
      { scenario: "marbles", parts: ["red", "blue"] },
      { scenario: "counters", parts: ["green", "yellow"] },
    ]);
    const a = randInt(2, 12), b = randInt(2, 12), total = a + b;
    const whichPart = Math.random() < 0.5 ? 0 : 1;
    const numerator = whichPart === 0 ? a : b;
    const partName = ctx.parts[whichPart];
    const g = gcd(numerator, total); const sn = numerator / g, sd = total / g;
    const af = frac(sn, sd);

    // ratio stays as plain prose label since parts are word-based (red:blue etc.)
    // but the numeric ratio values go in KaTeX via rStr
    const style = randInt(0, 2);
    const line = style === 0
      ? `The ratio of ${ctx.parts[0]} to ${ctx.parts[1]} is ${rStr(a, b)}. What fraction of the ${ctx.scenario} are ${partName}?`
      : style === 1
        ? `The ratio of ${ctx.parts[0]} to ${ctx.parts[1]} is ${rStr(a, b)}. Find the fraction of ${ctx.scenario} that are ${partName}.`
        : `The ratio of ${ctx.parts[0]} to ${ctx.parts[1]} is ${rStr(a, b)}. Write ${partName} as a fraction of the total.`;

    return {
      kind: "worded", lines: [line], answer: `${sn}/${sd}`, answerLatex: af,
      working: [
        step(`${a} + ${b} = ${total}`, `Total parts = ${total}`),
        mStep(partName.charAt(0).toUpperCase() + partName.slice(1) + " =", frac(numerator, total)),
        sn === numerator ? tStep("Already in simplest form") : step(`${frac(numerator, total)} = ${frac(sn, sd)}`),
      ],
      key: `rtf-l1-${a}-${b}-${whichPart}-${id}`, difficulty: level,
    };
  }

  if (level === "level2") {
    const ctx = pick([
      { scenario: "people playing sports", parts: ["Football", "Squash", "Tennis"], compositeLabel: "racket sports", compositeIndices: [1, 2] },
      { scenario: "people playing sports", parts: ["Football", "Rugby", "Tennis"], compositeLabel: "team sports", compositeIndices: [0, 1] },
      { scenario: "ingredients", parts: ["Flour", "Milk", "Eggs"], compositeLabel: "wet ingredients", compositeIndices: [1, 2] },
      { scenario: "transport methods", parts: ["Car", "Bus", "Bicycle"], compositeLabel: "public transport or cycling", compositeIndices: [1, 2] },
      { scenario: "people playing sports", parts: ["Swimming", "Football", "Tennis"], compositeLabel: "ball sports", compositeIndices: [1, 2] },
    ]);
    const a = randInt(1, 10), b = randInt(1, 10), c = randInt(1, 10), total = a + b + c;
    const simplestFormEnabled = variables.simplestForm !== false;
    const actualTarget = dropdownValue === "mixed" ? (Math.random() < 0.5 ? "singlePart" : "composite") : dropdownValue;
    const isComposite = actualTarget === "composite";
    let numerator = 0, targetDescription = "", line = "";

    if (!isComposite) {
      const wp = randInt(0, 2); numerator = [a, b, c][wp]; const pn = ctx.parts[wp];
      const style = randInt(0, 2);
      line = style === 0
        ? `The ratio of ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]} is ${rStr(a, b, c)}. What fraction of ${ctx.scenario} are ${pn}?`
        : style === 1
          ? `The ratio of ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]} is ${rStr(a, b, c)}. Find the fraction that are ${pn}.`
          : `The ratio of ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]} is ${rStr(a, b, c)}. Write ${pn} as a fraction of the total.`;
      targetDescription = pn;
    } else {
      const idx = ctx.compositeIndices;
      const v1 = [a, b, c][idx[0]], v2 = [a, b, c][idx[1]]; numerator = v1 + v2;
      const useNatural = Math.random() < 0.5;
      if (useNatural) {
        line = randInt(0, 1) === 0
          ? `The ratio of ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]} is ${rStr(a, b, c)}. What fraction of ${ctx.scenario} are ${ctx.compositeLabel}?`
          : `The ratio of ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]} is ${rStr(a, b, c)}. Find the fraction that are ${ctx.compositeLabel}.`;
        targetDescription = ctx.compositeLabel;
      } else {
        line = randInt(0, 1) === 0
          ? `The ratio of ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]} is ${rStr(a, b, c)}. What fraction are ${ctx.parts[idx[0]]} or ${ctx.parts[idx[1]]}?`
          : `The ratio of ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]} is ${rStr(a, b, c)}. Find the fraction that are ${ctx.parts[idx[0]]} or ${ctx.parts[idx[1]]}.`;
        targetDescription = `${ctx.parts[idx[0]]} or ${ctx.parts[idx[1]]}`;
      }
    }

    let sn = numerator, sd = total;
    if (simplestFormEnabled) { const g = gcd(numerator, total); sn = numerator / g; sd = total / g; }
    const af = frac(sn, sd);
    const tdCap = targetDescription.charAt(0).toUpperCase() + targetDescription.slice(1);

    let workingSteps: WorkingStep[];
    if (isComposite) {
      const idx = ctx.compositeIndices; const v1 = [a, b, c][idx[0]], v2 = [a, b, c][idx[1]];
      workingSteps = [
        step(`${a} + ${b} + ${c} = ${total}`, `Total parts = ${total}`),
        step(`${v1} + ${v2} = ${numerator}`, `${tdCap} = ${numerator}`),
        mStep("Fraction =", frac(numerator, total)),
        simplestFormEnabled && sn !== numerator ? step(`${frac(numerator, total)} = ${frac(sn, sd)}`) : tStep("Already in simplest form"),
      ];
    } else {
      workingSteps = [
        step(`${a} + ${b} + ${c} = ${total}`, `Total parts = ${total}`),
        mStep(tdCap + " =", frac(numerator, total)),
        simplestFormEnabled && sn !== numerator ? step(`${frac(numerator, total)} = ${frac(sn, sd)}`) : tStep("Already in simplest form"),
      ];
    }
    return { kind: "worded", lines: [line], answer: `${sn}/${sd}`, answerLatex: af, working: workingSteps, key: `rtf-l2-${a}-${b}-${c}-${actualTarget}-${isComposite}-${id}`, difficulty: level };
  }

  // Level 3: part-to-part
  const ctx = pick([
    { item1: "apples", item2: "oranges" }, { item1: "bananas", item2: "grapes" },
    { item1: "pound coins", item2: "fifty pence coins" }, { item1: "ten pound notes", item2: "five pound notes" },
    { item1: "Year 7s", item2: "Year 8s" }, { item1: "adults", item2: "children" },
  ]);
  const a = randInt(2, 12), b = randInt(2, 12);
  if (a === b) return genRatioToFraction(level, variables, dropdownValue);
  const orderReversed = Math.random() < 0.5;
  const numerator = orderReversed ? b : a, denominator = orderReversed ? a : b;
  const numeratorName = orderReversed ? ctx.item2 : ctx.item1;
  const denominatorName = orderReversed ? ctx.item1 : ctx.item2;
  const g = gcd(numerator, denominator); const sn = numerator / g, sd = denominator / g;
  const af = frac(sn, sd);
  const line = Math.random() < 0.5
    ? `The ratio of ${ctx.item1} to ${ctx.item2} is ${rStr(a, b)}. Write the amount of ${numeratorName} as a fraction of the amount of ${denominatorName}.`
    : `The ratio of ${ctx.item1} to ${ctx.item2} is ${rStr(a, b)}. Find ${numeratorName} as a fraction of ${denominatorName}.`;
  return {
    kind: "worded", lines: [line], answer: `${sn}/${sd}`, answerLatex: af,
    working: [
      mStep(`${ctx.item1.charAt(0).toUpperCase() + ctx.item1.slice(1)} =`, `${a},\\quad ${ctx.item2.charAt(0).toUpperCase() + ctx.item2.slice(1)} = ${b}`),
      tStep(`${denominatorName.charAt(0).toUpperCase() + denominatorName.slice(1)} is the denominator — part : part, not part : whole`),
      step(frac(numerator, denominator)),
      tStep(`Do not add the parts — we are not finding a fraction of the total`),
      ...(sn !== numerator ? [step(`${frac(numerator, denominator)} = ${frac(sn, sd)}`)] : [tStep("Already in simplest form")]),
      tStep(`Answer: ${numeratorName} is ${sn}/${sd} of ${denominatorName}`),
    ],
    key: `rtf-l3-${a}-${b}-${orderReversed}-${id}`, difficulty: level,
  };
};

// ── fractionToRatio ───────────────────────────────────────────────────────────

const genFractionToRatio = (level: DifficultyLevel, variables: Record<string, boolean>, dropdownValue: string): WordedQuestion => {
  const id = randInt(0, 999999);

  if (level === "level1") {
    const ctx = pick([
      { item: "beads", colors: ["Red", "Blue"] }, { item: "sweets", colors: ["Purple", "Orange"] },
      { item: "marbles", colors: ["Pink", "White"] }, { item: "counters", colors: ["Black", "Silver"] },
      { item: "balls", colors: ["Red", "Blue"] },
    ]);
    const { num, den } = generateSimplestFraction();
    const pA = num, pB = den - num;
    if (pA === pB) return genFractionToRatio(level, variables, dropdownValue);
    const rev = Math.random() < 0.5; const [cA, cB] = ctx.colors;
    const prose = Math.random() < 0.5;
    // word labels (Red, Blue) stay as prose; numeric ratio → rStr
    const line = rev
      ? prose
        ? `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. Write the ratio of ${cB} to ${cA}.`
        : `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. Find ${cB} : ${cA}.`
      : prose
        ? `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. Write the ratio of ${cA} to ${cB}.`
        : `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. Find ${cA} : ${cB}.`;
    const ansLatex = rev ? rLatex(pB, pA) : rLatex(pA, pB);
    return {
      kind: "worded", lines: [line], answer: ansLatex, answerLatex: ansLatex,
      working: [
        mStep(cA + " =", frac(num, den)),
        step(`${den} - ${num} = ${pB}`, `${cB} = ${pB} (${den} parts total)`),
        mStep(cB + " =", frac(pB, den)),
        mStep("Ratio =", rev ? rLatex(pB, pA) : rLatex(pA, pB)),
      ],
      key: `ftr-l1-${num}-${den}-${rev}-${id}`, difficulty: level,
    };
  }

  if (level === "level2") {
    const ctx = pick([
      { item: "beads", parts: ["Red", "Blue", "Green"] }, { item: "sweets", parts: ["Strawberry", "Lemon", "Orange"] },
      { item: "marbles", parts: ["Clear", "Spotted", "Striped"] }, { item: "flowers", parts: ["Roses", "Tulips", "Daisies"] },
    ]);
    const findCD = variables.findCommonDenominators || false;
    let f1 = 0, f2 = 0, den = 0, f3 = 0;
    let oF1: { num: number; den: number } | null = null, oF2: { num: number; den: number } | null = null;
    let cdSteps: WorkingStep[] = [];
    let tries = 0;
    while (tries++ < 200) {
      if (findCD) {
        const fa = generateSimplestFraction(), fb = generateSimplestFraction();
        if (fa.den === fb.den) continue;
        const r = convertToCommonDenominator(fa, fb);
        if (r.newNum1 + r.newNum2 >= r.lcd) continue;
        f1 = r.newNum1; f2 = r.newNum2; den = r.lcd; f3 = den - f1 - f2;
        oF1 = fa; oF2 = fb; cdSteps = r.steps; break;
      } else {
        den = randInt(5, 12); f1 = randInt(1, den - 2); f2 = randInt(1, den - f1 - 1);
        if (f1 + f2 >= den) continue; f3 = den - f1 - f2; break;
      }
    }
    const oc = randInt(0, 5); const P = ctx.parts;
    const ords = [
      { parts: [f1, f2, f3] }, { parts: [f1, f3, f2] },
      { parts: [f2, f1, f3] }, { parts: [f2, f3, f1] },
      { parts: [f3, f1, f2] }, { parts: [f3, f2, f1] },
    ];
    const ordLabels = [
      `${P[0]}:${P[1]}:${P[2]}`, `${P[0]}:${P[2]}:${P[1]}`,
      `${P[1]}:${P[0]}:${P[2]}`, `${P[1]}:${P[2]}:${P[0]}`,
      `${P[2]}:${P[0]}:${P[1]}`, `${P[2]}:${P[1]}:${P[0]}`,
    ];
    const { parts: ansParts } = ords[oc];
    const reqOrder = ordLabels[oc];
    const prose = Math.random() < 0.5;
    const ansLatex = rLatex(...ansParts);
    // word labels stay as prose; ratio order label stays as prose; numeric ratio → rStr in working
    const line = findCD && oF1 && oF2
      ? prose
        ? `In a bag of ${ctx.item}, ${fracStr(oF1.num, oF1.den)} are ${P[0]} and ${fracStr(oF2.num, oF2.den)} are ${P[1]}. The rest are ${P[2]}. Write the ratio ${reqOrder}.`
        : `In a bag of ${ctx.item}, ${fracStr(oF1.num, oF1.den)} are ${P[0]} and ${fracStr(oF2.num, oF2.den)} are ${P[1]}. The rest are ${P[2]}. Find ${reqOrder}.`
      : prose
        ? `In a bag of ${ctx.item}, ${fracStr(f1, den)} are ${P[0]} and ${fracStr(f2, den)} are ${P[1]}. The rest are ${P[2]}. Write the ratio ${reqOrder}.`
        : `In a bag of ${ctx.item}, ${fracStr(f1, den)} are ${P[0]} and ${fracStr(f2, den)} are ${P[1]}. The rest are ${P[2]}. Find ${reqOrder}.`;
    const baseSteps: WorkingStep[] = findCD ? cdSteps : [mStep(P[0] + " =", frac(f1, den)), mStep(P[1] + " =", frac(f2, den))];
    return {
      kind: "worded", lines: [line], answer: ansLatex, answerLatex: ansLatex,
      working: [
        ...baseSteps,
        step(`${den} - ${f1} - ${f2} = ${f3}`, `${P[2]} = ${f3} parts`),
        mStep(P[2] + " =", frac(f3, den)),
        mStep("Ratio =", rLatex(f1, f2, f3)),
      ],
      key: `ftr-l2-${f1}-${f2}-${den}-${oc}-${id}`, difficulty: level,
    };
  }

  // Level 3: quantity-based
  const ctx = pick([
    { item: "beads", colors: ["Red", "Blue"] }, { item: "sweets", colors: ["Strawberry", "Lemon"] },
    { item: "marbles", colors: ["Glass", "Plastic"] }, { item: "counters", colors: ["Yellow", "Green"] },
  ]);
  const { num, den } = generateSimplestFraction();
  const actualGiven = dropdownValue === "mixed" ? pick(["partA", "partB", "total"]) : dropdownValue;
  const mult = randInt(2, 6), total = den * mult, pA = num * mult, pB = total - pA;
  const rev = Math.random() < 0.5; const [cA, cB] = ctx.colors;
  const ansLatex = rev ? rLatex(pB, pA) : rLatex(pA, pB);
  let line: string; let wSteps: WorkingStep[];

  if (actualGiven === "total") {
    line = rev
      ? `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. There are ${mStr(total)} ${ctx.item} in total. Write the ratio ${cB} : ${cA}.`
      : `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. There are ${mStr(total)} ${ctx.item} in total. Write the ratio ${cA} : ${cB}.`;
    wSteps = [
      step(`${total} \\div ${den} = ${mult}`, `Total = ${total}, so 1 part = ${mult}`),
      step(`${num} \\times ${mult} = ${pA}`, `${cA} = ${pA}`),
      step(`${den - num} \\times ${mult} = ${pB}`, `${cB} = ${pB}`),
      mStep("Ratio =", rev ? rLatex(pB, pA) : rLatex(pA, pB)),
    ];
  } else if (actualGiven === "partB") {
    line = rev
      ? `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. There are ${mStr(pB)} ${cB} ${ctx.item}. Write the ratio ${cB} : ${cA}.`
      : `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. There are ${mStr(pB)} ${cB} ${ctx.item}. Write the ratio ${cA} : ${cB}.`;
    wSteps = [
      mStep(cA + " =", frac(num, den)),
      mStep(`so ${cB} =`, frac(den - num, den)),
      step(`${pB} \\div ${den - num} = ${mult}`, `${den - num} parts = ${pB}, so 1 part = ${mult}`),
      step(`${num} \\times ${mult} = ${pA}`, `${cA} = ${pA}`),
      mStep("Ratio =", rev ? rLatex(pB, pA) : rLatex(pA, pB)),
    ];
  } else {
    line = rev
      ? `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. There are ${mStr(pA)} ${cA} ${ctx.item}. Write the ratio ${cB} : ${cA}.`
      : `In a bag of ${ctx.item}, ${fracStr(num, den)} are ${cA} and the rest are ${cB}. There are ${mStr(pA)} ${cA} ${ctx.item}. Write the ratio ${cA} : ${cB}.`;
    wSteps = [
      mStep(cA + " =", frac(num, den)),
      step(`${pA} \\div ${num} = ${mult}`, `${num} parts = ${pA}, so 1 part = ${mult}`),
      step(`${den} \\times ${mult} = ${total}`, `Total = ${total}`),
      step(`${total} - ${pA} = ${pB}`, `${cB} = ${pB}`),
      mStep("Ratio =", rev ? rLatex(pB, pA) : rLatex(pA, pB)),
    ];
  }
  return { kind: "worded", lines: [line], answer: ansLatex, answerLatex: ansLatex, working: wSteps, key: `ftr-l3-${num}-${den}-${total}-${actualGiven}-${rev}-${id}`, difficulty: level };
};

// ── formingRatios ─────────────────────────────────────────────────────────────

const genFormingRatios = (level: DifficultyLevel, variables: Record<string, boolean>): WordedQuestion => {
  const id = randInt(0, 999999);
  const threeWay = variables.threeWay || false;
  const simplestForm = variables.simplestForm || false;
  const sfText = simplestForm ? " in its simplest form" : "";

  const buildAnswerLatex = (parts: number[]) =>
    simplestForm ? rLatex(...simplifyRatioParts(parts)) : rLatex(...parts);

  const buildSimplificationWorking = (parts: number[]): WorkingStep[] =>
    simplestForm ? [mStep("Original:", rLatex(...parts)), ...getSimplificationSteps(parts)] : [];

  if (level === "level1") {
    const ctxs2 = [
      { items: ["apples", "oranges"], container: "basket" }, { items: ["cats", "dogs"], container: "pet shelter" },
      { items: ["red cars", "blue cars"], container: "car park" }, { items: ["boys", "girls"], container: "classroom" },
      { items: ["pencils", "pens"], container: "pencil case" },
    ];
    const ctxs3 = [
      { items: ["cows", "sheep", "pigs"], container: "farm" }, { items: ["red sweets", "blue sweets", "green sweets"], container: "jar" },
      { items: ["footballs", "basketballs", "tennis balls"], container: "sports hall" },
      { items: ["roses", "tulips", "daisies"], container: "garden" }, { items: ["Y7s", "Y8s", "Y9s"], container: "school trip" },
    ];
    const gcds = [1, 1, 1, 2, 2, 3, 3, 4, 5, 6];
    if (threeWay) {
      const ctx = pick(ctxs3); const g = pick(gcds);
      const a = randInt(2, 15) * g, b = randInt(2, 15) * g, c = randInt(2, 15) * g;
      const order = randInt(0, 5);
      const ords = [
        { label: `${ctx.items[0]}:${ctx.items[1]}:${ctx.items[2]}`, parts: [a, b, c] },
        { label: `${ctx.items[0]}:${ctx.items[2]}:${ctx.items[1]}`, parts: [a, c, b] },
        { label: `${ctx.items[1]}:${ctx.items[0]}:${ctx.items[2]}`, parts: [b, a, c] },
        { label: `${ctx.items[1]}:${ctx.items[2]}:${ctx.items[0]}`, parts: [b, c, a] },
        { label: `${ctx.items[2]}:${ctx.items[0]}:${ctx.items[1]}`, parts: [c, a, b] },
        { label: `${ctx.items[2]}:${ctx.items[1]}:${ctx.items[0]}`, parts: [c, b, a] },
      ];
      const { label, parts } = ords[order];
      const ansLatex = buildAnswerLatex(parts);
      const line = Math.random() < 0.5
        ? `A ${ctx.container} has ${mStr(a)} ${ctx.items[0]}, ${mStr(b)} ${ctx.items[1]}, and ${mStr(c)} ${ctx.items[2]}. Write the ratio ${label}${sfText}.`
        : `There are ${mStr(a)} ${ctx.items[0]}, ${mStr(b)} ${ctx.items[1]}, and ${mStr(c)} ${ctx.items[2]} in a ${ctx.container}. Find ${label}${sfText}.`;
      return { kind: "worded", lines: [line], answer: ansLatex, answerLatex: ansLatex, working: [mStep("Ratio =", rLatex(a, b, c)), ...buildSimplificationWorking(parts)], key: `fr-l1-3w-${a}-${b}-${c}-${order}-${id}`, difficulty: level };
    } else {
      const ctx = pick(ctxs2); const g = pick(gcds);
      const a = randInt(2, 20) * g, b = randInt(2, 20) * g;
      if (a === b) return genFormingRatios(level, variables);
      const rev = Math.random() < 0.5;
      const parts = rev ? [b, a] : [a, b];
      const label = rev ? `${ctx.items[1]}:${ctx.items[0]}` : `${ctx.items[0]}:${ctx.items[1]}`;
      const ansLatex = buildAnswerLatex(parts);
      const line = Math.random() < 0.5
        ? `A ${ctx.container} has ${mStr(a)} ${ctx.items[0]} and ${mStr(b)} ${ctx.items[1]}. Write the ratio ${label}${sfText}.`
        : `There are ${mStr(a)} ${ctx.items[0]} and ${mStr(b)} ${ctx.items[1]} in a ${ctx.container}. Find ${label}${sfText}.`;
      return { kind: "worded", lines: [line], answer: ansLatex, answerLatex: ansLatex, working: [mStep("Ratio =", rLatex(a, b)), ...buildSimplificationWorking(parts)], key: `fr-l1-2w-${a}-${b}-${rev}-${id}`, difficulty: level };
    }
  }

  if (level === "level2") {
    const ctxs2 = [
      { item: "sweets", container: "bag", parts: ["red", "blue"] }, { item: "students", container: "class", parts: ["boys", "girls"] },
      { item: "cars", container: "car park", parts: ["red", "blue"] }, { item: "books", container: "library", parts: ["fiction", "non-fiction"] },
    ];
    const ctxs3 = [
      { item: "sweets", container: "bag", parts: ["red", "blue", "green"] }, { item: "marbles", container: "jar", parts: ["red", "yellow", "blue"] },
      { item: "counters", container: "box", parts: ["red", "blue", "green"] }, { item: "flowers", container: "vase", parts: ["roses", "tulips", "daisies"] },
    ];
    const gcds2 = [2, 2, 2, 3, 3, 4, 5, 6];
    if (threeWay) {
      const ctx = pick(ctxs3); const total = randInt(10, 80);
      let first = 0, second = 0, third = 0;
      if (Math.random() < 0.6) {
        const cf = pick(gcds2); const mx = Math.floor(total / (3 * cf));
        if (mx >= 2) { const bf = randInt(1, mx - 1), bs = randInt(1, mx - 1), bt = Math.floor(total / cf) - bf - bs; if (bt > 0 && (bf + bs + bt) * cf === total) { first = bf * cf; second = bs * cf; third = bt * cf; } }
      }
      if (!first || !second || !third || first + second + third !== total) {
        const mn = Math.max(1, Math.floor(total * 0.1)), mx = Math.floor(total * 0.7);
        first = randInt(mn, mx); const rem = total - first;
        second = randInt(Math.max(1, Math.floor(rem * 0.2)), Math.floor(rem * 0.8)); third = total - first - second;
      }
      const ansLatex = buildAnswerLatex([first, second, third]);
      const op = randInt(0, 2);
      const dp = op === 0 ? `${mStr(first)} are ${ctx.parts[0]}, ${mStr(second)} are ${ctx.parts[1]}, and the rest are ${ctx.parts[2]}`
        : op === 1 ? `${mStr(first)} are ${ctx.parts[0]}, ${mStr(third)} are ${ctx.parts[2]}, and the rest are ${ctx.parts[1]}`
          : `${mStr(second)} are ${ctx.parts[1]}, ${mStr(third)} are ${ctx.parts[2]}, and the rest are ${ctx.parts[0]}`;
      const line = `A ${ctx.container} contains ${mStr(total)} ${ctx.item}. ${dp}. Write the ratio ${ctx.parts[0]}:${ctx.parts[1]}:${ctx.parts[2]}${sfText}.`;
      return {
        kind: "worded", lines: [line], answer: ansLatex, answerLatex: ansLatex,
        working: [
          step(`${total} - ${first} - ${second} = ${third}`, `Remainder = ${third}`),
          mStep("Ratio =", rLatex(first, second, third)),
          ...buildSimplificationWorking([first, second, third]),
        ],
        key: `fr-l2-3w-${total}-${first}-${second}-${third}-${id}`, difficulty: level,
      };
    } else {
      const ctx = pick(ctxs2); const total = randInt(10, 80);
      let first = 0, second = 0;
      if (Math.random() < 0.6) {
        const cf = pick(gcds2); const mx = Math.floor(total / (2 * cf));
        if (mx >= 2) { const bf = randInt(1, mx - 1), bs = Math.floor(total / cf) - bf; if (bs > 0 && (bf + bs) * cf === total) { first = bf * cf; second = bs * cf; } }
      }
      if (!first || !second || first + second !== total) { first = randInt(Math.max(1, Math.floor(total * 0.15)), Math.floor(total * 0.85)); second = total - first; }
      const ansLatex = buildAnswerLatex([first, second]);
      const line = `A ${ctx.container} contains ${mStr(total)} ${ctx.item}. ${mStr(first)} are ${ctx.parts[0]} and the rest are ${ctx.parts[1]}. Write the ratio ${ctx.parts[0]}:${ctx.parts[1]}${sfText}.`;
      return {
        kind: "worded", lines: [line], answer: ansLatex, answerLatex: ansLatex,
        working: [
          step(`${total} - ${first} = ${second}`, `Remainder = ${second}`),
          mStep("Ratio =", rLatex(first, second)),
          ...buildSimplificationWorking([first, second]),
        ],
        key: `fr-l2-2w-${total}-${first}-${second}-${id}`, difficulty: level,
      };
    }
  }

  // Level 3: constraint-based
  const ctxs2L3 = [
    { item: "people", parts: ["adults", "children"], container: "room" }, { item: "animals", parts: ["dogs", "cats"], container: "shelter" },
    { item: "students", parts: ["boys", "girls"], container: "school" }, { item: "cars", parts: ["electric", "petrol"], container: "car park" },
  ];
  const ctxs3L3 = [
    { item: "people", parts: ["men", "women", "children"], container: "room" }, { item: "students", parts: ["Y7", "Y8", "Y9"], container: "trip" },
    { item: "sweets", parts: ["red", "blue", "green"], container: "bag" }, { item: "books", parts: ["fiction", "non-fiction", "reference"], container: "library" },
  ];
  const percentages = [10, 20, 25, 30, 40, 50, 60, 70, 75];
  const fracs2 = [
    { num: 1, den: 2 }, { num: 1, den: 3 }, { num: 2, den: 3 }, { num: 1, den: 4 }, { num: 3, den: 4 },
    { num: 1, den: 5 }, { num: 2, den: 5 }, { num: 3, den: 5 }, { num: 4, den: 5 },
  ];

  let valid = false, tries2 = 0;
  let total2 = 0, p1 = 0, p2 = 0, p3 = 0;
  let constraintLine = "", calcSteps: WorkingStep[] = [], ansLatex2 = "", finalLine = "";
  const ctx2 = pick(ctxs2L3); const ctx3 = pick(ctxs3L3);

  while (!valid && tries2++ < 300) {
    total2 = randInt(40, 100); const usePct = Math.random() < 0.5;
    if (threeWay) {
      const ctx = ctx3; const pattern = randInt(0, 1);
      if (pattern === 0) {
        if (usePct) {
          const pct = pick(percentages); p1 = Math.round(total2 * pct / 100);
          if (p1 !== total2 * pct / 100) continue;
          p2 = randInt(1, total2 - p1 - 1); p3 = total2 - p1 - p2;
          constraintLine = `${mStr(pct + "\\%")} are ${ctx.parts[0]}. ${mStr(p2)} are ${ctx.parts[1]}. The rest are ${ctx.parts[2]}.`;
          calcSteps = [
            step(`${pct}\\% \\times ${total2} = ${p1}`, `${ctx.parts[0]}: ${pct}% of ${total2} = ${p1}`),
            step(`${total2} - ${p1} - ${p2} = ${p3}`, `${ctx.parts[2]}: ${p3}`),
          ];
        } else {
          const fr = pick(fracs2); p1 = Math.round(total2 * fr.num / fr.den);
          if (p1 !== total2 * fr.num / fr.den) continue;
          p2 = randInt(1, total2 - p1 - 1); p3 = total2 - p1 - p2;
          constraintLine = `${fracStr(fr.num, fr.den)} are ${ctx.parts[0]}. ${mStr(p2)} are ${ctx.parts[1]}. The rest are ${ctx.parts[2]}.`;
          calcSteps = [
            step(`${frac(fr.num, fr.den)} \\times ${total2} = ${p1}`, `${ctx.parts[0]}: ${p1}`),
            step(`${total2} - ${p1} - ${p2} = ${p3}`, `${ctx.parts[2]}: ${p3}`),
          ];
        }
      } else {
        p1 = randInt(1, Math.floor(total2 / 3)); const rem = total2 - p1;
        if (usePct) {
          const pct = pick(percentages); p2 = Math.round(rem * pct / 100);
          if (p2 !== rem * pct / 100) continue; p3 = total2 - p1 - p2;
          constraintLine = `${mStr(p1)} are ${ctx.parts[0]}. ${mStr(pct + "\\%")} of the remainder are ${ctx.parts[1]}. The rest are ${ctx.parts[2]}.`;
          calcSteps = [
            step(`${total2} - ${p1} = ${rem}`, `Remainder = ${rem}`),
            step(`${pct}\\% \\times ${rem} = ${p2}`, `${ctx.parts[1]}: ${p2}`),
            step(`${total2} - ${p1} - ${p2} = ${p3}`, `${ctx.parts[2]}: ${p3}`),
          ];
        } else {
          const fr = pick(fracs2); p2 = Math.round(rem * fr.num / fr.den);
          if (p2 !== rem * fr.num / fr.den) continue; p3 = total2 - p1 - p2;
          constraintLine = `${mStr(p1)} are ${ctx.parts[0]}. ${fracStr(fr.num, fr.den)} of the remainder are ${ctx.parts[1]}. The rest are ${ctx.parts[2]}.`;
          calcSteps = [
            step(`${total2} - ${p1} = ${rem}`, `Remainder = ${rem}`),
            step(`${frac(fr.num, fr.den)} \\times ${rem} = ${p2}`, `${ctx.parts[1]}: ${p2}`),
            step(`${total2} - ${p1} - ${p2} = ${p3}`, `${ctx.parts[2]}: ${p3}`),
          ];
        }
      }
      if (p1 > 0 && p2 > 0 && p3 > 0) {
        valid = true; ansLatex2 = buildAnswerLatex([p1, p2, p3]);
        finalLine = `There are ${mStr(total2)} ${ctx.item} in a ${ctx.container}. ${constraintLine} Find the ratio ${ctx.parts[0]} : ${ctx.parts[1]} : ${ctx.parts[2]}${sfText}.`;
      }
    } else {
      const ctx = ctx2;
      if (usePct) {
        const pct = pick(percentages); p1 = Math.round(total2 * pct / 100);
        if (p1 !== total2 * pct / 100) continue; p2 = total2 - p1;
        constraintLine = `${mStr(pct + "\\%")} are ${ctx.parts[0]} and the rest are ${ctx.parts[1]}.`;
        calcSteps = [
          step(`${pct}\\% \\times ${total2} = ${p1}`, `${ctx.parts[0]}: ${p1}`),
          step(`${total2} - ${p1} = ${p2}`, `${ctx.parts[1]}: ${p2}`),
        ];
      } else {
        const fr = pick(fracs2); p1 = Math.round(total2 * fr.num / fr.den);
        if (p1 !== total2 * fr.num / fr.den) continue; p2 = total2 - p1;
        constraintLine = `${fracStr(fr.num, fr.den)} are ${ctx.parts[0]} and the rest are ${ctx.parts[1]}.`;
        calcSteps = [
          step(`${frac(fr.num, fr.den)} \\times ${total2} = ${p1}`, `${ctx.parts[0]}: ${p1}`),
          step(`${total2} - ${p1} = ${p2}`, `${ctx.parts[1]}: ${p2}`),
        ];
      }
      if (p1 > 0 && p2 > 0 && p1 !== p2) {
        valid = true; ansLatex2 = buildAnswerLatex([p1, p2]);
        finalLine = `There are ${mStr(total2)} ${ctx.item} in a ${ctx.container}. ${constraintLine} Write this as a ratio${sfText}.`;
      }
    }
  }

  const rawParts = threeWay ? [p1, p2, p3] : [p1, p2];
  return {
    kind: "worded", lines: [finalLine], answer: ansLatex2, answerLatex: ansLatex2,
    working: [...calcSteps, mStep("Ratio =", rLatex(...rawParts)), ...buildSimplificationWorking(rawParts)],
    key: `fr-l3-${total2}-${p1}-${p2}-${p3}-${id}`, difficulty: level,
  };
};

const generateQuestion = (tool: ToolType, level: DifficultyLevel, variables: Record<string, boolean>, dropdownValue: string): AnyQuestion => {
  if (tool === "ratioToFraction") return genRatioToFraction(level, variables, dropdownValue);
  if (tool === "fractionToRatio") return genFractionToRatio(level, variables, dropdownValue);
  return genFormingRatios(level, variables);
};

const generateUniqueQ = (tool: ToolType, level: DifficultyLevel, variables: Record<string, boolean>, dropdownValue: string, usedKeys: Set<string>): AnyQuestion => {
  let q: AnyQuestion, attempts = 0;
  do { q = generateQuestion(tool, level, variables, dropdownValue); attempts++; }
  while (usedKeys.has(q.key) && attempts < 100);
  usedKeys.add(q.key); return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// END OF TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const LV_COLORS: Record<DifficultyLevel, { bg: string; border: string; text: string; fill: string }> = {
  level1: { bg: "bg-green-50", border: "border-green-500", text: "text-green-700", fill: "#dcfce7" },
  level2: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700", fill: "#fef9c3" },
  level3: { bg: "bg-red-50", border: "border-red-500", text: "text-red-700", fill: "#fee2e2" },
};
const getQuestionBg = (cs: string) => ({ blue: "#D1E7F8", pink: "#F8D1E7", yellow: "#F8F4D1" }[cs] ?? "#ffffff");
const getStepBg = (cs: string) => ({ blue: "#B3D9F2", pink: "#F2B3D9", yellow: "#F2EBB3" }[cs] ?? "#f3f4f6");

const QuestionDisplay = ({ q, cls }: { q: AnyQuestion; cls: string }) => (
  <div className="flex flex-col gap-2 text-center">
    {q.lines.map((line, i) => (
      <div key={i} className={`${cls} font-semibold`} style={{ color: "#000", lineHeight: 2.2 }}>
        <InlineMath text={line} />
      </div>
    ))}
  </div>
);

const AnswerDisplay = ({ q }: { q: AnyQuestion }) => {
  if (q.answerLatex) return <><span>= </span><MathRenderer latex={q.answerLatex} /></>;
  return <span>= {q.answer}</span>;
};

const DifficultyToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {([["level1", "Level 1", "bg-green-600"], ["level2", "Level 2", "bg-yellow-500"], ["level3", "Level 3", "bg-red-600"]] as const).map(([val, label, col]) => (
      <button key={val} onClick={() => onChange(val)}
        className={`px-5 py-2 font-bold text-base transition-colors ${value === val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>
        {label}
      </button>
    ))}
  </div>
);

const DropdownSection = ({ dropdown, value, onChange }: { dropdown: { key: string; label: string; options: { value: string; label: string }[] }; value: string; onChange: (v: string) => void }) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dropdown.label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {dropdown.options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-4 py-2.5 text-base font-bold transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const VariablesSection = ({ variables, values, onChange }: { variables: { key: string; label: string }[]; values: Record<string, boolean>; onChange: (k: string, v: boolean) => void }) => (
  <div className="flex flex-col gap-3">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span>
    {variables.map(v => (
      <label key={v.key} className="flex items-center gap-3 cursor-pointer py-1">
        <div onClick={() => onChange(v.key, !values[v.key])} className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${values[v.key] ? "bg-blue-900" : "bg-gray-300"}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${values[v.key] ? "translate-x-7" : "translate-x-1"}`} />
        </div>
        <span className="text-base font-semibold text-gray-700">{v.label}</span>
      </label>
    ))}
  </div>
);

const StandardQOPopover = ({ variables, variableValues, onVariableChange, dropdown, dropdownValue, onDropdownChange }: { variables: { key: string; label: string }[]; variableValues: Record<string, boolean>; onVariableChange: (k: string, v: boolean) => void; dropdown: any; dropdownValue: string; onDropdownChange: (v: string) => void }) => {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {dropdown && <DropdownSection dropdown={dropdown} value={dropdownValue} onChange={onDropdownChange} />}
          {variables.length > 0 && <VariablesSection variables={variables} values={variableValues} onChange={onVariableChange} />}
        </div>
      )}
    </div>
  );
};

const DiffQOPopover = ({ toolSettings, levelVariables, onLevelVariableChange, levelDropdowns, onLevelDropdownChange }: { toolSettings: any; levelVariables: Record<string, Record<string, boolean>>; onLevelVariableChange: (lv: string, k: string, v: boolean) => void; levelDropdowns: Record<string, string>; onLevelDropdownChange: (lv: string, v: string) => void }) => {
  const { open, setOpen, ref } = usePopover();
  const levels = ["level1", "level2", "level3"] as DifficultyLevel[];
  const getDDForLevel = (lv: string) => toolSettings.difficultySettings?.[lv]?.dropdown ?? toolSettings.dropdown;
  const getVarsForLevel = (lv: string) => toolSettings.difficultySettings?.[lv]?.variables ?? toolSettings.variables;
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {levels.map(lv => {
            const dd = getDDForLevel(lv); const vars = getVarsForLevel(lv) ?? [];
            return (
              <div key={lv} className="flex flex-col gap-2">
                <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                <div className="flex flex-col gap-3 pl-1">
                  {dd && <DropdownSection dropdown={dd} value={levelDropdowns[lv] ?? dd.defaultValue} onChange={v => onLevelDropdownChange(lv, v)} />}
                  {vars.length > 0 && <VariablesSection variables={vars} values={levelVariables[lv] ?? {}} onChange={(k, v) => onLevelVariableChange(lv, k, v)} />}
                  {!dd && vars.length === 0 && <p className="text-xs text-gray-400">No options at this level.</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ height: "80vh" }} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <div><h2 className="text-2xl font-bold text-gray-900">Tool Information</h2><p className="text-sm text-gray-400 mt-0.5">A guide to all features and options</p></div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={20} /></button>
      </div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">
        {INFO_SECTIONS.map(s => (
          <div key={s.title}>
            <div className="flex items-center gap-2 mb-3"><span className="text-xl">{s.icon}</span><h3 className="text-lg font-bold text-blue-900">{s.title}</h3></div>
            <div className="flex flex-col gap-2">
              {s.content.map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
                  <span className="font-bold text-gray-800 text-sm">{item.label}</span>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-7 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
        <button onClick={onClose} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800">Close</button>
      </div>
    </div>
  </div>
);

const MenuDropdown = ({ colorScheme, setColorScheme, onClose, onOpenInfo }: { colorScheme: string; setColorScheme: (s: string) => void; onClose: () => void; onOpenInfo: () => void }) => {
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: "200px" }}>
      <div className="py-1">
        <button onClick={() => setColorOpen(!colorOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-gray-400 transition-transform duration-200 ${colorOpen ? "rotate-90" : ""}`}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span>Colour Scheme</span>
          </div>
          <span className="text-xs text-gray-400 font-normal capitalize">{colorScheme}</span>
        </button>
        {colorOpen && <div className="border-t border-gray-100">{["default", "blue", "pink", "yellow"].map(s => (<button key={s} onClick={() => { setColorScheme(s); onClose(); }} className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold capitalize ${colorScheme === s ? "bg-blue-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>{s}{colorScheme === s && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}</button>))}</div>}
        <div className="border-t border-gray-100 my-1" />
        <button onClick={() => { onOpenInfo(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          Tool Information
        </button>
      </div>
    </div>
  );
};

const handlePrint = (questions: AnyQuestion[], toolName: string, difficulty: string, isDifferentiated: boolean, numColumns: number) => {
  const FONT_PX = 13, PAD_MM = 3, MARGIN_MM = 12, HEADER_MM = 14, GAP_MM = 2;
  const PAGE_H_MM = 297 - MARGIN_MM * 2, PAGE_W_MM = 210 - MARGIN_MM * 2;
  const usableH_MM = PAGE_H_MM - HEADER_MM, diffHdrMM = 7;
  const cols = isDifferentiated ? 3 : numColumns;
  const cellW_MM = isDifferentiated ? (PAGE_W_MM - GAP_MM * 2) / 3 : (PAGE_W_MM - GAP_MM * (numColumns - 1)) / numColumns;
  const difficultyLabel = isDifferentiated ? "Differentiated" : difficulty === "level1" ? "Level 1" : difficulty === "level2" ? "Level 2" : "Level 3";
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const totalQ = questions.length;

  const renderLine = (line: string): string =>
    line.split(/(\$[^$]+\$)/g).map(part => {
      if (part.startsWith("$") && part.endsWith("$")) {
        const latex = part.slice(1, -1);
        return `<span class="kr frac" data-latex="${latex.replace(/"/g, "&quot;")}"></span>`;
      }
      return `<span>${part}</span>`;
    }).join("");

  const katexSpan = (latex: string) => `<span class="kr${latex.includes("\\frac") ? " frac" : ""}" data-latex="${latex.replace(/"/g, "&quot;")}"></span>`;

  const questionToHtml = (q: AnyQuestion, idx: number, showAnswer: boolean): string => {
    const linesHtml = q.lines.map(l => `<div class="ql">${renderLine(l)}</div>`).join("");
    const ansHtml = showAnswer
      ? `<div class="qa">${q.answerLatex ? `= ${katexSpan(q.answerLatex)}` : `= ${q.answer}`}</div>`
      : "";
    return `<div class="qn">${idx + 1})</div><div class="qls">${linesHtml}</div>${ansHtml}`;
  };

  const qHtmlData = questions.map((q, i) => ({ q: questionToHtml(q, i, false), a: questionToHtml(q, i, true), difficulty: q.difficulty }));

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${toolName}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box;}@page{size:A4;margin:${MARGIN_MM}mm;}
body{font-family:"Segoe UI",Arial,sans-serif;background:#fff;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
.page{width:${PAGE_W_MM}mm;height:${PAGE_H_MM}mm;overflow:hidden;page-break-after:always;}
.page:last-child{page-break-after:auto;}
.ph{display:flex;justify-content:space-between;align-items:baseline;border-bottom:0.4mm solid #1e3a8a;padding-bottom:1.5mm;margin-bottom:2mm;}
.ph h1{font-size:5mm;font-weight:700;color:#1e3a8a;}.ph .meta{font-size:3mm;color:#6b7280;}
.grid{display:grid;gap:${GAP_MM}mm;}
.cell,.dc{border:0.3mm solid #d1d5db;border-radius:1mm;padding:4mm ${PAD_MM}mm ${PAD_MM}mm;overflow:hidden;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.dg{display:grid;grid-template-columns:repeat(3,1fr);gap:${GAP_MM}mm;}
.dcol{display:flex;flex-direction:column;gap:${GAP_MM}mm;}
.dh{height:${diffHdrMM}mm;display:flex;align-items:center;justify-content:center;font-size:3mm;font-weight:700;border-radius:1mm;}
.dh.level1{background:#dcfce7;color:#166534;}.dh.level2{background:#fef9c3;color:#854d0e;}.dh.level3{background:#fee2e2;color:#991b1b;}
#probe{position:fixed;left:-9999px;top:0;visibility:hidden;font-family:"Segoe UI",Arial,sans-serif;font-size:${FONT_PX}px;line-height:1.6;width:${cellW_MM - PAD_MM * 2}mm;}
.qn{position:absolute;top:0;left:0;font-size:${Math.round(FONT_PX * 0.6)}px;font-weight:700;color:#000;padding:1.2mm 1.2mm 1.8mm 1.2mm;border-right:0.3mm solid #000;border-bottom:0.3mm solid #000;}
.qls{font-size:${FONT_PX}px;line-height:1.6;text-align:center;width:100%;}.ql{display:block;}.qa{font-size:${FONT_PX}px;color:#059669;margin-top:1mm;text-align:center;width:100%;}
.qi{width:100%;}.kr{display:inline;vertical-align:baseline;}.kr:not(.frac) .katex{font-size:0.826em;}.kr.frac .katex{font-size:1em;}
</style></head><body>
<div id="probe">${questions.map((q, i) => `<div class="qi" id="p${i}">${questionToHtml(q, i, true)}</div>`).join("")}</div>
<div id="pages"></div>
<script>
document.addEventListener("DOMContentLoaded",function(){
  var pxMm=3.7795,PAD=${PAD_MM},GAP=${GAP_MM},uH=${usableH_MM},dH=${diffHdrMM};
  var PW=${PAGE_W_MM},cols=${cols},isDiff=${isDifferentiated?"true":"false"};
  var totalQ=${totalQ},diffLabel="${difficultyLabel}",dateStr="${dateStr}",toolName="${toolName}";
  var qData=${JSON.stringify(qHtmlData)};
  var probe=document.getElementById("probe");
  probe.querySelectorAll(".kr").forEach(function(el){try{katex.render(el.getAttribute("data-latex"),el,{throwOnError:false,output:"html"});}catch(e){el.textContent=el.getAttribute("data-latex");}});
  var maxH=0;probe.querySelectorAll(".qi").forEach(function(el){if(el.scrollHeight>maxH)maxH=el.scrollHeight;});
  var needed=maxH/pxMm+PAD*2+8;
  var rH=[];for(var r=1;r<=10;r++)rH.push((uH-GAP*(r-1))/r);
  var diffPC=Math.floor(totalQ/3),diffUH=uH-dH-GAP,diffRPP=1,diffCH=diffUH;
  for(var rd=0;rd<10;rd++){var hd=(diffUH-GAP*rd)/(rd+1);if(hd>=needed){diffRPP=rd+1;diffCH=hd;}else break;}
  var chosenH=rH[0],rpp=1;
  for(var r=0;r<rH.length;r++){if((r+1)*cols>=totalQ&&rH[r]>=needed){chosenH=rH[r];rpp=r+1;break;}}
  var pages=[];
  if(isDiff){var np=Math.ceil(diffPC/diffRPP);for(var p=0;p<np;p++)pages.push(p);}
  else{for(var s=0;s<qData.length;s+=rpp*cols)pages.push(qData.slice(s,s+rpp*cols));}
  var tp=pages.length;
  function cw(c){return(PW-GAP*(c-1))/c;}
  function cell(inner,w,h,dc){return'<div class="'+(dc?"dc":"cell")+'" style="width:'+w+'mm;height:'+h+'mm;"><div class="qi">'+inner+'</div></div>';}
  function grid(pd,sa,ch){
    if(isDiff){var pi=pd,s=pi*diffRPP,e=s+diffRPP,cW=cw(3);
      var lvls=["level1","level2","level3"],lbls=["Level 1","Level 2","Level 3"];
      var c3=lvls.map(function(lv,li){var lqs=qData.filter(function(q){return q.difficulty===lv;}).slice(s,e);
        return'<div class="dcol"><div class="dh '+lv+'">'+lbls[li]+'</div>'+lqs.map(function(q){return cell(sa?q.a:q.q,cW,ch,true);}).join("")+'</div>';}).join("");
      return'<div class="dg" style="grid-template-columns:repeat(3,'+cW+'mm);">'+c3+'</div>';}
    var cW=cw(cols),gr=Math.ceil(pd.length/cols);
    return'<div class="grid" style="grid-template-columns:repeat('+cols+','+cW+'mm);grid-template-rows:repeat('+gr+','+ch+'mm);">'+pd.map(function(it){return cell(sa?it.a:it.q,cW,ch,false);}).join("")+'</div>';}
  function page(pd,sa,pi){var ch=isDiff?diffCH:chosenH;
    var lbl=tp>1?(isDiff?diffPC+" per level":totalQ+" questions")+" ("+(pi+1)+"/"+tp+")":(isDiff?diffPC+" per level":totalQ+" questions");
    return'<div class="page"><div class="ph"><h1>'+toolName+(sa?" — Answers":"")+'</h1><div class="meta">'+diffLabel+' · '+dateStr+' · '+lbl+'</div></div>'+grid(pd,sa,ch)+'</div>';}
  var html=pages.map(function(pg,i){return page(pg,false,i);}).join("")+pages.map(function(pg,i){return page(pg,true,i);}).join("");
  document.getElementById("pages").innerHTML=html;
  document.getElementById("pages").querySelectorAll(".kr").forEach(function(el){try{katex.render(el.getAttribute("data-latex"),el,{throwOnError:false,output:"html"});}catch(e){el.textContent=el.getAttribute("data-latex");}});
  probe.remove();setTimeout(function(){window.print();},300);
});
<\/script></body></html>`;
  const win = window.open("", "_blank"); if (!win) { alert("Allow popups for PDF export."); return; }
  win.document.write(html); win.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const navigate = useNavigate();
  const toolKeys = Object.keys(TOOL_CONFIG.tools) as ToolType[];
  const [currentTool, setCurrentTool] = useState<ToolType>("ratioToFraction");
  const [mode, setMode] = useState<"whiteboard" | "single" | "worksheet">("whiteboard");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("level1");

  const [toolVariables, setToolVariables] = useState<Record<string, Record<string, boolean>>>(() => {
    const init: Record<string, Record<string, boolean>> = {};
    Object.keys(TOOL_CONFIG.tools).forEach(k => { init[k] = {}; TOOL_CONFIG.tools[k].variables.forEach(v => { init[k][v.key] = v.defaultValue; }); });
    return init;
  });
  const [toolDropdowns, setToolDropdowns] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    Object.keys(TOOL_CONFIG.tools).forEach(k => {
      const t = TOOL_CONFIG.tools[k];
      (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => { const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown; if (dd) init[`${k}__${lv}`] = dd.defaultValue; });
    }); return init;
  });
  const [levelVariables, setLevelVariables] = useState<Record<string, Record<string, boolean>>>({ level1: {}, level2: {}, level3: {} });
  const [levelDropdowns, setLevelDropdowns] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    const t = TOOL_CONFIG.tools[Object.keys(TOOL_CONFIG.tools)[0]];
    (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => { const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown; if (dd) init[lv] = dd.defaultValue; });
    return init;
  });

  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion>(() => generateQuestion("ratioToFraction", "level1", {}, ""));
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [numColumns, setNumColumns] = useState(2);
  const [worksheet, setWorksheet] = useState<AnyQuestion[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [displayFontSize, setDisplayFontSize] = useState(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState(1);
  const [colorScheme, setColorScheme] = useState("default");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [presenterMode, setPresenterMode] = useState(false);
  const [wbFullscreen, setWbFullscreen] = useState(false);
  const [camDevices, setCamDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentCamId, setCurrentCamId] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [camDropdownOpen, setCamDropdownOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const camDropdownRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  useEffect(() => { loadKaTeX(); }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);
  const startCam = useCallback(async (deviceId?: string) => {
    stopStream(); setCamError(null);
    try {
      let tid = deviceId;
      if (!tid) { const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); tmp.getTracks().forEach(t => t.stop()); const all = await navigator.mediaDevices.enumerateDevices(); const ext = all.filter(d => d.kind === "videoinput").find(d => d.label && !/facetime|built.?in|integrated|internal|front|rear/i.test(d.label)); if (ext) tid = ext.deviceId; }
      const stream = await navigator.mediaDevices.getUserMedia({ video: tid ? { deviceId: { exact: tid } } : true, audio: false });
      streamRef.current = stream; if (videoRef.current) videoRef.current.srcObject = stream;
      setCurrentCamId(stream.getVideoTracks()[0].getSettings().deviceId ?? null);
      setCamDevices((await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "videoinput"));
    } catch (e: unknown) { setCamError((e instanceof Error ? e.message : null) ?? "Camera unavailable"); }
  }, [stopStream]);

  useEffect(() => { if (presenterMode) startCam(); else stopStream(); }, [presenterMode]);
  useEffect(() => { if (presenterMode && streamRef.current && videoRef.current) videoRef.current.srcObject = streamRef.current; }, [wbFullscreen]);
  useEffect(() => { if (!camDropdownOpen) return; const h = (e: MouseEvent) => { if (camDropdownRef.current && !camDropdownRef.current.contains(e.target as Node)) setCamDropdownOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [camDropdownOpen]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setPresenterMode(false); setWbFullscreen(false); } }; document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h); }, []);

  const qBg = getQuestionBg(colorScheme), stepBg = getStepBg(colorScheme);
  const isDefault = colorScheme === "default";
  const fsToolbarBg = isDefault ? "#ffffff" : stepBg, fsQuestionBg = isDefault ? "#ffffff" : qBg, fsWorkingBg = isDefault ? "#f5f3f0" : qBg;

  const getToolSettings = () => TOOL_CONFIG.tools[currentTool];
  const getDropdownConfig = () => getToolSettings().difficultySettings?.[difficulty]?.dropdown ?? getToolSettings().dropdown;
  const getVariablesConfig = () => getToolSettings().difficultySettings?.[difficulty]?.variables ?? getToolSettings().variables;
  const getDropdownValue = () => toolDropdowns[`${currentTool}__${difficulty}`] ?? getDropdownConfig()?.defaultValue ?? "";
  const setDropdownValue = (v: string) => setToolDropdowns(p => ({ ...p, [`${currentTool}__${difficulty}`]: v }));
  const setVariableValue = (k: string, v: boolean) => setToolVariables(p => ({ ...p, [currentTool]: { ...p[currentTool], [k]: v } }));
  const handleLevelVarChange = (lv: string, k: string, v: boolean) => setLevelVariables(p => ({ ...p, [lv]: { ...p[lv], [k]: v } }));
  const handleLevelDDChange = (lv: string, v: string) => setLevelDropdowns(p => ({ ...p, [lv]: v }));

  const handleNewQuestion = () => { setCurrentQuestion(generateQuestion(currentTool, difficulty, toolVariables[currentTool] || {}, getDropdownValue())); setShowWhiteboardAnswer(false); setShowAnswer(false); };
  const handleGenerateWorksheet = () => {
    const usedKeys = new Set<string>(); const questions: AnyQuestion[] = [];
    if (isDifferentiated) {
      (["level1", "level2", "level3"] as DifficultyLevel[]).forEach(lv => {
        const t = getToolSettings(); const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
        const vars = levelVariables[lv] ?? {}; const ddVal = levelDropdowns[lv] ?? (dd?.defaultValue ?? "");
        for (let i = 0; i < numQuestions; i++) questions.push(generateUniqueQ(currentTool, lv, vars, ddVal, usedKeys));
      });
    } else { for (let i = 0; i < numQuestions; i++) questions.push(generateUniqueQ(currentTool, difficulty, toolVariables[currentTool] || {}, getDropdownValue(), usedKeys)); }
    setWorksheet(questions); setShowWorksheetAnswers(false);
  };

  const stdQOProps = { variables: getVariablesConfig() ?? [], variableValues: toolVariables[currentTool] || {}, onVariableChange: setVariableValue, dropdown: getDropdownConfig() ?? null, dropdownValue: getDropdownValue(), onDropdownChange: setDropdownValue };
  const diffQOProps = { toolSettings: getToolSettings(), levelVariables, onLevelVariableChange: handleLevelVarChange, levelDropdowns, onLevelDropdownChange: handleLevelDDChange };
  const hasStdOptions = (getVariablesConfig()?.length ?? 0) > 0 || getDropdownConfig() !== null;
  const hasDiffOptions = (["level1", "level2", "level3"] as DifficultyLevel[]).some(lv => { const t = getToolSettings(); const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown; const vars = t.difficultySettings?.[lv]?.variables ?? t.variables; return dd !== null || (vars?.length ?? 0) > 0; });
  const qoEl = (isDiff = false) => { if (isDiff && !hasDiffOptions) return null; if (!isDiff && !hasStdOptions) return null; return isDiff ? <DiffQOPopover {...diffQOProps} /> : <StandardQOPopover {...stdQOProps} />; };

  useEffect(() => { if (mode !== "worksheet") handleNewQuestion(); }, [difficulty, currentTool]);

  const displayFontSizes = ["text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl"];
  const canDI = displayFontSize < displayFontSizes.length - 1, canDD = displayFontSize > 0;
  const fontSizes = ["text-base", "text-lg", "text-xl", "text-2xl", "text-3xl"];
  const canI = worksheetFontSize < fontSizes.length - 1, canD = worksheetFontSize > 0;

  const renderQCell = (q: AnyQuestion, idx: number, bgOverride?: string) => {
    const bg = bgOverride ?? stepBg, fsz = fontSizes[worksheetFontSize];
    return (
      <div className="rounded-lg shadow" style={{ backgroundColor: bg, height: "100%", boxSizing: "border-box", position: "relative", padding: "1.75rem 0.75rem 0.75rem" }}>
        <span style={{ position: "absolute", top: 0, left: 0, fontSize: "0.65em", fontWeight: 700, color: "#000", lineHeight: 1, padding: "5px 5px 7px 5px", borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>{idx + 1})</span>
        <div className={`${fsz} font-semibold`} style={{ color: "#000", lineHeight: 1.8, textAlign: "center", width: "100%" }}>
          {q.lines.map((line, i) => <div key={i}><InlineMath text={line} /></div>)}
        </div>
        {showWorksheetAnswers && (
          <div className={`${fsz} font-semibold mt-1`} style={{ color: "#059669", textAlign: "center", width: "100%" }}>
            {q.answerLatex ? <><span>= </span><MathRenderer latex={q.answerLatex} /></> : <span>= {q.answer}</span>}
          </div>
        )}
      </div>
    );
  };

  const renderControlBar = () => {
    if (mode === "worksheet") return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-center items-center gap-6 mb-4">
          <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
            {([["level1", "Level 1", "bg-green-600"], ["level2", "Level 2", "bg-yellow-500"], ["level3", "Level 3", "bg-red-600"]] as const).map(([val, label, col]) => (
              <button key={val} onClick={() => { setDifficulty(val as DifficultyLevel); setIsDifferentiated(false); }}
                className={`px-5 py-2 font-bold text-base transition-colors ${!isDifferentiated && difficulty === val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>{label}</button>
            ))}
          </div>
          <button onClick={() => setIsDifferentiated(!isDifferentiated)} className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDifferentiated ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>Differentiated</button>
        </div>
        <div className="flex justify-center items-center gap-6 mb-4">
          {qoEl(isDifferentiated)}
          <div className="flex items-center gap-3"><label className="text-base font-semibold text-gray-700">Questions:</label><input type="number" min="1" max="20" value={numQuestions} onChange={e => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))} className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center" /></div>
          <div className="flex items-center gap-3"><label className="text-base font-semibold text-gray-700">Columns:</label><input type="number" min="1" max="4" value={isDifferentiated ? 3 : numColumns} onChange={e => { if (!isDifferentiated) setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 2))); }} disabled={isDifferentiated} className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center ${isDifferentiated ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 bg-white"}`} /></div>
        </div>
        <div className="flex justify-center items-center gap-4">
          <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> Generate</button>
          {worksheet.length > 0 && <>
            <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWorksheetAnswers ? "Hide Answers" : "Show Answers"}</button>
            <button onClick={() => handlePrint(worksheet, TOOL_CONFIG.tools[currentTool].name, difficulty, isDifferentiated, numColumns)} className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2"><Printer size={18} /> Print / PDF</button>
          </>}
        </div>
      </div>
    );
    return (
      <div className="px-5 py-4 rounded-xl" style={{ backgroundColor: qBg }}>
        <div className="flex items-center justify-between gap-4">
          <DifficultyToggle value={difficulty} onChange={v => setDifficulty(v as DifficultyLevel)} />
          {qoEl()}
          <div className="flex gap-3 items-center">
            <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
            <button onClick={() => mode === "whiteboard" ? setShowWhiteboardAnswer(!showWhiteboardAnswer) : setShowAnswer(!showAnswer)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {(mode === "whiteboard" ? showWhiteboardAnswer : showAnswer) ? "Hide Answer" : "Show Answer"}</button>
          </div>
        </div>
      </div>
    );
  };

  const renderWhiteboard = () => {
    const fb = (en: boolean) => ({ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: en ? "pointer" : "not-allowed", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", opacity: en ? 1 : 0.35 });
    const fsToolbar = (
      <div style={{ background: fsToolbarBg, borderBottom: "2px solid #000", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexShrink: 0, zIndex: 210 }}>
        <DifficultyToggle value={difficulty} onChange={v => setDifficulty(v as DifficultyLevel)} />{qoEl()}
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18} /> New Question</button>
          <button onClick={() => setShowWhiteboardAnswer(a => !a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18} /> {showWhiteboardAnswer ? "Hide Answer" : "Show Answer"}</button>
        </div>
      </div>
    );
    const qBox = (isFS: boolean) => (
      <div style={{ position: "relative", width: isFS ? "45%" : "520px", height: "100%", backgroundColor: isFS ? fsQuestionBg : stepBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, boxSizing: "border-box", flexShrink: 0, gap: 16, overflowY: "auto" }}>
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
          <button style={fb(canDD)} onClick={() => canDD && setDisplayFontSize(f => f - 1)}><ChevronDown size={16} color="#6b7280" /></button>
          <button style={fb(canDI)} onClick={() => canDI && setDisplayFontSize(f => f + 1)}><ChevronUp size={16} color="#6b7280" /></button>
        </div>
        <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]} />
        {showWhiteboardAnswer && <div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}><AnswerDisplay q={currentQuestion} /></div>}
      </div>
    );
    const rPanel = (isFS: boolean) => (
      <div style={{ flex: isFS ? "none" : 1, width: isFS ? "55%" : undefined, height: "100%", position: "relative", overflow: "hidden", backgroundColor: presenterMode ? "#000" : (isFS ? fsWorkingBg : stepBg) }} className={isFS ? "" : "flex-1 rounded-xl"}>
        {presenterMode && (<><video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />{camError && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", padding: "2rem", textAlign: "center", zIndex: 1 }}>{camError}</div>}</>)}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, zIndex: 20 }}>
          {presenterMode ? (
            <div style={{ position: "relative" }} ref={camDropdownRef}>
              <button onMouseDown={() => { didLongPress.current = false; longPressTimer.current = setTimeout(() => { didLongPress.current = true; setCamDropdownOpen(o => !o); }, 500); }} onMouseUp={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); if (!didLongPress.current) setPresenterMode(false); }} onMouseLeave={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }} style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><Video size={16} color="rgba(255,255,255,0.85)" /></button>
              {camDropdownOpen && (<div style={{ position: "absolute", top: 40, right: 0, background: "rgba(12,12,12,0.96)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, minWidth: 200, overflow: "hidden", zIndex: 30 }}>
                <div style={{ padding: "6px 14px", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Camera</div>
                {camDevices.map((d, i) => (<div key={d.deviceId} onClick={() => { setCamDropdownOpen(false); if (d.deviceId !== currentCamId) startCam(d.deviceId); }} style={{ padding: "10px 14px", fontSize: "0.75rem", color: d.deviceId === currentCamId ? "#60a5fa" : "rgba(255,255,255,0.65)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: d.deviceId === currentCamId ? "#60a5fa" : "transparent", flexShrink: 0 }} />{d.label || `Camera ${i + 1}`}</div>))}
              </div>)}
            </div>
          ) : (<button onClick={() => setPresenterMode(true)} style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><Video size={16} color="#6b7280" /></button>)}
          <button onClick={() => setWbFullscreen(f => !f)} style={{ background: wbFullscreen ? "#374151" : (presenterMode ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.08)"), border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {wbFullscreen ? <Minimize2 size={16} color="#ffffff" /> : <Maximize2 size={16} color={presenterMode ? "rgba(255,255,255,0.85)" : "#6b7280"} />}
          </button>
        </div>
      </div>
    );
    if (wbFullscreen) return (<div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: fsToolbarBg, display: "flex", flexDirection: "column" }}>{fsToolbar}<div style={{ flex: 1, display: "flex", minHeight: 0 }}>{qBox(true)}<div style={{ width: 2, backgroundColor: "#000", flexShrink: 0 }} />{rPanel(true)}</div></div>);
    return (<div className="p-8" style={{ backgroundColor: qBg, height: "600px", boxSizing: "border-box" }}><div className="flex gap-6" style={{ height: "100%" }}>{qBox(false)}{rPanel(false)}</div></div>);
  };

  const renderWorkedExample = () => (
    <div className="overflow-y-auto" style={{ maxHeight: "120vh" }}>
      <div className="p-8 w-full" style={{ backgroundColor: qBg }}>
        <div className="text-center py-4 relative">
          <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 6 }}>
            <button style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: canDD ? "pointer" : "not-allowed", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", opacity: canDD ? 1 : 0.35 }} onClick={() => canDD && setDisplayFontSize(f => f - 1)}><ChevronDown size={16} color="#6b7280" /></button>
            <button style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: canDI ? "pointer" : "not-allowed", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", opacity: canDI ? 1 : 0.35 }} onClick={() => canDI && setDisplayFontSize(f => f + 1)}><ChevronUp size={16} color="#6b7280" /></button>
          </div>
          <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]} />
        </div>
        {showAnswer && (
          <>
            <div className="space-y-4 mt-8">
              {currentQuestion.working.map((s, i) => (
                <div key={i} className="rounded-xl p-6" style={{ backgroundColor: stepBg }}>
                  <h4 className="text-xl font-bold mb-2" style={{ color: "#000" }}>Step {i + 1}</h4>
                  <div className="text-2xl" style={{ color: "#000" }}>
                    {s.type === "tStep"
                      ? <span>{s.plain}</span>
                      : s.type === "mStep"
                        ? <><span>{(s as any).label} </span><MathRenderer latex={s.latex} />{(s as any).unit && <span> {(s as any).unit}</span>}</>
                        : <MathRenderer latex={s.latex} />}
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: stepBg }}>
              <span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{ color: "#166534" }}><AnswerDisplay q={currentQuestion} /></span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderWorksheet = () => {
    if (worksheet.length === 0) return (<div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: qBg }}><span className="text-2xl text-gray-400">Generate worksheet</span></div>);
    const fsCtrls = (
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button disabled={!canD} onClick={() => canD && setWorksheetFontSize(f => f - 1)} className={`w-8 h-8 rounded flex items-center justify-center ${canD ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronDown size={20} /></button>
        <button disabled={!canI} onClick={() => canI && setWorksheetFontSize(f => f + 1)} className={`w-8 h-8 rounded flex items-center justify-center ${canI ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronUp size={20} /></button>
      </div>
    );
    const toolTitle = TOOL_CONFIG.tools[currentTool].name;
    if (isDifferentiated) return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: qBg }}>
        {fsCtrls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4" style={{ alignItems: "start" }}>
          {(["level1", "level2", "level3"] as DifficultyLevel[]).map((lv, li) => {
            const lqs = worksheet.filter(q => q.difficulty === lv); const c = LV_COLORS[lv];
            return (
              <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}>
                <h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>Level {li + 1}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gridAutoRows: "1fr", gap: "0.75rem" }}>
                  {lqs.map((q, idx) => <div key={idx} style={{ minHeight: 0 }}>{renderQCell(q, idx, c.fill)}</div>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
    return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: qBg }}>
        {fsCtrls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#000" }}>{toolTitle} — Worksheet</h2>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${numColumns},1fr)`, gridAutoRows: "1fr", gap: "1rem" }}>
          {worksheet.map((q, idx) => <div key={idx} style={{ minHeight: 0 }}>{renderQCell(q, idx)}</div>)}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"><Home size={24} /><span className="font-semibold text-lg">Home</span></button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">{isMenuOpen ? <X size={28} /> : <Menu size={28} />}</button>
            {isMenuOpen && <MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={() => setIsMenuOpen(false)} onOpenInfo={() => setIsInfoOpen(true)} />}
          </div>
        </div>
      </div>
      {isInfoOpen && <InfoModal onClose={() => setIsInfoOpen(false)} />}
      <div className="min-h-screen p-8" style={{ backgroundColor: "#f5f3f0" }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: "#000" }}>{TOOL_CONFIG.pageTitle}</h1>
          <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>
          <div className="flex justify-center gap-4 mb-6">
            {toolKeys.map(k => (<button key={k} onClick={() => setCurrentTool(k)} className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${currentTool === k ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>{TOOL_CONFIG.tools[k].name}</button>))}
          </div>
          <div className="flex justify-center mb-8"><div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} /></div>
          <div className="flex justify-center gap-4 mb-8">
            {([["whiteboard", "Whiteboard"], ["single", "Worked Example"], ["worksheet", "Worksheet"]] as const).map(([m, label]) => (<button key={m} onClick={() => { setMode(m); setPresenterMode(false); setWbFullscreen(false); }} className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode === m ? "bg-blue-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>{label}</button>))}
          </div>
          {mode === "worksheet" && <>{renderControlBar()}{renderWorksheet()}</>}
          {mode !== "worksheet" && (<div className="flex flex-col gap-6"><div className="rounded-xl shadow-lg">{renderControlBar()}</div><div className="rounded-xl shadow-lg overflow-hidden">{mode === "whiteboard" && renderWhiteboard()}{mode === "single" && renderWorkedExample()}</div></div>)}
        </div>
      </div>
    </>
  );
}
