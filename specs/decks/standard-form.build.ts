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
/** Large number to standard form: 45 000 = 45 x 1 000 = 45 x 10^3 = 4.5 x 10 x 10^3 = 4.5 x 10^4. */
function chainLargeToStd(it: Item): string[] {
  const v = parse(it.ord), k = v.d.length - v.d.replace(/0+$/, "").length, D = v.d.slice(0, v.d.length - k), m = D.length;
  must(k > 0 && it.p === k + m - 1, `${it.id}: chain shape`);
  // one short equation to a line: the working panel is narrow and clips a long one
  const lines = [`$${grp(it.ord)} = ${D} \\times ${oneOf(k)}$`, `$${oneOf(k)} = ${pw(k)}$`, `$${grp(it.ord)} = ${D} \\times ${pw(k)}$`];
  if (m > 1) {
    lines.push(`$${D} = ${it.c} \\times ${ten(m - 1)}$`, `$${D} \\times ${pw(k)} = ${it.c} \\times ${ten(m - 1)} \\times ${pw(k)}$`);
    lines.push(`$${ten(m - 1)} \\times ${pw(k)} = ${pw(it.p)}$`, `$${grp(it.ord)} = ${it.c} \\times ${pw(it.p)}$`);
  }
  return lines;
}
/** Large standard form to ordinary: 3.2 x 10^4 = 3.2 x 10 x 10^3 = 32 x 10^3 = 32 x 1 000 = 32 000. */
function chainLargeToOrd(it: Item): string[] {
  const f = decimals(it.c), D = it.c.replace(".", "");
  if (f === 0) return [`$${pw(it.p)} = ${oneOf(it.p)}$`, `$${it.c} \\times ${pw(it.p)} = ${it.c} \\times ${oneOf(it.p)}$`, `$= ${grp(it.ord)}$`];
  if (it.p < f) return [`$${pw(it.p)} = ${oneOf(it.p)}$`, `$${it.c} \\times ${oneOf(it.p)}$`, `$= ${grp(it.ord)}$`];
  const rest = it.p - f;
  const lines = [`$${it.c} \\times ${pw(it.p)} = ${it.c} \\times ${ten(f)} \\times ${rest ? pw(rest) : "1"}$`, `$${it.c} \\times ${ten(f)} = ${D}$`];
  if (rest) lines.push(`$${pw(rest)} = ${oneOf(rest)}$`, `$${D} \\times ${oneOf(rest)} = ${grp(it.ord)}$`);
  else lines.push(`$${it.c} \\times ${pw(it.p)} = ${grp(it.ord)}$`);
  return lines;
}
/** Small number to standard form (Harry's route): 0.02 = 2 / 100 = 2 x 1/100 = 2 x 1/10^2 = 2 x 10^-2. */
function chainSmallToStd(it: Item): string[] {
  const v = parse(it.ord), t = v.s, D = v.d, m = D.length;
  must(it.p === -t + m - 1, `${it.id}: small chain shape`);
  const lines = [
    `$${it.ord} = ${D} \\div ${oneOf(t)}$`,
    `$= ${D} \\times \\dfrac{1}{${oneOf(t)}}$`,
    `$= ${D} \\times \\dfrac{1}{${pw(t)}}$`,
    `$= ${D} \\times ${pw(-t)}$`,
  ];
  if (m > 1) {
    lines.push(`$${D} = ${it.c} \\times ${ten(m - 1)}$`, `$${D} \\times ${pw(-t)} = ${it.c} \\times ${ten(m - 1)} \\times ${pw(-t)}$`);
    lines.push(`$${ten(m - 1)} \\times ${pw(-t)} = ${pw(it.p)}$`, `$${it.ord} = ${it.c} \\times ${pw(it.p)}$`);
  }
  return lines;
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
/** The grid as one maths array: headings (with the powers of ten underneath), a row per place, and `x 10^n` beside it. */
function gridArray(plan: GridPlan): string {
  const spec = plan.cols.map((q) => (q === 0 && plan.cols.includes(-1) ? "c|" : "c")).join("") + "|c";
  const head1 = [...plan.cols.map((q) => `\\mathbf{${NAMES[q]}}`), ""].join("&");
  const head2 = [...plan.cols.map((q) => `\\color{${grey}}\\scriptstyle ${pw(q)}`), ""].join("&");
  const last = plan.rows.length - 1;
  const body = plan.rows.map((r, i) => [
    ...plan.cols.map((q) => { const c = r.cells.get(q); return !c ? "" : c.zero ? `\\color{#94a3b8}${c.t}` : i === last ? green(c.t) : c.t; }),
    i === last ? green(`\\times ${pw(r.power)}`) : `\\times ${pw(r.power)}`,
  ].join("&")).join("\\\\");
  return `$\\begin{array}{${spec}}${head1}\\\\${head2}\\\\\\hline ${body}\\end{array}$`;
}
const gridWorking = (it: Item): string[] => {
  const { dg } = stdOf(it.ord), mode = it.dir;
  const steps = Math.abs(it.p);
  const down = (mode === "toStd") === (it.p > 0);               // the number moves down a place (to a smaller column) or up
  const move = `The number moves ${down ? "down" : "up"} ${steps} ${steps === 1 ? "place" : "places"}, so the power goes ${down ? "up" : "down"} ${steps === 1 ? "by 1" : `${steps} times, by 1 each time`}.`;
  const end = it.dir === "toStd" ? `$${it.c} \\times ${pw(it.p)}$` : `$${grp(it.ord)}$`;
  return [move, gridArray(gridPlan(dg, it.p, mode)), `The answer is ${end}.`];
};

// ---------- the question forms ----------
type Help = "start" | "hint" | "none";
const BOX = "\\Box";
/** The help line under the question: the first line of working with the key part left as a box, or a small grey hint. */
function helpLine(it: Item, help: Help): string | undefined {
  if (help === "none") return undefined;
  const v = parse(it.ord), D = it.c.replace(".", ""), f = decimals(it.c);
  if (it.dir === "toStd" && it.p > 0) return help === "start" ? `$${grp(it.ord)} = ${v.d.replace(/0+$/, "")} \\times ${BOX}$` : hintLine("how many tens?");
  if (it.dir === "toStd") return help === "start" ? `$${it.ord} = ${v.d} \\div ${BOX}$` : hintLine("divided by what?");
  if (it.p > 0 && f > 0 && it.p >= f) return help === "start" ? `$${it.c} \\times ${pw(it.p)} = ${D} \\times 10^{${BOX}}$` : hintLine("how many tens are left?");
  if (it.p > 0) return help === "start" ? `$${pw(it.p)} = ${BOX}$` : hintLine("what is 10 to that power?");
  return help === "start" ? `$${pw(it.p)} = \\dfrac{1}{${BOX}}$` : hintLine("a negative power is one over a power");
}
function wbq(id: string, help: Help, working: "chain" | "grid"): CuratedQuestion {
  const it = item(id);
  const lines = it.dir === "toStd" ? ["Write in standard form:", `$${grp(it.ord)}$`] : ["Write as an ordinary number:", `$${it.c} \\times ${pw(it.p)}$`];
  const h = helpLine(it, help);
  if (h) lines.push(h);
  assertCentred(lines, id);
  const answer = it.dir === "toStd" ? `$${it.c} \\times ${pw(it.p)}$` : `$${grp(it.ord)}$`;
  return {
    ...Q.open(id, T, "level1", lines[0], answer, working === "chain" ? chain(it) : gridWorking(it)),
    title: it.dir === "toStd" ? `${grp(it.ord)} to standard form` : `${it.c} x 10^${it.p} to ordinary`,
    question: lines,
    rationale: working === "chain" ? "Write the number as a smaller number times a power of ten, then make the coefficient between 1 and 10 and combine the tens." : "Move the number a place at a time; each place down adds 1 to the power, each place up takes 1 off.",
  };
}
function partsQ(id: string, help: Help): CuratedQuestion {
  const x = parts(id);
  const lines = ["Write in standard form:", `$${x.shown} \\times ${pw(x.sp)}$`];
  if (help === "start") lines.push(Number(x.shown) < 1 ? `$${x.shown} = ${stdOf(x.shown).c} \\times 10^{${BOX}}$` : `$${x.shown} = ${over10(x.shown)} \\times ${BOX}$`);
  if (help === "hint") lines.push(hintLine("is the first number between 1 and 10?"));
  assertCentred(lines, id);
  return {
    ...Q.open(id, T, "level1", lines[0], `$${x.c} \\times ${pw(x.p)}$`, chainParts(x)),
    title: `${x.shown} x 10^${x.sp} in standard form`, question: lines,
    rationale: "The first number is not between 1 and 10: write it as a number between 1 and 10 times a power of ten, then combine the tens.",
  };
}
const wbRun = (ids: string[], helps: Help[], working: "chain" | "grid") => ids.map((id, i) => wbq(id, helps[i] ?? "none", working));
const partsRun = (ids: string[], helps: Help[]) => ids.map((id, i) => partsQ(id, helps[i] ?? "none"));

// ---------- slide pieces ----------
const t = textEl;
const mathsEl = (x: number, y: number, w: number, h: number, latex: string, size: number, more: Record<string, unknown> = {}) =>
  ({ kind: "maths", x, y, w, h, latex, size, colour: LOOK.ink, align: "left", ...more }) as never;

/** Lines of working built one to a click, each with a small grey note on the right. */
function chainSlide(id: string, title: string, subtitle: string, lines: { tex: string; note?: string; final?: boolean }[], brief: string): Slide {
  return makeSlide(id, "teach", title, [
    ...titleEls(title, subtitle),
    ...lines.flatMap((l, i) => [
      mathsEl(100, 240 + i * 118, 1000, 116, l.tex, l.tex.includes("dfrac") ? 54 : 62, { step: i + 1, ...(l.final ? { colour: GREEN } : {}) }),
      ...(l.note ? [t(1130, 250 + i * 118, 410, 96, l.note, 36, { colour: grey, step: i + 1, middle: true })] : []),
    ]),
  ], brief);
}

/** The bridge: the number written in the place value grid and moved one place per click, the power beside it. The point never moves. */
function bridgeSlide(id: string, title: string, subtitle: string, it: Item, brief: string): Slide {
  const { dg } = stdOf(it.ord), plan = gridPlan(dg, it.p, it.dir);
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
  if (plan.cols.includes(-1)) els.push(lineEl(x0 + (point + 1) * cell, 238, 0, 80 + plan.rows.length * 90, { colour: "#94a3b8" }));
  const last = plan.rows.length - 1;
  plan.rows.forEach((r, i) => {
    const y = 345 + i * 90, step = i + 1;
    plan.cols.forEach((q, j) => {
      const c = r.cells.get(q);
      if (c) els.push(t(x0 + j * cell, y, cell, 80, c.t, 64, { bold: !c.zero, align: "center", middle: true, colour: c.zero ? "#94a3b8" : i === last ? GREEN : LOOK.ink, step }));
    });
    els.push(t(px, y, 320, 80, `$\\times ${pw(r.power)}$`, 56, { middle: true, colour: i === last ? GREEN : LOOK.ink, bold: i === last, step }));
    els.push(t(40, y, x0 - 60, 80, i === 0 ? "Start" : `${down ? "down" : "up"} 1 place: power ${down ? "up" : "down"} 1`, 34, { colour: grey, middle: true, align: "right", step }));
  });
  els.push(t(100, 825, 1400, 60, "Down one place: the power goes up by 1. Up one place: the power goes down by 1.", 42, { bold: true, colour: BLUE, align: "center", middle: true, step: plan.rows.length + 1 }));
  return makeSlide(id, "teach", title, els, brief);
}
type NoIdEls = Parameters<typeof makeSlide>[3];

const sheetPlaceholder = (id: string, n: number, which: string, qs: string) => makeSlide(id, "retrieval", `Sheet ${n}`, [
  t(60, 46, 1480, 64, `Sheet ${n}: questions ${qs}. Write your answers in your book.`, 38, { colour: grey }),
  { kind: "shape", shape: "rect", x: 60, y: 140, w: 1480, h: 720, fill: "#f8fafc", stroke: "#cbd5e1", strokeWidth: 4, radius: 18 } as never,
  t(160, 330, 1280, 120, `PLACEHOLDER: Sheet ${n}`, 72, { bold: true, colour: "#94a3b8", align: "center", middle: true }),
  t(160, 470, 1280, 200, `${which}. Printed, textbook format, parts (a) to (x). Replace this with the pinned worksheet when it is built; the answers show on a click.`, 40, { colour: "#94a3b8", align: "center" }),
], `Placeholder. The printed sheet (${which}) is built and pinned next; the questions for it are in specs/decks/_check/standard-form-converting.json (${n === 1 ? "1a to 1l and 2a to 2l" : "3a to 3l and 4a to 4l"}), to be extended because 15 minutes is far more than 12 parts a question needs.`);

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
    ["3.8 \\times 10^{5}", "Yes", "3.8 is between 1 and 10", true],
    ["38 \\times 10^{4}", "No", "38 is 10 or more", false],
    ["0.38 \\times 10^{6}", "No", "0.38 is less than 1", false],
    ["9.99 \\times 10^{-3}", "Yes", "9.99 is below 10; a negative power is fine", true],
  ] as [string, string, string, boolean][]).flatMap(([tex, verdict, why, ok], i) => [
    mathsEl(100, 260 + i * 150, 700, 110, tex, 68, { step: 2 * i + 1 }),
    t(850, 270 + i * 150, 170, 100, verdict, 60, { bold: true, colour: ok ? GREEN : "#b91c1c", middle: true, step: 2 * i + 2 }),
    t(1030, 270 + i * 150, 500, 100, why, 34, { colour: grey, middle: true, step: 2 * i + 2 }),
  ]),
], "Each row: the class decides, then the verdict and the reason appear.");

const stage1 = chainSlide(`${P}-stage1`, "A 1 with zeros is a power of 10", "Start with the easiest case.", [
  { tex: "2\\,000 = 2 \\times 1\\,000" },
  { tex: "1\\,000 = 10^{3}", note: "a 1 followed by zeros" },
  { tex: "2\\,000 = 2 \\times 10^{3}", final: true, note: "standard form" },
], "The first idea: write the number as a small number times 1 000, and 1 000 is a power of 10. This already is standard form because 2 is between 1 and 10.");
const chainModel = chainSlide(`${P}-chain`, "Bigger numbers: take out the tens", "Write 32 000 in standard form.", [
  { tex: "32\\,000 = 3\\,200 \\times 10" },
  { tex: "= 320 \\times 10 \\times 10" },
  { tex: "= 320 \\times 10^{2}", note: "10 × 10 = 10², but 320 is not between 1 and 10" },
  { tex: "= 32 \\times 10^{3}", note: "320 = 32 × 10, and 10 × 10² = 10³; 32 is not between 1 and 10 either" },
  { tex: "= 3.2 \\times 10^{4}", final: true, note: "32 = 3.2 × 10, and 10 × 10³ = 10⁴" },
], "Harry's chain. Each line is the same number: divide by 10 and put another ×10 on the end. Lines 3 and 4 are 'numbers in parts': nearly standard form, with a first number outside 1 to 10.");
const chainBack = chainSlide(`${P}-chain-back`, "Back again", "Write 3.2 × 10⁴ as an ordinary number.", [
  { tex: "3.2 \\times 10^{4} = 3.2 \\times 10 \\times 10^{3}", note: "10⁴ = 10 × 10³" },
  { tex: "= 32 \\times 10^{3}", note: "3.2 × 10 = 32" },
  { tex: "= 32 \\times 1\\,000", note: "10³ = 1 000" },
  { tex: "= 32\\,000", final: true },
], "The chain read the other way: the same lines in reverse order.");
const partsDisc = S.discuss(`${P}-parts-disc`, "Is $25 \\times 10^{6}$ in standard form?",
  "No. 25 is not between 1 and 10. $25 = 2.5 \\times 10$, so we can take a ten out and add it to the power.", "Write $25 \\times 10^{6}$ in standard form.", "2.5 \\times 10^{7}");

const small1 = chainSlide(`${P}-small1`, "Small numbers: divide by tens", "Write 0.02 in standard form.", [
  { tex: "0.02 = 2 \\div 100", note: "two hundredths" },
  { tex: "= 2 \\times \\dfrac{1}{100}" },
  { tex: "= 2 \\times \\dfrac{1}{10^{2}}" },
  { tex: "= 2 \\times 10^{-2}", final: true, note: "1 ÷ 10² is 10⁻², from the laws of indices" },
], "Model 1: a decimal is a division by a power of ten, and the laws of indices turn the division into a negative power. Standard form straight away.");
const small2 = chainSlide(`${P}-small2`, "The first number is too big", "Write 0.35 in standard form.", [
  { tex: "0.35 = 35 \\div 100" },
  { tex: "= 35 \\times 10^{-2}", note: "as before: 1 ÷ 10² = 10⁻²" },
  { tex: "= 3.5 \\times 10 \\times 10^{-2}", note: "35 = 3.5 × 10" },
  { tex: "= 3.5 \\times 10^{-1}", final: true, note: "10 × 10⁻² = 10⁻¹" },
], "Model 2: the first number (35) is not between 1 and 10, so take a ten out of it, exactly as with the large numbers. 10 × 10⁻² = 10¹ × 10⁻² = 10⁻¹: add the powers.");
const small3 = chainSlide(`${P}-small3`, "More zeros", "Write 0.00058 in standard form.", [
  { tex: "0.00058 = 58 \\div 100\\,000" },
  { tex: "= 58 \\times \\dfrac{1}{10^{5}}" },
  { tex: "= 58 \\times 10^{-5}", note: "58 is not between 1 and 10" },
  { tex: "= 5.8 \\times 10 \\times 10^{-5}", note: "58 = 5.8 × 10" },
  { tex: "= 5.8 \\times 10^{-4}", final: true, note: "10 × 10⁻⁵ = 10⁻⁴" },
], "Model 3: five decimal places but the power is -4, because 58 gives back one ten. The power is not the number of zeros.");
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
  Q.open(`${P}-rec-3`, T, "level1", "Work out $10 \\times 10^{-5}$.", "$10^{-4}$", ["$10 \\times 10^{-5} = 10^{1} \\times 10^{-5} = 10^{-4}$: add the powers"]),
  Q.open(`${P}-rec-4`, T, "level1", "Write $10^{-3}$ as a fraction.", "$\\dfrac{1}{1\\,000}$", ["$10^{-3} = \\dfrac{1}{10^{3}} = \\dfrac{1}{1\\,000}$"]),
], 2, "Both laws are needed for small numbers: one over a power, and adding powers.");

// ---------- the question runs ----------
const WL = [...wbRun(run("WL", 4), ["start", "start", "hint", "none"], "chain"), ...wbRun(["WL5", "WL6", "WL7", "WL8", "WL9", "WL10"], [], "grid")];
const WF = [...wbRun(run("WF", 3), ["start", "hint", "none"], "chain"), ...wbRun(["WF4", "WF5", "WF6", "WF7", "WF8", "WF9"], [], "grid")];
const WS = [...wbRun(run("WS", 4), ["start", "start", "hint", "none"], "chain"), ...wbRun(["WS5", "WS6", "WS7", "WS8", "WS9", "WS10", "WS11", "WS12"], [], "grid")];
const WT = [...wbRun(run("WT", 4), ["start", "hint", "none", "none"], "chain"), ...wbRun(["WT5", "WT6", "WT7", "WT8", "WT9", "WT10"], [], "grid")];
const WPL = partsRun(run("WPL", 8), ["start", "hint", "none"]);
const WPS = partsRun(run("WPS", 8), ["start", "hint", "none"]);
const WM = wbRun(run("WM", 10), [], "chain");
const slice = (qs: CuratedQuestion[], a: number, b?: number) => qs.slice(a, b);
must(WL.length === 10 && WF.length === 9 && WS.length === 12 && WT.length === 10 && WPL.length === 8 && WPS.length === 8 && WM.length === 10, "run sizes");

const wb = (id: string, title: string, qs: CuratedQuestion[], brief: string) => S.whiteboard(`${P}-${id}`, title, qs, brief);

export default () => ({
  id: ID, title: "Standard Form 1: Converting", strand: "Number", questionVersion: 2, tool: "standard-form",
  summary: "Why we use standard form, and converting large and small numbers both ways. The method: write the number as a smaller number times a power of ten, make the first number between 1 and 10, combine the tens; the place value grid then gives the quicker rule (down a place, power up 1). Numbers in parts sit inside each section. Printed Sheets 1 and 2 are placeholders. All questions are authored.",
  slides: [
    S.title(`${P}-title`, "Standard Form", "Why we use it, and converting"),
    S.objective(`${P}-objective`, "Write large and small numbers in standard form, and convert them back.", ["Say why standard form is used", "Say whether a number is in standard form", "Convert large and small numbers both ways"]),
    // Why we use it
    S.divider(`${P}-div-why`, "Why do we use it?"),
    hook, hookReveal, reasons,
    S.definition(`${P}-definition`, "Standard form", "A number is in standard form when it is written as $A \\times 10^{n}$, where $A$ is a number between $1$ and $10$ (at least $1$, but less than $10$) and $n$ is a whole number (positive or negative)."),
    isItStd,
    // Large to standard form
    S.divider(`${P}-div-large`, "Large numbers to standard form", "Take out the tens."),
    stage1, chainModel,
    wb("wl-a", "Large to standard form", slice(WL, 0, 4), "Chain working. Help climbs: the first line started, a small grey hint, then none."),
    bridgeSlide(`${P}-bridge-large`, "The same thing in the grid", "32 000 written in the place value grid, one place at a time. The decimal point never moves.", { id: "m1", dir: "toStd", ord: "32000", c: "3.2", p: 4 }, "The bridge: after the chain has been seen several times. The number moves down one place per click and the power goes up by 1. The point stays where it is."),
    wb("wl-b", "Large to standard form", slice(WL, 4), "Grid working after the bridge."),
    S.divider(`${P}-div-large-parts`, "Numbers in parts", "A first number that is not between 1 and 10."),
    partsDisc,
    wb("wpl", "Numbers in parts (large)", WPL, "Finish the chain from where it is. Eight whiteboards; the first two have help."),
    // Large from standard form
    S.divider(`${P}-div-large-back`, "Large numbers from standard form", "The chain the other way."),
    chainBack,
    wb("wf-a", "Large from standard form", slice(WF, 0, 3), "Chain working, with help."),
    bridgeSlide(`${P}-bridge-large-back`, "The grid the other way", "3.2 × 10⁴ written in the grid: the number moves up, the power goes down.", { id: "m2", dir: "toOrd", ord: "32000", c: "3.2", p: 4 }, "The same grid read the other way round."),
    wb("wf-b", "Large from standard form", slice(WF, 3), "Grid working. The last has a decimal answer."),
    sheetPlaceholder(`${P}-sheet-1`, 1, "Questions 1 and 2: write in standard form, and write as an ordinary number (large)", "1 and 2"),
    // Small numbers
    S.divider(`${P}-div-small`, "Small numbers to standard form", "Divide by tens."),
    retrieval, small1, small2, small3, small4,
    wb("ws-a", "Small to standard form", slice(WS, 0, 4), "Chain working with help. These start at the power -1."),
    bridgeSlide(`${P}-bridge-small`, "The small numbers in the grid", "0.02 written in the grid: the number moves up, the power goes down.", { id: "m3", dir: "toStd", ord: "0.02", c: "2", p: -2 }, "The bridge for small numbers: link back to 2 ÷ 100."),
    wb("ws-b", "Small to standard form", slice(WS, 4), "Grid working after the bridge."),
    S.divider(`${P}-div-small-back`, "Small numbers from standard form"),
    smallBack1, smallBack2,
    wb("wt-a", "Small from standard form", slice(WT, 0, 4), "Chain working with help."),
    bridgeSlide(`${P}-bridge-small-back`, "The grid the other way", "2 × 10⁻² written in the grid: the number moves down, the power goes up.", { id: "m4", dir: "toOrd", ord: "0.02", c: "2", p: -2 }, "The reverse of the small bridge."),
    wb("wt-b", "Small from standard form", slice(WT, 4), "Grid working after the bridge: the number moves down, the power goes up."),
    S.divider(`${P}-div-small-parts`, "Numbers in parts, small", "A first number too big, or too small."),
    smallParts,
    wb("wps", "Numbers in parts (small)", WPS, "Too big (70 × 10⁻⁴) and too small (0.9 × 10⁷). The first two have help."),
    sheetPlaceholder(`${P}-sheet-2`, 2, "Questions 3 and 4: write in standard form, and write as an ordinary number (small)", "3 and 4"),
    // Mixed
    S.divider(`${P}-div-mixed`, "Mixed", "You decide which way, and which sign."),
    wb("wm", "Mixed: both ways, large and small", WM, "Ten mixed whiteboards, no help."),
    S.general(`${P}-gen-1`, "Converting: Level 1", T, { sub: "converting", level: "level1" }, 11, "The tool's generator. Its working is the place value grid; the chain working is still to be built into the tool."),
    S.general(`${P}-gen-2`, "Converting: Level 2", T, { sub: "converting", level: "level2" }, 12),
    S.general(`${P}-gen-3`, "Converting: Level 3 (numbers in parts)", T, { sub: "converting", level: "level3" }, 13),
    S.summary(`${P}-summary`, "Summary", ["Standard form is $A \\times 10^{n}$ with $A$ between $1$ and $10$.", "Take out the tens: write the number as a smaller number times a power of ten, then make the first number between $1$ and $10$.", "Down one place, the power goes up by $1$. Up one place, the power goes down by $1$.", "Small numbers: divide by tens, so the power is negative."]),
  ] as Slide[],
});
