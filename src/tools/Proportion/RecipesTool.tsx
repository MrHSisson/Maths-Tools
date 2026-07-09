import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  type WordedQuestion, type WorkingStep, type PrintMode, type PrintContext,
  randInt, pick, step, fmt, MathRenderer, getQuestionBg,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION — RECIPES & PROPORTIONAL REASONING
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "linearScaling" | "constraints";

// Constraints questions are rendered as a "Needed / You Have" table. The table
// data rides on the SimpleQuestion via `_table`; the questionRenderer draws it.
interface TableData {
  baseServings: number;
  unitName: string;
  ingredients: Array<{ name: string; needed: number; have: number | null; unit: string; isPlenty: boolean }>;
  questionText: string;
}

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const CONSTRAINTS_MS = {
  key: "questionType", label: "Question Type",
  options: [
    { value: "servings", label: "Max Servings",  defaultActive: true },
    { value: "limit",    label: "Limiting Item", defaultActive: true },
  ],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Recipes in Proportion",

  tools: {
    linearScaling: {
      name: "Linear Scaling",
      variables: [
        { key: "allowDecimalDiscrete", label: "Allow decimal eggs", defaultValue: false },
      ],
      dropdown: null,
      multiSelect: {
        key: "scaleDirection",
        label: "Scaling Direction",
        options: [
          { value: "up",   label: "Scale Up",   defaultActive: true },
          { value: "down", label: "Scale Down", defaultActive: true },
        ],
      },
      difficultySettings: null,
    },

    constraints: {
      name: "Constraints",
      variables: [
        { key: "showPlenty", label: "Show 'Plenty'", defaultValue: true },
      ],
      dropdown: null,
      multiSelect: CONSTRAINTS_MS,
      difficultySettings: {
        level1: { variables: [{ key: "showPlenty", label: "Show 'Plenty'", defaultValue: true }], multiSelect: CONSTRAINTS_MS },
        level2: { variables: [{ key: "showPlenty", label: "Show 'Plenty'", defaultValue: true }], multiSelect: CONSTRAINTS_MS },
        level3: { variables: [], multiSelect: CONSTRAINTS_MS },
      },
    },
  },
};

// ── 3. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Linear Scaling", icon: "📐", content: [
    { label: "Overview",         detail: "Scale recipes from one number of servings to another using proportional reasoning." },
    { label: "Level 1 — Green",  detail: "Direct scaling with simple multipliers (×2, ×3, ×4, ÷2, ÷4)." },
    { label: "Level 2 — Yellow", detail: "Non-integer scaling requiring finding a common factor (HCF) first." },
    { label: "Level 3 — Red",    detail: "Unitary method with coprime numbers — find for 1 serving first." },
  ]},
  { title: "Constraints", icon: "🍽️", content: [
    { label: "Overview",         detail: "Determine maximum servings based on available ingredients, or identify the limiting ingredient." },
    { label: "Level 1 — Green",  detail: "Single-serving base recipe with 3 ingredients, 1 limiting." },
    { label: "Level 2 — Yellow", detail: "Multi-serving base recipe with 4 ingredients, 2 limiting." },
    { label: "Level 3 — Red",    detail: "Multi-serving base recipe with 4 ingredients, all potentially limiting." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",       detail: "Single question on the left, working space on the right. Visualiser available." },
    { label: "Worked Example",   detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet",        detail: "Grid of questions with PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Show 'Plenty'",    detail: "For Constraints: non-limiting ingredients show 'Plenty' instead of exact stock amounts." },
    { label: "Question Type",    detail: "For Constraints: ask for max servings, the limiting ingredient, or a mix of both types." },
    { label: "Differentiated",   detail: "In differentiated mode the QO popover shows all three levels so each column can be customised independently." },
  ]},
];

// ── 4. Helpers ────────────────────────────────────────────────────────────────

// A grouped, multi-line working step (rendered by stepRenderer). The `lines`
// array is a non-standard field, so it rides on the WorkingStep via a cast.
const mLines = (lines: string[]): WorkingStep =>
  ({ type: "multiStep", latex: "", plain: "", lines } as unknown as WorkingStep);

// singular: returns the singular form of a word when count is exactly 1.
// Handles simple -s and -ies endings; falls back to stripping trailing s.
// e.g. singular(1, "cookies") → "cookie", singular(2, "cookies") → "cookies"
const singular = (count: number, word: string): string => {
  if (count !== 1) return word;
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("s"))   return word.slice(0, -1);
  return word;
};

const gcd = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd(b, a % b);

const generateCoprimes = (min: number, max: number): [number, number] => {
  let attempts = 0;
  while (attempts < 100) {
    const a = randInt(min, max);
    const b = randInt(min, max);
    if (a !== b && gcd(a, b) === 1) return [a, b];
    attempts++;
  }
  return [7, 9];
};

const RECIPE_CONTEXTS = [
  { name: "Chocolate Chip Cookies", unit: "cookies", ingredients: [
    { name: "Flour",  category: "major",    unit: "g"  },
    { name: "Sugar",  category: "major",    unit: "g"  },
    { name: "Butter", category: "major",    unit: "g"  },
    { name: "Eggs",   category: "discrete", unit: ""   },
  ]},
  { name: "Pancakes", unit: "pancakes", ingredients: [
    { name: "Flour",  category: "major",    unit: "g"  },
    { name: "Milk",   category: "medium",   unit: "ml" },
    { name: "Sugar",  category: "major",    unit: "g"  },
    { name: "Eggs",   category: "discrete", unit: ""   },
  ]},
  { name: "Brownies", unit: "brownies", ingredients: [
    { name: "Flour",        category: "major",    unit: "g"  },
    { name: "Sugar",        category: "major",    unit: "g"  },
    { name: "Cocoa Powder", category: "major",    unit: "g"  },
    { name: "Eggs",         category: "discrete", unit: ""   },
  ]},
  { name: "Scones", unit: "scones", ingredients: [
    { name: "Flour",  category: "major",    unit: "g"  },
    { name: "Butter", category: "major",    unit: "g"  },
    { name: "Milk",   category: "medium",   unit: "ml" },
    { name: "Sugar",  category: "major",    unit: "g"  },
  ]},
];

// ── 5. Question generator ─────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  _dropdownValue: string,
  _multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;
  const id = Math.floor(Math.random() * 1_000_000);

  // ── Linear Scaling ────────────────────────────────────────────────────────
  if (t === "linearScaling") {
    let baseServings = 0, targetServings = 0, scaleFactor = 0;
    const recipeContext = pick(RECIPE_CONTEXTS);

    if (level === "level1") {
      const scaleOptions = [
        { k: 0.25, divisor: 4 }, { k: 0.5, divisor: 2 },
        { k: 2,    divisor: 1 }, { k: 3,   divisor: 1 }, { k: 4, divisor: 1 },
      ];
      const selected = pick(scaleOptions);
      scaleFactor = selected.k;
      let attempts = 0;
      do {
        baseServings = randInt(2, 20);
        targetServings = baseServings * scaleFactor;
        attempts++;
      } while ((baseServings % selected.divisor !== 0 || targetServings > 50) && attempts < 100);
    } else if (level === "level2") {
      let attempts = 0;
      do {
        const f = randInt(2, 5);
        const m1 = randInt(2, 4);
        let m2;
        do { m2 = randInt(2, 6); }
        while (gcd(m1, m2) !== 1 || m2 % m1 === 0 || m1 % m2 === 0);
        baseServings = f * m1;
        targetServings = f * m2;
        scaleFactor = targetServings / baseServings;
        attempts++;
      } while ((baseServings > 20 || targetServings > 50) && attempts < 100);
    } else {
      [baseServings, targetServings] = generateCoprimes(2, 20);
      while (targetServings > 50) [baseServings, targetServings] = generateCoprimes(2, 20);
      scaleFactor = targetServings / baseServings;
    }

    // Apply scaling direction from multiSelect — pick randomly from whichever directions are active
    const allowUp   = _multiSelectValues.up   !== false;
    const allowDown = _multiSelectValues.down !== false;
    const wantUp = (allowUp && allowDown) ? Math.random() < 0.5 : allowUp;
    const isCurrentlyUp = targetServings > baseServings;
    if ((wantUp && !isCurrentlyUp) || (!wantUp && isCurrentlyUp)) {
      [baseServings, targetServings] = [targetServings, baseServings];
    }
    scaleFactor = targetServings / baseServings;

    // Discrete (e.g. eggs): pick a whole-number base amount, derive u = base/baseServings.
    // Guarantees the base recipe always shows a whole number; u may be fractional for working.
    const ingredientsWithUnitary = recipeContext.ingredients.map((ing) => {
      let u: number;
      if (ing.category === "discrete") {
        const baseAmount = randInt(1, 4); // whole eggs in the base recipe
        u = baseAmount / baseServings;
      } else if (ing.category === "major") {
        u = randInt(3, 10) * 5;
      } else if (ing.category === "medium") {
        u = randInt(2, 6) * 5;
      } else {
        u = randInt(1, 3) * 5;
      }
      return { name: ing.name, unit: ing.unit, category: ing.category, u };
    });

    const allowDecimalDiscrete = variables.allowDecimalDiscrete ?? false;
    const scaledIngredients = ingredientsWithUnitary.map((ing) => {
      const base = ing.u * baseServings;
      const exactScaled = ing.u * targetServings;
      // Round up discrete (e.g. eggs) unless the toggle allows decimal answers
      const scaled = (ing.category === "discrete" && !allowDecimalDiscrete)
        ? Math.ceil(exactScaled)
        : exactScaled;
      return { name: ing.name, unit: ing.unit, category: ing.category, u: ing.u, base, exactScaled, scaled };
    });

    // Helper: format a scaled value for the answer line
    const formatScaled = (ing: typeof scaledIngredients[number]): string => {
      const v = ing.scaled;
      return (v % 1 === 0 ? String(v) : parseFloat(v.toFixed(2))) + (ing.unit ? ing.unit : "");
    };
    // Helper: show an intermediate exact value (may be fractional) in working
    const fmtExact = (v: number) => v % 1 === 0 ? String(v) : parseFloat(v.toFixed(4)).toString().replace(/\.?0+$/, "");

    // Build lines for display (worded kind)
    const lines: string[] = [
      `A recipe for ${baseServings} ${singular(baseServings, recipeContext.unit)} uses:`,
    ];
    scaledIngredients.forEach((ing) => {
      // base is always whole for discrete by construction; format continuous normally
      const value = ing.base % 1 === 0 ? ing.base : parseFloat(ing.base.toFixed(2));
      // Discrete: singularise the ingredient name when count is 1 (e.g. "1 egg" not "1 eggs")
      const displayName = ing.category === "discrete" ? singular(value, ing.name) : ing.name;
      lines.push(`${value}${ing.unit ? ing.unit + " " : " "}${displayName}`);
    });
    lines.push(`Scale this recipe for ${targetServings} ${singular(targetServings, recipeContext.unit)}.`);

    const answer = scaledIngredients.map((ing) => {
      const scaledVal = ing.scaled;
      const displayName = ing.category === "discrete" ? singular(scaledVal, ing.name) : ing.name;
      return formatScaled(ing) + " " + displayName;
    }).join(", ");

    const working: WorkingStep[] = [];

    if (level === "level1") {
      working.push(step(`${targetServings} \\div ${baseServings} = ${scaleFactor % 1 === 0 ? scaleFactor : fmt(scaleFactor)}`));
      scaledIngredients.forEach((ing) => {
        const bv = ing.base % 1 === 0 ? ing.base : parseFloat(ing.base.toFixed(2));
        const fd = scaleFactor % 1 === 0 ? scaleFactor : fmt(scaleFactor);
        if (ing.category === "discrete" && ing.exactScaled !== ing.scaled) {
          working.push(step(`${ing.name}: ${bv} \\times ${fd} = ${fmtExact(ing.exactScaled)} \\to ${ing.scaled} \\text{ (round up)}`));
        } else {
          const sv = ing.scaled % 1 === 0 ? ing.scaled : parseFloat(ing.scaled.toFixed(2));
          working.push(step(`${ing.name}: ${bv}${ing.unit} \\times ${fd} = ${sv}${ing.unit}`));
        }
      });
    } else if (level === "level2") {
      const commonFactor = gcd(baseServings, targetServings);
      working.push(step(`\\text{HCF}(${baseServings}, ${targetServings}) = ${commonFactor}`));
      working.push(step(`${baseServings} \\to ${commonFactor} (\\div${baseServings / commonFactor})`));
      scaledIngredients.forEach((ing) => {
        const bv = ing.base % 1 === 0 ? ing.base : parseFloat(ing.base.toFixed(2));
        const iv = ing.u * commonFactor;
        const id2 = iv % 1 === 0 ? iv : parseFloat(iv.toFixed(4)).toString().replace(/\.?0+$/, "");
        working.push(step(`${ing.name}: ${bv}${ing.unit} \\div ${baseServings / commonFactor} = ${id2}${ing.unit}`));
      });
      working.push(step(`${commonFactor} \\to ${targetServings} (\\times${targetServings / commonFactor})`));
      scaledIngredients.forEach((ing) => {
        const iv = ing.u * commonFactor;
        const id2 = iv % 1 === 0 ? iv : parseFloat(iv.toFixed(4)).toString().replace(/\.?0+$/, "");
        if (ing.category === "discrete" && ing.exactScaled !== ing.scaled) {
          working.push(step(`${ing.name}: ${id2} \\times ${targetServings / commonFactor} = ${fmtExact(ing.exactScaled)} \\to ${ing.scaled} \\text{ (round up)}`));
        } else {
          const sv = ing.scaled % 1 === 0 ? ing.scaled : parseFloat(ing.scaled.toFixed(2));
          working.push(step(`${ing.name}: ${id2}${ing.unit} \\times ${targetServings / commonFactor} = ${sv}${ing.unit}`));
        }
      });
    } else {
      const singularUnit = recipeContext.unit.replace(/s$/, "");
      working.push(step(`\\text{Find for 1 } ${singularUnit} (\\div${baseServings})`));
      scaledIngredients.forEach((ing) => {
        const bv = ing.base % 1 === 0 ? ing.base : parseFloat(ing.base.toFixed(2));
        const ud = ing.u % 1 === 0 ? ing.u : parseFloat(ing.u.toFixed(4)).toString().replace(/\.?0+$/, "");
        working.push(step(`${ing.name}: ${bv}${ing.unit} \\div ${baseServings} = ${ud}${ing.unit}`));
      });
      working.push(step(`\\text{Scale to } ${targetServings} (\\times${targetServings})`));
      scaledIngredients.forEach((ing) => {
        const ud = ing.u % 1 === 0 ? ing.u : parseFloat(ing.u.toFixed(4)).toString().replace(/\.?0+$/, "");
        if (ing.category === "discrete" && ing.exactScaled !== ing.scaled) {
          working.push(step(`${ing.name}: ${ud} \\times ${targetServings} = ${fmtExact(ing.exactScaled)} \\to ${ing.scaled} \\text{ (round up)}`));
        } else {
          const sv = ing.scaled % 1 === 0 ? ing.scaled : parseFloat(ing.scaled.toFixed(2));
          working.push(step(`${ing.name}: ${ud}${ing.unit} \\times ${targetServings} = ${sv}${ing.unit}`));
        }
      });
    }

    return {
      kind: "worded",
      lines,
      answer,
      working,
      key: `linear-${level}-${baseServings}-${targetServings}-${id}`,
      difficulty: level,
    };
  }

  // ── Constraints ───────────────────────────────────────────────────────────

  const allowServings = _multiSelectValues.servings !== false;
  const allowLimit    = _multiSelectValues.limit    !== false;
  const actualQuestionType: "servings" | "limit" =
    (allowServings && allowLimit) ? (Math.random() < 0.5 ? "servings" : "limit")
    : allowLimit ? "limit"
    : "servings";

  const recipeContext = pick(RECIPE_CONTEXTS);
  let baseServings: number, numIngredients: number, numLimiting: number;

  if (level === "level1") {
    baseServings = 1;
    numIngredients = 3;
    numLimiting = 1;
  } else {
    baseServings = randInt(2, 12);
    numIngredients = 4;
    numLimiting = level === "level2" ? 2 : 4;
  }

  const selectedIngredients = recipeContext.ingredients.slice(0, numIngredients);

  // Discrete: pick whole-number base amount so needed is always a whole number.
  const ingredientsWithUnitary = selectedIngredients.map((ing) => {
    let u: number;
    if (ing.category === "discrete") {
      const baseAmount = randInt(1, 4);
      u = baseAmount / baseServings;
    } else if (ing.category === "major") {
      u = randInt(3, 10) * 5;
    } else if (ing.category === "medium") {
      u = randInt(2, 6) * 5;
    } else {
      u = randInt(1, 3) * 5;
    }
    return { name: ing.name, unit: ing.unit, category: ing.category, u };
  });

  const recipeAmounts = ingredientsWithUnitary.map((ing) => ({
    ...ing,
    // Round needed to integer for discrete ingredients (whole eggs in recipe)
    needed: ing.category === "discrete" ? Math.round(ing.u * baseServings) : ing.u * baseServings,
  }));

  const baseTarget = level === "level1" ? randInt(8, 15) : randInt(5, 12);
  const ingredientIndices = recipeAmounts.map((_, idx) => idx);
  for (let i = ingredientIndices.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [ingredientIndices[i], ingredientIndices[j]] = [ingredientIndices[j], ingredientIndices[i]];
  }
  const limitingIndices = ingredientIndices.slice(0, numLimiting);

  const targetValues: number[] = [];
  const flooredTargets = new Set<number>();
  for (let i = 0; i < numLimiting; i++) {
    let target: number, flooredT: number, attempts = 0;
    do {
      const integerPart = baseTarget + randInt(-2, 2);
      if (level === "level1") {
        target = integerPart; flooredT = target;
      } else {
        const useDecimal = Math.random() < 0.7;
        if (useDecimal) {
          const offset = randInt(1, 9) / 10;
          target = integerPart + offset; flooredT = Math.floor(target);
        } else {
          target = integerPart; flooredT = target;
        }
      }
      attempts++;
    } while ((targetValues.includes(target) || flooredTargets.has(flooredT)) && attempts < 50);
    targetValues.push(target);
    flooredTargets.add(flooredT);
  }

  const minTarget = Math.min(...targetValues);
  const showPlenty = variables.showPlenty ?? true;

  const stockAmounts = recipeAmounts.map((ing, idx) => {
    const limitingIndex = limitingIndices.indexOf(idx);
    if (limitingIndex !== -1) {
      const target = targetValues[limitingIndex];
      let stock = target * ing.u;
      if (ing.category === "discrete") {
        stock = Math.round(stock);
      } else {
        stock = Math.round(stock / 10) * 10;
      }
      const actualTarget = stock / ing.u;
      return { ...ing, stock, isPlenty: false, targetServings: actualTarget };
    } else {
      if (showPlenty) {
        return { ...ing, stock: null as number | null, isPlenty: true, targetServings: null as number | null };
      } else {
        const abundanceFactor = randInt(2, 3);
        const target = minTarget * abundanceFactor;
        let stock = target * ing.u;
        if (ing.category === "discrete") {
          stock = Math.round(stock);
        } else {
          stock = Math.round(stock / 10) * 10;
        }
        const actualTarget = stock / ing.u;
        return { ...ing, stock, isPlenty: false, targetServings: actualTarget };
      }
    }
  });

  const recalcTargets = stockAmounts.filter((ing) => !ing.isPlenty).map((ing) => ing.targetServings!);
  const finalAnswer = Math.floor(Math.min(...recalcTargets));

  const servingsDisplay = baseServings === 1 ? recipeContext.unit.replace(/s$/, "") : recipeContext.unit;
  const questionText = actualQuestionType === "servings"
    ? `How many ${recipeContext.unit} can you make?`
    : `Which ingredient limits the production?`;

  let answerText: string;
  if (actualQuestionType === "servings") {
    answerText = finalAnswer.toString();
  } else {
    const limitingIng = stockAmounts.find((ing) => !ing.isPlenty && Math.floor(ing.targetServings!) === finalAnswer);
    answerText = limitingIng ? limitingIng.name : "Unknown";
  }

  // Step 1 (only when baseServings > 1): find the amount per 1 serving
  const perOneLines: string[] = baseServings > 1
    ? stockAmounts.map((ing) => {
        if (ing.isPlenty) return `\\text{${ing.name}: Plenty}`;
        const bv = ing.needed % 1 === 0 ? ing.needed : parseFloat(ing.needed.toFixed(2));
        const uv = ing.u % 1 === 0 ? ing.u : parseFloat(ing.u.toFixed(4)).toString().replace(/\.?0+$/, "");
        const singUnit = singular(1, recipeContext.unit.replace(/s$/, ""));
        return `${ing.name}: ${bv}${ing.unit} \\div ${baseServings} = ${uv}${ing.unit} \\text{ per ${singUnit}}`;
      })
    : [];

  // Step 2 (or Step 1 if baseServings = 1): divide stock by amount per serving
  const ingLines: string[] = stockAmounts.map((ing) => {
    if (ing.isPlenty) return `\\text{${ing.name}: Plenty}`;
    const uv = ing.u % 1 === 0 ? ing.u : parseFloat(ing.u.toFixed(4)).toString().replace(/\.?0+$/, "");
    const sv = ing.stock! % 1 === 0 ? ing.stock! : parseFloat(ing.stock!.toFixed(2));
    const tv = ing.targetServings!.toFixed(1);
    const fv = Math.floor(ing.targetServings!);
    return `${ing.name}: ${sv}${ing.unit} \\div ${uv}${ing.unit} = ${tv} \\to ${fv}`;
  });

  const answerLine = actualQuestionType === "servings"
    ? `\\text{Maximum: } ${finalAnswer} \\text{ ${singular(finalAnswer, recipeContext.unit)}}`
    : `\\text{Limiting: ${answerText}}`;

  const working: WorkingStep[] = [
    ...(perOneLines.length > 0 ? [mLines(perOneLines)] : []),
    mLines(ingLines),
    step(answerLine),
  ];

  const table: TableData = {
    baseServings,
    unitName: servingsDisplay,
    ingredients: stockAmounts.map((ing) => ({
      name: ing.name,
      needed: ing.needed,
      have: ing.stock,
      unit: ing.unit,
      isPlenty: ing.isPlenty,
    })),
    questionText,
  };

  return {
    kind: "simple",
    display: questionText,
    answer: answerText,
    working,
    key: `constraints-${level}-${baseServings}-${actualQuestionType}-${id}`,
    difficulty: level,
    _table: table,
  } as unknown as AnyQuestion;
};

// ── 6. Renderers ──────────────────────────────────────────────────────────────

const getTable = (q: AnyQuestion): TableData | undefined =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (q as any)._table as TableData | undefined;

// Recipe / worded question renderer. Draws the "Needed / You Have" table for
// constraints questions and the scaling prose for linear-scaling questions,
// appending the answer inline when revealed (whiteboard / worked-example).
const questionRenderer = (
  q: AnyQuestion,
  showAnswer: boolean,
  colorScheme: string,
  compact?: boolean,
  _idx?: number,
  _qo?: unknown,
  fontClass?: string,
): JSX.Element | null => {
  const cls = fontClass ?? "text-3xl";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const answerText = (q as any).answer as string;
  const answerEl = showAnswer
    ? <div className={`${cls} font-bold`} style={{ color: "#166534" }}>= {answerText}</div>
    : null;

  const table = getTable(q);
  if (table) {
    const cellBg = getQuestionBg(colorScheme);
    const tblCls = compact === true ? "text-sm" : "text-xl";
    const pad = compact === true ? "px-2 py-1" : "px-4 py-1.5";
    return (
      <div className="flex flex-col items-center w-full gap-2">
        <div className={`${cls} font-semibold`} style={{ color: "#000" }}>
          A recipe for {table.baseServings} {table.unitName}:
        </div>
        <table className={`border-collapse ${tblCls}`} style={{ color: "#000" }}>
          <thead>
            <tr style={{ backgroundColor: cellBg }}>
              <th className={`border-2 border-gray-600 ${pad} font-bold text-left`}>Ingredient</th>
              <th className={`border-2 border-gray-600 ${pad} font-bold text-center`}>Needed</th>
              <th className={`border-2 border-gray-600 ${pad} font-bold text-center`}>You Have</th>
            </tr>
          </thead>
          <tbody>
            {table.ingredients.map((ing, i) => {
              const nv = ing.needed % 1 === 0 ? ing.needed : parseFloat(ing.needed.toFixed(2));
              const haveDisplay = ing.isPlenty ? "Plenty" :
                `${ing.have! % 1 === 0 ? ing.have : parseFloat(ing.have!.toFixed(2))}${ing.unit}`;
              return (
                <tr key={i} style={{ backgroundColor: cellBg }}>
                  <td className={`border-2 border-gray-600 ${pad}`}>{ing.name}</td>
                  <td className={`border-2 border-gray-600 ${pad} text-center`}>{nv}{ing.unit}</td>
                  <td className={`border-2 border-gray-600 ${pad} text-center`}>{haveDisplay}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className={`${cls} font-semibold`} style={{ color: "#000" }}>{table.questionText}</div>
        {answerEl}
      </div>
    );
  }

  // worded (linearScaling)
  const wq = q as WordedQuestion;
  return (
    <div className="flex flex-col gap-1 items-center text-center">
      {wq.lines.map((line, i) => (
        <div key={i} className={`${cls} font-semibold`} style={{ color: "#000", lineHeight: 1.6 }}>
          {line}
        </div>
      ))}
      {answerEl}
    </div>
  );
};

// Constraints working steps are grouped multi-line blocks; render them stacked.
// Returning null for any other step type falls back to ToolShell's default.
const stepRenderer = (s: WorkingStep): JSX.Element | null => {
  if (s.type !== "multiStep") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lines = (s as any).lines as string[];
  return (
    <div className="flex flex-col gap-2 items-center" style={{ color: "#000" }}>
      {lines.map((line, j) => <div key={j}><MathRenderer latex={line} /></div>)}
    </div>
  );
};

// ── 7. PDF print — recipe tables + scaling prose ──────────────────────────────
//
// Constraints questions carry a bespoke "Needed / You Have" table that the
// shared text print engine can't produce, so this tool supplies its own print
// handler (the sanctioned customPrintHandler escape hatch). Linear-scaling
// (worded) questions print as centred prose lines.

const handleRecipePrint = (
  questions: AnyQuestion[],
  printMode: PrintMode,
  _worksheetEl: HTMLElement | null,
  ctx: PrintContext,
) => {
  const { toolName, difficulty, isDifferentiated, numColumns } = ctx;
  void (_worksheetEl as unknown);

  const FONT_PX   = 14;
  const PAD_MM    = 2;
  const MARGIN_MM = 12;
  const HEADER_MM = 14;
  const GAP_MM    = 2;
  const PAGE_H_MM = 297 - MARGIN_MM * 2;
  const PAGE_W_MM = 210 - MARGIN_MM * 2;
  const usableH_MM = PAGE_H_MM - HEADER_MM;
  const diffHdrMM  = 7;

  const cols     = isDifferentiated ? 3 : numColumns;
  const cellW_MM = isDifferentiated
    ? (PAGE_W_MM - GAP_MM * 2) / 3
    : (PAGE_W_MM - GAP_MM * (numColumns - 1)) / numColumns;

  const difficultyLabel = isDifferentiated ? "Differentiated" :
    difficulty === "level1" ? "Level 1" : difficulty === "level2" ? "Level 2" : difficulty === "level3" ? "Level 3" : "Worksheet";
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const totalQ  = questions.length;

  // Build HTML for a table (constraints) question cell
  const tableQuestionToHtml = (t: TableData, answer: string, idx: number, showAnswer: boolean): string => {
    const banner = `<div class="q-banner">Question ${idx + 1}</div>`;
    const rows = t.ingredients.map(ing => {
      const nv = ing.needed % 1 === 0 ? ing.needed : parseFloat(ing.needed.toFixed(2));
      const neededDisplay = `${nv}${ing.unit}`;
      const haveDisplay = ing.isPlenty ? "Plenty" :
        `${ing.have! % 1 === 0 ? ing.have : parseFloat(ing.have!.toFixed(2))}${ing.unit}`;
      return `<tr><td class="tbl-cell">${ing.name}</td><td class="tbl-cell tbl-center">${neededDisplay}</td><td class="tbl-cell tbl-center">${haveDisplay}</td></tr>`;
    }).join("");
    const table = `<table class="ing-table"><thead><tr><th class="tbl-hdr tbl-left">Ingredient</th><th class="tbl-hdr tbl-center">Needed</th><th class="tbl-hdr tbl-center">Have</th></tr></thead><tbody>${rows}</tbody></table>`;
    const ansHtml = showAnswer ? `<div class="q-answer">${answer}</div>` : "";
    const body = `<div class="qbody"><div class="q-line-block">Recipe for ${t.baseServings} ${t.unitName}:</div>${table}<div class="q-line-block q-question">${t.questionText}</div>${ansHtml}</div>`;
    return `${banner}${body}`;
  };

  // Build HTML for a worded (linear-scaling) question cell
  const wordedQuestionToHtml = (q: WordedQuestion, idx: number, showAnswer: boolean): string => {
    const banner = `<div class="q-banner">Question ${idx + 1}</div>`;
    const linesHtml = q.lines.map(l => `<div class="q-line">${l}</div>`).join("");
    const ansHtml = showAnswer ? `<div class="q-answer">${q.answer}</div>` : "";
    const body = `<div class="qbody"><div class="q-lines">${linesHtml}</div>${ansHtml}</div>`;
    return `${banner}${body}`;
  };

  const questionToHtml = (q: AnyQuestion, idx: number, showAnswer: boolean): string => {
    const t = getTable(q);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (t) return tableQuestionToHtml(t, (q as any).answer, idx, showAnswer);
    return wordedQuestionToHtml(q as WordedQuestion, idx, showAnswer);
  };

  const probeHtml = questions.map((q, i) =>
    `<div class="q-inner" id="probe-${i}">${questionToHtml(q, i, true)}</div>`
  ).join("");

  const qHtmlData = questions.map((q, i) => ({
    q: questionToHtml(q, i, false),
    a: questionToHtml(q, i, true),
    difficulty: q.difficulty,
  }));

  const pMode = printMode;
  void (pMode as unknown);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${toolName} — Worksheet</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: ${MARGIN_MM}mm; }
  body { font-family: "Segoe UI", Arial, sans-serif; background: #fff; font-size: ${FONT_PX}px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  .page { width: ${PAGE_W_MM}mm; height: ${PAGE_H_MM}mm; overflow: hidden; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .page-header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 0.4mm solid #1e3a8a; padding-bottom: 1.5mm; margin-bottom: 2mm; }
  .page-header h1 { font-size: 5mm; font-weight: 700; color: #1e3a8a; }
  .page-header .meta { font-size: 3mm; color: #6b7280; }
  .grid { display: grid; gap: ${GAP_MM}mm; }
  .cell, .diff-cell { border: 0.3mm solid #d1d5db; border-radius: 3mm; overflow: hidden; display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start; }
  .diff-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: ${GAP_MM}mm; }
  .diff-col  { display: flex; flex-direction: column; gap: ${GAP_MM}mm; }
  .diff-header { height: ${diffHdrMM}mm; display: flex; align-items: center; justify-content: center; font-size: 3mm; font-weight: 700; border-radius: 1mm; }
  .diff-header.level1 { background: #dcfce7; color: #166534; }
  .diff-header.level2 { background: #fef9c3; color: #854d0e; }
  .diff-header.level3 { background: #fee2e2; color: #991b1b; }
  #probe { position: fixed; left: -9999px; top: 0; visibility: hidden; font-family: "Segoe UI", Arial, sans-serif; font-size: ${FONT_PX}px; line-height: 1.4; width: ${cellW_MM}mm; }
  .q-inner  { width: 100%; display: flex; flex-direction: column; flex: 1; }
  .q-banner { width: 100%; text-align: center; font-size: ${Math.round(FONT_PX * 0.65)}px; font-weight: 700; color: #000; padding: 1mm 0; border-bottom: 0.3mm solid #000; }
  .qbody    { padding: ${PAD_MM * 0.4}mm ${PAD_MM}mm ${PAD_MM}mm; flex: 1; text-align: center; }
  .q-line-block { font-size: ${FONT_PX}px; font-weight: 600; margin-bottom: 1mm; text-align: center; }
  .q-question   { margin-top: 1mm; text-align: center; }
  .q-lines  { font-size: ${FONT_PX}px; line-height: 1.5; text-align: center; }
  .q-line   { display: block; margin-bottom: 0.5mm; text-align: center; }
  .q-answer { font-size: ${FONT_PX}px; color: #059669; font-weight: 600; margin-top: 1mm; text-align: center; }
  .ing-table { border-collapse: collapse; width: 100%; font-size: ${Math.round(FONT_PX * 0.85)}px; margin: 1mm 0; }
  .tbl-hdr  { border: 0.3mm solid #374151; padding: 0.5mm 1.5mm; font-weight: 700; }
  .tbl-cell { border: 0.3mm solid #374151; padding: 0.5mm 1.5mm; }
  .tbl-left   { text-align: left; }
  .tbl-center { text-align: center; }
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
  var pMode     = "${printMode}";

  var rowHeights = [];
  for (var r = 1; r <= 10; r++) {
    rowHeights.push((usableH - GAP_MM * (r - 1)) / r);
  }

  var qData = ${JSON.stringify(qHtmlData)};

  // Measure tallest probe cell
  var probe = document.getElementById('probe');
  var maxH_px = 0;
  probe.querySelectorAll('.q-inner').forEach(function(el) {
    if (el.scrollHeight > maxH_px) maxH_px = el.scrollHeight;
  });
  var maxH_mm = maxH_px / pxPerMm;
  var needed_mm = maxH_mm + PAD_MM * 2 + 6;

  var diffPerCol = Math.floor(totalQ / 3);
  var diffUsableH = usableH - diffHdrMM - GAP_MM;
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
    if (capacity >= totalQ && rowHeights[r] >= needed_mm) {
      chosenH_mm = rowHeights[r]; rowsPerPage = r + 1; found = true; break;
    }
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

  var qPages = pMode !== 'answers' ? pages.map(function(pg, i) { return buildPage(pg, false, i); }).join('') : '';
  var aPages = pMode !== 'questions' ? pages.map(function(pg, i) { return buildPage(pg, true,  i); }).join('') : '';
  document.getElementById('pages').innerHTML = qPages + aPages;
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

// ── 8. App ────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      questionRenderer={questionRenderer}
      stepRenderer={stepRenderer}
      customPrintHandler={handleRecipePrint}
      defaults={{ numQuestions: 9, maxColumns: 3 }}
    />
  );
}

export const __test = { TOOL_CONFIG, generateQuestion };
