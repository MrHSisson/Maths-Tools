// Teach lessons for Indices — the teacher's initial input, one lesson per tab (see specs/decks/indices.md).
// A lesson runs: hook (only if true) → check before → explain → I do → we do → check after → you do → hand-off.
// Diagnostic checks are NOT copied: each is the real Depth item, played by the same stage Depth uses (checkSlide), so the question,
// the options and the misconception behind every wrong option have one source and look identical. Hand-offs are shareable-link setups (src/shared/lessons.ts).

import type { DepthItem, TeachLesson, TeachingSlide } from "../../shared";
import { DEPTH_ITEMS } from "./IndicesDepth";

/** A Depth item played inside the deck exactly as Depth shows it (question beat, then answer beat) — one source, no copy. */
export function checkSlide(id: string, items: DepthItem[] = DEPTH_ITEMS): TeachingSlide {
  const item = items.find((i) => i.id === id);
  if (!item) throw new Error(`Teach check: no Depth item ${id}`);
  return { kind: "depth", category: "concept", title: `Check: ${item.title}`, item };
}

const LAWS: TeachLesson = {
  id: "laws",
  title: "Laws of indices",
  summary: "Multiply, divide and power of a power, built from tiles. Checks on the way, then straight into Whiteboard, Worksheet or Depth.",
  tool: "indexLaws",
  slides: [
    // 1 — hook (genuine: repeated doubling is the same maths)
    {
      category: "concept", title: "Repeated doubling",
      body: [
        { t: "text", s: "A cell splits in two every minute. After 3 minutes there are $2^3$ cells. Each keeps splitting for 5 more minutes." },
        { t: "text", s: "How many doublings in total?" },
      ],
      reveal: [
        { t: "math", s: "2^3 \\times 2^5 = 2^8" },
        { t: "text", s: "The doublings **added**: $3 + 5 = 8$." },
      ],
      revealLabel: "Reveal",
    },
    // 3 — explain
    {
      category: "concept", title: "What an index tells you",
      body: [
        { t: "math", s: "x^3 = x \\times x \\times x" },
        { t: "text", s: "The **base** is $x$. The **index** (or power) is 3: it counts how many copies of the base are multiplied." },
        { t: "text", s: "So $x^3$ is three tiles, each one an $x$." },
      ],
      reveal: [{ t: "note", tone: "bad", label: "The laws only work", s: "when the **base is the same**: $x^3 \\times x^5$ yes, $2^3 \\times 3^5$ no." }],
      revealLabel: "One rule first",
    },
    // 4 — I do: multiply
    {
      kind: "anim", category: "concept", title: "Multiplying powers of the same base",
      scene: { type: "indexExpand", law: "multiply", base: "x", m: 3, n: 5 },
      steps: [
        "Here is $x^3 \\times x^5$. Two powers of the same base.",
        "$x^3$ means three $x$'s multiplied: $x \\times x \\times x$.",
        "$x^5$ means five $x$'s multiplied.",
        "Join them. How many $x$'s are multiplied altogether? Count: 8.",
        "So $x^3 \\times x^5 = x^8$. The indices were **added**: $3 + 5 = 8$.",
      ],
    },
    // 5 — I do again: numbers, to show the base does not change
    {
      kind: "anim", category: "concept", title: "The same idea with numbers",
      scene: { type: "indexExpand", law: "multiply", base: 2, m: 3, n: 4 },
      steps: [
        "Now with numbers: $2^3 \\times 2^4$.",
        "$2^3$ is three 2's multiplied.",
        "$2^4$ is four 2's multiplied.",
        "Seven 2's altogether.",
        "$2^3 \\times 2^4 = 2^7$. The base stays 2: only the indices change. ($2^7 = 128$)",
      ],
    },
    // 6 — we do: divide
    {
      kind: "anim", category: "concept", title: "Dividing powers of the same base",
      scene: { type: "indexExpand", law: "divide", base: "x", m: 8, n: 3 },
      steps: [
        "Now undo it: $x^8 \\div x^3$, written as a fraction.",
        "The top is eight $x$'s multiplied.",
        "The bottom is three $x$'s multiplied.",
        "Dividing cancels an $x$ on the top with an $x$ on the bottom. Cancel three pairs.",
        "Five $x$'s are left on the top.",
        "So $x^8 \\div x^3 = x^5$. The indices were **subtracted**: $8 - 3 = 5$.",
      ],
    },
    // 7 — power of a power: the power says "write the bracket that many times", then the multiply law adds the indices
    {
      kind: "anim", category: "concept", title: "A power of a power",
      scene: { type: "indexExpand", law: "power", base: "x", m: 3, n: 2, predict: true },
      steps: [
        "Here is $(x^3)^2$. The power 2 says: write the bracket $x^3$ two times.",
        "So $(x^3)^2 = x^3 \\times x^3$.",
        "Each $x^3$ is three $x$'s.",
        "**Predict:** we know how to multiply powers of the same base. What happens to the indices?",
        "Multiplying adds the indices: $3 + 3 = 6$.",
        "So $(x^3)^2 = x^6$.",
      ],
    },
    {
      kind: "anim", category: "concept", title: "A power of a power: a bigger power",
      scene: { type: "indexExpand", law: "power", base: "x", m: 3, n: 4 },
      steps: [
        "Now $(x^3)^4$. The power 4 says: write the bracket four times.",
        "$(x^3)^4 = x^3 \\times x^3 \\times x^3 \\times x^3$.",
        "Each one is three $x$'s.",
        "Multiplying adds the indices: $3 + 3 + 3 + 3 = 12$.",
        "Adding 3 four times is $3 \\times 4$: for a power of a power, **multiply the indices**.",
      ],
    },
    // 8 — the three laws together
    {
      category: "concept", title: "The three laws",
      body: [
        { t: "math", s: "x^m \\times x^n = x^{m+n}" },
        { t: "math", s: "x^m \\div x^n = x^{m-n}" },
        { t: "math", s: "(x^m)^n = x^{m \\times n}" },
        { t: "text", s: "Same base: add, subtract, multiply the indices. Say why each one works with tiles." },
      ],
    },
    // 9 — check after (multiply, divide, different bases)
    checkSlide("indices-il-bases-multiplied"),
    checkSlide("indices-il-divide-count"),
    checkSlide("indices-il-two-then-three"),
    // 10 — you do
    {
      category: "concept", title: "Write each as a single power",
      body: [
        { t: "math", s: "x^4 \\times x^6" },
        { t: "math", s: "y^9 \\div y^4" },
        { t: "math", s: "(z^2)^5" },
        { t: "text", s: "Decide which law each one needs, then write the answer." },
      ],
      reveal: [
        { t: "math", s: "x^{10}\\qquad y^{5}\\qquad z^{10}" },
        { t: "note", tone: "good", label: "Why", s: "Add: $4 + 6 = 10$. Subtract: $9 - 4 = 5$. Multiply: $2 \\times 5 = 10$." },
      ],
      revealLabel: "Check",
    },
    // 11 — hand-off
    {
      category: "concept", title: "Now practise it",
      body: [
        { t: "text", s: "Same laws, fresh numbers. Choose where to go next." },
        {
          t: "handoff",
          buttons: [
            { label: "Practise it (Whiteboard)", to: { tool: "indexLaws", step: { kind: "whiteboard", level: "level1", ms: { multiply: true, divide: true, powerOfPower: false, algebraic: true, numeric: false } } } },
            { label: "Set it (Worksheet)", to: { tool: "indexLaws", step: { kind: "worksheet", level: "level1", n: 15, cols: 3, ms: { multiply: true, divide: true, powerOfPower: true, algebraic: true, numeric: true } } } },
            { label: "Reason about it (Depth)", to: { tool: "indexLaws", step: { kind: "depth", level: "level1", item: "indices-il-multiply-or-add", ms: { multiply: true, divide: true, powerOfPower: true, algebraic: true, numeric: true } } } },
          ],
        },
      ],
    },
  ],
};

const NEGATIVES: TeachLesson = {
  id: "negatives",
  title: "Zero and negative powers",
  summary: "The pattern of dividing by the base down the indices gives the zero index and then negative indices. Cancelling tiles confirms it.",
  tool: "specialPowers",
  slides: [
    // 1 — the notation again: base and index
    {
      kind: "anim", category: "concept", title: "Base and index",
      scene: { type: "indexExpand", law: "expand", base: 5, m: 3 },
      steps: [
        "The notation again: $5^3$. The **base** is 5, the number we multiply.",
        "The **index** is 3: three copies of the base.",
        "Multiplied together: $5 \\times 5 \\times 5$.",
        "$5^3 = 125$.",
      ],
    },
    // 2 — the pattern of dividing, down to zero. Why 5? It is the base.
    {
      kind: "anim", category: "concept", title: "Going down the indices",
      scene: { type: "indexPattern", base: 5, from: 3, to: 0, predictFrom: 0 },
      steps: [
        "Start with $5^3 = 125$.",
        "The index goes down by 1, to $5^2$. That takes away one copy of 5, so we **divide by 5**: $125 \\div 5 = 25$.",
        "Down again, to $5^1$: divide by 5 again. $25 \\div 5 = 5$.",
        "Why divide by 5? Because 5 is the **base**. Each step down in the index divides by the base. Next is $5^0$. **Predict:** $5 \\div 5 = {?}$",
        "$5 \\div 5 = 1$. So $5^0 = 1$.",
      ],
    },
    checkSlide("indices-sp-five-zero"),
    // 3 — keep going: the same pattern gives the negative indices
    {
      kind: "anim", category: "concept", title: "Keep going: negative indices",
      scene: { type: "indexPattern", base: 5, from: 1, to: -3, predictFrom: -1 },
      steps: [
        "Keep the pattern going. $5^1 = 5$.",
        "Divide by 5: $5^0 = 1$. We have just seen this.",
        "Divide by 5 again, to $5^{-1}$. **Predict:** $1 \\div 5 = {?}$",
        "$1 \\div 5 = \\dfrac{1}{5}$, one fifth. So $5^{-1} = \\dfrac{1}{5}$.",
        "Again, to $5^{-2}$. **Predict:** $\\dfrac{1}{5} \\div 5 = {?}$",
        "$\\dfrac{1}{5} \\div 5 = \\dfrac{1}{25}$. So $5^{-2} = \\dfrac{1}{25}$.",
        "One more, to $5^{-3}$. **Predict** the value.",
        "$\\dfrac{1}{25} \\div 5 = \\dfrac{1}{125}$. So $5^{-3} = \\dfrac{1}{125}$.",
      ],
    },
    // 4 — what the notation means (and does not mean)
    {
      category: "concept", title: "What a negative index means",
      body: [
        { t: "math", s: "5^{-2} = \\dfrac{1}{5^2} = \\dfrac{1}{25}" },
        { t: "text", s: "A negative index means **one over**. It is the reciprocal of the positive power. The answers get smaller, but they never go below zero." },
        { t: "text", s: "True or false: $2^{-3} = -8$." },
      ],
      reveal: [
        { t: "verdict", value: false },
        { t: "note", tone: "good", label: "Why", s: "The minus sign is in the index, not the answer: $2^{-3} = \\dfrac{1}{2^3} = \\dfrac{1}{8}$." },
      ],
      revealLabel: "Decide, then reveal",
    },
    // 5 — we do: a different base, so what do we divide by?
    {
      kind: "anim", category: "concept", title: "The same pattern with base 2",
      scene: { type: "indexPattern", base: 2, from: 3, to: -2, predictFrom: 0 },
      steps: [
        "A different base: $2^3 = 8$.",
        "What do we divide by this time? The base, 2. $2^2 = 4$.",
        "$2^1 = 2$.",
        "Next is $2^0$. **Predict:** $2 \\div 2 = {?}$",
        "$2 \\div 2 = 1$. The same answer as for base 5: $2^0 = 1$.",
        "Now $2^{-1}$. **Predict:** $1 \\div 2 = {?}$",
        "$1 \\div 2 = \\dfrac{1}{2}$. So $2^{-1} = \\dfrac{1}{2}$.",
        "Now $2^{-2}$. **Predict:** $\\dfrac{1}{2} \\div 2 = {?}$",
        "$\\dfrac{1}{2} \\div 2 = \\dfrac{1}{4}$. So $2^{-2} = \\dfrac{1}{4}$.",
      ],
    },
    // 6 — another way to see the same thing: cancel the tiles (equal powers, then the bottom bigger)
    {
      kind: "anim", category: "concept", title: "Another way: cancelling",
      scene: { type: "indexExpand", law: "divide", base: "x", m: 5, n: 5 },
      steps: [
        "The pattern is not the only way to see it. Cancel tiles: $x^5 \\div x^5$, as a fraction.",
        "Five $x$'s on the top.",
        "Five $x$'s on the bottom.",
        "Cancel in pairs: every pair cancels.",
        "Nothing is left: the answer is 1.",
        "The law says $x^{5-5} = x^0$. So $x^0 = 1$, as the pattern said.",
      ],
    },
    {
      kind: "anim", category: "concept", title: "When the bottom is bigger",
      scene: { type: "indexExpand", law: "divide", base: "x", m: 5, n: 8 },
      steps: [
        "Now the bottom is bigger: $x^5 \\div x^8$.",
        "Five $x$'s on the top.",
        "Eight $x$'s on the bottom.",
        "Cancel in pairs: five pairs cancel.",
        "Three $x$'s are left, on the **bottom**.",
        "So $x^5 \\div x^8 = \\dfrac{1}{x^3}$. The law gave $x^{5-8} = x^{-3}$. So $x^{-3} = \\dfrac{1}{x^3}$.",
      ],
    },
    // 5 — numbers, with the class predicting what is left
    {
      kind: "anim", category: "concept", title: "The same with numbers",
      scene: { type: "indexExpand", law: "divide", base: 2, m: 3, n: 5, predict: true },
      steps: [
        "Same idea with numbers: $2^3 \\div 2^5$.",
        "Three 2's on the top.",
        "Five 2's on the bottom.",
        "Cancel in pairs: three pairs cancel.",
        "**Predict:** what is left, and where?",
        "Two 2's are left, on the bottom.",
        "$2^3 \\div 2^5 = \\dfrac{1}{2^2} = 2^{-2}$, and $2^2 = 4$, so this is $\\dfrac{1}{4}$.",
      ],
    },
    checkSlide("indices-sp-negative-diag"),
    // 6 — you do
    {
      category: "concept", title: "Write as a fraction",
      body: [
        { t: "math", s: "5^{-2} \\qquad 2^{-4} \\qquad x^3 \\div x^7" },
        { t: "text", s: "Decide what each one is, as a fraction." },
      ],
      reveal: [
        { t: "math", s: "\\dfrac{1}{25} \\qquad \\dfrac{1}{16} \\qquad \\dfrac{1}{x^4}" },
        { t: "note", tone: "good", label: "Why", s: "$5^{-2} = \\dfrac{1}{5^2}$ and $2^{-4} = \\dfrac{1}{2^4}$. For the division, $3 - 7 = -4$, so $x^{-4} = \\dfrac{1}{x^4}$." },
      ],
      revealLabel: "Check",
    },
    // 7 — hand-off
    {
      category: "concept", title: "Now practise it",
      body: [
        { t: "text", s: "Zero and negative powers, with the laws behind them. Choose where to go next." },
        {
          t: "handoff",
          buttons: [
            { label: "Practise it (Whiteboard)", to: { tool: "specialPowers", step: { kind: "whiteboard", level: "level1", ms: { zero: true, lawsNegative: false, divideNegative: true } } } },
            { label: "Set it (Worksheet)", to: { tool: "specialPowers", step: { kind: "worksheet", level: "level1", n: 12, cols: 3, ms: { zero: true, lawsNegative: false, divideNegative: true } } } },
            { label: "Reason about it (Depth)", to: { tool: "specialPowers", step: { kind: "depth", level: "level1", item: "indices-sp-divide-to-negative-when", ms: { zero: true, lawsNegative: false, divideNegative: true } } } },
          ],
        },
      ],
    },
  ],
};

const NEGATIVES_COEFFICIENTS: TeachLesson = {
  id: "negatives-coefficients",
  title: "Negative powers with coefficients and brackets",
  summary: "Only the letter carries the index. A bracket carries everything inside it. Dividing with coefficients and negative indices.",
  tool: "specialPowers",
  slides: [
    // 1 — dividing with a coefficient: numbers on their own, letters by cancelling
    {
      kind: "anim", category: "concept", title: "A coefficient and a negative index",
      scene: { type: "indexExpand", law: "divide", base: "x", m: 3, n: 5, coefs: [12, 4] },
      steps: [
        "Now with numbers in front: $12x^3 \\div 4x^5$, as a fraction.",
        "The top: 12 and three $x$'s.",
        "The bottom: 4 and five $x$'s.",
        "The numbers divide on their own: $12 \\div 4 = 3$.",
        "Cancel the $x$'s in pairs: three pairs cancel.",
        "Two $x$'s are left, on the **bottom**.",
        "So $12x^3 \\div 4x^5 = 3x^{-2}$, which is $\\dfrac{3}{x^2}$. The 3 stays on the top.",
      ],
    },
    // 2 — the index belongs to the letter only
    {
      category: "concept", title: "Only the letter has the index",
      body: [
        { t: "math", s: "3x^{-2}" },
        { t: "text", s: "The index belongs to $x$ only. The 3 is not raised to anything." },
        { t: "text", s: "True or false: $3x^{-2} = \\dfrac{1}{3x^2}$." },
      ],
      reveal: [
        { t: "verdict", value: false },
        { t: "note", tone: "good", label: "Why", s: "Only $x$ has the negative index: $3x^{-2} = 3 \\times \\dfrac{1}{x^2} = \\dfrac{3}{x^2}$. The 3 stays on the top." },
      ],
      revealLabel: "Decide, then reveal",
    },
    checkSlide("indices-sp-coeff-diag"),
    // 3 — a bracket carries everything inside it
    {
      category: "concept", title: "A bracket carries everything inside it",
      body: [
        { t: "math", s: "(2x^{-3})^2" },
        { t: "text", s: "The power outside the bracket applies to **both** the 2 and the $x$. What is it, written as a fraction?" },
      ],
      reveal: [
        { t: "math", s: "(2x^{-3})^2 = 2^2 \\times x^{-6} = 4x^{-6} = \\dfrac{4}{x^6}" },
        { t: "note", tone: "good", label: "Notice", s: "The 2 is squared as well: $2^2 = 4$, not 2. The indices in $x$ multiply: $-3 \\times 2 = -6$." },
      ],
      revealLabel: "Work it out, then reveal",
    },
    checkSlide("indices-sp-bracket-explain"),
    // 4 — you do
    {
      category: "concept", title: "Write as a fraction",
      body: [
        { t: "math", s: "5x^{-2} \\qquad (3x)^{-2} \\qquad 8x^3 \\div 2x^7" },
        { t: "text", s: "Decide what each one is, as a fraction." },
      ],
      reveal: [
        { t: "math", s: "\\dfrac{5}{x^2} \\qquad \\dfrac{1}{9x^2} \\qquad \\dfrac{4}{x^4}" },
        { t: "note", tone: "good", label: "Why", s: "Only $x$ has the index in $5x^{-2}$. In $(3x)^{-2}$ the bracket carries the 3: $\\dfrac{1}{(3x)^2} = \\dfrac{1}{9x^2}$. For the division, $8 \\div 2 = 4$ and $3 - 7 = -4$." },
      ],
      revealLabel: "Check",
    },
    // 5 — hand-off
    {
      category: "concept", title: "Now practise it",
      body: [
        { t: "text", s: "Negative powers with coefficients and brackets. Choose where to go next." },
        {
          t: "handoff",
          buttons: [
            { label: "Practise it (Whiteboard)", to: { tool: "specialPowers", step: { kind: "whiteboard", level: "level2", ms: { coefficients: true, bracket: true } } } },
            { label: "Set it (Worksheet)", to: { tool: "specialPowers", step: { kind: "worksheet", level: "level2", n: 12, cols: 3, ms: { coefficients: true, bracket: true } } } },
            { label: "Reason about it (Depth)", to: { tool: "specialPowers", step: { kind: "depth", level: "level2", item: "indices-sp-l2-coef-extend", ms: { coefficients: true, bracket: true } } } },
          ],
        },
      ],
    },
  ],
};

const NEG_LAWS_MS = { zero: false, divideNegative: false, lawsNegative: true, powerOfPower: true, power: true, fraction: false };

const NEGATIVE_LAWS: TeachLesson = {
  id: "negative-laws",
  title: "Index laws with negative indices",
  summary: "The laws you already know still work when an index is negative: add to multiply, subtract to divide (careful: subtracting a negative adds), multiply for a power of a power.",
  tool: "specialPowers",
  slides: [
    {
      category: "concept", title: "The same laws, negative indices",
      body: [
        { t: "math", s: "x^m \\times x^n = x^{m+n} \\qquad x^m \\div x^n = x^{m-n} \\qquad (x^m)^n = x^{mn}" },
        { t: "text", s: "These did not say the indices had to be positive. A negative index is just a number, so the laws still work. Try $x^{-2} \\times x^{5}$ first." },
      ],
      reveal: [
        { t: "math", s: "x^{-2} \\times x^{5} = x^{-2+5} = x^{3}" },
        { t: "note", tone: "good", label: "Check it", s: "$x^{-2}$ is $\\dfrac{1}{x\\,x}$, so $\\dfrac{1}{x\\,x} \\times x\\,x\\,x\\,x\\,x$: two $x$'s cancel, three are left. Same answer." },
      ],
      revealLabel: "Work it out, then reveal",
    },
    {
      category: "concept", title: "Multiplying: add the indices",
      body: [
        { t: "math", s: "x^{-5} \\times x^{-6}" },
        { t: "text", s: "Add the indices, then say what the answer means as a fraction." },
      ],
      reveal: [
        { t: "math", s: "x^{-5} \\times x^{-6} = x^{-11} = \\dfrac{1}{x^{11}}" },
        { t: "note", tone: "good", label: "Notice", s: "Adding two negatives makes a bigger negative: $-5 + (-6) = -11$." },
      ],
      revealLabel: "Reveal",
    },
    {
      category: "concept", title: "Dividing: subtract the indices",
      body: [
        { t: "math", s: "x^{3} \\div x^{-2}" },
        { t: "text", s: "Subtract the indices. What is $3 - (-2)$?" },
      ],
      reveal: [
        { t: "math", s: "x^{3} \\div x^{-2} = x^{3-(-2)} = x^{3+2} = x^{5}" },
        { t: "note", tone: "good", label: "Why", s: "Subtracting a negative adds. Dividing by $x^{-2}$ is the same as multiplying by $x^{2}$." },
      ],
      revealLabel: "Reveal",
    },
    checkSlide("indices-sp-laws-negative-diag"),
    checkSlide("indices-sp-laws-negative-explain"),
    {
      category: "concept", title: "A power of a power: multiply the indices",
      body: [
        { t: "math", s: "(x^{-2})^{3} \\qquad (x^{-2})^{-3}" },
        { t: "text", s: "Multiply the indices. Mind the signs." },
      ],
      reveal: [
        { t: "math", s: "(x^{-2})^{3} = x^{-6} = \\dfrac{1}{x^{6}} \\qquad (x^{-2})^{-3} = x^{6}" },
        { t: "note", tone: "good", label: "Signs", s: "$-2 \\times 3 = -6$, but $-2 \\times (-3) = +6$: two negatives make a positive." },
      ],
      revealLabel: "Reveal",
    },
    checkSlide("indices-sp-pop-diag"),
    checkSlide("indices-sp-pop-explain"),
    {
      category: "concept", title: "Two ways to write the answer",
      body: [
        { t: "math", s: "y^{-4} \\qquad \\dfrac{1}{y^{4}}" },
        { t: "text", s: "A negative index and a fraction say the same thing. Use whichever the question asks for." },
      ],
      reveal: [
        { t: "note", tone: "good", label: "Remember", s: "Leave the answer as $y^{-4}$ or write $\\dfrac{1}{y^4}$. The index laws give the first; the meaning of a negative index gives the second." },
      ],
      revealLabel: "Reveal",
    },
    {
      category: "concept", title: "Do the three laws",
      body: [
        { t: "math", s: "y^{-5} \\div y^{-2} \\qquad (a^{-1})^{-4} \\qquad 3^{-4} \\times 3^{6}" },
        { t: "text", s: "Decide each answer first." },
      ],
      reveal: [
        { t: "math", s: "y^{-3} = \\dfrac{1}{y^3} \\qquad a^{4} \\qquad 3^{2} = 9" },
        { t: "note", tone: "good", label: "Why", s: "$-5 - (-2) = -3$. $-1 \\times -4 = 4$. $-4 + 6 = 2$." },
      ],
      revealLabel: "Check",
    },
    {
      category: "concept", title: "Now practise it",
      body: [
        { t: "text", s: "Laws with negative indices. Choose where to go next." },
        {
          t: "handoff",
          buttons: [
            { label: "Practise it (Whiteboard)", to: { tool: "specialPowers", step: { kind: "whiteboard", level: "level1", ms: NEG_LAWS_MS } } },
            { label: "Set it (Worksheet)", to: { tool: "specialPowers", step: { kind: "worksheet", level: "level1", n: 12, cols: 3, ms: NEG_LAWS_MS } } },
            { label: "Reason about it (Depth)", to: { tool: "specialPowers", step: { kind: "depth", level: "level1", item: "indices-sp-laws-negative-extend", ms: NEG_LAWS_MS } } },
          ],
        },
      ],
    },
  ],
};

const COEFFICIENTS: TeachLesson = {
  id: "coefficients",
  title: "Laws of indices with coefficients",
  summary: "Two jobs: the numbers do arithmetic and the indices follow the laws. Multiplying, dividing and a power of a bracket.",
  tool: "indexLaws",
  slides: [
    // 1 — vocabulary and the two jobs (nothing is asked until something has been taught)
    {
      category: "concept", title: "A coefficient and a power",
      body: [
        { t: "math", s: "3x^2 = 3 \\times x \\times x" },
        { t: "text", s: "The **coefficient** is the number in front: 3. The **base** is $x$ and the **index** is 2." },
        { t: "text", s: "So there are two jobs: the numbers do **arithmetic**, and the indices follow the **laws**." },
      ],
      reveal: [{ t: "note", tone: "good", label: "Keep them apart", s: "The index law never touches the coefficient, and the arithmetic never touches the index." }],
      revealLabel: "The rule to keep",
    },
    // 3 — multiply
    {
      kind: "anim", category: "concept", title: "Multiplying with coefficients",
      scene: { type: "indexExpand", law: "multiply", base: "x", m: 2, n: 5, coefs: [3, 4] },
      steps: [
        "Here is $3x^2 \\times 4x^5$. Each term is a coefficient and a power of $x$.",
        "$3x^2$: the number 3, and two $x$'s.",
        "$4x^5$: the number 4, and five $x$'s.",
        "Job 1, the numbers: multiply them. $3 \\times 4 = 12$.",
        "Job 2, the letters: seven $x$'s altogether, so the indices add: $2 + 5 = 7$.",
        "So $3x^2 \\times 4x^5 = 12x^7$. Numbers multiply; indices add.",
      ],
    },
    checkSlide("indices-il-twelve-x-ten"),
    // 4 — divide
    {
      kind: "anim", category: "concept", title: "Dividing with coefficients",
      scene: { type: "indexExpand", law: "divide", base: "x", m: 6, n: 2, coefs: [12, 3] },
      steps: [
        "Now divide: $12x^6 \\div 3x^2$, as a fraction.",
        "The top: the number 12 and six $x$'s.",
        "The bottom: the number 3 and two $x$'s.",
        "Job 1, the numbers: divide them. $12 \\div 3 = 4$.",
        "Job 2, the letters: cancel in pairs. Two pairs cancel.",
        "Four $x$'s are left on the top: $6 - 2 = 4$.",
        "So $12x^6 \\div 3x^2 = 4x^4$. Numbers divide; indices subtract.",
      ],
    },
    checkSlide("indices-il-letters-divide"),
    // 5 — a power of a bracket: the coefficient is raised to the power too
    {
      kind: "anim", category: "concept", title: "A power of a bracket with a coefficient",
      scene: { type: "indexExpand", law: "power", base: "x", m: 3, n: 2, coefs: [2], predict: true },
      steps: [
        "Here is $(2x^3)^2$. The power 2 says: write the bracket two times.",
        "$(2x^3)^2 = 2x^3 \\times 2x^3$. The power applies to the whole bracket, the number as well.",
        "Each bracket is the number 2 and three $x$'s.",
        "Job 1, the numbers: multiply. $2 \\times 2 = 4$.",
        "**Predict:** what happens to the letters?",
        "Job 2: the indices add, $3 + 3 = 6$.",
        "So $(2x^3)^2 = 4x^6$. The 2 is squared too: it does not stay as 2.",
      ],
    },
    checkSlide("indices-il-two-x-cubed-squared"),
    // 6 — you do
    {
      category: "concept", title: "Do the two jobs",
      body: [
        { t: "math", s: "5a^3 \\times 2a^4 \\qquad 20b^7 \\div 4b^2 \\qquad (3c^2)^3" },
        { t: "text", s: "For each: what do the numbers do, and what do the indices do?" },
      ],
      reveal: [
        { t: "math", s: "10a^7 \\qquad 5b^5 \\qquad 27c^6" },
        { t: "note", tone: "good", label: "Why", s: "$5 \\times 2 = 10$ and $3 + 4 = 7$. $20 \\div 4 = 5$ and $7 - 2 = 5$. $3^3 = 27$ and $2 \\times 3 = 6$." },
      ],
      revealLabel: "Check",
    },
    // 7 — hand-off
    {
      category: "concept", title: "Now practise it",
      body: [
        { t: "text", s: "Every question has a coefficient at this level. Choose where to go next." },
        {
          t: "handoff",
          buttons: [
            { label: "Practise it (Whiteboard)", to: { tool: "indexLaws", step: { kind: "whiteboard", level: "level2", ms: { multiply: true, divide: true, powerOfPower: true, multiplyDivide: false } } } },
            { label: "Set it (Worksheet)", to: { tool: "indexLaws", step: { kind: "worksheet", level: "level2", n: 12, cols: 3, ms: { multiply: true, divide: true, powerOfPower: true, multiplyDivide: true } } } },
            { label: "Reason about it (Depth)", to: { tool: "indexLaws", step: { kind: "depth", level: "level2", item: "indices-il-make-24x7", ms: { multiply: true, divide: true, powerOfPower: true, multiplyDivide: true } } } },
          ],
        },
      ],
    },
  ],
};

export const TEACH_LESSONS: TeachLesson[] = [LAWS, COEFFICIENTS, NEGATIVES, NEGATIVE_LAWS, NEGATIVES_COEFFICIENTS];
