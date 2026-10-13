// Teach lessons for Indices — the teacher's initial input, one lesson per tab (see specs/decks/indices.md).
// A lesson runs: hook (only if true) → check before → explain → I do → we do → check after → you do → hand-off.
// Diagnostic checks are NOT copied: each is built from the Depth bank by id (checkSlide), so the question, the options and the
// misconception behind every wrong option have one source. Hand-offs are shareable-link setups (src/shared/lessons.ts).

import type { DepthItem, TeachBlock, TeachLesson, TeachingSlide } from "../../shared";
import { DEPTH_ITEMS } from "./IndicesDepth";

const LETTERS = "ABCDEFGH";

/** A Depth diagnose/explain item as a Teach slide: the question beat, then (Reveal) the answer and what each wrong choice reveals. */
export function checkSlide(id: string, items: DepthItem[] = DEPTH_ITEMS): TeachingSlide {
  const item = items.find((i) => i.id === id);
  if (!item) throw new Error(`Teach check: no Depth item ${id}`);
  const body: TeachBlock[] = [];
  for (const sp of item.speakers ?? []) body.push({ t: "text", s: `**${sp.name}:** ${sp.says.join(" ")}` });
  if (item.working) {
    if (item.working.intro) body.push({ t: "text", s: item.working.intro });
    for (const l of item.working.lines) body.push({ t: "math", s: l });
  }
  for (const q of item.question) body.push({ t: "text", s: q });
  (item.options ?? []).forEach((o, i) => body.push({ t: "text", s: `**${LETTERS[i]}**  ${o.text}` }));
  const reveal: TeachBlock[] = item.answer.map((a, i) => ({ t: "note" as const, tone: "good" as const, label: i === 0 ? "Answer" : undefined, s: a }));
  (item.options ?? []).forEach((o, i) => { if (!o.correct && o.misconception) reveal.push({ t: "note", tone: "bad", label: `${LETTERS[i]}: ${o.text.replace(/\$/g, "")}`.slice(0, 40), s: o.misconception }); });
  return { category: "concept", title: `Check: ${item.title}`, body, reveal, revealLabel: "Show answer" };
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
        { t: "text", s: "A cell splits in two every minute. After 3 minutes there are $2^3$ cells." },
        { t: "text", s: "Each of them keeps splitting for 5 more minutes. How many doublings has the first cell been through altogether?" },
      ],
      reveal: [
        { t: "math", s: "3 + 5 = 8 \\text{ doublings}" },
        { t: "math", s: "2^3 \\times 2^5 = 2^8 = 256" },
        { t: "note", tone: "good", label: "Notice", s: "The number of doublings added. Today: why, and when it works." },
      ],
      revealLabel: "Reveal",
    },
    // 2 — check before
    checkSlide("indices-il-a2-a3"),
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
      kind: "anim", category: "concept", phase: "iDo", title: "Multiplying powers of the same base",
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
      kind: "anim", category: "concept", phase: "iDo", title: "The same idea with numbers",
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
      kind: "anim", category: "concept", phase: "weDo", title: "Dividing powers of the same base",
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
    // 7 — we do: power of a power (the class predicts)
    {
      kind: "anim", category: "concept", phase: "weDo", title: "A power of a power",
      scene: { type: "indexExpand", law: "power", base: "x", m: 3, n: 2, predict: true },
      steps: [
        "Here is $(x^3)^2$: the bracket $x^3$, raised to the power 2.",
        "The power 2 means two lots of $x^3$.",
        "Open the brackets: each $x^3$ is three $x$'s. Two rows of three.",
        "**Predict:** how many $x$'s altogether?",
        "Count: 6.",
        "So $(x^3)^2 = x^6$. The indices were **multiplied**: $3 \\times 2 = 6$.",
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
      category: "concept", phase: "youDo", title: "Write each as a single power",
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

export const TEACH_LESSONS: TeachLesson[] = [LAWS];
