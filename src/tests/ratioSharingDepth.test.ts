import { describe, it, expect } from "vitest";
import { DEPTH_ITEMS } from "../tools/Proportion/RatioSharingDepth";
import { MISCONCEPTIONS } from "../shared/misconceptions";

// Every number the Ratio Sharing Depth bank (specs/depth/ratio-sharing.md) asks, recomputed here; the wrong options' values come
// from running their method, and each must differ from the right answer. depth.test.ts checks the shape of every bank.

const item = (id: string) => DEPTH_ITEMS.find((i) => i.id === id)!;
const text = (id: string) => JSON.stringify(item(id));
const has = (id: string, ...bits: string[]) => bits.forEach((b) => expect(text(id), `${id}: ${b}`).toContain(b));

describe("Ratio Sharing Depth: the numbers", () => {
  it("has the fifteen items (four, six and five), with one Start here a level", () => {
    expect(DEPTH_ITEMS.length).toBe(15);
    expect(["level1", "level2", "level3"].map((l) => DEPTH_ITEMS.filter((i) => i.level === l).length)).toEqual([4, 6, 5]);
    expect(DEPTH_ITEMS.filter((i) => i.startHere).map((i) => i.level)).toEqual(["level1", "level2", "level3"]);
  });

  it("level 1: £60 in 2 : 3, the one part, the check, whole pounds", () => {
    const part = 60 / (2 + 3);
    expect([2 * part, 3 * part, part]).toEqual([24, 36, 12]);
    has("rs-what-is-12", "$2 \\\\times 12 = 24$", "$3 \\\\times 12 = 36$");
    expect(75 / 5).toBe(15); expect(3 * 15).toBe(45); expect(30 + 35).toBe(65); expect(30 + 45).toBe(75);
    has("rs-check-first", "$3 \\\\times 15 = 45$", "£30 + £35 = £65");
    expect(60 % 5).toBe(0); expect(50 % 7).not.toBe(0);
  });

  it("level 2: £108 in 4 : 5 and the wrong divisions; known share 3 : 5 with £24; difference 3 : 7 with £48; the shortcut", () => {
    const share = 108 / (4 + 5);
    expect([share, 4 * share, 5 * share]).toEqual([12, 48, 60]);
    expect(108 / 4).toBe(27); expect(108 / 5).toBeCloseTo(21.6, 9); expect(27 + 21.6).not.toBe(108);
    has("rs-who-is-right", "$108 \\\\div 4 = 27$", "$108 \\\\div 5 = 21.60$", "$4 \\\\times 12 = 48$", "£48 + £60 = £108", "£48.60");
    const part = 24 / 3;
    expect([part, 5 * part, 8 * part, 24 * 5, 24 * 8]).toEqual([8, 40, 64, 120, 192]);
    expect(new Set([24, 40, 192, 64]).size).toBe(4);
    has("rs-known-share", "$24 \\\\div 3 = 8$", "$8 \\\\times 5 = 40$", "$24 \\\\times 5 = 120$");
    has("rs-known-total", "£192", "£64", "£24 + £40 = £64");
    const dpart = 48 / (7 - 3);
    expect([3 * dpart, 7 * dpart, 10 * dpart]).toEqual([36, 84, 120]);
    expect(48 / 10).toBe(4.8); expect(3 * 4.8).toBeCloseTo(14.4, 9);
    has("rs-diff-total", "$48 \\\\div 4 = 12$", "$36 + 84 = 120$");
    has("rs-diff-divisor", "4.80", "14.40", "$3 \\\\times 12 = 36$");
    expect(5 - 4).toBe(1); expect([4 * 9, 5 * 9]).toEqual([36, 45]);
    has("rs-one-part-gap", "£36 and £45", "$7 - 3 = 4$");
  });

  it("level 3: which first step, three parts, simplifying, the check, the biggest share", () => {
    expect([30 / 5, 30 / 2, 30 / (3 - 2)]).toEqual([6, 15, 30]);
    const part = 90 / (2 + 3 + 5);
    expect([part, 2 * part, 3 * part, 5 * part, 90 / 5, 90 / 3]).toEqual([9, 18, 27, 45, 18, 30]);
    has("rs-three-parts", "$90 \\\\div 10 = 9$", "$2 \\\\times 9 = 18$", "$3 \\\\times 9 = 27$", "$5 \\\\times 9 = 45$");
    expect([120 / 5 * 2, 120 / 5 * 3, 120 / 15 * 6, 120 / 15 * 9]).toEqual([48, 72, 48, 72]);
    has("rs-simplify-first", "£48 and £72", "£8");
    expect(84 / 7).toBe(12); expect(4 * 12).toBe(48); expect(12 + 24 + 58).toBe(94); expect(12 + 24 + 48).toBe(84);
    has("rs-check-three", "$4 \\\\times 12 = 48$", "£94");
    expect([4 / 7 > 1 / 2, 5 / 10 === 1 / 2, 5 / 12 < 1 / 2]).toEqual([true, true, true]);
    has("rs-biggest-share", "\\\\frac47", "\\\\frac{5}{12}");
  });

  it("every wrong option gives a different value from the right one, and its tag exists", () => {
    const wrong: [string, number[], number][] = [["rs-known-total", [24, 40, 192], 64], ["rs-diff-total", [48, 84], 120], ["rs-three-parts", [18, 30], 9]];
    for (const [id, bad, right] of wrong) { expect(bad).not.toContain(right); has(id, `£${right}`); }
    for (const i of DEPTH_ITEMS) for (const o of i.options ?? []) if (o.tag) expect(MISCONCEPTIONS[o.tag], `${i.id}: ${o.tag}`).toBeTruthy();
  });

  it("needs: only the three-part cards need Three Parts", () => {
    expect(DEPTH_ITEMS.filter((i) => i.needs).map((i) => i.id)).toEqual(["rs-three-parts", "rs-check-three"]);
  });
});
