import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type WordedQuestion, type WorkingStep,
  randInt, pick, tStep,
} from "../../shared";

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "unitCost" | "specialOffers";

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const UNITARY_VAR = { key: "unitary", label: "Force unitary method", defaultValue: false };
const CONVERSIONS_MS = {
  key: "conversions",
  label: "Conversions",
  options: [
    { value: "same",       label: "Same Units", defaultActive: true },
    { value: "conversion", label: "Conversion", defaultActive: false },
  ],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Best Buys",
  tools: {

    unitCost: {
      name: "Unit Cost",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { dropdown: null, variables: [] },
        level2: { dropdown: null, variables: [UNITARY_VAR], multiSelect: CONVERSIONS_MS },
        level3: { dropdown: null, variables: [UNITARY_VAR], multiSelect: CONVERSIONS_MS },
      },
    },

    specialOffers: {
      name: "Special Offers",
      variables: [],
      dropdown: null,
      difficultySettings: null,
    },

  },
};

// ── 3. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
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

// ── 4. Maths helpers ──────────────────────────────────────────────────────────
// Best Buys questions are purely prose — prices, units and comparisons stay as
// plain text (tStep), never inside KaTeX.

// formatPrice: pence → display string
const formatPrice = (pence: number): string => {
  if (pence >= 100) return `£${(pence / 100).toFixed(2)}`;
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

// ── 5. Unit Cost generator ─────────────────────────────────────────────────────

const generateUnitCostQuestion = (
  level: DifficultyLevel,
  conversionValues: Record<string, boolean>,
  forceUnitary: boolean,
): WordedQuestion => {
  // same and/or conversion can be independently active
  const sameActive       = conversionValues["same"]       ?? true;
  const conversionActive = conversionValues["conversion"] ?? false;
  // If both active: randomly pick per-question. If only conversion: always convert.
  const anyConversions = conversionActive;
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

    if (anyConversions) {
      // If both same and conversion active: randomly decide whether to convert this question
      const doConvert = !sameActive || Math.random() > 0.5;
      if (doConvert) {
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

    if (anyConversions) {
      // If both same and conversion active: randomly decide whether to convert this question
      const doConvert = !sameActive || Math.random() > 0.5;
      if (doConvert) {
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
  }

  const upA = (cA / qAInBase) * targetUnit;
  const upB = (cB / qBInBase) * targetUnit;
  const winner = upA < upB ? "A" : "B";

  const dispQA = (unitA === "kg" || unitA === "L") ? qA.toFixed(2) : String(qA);
  const dispQB = (unitB === "kg" || unitB === "L") ? qB.toFixed(2) : String(qB);

  const capName = productName.charAt(0).toUpperCase() + productName.slice(1);

  const lines = [
    capName,
    `Pack A: ${dispQA} ${unitA} for ${formatPrice(cA)}`,
    `Pack B: ${dispQB} ${unitB} for ${formatPrice(cB)}`,
    "Which pack is better value?",
  ];

  const working: WorkingStep[] = [];
  if (unitA !== unitB) {
    working.push(tStep(`Convert: ${unitA !== unitLabel ? `${dispQA} ${unitA} = ${qAInBase} ${unitLabel}` : `${dispQB} ${unitB} = ${qBInBase} ${unitLabel}`}`));
  }
  const multPart = targetUnit === 1 ? "" : ` × ${targetUnit}`;
  working.push(tStep(`Pack A: ${formatPrice(cA)} ÷ ${qAInBase}${multPart} = ${formatPriceDecimal(upA, 3)} per ${targetUnitLabel}`));
  working.push(tStep(`Pack B: ${formatPrice(cB)} ÷ ${qBInBase}${multPart} = ${formatPriceDecimal(upB, 3)} per ${targetUnitLabel}`));
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

// ── 6. Special Offers generator ────────────────────────────────────────────────

const SO_PRODUCTS = ["tins", "bottles", "packs", "boxes", "jars", "bags"];

const generateSpecialOffersQuestion = (level: DifficultyLevel): WordedQuestion => {
  const id = Math.floor(Math.random() * 1_000_000);
  const product = pick(SO_PRODUCTS);
  const singular = product === "boxes" ? "box" : product.slice(0, -1);

  let lines: string[];
  let answer: string;
  const working: WorkingStep[] = [];

  if (level === "level1") {
    // Shop A: multi-buy deal — pay for `pay`, receive `pay + free`
    // Shop B: a pack of QB items (QB ≠ Qtotal) at a close but different unit price
    const DEALS = [
      { pay: 1, free: 1 }, // buy 1 get 1 free
      { pay: 2, free: 1 }, // buy 2 get 1 free
      { pay: 3, free: 1 }, // buy 3 get 1 free
      { pay: 3, free: 2 }, // buy 3 get 2 free
      { pay: 5, free: 2 }, // buy 5 get 2 free
      { pay: 5, free: 3 }, // buy 5 get 3 free
    ];
    const deal = pick(DEALS);
    const N = deal.pay;
    const Qtotal = deal.pay + deal.free; // total items received
    const Psingle = randInt(5, 25) * 10; // 50p-£2.50 in 10p steps

    const totalCostA = Psingle * N;
    const upA = totalCostA / Qtotal; // pence per item from Shop A

    // Shop B quantity: pick from sensible sizes, must differ from Qtotal
    const QB_OPTIONS = [2, 3, 4, 5, 6, 8, 10].filter(q => q !== Qtotal);
    const QB = pick(QB_OPTIONS);

    // Shop B unit price: close to Shop A's (within ±15p) but not equal
    const upBVariation = (Math.random() > 0.5 ? 1 : -1) * randInt(3, 15);
    const upB = Math.max(10, upA + upBVariation);
    // Round Shop B total to nearest 5p for clean numbers
    const totalCostB = Math.round((QB * upB) / 5) * 5;
    const upBActual = totalCostB / QB;

    const freeLabel = deal.free === 1 ? "1 free" : `${deal.free} free`;
    lines = [
      `Shop A: 1 ${singular} costs ${formatPrice(Psingle)}.`,
      `Offer: Buy ${N} get ${freeLabel}.`,
      `Shop B: A pack of ${QB} ${product} costs ${formatPrice(totalCostB)}.`,
      "Which is better value?",
    ];

    working.push(tStep(`Shop A — items: Buy ${N}, get ${freeLabel} = ${Qtotal} ${product}`));
    working.push(tStep(`Shop A — total price: ${N} × ${formatPrice(Psingle)} = ${formatPrice(totalCostA)}`));
    working.push(tStep(`Shop A — unit price: ${formatPrice(totalCostA)} ÷ ${Qtotal} = ${formatPriceDecimal(upA, 2)} per ${singular}`));
    working.push(tStep(`Shop B — items: ${QB} ${product}`));
    working.push(tStep(`Shop B — total price: ${formatPrice(totalCostB)}`));
    working.push(tStep(`Shop B — unit price: ${formatPrice(totalCostB)} ÷ ${QB} = ${formatPriceDecimal(upBActual, 2)} per ${singular}`));
    working.push(tStep(`Compare: ${formatPriceDecimal(upA, 2)} ${upA < upBActual ? "<" : ">"} ${formatPriceDecimal(upBActual, 2)}`));

    answer = upA < upBActual
      ? `${formatPriceDecimal(upA, 2)} < ${formatPriceDecimal(upBActual, 2)}, so Shop A is better value`
      : `${formatPriceDecimal(upBActual, 2)} < ${formatPriceDecimal(upA, 2)}, so Shop B is better value`;

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

  // level3: price of 1 item + multi-buy deal (Shop A) vs. bulk quantity + % discount (Shop B)
  const L3_DEALS = [
    { pay: 1, free: 1 },
    { pay: 2, free: 1 },
    { pay: 3, free: 1 },
    { pay: 3, free: 2 },
    { pay: 5, free: 2 },
    { pay: 5, free: 3 },
  ];
  const l3Deal = pick(L3_DEALS);
  const l3Qtotal = l3Deal.pay + l3Deal.free; // total items received from Shop A's deal
  const Psingle = randInt(4, 20) * 25; // £1–£5 in 25p steps (clean single-item price)
  const totalCostA = Psingle * l3Deal.pay;
  const upA = totalCostA / l3Qtotal; // pence per item

  // Shop B: a quantity > 1 with a percentage discount — QB must differ from l3Qtotal
  const QB_OPTIONS = [2, 3, 4, 5, 6, 8, 10].filter(q => q !== l3Qtotal && q > 1);
  const QB = pick(QB_OPTIONS);
  const DISC_OPTS = [10, 20, 25, 30, 50];
  const discPct = pick(DISC_OPTS);

  // Work backwards from a target unit price close to Shop A's
  const upBVariation = (Math.random() > 0.5 ? 1 : -1) * randInt(3, 20);
  const targetUpBDisc = Math.max(10, upA + upBVariation); // discounted unit price
  const P2full = Math.round((targetUpBDisc * QB) / (1 - discPct / 100) / 5) * 5; // round to 5p
  const actualDisc = Math.round(P2full * (1 - discPct / 100));
  const upB = actualDisc / QB;

  const freeLabel = l3Deal.free === 1 ? "1 free" : `${l3Deal.free} free`;

  lines = [
    `Shop A: 1 ${singular} costs ${formatPrice(Psingle)}.`,
    `Offer: Buy ${l3Deal.pay} get ${freeLabel}.`,
    `Shop B: ${QB} ${product} cost ${formatPrice(P2full)}.`,
    `Offer: ${discPct}% off.`,
    `Which is better value for 1 ${singular}?`,
  ];

  working.push(tStep(`Shop A — items: Buy ${l3Deal.pay}, get ${freeLabel} = ${l3Qtotal} ${product}`));
  working.push(tStep(`Shop A — total price: ${l3Deal.pay} × ${formatPrice(Psingle)} = ${formatPrice(totalCostA)}`));
  working.push(tStep(`Shop A — unit price: ${formatPrice(totalCostA)} ÷ ${l3Qtotal} = ${formatPriceDecimal(upA, 2)} per ${singular}`));
  working.push(tStep(`Shop B — items: ${QB} ${product}`));
  working.push(tStep(`Shop B — total price: ${formatPrice(P2full)} − ${discPct}% = ${formatPriceDecimal(P2full - actualDisc, 0)} off → ${formatPrice(actualDisc)}`));
  working.push(tStep(`Shop B — unit price: ${formatPrice(actualDisc)} ÷ ${QB} = ${formatPriceDecimal(upB, 2)} per ${singular}`));
  working.push(tStep(`Compare: ${formatPriceDecimal(upA, 2)} ${upA < upB ? "<" : ">"} ${formatPriceDecimal(upB, 2)}`));

  answer = upA < upB
    ? `${formatPriceDecimal(upA, 2)} < ${formatPriceDecimal(upB, 2)}, so Shop A is better value`
    : `${formatPriceDecimal(upB, 2)} < ${formatPriceDecimal(upA, 2)}, so Shop B is better value`;

  return {
    kind: "worded", lines, answer, working,
    key: `so-${level}-${product}-${l3Deal.pay}-${l3Deal.free}-${Psingle}-${QB}-${discPct}-${P2full}-${id}`,
    difficulty: level,
  };
};

// ── 7. generateQuestion ───────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues?: Record<string, boolean>,
): WordedQuestion => {
  const t = tool as ToolType;
  if (t === "unitCost") {
    return generateUnitCostQuestion(
      level,
      multiSelectValues ?? {},   // { same?: boolean, conversion?: boolean }
      variables["unitary"] ?? false,
    );
  }
  return generateSpecialOffersQuestion(level);
};

// ─────────────────────────────────────────────────────────────────────────────

// Exposed for the generator smoke-test suite (src/tests/generators.test.ts).
export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
    />
  );
}
