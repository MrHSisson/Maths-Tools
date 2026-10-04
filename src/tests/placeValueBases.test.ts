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
