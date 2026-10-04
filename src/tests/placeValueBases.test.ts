import { describe, it, expect } from "vitest";
import { pvBaseColumnSet, pvBaseCells } from "../shared";

describe("place value table — other bases", () => {
  it("binary columns are place values, with powers as the word form", () => {
    const c = pvBaseColumnSet(2, 8);
    expect(c.columns).toEqual(["128", "64", "32", "16", "8", "4", "2", "1"]);
    expect(c.columnNames[0]).toBe("2⁷");
    expect(c.columnNames[7]).toBe("2⁰");
    expect(c.onesIndex).toBe(7);
  });
  it("hex columns are 16 and 1", () => {
    const c = pvBaseColumnSet(16, 2);
    expect(c.columns).toEqual(["16", "1"]);
    expect(c.columnNames).toEqual(["16¹", "16⁰"]);
  });
  it("cells are zero-padded digits; hex in capitals", () => {
    expect(pvBaseCells(5, 2, 4)).toEqual(["0", "1", "0", "1"]);
    expect(pvBaseCells(173, 16, 2)).toEqual(["A", "D"]);
  });
  it("every n-bit table is the (n-1)-bit table twice, with 0 then 1 in front", () => {
    for (let n = 2; n <= 8; n++) {
      const rows = Array.from({ length: 2 ** n }, (_, i) => pvBaseCells(i, 2, n).join(""));
      const lower = Array.from({ length: 2 ** (n - 1) }, (_, i) => pvBaseCells(i, 2, n - 1).join(""));
      expect(rows.slice(0, lower.length)).toEqual(lower.map((r) => "0" + r));
      expect(rows.slice(lower.length)).toEqual(lower.map((r) => "1" + r));
    }
  });
});

import { rippleIncrement } from "../shared";

describe("carry ripple", () => {
  it("0000 + 1 fits in one beat", () => {
    const r = rippleIncrement(0, 2, 4);
    expect(r.beats).toHaveLength(1);
    expect(r.beats[0].cells.join("")).toBe("0001");
    expect(r.result).toBe(1);
  });
  it("0011 + 1 carries twice, then fits", () => {
    const r = rippleIncrement(3, 2, 4);
    expect(r.beats.map((b) => b.kind)).toEqual(["carry", "carry", "fits"]);
    expect(r.beats.map((b) => b.cells.join(""))).toEqual(["0010", "0000", "0100"]);
    expect(r.beats[0].carryCol).toBe(2);
    expect(r.result).toBe(4);
  });
  it("1111 + 1 overflows to 0000", () => {
    const r = rippleIncrement(15, 2, 4);
    expect(r.beats.map((b) => b.kind)).toEqual(["carry", "carry", "carry", "carry", "overflow"]);
    expect(r.overflow).toBe(true);
    expect(r.result).toBe(0);
    expect(r.beats[4].cells.join("")).toBe("0000");
  });
  it("same idea in denary and hex", () => {
    expect(rippleIncrement(9, 10, 2).beats.map((b) => b.cells.join(""))).toEqual(["00", "10"]);
    expect(rippleIncrement(15, 16, 2).beats.map((b) => b.cells.join(""))).toEqual(["00", "10"]);
  });
  it("final beat always equals the next value, for every 8-bit number", () => {
    for (let n = 0; n < 256; n++) {
      const r = rippleIncrement(n, 2, 8);
      expect(parseInt(r.beats[r.beats.length - 1].cells.join(""), 2)).toBe((n + 1) % 256);
      expect(r.result).toBe((n + 1) % 256);
    }
  });
});
