// Shared slide pieces and the look of a built deck: the things every deck needs and that were being rebuilt by hand, and tuned by trial and error,
// each time (hint lines, factor-pair tables, a two-number model, plain book work, full-width whiteboards, a one-row exit ticket).
// Decks import them from "/src/decks/builder" (`S.whiteboard`, `S.plainBook`, `S.exitRows`, `S.pairModel`, `quiet`, `hintLine`, `mathsStack`, `mathsGrid`).
// The numbers below are what worked on a projector (Harry's decisions, 2026-11-14); change them here, not in a deck.
import { bookWorkSlide, gridSlide, skillSlide } from "./layouts";
import type { CuratedQuestion, DeckElement, Slide } from "./types";

export const LOOK = {
  ink: "#0f172a", grey: "#64748b", green: "#15803d", red: "#b91c1c", blue: "#1e3a8a",
  /** The player centres an open question whose text is shorter than this many characters; a longer one is left-aligned. */
  centreLimit: 170,
  /** Largest text of a whiteboard question: it must also fit the narrower view that opens beside the working. */
  whiteboardSize: 56,
  /** A table under a whiteboard question reads smaller than a sentence, so its cap is a little higher. */
  whiteboardTableSize: 60,
  /** Fixed size of a plain book-work number (it is drawn at 0.7 of this): big enough to read from the back, small enough for a hint line under it. */
  bookSize: 100,
  /** Inset of the full-width question area: the hidden working panel rests just outside it, so a smaller inset trips the layout check. */
  inset: 48,
  /** Where a slide title sits, so the same kind of slide has its title in the same place from one slide to the next. */
  title: { x: 100, y: 60, w: 1400, h: 100, size: 64 },
  subtitle: { y: 165, h: 60, size: 40 },
} as const;

type NoId<T> = T extends unknown ? Omit<T, "id"> : never;
export type Els = NoId<DeckElement>[];

/** A slide whose elements get stable ids inside it. */
export const makeSlide = (id: string, family: Slide["family"], title: string, els: Els, brief?: string): Slide =>
  ({ id, family, title, ...(brief ? { brief } : {}), els: els.map((e, i) => ({ ...e, id: `${id}-${i + 1}` }) as DeckElement) });

export const textEl = (x: number, y: number, w: number, h: number, text: string, size: number, more: Record<string, unknown> = {}) =>
  ({ kind: "text", x, y, w, h, text, size, colour: LOOK.ink, ...more }) as NoId<DeckElement>;
export const lineEl = (x: number, y: number, w: number, h: number, more: Record<string, unknown> = {}) =>
  ({ kind: "line", x, y, w, h, colour: "#cbd5e1", width: 4, ...more }) as NoId<DeckElement>;

/** The title (and an optional one-line prompt under it) in the standard place. */
export const titleEls = (title: string, subtitle = ""): Els => [
  textEl(LOOK.title.x, LOOK.title.y, LOOK.title.w, LOOK.title.h, title, LOOK.title.size, { bold: true }),
  ...(subtitle ? [textEl(LOOK.title.x, LOOK.subtitle.y, LOOK.title.w, LOOK.subtitle.h, subtitle, LOOK.subtitle.size, { colour: LOOK.grey })] : []),
];

// ---------- maths strings (KaTeX, inline) ----------
/** A quiet note: small and grey, for a hint under a number or a pair count beside one. Written as maths so it can sit on the same line. */
export const quiet = (text: string, size: "tiny" | "scriptsize" | "small" = "scriptsize") =>
  `\\textcolor{${LOOK.grey}}{\\${size}\\text{${text.replace(/&/g, "\\&")}}}`;
/** A hint line under a number in book work: tiny and grey, subtle on purpose. */
export const hintLine = (text: string) => `$${quiet(text, "tiny")}$`;
/** Bold green, to mark the numbers a worked answer is about (for example the common factors). */
export const green = (x: string | number) => `\\textcolor{${LOOK.green}}{\\mathbf{${x}}}`;

/** Rows lined up in columns (first column right-aligned, last left-aligned, the rest centred): one pair to a line, such as `1 × 48`. */
export const mathsStack = (rows: (string | number)[][]) => {
  const n = Math.max(...rows.map((r) => r.length));
  const spec = Array.from({ length: n }, (_, i) => (i === 0 ? "r" : i === n - 1 ? "l" : "c")).join("");
  return `$\\begin{array}{${spec}}${rows.map((r) => r.join("&")).join("\\\\")}\\end{array}$`;
};
/** Columns side by side with a heading each and a rule under the headings, a divider between columns: the two numbers sit on one line, their pairs underneath.
 *  Tight spacing keeps a question short enough to be centred; `roomy` (both sides of every cell) suits a worked answer, which has no length limit. */
export const mathsGrid = (heads: (string | number)[], cols: (string | number)[][], o: { roomy?: boolean } = {}) => {
  const rows = Math.max(...cols.map((c) => c.length));
  const pad = (s: string | number, i: number) => (o.roomy ? `\\; ${s} \\;` : cols.length === 2 ? (i === 0 ? `${s}\\;` : `\\;${s}`) : String(s));
  const body = Array.from({ length: rows }, (_, r) => cols.map((c, i) => (c[r] === undefined ? "" : pad(c[r], i))).join("&")).join("\\\\");
  const head = heads.map((h, i) => (o.roomy ? pad(`\\mathbf{${h}}`, i) : `\\mathbf{${h}}`)).join("&");
  return `$\\begin{array}{${cols.map(() => "c").join("|")}}${head}\\\\\\hline ${body}\\end{array}$`;
};

/** A question's text is centred by the player only while it is short; a build script asserts this for every whiteboard question. */
export const fitsCentred = (lines: string[]) => lines.join("").length < LOOK.centreLimit;
export const assertCentred = (lines: string[], what: string) => {
  if (!fitsCentred(lines)) throw new Error(`${what}: the question is ${lines.join("").length} characters, over the ${LOOK.centreLimit} the player centres; shorten it or split the working`);
};

// ---------- slides ----------
/** Whiteboard questions: full-width (question fills the slide, the working unfolds beside it), inset, at the standard size. In the Teach family, as the other whiteboards are. */
export const whiteboardQuestionsSlide = (id: string, title: string, items: CuratedQuestion[], brief?: string, o: { table?: boolean; size?: number } = {}): Slide => {
  const s = skillSlide(id, title, items);
  const size = o.size ?? (o.table ? LOOK.whiteboardTableSize : LOOK.whiteboardSize);
  return {
    ...s, family: "teach", ...(brief ? { brief } : {}),
    els: s.els.map((e) => (e.kind === "questions" ? { ...e, x: LOOK.inset, y: 24, w: 1600 - 2 * LOOK.inset, h: 852, visualiser: false, size } : e)) as DeckElement[],
  };
};

/** Book work as plain numbers: the instruction once at the top, each cell just the number(s), big and centred, with an optional small grey hint under it. */
export const plainBookSlide = (id: string, items: CuratedQuestion[], cols: number, instruction: string, title: string): Slide => {
  const s = bookWorkSlide(id, items, cols, instruction, title);
  return { ...s, els: s.els.map((e) => (e.kind === "grid" ? { ...e, align: "center", fixed: true, size: LOOK.bookSize } : e)) as DeckElement[] };
};

/** An exit ticket with one question to a row, so each reads on a single line (three narrow columns wrapped a number onto its own line). */
export const exitRowsSlide = (id: string, items: CuratedQuestion[], subtitle = "Work on your own."): Slide => {
  const s = gridSlide(id, "Exit ticket", [], 1, "retrieval", subtitle);
  return { ...s, els: s.els.map((e) => (e.kind === "grid" ? { ...e, items } : e)) as DeckElement[] };
};

/** One column of a two-number model: a number as the heading and its pairs under it, one pair to a line. */
export interface PairColumn { head: string | number; pairs: [number | string, number | string][] }
const ROW = 95;
/** The two columns, side by side, as ordinary elements. Click `stepBase` shows the left column, `stepBase + 1` the right, `stepBase + 2` rings every value in `ring`. */
export const pairColumnEls = (cols: [PairColumn, PairColumn], y0: number, stepBase: number, ring: (number | string)[]): Els => {
  const els: Els = [];
  cols.forEach((col, k) => {
    const cx = k === 0 ? 440 : 1160, step = stepBase + k;
    els.push(textEl(cx - 260, y0, 520, 90, String(col.head), 76, { bold: true, align: "center", middle: true, step }));
    els.push(lineEl(cx - 250, y0 + 95, 500, 0, { step }));
    col.pairs.forEach(([left, right], i) => {
      const y = y0 + 115 + i * ROW;
      ([[left, cx - 160], [right, cx + 30]] as const).forEach(([v, x]) => {
        els.push(textEl(x, y, 130, 80, String(v), 60, { align: "center", middle: true, step }));
        if (ring.includes(v)) els.push({ kind: "shape", shape: "ellipse", x: x + 8, y: y + 4, w: 114, h: 72, stroke: LOOK.green, strokeWidth: 6, step: stepBase + 2 } as NoId<DeckElement>);
      });
      els.push(textEl(cx - 25, y, 50, 80, "×", 52, { align: "center", middle: true, colour: LOOK.grey, step }));
    });
  });
  els.push(lineEl(800, y0, 0, 115 + Math.max(cols[0].pairs.length, cols[1].pairs.length) * ROW - 10));
  return els;
};
export interface Footer { text: string; size?: number; bold?: boolean; colour?: string; step: number }
/** A two-number model slide: title, prompt, the two columns, then footer lines (for example "Common factors: 1, 2, 3, 6") revealed by click. */
export const pairModelSlide = (id: string, title: string, subtitle: string, cols: [PairColumn, PairColumn], ring: (number | string)[], footers: Footer[], brief?: string): Slide => {
  const y0 = 250, rows = Math.max(cols[0].pairs.length, cols[1].pairs.length), base = y0 + 115 + rows * ROW + 25;
  return makeSlide(id, "teach", title, [
    ...titleEls(title, subtitle),
    ...pairColumnEls(cols, y0, 1, ring),
    ...footers.map((f, i) => textEl(100, base + i * 105, 1400, 90, f.text, f.size ?? 48, { align: "center", middle: true, bold: f.bold, colour: f.colour ?? LOOK.ink, step: f.step })),
  ], brief);
};
