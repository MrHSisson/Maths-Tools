import { describe, expect, it } from "vitest";
import { autoTree, indexText, layoutTree, primeColour, productText, splitCount, tallyOf, treeLeaves, treeProblems, treeSteps, type TreeNode } from "../shared/factorTree";
import { PRIME_COLOURS, isPrime } from "../shared/numberGrid";
import { S } from "../decks/builder";
import { checkDeckContent } from "../decks/deckChecks";
import { stagedClicks } from "../decks/SlideCanvas";
import type { DeckDef } from "../decks/types";

const t = (n: number, a?: TreeNode, b?: TreeNode, given?: boolean): TreeNode => ({ n, ...(a && b ? { kids: [a, b] as [TreeNode, TreeNode] } : {}), ...(given ? { given } : {}) });
// 28 = 4 x 7, 4 = 2 x 2
const tree28 = t(28, t(4, t(2), t(2)), t(7));

describe("the factor tree", () => {
  it("reads the primes off the ends, smallest first, and multiplies back to the root", () => {
    expect(treeLeaves(tree28)).toEqual([2, 2, 7]);
    expect(productText(tree28)).toBe("2 × 2 × 7");
    expect(treeLeaves(tree28).reduce((a, b) => a * b, 1)).toBe(28);
    expect(splitCount(tree28)).toBe(2);
  });

  it("tallies the primes and writes the index form, with a prime that appears once written alone", () => {
    expect(tallyOf(tree28)).toEqual([{ p: 2, count: 2 }, { p: 7, count: 1 }]);
    expect(indexText(tree28)).toBe("2^2 × 7");
    expect(indexText(autoTree(72))).toBe("2^3 × 3^2");
    expect(indexText(autoTree(220))).toBe("2^2 × 5 × 11");
  });

  it("an automatic tree is always a good one: every end is prime and the ends multiply back", () => {
    for (let n = 2; n <= 999; n++) {
      const tree = autoTree(n);
      expect(treeProblems(tree), `${n}`).toEqual([]);
      expect(treeLeaves(tree).reduce((a, b) => a * b, 1), `${n}`).toBe(n);
      expect(treeLeaves(tree).every(isPrime), `${n}`).toBe(true);
    }
  });

  it("names what is wrong with a bad tree: a split with 1, a wrong product, an unsplit non-prime, a split prime", () => {
    expect(treeProblems(t(20, t(1), t(20)))[0]).toMatch(/using 1/);
    expect(treeProblems(t(20, t(4), t(6)))[0]).toMatch(/not 20/);
    expect(treeProblems(t(20, t(4), t(5)))).toEqual(expect.arrayContaining([expect.stringMatching(/4 is not prime/)]));
    expect(treeProblems(t(5, t(1), t(5)))).toEqual(expect.arrayContaining([expect.stringMatching(/5 is prime/)]));
    expect(treeProblems(t(1))[0]).toMatch(/bigger than 1/);
  });

  it("primes 2, 3, 5 and 7 keep the number grid's colours, every other prime gets one neutral ring", () => {
    for (const p of [2, 3, 5, 7]) expect(primeColour(p)).toBe(PRIME_COLOURS[p]);
    expect(new Set([11, 13, 17, 19].map(primeColour)).size).toBe(1);
  });

  it("lays out at full size: one slot per prime, a split over the middle of its two numbers, and nothing moves between clicks", () => {
    const lay = layoutTree(tree28), again = layoutTree(tree28);
    expect(lay).toEqual(again);
    const byId = new Map(lay.nodes.map((n) => [n.id, n]));
    expect(lay.nodes.filter((n) => n.prime)).toHaveLength(3);
    for (const n of lay.nodes.filter((x) => !x.prime)) {
      const kids = lay.nodes.filter((k) => k.parent === n.id);
      expect(n.x).toBeCloseTo((kids[0].x + kids[1].x) / 2);
      expect(kids.every((k) => k.y === n.y + lay.level)).toBe(true);
    }
    expect(byId.get("r")!.stage).toBe(0);
  });

  it("each split is one click in reading order (top row first, left to right); both numbers of a split appear together", () => {
    const lay = layoutTree(tree28);
    const stages = lay.nodes.filter((n) => n.parent).map((n) => n.stage);
    expect(Math.max(...stages)).toBe(splitCount(tree28));
    const wide = t(30, t(6, t(2), t(3)), t(5)); // splits: 30 first, then 6
    const l2 = layoutTree(wide);
    expect(l2.nodes.filter((n) => n.stage === 1).map((n) => n.n).sort()).toEqual([5, 6]);
    expect(l2.nodes.filter((n) => n.stage === 2).map((n) => n.n).sort()).toEqual([2, 3]);
  });

  it("Structure only shows the root, the numbers given and the numbers above them, nothing else", () => {
    const partly = t(28, t(4, t(2), t(2), true), t(7, undefined, undefined, true), true);
    const lay = layoutTree(partly);
    expect(lay.nodes.filter((n) => n.shown).map((n) => n.n).sort((a, b) => a - b)).toEqual([4, 7, 28]);
    expect(layoutTree(autoTree(20)).nodes.filter((n) => n.shown).map((n) => n.n)).toEqual([20]);
  });

  it("a staged tree takes one click per split plus one per extra reveal", () => {
    expect(treeSteps(tree28)).toBe(2);
    expect(treeSteps(tree28, ["product", "counts", "index"])).toBe(5);
    const slide = S.factorTree("ft", "Tree", tree28, "filled", true, ["counts", "index"]);
    expect(stagedClicks(slide.els.find((e) => e.kind === "factorTree")!)).toBe(4);
  });

  it("the deck check accepts a good tree and names a bad one", async () => {
    const deckOf = (tree: TreeNode): DeckDef => ({ id: "ft-test", title: "t", summary: "", slides: [S.factorTree("a", "Tree", tree)] });
    expect((await checkDeckContent(deckOf(tree28))).problems.filter((p: string) => /not 20|not prime|using 1|is prime/.test(p))).toEqual([]);
    expect((await checkDeckContent(deckOf(t(20, t(4), t(6))))).problems.join(" ")).toMatch(/not 20/);
  });
});
