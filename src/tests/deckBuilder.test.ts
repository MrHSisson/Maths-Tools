// The deck builder (src/decks/builder.ts) and the deck checks (src/decks/deckChecks.ts).
import { describe, expect, it } from "vitest";
import { DECKS } from "../decks";
import { buildDeck, Q, S } from "../decks/builder";
import { checkDeckContent } from "../decks/deckChecks";
import { authoredEstimationWorking } from "../shared/estimationWorking";
import type { DeckDef, Slide } from "../decks/types";

const deckOf = (slides: Slide[]) => buildDeck({ id: "test", title: "Test", summary: "", tool: "estimation", slides });
const set = (n: number, prefix = "t") => Array.from({ length: n }, (_, i) => Q.estimate(`${prefix}-${i + 1}`, "level1", String(41 + i * 7), "\\times", String(22 + i)));

describe("question builders", () => {
  it("estimate and fraction write the working the generator's own authoring helper does", () => {
    const e = Q.estimate("e", "level1", "48", "\\times", "31");
    expect(e.explanation).toEqual(authoredEstimationWorking("48 \\times 31").map((s) => `${s.label} $${s.latex}$`));
    expect(e.answer).toEqual(["$\\approx 1{,}500$"]);
    const f = Q.fraction("f", "level3", ["34", "+", "21"], "11");
    expect(f.explanation).toEqual(authoredEstimationWorking("\\dfrac{34 + 21}{11}").map((s) => `${s.label} $${s.latex}$`));
    expect(f.answer).toEqual(["$\\approx 5$"]);
  });
  it("a fraction with a sum underneath gets a Denominator step", () => {
    const f = Q.fraction("f", "level3", "610", ["28", "+", "21"]);
    expect(f.explanation.map((l) => l.split(":")[0])).toEqual(["Original", "Round to 1 s.f.", "Denominator", "Calculate"]);
    expect(f.answer).toEqual(["$\\approx 12$"]);
  });
  it("rounding follows the digit rule, including the edges", () => {
    for (const [n, answer, verdict] of [["95", "$100$", "round up"], ["349", "$300$", "round down"], ["305", "$300$", "round down"], ["450", "$500$", "round up"], ["0.039", "$0.04$", "round up"], ["12400", "$10{,}000$", "round down"]]) {
      const q = Q.rounding("r", n, "level1");
      expect(q.answer, n).toEqual([answer]);
      expect(q.explanation[1], n).toContain(verdict);
    }
  });
});

describe("deck checks", () => {
  it("a well-formed deck built from the kit passes", async () => {
    const deck = await deckOf([
      S.title("t-title", "Test deck", "Subtitle"),
      S.board("t-board", "Estimate a sum", "Set it out.", { head: ["Calculation", "Estimate"], given: 1, rows: [["$48 + 31$", "$80$"]] }, "structure"),
      S.deliberate("t-set", "Estimate products", set(6), "Practise multiplying rounded numbers."),
      S.general("t-gen", "Whiteboards", "estimation", { sub: "estimation", level: "level1" }, 3, "Repeat practice, Level 1."),
    ]);
    const report = await checkDeckContent(deck);
    expect(report.problems).toEqual([]);
  });
  it("catches a short set, broken maths, a wrong answer and an unknown tool", async () => {
    const wrong = Q.estimate("w", "level1", "48", "\\times", "31"); wrong.answer = ["$\\approx 1400$"];
    const deck = await deckOf([
      S.deliberate("t-short", "Short", set(4, "a")),
      S.deliberate("t-bad", "Bad maths", [...set(4, "b"), Q.open("t-x", "estimation", "level1", "Estimate: $\\frac{1$", "$1$")]),
      S.deliberate("t-wrong", "Wrong", [...set(4, "c"), wrong]),
      S.general("t-nope", "Nope", "no-such-tool", { level: "level1" }, 1),
    ]);
    const text = (await checkDeckContent(deck)).problems.join("\n");
    expect(text).toContain("slide 1 (t-short): a deliberate-practice set has 4 questions");
    expect(text).toContain("maths does not render");
    expect(text).toContain("is not where the working ends (1{,}500)");
    expect(text).toContain('"no-such-tool" is not a tool a deck can run');
  });
  it("catches text that cannot fit, text that is too small and a Depth card that reuses the deck's numbers", async () => {
    const deck = await deckOf([
      S.board("t-wrap", "Round decimals to 1 significant figure and then explain it", "A prompt.", { head: ["a"], rows: [["$649$"]] }, "structure"),
      S.depth("t-depth", "estimation", "est-round-649", "Depth"),
    ]);
    // the title keeps the size it was given (a hand-set size is never fitted), so its overflow is reported; the next text is too small
    deck.slides[0].els = deck.slides[0].els.map((e, i) => (e.kind === "text" && i === 0 ? { ...e, fixed: true } : i === 1 && e.kind === "text" ? { ...e, size: 20 } : e));
    const text = (await checkDeckContent(deck)).problems.join("\n");
    expect(text).toContain("probably does not fit its box");
    expect(text).toContain("under the 26 minimum");
    expect(text).toContain("a Depth card should ask something new, but 649");
  });
  it("every built deck passes", async () => {
    for (const d of DECKS as DeckDef[]) expect((await checkDeckContent(d)).problems, d.id).toEqual([]);
  }, 120000);
});
