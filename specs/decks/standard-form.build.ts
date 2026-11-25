// Build script for the "Standard form 1: why we use it, and converting" deck (plan: specs/decks/standard-form-converting.md).
// The numbers are in specs/decks/_check/standard-form-converting.json, which specs/decks/_check/standard-form-converting-check.py checks by a
// different route; this script also recomputes every answer from the ordinary number before it builds.
//   npm run deck -- looks  specs/decks/standard-form.build.ts      the look card
//   npm run deck -- build  specs/decks/standard-form.build.ts --replace
//   npm run deck -- review standard-form
import { LOOK, Q, S, assertCentred, green, hintLine, lineEl, makeSlide, textEl, titleEls } from "/src/decks/builder";
import type { CuratedQuestion, DeckElement, Slide } from "/src/decks/types";
import DATA from "./_check/standard-form-converting.json";

const ID = "standard-form";
const P = "sf";
const T = ID;
const { grey, green: GREEN, blue: BLUE } = LOOK;
const must = (ok: boolean, msg: string) => { if (!ok) throw new Error(`plan check failed: ${msg}`); };

// ---------- exact decimal strings (no floating point): a value is `d` x 10^-s, `d` with no leading zeros ----------
interface Dec { d: string; s: number }
const parse = (x: string): Dec => { const [i, f = ""] = x.split("."); return { d: (i + f).replace(/^0+/, "") || "0", s: f.length }; };
const plain = (v: Dec): string => {
  if (v.s <= 0) return v.d + "0".repeat(-v.s);
  if (v.d.length > v.s) return `${v.d.slice(0, -v.s)}.${v.d.slice(-v.s)}`;
  return `0.${"0".repeat(v.s - v.d.length)}${v.d}`;
};
/** The value over ten, written without a trailing zero after the point (240 -> 24, 24 -> 2.4). */
const over10 = (x: string): string => { let { d, s } = parse(x); s += 1; while (s > 0 && d.endsWith("0")) { d = d.slice(0, -1); s -= 1; } return plain({ d, s }); };
/** Standard form of an ordinary number: coefficient string, power and the significant digits. */
const stdOf = (ord: string) => {
  const v = parse(ord);
  const dg = v.d.replace(/0+$/, "") || "0";
  return { c: dg.length > 1 ? `${dg[0]}.${dg.slice(1)}` : dg, p: v.d.length - 1 - v.s, dg };
};

/** Digits printed in groups of three (thin space) so the zeros can be counted; the decimals too, if GROUP_DECIMALS (a question for the look card). */
const GROUP_DECIMALS = false;
const grp = (s: string): string => {
  const [i, f] = s.split(".");
  const gi = i.length >= 4 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, "\\,") : i;
  if (f === undefined) return gi;
  return `${gi}.${GROUP_DECIMALS ? f.replace(/(\d{3})(?=\d)/g, "$1\\,") : f}`;
};
const pw = (n: number) => `10^{${n}}`;
const ten = (n: number) => (n === 1 ? "10" : pw(n));
const oneOf = (k: number) => grp(`1${"0".repeat(k)}`);
const decimals = (x: string) => (x.split(".")[1] ?? "").length;

// ---------- the data: every answer is recomputed from the ordinary number ----------
type Row = (string | number)[];
interface Item { id: string; dir: "toStd" | "toOrd"; ord: string; c: string; p: number }
interface Parts { id: string; shown: string; sp: number; c: string; p: number }
const toItem = (r: Row): Item => {
  const it: Item = { id: String(r[0]), dir: r[1] as Item["dir"], ord: String(r[2]), c: String(r[3]), p: Number(r[4]) };
  const s = stdOf(it.ord);
  must(s.c === it.c && s.p === it.p, `${it.id}: ${it.ord} is ${s.c} x 10^${s.p}, not ${it.c} x 10^${it.p}`);
  return it;
};
const toParts = (r: Row): Parts => {
  const it: Parts = { id: String(r[0]), shown: String(r[1]), sp: Number(r[2]), c: String(r[3]), p: Number(r[4]) };
  const v = parse(it.shown);
  const value = { d: v.d, s: v.s - it.sp };                       // shown x 10^sp
  const s = stdOf(plain(value));
  must(s.c === it.c && s.p === it.p, `${it.id}: ${it.shown} x 10^${it.sp} is ${s.c} x 10^${s.p}`);
  return it;
};
const ITEMS = new Map((DATA.questions as Row[]).map((r) => [String(r[0]), toItem(r)]));
const PARTS = new Map((DATA.questionParts as Row[]).map((r) => [String(r[0]), toParts(r)]));
const run = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);
const item = (id: string) => ITEMS.get(id) ?? (() => { throw new Error(`no item ${id}`); })();
const parts = (id: string) => PARTS.get(id) ?? (() => { throw new Error(`no parts ${id}`); })();

// ---------- the working: the chain (repeated tens) ----------
/** Large number to standard form, Method 1 (one step): 45 000 = 4.5 x 10 000 = 4.5 x 10^4. */
function chainLargeToStd(it: Item): string[] {
  must(parse(it.ord).d.length - 1 === it.p, `${it.id}: a large whole number`);
  return [`$${grp(it.ord)} = ${it.c} \\times ${oneOf(it.p)}$`, `$= ${it.c} \\times ${pw(it.p)}$`];
}
/** Large standard form to ordinary, Method 1 (one step): 4.3 x 10^3 = 4.3 x 1 000 = 4 300. */
function chainLargeToOrd(it: Item): string[] {
  return [`$${pw(it.p)} = ${oneOf(it.p)}$`, `$${it.c} \\times ${pw(it.p)} = ${it.c} \\times ${oneOf(it.p)}$`, `$= ${grp(it.ord)}$`];
}
/** Method 2 to standard form, one ten at a time: 32 000 = 3 200 x 10 = 320 x 10 x 10 = 32 x 10 x 10 x 10 = 3.2 x 10 x 10 x 10 x 10 = 3.2 x 10^4. */
function tensToStd(it: Item): string[] {
  const tens = (n: number) => Array.from({ length: n }, () => "\\times 10").join(" ");
  const lines: string[] = [];
  let cur = it.ord, n = 0;
  while (Number(cur) >= 10) { cur = over10(cur); n += 1; lines.push(`${lines.length ? "=" : `${grp(it.ord)} =`} ${grp(cur)} ${tens(n)}`); }
  must(cur === it.c && n === it.p, `${it.id}: tens method ends at ${cur} x 10^${n}`);
  lines.push(`= ${it.c} \\times ${pw(it.p)}`);
  return lines;
}
/** Method 2 to ordinary, one ten at a time: 4.3 x 10^3 = 4.3 x 10 x 10 x 10 = 43 x 10 x 10 = 430 x 10 = 4 300. */
function tensToOrd(it: Item): string[] {
  const tens = (n: number) => Array.from({ length: n }, () => "\\times 10").join(" ");
  const lines = [`${it.c} \\times ${pw(it.p)} = ${it.c} ${tens(it.p)}`];
  let cur = it.c;
  for (let n = it.p - 1; n >= 0; n--) {
    const v = parse(cur); cur = plain({ d: v.d, s: v.s - 1 });       // times 10, written out
    lines.push(`= ${grp(cur)} ${tens(n)}`.trimEnd());
  }
  must(cur === it.ord, `${it.id}: tens method ends at ${cur}, not ${it.ord}`);
  return lines;
}
/** Small number to standard form (Harry's route): get the number between 1 and 10 first, then divide by the power of ten.
 *  0.35 = 3.5 / 10 = 3.5 x 1/10 = 3.5 x 10^-1;  0.02 = 2 / 100 = 2 x 1/100 = 2 x 1/10^2 = 2 x 10^-2. */
function smallLines(ord: string, c: string, p: number): string[] {
  const t = -p;
  must(stdOf(ord).c === c && stdOf(ord).p === p, `${ord} is ${stdOf(ord).c} x 10^${stdOf(ord).p}, not ${c} x 10^${p}`);
  // fractions are always stacked (Harry, 2026-11-17); `chainSlide` gives a slide with fractions room so every line keeps the same size
  const lines = [`${ord} = ${c} \\div ${oneOf(t)}`, `= ${c} \\times \\dfrac{1}{${oneOf(t)}}`];
  if (t > 1) lines.push(`= ${c} \\times \\dfrac{1}{${pw(t)}}`);
  lines.push(`= ${c} \\times ${pw(p)}`);
  return lines;
}
function chainSmallToStd(it: Item): string[] {
  return smallLines(it.ord, it.c, it.p).map((l) => `$${l}$`);
}
/** Small standard form to ordinary: 3.7 x 10^-2 = 3.7 x 1/10^2 = 3.7 / 100 = 0.037. */
function chainSmallToOrd(it: Item): string[] {
  const t = -it.p;
  return [`$${pw(it.p)} = \\dfrac{1}{${pw(t)}} = \\dfrac{1}{${oneOf(t)}}$`, `$${it.c} \\times \\dfrac{1}{${oneOf(t)}} = ${it.c} \\div ${oneOf(t)}$`, `$= ${it.ord}$`];
}
const chain = (it: Item) => (it.dir === "toStd" ? (it.p > 0 ? chainLargeToStd(it) : chainSmallToStd(it)) : (it.p > 0 ? chainLargeToOrd(it) : chainSmallToOrd(it)));

/** Numbers in parts: peel a ten at a time (too big), or write the small coefficient as a power of ten (too small). */
function chainParts(x: Parts): string[] {
  const lines: string[] = [];
  const sv = parse(x.shown);
  if (Number(plain({ d: sv.d, s: sv.s })) < 1) {
    const s = stdOf(x.shown), k = -s.p;
    lines.push(`$${x.shown} = ${s.c} \\times ${pw(-k)}$`, `$${x.shown} \\times ${pw(x.sp)} = ${s.c} \\times ${pw(-k)} \\times ${pw(x.sp)}$`, `$= ${x.c} \\times ${pw(x.p)}$`);
    must(x.sp - k === x.p, `${x.id}: small parts power`);
    return lines;
  }
  let cur = x.shown, q = x.sp;
  while (Number(cur) >= 10) {
    const nxt = over10(cur);
    lines.push(`$${cur} = ${nxt} \\times 10$`, `$${cur} \\times ${pw(q)} = ${nxt} \\times 10 \\times ${pw(q)}$`, `$= ${nxt} \\times ${pw(q + 1)}$`);
    cur = nxt; q += 1;
  }
  must(cur === x.c && q === x.p, `${x.id}: parts chain ends at ${cur} x 10^${q}`);
  return lines;
}

// ---------- the working: the place value grid (the second stage) ----------
const NAMES: Record<number, string> = { 9: "B", 8: "HM", 7: "TM", 6: "M", 5: "HTh", 4: "TTh", 3: "Th", 2: "H", 1: "T", 0: "O", [-1]: "t", [-2]: "h", [-3]: "th", [-4]: "tth", [-5]: "hth", [-6]: "mth" };
interface GridPlan { cols: number[]; rows: { cells: Map<number, { t: string; zero: boolean }>; power: number }[] }
/** The number written in the grid one place at a time: the grid's rows, each with the cells it fills and the power beside it. */
function gridPlan(dg: string, p: number, mode: "toStd" | "toOrd"): GridPlan {
  const n = dg.length, sgn = Math.sign(p), steps = Math.abs(p);
  const rows = Array.from({ length: steps + 1 }, (_, r) => {
    const first = mode === "toStd" ? p - sgn * r : sgn * r, power = mode === "toStd" ? sgn * r : p - sgn * r;
    const cells = new Map<number, { t: string; zero: boolean }>();
    for (let j = 0; j < n; j++) cells.set(first - j, { t: dg[j], zero: false });
    for (let q = first + 1; first < 0 && q <= 0; q++) cells.set(q, { t: "0", zero: true });          // zeros between the point and the first digit
    for (let q = first - n; first - n + 1 > 0 && q >= 0; q--) cells.set(q, { t: "0", zero: true });   // zeros that hold the places down to the ones
    return { cells, power };
  });
  const used = rows.flatMap((r) => [...r.cells.keys()]);
  const hi = Math.max(...used), lo = Math.min(...used);
  return { cols: Array.from({ length: hi - lo + 1 }, (_, i) => hi - i), rows };
}

// ---------- the question forms ----------
/** The server only accepts question ids of lowercase letters, digits and hyphens. */
const qid = (id: string) => `${P}-${id.toLowerCase()}`;
// Whiteboard questions carry no help lines or hints (Harry, 2026-11-17: that structure came from another deck and does not help here): an
// instruction, then the number, all at one size. The working is Method 1 throughout; the place value table is a model slide only.
function wbq(id: string): CuratedQuestion {
  const it = item(id);
  const lines = it.dir === "toStd" ? ["Write in standard form:", `$${grp(it.ord)}$`] : ["Write as an ordinary number:", `$${it.c} \\times ${pw(it.p)}$`];
  assertCentred(lines, id);
  const answer = it.dir === "toStd" ? `$${it.c} \\times ${pw(it.p)}$` : `$${grp(it.ord)}$`;
  return {
    ...Q.open(qid(id), T, "level1", lines[0], answer, chain(it)),
    title: it.dir === "toStd" ? `${grp(it.ord)} to standard form` : `${it.c} x 10^${it.p} to ordinary`,
    question: lines,
    rationale: it.dir === "toStd" ? "Write the number as a number between 1 and 10 times a 1 followed by zeros, then as a power of ten (a small number is divided by the power)." : "Write the power of ten out in full, then multiply (or divide) by it.",
  };
}
function partsQ(id: string): CuratedQuestion {
  const x = parts(id);
  const lines = ["Write in standard form:", `$${x.shown} \\times ${pw(x.sp)}$`];
  assertCentred(lines, id);
  return {
    ...Q.open(qid(id), T, "level1", lines[0], `$${x.c} \\times ${pw(x.p)}$`, chainParts(x)),
    title: `${x.shown} x 10^${x.sp} in standard form`, question: lines,
    rationale: "The first number is not between 1 and 10: write it as a number between 1 and 10 times a power of ten, then combine the tens.",
  };
}
const wbRun = (ids: string[]) => ids.map(wbq);
const partsRun = (ids: string[]) => ids.map(partsQ);

// ---------- slide pieces ----------
const t = textEl;
const mathsEl = (x: number, y: number, w: number, h: number, latex: string, size: number, more: Record<string, unknown> = {}) =>
  ({ kind: "maths", x, y, w, h, latex, size, colour: LOOK.ink, align: "left", ...more }) as never;

/** Lines of working built one to a click, each with a small grey note on the right. */
function chainSlide(id: string, title: string, subtitle: string, lines: { tex: string; note?: string; final?: boolean }[], brief: string): Slide {
  // a stacked fraction is taller than a line of text, and an element too short for it shrinks its text: when any line has a fraction,
  // every line on the slide gets the taller box and the same size, so the fonts match
  const roomy = lines.some((l) => l.tex.includes("dfrac")), pitch = roomy ? 150 : 118, size = roomy ? 48 : 62;
  return makeSlide(id, "teach", title, [
    ...titleEls(title, subtitle),
    ...lines.flatMap((l, i) => [
      mathsEl(100, 240 + i * pitch, 1000, pitch - 2, l.tex, size, { fixed: true, step: i + 1, ...(l.final ? { colour: GREEN } : {}) }),
      ...(l.note ? [t(1130, (l.note.includes("dfrac") ? 235 : 260) + i * pitch, 410, l.note.includes("dfrac") ? 140 : 96, l.note, 36, { fixed: true, colour: grey, step: i + 1, middle: true })] : []),
    ]),
  ], brief);
}

/** The bridge: the number written in the place value grid and moved one place per click, the power beside it. The point never moves. */
function bridgeSlide(id: string, title: string, subtitle: string, it: Item, brief: string): Slide {
  const { dg } = stdOf(it.ord), plan = gridPlan(dg, it.p, it.dir);
  const rowH = plan.rows.length > 5 ? 76 : 90;                    // six rows (five moves) need tighter rows to leave room for the rule underneath
  const cell = 140, W = plan.cols.length * cell, x0 = 400, px = x0 + W + 40;
  const down = (it.dir === "toStd") === (it.p > 0);
  const els: NoIdEls = [...titleEls(title, subtitle)];
  plan.cols.forEach((q, i) => {
    els.push(t(x0 + i * cell, 232, cell, 48, NAMES[q], 40, { bold: true, align: "center" }));
    els.push(t(x0 + i * cell, 280, cell, 40, `$${pw(q)}$`, 30, { colour: grey, align: "center" }));
  });
  els.push(lineEl(x0, 326, W, 0));
  els.push(t(px, 232, 300, 48, "Power", 40, { bold: true, colour: grey }));
  const point = plan.cols.indexOf(0);
  if (plan.cols.includes(-1)) els.push(lineEl(x0 + (point + 1) * cell, 238, 0, 80 + plan.rows.length * rowH, { colour: "#94a3b8" }));
  const last = plan.rows.length - 1;
  plan.rows.forEach((r, i) => {
    const y = 345 + i * rowH, step = i + 1;
    plan.cols.forEach((q, j) => {
      const c = r.cells.get(q);
      if (c) els.push(t(x0 + j * cell, y, cell, rowH - 10, c.t, rowH < 90 ? 54 : 64, { bold: !c.zero, align: "center", middle: true, colour: c.zero ? "#94a3b8" : i === last ? GREEN : LOOK.ink, step }));
    });
    els.push(t(px, y, 320, rowH - 10, `$\\times ${pw(r.power)}$`, 56, { middle: true, colour: i === last ? GREEN : LOOK.ink, bold: i === last, step }));
    els.push(t(40, y, x0 - 60, rowH - 10, i === 0 ? "Start" : `${down ? "down" : "up"} 1 place: power ${down ? "up" : "down"} 1`, 34, { colour: grey, middle: true, align: "right", step }));
  });
  els.push(t(100, 825, 1400, 60, "Down one place: the power goes up by 1. Up one place: the power goes down by 1.", 42, { bold: true, colour: BLUE, align: "center", middle: true, step: plan.rows.length + 1 }));
  return makeSlide(id, "teach", title, els, brief);
}
type NoIdEls = Parameters<typeof makeSlide>[3];

// ---------- the printed sheets (textbook layout, like the Corbett Maths sheet; pupils write in their books) ----------
interface SheetData { id: string; title: string; blocks: { dir: "toStd" | "toOrd"; instruction: string; items: Row[] }[] }
const sheetSlide = (n: number): Slide => {
  const data = (DATA.sheets as unknown as SheetData[]).find((s) => s.id === String(n));
  must(!!data, `no sheet ${n}`);
  const blocks = data!.blocks.map((b, bi) => {
    const its = b.items.map((r, i) => toItem([`${n}.${bi + 1}${i}`, b.dir, ...r]));       // every part is checked against its ordinary number
    return {
      instruction: b.instruction,
      parts: its.map((it) => (it.dir === "toStd" ? grp(it.ord) : `${it.c} \\times ${pw(it.p)}`)),
      answers: its.map((it) => (it.dir === "toStd" ? `${it.c} \\times ${pw(it.p)}` : grp(it.ord))),
    };
  });
  return S.textbookSheet(`${P}-sheet-${n}`, { title: data!.title, note: "Write your answers in your book. Show your working.", blocks }, T);
};

/** Book work: twelve numbers in parts (a to l), in the textbook layout, answers on a click. Every part is checked by toParts. */
const partsSheet = (): Slide => {
  const xs = run("SB", 12).map(parts);
  return S.textbookSheet(`${P}-sheet-parts`, { title: "Standard Form: Numbers in parts", note: "Write your answers in your book. Show your working.",
    cols: 3, blocks: [{ instruction: "Write each of the following in standard form.", parts: xs.map((x) => `${x.shown} \\times ${pw(x.sp)}`), answers: xs.map((x) => `${x.c} \\times ${pw(x.p)}`) }] }, T);
};

// ---------- the worked slides ----------
const hook = makeSlide(`${P}-hook`, "teach", "Say each number aloud", [
  ...titleEls("Say each number aloud", "Tell your partner how many zeros you counted, and how sure you are."),
  t(100, 270, 1400, 50, "How far Earth is from the Sun (km)", 36, { colour: grey, step: 1 }),
  t(100, 320, 1400, 110, "150 000 000", 84, { bold: true, step: 1 }),
  t(100, 470, 1400, 50, "The width of a red blood cell (m)", 36, { colour: grey, step: 2 }),
  t(100, 520, 1400, 110, "0.000007", 84, { bold: true, step: 2 }),
  t(100, 670, 1400, 50, "The mass of a hydrogen atom (kg)", 36, { colour: grey, step: 3 }),
  t(100, 720, 1500, 110, "0.00000000000000000000000000167", 72, { bold: true, step: 3 }),
], "Let the class struggle with the last one: that is the point. How many zeros did they count, and how sure are they?");
const hookReveal = makeSlide(`${P}-hook-reveal`, "teach", "The same numbers", [
  ...titleEls("The same numbers", "Short, and the size is easy to see."),
  t(100, 270, 700, 100, "150 000 000", 56, { step: 1 }), mathsEl(900, 270, 600, 100, "1.5 \\times 10^{8}", 72, { bold: true, colour: GREEN, step: 1 }),
  t(100, 450, 700, 100, "0.000007", 56, { step: 2 }), mathsEl(900, 450, 600, 100, "7 \\times 10^{-6}", 72, { bold: true, colour: GREEN, step: 2 }),
  t(100, 630, 800, 100, "0.00000000000000000000000000167", 34, { step: 3, middle: true }), mathsEl(900, 630, 700, 100, "1.67 \\times 10^{-27}", 72, { bold: true, colour: GREEN, step: 3 }),
]);
const reasons = makeSlide(`${P}-reasons`, "teach", "Why use standard form?", [
  ...titleEls("Why use standard form?"),
  t(100, 250, 1400, 110, "1.  It is short to write.", 60, { bold: true, step: 1 }),
  t(100, 410, 1400, 110, "2.  It is hard to miscount: no rows of zeros.", 60, { bold: true, step: 2 }),
  t(100, 570, 1400, 110, "3.  The power shows the size at a glance.", 60, { bold: true, step: 3 }),
  t(100, 740, 1400, 90, "Your calculator switches to it when the answer will not fit on the screen.", 40, { colour: grey, step: 4 }),
]);
const isItStd = makeSlide(`${P}-is-it`, "discussion", "Is it in standard form?", [
  ...titleEls("Is it in standard form?", "Yes or no, and why."),
  ...([
    ["3.8 \\times 10^{5}", "Yes", "$1 \\le 3.8 < 10$", true],
    ["38 \\times 10^{4}", "No", "$38 \\ge 10$", false],
    ["0.38 \\times 10^{6}", "No", "$0.38 < 1$", false],
    ["9.99 \\times 10^{-3}", "Yes", "$1 \\le 9.99 < 10$, and the power can be negative", true],
  ] as [string, string, string, boolean][]).flatMap(([tex, verdict, why, ok], i) => [
    mathsEl(100, 260 + i * 150, 700, 110, tex, 68, { step: 2 * i + 1 }),
    t(850, 270 + i * 150, 170, 100, verdict, 60, { bold: true, colour: ok ? GREEN : "#b91c1c", middle: true, step: 2 * i + 2 }),
    t(1030, 270 + i * 150, 500, 100, why, 34, { colour: grey, middle: true, step: 2 * i + 2 }),
  ]),
], "Each row: the class decides, then the verdict and the reason appear.");

/** Two methods side by side for the same number. Method 1 (one ten at a time) is the scaffold and comes first, on the left; Method 2 (in one step)
 *  is where we lean them, on the right (Harry, 2026-11-17). Lines appear one to a click, Method 1 first. */
function twoMethodsSlide(id: string, title: string, subtitle: string, tens: string[], oneStep: string[], brief: string): Slide {
  const els: NoIdEls = [...titleEls(title, subtitle)];
  els.push(t(60, 232, 860, 56, "Method 1", 44, { bold: true, colour: BLUE }), t(60, 288, 860, 44, "one ten at a time", 32, { colour: grey }));
  els.push(t(980, 232, 580, 56, "Method 2", 44, { bold: true, colour: BLUE }), t(980, 288, 580, 44, "in one step", 32, { colour: grey }));
  els.push(lineEl(940, 232, 0, 640));
  const last = (n: number, i: number) => i === n - 1;
  const pitch = Math.min(100, Math.floor(520 / tens.length));
  tens.forEach((tex, i) => els.push(mathsEl(60, 350 + i * pitch, 860, pitch - 4, tex, 46, { step: i + 1, ...(last(tens.length, i) ? { colour: GREEN } : {}) })));
  oneStep.forEach((tex, i) => els.push(mathsEl(980, 350 + i * 110, 580, 100, tex, 56, { step: tens.length + i + 1, ...(last(oneStep.length, i) ? { colour: GREEN } : {}) })));
  return makeSlide(id, "teach", title, els, brief);
}
const methodsToStd = (id: string, ord: string, c: string, p: number, brief: string) => {
  const it: Item = { id, dir: "toStd", ord, c, p };
  return twoMethodsSlide(`${P}-${id}`, "Large numbers: two methods", `Write ${grp(ord).replace("\\,", " ")} in standard form.`, tensToStd(it), chainLargeToStd(it).map((l) => l.replace(/^\$|\$$/g, "")), brief);
};
const methodsToOrd = (id: string, ord: string, c: string, p: number, brief: string) => {
  const it: Item = { id, dir: "toOrd", ord, c, p };
  return twoMethodsSlide(`${P}-${id}`, "Back again: two methods", `Write ${c} × 10${"⁰¹²³⁴⁵⁶⁷⁸⁹"[p] ?? `^${p}`} as an ordinary number.`, tensToOrd(it), [`${c} \\times ${pw(p)} = ${c} \\times ${oneOf(p)}`, `= ${grp(ord)}`], brief);
};
const toStd1 = methodsToStd("m-32000", "32000", "3.2", 4, "Both methods on the same number. Method 1 (the scaffold): peel off a ten at a time until the first number is between 1 and 10, then count the tens. Method 2 (where we lean them): 3.2 times what makes 32 000? 10 000, which is 10⁴.");
const toStd2 = methodsToStd("m-8500", "8500", "8.5", 3, "The same two methods on a second number: fewer tens to peel.");
const toStd3 = methodsToStd("m-190000", "190000", "1.9", 5, "A third example, with five tens to count.");
const toOrd1 = methodsToOrd("m-4300", "4300", "4.3", 3, "The two methods read the other way. Method 1 (the scaffold): each ten multiplies the number by 10 in turn. Method 2 (where we lean them): 10³ = 1 000, so multiply 4.3 by 1 000.");
const toOrd2 = methodsToOrd("m-57000", "57000", "5.7", 4, "A second example going back.");
const toOrd3 = methodsToOrd("m-790000", "790000", "7.9", 5, "A third example, with five tens.");
const partsDisc = S.discuss(`${P}-parts-disc`, "Is $25 \\times 10^{6}$ in standard form?",
  "No. 25 is not between 1 and 10. $25 = 2.5 \\times 10$, so we can take a ten out and add it to the power.", "Write $25 \\times 10^{6}$ in standard form.", "2.5 \\times 10^{7}");

/** A small number in standard form: get the first number between 1 and 10 first, then divide by the power of ten (the lines come from `smallLines`). */
const smallSlide = (id: string, title: string, ord: string, c: string, p: number, notes: (string | undefined)[], brief: string) =>
  chainSlide(`${P}-${id}`, title, `Write ${ord} in standard form.`, smallLines(ord, c, p).map((tex, i, all) => ({ tex, note: notes[i], final: i === all.length - 1 })), brief);
const small1 = smallSlide("small1", "Small numbers: divide by tens", "0.02", "2", -2, ["two hundredths", undefined, undefined, "$\\dfrac{1}{10^{2}} = 10^{-2}$, from the laws of indices"],
  "Model 1: a decimal is a number between 1 and 10 divided by a power of ten, and the laws of indices turn the division into a negative power.");
const small2 = smallSlide("small2", "Get it between 1 and 10 first", "0.35", "3.5", -1, ["3.5 is between 1 and 10, and 3.5 ÷ 10 = 0.35"],
  "Model 2: two digits. Write the digits as a number between 1 and 10 (3.5) and divide by 10, rather than 35 ÷ 100 and then fixing it.");
const small3 = smallSlide("small3", "More zeros", "0.00058", "5.8", -4, ["5.8 first, then divide by 10 000"],
  "Model 3: five decimal places but the power is -4. The power is not the number of zeros: it is how many tens we divide 5.8 by.");
const small4 = S.discuss(`${P}-small4`, "$0.02 = 2 \\times 10^{-2}$. Why is the power negative?",
  "We divided by tens, so the number is smaller than 1. A number smaller than 1 has a negative power.", "What is $2 \\times 10^{2}$?", "200");
const smallBack1 = chainSlide(`${P}-small-back1`, "Small numbers, back again", "Write 1.6 × 10⁻² as an ordinary number.", [
  { tex: "10^{-2} = \\dfrac{1}{10^{2}} = \\dfrac{1}{100}", note: "a negative power is one over the power" },
  { tex: "1.6 \\times 10^{-2} = 1.6 \\times \\dfrac{1}{100}" },
  { tex: "= 1.6 \\div 100" },
  { tex: "= 0.016", final: true },
], "Reverse of model 1: a negative power means divide by that power of ten.");
const smallBack2 = chainSlide(`${P}-small-back2`, "Small numbers, back again", "Write 3.7 × 10⁻³ as an ordinary number.", [
  { tex: "10^{-3} = \\dfrac{1}{10^{3}} = \\dfrac{1}{1\\,000}" },
  { tex: "3.7 \\times 10^{-3} = 3.7 \\div 1\\,000" },
  { tex: "= 0.0037", final: true },
], "A second reversed model, with three decimal places.");
const smallParts = chainSlide(`${P}-small-parts`, "A first number that is too small", "Write 0.8 × 10³ in standard form.", [
  { tex: "0.8 = 8 \\times 10^{-1}", note: "0.8 = 8 ÷ 10, as in 0.02 = 2 ÷ 100" },
  { tex: "0.8 \\times 10^{3} = 8 \\times 10^{-1} \\times 10^{3}" },
  { tex: "= 8 \\times 10^{2}", final: true, note: "add the powers: -1 + 3 = 2" },
], "Numbers in parts, small: a first number below 1 is written as a power of ten with the small-number idea, then the powers are added.");
const retrieval = S.quick(`${P}-index-recap`, "Laws of indices: four quick ones", [
  Q.open(`${P}-rec-1`, T, "level1", "Write $\\dfrac{1}{10^{2}}$ as a power of 10.", "$10^{-2}$", ["$\\dfrac{1}{10^{2}} = 10^{-2}$"]),
  Q.open(`${P}-rec-2`, T, "level1", "Write $\\dfrac{1}{10^{4}}$ as a power of 10.", "$10^{-4}$", ["$\\dfrac{1}{10^{4}} = 10^{-4}$"]),
  Q.open(`${P}-rec-3`, T, "level1", "Write $\\dfrac{1}{10}$ as a power of 10.", "$10^{-1}$", ["$\\dfrac{1}{10} = \\dfrac{1}{10^{1}} = 10^{-1}$"]),
  Q.open(`${P}-rec-4`, T, "level1", "Write $10^{-3}$ as a fraction.", "$\\dfrac{1}{1\\,000}$", ["$10^{-3} = \\dfrac{1}{10^{3}} = \\dfrac{1}{1\\,000}$"]),
], 2, "The law the small-number method uses: one over a power of ten is a negative power.");

// ---------- the question runs ----------
// Every whiteboard slide has five questions and no help lines. Numbers in parts come last of all.
const WL = wbRun(run("WL", 10));
const WF = wbRun(run("WF", 10));
const WS = wbRun(["WS1", "WS2", "WS3", "WS4", "WS5", "WS6", "WS7", "WS9", "WS10", "WS12"]);
const WT = wbRun(run("WT", 10));
const WPL = partsRun(["WPL1", "WPL2", "WPL4", "WPL6", "WPL8"]);
const WPS = partsRun(["WPS1", "WPS4", "WPS5", "WPS6", "WPS8"]);
const WM = wbRun(run("WM", 10));
const slice = (qs: CuratedQuestion[], a: number, b?: number) => qs.slice(a, b);
must([WL, WF, WS, WT, WM].every((r) => r.length === 10) && WPL.length === 5 && WPS.length === 5, "run sizes");

const wb = (id: string, title: string, qs: CuratedQuestion[], brief: string) => S.whiteboard(`${P}-${id}`, title, qs, brief);

export default () => ({
  id: ID, title: "Standard Form 1: Converting", strand: "Number", questionVersion: 2, tool: "standard-form",
  summary: "Why we use standard form, and converting large and small numbers both ways. Large numbers: two methods (one step, or one ten at a time). Small numbers: write the first number between 1 and 10, then divide by a power of ten. The place value grid then gives the quicker rule (down a place, power up 1). Numbers in parts come last of all. Whiteboards have five questions and no hints. Printed Sheets 1 and 2 are placeholders. All questions are authored.",
  slides: [
    S.title(`${P}-title`, "Standard Form", "Why we use it, and converting"),
    S.objective(`${P}-objective`, "Write large and small numbers in standard form, and convert them back.", ["Say why standard form is used", "Say whether a number is in standard form", "Convert large and small numbers both ways"]),
    // Why we use it
    S.divider(`${P}-div-why`, "Why do we use it?"),
    hook, hookReveal, reasons,
    S.definition(`${P}-definition`, "Standard form", "A number is in standard form when it is written as\n\n$A \\times 10^{n}$\n\nwhere $1 \\le A < 10$ and $n$ is an integer."),
    isItStd,
    // Large to standard form
    S.divider(`${P}-div-large`, "Large numbers to standard form", "Two methods."),
    toStd1, toStd2, toStd3,
    wb("wl-a", "Large to standard form", slice(WL, 0, 5), "Five whiteboards. Working is Method 1."),
    bridgeSlide(`${P}-bridge-large`, "The same thing in the grid", "32 000 written in the place value grid, one place at a time. The decimal point never moves.", { id: "m1", dir: "toStd", ord: "32000", c: "3.2", p: 4 }, "The bridge: after the chain has been seen several times. The number moves down one place per click and the power goes up by 1. The point stays where it is."),
    wb("wl-b", "Large to standard form", slice(WL, 5), "Five more whiteboards, after the grid."),
    // Large from standard form
    S.divider(`${P}-div-large-back`, "Large numbers from standard form", "Two methods the other way."),
    toOrd1, toOrd2, toOrd3,
    wb("wf-a", "Large from standard form", slice(WF, 0, 5), "Five whiteboards. Working is Method 1."),
    bridgeSlide(`${P}-bridge-large-back`, "The grid the other way", "4.3 × 10³ in the grid: each click moves the number up a place and the power comes down by 1, until it reaches 10⁰ (= 1).", { id: "m2", dir: "toOrd", ord: "4300", c: "4.3", p: 3 }, "The same grid read the other way round: up one place, power down 1, until the power is 10⁰, which is 1."),
    wb("wf-b", "Large from standard form", slice(WF, 5), "Five more whiteboards, after the grid."),
    sheetSlide(1),
    // Small numbers
    S.divider(`${P}-div-small`, "Small numbers to standard form", "Divide by tens."),
    retrieval, small1, small2, small3, small4,
    wb("ws-a", "Small to standard form", slice(WS, 0, 5), "Five whiteboards. These start at the power -1."),
    bridgeSlide(`${P}-bridge-small`, "The small numbers in the grid", "0.00002 written in the grid: each click moves the number up a place and the power goes down by 1.", { id: "m3", dir: "toStd", ord: "0.00002", c: "2", p: -5 }, "The bridge for small numbers: link back to 2 ÷ 100."),
    wb("ws-b", "Small to standard form", slice(WS, 5), "Five more whiteboards, after the grid."),
    S.divider(`${P}-div-small-back`, "Small numbers from standard form"),
    smallBack1, smallBack2,
    wb("wt-a", "Small from standard form", slice(WT, 0, 5), "Five whiteboards."),
    bridgeSlide(`${P}-bridge-small-back`, "The grid the other way", "2 × 10⁻⁵ written in the grid: each click moves the number down a place and the power goes up by 1, until it reaches 10⁰.", { id: "m4", dir: "toOrd", ord: "0.00002", c: "2", p: -5 }, "The reverse of the small bridge."),
    wb("wt-b", "Small from standard form", slice(WT, 5), "Five more whiteboards, after the grid."),
    sheetSlide(2),
    // Mixed: all four directions together
    S.divider(`${P}-div-mixed`, "Mixed", "You decide which way, and which sign."),
    wb("wm-a", "Mixed: both ways, large and small", slice(WM, 0, 5), "Five mixed whiteboards."),
    wb("wm-b", "Mixed: both ways, large and small", slice(WM, 5), "Five more mixed whiteboards."),
    S.general(`${P}-gen-1`, "Converting: Level 1", T, { sub: "converting", level: "level1" }, 11, "The tool's generator. Its working is the place value grid; the Method 1 working is still to be built into the tool."),
    S.general(`${P}-gen-2`, "Converting: Level 2", T, { sub: "converting", level: "level2" }, 12),
    // Numbers in parts: the very end, once all four directions are secure
    S.divider(`${P}-div-parts`, "Numbers in parts", "A first number that is not between 1 and 10."),
    partsDisc,
    wb("wpl", "Numbers in parts (large)", WPL, "Peel a ten off the first number until it is between 1 and 10. Five whiteboards."),
    smallParts,
    wb("wps", "Numbers in parts (small)", WPS, "Too big (70 × 10⁻⁴) and too small (0.9 × 10⁷). Five whiteboards."),
    partsSheet(),
    S.general(`${P}-gen-3`, "Converting: Level 3 (numbers in parts)", T, { sub: "converting", level: "level3" }, 13),
    S.summary(`${P}-summary`, "Summary", ["Standard form is $A \\times 10^{n}$ with $1 \\le A < 10$ and $n$ an integer.", "Large: write the number as $A$ times a 1 with zeros, then as a power of ten; or peel off one ten at a time.", "Small: write $A$, divide by a power of ten, and the power is negative.", "Down one place, the power goes up by $1$. Up one place, the power goes down by $1$."]),
  ] as Slide[],
});
