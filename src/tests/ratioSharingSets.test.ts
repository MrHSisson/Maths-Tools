import { describe, it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import { gcdAll } from "../shared";
import { buildSharing, buildKnown, buildDifference, CONTEXTS } from "../tools/Proportion/ratioSharing";
import { ALL_SETS, WHITEBOARDS, type SetQuestion } from "../../specs/decks/ratio-sharing-sets";

// The authored Sharing in a ratio sets (specs/decks/ratio-sharing-sets.ts). Every answer is recomputed here from the numbers a
// pupil sees, by arithmetic that does not use the builders; then the tool's own builder must agree with it and with the hand-typed
// answer, and the named wrong method must give a different answer. `WRITE_TABLE=1` writes the table Harry reads.

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const rnd = (n: number) => Math.round(n * 100) / 100;
const kinds = (q: SetQuestion) => (q.total !== undefined ? "S" : q.known ? "K" : "D");

/** What the question asks, worked from the given numbers only (parts in simplest form, one part found, the rest by multiplying). */
function work(q: SetQuestion) {
  const g = gcdAll(q.ratio);
  const parts = q.ratio.map((p) => p / g);
  const pv = q.total !== undefined ? q.total / sum(parts)
    : q.known ? q.known.amount / parts[q.known.who]
    : q.diff!.amount / Math.abs(parts[q.diff!.a] - parts[q.diff!.b]);
  const shares = parts.map((p) => rnd(p * pv));
  return { g, parts, pv, shares, total: rnd(sum(parts) * pv) };
}

/** The first quantity the question asks for, under the named wrong method (a number, or null when the method does not apply). */
function wrongValue(q: SetQuestion): number | null {
  const { parts, pv, shares } = work(q);
  const idx = q.ask === "both" || q.ask === "total" ? 0 : q.ask;
  const asked = (p: number) => (q.ask === "total" ? sum(parts) * p : parts[idx] * p);
  switch (q.wrong) {
    case "none": return null;
    case "onePart": return rnd(pv);
    case "divPeople": return rnd(q.total! / q.ratio.length);
    case "knownAsPart": return rnd(asked(q.known!.amount));
    case "knownAsTotal": return q.known!.amount;
    case "diffAsTotal": return q.diff!.amount;
    case "diffOverSum": return rnd(asked(q.diff!.amount / sum(parts)));
    case "wrongPair": return rnd(asked(q.diff!.amount / Math.abs(parts[0] - parts[1])));
    case "dropPart": {
      const base = q.total !== undefined ? q.total / (sum(parts) - parts[parts.length - 1]) : pv;
      return q.total !== undefined ? rnd(parts[idx] * base) : rnd((sum(parts) - parts[parts.length - 1]) * pv);
    }
    case "unsimplified": return rnd(q.ratio[q.ask === "total" ? 0 : idx] * pv * (q.ask === "total" ? sum(q.ratio) / q.ratio[0] : 1));
    case "swap": return shares[idx === 0 ? 1 : 0];
  }
}

const format = (q: SetQuestion, n: number | null) => (n === null ? "n/a (the method agrees here, on purpose)" : CONTEXTS[q.ctx ?? "money"].short(n));

function built(q: SetQuestion) {
  const { g, parts, pv } = work(q);
  const names = q.names ?? q.ratio.map((_, i) => String.fromCharCode(65 + i));
  const base = { names, parts, partValue: pv, ctx: q.ctx, display: g > 1 ? q.ratio : undefined, bar: false };
  if (q.total !== undefined) return buildSharing({ ...base, ask: q.ask === "both" ? "both" : (q.ask as number) });
  if (q.known) return buildKnown({ ...base, known: q.known.who, ask: q.ask as "total" | number });
  return buildDifference({ ...base, a: q.diff!.a, b: q.diff!.b, style: q.diff!.style, ask: q.ask as "total" | number });
}

/** The answer as the deck shows it. In the grid, every cell asks for every share, so it is just the amounts. */
const answerOf = (q: SetQuestion) => {
  if (q.ask === "both") {
    const C = CONTEXTS[q.ctx ?? "money"];
    const a = work(q).shares.map((s) => C.short(s));
    if (q.names) return q.names.map((n, i) => `${n}: ${a[i]}`).join(", ");   // a named question: "Amy: £33, Bo: £55"
    return a.length === 2 ? a.join(" and ") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;
  }
  return built(q).answer!;
};

const questionText = (q: SetQuestion) => q.total !== undefined && !q.names
  ? `${CONTEXTS[q.ctx ?? "money"].short(q.total).replace(/^(\d+) kg$/, "$1 kg")} · ${q.ratio.join(" : ")}`
  : built(q).lines.join(" / ").replace(/\$([^$]*)\$/g, "$1");

describe("Sharing in a ratio: the authored sets", () => {
  for (const [set, qs] of [...Object.entries(ALL_SETS), ...Object.entries(WHITEBOARDS)]) {
    it(`Set ${set}: ${qs.length} questions, every answer recomputed, the builder agrees, the wrong method differs`, () => {
      expect(qs.length).toBe(set === "D" ? 15 : set.startsWith("W") ? 5 : 9);
      for (const q of qs) {
        const w = work(q);
        expect(Number.isInteger(w.g), q.id).toBe(true);
        // the part value is a whole number, or a half where the total is a decimal (set A9 only)
        expect(rnd(w.pv * 2) % 1, `${q.id} part value ${w.pv}`).toBe(0);
        expect(answerOf(q), q.id).toBe(q.answer);
        if (q.ask !== "both" || q.names) expect(built(q).answer, q.id).toBe(q.answer);
        const wv = wrongValue(q);
        const right = q.ask === "total" ? w.total : q.ask === "both" ? w.shares[0] : w.shares[q.ask];
        if (q.wrong === "none") expect(wv).toBeNull();
        else expect(wv, `${q.id}: the wrong method must not land on ${right}`).not.toBe(right);
        if (q.wrong !== "none") expect(wv, q.id).not.toBeNull();
        expect(q.names === undefined || q.names.length === q.ratio.length, q.id).toBe(true);
      }
    });
  }

  it("the given numbers are fresh: none repeats across the sets or reuses a Depth or worked-example number", () => {
    const reserved = new Set([60, 75, 90, 84, 24, 48, 9, 50, 56, 18, 35]);   // the Depth cards and the worked examples (to be settled with the deck)
    const given: { id: string; n: number }[] = [];
    for (const qs of Object.values(ALL_SETS)) for (const q of qs) given.push({ id: q.id, n: q.total ?? q.known?.amount ?? q.diff!.amount });
    const dupes = given.filter((g, i) => given.findIndex((h) => h.n === g.n) !== i).map((g) => `${g.id} repeats ${g.n}`);
    expect(dupes).toEqual([]);
    expect(given.filter((g) => reserved.has(g.n)).map((g) => `${g.id}: ${g.n} is reserved`)).toEqual([]);
  });

  it("the whiteboard questions repeat no amount inside a section, and none of the sheet's own amounts (set WA with A, and so on)", () => {
    for (const [wb, qs] of Object.entries(WHITEBOARDS)) {
      const amounts = qs.map((q) => q.total ?? q.known?.amount ?? q.diff!.amount);
      expect(new Set(amounts).size, wb).toBe(amounts.length);
      const own = new Set(ALL_SETS[wb[1] as "A" | "B" | "C" | "D"].map((q) => q.total ?? q.known?.amount ?? q.diff!.amount));
      expect(amounts.filter((n) => own.has(n)), wb).toEqual([]);
    }
  });

  it("each of the three kinds is spread evenly across the mixed worksheet", () => {
    const k = ALL_SETS.D.map(kinds);
    expect(["S", "K", "D"].map((x) => k.filter((y) => y === x).length)).toEqual([5, 5, 5]);
  });

  it.runIf(!!process.env.WRITE_TABLE)("writes the table for Harry", () => {
    const heads: Record<string, string> = {
      A: "## Set A: sharing from a total (the 3 × 3 grid on the board)\n\nInstruction above the grid: **Share each amount in the ratio given.** Each cell is the amount over the ratio; every cell asks for every share.\n",
      B: "## Set B: a known share (printed sheet of nine, cells layout)\n",
      C: "## Set C: a difference (printed sheet of nine, cells layout)\n",
      D: "## Worksheet D: mixed, fifteen (printed, cells layout)\n\nThe kinds are not labelled. Five sharing, five known share, five difference, interleaved and climbing.\n",
      WA: "## Whiteboards for set A: sharing a total (five, on the board, with the bar-model working)\n",
      WB: "## Whiteboards for set B: a known share\n",
      WC: "## Whiteboards for set C: a difference\n",
      WD: "## Whiteboards for the mixed section (the kinds are not labelled)\n",
    };
    let md = "# Sharing in a ratio: the authored questions\n\nWritten by `src/tests/ratioSharingSets.test.ts` from `specs/decks/ratio-sharing-sets.ts` (run with `WRITE_TABLE=1`). Every answer was recomputed from the numbers shown by arithmetic that does not use the tool's builders; the tool's own builder agrees with each; the wrong method was run on each and differs from the right answer. The trap ids are in `specs/decks/ratio-sharing.md`. For a grid, the wrong result is the first share.\n\n";
    for (const [set, qs] of [...Object.entries(WHITEBOARDS), ...Object.entries(ALL_SETS)]) {
      md += `${heads[set]}\n| # | Rung | As shown | Answer | Trap it is built for | The wrong method gives |\n|---|---|---|---|---|---|\n`;
      for (const q of qs) md += `| ${q.id} | ${q.rung} | ${questionText(q)} | ${q.answer} | ${q.trap} | ${format(q, wrongValue(q))} |\n`;
      md += "\n";
    }
    writeFileSync("specs/decks/ratio-sharing-questions.md", md);
  });
});
