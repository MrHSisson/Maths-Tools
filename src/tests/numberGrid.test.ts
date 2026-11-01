import { describe, expect, it } from "vitest";
import { GRID_MAX, PRIME_COLOURS, SIEVE_PRIMES, circlePath, fillTimesTable, isPrime, multiplesOf, primesUpTo, scribblePath, sieveAt, sieveSteps, sieveSurvivors, type GridMark } from "../shared/numberGrid";
import { hundredSquareSheet } from "../shared/printables";
import { S } from "../decks/builder";

describe("the 1 to 100 number grid", () => {
  it("the sieve with 2, 3, 5 and 7 leaves exactly the 25 primes below 100", () => {
    expect(primesUpTo()).toHaveLength(25);
    expect(sieveSurvivors()).toEqual(primesUpTo());
    expect(SIEVE_PRIMES).toEqual([2, 3, 5, 7]);
    expect(11 * 11).toBeGreaterThan(GRID_MAX);         // why the sieve stops at 7
  });

  it("the finished sieve circles every prime and scribbles every other number, once each", () => {
    const m = sieveAt(sieveSteps());
    for (let n = 1; n <= GRID_MAX; n++) {
      expect(m.has(n), `${n} is marked`).toBe(true);
      expect(m.get(n)!.circle, `${n}`).toBe(isPrime(n));
    }
    expect(m.get(1)!.circle).toBe(false);
    expect(m.get(36)!.colour).toBe(PRIME_COLOURS[2]);   // marked by the first prime that reaches it
    expect(m.get(15)!.colour).toBe(PRIME_COLOURS[3]);
    expect(m.get(35)!.colour).toBe(PRIME_COLOURS[5]);
    expect(m.get(49)!.colour).toBe(PRIME_COLOURS[7]);
  });

  it("builds a click at a time: 1 first, then each prime's times table, and the leftover primes only at the end", () => {
    expect(sieveSteps()).toBe(5);
    expect(sieveAt(0).size).toBe(0);
    expect([...sieveAt(1).keys()]).toEqual([1]);
    const afterTwos = sieveAt(2);
    expect([...afterTwos.keys()].sort((a, b) => a - b)).toEqual([1, ...multiplesOf(2)]);
    expect(afterTwos.get(2)!.circle).toBe(true);
    expect(afterTwos.has(11)).toBe(false);
    expect(sieveAt(5).has(11)).toBe(true);
  });

  it("finishing a times table keeps every mark already tapped", () => {
    const tapped = new Map<number, GridMark>([[6, { colour: PRIME_COLOURS[3], circle: false }], [4, { colour: PRIME_COLOURS[2], circle: false }]]);
    const done = fillTimesTable(tapped, 2);
    expect(done.get(6)).toEqual(tapped.get(6));                 // 6 stays green, it was tapped as a multiple of 3
    expect(done.get(4)).toEqual(tapped.get(4));
    expect(done.get(2)!.circle).toBe(true);
    expect([...done.keys()].filter((n) => n % 2 === 0)).toHaveLength(50);
    expect(tapped.size).toBe(2);                                // the old map is not changed
  });

  it("a scribble or ring is the same every time for the same number, and differs between numbers", () => {
    expect(scribblePath(12, 100, 100)).toBe(scribblePath(12, 100, 100));
    expect(scribblePath(12, 100, 100)).not.toBe(scribblePath(13, 100, 100));
    expect(circlePath(7, 100, 100)).toBe(circlePath(7, 100, 100));
    expect(scribblePath(12, 100, 100)).toMatch(/^M[\d. -]+( L[\d. -]+)+$/);
  });

  it("the printable is a plain 1 to 100 grid, two to an A4 page", () => {
    const p = hundredSquareSheet();
    expect([p.columns, p.rows]).toEqual([1, 2]);
    const numbers = [...p.cell.matchAll(/<text[^>]*>(\d+)<\/text>/g)].map((x) => Number(x[1]));
    expect(numbers).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
    expect(p.cell).not.toContain("<path");                      // no marks: pupils scribble themselves
  });

  it("a number grid slide has its click count and the player's board control", () => {
    const slide = S.numberGrid("g", "The sieve", "", "filled", true);
    const el = slide.els.find((e) => e.kind === "numberGrid")!;
    expect(el).toMatchObject({ kind: "numberGrid", fill: "filled", staged: true });
  });
});
