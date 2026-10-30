// What must be true of a deck before Harry sees it: the maths renders, authored answers match their working, practice
// sets are long enough, Depth cards ask something new, generators exist and run at their level, and text fits its box.
// Pure functions over a deck; used by the CLI (`npm run deck -- check <id>`) and by the tests. House rules: docs/design/LESSON_STYLE.md.
import katex from "katex";
import { barProblems } from "../shared/barModel";
import { GENERATOR_TOOLS, generateFrom, generateSet } from "./generators";
import { isDepthQuestion, readyProblems } from "./questions";
import { MIN_TEXT, type CuratedQuestion, type DeckDef, type DeckElement, type Slide } from "./types";

interface DeckReport { problems: string[]; warnings: string[] }

const MATHS = /\$([^$]+)\$/g;
const significant = (n: string) => n.replace(".", "").replace(/^0+/, "").replace(/0+$/, "").length >= 2;
/** Numbers with two or more significant figures (single figures are everywhere and prove nothing). */
const numbersIn = (text: string) => (text.match(/\d+(?:\.\d+)?/g) ?? []).filter(significant);
const plain = (s: string) => s.replace(/\\[a-zA-Z]+/g, " ").replace(/[{}$]/g, "");
const normalise = (s: string) => s.replace(/\{,\}|,|\s|\\,/g, "").replace(/^\$|\$$/g, "");

function questionStrings(q: CuratedQuestion): string[] {
  return [q.title, ...q.question, ...q.answer, ...q.explanation, ...(q.format === "choice" || q.format === "claims" ? q.options.flatMap((o) => [o.text, o.reasoning]) : []), ...(q.format === "claims" ? q.claims.map((c) => c.text) : [])];
}
const questionsOf = (el: DeckElement): CuratedQuestion[] => (el.kind === "questions" || (el.kind === "grid" && el.items) ? (el.items ?? []) : []);

/** How many lines a text box needs, estimated from its characters (the browser audit measures for real). */
function textFit(el: Extract<DeckElement, { kind: "text" }>) {
  const lines = el.text.split("\n").map((line) => {
    const chars = plain(line).length;
    return Math.max(1, Math.ceil((chars * el.size * (el.bold ? 0.54 : 0.5)) / el.w));
  });
  const fractions = (el.text.match(/\\dfrac|\\frac/g) ?? []).length;
  return { lines: lines.reduce((a, b) => a + b, 0), height: lines.reduce((a, b) => a + b, 0) * el.size * 1.2 + (fractions ? el.size * 0.9 : 0) };
}

export async function checkDeckContent(deck: DeckDef): Promise<DeckReport> {
  const problems: string[] = [], warnings: string[] = [];
  const at = (s: Slide, i: number) => `slide ${i + 1} (${s.id})`;
  const renders = (where: string, latex: string) => { try { katex.renderToString(latex, { throwOnError: true, displayMode: false }); } catch (e) { problems.push(`${where}: maths does not render: ${latex} (${(e as Error).message.slice(0, 60)})`); } };
  const checkMaths = (where: string, text: string) => { for (const m of text.matchAll(MATHS)) renders(where, m[1]); };

  if (new Set(deck.slides.map((s) => s.id)).size !== deck.slides.length) problems.push("slide ids are not unique");
  const questionIds = new Set<string>();
  const used = new Set<string>();             // numbers the deck's own content asks about
  const depthCards: { where: string; q: CuratedQuestion }[] = [];

  for (const [i, slide] of deck.slides.entries()) {
    const where = at(slide, i);
    if (slide.brief !== undefined && slide.brief.trim().length < 15) problems.push(`${where}: the slide brief is too short to say anything`);
    if (new Set(slide.els.map((e) => e.id)).size !== slide.els.length) problems.push(`${where}: element ids are not unique`);
    for (const el of slide.els) {
      if (el.kind === "text") {
        checkMaths(where, el.text); numbersIn(el.text.replace(MATHS, " $1 ")).forEach((n) => used.add(n));
        if (el.size < MIN_TEXT) problems.push(`${where}: text is ${el.size} units, under the ${MIN_TEXT} minimum for the back of the room`);
        const fit = textFit(el);
        if (fit.height > el.h + 10) problems.push(`${where}: "${plain(el.text).slice(0, 40)}" probably does not fit its box (about ${fit.lines} line${fit.lines > 1 ? "s" : ""}, ${Math.round(fit.height)} tall in a ${el.h} box): shorten it, widen it or make it smaller`);
      }
      if (el.kind === "maths") renders(where, el.latex);
      if (el.kind === "ratioTable") {
        const t = el.table;
        if (t.rows.some((r) => r.length !== t.headers.length)) problems.push(`${where}: a ratio table row does not match its headings`);
        if (t.operations.length !== Math.max(0, t.rows.length - 1)) problems.push(`${where}: a ratio table needs one factor between each pair of rows`);
        for (const cell of [...t.rows.flat(), ...t.operations].filter(Boolean)) renders(where, cell);
        t.headers.forEach((h) => numbersIn(h).forEach((n) => used.add(n)));
      }
      if (el.kind === "bar") {
        for (const p of barProblems(el.bar)) problems.push(`${where}: ${p}`);
        for (const b of el.bar.braces ?? []) checkMaths(where, b.label);
        if (el.bar.unitLabel) checkMaths(where, el.bar.unitLabel);
      }
      if (el.kind === "board") for (const cell of [...el.grid.head, ...el.grid.rows.flat()]) { checkMaths(where, cell); }
      if (el.kind === "board") for (const cell of [...el.grid.head, ...el.grid.rows.map((r) => r[0])]) numbersIn(cell).forEach((n) => used.add(n));
      const items = questionsOf(el);
      for (const q of items) {
        const label = `${where}, question ${q.id}`;
        if (questionIds.has(q.id)) problems.push(`${label}: question id used twice`); questionIds.add(q.id);
        for (const s of questionStrings(q)) checkMaths(label, s);
        if (q.status === "draft") warnings.push(`${label}: still a draft`);
        else for (const p of readyProblems(q)) problems.push(`${label}: ${p}`);
        if (isDepthQuestion(q)) { depthCards.push({ where: label, q }); continue; }
        [...q.question, q.title].forEach((s) => numbersIn(s).forEach((n) => used.add(n)));
        // an authored answer must be where its own working ends
        const last = q.explanation[q.explanation.length - 1]?.match(/= (.+?)\$$/)?.[1];
        const given = q.answer[0]?.replace(/^\$\\approx /, "$");
        if (q.purpose === "practice" && q.format === "open" && last && given && /^\$[\d.{},]+\$$/.test(given) && normalise(last) !== normalise(given)) problems.push(`${label}: the answer ${q.answer[0]} is not where the working ends (${last})`);
      }
      if (el.kind === "questions" && slide.family === "practice" && items.length && items.every((q) => q.purpose === "practice")) {
        if (items.length < 5) problems.push(`${where}: a deliberate-practice set has ${items.length} questions; the least is 5`);
        if (items.length > 8) warnings.push(`${where}: ${items.length} questions in one set is a long run`);
      }
      if (el.kind === "generator" || el.kind === "worksheet") {
        if (!GENERATOR_TOOLS.some(([id]) => id === el.tool)) { problems.push(`${where}: "${el.tool}" is not a tool a deck can run`); continue; }
        try {
          const set = el.kind === "worksheet" ? await generateSet(el.tool, el.preset, el.count, el.seed ?? 1) : [await generateFrom(el.tool, el.preset, el.seed ?? 1)];
          if (el.kind === "worksheet" && set.length < el.count) problems.push(`${where}: the generator could only make ${set.length} different questions of ${el.count}`);
          if (set.some((g) => g?.difficulty !== el.preset.level)) problems.push(`${where}: the generator did not draw at ${el.preset.level}`);
          const tally = new Map<string, number>(); let total = 0;
          for (let n = 0; n < 200; n++) { const g = await generateFrom(el.tool, el.preset); if (g) { tally.set(g.answer, (tally.get(g.answer) ?? 0) + 1); total++; } }
          const [top, count] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
          if (total && tally.size > 1 && count / total > 0.35) warnings.push(`${where}: ${Math.round((100 * count) / total)}% of generated answers are "${top}"`);
        } catch (e) { problems.push(`${where}: the generator threw: ${(e as Error).message}`); }
      }
    }
  }
  for (const { where, q } of depthCards) {
    const asked = [...q.question, ...(q.format === "claims" ? q.claims.map((c) => c.text) : []), ...(q.format === "error" ? q.lines : []), ...(q.format === "choice" || q.format === "claims" ? q.options.map((o) => o.text) : [])];
    const clash = [...new Set(asked.flatMap(numbersIn))].filter((n) => used.has(n));
    if (clash.length) problems.push(`${where}: a Depth card should ask something new, but ${clash.join(", ")} also appear${clash.length > 1 ? "" : "s"} in the deck's own questions or slides`);
  }
  return { problems, warnings };
}
