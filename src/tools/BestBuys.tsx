import { useState, useEffect, useRef, useCallback, CSSProperties } from "react";
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X, Video, Maximize2, Minimize2, Printer } from "lucide-react";

// ── NAVIGATION ───────────────────────────────────────────────────────────────
// Tools use window.location.href = "/" for the Home button.
// No React Router / useNavigate — the parent app handles routing.
// Individual tool components never wrap themselves in a router.
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// KATEX — loaded once from CDN, injected into page head
// ═══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = () => window as any;

const loadKaTeX = (() => {
  let promise: Promise<void> | null = null;
  return () => {
    if (promise) return promise;
    promise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || w().katex) { resolve(); return; }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return promise;
  };
})();

interface MathProps {
  latex: string;
  style?: CSSProperties;
  className?: string;
}

const MathRenderer = ({ latex, style, className }: MathProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(() => typeof window !== "undefined" && !!w().katex);

  useEffect(() => {
    loadKaTeX().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !ref.current) return;
    try {
      w().katex.render(latex, ref.current, {
        displayMode: false,
        throwOnError: false,
        output: "html",
      });
    } catch {
      if (ref.current) ref.current.textContent = latex;
    }
  }, [latex, ready]);

  const hasFrac = latex.includes("\\frac");
  return <span ref={ref} className={className} style={{display:"inline", verticalAlign:"baseline", fontSize: hasFrac ? "1em" : "0.826em", ...style}} />;
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
    className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open?"bg-blue-900 border-blue-900 text-white":"bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}>
    Question Options <ChevronDown size={18} style={{transition:"transform 0.2s",transform:open?"rotate(180deg)":"rotate(0)"}}/>
  </button>
);

const LV_LABELS:Record<string,string> = {level1:"Level 1",level2:"Level 2",level3:"Level 3"};
const LV_HEADER_COLORS:Record<string,string> = {level1:"text-green-600",level2:"text-yellow-500",level3:"text-red-600"};

const TogglePill = ({checked,onChange,label}:{checked:boolean;onChange:(v:boolean)=>void;label:string}) => (
  <label className="flex items-center gap-3 cursor-pointer py-1">
    <div onClick={()=>onChange(!checked)} className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${checked?"bg-blue-900":"bg-gray-300"}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked?"translate-x-7":"translate-x-1"}`}/>
    </div>
    <span className="text-sm font-semibold text-gray-700">{label}</span>
  </label>
);

const SegButtons = ({value,onChange,opts}:{value:string;onChange:(v:string)=>void;opts:{value:string;label:string}[]}) => (
  <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
    {opts.map(opt=>(
      <button key={opt.value} onClick={()=>onChange(opt.value)}
        className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value===opt.value?"bg-blue-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
        {opt.label}
      </button>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ██████████████████████████████████████████████████████████████████████████████
// TOOL-SPECIFIC SECTION
// ██████████████████████████████████████████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════════════════════

type ToolType = "unitCost" | "specialOffers";
type DifficultyLevel = "level1" | "level2" | "level3";

// ── TOOL_CONFIG ───────────────────────────────────────────────────────────────

const TOOL_CONFIG = {
  pageTitle: "Best Buys",

  tools: {

    unitCost: {
      name: "Unit Cost",
      useSubstantialBoxes: true,
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: {
          dropdown: null,
          variables: [],
        },
        level2: {
          dropdown: null,
          variables: [
            { key: "conversions", label: "Include unit conversions", defaultValue: false },
            { key: "unitary",     label: "Force unitary method",     defaultValue: false },
          ],
        },
        level3: {
          dropdown: null,
          variables: [
            { key: "conversions", label: "Include unit conversions", defaultValue: false },
            { key: "unitary",     label: "Force unitary method",     defaultValue: false },
          ],
        },
      },
    },

    specialOffers: {
      name: "Special Offers",
      useSubstantialBoxes: true,
      variables: [],
      dropdown: null,
      difficultySettings: null,
    },

  } as Record<string, {
    name: string;
    instruction?: string;
    useSubstantialBoxes: boolean;
    variables: { key: string; label: string; defaultValue: boolean }[];
    dropdown: {
      key: string; label: string; useTwoLineButtons?: boolean;
      options: { value: string; label: string; sub?: string }[];
      defaultValue: string;
    } | null;
    multiSelect?: {
      key: string; label: string;
      options: { value: string; label: string; defaultActive: boolean }[];
    };
    difficultySettings: Record<string, {
      dropdown?: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[]; defaultValue: string } | null;
      variables?: { key: string; label: string; defaultValue: boolean }[];
      multiSelect?: { key: string; label: string; options: { value: string; label: string; defaultActive: boolean }[] };
    }> | null;
  }>,
};

// ── INFO_SECTIONS ─────────────────────────────────────────────────────────────

const INFO_SECTIONS = [
  { title: "Unit Cost", icon: "🛒", content: [
    { label: "Overview",         detail: "Compare two packs of the same product and decide which is better value by calculating cost per unit." },
    { label: "Level 1 — Green",  detail: "Count-based products (eggs, biscuits, etc.) with small quantities ≤ 12. Whole-number unit prices." },
    { label: "Level 2 — Yellow", detail: "Metric quantities (200 g, 500 ml, etc.). Prices rounded to friendly amounts. Compare per 100 g/ml or per unit." },
    { label: "Level 3 — Red",    detail: "Non-standard metric quantities (345 g, 685 ml, etc.). Very close unit prices requiring careful calculation." },
    { label: "Conversions",      detail: "When enabled (Level 2/3), one pack is shown in kg or litres, requiring conversion before comparison." },
    { label: "Unitary",          detail: "When enabled (Level 2/3), compare price per single unit rather than per 100 g/ml." },
  ]},
  { title: "Special Offers", icon: "🏷️", content: [
    { label: "Overview",         detail: "Compare two shops selling the same product under different promotional offers by finding the unit price for each." },
    { label: "Level 1 — Green",  detail: "Multi-buy vs. multipack. Shop A: buy N get 1 free. Shop B: pack of the same total quantity at a slightly different price." },
    { label: "Level 2 — Yellow", detail: "Percentage discount vs. bulk. Shop A: fixed quantity with % off. Shop B: larger quantity at full price." },
    { label: "Level 3 — Red",    detail: "Mixed offer types. Shop A: buy 1 get 1 free. Shop B: percentage discount. Requires two different calculation routes." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",       detail: "Single question on the left, working space on the right. Visualiser available." },
    { label: "Worked Example",   detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet",        detail: "Grid of questions with PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Conversions",      detail: "Level 2/3 Unit Cost only. One pack shown in a different unit (kg instead of g, L instead of ml)." },
    { label: "Unitary",          detail: "Level 2/3 Unit Cost only. Compares price per 1 g/ml instead of per 100 g/ml." },
    { label: "Differentiated",   detail: "Worksheet mode: generates questions at all three levels side by side, one column per level." },
  ]},
];

// ── Question interface ─────────────────────────────────────────────────────────

// Best Buys questions are purely prose — no KaTeX.
// All lines are plain text; InlineMath is never needed.
// The "worded" kind is used with plain-text lines[].

interface WordedQuestion {
  kind: "worded";
  lines: string[];
  answer: string;
  answerLatex?: string;
  answerSuffix?: string;
  working: { type: string; latex: string; plain: string; label?: string; unit?: string }[];
  key: string;
  difficulty: string;
}

type AnyQuestion = WordedQuestion;

// ── Helpers ───────────────────────────────────────────────────────────────────

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

// tStep — plain prose working step (all Best Buys steps are plain text)
const tStep = (text: string) =>
  ({ type: "tStep", latex: `\\text{${text}}`, plain: text });

// formatPrice: pence → display string
const formatPrice = (pence: number): string => {
  if (pence >= 100) {
    return `£${(pence / 100).toFixed(2)}`;
  }
  return `${pence}p`;
};

// formatPriceDecimal: pence → display string, stripping trailing zeros from pounds
const formatPriceDecimal = (pence: number, dp = 2): string => {
  const isWhole = Math.abs(pence - Math.round(pence)) < 0.001;
  if (pence >= 100) {
    const pounds = pence / 100;
    if (isWhole && pounds === Math.floor(pounds)) return `£${Math.round(pounds)}`;
    return `£${pounds.toFixed(dp)}`;
  }
  if (isWhole) return `${Math.round(pence)}p`;
  return `${pence.toFixed(dp)}p`;
};

// ── Product lists ──────────────────────────────────────────────────────────────

const COUNT_PRODUCTS = [
  { name: "biscuits",         unit: "biscuits" },
  { name: "eggs",             unit: "eggs"     },
  { name: "apples",           unit: "apples"   },
  { name: "oranges",          unit: "oranges"  },
  { name: "bananas",          unit: "bananas"  },
  { name: "bread rolls",      unit: "rolls"    },
  { name: "batteries",        unit: "batteries"},
  { name: "pens",             unit: "pens"     },
  { name: "pencils",          unit: "pencils"  },
  { name: "notebooks",        unit: "notebooks"},
  { name: "tea bags",         unit: "bags"     },
  { name: "yoghurts",         unit: "yoghurts" },
  { name: "cans of beans",    unit: "cans"     },
  { name: "bottles of water", unit: "bottles"  },
  { name: "chocolate bars",   unit: "bars"     },
];

const METRIC_PRODUCTS = [
  { name: "cereal",          unit: "g"  },
  { name: "orange juice",    unit: "ml" },
  { name: "pasta",           unit: "g"  },
  { name: "rice",            unit: "g"  },
  { name: "coffee",          unit: "g"  },
  { name: "biscuits",        unit: "g"  },
  { name: "chocolate",       unit: "g"  },
  { name: "milk",            unit: "ml" },
  { name: "cooking oil",     unit: "ml" },
  { name: "flour",           unit: "g"  },
  { name: "sugar",           unit: "g"  },
  { name: "washing powder",  unit: "g"  },
  { name: "shampoo",         unit: "ml" },
  { name: "toothpaste",      unit: "ml" },
];

// ── Unit Cost generator ────────────────────────────────────────────────────────

const generateUnitCostQuestion = (
  level: DifficultyLevel,
  includeConversions: boolean,
  forceUnitary: boolean,
): WordedQuestion => {
  const id = Math.floor(Math.random() * 1_000_000);

  let qA: number, qB: number, cA: number, cB: number;
  let unitLabel: string, productName: string;
  let unitA: string, unitB: string;
  let qAInBase: number, qBInBase: number;
  let targetUnit: number, targetUnitLabel: string;

  if (level === "level1") {
    const product = pick(COUNT_PRODUCTS);
    productName = product.name;
    unitLabel = product.unit;
    unitA = product.unit;
    unitB = product.unit;

    qA = randInt(2, 6);
    qB = randInt(5, 9);
    while (Math.abs(qB - qA) < 2) qB = randInt(5, 9);

    const baseUnitPrice = (randInt(8, 20)) * 5; // 40p–100p
    const priceDiff = (randInt(1, 3)) * 5;       // 5p, 10p, 15p
    let upA = baseUnitPrice;
    let upB = Math.random() > 0.5 ? baseUnitPrice + priceDiff : baseUnitPrice - priceDiff;
    if (upB < 30) upB = baseUnitPrice + priceDiff;

    cA = qA * upA;
    cB = qB * upB;

    let attempts = 0;
    while ((qB > qA && cB <= cA) || (qA > qB && cA <= cB)) {
      [upA, upB] = [upB, upA];
      cA = qA * upA; cB = qB * upB;
      if (++attempts > 10) { if (qB > qA && cB <= cA) cB = cA + 5; else cA = cB + 5; break; }
    }

    targetUnit = 1;
    // singular: strip trailing 's' unless it ends in 'ss'
    const singular = unitLabel.endsWith("ss") ? unitLabel : unitLabel.replace(/s$/, "");
    targetUnitLabel = `1 ${singular}`;
    qAInBase = qA;
    qBInBase = qB;

  } else if (level === "level2") {
    const product = pick(METRIC_PRODUCTS);
    productName = product.name;
    unitLabel = product.unit;
    unitA = product.unit;
    unitB = product.unit;

    const SIZES = [200, 250, 300, 400, 500, 750];
    qA = pick(SIZES);
    qB = pick(SIZES);
    while (qB === qA) qB = pick(SIZES);

    const roundFriendly = (p: number) => {
      const r20 = Math.round(p / 20) * 20;
      const r25 = Math.round(p / 25) * 25;
      return Math.abs(p - r20) <= Math.abs(p - r25) ? r20 : r25;
    };

    const base100 = randInt(30, 69);
    const diff = randInt(2, 14);
    const p100A = base100;
    const p100B = Math.random() > 0.5 ? base100 + diff : Math.max(10, base100 - diff);

    cA = Math.max(20, roundFriendly((qA / 100) * p100A));
    cB = Math.max(20, roundFriendly((qB / 100) * p100B));

    let attempts = 0;
    while ((qB > qA && cB <= cA) || (qA > qB && cA <= cB)) {
      cA = Math.max(20, roundFriendly((qA / 100) * p100B));
      cB = Math.max(20, roundFriendly((qB / 100) * p100A));
      if (++attempts > 10) { if (qB > qA && cB <= cA) cB = cA + 20; else cA = cB + 20; break; }
    }

    targetUnit = forceUnitary ? 1 : 100;
    targetUnitLabel = forceUnitary ? `1 ${unitLabel}` : `100 ${unitLabel}`;
    qAInBase = qA;
    qBInBase = qB;

    if (includeConversions) {
      const convertA = Math.random() > 0.5;
      if (convertA) {
        if (unitLabel === "g") { qA = qA / 1000; unitA = "kg"; }
        else { qA = qA / 1000; unitA = "L"; }
        qAInBase = (unitA === "kg" || unitA === "L") ? qA * 1000 : qA;
      } else {
        if (unitLabel === "g") { qB = qB / 1000; unitB = "kg"; }
        else { qB = qB / 1000; unitB = "L"; }
        qBInBase = (unitB === "kg" || unitB === "L") ? qB * 1000 : qB;
      }
    }

  } else {
    // level3 — non-standard quantities
    const product = pick(METRIC_PRODUCTS);
    productName = product.name;
    unitLabel = product.unit;
    unitA = product.unit;
    unitB = product.unit;

    const NS = [315, 345, 385, 425, 465, 520, 575, 615, 685, 725];
    qA = pick(NS);
    qB = pick(NS);
    while (qB === qA) qB = pick(NS);

    const base100 = randInt(25, 64);
    const diff = Math.random() * 9 + 0.5;
    const p100A = base100;
    const p100B = Math.random() > 0.5 ? base100 + diff : Math.max(10, base100 - diff);

    cA = Math.round((qA / 100) * p100A);
    cB = Math.round((qB / 100) * p100B);

    let attempts = 0;
    while ((qB > qA && cB <= cA) || (qA > qB && cA <= cB)) {
      cA = Math.round((qA / 100) * p100B);
      cB = Math.round((qB / 100) * p100A);
      if (++attempts > 10) { if (qB > qA && cB <= cA) cB = cA + randInt(5, 15); else cA = cB + randInt(5, 15); break; }
    }

    targetUnit = forceUnitary ? 1 : 100;
    targetUnitLabel = forceUnitary ? `1 ${unitLabel}` : `100 ${unitLabel}`;
    qAInBase = qA;
    qBInBase = qB;

    if (includeConversions) {
      const convertA = Math.random() > 0.5;
      if (convertA) {
        if (unitLabel === "g") { qA = qA / 1000; unitA = "kg"; }
        else { qA = qA / 1000; unitA = "L"; }
        qAInBase = (unitA === "kg" || unitA === "L") ? qA * 1000 : qA;
      } else {
        if (unitLabel === "g") { qB = qB / 1000; unitB = "kg"; }
        else { qB = qB / 1000; unitB = "L"; }
        qBInBase = (unitB === "kg" || unitB === "L") ? qB * 1000 : qB;
      }
    }
  }

  const upA = (cA / qAInBase) * targetUnit;
  const upB = (cB / qBInBase) * targetUnit;
  const winner = upA < upB ? "A" : "B";

  const dispQA = (unitA === "kg" || unitA === "L") ? (qA as number).toFixed(2) : String(qA);
  const dispQB = (unitB === "kg" || unitB === "L") ? (qB as number).toFixed(2) : String(qB);

  const capName = productName.charAt(0).toUpperCase() + productName.slice(1);

  const lines = [
    capName,
    `Pack A: ${dispQA} ${unitA} for ${formatPrice(cA)}`,
    `Pack B: ${dispQB} ${unitB} for ${formatPrice(cB)}`,
    "Which pack is better value?",
  ];

  const working = [];
  if (unitA !== unitB) {
    working.push(tStep(`Convert: ${dispQA} ${unitA} = ${qAInBase} ${unitLabel}`));
  }
  const multPartA = targetUnit === 1 ? "" : ` × ${targetUnit}`;
  const multPartB = targetUnit === 1 ? "" : ` × ${targetUnit}`;
  working.push(tStep(`Pack A: ${formatPrice(cA)} ÷ ${qAInBase}${multPartA} = ${formatPriceDecimal(upA, 3)} per ${targetUnitLabel}`));
  working.push(tStep(`Pack B: ${formatPrice(cB)} ÷ ${qBInBase}${multPartB} = ${formatPriceDecimal(upB, 3)} per ${targetUnitLabel}`));
  working.push(tStep(`Compare: ${formatPriceDecimal(upA, 3)} ${upA < upB ? "<" : ">"} ${formatPriceDecimal(upB, 3)}`));

  const answer = winner === "A"
    ? `${formatPriceDecimal(upA, 2)} < ${formatPriceDecimal(upB, 2)}, so Pack A is better value`
    : `${formatPriceDecimal(upB, 2)} < ${formatPriceDecimal(upA, 2)}, so Pack B is better value`;

  return {
    kind: "worded",
    lines,
    answer,
    working,
    key: `uc-${level}-${productName}-${qA}-${qB}-${cA}-${cB}-${id}`,
    difficulty: level,
  };
};

// ── Special Offers generator ───────────────────────────────────────────────────

const SO_PRODUCTS = ["tins", "bottles", "packs", "boxes", "jars", "bags"];

const generateSpecialOffersQuestion = (level: DifficultyLevel): WordedQuestion => {
  const id = Math.floor(Math.random() * 1_000_000);
  const product = pick(SO_PRODUCTS);
  const singular = product === "boxes" ? "box" : product.slice(0, -1);

  let lines: string[];
  let answer: string;
  const working: ReturnType<typeof tStep>[] = [];

  if (level === "level1") {
    // Buy N get 1 free vs. pack of N+1 at slightly different price
    const N = randInt(1, 3);
    const Qtotal = N + 1;
    const Psingle = randInt(5, 25) * 10; // 50p–£2.50 in 10p steps

    const totalCostA = Psingle * N;
    const upA = totalCostA / Qtotal;

    const variation = (Math.random() > 0.5 ? 1 : -1) * randInt(1, 15);
    let totalCostB = Math.max(20, totalCostA + variation);
    if (Math.abs(upA - totalCostB / Qtotal) >= 20) totalCostB = totalCostA + (Math.random() > 0.5 ? 5 : -5);
    const upB = totalCostB / Qtotal;

    lines = [
      `Shop A: 1 ${singular} costs ${formatPrice(Psingle)}.`,
      `Offer: Buy ${N} get 1 free.`,
      `Shop B: A pack of ${Qtotal} ${product} costs ${formatPrice(totalCostB)}.`,
      "Which is better value?",
    ];

    working.push(tStep(`Shop A — items: Buy ${N}, get 1 free = ${Qtotal} ${product}`));
    working.push(tStep(`Shop A — total price: ${N} × ${formatPrice(Psingle)} = ${formatPrice(totalCostA)}`));
    working.push(tStep(`Shop A — unit price: ${formatPrice(totalCostA)} ÷ ${Qtotal} = ${formatPriceDecimal(upA, 2)} per ${singular}`));
    working.push(tStep(`Shop B — items: ${Qtotal} ${product}`));
    working.push(tStep(`Shop B — total price: ${formatPrice(totalCostB)}`));
    working.push(tStep(`Shop B — unit price: ${formatPrice(totalCostB)} ÷ ${Qtotal} = ${formatPriceDecimal(upB, 2)} per ${singular}`));
    working.push(tStep(`Compare: ${formatPriceDecimal(upA, 2)} ${upA < upB ? "<" : ">"} ${formatPriceDecimal(upB, 2)}`));

    answer = upA < upB
      ? `${formatPriceDecimal(upA, 2)} < ${formatPriceDecimal(upB, 2)}, so Shop A is better value`
      : `${formatPriceDecimal(upB, 2)} < ${formatPriceDecimal(upA, 2)}, so Shop B is better value`;

    return {
      kind: "worded", lines, answer, working,
      key: `so-${level}-${product}-${N}-${Psingle}-${totalCostB}-${id}`,
      difficulty: level,
    };
  }

  if (level === "level2") {
    // Percentage discount vs. bulk quantity
    const Q1 = randInt(2, 5);
    const Q2 = Q1 + randInt(1, 10 - Q1);
    const DISC_OPTS = [10, 20, 25, 30, 50];
    const discPct = pick(DISC_OPTS);

    const baseUnit = randInt(8, 15) * 10; // 80p–£1.50
    const P1full = Q1 * baseUnit;
    const P1disc = Math.round(P1full * (1 - discPct / 100));
    const upA = P1disc / Q1;

    const targetUpB = upA + (Math.random() > 0.5 ? 1 : -1) * randInt(1, 15);
    const P2 = Math.round(Q2 * Math.max(20, targetUpB));
    const upB = P2 / Q2;

    lines = [
      `Shop A: ${Q1} ${product} cost ${formatPrice(P1full)}.`,
      `Offer: ${discPct}% off.`,
      `Shop B: ${Q2} ${product} cost ${formatPrice(P2)}. No offer.`,
      `Which is better value for 1 ${singular}?`,
    ];

    working.push(tStep(`Shop A — items: ${Q1} ${product}`));
    working.push(tStep(`Shop A — total price: ${formatPrice(P1full)} − ${discPct}% = ${formatPrice(P1full - P1disc)} off → ${formatPrice(P1disc)}`));
    working.push(tStep(`Shop A — unit price: ${formatPrice(P1disc)} ÷ ${Q1} = ${formatPriceDecimal(upA, 2)} per ${singular}`));
    working.push(tStep(`Shop B — items: ${Q2} ${product}`));
    working.push(tStep(`Shop B — total price: ${formatPrice(P2)}`));
    working.push(tStep(`Shop B — unit price: ${formatPrice(P2)} ÷ ${Q2} = ${formatPriceDecimal(upB, 2)} per ${singular}`));
    working.push(tStep(`Compare: ${formatPriceDecimal(upA, 2)} ${upA < upB ? "<" : ">"} ${formatPriceDecimal(upB, 2)}`));

    answer = upA < upB
      ? `${formatPriceDecimal(upA, 2)} < ${formatPriceDecimal(upB, 2)}, so Shop A is better value`
      : `${formatPriceDecimal(upB, 2)} < ${formatPriceDecimal(upA, 2)}, so Shop B is better value`;

    return {
      kind: "worded", lines, answer, working,
      key: `so-${level}-${product}-${Q1}-${Q2}-${discPct}-${P1full}-${P2}-${id}`,
      difficulty: level,
    };
  }

  // level3: buy 1 get 1 free vs. percentage off
  const Qbase = pick([1, 2, 5]);
  const DISC_OPTS = [20, 25, 30, 40, 50];
  const discPct = pick(DISC_OPTS);

  const P1 = randInt(4, 12) * 50; // £2–£6
  const totalItemsA = Qbase * 2;
  const upA = P1 / totalItemsA;

  const targetUpB = upA + (Math.random() > 0.5 ? 1 : -1) * randInt(2, 18);
  const P2disc = Math.round(targetUpB * Qbase);
  const P2full = Math.round(P2disc / (1 - discPct / 100));
  const actualDisc = Math.round(P2full * (1 - discPct / 100));
  const upB = actualDisc / Qbase;

  const qLabel = Qbase === 1 ? "1 litre" : `${Qbase} litres`;

  lines = [
    `Shop A: ${qLabel} costs ${formatPrice(P1)}.`,
    `Offer: Buy 1 get 1 free.`,
    `Shop B: ${qLabel} costs ${formatPrice(P2full)}.`,
    `Offer: ${discPct}% off.`,
    "Which is better value for 1 litre?",
  ];

  working.push(tStep(`Shop A — items: Buy ${Qbase}L, get ${Qbase}L free = ${totalItemsA} litres`));
  working.push(tStep(`Shop A — total price: ${formatPrice(P1)}`));
  working.push(tStep(`Shop A — unit price: ${formatPrice(P1)} ÷ ${totalItemsA} = ${formatPriceDecimal(upA, 2)} per litre`));
  working.push(tStep(`Shop B — items: ${Qbase} litres`));
  working.push(tStep(`Shop B — total price: ${formatPrice(P2full)} − ${discPct}% = ${formatPriceDecimal(P2full - actualDisc, 0)} off → ${formatPrice(actualDisc)}`));
  working.push(tStep(`Shop B — unit price: ${formatPrice(actualDisc)} ÷ ${Qbase} = ${formatPriceDecimal(upB, 2)} per litre`));
  working.push(tStep(`Compare: ${formatPriceDecimal(upA, 2)} ${upA < upB ? "<" : ">"} ${formatPriceDecimal(upB, 2)}`));

  answer = upA < upB
    ? `${formatPriceDecimal(upA, 2)} < ${formatPriceDecimal(upB, 2)}, so Shop A is better value`
    : `${formatPriceDecimal(upB, 2)} < ${formatPriceDecimal(upA, 2)}, so Shop B is better value`;

  return {
    kind: "worded", lines, answer, working,
    key: `so-${level}-${product}-${Qbase}-${discPct}-${P1}-${P2full}-${id}`,
    difficulty: level,
  };
};

// ── generateQuestion ───────────────────────────────────────────────────────────

const generateQuestion = (
  tool: ToolType,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  _dropdownValue: string,
  _multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  if (tool === "unitCost") {
    return generateUnitCostQuestion(
      level,
      variables["conversions"] ?? false,
      variables["unitary"] ?? false,
    );
  }
  return generateSpecialOffersQuestion(level);
};

// ── generateUniqueQ ────────────────────────────────────────────────────────────

const generateUniqueQ = (
  tool: ToolType,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  usedKeys: Set<string>,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  let q: AnyQuestion;
  let attempts = 0;
  do { q = generateQuestion(tool, level, variables, dropdownValue, multiSelectValues); attempts++; }
  while (usedKeys.has(q.key) && attempts < 100);
  usedKeys.add(q.key);
  return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ██████████████████████████████████████████████████████████████████████████████
// END OF TOOL-SPECIFIC SECTION
// ██████████████████████████████████████████████████████████████████████████████
// ═══════════════════════════════════════════════════════════════════════════════

void (TogglePill as unknown);
void (SegButtons as unknown);
void (pick as unknown);

const LV_COLORS:Record<DifficultyLevel,{bg:string;border:string;text:string;fill:string}> = {
  level1:{bg:"bg-green-50",border:"border-green-500",text:"text-green-700",fill:"#dcfce7"},
  level2:{bg:"bg-yellow-50",border:"border-yellow-500",text:"text-yellow-700",fill:"#fef9c3"},
  level3:{bg:"bg-red-50",border:"border-red-500",text:"text-red-700",fill:"#fee2e2"},
};

const getQuestionBg = (cs:string) => ({blue:"#D1E7F8",pink:"#F8D1E7",yellow:"#F8F4D1"}[cs]??"#ffffff");
const getStepBg    = (cs:string) => ({blue:"#B3D9F2",pink:"#F2B3D9",yellow:"#F2EBB3"}[cs]??"#f3f4f6");

const QuestionDisplay = ({ q, cls }: { q: AnyQuestion; cls: string }) => {
  // All Best Buys questions are "worded" — multi-line plain text
  return (
    <div className="flex flex-col gap-1 text-center">
      {(q as any).lines.map((line: string, i: number) => (
        <div key={i} className={`${cls} font-semibold`} style={{color:"#000", lineHeight:1.6}}>
          <InlineMath text={line} />
        </div>
      ))}
    </div>
  );
};

const InlineMath = ({ text }: { text: string }) => {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span style={{display:"inline"}}>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$")) {
          return <MathRenderer key={i} latex={part.slice(1, -1)} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

const AnswerDisplay = ({ q, answerFormat: _answerFormat }: { q: AnyQuestion; answerFormat: string }) => {
  const anyQ = q as any;
  if (anyQ.answerLatex) return <><MathRenderer latex={`= ${anyQ.answerLatex}`} />{anyQ.answerSuffix && <span> {anyQ.answerSuffix}</span>}</>;
  return <span>{anyQ.answer ?? ""}</span>;
};

const DifficultyToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {([ ["level1","Level 1","bg-green-600"], ["level2","Level 2","bg-yellow-500"], ["level3","Level 3","bg-red-600"] ] as const).map(([val, label, col]) => (
      <button key={val} onClick={() => onChange(val)}
        className={`px-5 py-2 font-bold text-base transition-colors ${value===val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}>
        {label}
      </button>
    ))}
  </div>
);

const DropdownSection = ({ dropdown, value, onChange }: {
  dropdown: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[] };
  value: string; onChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dropdown.label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {dropdown.options.map(opt => dropdown.useTwoLineButtons ? (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-4 py-2.5 text-center flex flex-col items-center justify-center transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
          <span className="text-base font-bold leading-tight">{opt.label}</span>
          {opt.sub && <span className={`text-xs mt-0.5 leading-tight ${value === opt.value ? "text-blue-200" : "text-gray-400"}`}>{opt.sub}</span>}
        </button>
      ) : (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const MultiSelectSection = ({ multiSelect, values, onChange }: {
  multiSelect: { key: string; label: string; options: { value: string; label: string }[] };
  values: Record<string, boolean>;
  onChange: (k: string, v: boolean) => void;
}) => {
  const activeCount = multiSelect.options.filter(o => values[o.value]).length;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{multiSelect.label}</span>
      <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
        {multiSelect.options.map(opt => {
          const isActive = values[opt.value] ?? false;
          const isLast = isActive && activeCount === 1;
          return (
            <button key={opt.value}
              onClick={() => { if (!isLast) onChange(opt.value, !isActive); }}
              className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${isActive ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const VariablesSection = ({ variables, values, onChange }: {
  variables: { key: string; label: string }[];
  values: Record<string, boolean>;
  onChange: (k: string, v: boolean) => void;
}) => (
  <div className="flex flex-col gap-3">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span>
    {variables.map(v => (
      <label key={v.key} className="flex items-center gap-3 cursor-pointer py-1">
        <div onClick={() => onChange(v.key, !values[v.key])}
          className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${values[v.key] ? "bg-blue-900" : "bg-gray-300"}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${values[v.key] ? "translate-x-7" : "translate-x-1"}`} />
        </div>
        <span className="text-base font-semibold text-gray-700">{v.label}</span>
      </label>
    ))}
  </div>
);

const StandardQOPopover = ({ variables, variableValues, onVariableChange, dropdown, dropdownValue, onDropdownChange, multiSelect, multiSelectValues, onMultiSelectChange }: {
  variables: { key: string; label: string }[];
  variableValues: Record<string, boolean>;
  onVariableChange: (k: string, v: boolean) => void;
  dropdown: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[] } | null;
  dropdownValue: string;
  onDropdownChange: (v: string) => void;
  multiSelect: { key: string; label: string; options: { value: string; label: string }[] } | null;
  multiSelectValues: Record<string, boolean>;
  onMultiSelectChange: (k: string, v: boolean) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  const hasContent = variables.length > 0 || dropdown !== null || multiSelect !== null;
  if (!hasContent) return null;
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {dropdown && <DropdownSection dropdown={dropdown} value={dropdownValue} onChange={onDropdownChange} />}
          {multiSelect && <MultiSelectSection multiSelect={multiSelect} values={multiSelectValues} onChange={onMultiSelectChange} />}
          {variables.length > 0 && <VariablesSection variables={variables} values={variableValues} onChange={onVariableChange} />}
        </div>
      )}
    </div>
  );
};

const DiffQOPopover = ({ toolSettings, levelVariables, onLevelVariableChange, levelDropdowns, onLevelDropdownChange, levelMultiSelect, onLevelMultiSelectChange }: {
  toolSettings: typeof TOOL_CONFIG.tools[string];
  levelVariables: Record<string, Record<string, boolean>>;
  onLevelVariableChange: (lv: string, k: string, v: boolean) => void;
  levelDropdowns: Record<string, string>;
  onLevelDropdownChange: (lv: string, v: string) => void;
  levelMultiSelect: Record<string, Record<string, boolean>>;
  onLevelMultiSelectChange: (lv: string, k: string, v: boolean) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  const levels = ["level1","level2","level3"] as DifficultyLevel[];
  const getDDForLevel = (lv: string) => toolSettings.difficultySettings?.[lv]?.dropdown ?? toolSettings.dropdown;
  const getVarsForLevel = (lv: string) => toolSettings.difficultySettings?.[lv]?.variables ?? toolSettings.variables;
  const getMSForLevel = (lv: string) => toolSettings.difficultySettings?.[lv]?.multiSelect ?? toolSettings.multiSelect ?? null;
  const anyContent = levels.some(lv => getDDForLevel(lv) !== null || (getVarsForLevel(lv)?.length ?? 0) > 0 || getMSForLevel(lv) !== null);
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {!anyContent
            ? <p className="text-sm text-gray-400">No additional options for this tool.</p>
            : levels.map(lv => {
                const dd = getDDForLevel(lv);
                const vars = getVarsForLevel(lv) ?? [];
                const ms = getMSForLevel(lv);
                return (
                  <div key={lv} className="flex flex-col gap-2">
                    <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                    <div className="flex flex-col gap-3 pl-1">
                      {dd && <DropdownSection dropdown={dd} value={levelDropdowns[lv] ?? dd.defaultValue} onChange={v => onLevelDropdownChange(lv, v)} />}
                      {ms && <MultiSelectSection multiSelect={ms} values={levelMultiSelect[lv] ?? {}} onChange={(k,v) => onLevelMultiSelectChange(lv, k, v)} />}
                      {vars.length > 0 && <VariablesSection variables={vars} values={levelVariables[lv] ?? {}} onChange={(k,v) => onLevelVariableChange(lv, k, v)} />}
                      {!dd && !ms && vars.length === 0 && <p className="text-xs text-gray-400">No options at this level.</p>}
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
};

const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{backgroundColor:"rgba(0,0,0,0.5)"}} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{height:"80vh"}} onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <div><h2 className="text-2xl font-bold text-gray-900">Tool Information</h2><p className="text-sm text-gray-400 mt-0.5">A guide to all features and options</p></div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={20}/></button>
      </div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">
        {INFO_SECTIONS.map(s=>(
          <div key={s.title}>
            <div className="flex items-center gap-2 mb-3"><span className="text-xl">{s.icon}</span><h3 className="text-lg font-bold text-blue-900">{s.title}</h3></div>
            <div className="flex flex-col gap-2">
              {s.content.map(item=>(
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

const MenuDropdown = ({colorScheme,setColorScheme,onClose,onOpenInfo}:{colorScheme:string;setColorScheme:(s:string)=>void;onClose:()=>void;onOpenInfo:()=>void}) => {
  const [colorOpen,setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))onClose();};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{minWidth:"200px"}}>
      <div className="py-1">
        <button onClick={()=>setColorOpen(!colorOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-gray-400 transition-transform duration-200 ${colorOpen?"rotate-90":""}`}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Colour Scheme</span>
          </div>
          <span className="text-xs text-gray-400 font-normal capitalize">{colorScheme}</span>
        </button>
        {colorOpen&&(
          <div className="border-t border-gray-100">
            {["default","blue","pink","yellow"].map(s=>(
              <button key={s} onClick={()=>{setColorScheme(s);onClose();}}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold transition-colors capitalize ${colorScheme===s?"bg-blue-900 text-white":"text-gray-600 hover:bg-gray-50"}`}>
                {s}
                {colorScheme===s&&<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1"/>
        <button onClick={()=>{onOpenInfo();onClose();}} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Tool Information
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT / PDF
// ═══════════════════════════════════════════════════════════════════════════════

const handlePrint = (
  questions: AnyQuestion[],
  toolName: string,
  difficulty: string,
  isDifferentiated: boolean,
  numColumns: number,
  instruction: string,
) => {
  const FONT_PX   = 14;
  const PAD_MM    = 2;
  const MARGIN_MM = 12;
  const HEADER_MM = 14;
  const GAP_MM    = 2;
  const PAGE_H_MM = 297 - MARGIN_MM * 2;
  const PAGE_W_MM = 210 - MARGIN_MM * 2;
  const usableH_MM = PAGE_H_MM - HEADER_MM;
  const diffHdrMM  = 7;

  const cols    = isDifferentiated ? 3 : numColumns;
  const cellW_MM = isDifferentiated
    ? (PAGE_W_MM - GAP_MM * 2) / 3
    : (PAGE_W_MM - GAP_MM * (numColumns - 1)) / numColumns;

  const difficultyLabel = isDifferentiated ? "Differentiated" :
    difficulty === "level1" ? "Level 1" : difficulty === "level2" ? "Level 2" : "Level 3";
  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {day:"numeric",month:"long",year:"numeric"});
  const totalQ  = questions.length;

  const renderLine = (line: string): string =>
    line.split(/(\$[^$]+\$)/g).map(part => {
      if (part.startsWith("$") && part.endsWith("$")) {
        const latex = part.slice(1,-1);
        const frac = latex.includes("\\frac") ? ' data-frac="1"' : "";
        return `<span class="katex-render"${frac} data-latex="${latex.replace(/"/g,"&quot;")}"></span>`;
      }
      return `<span>${part}</span>`;
    }).join("");

  const katexSpan = (latex: string, extraClass = "") => {
    const frac = latex.includes("\\frac") ? ' data-frac="1"' : "";
    const cls = ["katex-render", extraClass].filter(Boolean).join(" ");
    return `<span class="${cls}"${frac} data-latex="${latex.replace(/"/g,"&quot;")}"></span>`;
  };

  const questionToHtml = (q: AnyQuestion, idx: number, showAnswer: boolean): string => {
    const anyQ = q as any;
    let ansHtml = "";
    if (showAnswer) {
      const al = anyQ.answerLatex ? anyQ.answerLatex : `\\text{${anyQ.answer ?? ""}}`;
      const suffix = anyQ.answerSuffix ? ` ${anyQ.answerSuffix}` : "";
      ansHtml = `<div class="q-answer">${katexSpan(`= ${al}`)}${suffix}</div>`;
    }
    const banner = `<div class="q-banner">Question ${idx + 1}</div>`;
    const instrHtml = instruction ? `<div class="q-instruction">${instruction}</div>` : "";

    // All Best Buys questions are worded — plain text lines, no KaTeX
    // Answer is plain text too, so override ansHtml for plain-text answer
    if (showAnswer) {
      ansHtml = `<div class="q-answer">${anyQ.answer ?? ""}</div>`;
    }
    const body = instrHtml
      + anyQ.lines.map((l: string, i: number) =>
          `<div class="q-line" style="${i===0?"font-weight:700;":""}text-align:center;">${renderLine(l)}</div>`
        ).join("");

    return `${banner}<div class="qbody">${body}${ansHtml}</div>`;
  };

  const probeHtml = questions.map((q, i) =>
    `<div class="q-inner" id="probe-${i}">${questionToHtml(q, i, true)}</div>`
  ).join("");

  const qHtmlData = questions.map((q, i) => ({
    q: questionToHtml(q, i, false),
    a: questionToHtml(q, i, true),
    difficulty: q.difficulty,
  }));

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${toolName} — Worksheet</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: ${MARGIN_MM}mm; }
  body { font-family: "Segoe UI", Arial, sans-serif; background: #fff; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  .page { width: ${PAGE_W_MM}mm; height: ${PAGE_H_MM}mm; overflow: hidden; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .page-header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 0.4mm solid #1e3a8a; padding-bottom: 1.5mm; margin-bottom: 2mm; }
  .page-header h1 { font-size: 5mm; font-weight: 700; color: #1e3a8a; }
  .page-header .meta { font-size: 3mm; color: #6b7280; }
  .grid { display: grid; gap: ${GAP_MM}mm; }
  .cell { border: 0.3mm solid #d1d5db; border-radius: 3mm; overflow: hidden; display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start; }
  .diff-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: ${GAP_MM}mm; }
  .diff-col  { display: flex; flex-direction: column; gap: ${GAP_MM}mm; }
  .diff-header { height: ${diffHdrMM}mm; display: flex; align-items: center; justify-content: center; font-size: 3mm; font-weight: 700; border-radius: 1mm; }
  .diff-header.level1 { background: #dcfce7; color: #166534; }
  .diff-header.level2 { background: #fef9c3; color: #854d0e; }
  .diff-header.level3 { background: #fee2e2; color: #991b1b; }
  .diff-cell { border: 0.3mm solid #d1d5db; border-radius: 3mm; overflow: hidden; display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start; }
  #probe { position: fixed; left: -9999px; top: 0; visibility: hidden; font-family: "Segoe UI", Arial, sans-serif; font-size: ${FONT_PX}px; line-height: 1.4; width: ${cellW_MM}mm; }
  .q-inner  { width: 100%; display: flex; flex-direction: column; flex: 1; }
  .q-banner { width: 100%; text-align: center; font-size: ${Math.round(FONT_PX * 0.65)}px; font-weight: 700; color: #000; padding: 1mm 0; border-bottom: 0.3mm solid #000; }
  .qbody    { padding: ${PAD_MM * 0.4}mm ${PAD_MM}mm ${PAD_MM}mm; text-align: center; flex: 1; }
  .q-instruction { font-size: ${Math.round(FONT_PX * 0.8)}px; color: #000; text-align: center; margin-bottom: 1mm; font-weight: 600; }
  .q-line   { display: block; text-align: center; font-size: ${FONT_PX}px; line-height: 1.5; }
  .q-answer { font-size: ${FONT_PX}px; color: #059669; display: block; margin-top: 1mm; text-align: center; font-weight: 700; }
  .katex-render { display: inline-block; vertical-align: baseline; }
  .katex-render .katex { font-size: ${FONT_PX}px; }
</style>
</head>
<body>
<div id="probe">${probeHtml}</div>
<div id="pages"></div>
<script>
document.addEventListener("DOMContentLoaded", function() {
  var pxPerMm   = 3.7795;
  var PAD_MM    = ${PAD_MM};
  var GAP_MM    = ${GAP_MM};
  var usableH   = ${usableH_MM};
  var diffHdrMM = ${diffHdrMM};
  var PAGE_W_MM = ${PAGE_W_MM};
  var cols      = ${cols};
  var isDiff    = ${isDifferentiated ? "true" : "false"};
  var totalQ    = ${totalQ};
  var diffLabel = "${difficultyLabel}";
  var dateStr   = "${dateStr}";
  var toolName  = "${toolName}";

  var rowHeights = [];
  for (var r = 1; r <= 10; r++) rowHeights.push((usableH - GAP_MM * (r - 1)) / r);

  var qData = ${JSON.stringify(qHtmlData)};

  var probe = document.getElementById('probe');
  probe.querySelectorAll('.katex-render').forEach(function(el) {
    try { katex.render(el.getAttribute('data-latex'), el, { throwOnError: false, output: 'html' }); }
    catch(e) { el.textContent = el.getAttribute('data-latex'); }
  });

  var maxH_px = 0;
  probe.querySelectorAll('.q-inner').forEach(function(el) {
    if (el.scrollHeight > maxH_px) maxH_px = el.scrollHeight;
  });
  var maxH_mm = maxH_px / pxPerMm;
  var needed_mm = maxH_mm + PAD_MM * 2 + 6;

  var diffPerCol   = Math.floor(totalQ / 3);
  var diffUsableH  = usableH - diffHdrMM - GAP_MM;
  var diffRowsPerPage = 1;
  var diffCellH_mm = diffUsableH;
  for (var rd = 0; rd < diffPerCol; rd++) {
    var rows2 = rd + 1;
    var h = (diffUsableH - GAP_MM * rd) / rows2;
    var dNeeded = needed_mm - diffHdrMM / rows2;
    if (h >= dNeeded) { diffRowsPerPage = rows2; diffCellH_mm = h; }
  }

  var chosenH_mm = rowHeights[0];
  var rowsPerPage = 1;
  var found = false;
  for (var r = 0; r < rowHeights.length; r++) {
    var capacity = (r + 1) * cols;
    if (capacity >= totalQ && rowHeights[r] >= needed_mm) { chosenH_mm = rowHeights[r]; rowsPerPage = r + 1; found = true; break; }
  }
  if (!found) {
    for (var r2 = 0; r2 < rowHeights.length; r2++) {
      if (rowHeights[r2] >= needed_mm) { chosenH_mm = rowHeights[r2]; rowsPerPage = r2 + 1; }
    }
  }

  var pageCapacity = isDiff ? diffRowsPerPage : rowsPerPage * cols;
  var pages = [];
  if (isDiff) {
    var numDiffPages = Math.ceil(diffPerCol / diffRowsPerPage);
    for (var p = 0; p < numDiffPages; p++) pages.push(p);
  } else {
    for (var s = 0; s < qData.length; s += pageCapacity) pages.push(qData.slice(s, s + pageCapacity));
  }
  var totalPages = pages.length;

  function makeCellW(c) { return (PAGE_W_MM - GAP_MM * (c - 1)) / c; }

  function buildCell(inner, cW, cH, isDiffCell) {
    var cls = isDiffCell ? 'diff-cell' : 'cell';
    return '<div class="' + cls + '" style="width:' + cW + 'mm;height:' + cH + 'mm;">'
         + '<div class="q-inner">' + inner + '</div></div>';
  }

  function buildGrid(pageData, showAnswer, cH) {
    if (isDiff) {
      var pgIdx = pageData;
      var start = pgIdx * diffRowsPerPage;
      var end   = start + diffRowsPerPage;
      var cW = makeCellW(3);
      var lvls = ['level1','level2','level3'];
      var lbls = ['Level 1','Level 2','Level 3'];
      var cols3 = lvls.map(function(lv, li) {
        var lqs = qData.filter(function(q) { return q.difficulty === lv; }).slice(start, end);
        var cells = lqs.map(function(q) { return buildCell(showAnswer ? q.a : q.q, cW, cH, true); }).join('');
        return '<div class="diff-col"><div class="diff-header ' + lv + '">' + lbls[li] + '</div>' + cells + '</div>';
      }).join('');
      return '<div class="diff-grid" style="grid-template-columns:repeat(3,' + cW + 'mm);">' + cols3 + '</div>';
    }
    var cW = makeCellW(cols);
    var gridRows = Math.ceil(pageData.length / cols);
    var cells = pageData.map(function(item) { return buildCell(showAnswer ? item.a : item.q, cW, cH, false); }).join('');
    return '<div class="grid" style="grid-template-columns:repeat(' + cols + ',' + cW + 'mm);grid-template-rows:repeat(' + gridRows + ',' + cH + 'mm);">' + cells + '</div>';
  }

  function buildPage(pageData, showAnswer, pgIdx) {
    var cH  = isDiff ? diffCellH_mm : chosenH_mm;
    var lbl = totalPages > 1
      ? (isDiff ? diffPerCol + ' per level' : totalQ + ' questions') + ' (' + (pgIdx+1) + '/' + totalPages + ')'
      : isDiff ? diffPerCol + ' per level' : totalQ + ' questions';
    var title = toolName + (showAnswer ? ' — Answers' : '');
    return '<div class="page">'
      + '<div class="page-header"><h1>' + title + '</h1>'
      + '<div class="meta">' + diffLabel + ' &nbsp;&middot;&nbsp; ' + dateStr + ' &nbsp;&middot;&nbsp; ' + lbl + '</div></div>'
      + buildGrid(pageData, showAnswer, cH)
      + '</div>';
  }

  var html = pages.map(function(pg, i) { return buildPage(pg, false, i); }).join('')
           + pages.map(function(pg, i) { return buildPage(pg, true,  i); }).join('');

  document.getElementById('pages').innerHTML = html;
  document.getElementById('pages').querySelectorAll('.katex-render').forEach(function(el) {
    try { katex.render(el.getAttribute('data-latex'), el, { throwOnError: false, output: 'html' }); }
    catch(e) { el.textContent = el.getAttribute('data-latex'); }
  });
  probe.remove();
  setTimeout(function() { window.print(); }, 300);
});
<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(html);
  win.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const toolKeys = Object.keys(TOOL_CONFIG.tools) as ToolType[];

  const [currentTool, setCurrentTool] = useState<ToolType>("unitCost");
  const [mode, setMode] = useState<"whiteboard"|"single"|"worksheet">("whiteboard");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("level1");

  // ── CONFIG-DRIVEN QO STATE ────────────────────────────────────────────────
  const [toolVariables, setToolVariables] = useState<Record<string,Record<string,boolean>>>(() => {
    const init: Record<string,Record<string,boolean>> = {};
    Object.keys(TOOL_CONFIG.tools).forEach(k => {
      (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
        const key = `${k}__${lv}`;
        init[key] = {};
        // Base variables (same across all levels)
        TOOL_CONFIG.tools[k].variables.forEach(v => { init[key][v.key] = v.defaultValue; });
        // Per-level overrides from difficultySettings
        const ds = TOOL_CONFIG.tools[k].difficultySettings;
        (ds?.[lv]?.variables ?? []).forEach(v => { init[key][v.key] = v.defaultValue; });
      });
    });
    return init;
  });
  const [toolDropdowns, setToolDropdowns] = useState<Record<string,string>>(() => {
    const init: Record<string,string> = {};
    Object.keys(TOOL_CONFIG.tools).forEach(k => {
      const t = TOOL_CONFIG.tools[k];
      (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
        const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
        if (dd) init[`${k}__${lv}`] = dd.defaultValue;
      });
    });
    return init;
  });
  const [toolMultiSelect, setToolMultiSelect] = useState<Record<string,Record<string,boolean>>>(() => {
    const init: Record<string,Record<string,boolean>> = {};
    Object.keys(TOOL_CONFIG.tools).forEach(k => {
      const ms = TOOL_CONFIG.tools[k].multiSelect;
      if (ms) { init[k] = {}; ms.options.forEach(o => { init[k][o.value] = o.defaultActive; }); }
    });
    return init;
  });
  const [levelVariables, setLevelVariables] = useState<Record<string,Record<string,boolean>>>(() => {
    // Initialise per-level variables for differentiated worksheet QO
    const init: Record<string,Record<string,boolean>> = {level1:{},level2:{},level3:{}};
    Object.keys(TOOL_CONFIG.tools).forEach(k => {
      const ds = TOOL_CONFIG.tools[k].difficultySettings;
      if (ds) {
        (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
          (ds[lv]?.variables ?? []).forEach(v => {
            if (!(v.key in init[lv])) init[lv][v.key] = v.defaultValue;
          });
        });
      }
    });
    return init;
  });
  const [levelDropdowns, setLevelDropdowns] = useState<Record<string,string>>(() => {
    const init: Record<string,string> = {};
    const firstTool = Object.keys(TOOL_CONFIG.tools)[0];
    const t = TOOL_CONFIG.tools[firstTool];
    (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
      const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
      if (dd) init[lv] = dd.defaultValue;
    });
    return init;
  });
  const [levelMultiSelect, setLevelMultiSelect] = useState<Record<string,Record<string,boolean>>>({level1:{},level2:{},level3:{}});
  // ─────────────────────────────────────────────────────────────────────────

  // ── SHARED STATE ─────────────────────────────────────────────────────────
  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion>(() =>
    generateQuestion("unitCost", "level1", {}, "")
  );
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(6);
  const [numColumns, setNumColumns] = useState(1);
  const [worksheet, setWorksheet] = useState<AnyQuestion[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [displayFontSize, setDisplayFontSize] = useState(1);
  const [worksheetFontSize, setWorksheetFontSize] = useState(1);
  const [colorScheme, setColorScheme] = useState("default");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Visualiser
  const [presenterMode, setPresenterMode] = useState(false);
  const [wbFullscreen, setWbFullscreen] = useState(false);
  const [splitPct, setSplitPct] = useState(40);
  const [camDevices, setCamDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentCamId, setCurrentCamId] = useState<string|null>(null);
  const [camError, setCamError] = useState<string|null>(null);
  const [camDropdownOpen, setCamDropdownOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const camDropdownRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const didLongPress = useRef(false);
  const isDraggingRef = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadKaTeX(); }, []);

  const stopStream = useCallback(() => {
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}
    if(videoRef.current) videoRef.current.srcObject=null;
  },[]);

  const startCam = useCallback(async (deviceId?:string) => {
    stopStream(); setCamError(null);
    try {
      let targetDeviceId=deviceId;
      if(!targetDeviceId){
        const tmp=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
        tmp.getTracks().forEach(t=>t.stop());
        const all=await navigator.mediaDevices.enumerateDevices();
        const builtInPattern=/facetime|built.?in|integrated|internal|front|rear/i;
        const ext=all.filter(d=>d.kind==="videoinput").find(d=>d.label&&!builtInPattern.test(d.label));
        if(ext) targetDeviceId=ext.deviceId;
      }
      const stream=await navigator.mediaDevices.getUserMedia({video:targetDeviceId?{deviceId:{exact:targetDeviceId}}:true,audio:false});
      streamRef.current=stream;
      if(videoRef.current) videoRef.current.srcObject=stream;
      setCurrentCamId(stream.getVideoTracks()[0].getSettings().deviceId??null);
      setCamDevices((await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="videoinput"));
    } catch(e:unknown){ setCamError((e instanceof Error?e.message:null)??"Camera unavailable"); }
  },[stopStream]);

  useEffect(()=>{ if(presenterMode) startCam(); else stopStream(); },[presenterMode]);
  useEffect(()=>{ if(presenterMode&&streamRef.current&&videoRef.current) videoRef.current.srcObject=streamRef.current; },[wbFullscreen]);
  useEffect(()=>{
    if(!camDropdownOpen) return;
    const h=(e:MouseEvent)=>{if(camDropdownRef.current&&!camDropdownRef.current.contains(e.target as Node))setCamDropdownOpen(false);};
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
  },[camDropdownOpen]);
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.key==="Escape"){setPresenterMode(false);setWbFullscreen(false);}};
    document.addEventListener("keydown",h); return()=>document.removeEventListener("keydown",h);
  },[]);

  const qBg = getQuestionBg(colorScheme);
  const stepBg = getStepBg(colorScheme);
  const isDefaultScheme = colorScheme==="default";
  const fsToolbarBg = isDefaultScheme?"#ffffff":stepBg;
  const fsQuestionBg = isDefaultScheme?"#ffffff":qBg;
  const fsWorkingBg  = isDefaultScheme?"#f5f3f0":qBg;

  // ── CONFIG-DRIVEN HELPERS ─────────────────────────────────────────────────
  const getToolSettings = () => TOOL_CONFIG.tools[currentTool];
  const getDropdownConfig = () => getToolSettings().difficultySettings?.[difficulty]?.dropdown ?? getToolSettings().dropdown;
  const getVariablesConfig = () => getToolSettings().difficultySettings?.[difficulty]?.variables ?? getToolSettings().variables;
  const getMultiSelectConfig = () => getToolSettings().difficultySettings?.[difficulty]?.multiSelect ?? getToolSettings().multiSelect ?? null;
  const getDropdownValue = () => toolDropdowns[`${currentTool}__${difficulty}`] ?? getDropdownConfig()?.defaultValue ?? "";
  const setDropdownValue = (v: string) => setToolDropdowns(p => ({...p, [`${currentTool}__${difficulty}`]: v}));
  const setVariableValue = (k: string, v: boolean) => setToolVariables(p => ({...p, [`${currentTool}__${difficulty}`]: {...(p[`${currentTool}__${difficulty}`]??{}), [k]: v}}));
  const setMultiSelectValue = (k: string, v: boolean) => setToolMultiSelect(p => ({...p, [currentTool]: {...(p[currentTool]??{}), [k]: v}}));
  const handleLevelVarChange = (lv: string, k: string, v: boolean) => setLevelVariables(p => ({...p, [lv]: {...p[lv], [k]: v}}));
  const handleLevelDDChange = (lv: string, v: string) => setLevelDropdowns(p => ({...p, [lv]: v}));
  const handleLevelMSChange = (lv: string, k: string, v: boolean) => setLevelMultiSelect(p => ({...p, [lv]: {...(p[lv]??{}), [k]: v}}));
  const getInstruction = (_tool = currentTool) => TOOL_CONFIG.tools[_tool]?.instruction ?? "";
  // ─────────────────────────────────────────────────────────────────────────

  const makeQuestion = (): AnyQuestion =>
    generateQuestion(currentTool, difficulty, toolVariables[`${currentTool}__${difficulty}`] || {}, getDropdownValue(), toolMultiSelect[currentTool] ?? {});

  const handleNewQuestion = () => {
    setCurrentQuestion(makeQuestion());
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = () => {
    const usedKeys = new Set<string>();
    const questions: AnyQuestion[] = [];
    if (isDifferentiated) {
      (["level1","level2","level3"] as DifficultyLevel[]).forEach(lv => {
        const t = getToolSettings();
        const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
        const vars = levelVariables[lv] ?? {};
        const ddVal = levelDropdowns[lv] ?? (dd?.defaultValue ?? "");
        const msVals = levelMultiSelect[lv] ?? {};
        for (let i = 0; i < numQuestions; i++)
          questions.push(generateUniqueQ(currentTool, lv, vars, ddVal, usedKeys, msVals));
      });
    } else {
      for (let i = 0; i < numQuestions; i++)
        questions.push(generateUniqueQ(currentTool, difficulty, toolVariables[`${currentTool}__${difficulty}`] || {}, getDropdownValue(), usedKeys, toolMultiSelect[currentTool] ?? {}));
    }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  const stdQOProps = {
    variables: getVariablesConfig() ?? [],
    variableValues: toolVariables[`${currentTool}__${difficulty}`] || {},
    onVariableChange: setVariableValue,
    dropdown: getDropdownConfig() ?? null,
    dropdownValue: getDropdownValue(),
    onDropdownChange: setDropdownValue,
    multiSelect: getMultiSelectConfig(),
    multiSelectValues: toolMultiSelect[currentTool] ?? {},
    onMultiSelectChange: setMultiSelectValue,
  };
  const diffQOProps = {
    toolSettings: getToolSettings(),
    levelVariables,
    onLevelVariableChange: handleLevelVarChange,
    levelDropdowns,
    onLevelDropdownChange: handleLevelDDChange,
    levelMultiSelect,
    onLevelMultiSelectChange: handleLevelMSChange,
  };
  const qoEl = (isDiff = false) => isDiff
    ? <DiffQOPopover {...diffQOProps} />
    : <StandardQOPopover {...stdQOProps} />;

  useEffect(()=>{ if(mode!=="worksheet") handleNewQuestion(); },[difficulty,currentTool]);

  const displayFontSizes = ["text-2xl","text-3xl","text-4xl","text-5xl","text-6xl","text-7xl"];
  const canDisplayIncrease = displayFontSize < displayFontSizes.length - 1;
  const canDisplayDecrease = displayFontSize > 0;

  const fontSizes = ["text-lg","text-xl","text-2xl","text-3xl","text-4xl","text-5xl"];
  const canIncrease = worksheetFontSize < fontSizes.length-1;
  const canDecrease = worksheetFontSize > 0;

  // ── Worksheet cell ────────────────────────────────────────────────────────
  const renderQCell = (q: AnyQuestion, idx: number, bgOverride?: string) => {
    const bg = bgOverride ?? stepBg;
    const fsz = fontSizes[worksheetFontSize];
    const cellStyle = {backgroundColor:bg, height:"100%", boxSizing:"border-box" as const, position:"relative" as const};
    const numEl = <span style={{position:"absolute",top:0,left:0,fontSize:"0.65em",fontWeight:700,color:"#000",lineHeight:1,padding:"5px 5px 7px 5px",borderRight:"1px solid #000",borderBottom:"1px solid #000"}}>{idx+1})</span>;

    // All questions are worded — lines[] of plain text
    return (
      <div className="rounded-lg p-4 shadow" style={cellStyle}>
        {numEl}
        <div className={`${fsz} font-semibold w-full text-center`} style={{color:"#000",lineHeight:1.7,paddingTop:"0.4em"}}>
          {(q as any).lines.map((line: string, i: number) => (
            <div key={i} style={{fontWeight: i === 0 ? 700 : 600}}>
              <InlineMath text={line}/>
            </div>
          ))}
        </div>
        {showWorksheetAnswers && (
          <div className={`${fsz} font-bold mt-2 text-center`} style={{color:"#059669"}}>
            <AnswerDisplay q={q} answerFormat=""/>
          </div>
        )}
      </div>
    );
  };

  // ── Control bar ───────────────────────────────────────────────────────────
  const renderControlBar = () => {
    if(mode==="worksheet") return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-center items-center gap-6 mb-4">
          <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
            {([["level1","Level 1","bg-green-600"],["level2","Level 2","bg-yellow-500"],["level3","Level 3","bg-red-600"]] as const).map(([val,label,col])=>(
              <button key={val} onClick={()=>{setDifficulty(val as DifficultyLevel);setIsDifferentiated(false);}}
                className={`px-5 py-2 font-bold text-base transition-colors ${!isDifferentiated&&difficulty===val?`${col} text-white`:"bg-white text-gray-500 hover:bg-gray-50"}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={()=>setIsDifferentiated(!isDifferentiated)}
            className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDifferentiated?"bg-blue-900 text-white border-blue-900":"bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900"}`}>
            Differentiated
          </button>
        </div>
        <div className="flex justify-center items-center gap-6 mb-4">
          {qoEl(isDifferentiated)}
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions:</label>
            <input type="number" min="1" max="24" value={numQuestions}
              onChange={e=>setNumQuestions(Math.max(1,Math.min(24,parseInt(e.target.value)||6)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center"/>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Columns:</label>
            <input type="number" min="1" max="4" value={isDifferentiated ? 3 : numColumns}
              onChange={e=>{ if(!isDifferentiated) setNumColumns(Math.max(1,Math.min(4,parseInt(e.target.value)||1))); }}
              disabled={isDifferentiated}
              className={`w-20 px-4 py-2 border-2 rounded-lg text-base font-semibold text-center transition-colors ${isDifferentiated?"border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed":"border-gray-300 bg-white"}`}/>
          </div>
        </div>
        <div className="flex justify-center items-center gap-4">
          <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
            <RefreshCw size={18}/> Generate
          </button>
          {worksheet.length>0&&<>
            <button onClick={()=>setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18}/> {showWorksheetAnswers?"Hide Answers":"Show Answers"}
            </button>
            <button onClick={()=>handlePrint(worksheet,TOOL_CONFIG.tools[currentTool].name,difficulty,isDifferentiated,numColumns,getInstruction())}
              className="px-6 py-2 bg-green-700 text-white rounded-xl font-bold text-base shadow-sm hover:bg-green-800 flex items-center gap-2">
              <Printer size={18}/> Print / PDF
            </button>
          </>}
        </div>
      </div>
    );

    return (
      <div className="px-5 py-4 rounded-xl" style={{backgroundColor:qBg}}>
        <div className="flex items-center justify-between gap-4">
          <DifficultyToggle value={difficulty} onChange={v=>setDifficulty(v as DifficultyLevel)}/>
          {qoEl()}
          <div className="flex gap-3 items-center">
            <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <RefreshCw size={18}/> New Question
            </button>
            <button onClick={()=>mode==="whiteboard"?setShowWhiteboardAnswer(!showWhiteboardAnswer):setShowAnswer(!showAnswer)}
              className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18}/> {(mode==="whiteboard"?showWhiteboardAnswer:showAnswer)?"Hide Answer":"Show Answer"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Whiteboard ────────────────────────────────────────────────────────────
  const renderWhiteboard = () => {
    const fsToolbar = (
      <div style={{background:fsToolbarBg,borderBottom:"2px solid #000",padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexShrink:0,zIndex:210}}>
        <DifficultyToggle value={difficulty} onChange={v=>setDifficulty(v as DifficultyLevel)}/>
        {qoEl()}
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><RefreshCw size={18}/> New Question</button>
          <button onClick={()=>setShowWhiteboardAnswer(a=>!a)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"><Eye size={18}/> {showWhiteboardAnswer?"Hide Answer":"Show Answer"}</button>
        </div>
      </div>
    );

    const fontBtnStyle = (enabled: boolean) => ({
      background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 8,
      cursor: enabled ? "pointer" : "not-allowed", width: 32, height: 32,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: enabled ? 1 : 0.35,
    });

    const questionBox = () => (
      <div className="rounded-xl flex items-center justify-center flex-shrink-0 p-8" style={{position:"relative",width:"480px",height:"100%",backgroundColor:stepBg}}>
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          <button style={fontBtnStyle(canDisplayDecrease)} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fontBtnStyle(canDisplayIncrease)} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
        </div>
        <div className="w-full text-center flex flex-col gap-4 items-center">
          <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>
          {showWhiteboardAnswer&&<div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}><AnswerDisplay q={currentQuestion} answerFormat=""/></div>}
        </div>
      </div>
    );

    const questionBoxFS = () => (
      <div style={{position:"relative",width:`${splitPct}%`,height:"100%",backgroundColor:fsQuestionBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,boxSizing:"border-box",flexShrink:0,overflowY:"auto",gap:16}}>
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          <button style={fontBtnStyle(canDisplayDecrease)} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
          <button style={fontBtnStyle(canDisplayIncrease)} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
        </div>
        <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>
        {showWhiteboardAnswer&&<div className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}><AnswerDisplay q={currentQuestion} answerFormat=""/></div>}
      </div>
    );

    const makeRightPanel = (isFS: boolean) => (
      <div style={{flex:1,height:"100%",position:"relative",overflow:"hidden",backgroundColor:presenterMode?"#000":(isFS?fsWorkingBg:stepBg),borderRadius:isFS?0:undefined}} className={isFS?"":"flex-1 rounded-xl"}>
        {presenterMode&&(
          <><video ref={videoRef} autoPlay playsInline muted style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
          {camError&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)",fontSize:"0.85rem",padding:"2rem",textAlign:"center",zIndex:1}}>{camError}</div>}</>
        )}
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
          {presenterMode?(
            <div style={{position:"relative"}} ref={camDropdownRef}>
              <button title="Exit Visualiser (hold for cameras)"
                onMouseDown={()=>{didLongPress.current=false;longPressTimer.current=setTimeout(()=>{didLongPress.current=true;setCamDropdownOpen(o=>!o);},500);}}
                onMouseUp={()=>{if(longPressTimer.current)clearTimeout(longPressTimer.current);if(!didLongPress.current)setPresenterMode(false);}}
                onMouseLeave={()=>{if(longPressTimer.current)clearTimeout(longPressTimer.current);}}
                style={{background:"rgba(0,0,0,0.55)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}
              ><Video size={16} color="rgba(255,255,255,0.85)"/></button>
              {camDropdownOpen&&(
                <div style={{position:"absolute",top:40,right:0,background:"rgba(12,12,12,0.96)",backdropFilter:"blur(14px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,minWidth:200,overflow:"hidden",zIndex:30}}>
                  <div style={{padding:"6px 14px",fontSize:"0.55rem",letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)"}}>Camera</div>
                  {camDevices.map((d,i)=>(
                    <div key={d.deviceId} onClick={()=>{setCamDropdownOpen(false);if(d.deviceId!==currentCamId)startCam(d.deviceId);}}
                      style={{padding:"10px 14px",fontSize:"0.75rem",color:d.deviceId===currentCamId?"#60a5fa":"rgba(255,255,255,0.65)",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}
                      onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.07)")}
                      onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                    ><div style={{width:5,height:5,borderRadius:"50%",background:d.deviceId===currentCamId?"#60a5fa":"transparent",flexShrink:0}}/>{d.label||`Camera ${i+1}`}</div>
                  ))}
                </div>
              )}
            </div>
          ):(
            <button onClick={()=>setPresenterMode(true)} title="Visualiser mode"
              style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center"}}
              onMouseEnter={e=>(e.currentTarget.style.background="rgba(0,0,0,0.15)")}
              onMouseLeave={e=>(e.currentTarget.style.background="rgba(0,0,0,0.08)")}
            ><Video size={16} color="#6b7280"/></button>
          )}
          <button onClick={()=>setWbFullscreen(f=>!f)} title={wbFullscreen?"Exit Fullscreen":"Fullscreen"}
            style={{background:wbFullscreen?"#374151":(presenterMode?"rgba(0,0,0,0.55)":"rgba(0,0,0,0.08)"),border:presenterMode?"1px solid rgba(255,255,255,0.15)":"none",borderRadius:8,cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:presenterMode?"blur(6px)":"none"}}
          >{wbFullscreen?<Minimize2 size={16} color="#ffffff"/>:<Maximize2 size={16} color={presenterMode?"rgba(255,255,255,0.85)":"#6b7280"}/>}</button>
        </div>
      </div>
    );

    if(wbFullscreen) return (
      <div style={{position:"fixed",inset:0,zIndex:200,backgroundColor:fsToolbarBg,display:"flex",flexDirection:"column"}}>
        {fsToolbar}
        <div ref={splitContainerRef} style={{flex:1,display:"flex",minHeight:0}}>
          {questionBoxFS()}
          <div
            style={{position:"relative",width:2,backgroundColor:"#000",flexShrink:0,cursor:"col-resize"}}
            onMouseDown={e => {
              isDraggingRef.current = true;
              const onMove = (ev: MouseEvent) => {
                if (!isDraggingRef.current || !splitContainerRef.current) return;
                const rect = splitContainerRef.current.getBoundingClientRect();
                let pct = ((ev.clientX - rect.left) / rect.width) * 100;
                pct = Math.min(75, Math.max(25, pct));
                if (pct >= 38 && pct <= 42) pct = 40;
                setSplitPct(pct);
              };
              const onUp = () => { isDraggingRef.current = false; document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
              document.addEventListener("mousemove", onMove);
              document.addEventListener("mouseup", onUp);
              e.preventDefault();
            }}
          >
            <div style={{position:"absolute",top:0,bottom:0,left:-5,width:12,cursor:"col-resize"}}/>
          </div>
          {makeRightPanel(true)}
        </div>
      </div>
    );

    return (
      <div className="p-8" style={{backgroundColor:qBg,height:"480px",boxSizing:"border-box"}}>
        <div className="flex gap-6" style={{height:"100%"}}>
          {questionBox()}
          {makeRightPanel(false)}
        </div>
      </div>
    );
  };

  // ── Worked Example ────────────────────────────────────────────────────────
  const renderWorkedExample = () => (
    <div className="overflow-y-auto" style={{maxHeight:"120vh"}}>
      <div className="p-8 w-full" style={{backgroundColor:qBg}}>
        <div className="text-center py-4 relative">
          <div style={{position:"absolute",top:0,right:0,display:"flex",gap:6}}>
            <button style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:canDisplayDecrease?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:canDisplayDecrease?1:0.35}} onClick={()=>canDisplayDecrease&&setDisplayFontSize(f=>f-1)}><ChevronDown size={16} color="#6b7280"/></button>
            <button style={{background:"rgba(0,0,0,0.08)",border:"none",borderRadius:8,cursor:canDisplayIncrease?"pointer":"not-allowed",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:canDisplayIncrease?1:0.35}} onClick={()=>canDisplayIncrease&&setDisplayFontSize(f=>f+1)}><ChevronUp size={16} color="#6b7280"/></button>
          </div>
          <QuestionDisplay q={currentQuestion} cls={displayFontSizes[displayFontSize]}/>
        </div>
        {showAnswer&&(
          <>
            <div className="space-y-4 mt-8">
              {currentQuestion.working.map((s,i)=>(
                <div key={i} className="rounded-xl p-6" style={{backgroundColor:stepBg}}>
                  <h4 className="text-xl font-bold mb-2" style={{color:"#000"}}>Step {i+1}</h4>
                  <div className="text-2xl" style={{color:"#000"}}>
                    {/* All Best Buys steps are plain text */}
                    <span>{s.plain}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-6 text-center mt-4" style={{backgroundColor:stepBg}}>
              <span className={`${displayFontSizes[displayFontSize]} font-bold`} style={{color:"#166534"}}>
                <AnswerDisplay q={currentQuestion} answerFormat=""/>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ── Worksheet ─────────────────────────────────────────────────────────────
  const renderWorksheet = () => {
    if(worksheet.length===0) return (
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{backgroundColor:qBg}}>
        <span className="text-2xl text-gray-400">Generate worksheet</span>
      </div>
    );
    const fontSizeControls = (
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button disabled={!canDecrease} onClick={()=>canDecrease&&setWorksheetFontSize(f=>f-1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canDecrease?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronDown size={20}/></button>
        <button disabled={!canIncrease} onClick={()=>canIncrease&&setWorksheetFontSize(f=>f+1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canIncrease?"bg-blue-900 text-white hover:bg-blue-800":"bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronUp size={20}/></button>
      </div>
    );
    const toolTitle = TOOL_CONFIG.tools[currentTool].name;
    if(isDifferentiated) return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{backgroundColor:qBg}}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{color:"#000"}}>{toolTitle} — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4" style={{alignItems:"start"}}>
          {(["level1","level2","level3"] as DifficultyLevel[]).map((lv,li)=>{
            const lqs=worksheet.filter(q=>q.difficulty===lv);
            const c=LV_COLORS[lv];
            return (
              <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}>
                <h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>Level {li+1}</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr",gridAutoRows:"1fr",gap:"0.75rem"}}>
                  {lqs.map((q,idx)=><div key={idx} style={{minHeight:0}}>{renderQCell(q,idx,c.fill)}</div>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
    return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{backgroundColor:qBg}}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{color:"#000"}}>{toolTitle} — Worksheet</h2>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${numColumns},1fr)`,gridAutoRows:"1fr",gap:"1rem"}}>
          {worksheet.map((q,idx)=><div key={idx} style={{minHeight:0}}>{renderQCell(q,idx)}</div>)}
        </div>
      </div>
    );
  };

  // ── Root render ───────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={()=>{ window.location.href="/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24}/><span className="font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button onClick={()=>setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {isMenuOpen?<X size={28}/>:<Menu size={28}/>}
            </button>
            {isMenuOpen&&<MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={()=>setIsMenuOpen(false)} onOpenInfo={()=>setIsInfoOpen(true)}/>}
          </div>
        </div>
      </div>
      {isInfoOpen&&<InfoModal onClose={()=>setIsInfoOpen(false)}/>}
      <div className="min-h-screen p-8" style={{backgroundColor:"#f5f3f0"}}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{color:"#000"}}>{TOOL_CONFIG.pageTitle}</h1>
          <div className="flex justify-center mb-8"><div style={{width:"90%",height:"2px",backgroundColor:"#d1d5db"}}/></div>
          <div className="flex justify-center gap-4 mb-6">
            {toolKeys.map(k=>(
              <button key={k} onClick={()=>setCurrentTool(k)}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${currentTool===k?"bg-blue-900 text-white":"bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {TOOL_CONFIG.tools[k].name}
              </button>
            ))}
          </div>
          <div className="flex justify-center mb-8"><div style={{width:"90%",height:"2px",backgroundColor:"#d1d5db"}}/></div>
          <div className="flex justify-center gap-4 mb-8">
            {([["whiteboard","Whiteboard"],["single","Worked Example"],["worksheet","Worksheet"]] as const).map(([m,label])=>(
              <button key={m} onClick={()=>{setMode(m);setPresenterMode(false);setWbFullscreen(false);}}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode===m?"bg-blue-900 text-white":"bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900"}`}>
                {label}
              </button>
            ))}
          </div>

          {mode==="worksheet"&&<>{renderControlBar()}{renderWorksheet()}</>}
          {mode!=="worksheet"&&(
            <div className="flex flex-col gap-6">
              <div className="rounded-xl shadow-lg">
                {renderControlBar()}
              </div>
              <div className="rounded-xl shadow-lg overflow-hidden">
                {mode==="whiteboard"&&renderWhiteboard()}
                {mode==="single"&&renderWorkedExample()}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
