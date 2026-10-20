import { describe, it, expect } from "vitest";
import { __test } from "../tools/Number/Rounding";

const gen = (tool: string, level: "level1" | "level2" | "level3", ms: Record<string, boolean>) =>
  __test.generateQuestion(tool, level, {}, "digit", ms) as any;

describe("Rounding — Numbers option (significant figures)", () => {
  for (const level of ["level1", "level2", "level3"] as const) {
    it(`${level}: wholes only never has a decimal part`, () => {
      for (let i = 0; i < 60; i++) {
        const q = gen("sf", level, { wholes: true, decimals: false });
        const num = (q.kind === "worded" ? q.lines[0] : q.display) as string;
        const n = num.match(/[\d,.{}]+/)![0];
        expect(n.includes(".")).toBe(false);
      }
    });
    it(`${level}: decimals only always has a decimal part`, () => {
      for (let i = 0; i < 60; i++) {
        const q = gen("sf", level, { wholes: false, decimals: true });
        const num = (q.kind === "worded" ? q.lines[0] : q.display) as string;
        expect(num.match(/[\d,.{}]+/)![0].includes(".")).toBe(true);
      }
    });
  }
});

describe("Rounding — Reveal ends & midpoint (Level 2)", () => {
  it("before the plot gives Show Ends then Show Plot when students plot it", () => {
    const q = gen("nearest", "level2", { blank: true, endsGiven: false, endsFirst: true, withAnswer: false, student: true, auto: false });
    expect(q._stagedReveal).toEqual(["Show Ends", "Show Plot"]);
  });
  it("plotted for them leaves only Show Ends", () => {
    const q = gen("nearest", "level2", { blank: true, endsGiven: false, endsFirst: true, withAnswer: false, student: false, auto: true });
    expect(q._stagedReveal).toEqual(["Show Ends"]);
  });
  it("default is unchanged: Show Plot", () => {
    // exclusive pools arrive from ToolShell with exactly one option on
    const q = gen("nearest", "level2", { blank: true, endsGiven: false, endsFirst: false, withAnswer: true, student: true, auto: false });
    expect(q._stagedReveal).toBe("Show Plot");
  });
});

// ── helpers shared by the significant-figure tests ────────────────────────────

/** An independent significant-figure counter (regex based, not sharing code with the tool). */
function sfCount(n: string): number {
  if (n.includes(".")) return n.replace(".", "").replace(/^0+/, "").length;
  return n.replace(/^0+/, "").replace(/0+$/, "").length;
}
function sfDigits(n: string): string[] {
  const d = n.replace(".", "");
  const trimmed = n.includes(".") ? d.replace(/^0+/, "") : d.replace(/^0+/, "").replace(/0+$/, "");
  return trimmed.split("");
}
const numberIn = (line: string) => line.match(/\$([\d,{}.]+)\$/)![1].replace(/[,{}]/g, "");
const plain = (s: string) => s.replace(/,/g, "");

/** Exact round-half-up of a plain decimal string to n significant figures, by digit strings (independent of the tool). */
function roundSf(s: string, n: number): string {
  const [ip, fp = ""] = s.split(".");
  const digits = ip + fp, ptr0 = ip.length;
  const first = digits.search(/[1-9]/);
  const keep = first + n;
  const head = digits.slice(0, keep);
  let kept = (BigInt(head || "0") + (digits[keep] !== undefined && digits[keep] >= "5" ? 1n : 0n)).toString().padStart(head.length, "0");
  const shift = kept.length > head.length ? 1 : 0;
  const out = kept.padEnd(Math.max(digits.length, keep) + shift, "0");
  const ptr = ptr0 + shift;
  const len = Math.max(keep + shift, ptr);
  const body = out.slice(0, len).padEnd(len, "0");
  return len > ptr ? `${body.slice(0, ptr)}.${body.slice(ptr)}` : body;
}
const kindOf = (n: string) => {
  const d = n.replace(".", "");
  const hasLeading = /^0\.0/.test(n);
  const first = d.search(/[1-9]/), lastNZ = d.length - 1 - [...d].reverse().findIndex(c => c !== "0");
  const trapped = [...d].some((c, i) => c === "0" && i > first && i < lastNZ);
  const trailing = d.endsWith("0") && !hasLeading ? true : /0$/.test(d);
  return { hasLeading, trapped, trailing, anyZero: d.includes("0") };
};

describe("Rounding — Significant Figures levels (zeros ladder)", () => {
  const msFor = (extra: Record<string, boolean>) => extra;
  const parts = (q: any) => {
    const text = (q.kind === "worded" ? q.lines[0] : q.display) as string;
    const m = text.match(/Round \$?([\d,{}.]+)\$? to (\d) significant/)!;
    return { num: plain(m[1].replace(/[{}]/g, "")), n: Number(m[2]) };
  };
  const cases: Array<[string, "level1" | "level2" | "level3", Record<string, boolean>, (n: string) => boolean]> = [
    ["L1 none", "level1", { none: true, trapped: false }, n => !kindOf(n).anyZero],
    ["L1 trapped", "level1", { none: false, trapped: true }, n => kindOf(n).trapped && !kindOf(n).hasLeading && !/0$/.test(n.replace(".", ""))],
    ["L2 leading", "level2", { leading: true, trailing: false }, n => kindOf(n).hasLeading && !kindOf(n).trapped],
    ["L2 trailing", "level2", { leading: false, trailing: true }, n => !n.startsWith("0") && !kindOf(n).trapped],
    ["L3 none", "level3", { none: true, trapped: false, leading: false, trailing: false }, n => !kindOf(n).anyZero],
    ["L3 trapped", "level3", { none: false, trapped: true, leading: false, trailing: false }, n => kindOf(n).trapped && !n.startsWith("0")],
    ["L3 leading", "level3", { none: false, trapped: false, leading: true, trailing: false }, n => kindOf(n).hasLeading],
    ["L3 trailing", "level3", { none: false, trapped: false, leading: false, trailing: true }, n => !n.startsWith("0") && !kindOf(n).trapped],
  ];
  for (const [label, level, ms, ok] of cases) {
    it(`${label}: the number is of that zero kind and the answer is the exact s.f. rounding`, () => {
      for (let i = 0; i < 250; i++) {
        const q = gen("sf", level, { ...msFor(ms), sf1: true, sf2: true, sf3: true, off: true, labelled: false, blank: false });
        const { num, n } = parts(q);
        expect(ok(num), `${label}: ${num}`).toBe(true);
        expect(plain(q.answer), `${num} to ${n} s.f.`).toBe(roundSf(num, n));
      }
    });
  }
  it("trailing zeros: the number ends in zero or the decimal answer keeps one", () => {
    for (let i = 0; i < 300; i++) {
      const q = gen("sf", "level2", { leading: false, trailing: true, off: true, labelled: false, blank: false });
      const { num } = parts(q);
      const ans = plain(q.answer);
      expect(/0$/.test(num) || (ans.includes(".") && ans.endsWith("0")), num).toBe(true);
    }
  });
  it("trapped zeros sit among the first n + 1 significant digits", () => {
    for (let i = 0; i < 300; i++) {
      const { num, n } = parts(gen("sf", "level1", { none: false, trapped: true, off: true, labelled: false, blank: false }));
      const d = num.replace(".", "");
      const first = d.search(/[1-9]/);
      const zi = [...d].findIndex((c, j) => c === "0" && j > first);
      expect(zi - first, num).toBeLessThanOrEqual(n);
    }
  });
  it("whole numbers and decimals options are honoured; leading zeros force a decimal", () => {
    for (let i = 0; i < 200; i++) {
      expect(parts(gen("sf", "level3", { wholes: true, decimals: false })).num.includes(".")).toBe(false);
      expect(parts(gen("sf", "level3", { wholes: false, decimals: true })).num.includes(".")).toBe(true);
      expect(parts(gen("sf", "level2", { leading: true, trailing: false, wholes: true, decimals: true })).num.startsWith("0.0")).toBe(true);
    }
  });
  it("the number line is optional at Levels 1–2 and never at Level 3", () => {
    expect(gen("sf", "level1", { off: true, labelled: false, blank: false }).kind).toBe("worded");
    expect(gen("sf", "level2", { off: false, labelled: true, blank: false })._rounding.level).toBe("level1");
    expect(gen("sf", "level2", { off: false, labelled: false, blank: true })._rounding.level).toBe("level2");
    expect(gen("sf", "level3", { off: false, labelled: true, blank: false }).kind).toBe("worded");
  });
  it("the line, when on, still carries a plot / ends staged reveal", () => {
    const q = gen("sf", "level1", { off: false, labelled: false, blank: true, endsFirst: true, withAnswer: false, student: true, auto: false });
    expect(q._stagedReveal).toEqual(["Show Ends", "Show Plot"]);
  });
});

describe("Rounding — Identify Sig. Figs (same zeros ladder)", () => {
  const ordinals: Record<string, number> = { "1st": 1, "2nd": 2, "3rd": 3 };
  const levels: Array<["level1" | "level2" | "level3", string[]]> = [["level1", ["none", "trapped"]], ["level2", ["leading", "trailing"]], ["level3", ["none", "trapped", "leading", "trailing"]]];
  for (const [level] of levels) {
    it(`${level}: every answer matches an independent counter`, () => {
      for (let i = 0; i < 1200; i++) {
        const q = gen("identifySf", level, {});
        const line = q.lines[0] as string;
        const n = numberIn(line);
        const digits = sfDigits(n);
        if (line.startsWith("How many")) expect(q.answer).toBe(String(sfCount(n)));
        else if (line.startsWith("Circle")) expect(q.answer).toBe(digits.join(", "));
        else {
          const k = ordinals[line.match(/the (\dst|\dnd|\drd)/)![1]];
          // the answer is the number again with the kth significant figure underlined
          const al = q.answerLatex as string;
          expect(al.replace(/\\underline\{(\d)\}/, "$1").replace(/\{,\}/g, ""), "same number").toBe(n.replace(/,/g, ""));
          const all = al.replace(/\{,\}/g, "").replace(/[^\d]*$/, "");
          const ds = [...al.replace(/\\underline\{(\d)\}/, "<$1>").replace(/\{,\}/g, "").replace(/\./g, "")].filter(c => /[\d<>]/.test(c)).join("");
          const flat = ds.replace(/[<>]/g, ""), at = ds.indexOf("<");
          let first = flat.search(/[1-9]/);
          expect(at - 0, `underlined digit position in ${n}`).toBe(first + k - 1);
          void all; void digits;
        }
      }
    });
  }
  it("Level 1 is name-only, with no zeros or only trapped zeros", () => {
    for (let i = 0; i < 400; i++) {
      const q = gen("identifySf", "level1", {});
      expect((q.lines[0] as string).startsWith("Underline the")).toBe(true);
      const k = kindOf(numberIn(q.lines[0]));
      expect(k.hasLeading).toBe(false);
      expect(/0$/.test(numberIn(q.lines[0]).replace(".", ""))).toBe(false);
    }
  });
  it("Level 2 numbers have leading or trailing zeros, each about half the time", () => {
    let leading = 0;
    const N = 3000;
    for (let i = 0; i < N; i++) {
      const n = numberIn(gen("identifySf", "level2", {}).lines[0]);
      if (/^0\.0/.test(n)) leading++; else expect(/0$/.test(n.replace(".", "")), n).toBe(true);
    }
    expect(leading / N).toBeGreaterThan(0.45);
    expect(leading / N).toBeLessThan(0.55);
  });
  it("targeting one zero kind works at every level", () => {
    for (let i = 0; i < 200; i++) {
      expect(numberIn(gen("identifySf", "level1", { none: true, trapped: false }).lines[0]).includes("0")).toBe(false);
      expect(kindOf(numberIn(gen("identifySf", "level1", { none: false, trapped: true }).lines[0])).trapped).toBe(true);
      expect(/^0\.0/.test(numberIn(gen("identifySf", "level2", { leading: true, trailing: false }).lines[0]))).toBe(true);
      expect(/0$/.test(numberIn(gen("identifySf", "level2", { leading: false, trailing: true }).lines[0]).replace(".", ""))).toBe(true);
      expect(/^0\.0/.test(numberIn(gen("identifySf", "level3", { none: false, trapped: false, leading: true, trailing: false }).lines[0]))).toBe(true);
    }
  });
  it("whole numbers and decimals options are honoured and 120.00-style trailing zeros count", () => {
    for (let i = 0; i < 300; i++) {
      expect(numberIn(gen("identifySf", "level3", { wholes: true, decimals: false }).lines[0]).includes(".")).toBe(false);
      expect(numberIn(gen("identifySf", "level3", { wholes: false, decimals: true }).lines[0]).includes(".")).toBe(true);
    }
    expect(sfCount("120.00")).toBe(5);
    expect(sfCount("1200")).toBe(2);
    expect(sfCount("0.002040")).toBe(4);
  });
  it("tasks can be restricted (Levels 2–3)", () => {
    for (let i = 0; i < 100; i++) {
      expect((gen("identifySf", "level2", { mark: false, name: false, count: true }).lines[0] as string).startsWith("How many")).toBe(true);
    }
  });
});
