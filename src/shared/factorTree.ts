// The factor tree: the pure logic behind the deck's Factor tree slide piece. A tree is a number that splits into two numbers (each
// bigger than 1) until every branch ends in a prime; a prime is circled and stops. Primality comes from the number itself, so a wrong
// circle cannot be authored. No React in here.

import { PRIME_COLOURS, isPrime } from "./numberGrid";

/** One number in a tree. `kids` is the split (two numbers that multiply to `n`); a prime has none. `given` shows the number in the
 *  Structure only state (the root is always shown, and so are the ancestors of a given number): it makes a partly drawn tree. */
export interface TreeNode { n: number; kids?: [TreeNode, TreeNode]; given?: boolean }

/** The extra clicks a staged tree can take after its last split, in the order they are listed:
 *  `product` the primes written as a product under the tree; `counts` a tally of how many of each prime; `index` the tally's index
 *  column and the product in index form. */
export type TreeReveal = "product" | "counts" | "index";
export const TREE_REVEALS: readonly TreeReveal[] = ["product", "counts", "index"];

/** Primes 11 to 19 and beyond get one neutral ring; 2, 3, 5 and 7 keep the number grid's colours. */
const NEUTRAL_RING = "#1e3a8a";
export const primeColour = (p: number): string => PRIME_COLOURS[p] ?? NEUTRAL_RING;

/** The primes at the ends of the tree, smallest first (the product as it is written). */
export function treeLeaves(tree: TreeNode): number[] {
  const out: number[] = [];
  const walk = (t: TreeNode) => { if (t.kids) t.kids.forEach(walk); else out.push(t.n); };
  walk(tree);
  return out.sort((a, b) => a - b);
}
/** How many splits the tree has (one click each when staged). */
export const splitCount = (tree: TreeNode): number => (tree.kids ? 1 + splitCount(tree.kids[0]) + splitCount(tree.kids[1]) : 0);
/** The tally: each prime and how many times it ends a branch, smallest prime first. */
export function tallyOf(tree: TreeNode): { p: number; count: number }[] {
  const counts = new Map<number, number>();
  for (const p of treeLeaves(tree)) counts.set(p, (counts.get(p) ?? 0) + 1);
  return [...counts].map(([p, count]) => ({ p, count })).sort((a, b) => a.p - b.p);
}
/** The primes written as a product, smallest first: "2 × 2 × 5". */
export const productText = (tree: TreeNode): string => treeLeaves(tree).join(" × ");
/** The same in index form, as plain text with ^ for a power ("2^2 × 5"); a prime that appears once is written alone. */
export const indexText = (tree: TreeNode): string => tallyOf(tree).map(({ p, count }) => (count > 1 ? `${p}^${count}` : `${p}`)).join(" × ");

/** What is wrong with a tree, in plain words (empty when it is a good one). */
export function treeProblems(tree: TreeNode): string[] {
  const problems: string[] = [];
  const walk = (t: TreeNode) => {
    if (!Number.isInteger(t.n) || t.n < 2) { problems.push(`${t.n} cannot be in a factor tree (every number is a whole number bigger than 1)`); return; }
    if (!t.kids) { if (!isPrime(t.n)) problems.push(`${t.n} is not prime, so the tree must split it`); return; }
    const [a, b] = t.kids;
    if (isPrime(t.n)) problems.push(`${t.n} is prime, so it cannot be split`);
    if (a.n === 1 || b.n === 1) problems.push(`${t.n} is split using 1, which never ends`);
    if (a.n * b.n !== t.n) problems.push(`${a.n} × ${b.n} is not ${t.n}`);
    walk(a); walk(b);
  };
  walk(tree);
  return problems;
}

/** A number placed on the tree's canvas. `stage` is the click it appears on (0 is when the slide opens). */
export interface PlacedNode { id: string; n: number; x: number; y: number; depth: number; parent: string | null; prime: boolean; given: boolean; shown: boolean; stage: number }
interface TreeLayout { nodes: PlacedNode[]; width: number; height: number; slot: number; level: number }

const TREE_SLOT = 150;     // the width given to each prime at the bottom
const TREE_LEVEL = 140;    // the height of each row

/** Lays the whole tree out at its full size (so nothing moves as the splits appear). Each prime at the bottom gets its own slot, left
 *  to right; a split sits over the middle of its two numbers. A split appears on the click its position has in reading order (top row
 *  first, left to right), and `shown` is true for the root, every given number and the ancestors of a given number (Structure only). */
export function layoutTree(tree: TreeNode): TreeLayout {
  const nodes: PlacedNode[] = [];
  const byNode = new Map<TreeNode, PlacedNode>();
  let slotIndex = 0, maxDepth = 0;
  const place = (t: TreeNode, depth: number, parent: string | null, id: string): PlacedNode => {
    maxDepth = Math.max(maxDepth, depth);
    const placed: PlacedNode = { id, n: t.n, x: 0, y: depth * TREE_LEVEL, depth, parent, prime: !t.kids, given: !!t.given, shown: false, stage: 0 };
    nodes.push(placed); byNode.set(t, placed);
    if (t.kids) {
      const a = place(t.kids[0], depth + 1, id, `${id}0`), b = place(t.kids[1], depth + 1, id, `${id}1`);
      placed.x = (a.x + b.x) / 2;
    } else placed.x = slotIndex++ * TREE_SLOT;
    return placed;
  };
  place(tree, 0, null, "r");
  // reading order: a split is one click, top row first, then left to right
  const splits = [...byNode.entries()].filter(([t]) => t.kids).map(([, p]) => p).sort((a, b) => a.depth - b.depth || a.x - b.x);
  splits.forEach((s, i) => { nodes.filter((n) => n.parent === s.id).forEach((n) => { n.stage = i + 1; }); });
  // Structure only: the root, the given numbers and the numbers above them
  const mark = (t: TreeNode): boolean => {
    const here = byNode.get(t)!;
    const below = t.kids ? t.kids.map(mark).some(Boolean) : false;
    here.shown = t === tree || here.given || below;
    return here.shown;
  };
  mark(tree);
  return { nodes, width: Math.max(1, slotIndex) * TREE_SLOT, height: (maxDepth + 1) * TREE_LEVEL, slot: TREE_SLOT, level: TREE_LEVEL };
}

/** Extra clicks a staged tree takes after the click it appears on: one per split, then one per `reveal` entry. */
export const treeSteps = (tree: TreeNode, reveal: readonly TreeReveal[] = []): number => splitCount(tree) + reveal.length;

/** A tree for `n` that splits off the smallest prime each time (the ladder shape); the editor starts a new tree with it. A prime is a
 *  tree of one number. Use `n >= 2`. */
export function autoTree(n: number): TreeNode {
  if (!Number.isInteger(n) || n < 2 || isPrime(n)) return { n };
  let p = 2;
  while (n % p !== 0) p++;
  return { n, kids: [{ n: p }, autoTree(n / p)] };
}

/** Every way to split `n` into two numbers bigger than 1, in both orders (the left number first), smallest left number first:
 *  200 gives 2 × 100, 4 × 50, 5 × 40, 8 × 25, 10 × 20, 20 × 10 and so on. A prime has none. */
export function factorPairs(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let a = 2; a < n; a++) if (n % a === 0) out.push([a, n / a]);
  return out;
}

/** The numbers in a tree that can still be split in a different way (every non-prime), in reading order, each with the path to it
 *  (0 for the left number of a split, 1 for the right). */
export function splittable(tree: TreeNode): { path: number[]; n: number; depth: number }[] {
  const out: { path: number[]; n: number; depth: number }[] = [];
  const walk = (t: TreeNode, path: number[]) => { if (!isPrime(t.n)) out.push({ path, n: t.n, depth: path.length }); if (t.kids) { walk(t.kids[0], [...path, 0]); walk(t.kids[1], [...path, 1]); } };
  walk(tree, []);
  return out.sort((x, y) => x.depth - y.depth || x.path.join("").localeCompare(y.path.join("")));
}

/** The tree with the number at `path` split as `a × (n / a)` instead, each new number then split off its smallest prime as `autoTree`
 *  does; the author can split those again. The number keeps its `given` mark. `a` must divide it and leave both parts bigger than 1. */
export function withSplit(tree: TreeNode, path: number[], a: number): TreeNode {
  if (path.length === 0) {
    if (a < 2 || tree.n % a !== 0 || tree.n / a < 2) return tree;
    return { n: tree.n, ...(tree.given ? { given: true } : {}), kids: [autoTree(a), autoTree(tree.n / a)] };
  }
  if (!tree.kids) return tree;
  const [i, ...rest] = path;
  const kids: [TreeNode, TreeNode] = [tree.kids[0], tree.kids[1]];
  kids[i] = withSplit(kids[i], rest, a);
  return { ...tree, kids };
}

/** The split a number currently has, as its left number (0 when it is prime), so a picker can show it. */
export function splitOf(tree: TreeNode, path: number[]): number {
  let t = tree;
  for (const i of path) { if (!t.kids) return 0; t = t.kids[i]; }
  return t.kids ? t.kids[0].n : 0;
}
