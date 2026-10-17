// Teach decks for Rounding → Identify Sig. Figs (specs/decks/sig-figs.md, Lesson 1). Explicit on purpose: significant figures are hard, so
// every deck uses the same rules in the same words (before / after, never left / right), names each kind of zero, and ends on a
// "Write this down" slide. Checks are the real Depth items (RoundingSfIdDepth.ts) played by the Depth stage, never copies.

import type { TeachLesson, TeachingSlide } from "../../shared";
import { SF_ID_DEPTH_ITEMS } from "./RoundingSfIdDepth";
import { checkSlide } from "./IndicesTeach";

const check = (id: string): TeachingSlide => checkSlide(id, SF_ID_DEPTH_ITEMS);

const L1_MS = { wholes: true, decimals: true, none: true, trapped: true };
const L2_MS = { wholes: true, decimals: true, mark: true, name: true, count: true, leading: true, trailing: true };

const START: TeachLesson = {
  id: "sf-start",
  title: "Where do significant figures start?",
  summary: "The first non-zero digit, counting the 1st, 2nd and 3rd, and the zero trapped between digits. Ends on the rules to write down.",
  tool: "identifySf",
  slides: [
    {
      category: "concept", title: "What are significant figures?",
      body: [
        { t: "text", s: "**Significant figures** (s.f.) are the digits of a number that count." },
        { t: "text", s: "We always start counting at the **first non-zero digit**." },
      ],
      reveal: [{ t: "note", tone: "plain", label: "Rule 1", s: "The first significant figure is the first **non-zero** digit." }],
      revealLabel: "Rule 1",
    },
    {
      kind: "anim", category: "concept", title: "Counting significant figures",
      scene: { type: "sigFigs", raw: "4718", mode: "count" },
      steps: [
        "Here is the number $4718$. How many of these digits count?",
        "The first non-zero digit is the $4$. That is the **1st** significant figure.",
        "The next digit is $7$: the **2nd** significant figure.",
        "Then $1$: the **3rd**.",
        "Then $8$: the **4th**.",
        "Every digit counted.",
      ],
    },
    {
      kind: "anim", category: "concept", title: "The decimal point is not a digit",
      scene: { type: "sigFigs", raw: "3.526", mode: "count" },
      steps: [
        "Now $3.526$. Again, where do we start?",
        "The first non-zero digit is the $3$: the **1st** significant figure.",
        "Then $5$: the **2nd**.",
        "Then $2$: the **3rd**.",
        "Then $6$: the **4th**.",
        "The decimal point does not change where we start or what we count.",
      ],
    },
    {
      kind: "anim", category: "concept", title: "A zero between two digits",
      scene: { type: "sigFigs", raw: "3052", mode: "count" },
      steps: [
        "Now $3052$. There is a zero in the middle. Does it count?",
        "The first non-zero digit is the $3$: the **1st**.",
        "The zero comes after the $3$ and before the $5$. It is between two non-zero digits. We call it a **trapped zero**, and it counts: the **2nd**.",
        "Then $5$: the **3rd**.",
        "Then $2$: the **4th**.",
        "The trapped zero is underlined to show it counts.",
      ],
    },
    {
      kind: "anim", category: "concept", title: "The same with a decimal",
      scene: { type: "sigFigs", raw: "4.0071", mode: "count" },
      steps: [
        "Now $4.0071$. Two zeros this time. Count carefully.",
        "The first non-zero digit is the $4$: the **1st**.",
        "The first zero is between the $4$ and the $7$: trapped, so it counts: the **2nd**.",
        "The second zero is also between the $4$ and the $7$: trapped, so it counts: the **3rd**.",
        "Then $7$: the **4th**.",
        "Then $1$: the **5th**.",
        "Both trapped zeros count.",
      ],
    },
    check("rnd-sfid-point"),
    check("rnd-sfid-trapped"),
    {
      category: "concept", title: "Write this down",
      body: [
        { t: "note", tone: "good", label: "Rule 1", s: "The first significant figure is the first **non-zero** digit.  Example: in $0.0472$ the first is the $4$." },
        { t: "note", tone: "good", label: "Rule 3", s: "**Trapped** zeros (between non-zero digits) always count.  Example: $3052$ has $4$ significant figures." },
        { t: "text", s: "Rules 2 and 4 come next, with the zeros at the start and the end." },
      ],
    },
    {
      category: "concept", title: "Now practise it",
      body: [
        { t: "text", s: "Name the 1st, 2nd or 3rd significant figure. Choose where to go next." },
        {
          t: "handoff",
          buttons: [
            { label: "Practise it (Whiteboard)", to: { tool: "identifySf", step: { kind: "whiteboard", level: "level1", ms: L1_MS } } },
            { label: "Set it (Worksheet)", to: { tool: "identifySf", step: { kind: "worksheet", level: "level1", n: 10, cols: 2, ms: L1_MS } } },
            { label: "Reason about it (Depth)", to: { tool: "identifySf", step: { kind: "depth", level: "level1", item: "rnd-sfid-four-digits", ms: L1_MS } } },
          ],
        },
      ],
    },
  ],
};

const ZEROS: TeachLesson = {
  id: "sf-zeros",
  title: "Zeros at the start and the end",
  summary: "Leading, trapped and trailing zeros: the before / after routine for each, and the four rules to write down.",
  tool: "identifySf",
  slides: [
    {
      category: "concept", title: "Two ways to write a length",
      body: [
        { t: "text", s: "Ruby measures a pencil and writes **12 cm**. Kofi measures the same pencil and writes **12.00 cm**." },
        { t: "text", s: "Are they saying the same thing?" },
      ],
      reveal: [
        { t: "text", s: "Kofi measured to the nearest **hundredth** of a centimetre. His zeros are not empty: they say how accurate he was." },
        { t: "note", tone: "plain", label: "So", s: "Some zeros **count** and some do not. We need a way to tell which." },
      ],
      revealLabel: "Reveal",
    },
    {
      category: "concept", title: "Three kinds of zero",
      body: [
        { t: "note", tone: "plain", label: "Leading", s: "No non-zero digit **before** it, as in $0.00472$." },
        { t: "note", tone: "plain", label: "Trapped", s: "A non-zero digit **before** it and one **after** it, as in $3052$." },
        { t: "note", tone: "plain", label: "Trailing", s: "No non-zero digit **after** it, as in $120.00$ or $1200$." },
      ],
      reveal: [{ t: "text", s: "For every zero, ask: **what comes before it, and what comes after it?**" }],
      revealLabel: "The question",
    },
    {
      kind: "anim", category: "concept", title: "Leading and trapped zeros",
      scene: { type: "sigFigs", raw: "0.00305", mode: "kinds" },
      steps: [
        "Here is $0.00305$. The non-zero digits $3$ and $5$ always count. What about the zeros?",
        "The zeros at the start have no non-zero digit before them. They are **leading** zeros. They only hold the place of the $3$, so they do not count.",
        "The zero between the $3$ and the $5$ is **trapped**. It counts.",
        "Add them up: the $3$, the trapped $0$ and the $5$.",
      ],
    },
    {
      kind: "anim", category: "concept", title: "The routine: a leading zero",
      scene: { type: "sigFigs", raw: "0.0472", mode: "routine", zero: 1 },
      steps: [
        "Take this zero in $0.0472$. We ask three questions, in order.",
        "Question 1: is there a non-zero digit **before** me? The digits before it are outlined.",
        "There is none. So it is a **leading** zero, and it does not count. We stop here.",
      ],
    },
    {
      kind: "anim", category: "concept", title: "The routine: a trapped zero",
      scene: { type: "sigFigs", raw: "3052", mode: "routine", zero: 1 },
      steps: [
        "Now this zero in $3052$.",
        "Question 1: is there a non-zero digit **before** me? The digits before it are outlined.",
        "Yes, the $3$. So it is not a leading zero.",
        "Question 2: is there a non-zero digit **after** me? The digits after it are outlined.",
        "Yes, the $5$ and the $2$. So it is **trapped**, and it counts.",
      ],
    },
    {
      kind: "anim", category: "concept", title: "The routine: a trailing zero with a decimal point",
      scene: { type: "sigFigs", raw: "120.00", mode: "routine", zero: 3 },
      steps: [
        "Now this zero in $120.00$.",
        "Question 1: is there a non-zero digit **before** me?",
        "Yes, the $1$ and the $2$. So it is not leading.",
        "Question 2: is there a non-zero digit **after** me?",
        "No: only zeros come after it. So it is a **trailing** zero.",
        "Question 3: does the number have a decimal point?",
        "Yes. So this trailing zero **counts**.",
      ],
    },
    {
      kind: "anim", category: "concept", title: "The routine: a trailing zero with no decimal point",
      scene: { type: "sigFigs", raw: "1200", mode: "routine", zero: 2 },
      steps: [
        "Now this zero in $1200$.",
        "Question 1: is there a non-zero digit **before** me?",
        "Yes, the $1$ and the $2$. So it is not leading.",
        "Question 2: is there a non-zero digit **after** me?",
        "No: only another zero comes after it. So it is a **trailing** zero.",
        "Question 3: does the number have a decimal point?",
        "No. So this trailing zero does **not** count. $1200$ has only **2** significant figures.",
      ],
    },
    {
      kind: "anim", category: "concept", title: "Trailing zeros after a decimal point",
      scene: { type: "sigFigs", raw: "0.0450", mode: "kinds" },
      steps: [
        "Here is $0.0450$. The non-zero digits $4$ and $5$ count.",
        "The zeros at the start are **leading**: they do not count.",
        "The zero at the end is **trailing**, and the number has a decimal point, so it **counts**.",
        "Add them up: the $4$, the $5$ and the trailing $0$.",
      ],
    },
    {
      kind: "anim", category: "concept", title: "Trailing zeros in a whole number",
      scene: { type: "sigFigs", raw: "45000", mode: "kinds" },
      steps: [
        "Here is $45000$. The non-zero digits $4$ and $5$ count.",
        "The zeros at the end are **trailing**, and there is no decimal point, so they do **not** count. They only hold place value.",
        "Only the $4$ and the $5$ count.",
      ],
    },
    check("rnd-sfid-leading-zeros"),
    check("rnd-sfid-trailing"),
    check("rnd-sfid-1200"),
    {
      category: "concept", title: "Write this down",
      body: [
        { t: "note", tone: "good", label: "Rule 1", s: "The first significant figure is the first **non-zero** digit.  *Example: in $0.0472$ the first is the $4$.*" },
        { t: "note", tone: "good", label: "Rule 2", s: "**Leading** zeros (before the first non-zero digit) never count.  *Example: $0.0472$ has $3$ s.f.*" },
        { t: "note", tone: "good", label: "Rule 3", s: "**Trapped** zeros (between non-zero digits) always count.  *Example: $3052$ has $4$ s.f.*" },
        { t: "note", tone: "good", label: "Rule 4", s: "**Trailing** zeros (after the last non-zero digit) count **only if the number has a decimal point**.  *Examples: $120.00$ has $5$ s.f., $1200$ has $2$.*" },
      ],
    },
    {
      category: "concept", title: "The routine for any zero",
      body: [
        { t: "note", tone: "plain", label: "1", s: "Is there a non-zero digit **before** me? **No**: I am **leading**. I do not count." },
        { t: "note", tone: "plain", label: "2", s: "Is there a non-zero digit **after** me? **Yes**: I am **trapped**. I count." },
        { t: "note", tone: "plain", label: "3", s: "Neither? I am **trailing**. Does the number have a decimal point? **Yes**: I count. **No**: I do not." },
      ],
    },
    {
      category: "concept", title: "Now practise it",
      body: [
        { t: "text", s: "Leading and trailing zeros, with all three tasks. Choose where to go next." },
        {
          t: "handoff",
          buttons: [
            { label: "Practise it (Whiteboard)", to: { tool: "identifySf", step: { kind: "whiteboard", level: "level2", ms: L2_MS } } },
            { label: "Set it (Worksheet)", to: { tool: "identifySf", step: { kind: "worksheet", level: "level2", n: 12, cols: 2, ms: L2_MS } } },
            { label: "Reason about it (Depth)", to: { tool: "identifySf", step: { kind: "depth", level: "level2", item: "rnd-sfid-zero-always", ms: L2_MS } } },
          ],
        },
      ],
    },
  ],
};

export const TEACH_LESSONS: TeachLesson[] = [START, ZEROS];
