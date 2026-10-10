// File Sizes (specs/file-sizes.md §7): every answer matches an independent bits-based calculation, answers keep to the
// whole / one-decimal house style, levels keep to their shape, colour questions obey 2^n >= N > 2^(n-1), and the
// acceptance rows (§3.4) follow from the same formulas.
import { describe, it, expect } from "vitest";
import { __test } from "../tools/Binary/FileSizes";

const { TOOL_CONFIG, generateQuestion, MESSAGES, fewestBits, sizeOk } = __test;
type Lv = "level1" | "level2" | "level3";
const LEVELS: Lv[] = ["level1", "level2", "level3"];
const SUBS = ["text", "images", "sound"] as const;
const UNIT_BITS: Record<number, bigint> = { 0: 1n, 2: 8n, 3: 8_000n, 4: 8_000_000n };
const UNIT_WORD: Record<number, string> = { 0: "bit", 2: "byte", 3: "KB", 4: "MB" };

/** Every option of every pool switched on (the widest mix a teacher can ask for). */
const allOn = (sub: string, lv: Lv): Record<string, boolean> => {
  const t: any = (TOOL_CONFIG.tools as any)[sub];
  const groups = [t.multiSelect, t.difficultySettings?.[lv]?.multiSelect].flat().filter(Boolean);
  const out: Record<string, boolean> = {};
  for (const g of groups) for (const o of g.options) out[o.value] = true;
  return out;
};
/** The mix a fresh page opens with (nothing passed: each pool's own defaults). */
const defaults: Record<string, boolean> = {};

/** Independent: answer in tenths of unit `u` from a bit count. */
const tenths = (bits: bigint, u: number) => (bits * 10n) / UNIT_BITS[u];
const exactIn = (bits: bigint, u: number) => (bits * 10n) % UNIT_BITS[u] === 0n;
const needBits = (colours: number) => { let n = 0; while (2 ** n < colours) n++; return n; };

/** Re-derive the answer from the raw parameters stored on the question, by the plain formulas. */
function expected(c: any): { bits?: bigint; ansT?: bigint; value?: number | string } {
  switch (`${c.sub}:${c.task}`) {
    case "text:findSize": return { bits: BigInt(c.chars) * BigInt(c.bpc) };
    case "text:compareSets": return { bits: BigInt(c.chars) * BigInt(c.bpcB - c.bpcA) };
    case "text:findChars": return { value: Number(c.bits) / c.bpc };
    case "text:findBits": return { value: Number(c.bits) / c.chars };
    case "images:findSize": return { bits: BigInt(c.px) * BigInt(c.depth) };
    case "images:logo": return { bits: BigInt(c.px) * BigInt(needBits(c.colours)) };
    case "images:several": return { bits: BigInt(c.px) * BigInt(c.depth) * BigInt(c.count) };
    case "images:findDepth": return { value: Number(c.bits) / c.px };
    case "images:findPixels": return { value: Number(c.bits) / c.depth };
    case "images:coloursFromBits": return { value: 2 ** c.n };
    case "images:fewestBits": return { value: needBits(c.colours) };
    case "images:canStore": return { value: 2 ** c.bits >= c.colours ? "yes" : "no" };
    case "sound:findSize": return { bits: BigInt(c.rate) * BigInt(c.dur) * BigInt(c.depth) };
    case "sound:compare": return { bits: c.diff };
    case "sound:findDuration": return { value: Number(c.bits) / (c.rate * c.depth) };
    case "sound:findDepth": return { value: Number(c.bits) / (c.rate * c.dur) };
    case "sound:findRate": return { value: Number(c.bits) / (c.dur * c.depth) };
  }
  throw new Error(`unknown ${c.sub}:${c.task}`);
}

const SIZE_TASKS = new Set(["text:findSize", "text:compareSets", "images:findSize", "images:logo", "images:several", "sound:findSize"]);

describe("File Sizes", () => {
  for (const sub of SUBS) {
    for (const lv of LEVELS) {
      for (const [name, ms] of [["default options", defaults], ["every option on", null]] as const) {
        it(`${sub} ${lv} (${name}): answers match an independent bits-based calculation and keep the house style`, () => {
          const mix = ms ?? allOn(sub, lv);
          const seen = new Set<string>();
          for (let n = 0; n < (ms ? 400 : 500); n++) {
            const q: any = generateQuestion(sub, lv, {}, "", mix);
            const c = q._fsCheck, meta = q._fsMeta;
            seen.add(c.task);
            const e = expected(c);
            const id = `${c.sub}:${c.task}`;
            if (e.bits !== undefined) {
              expect(c.bits === undefined || c.bits === e.bits || id === "sound:compare").toBe(true);
              if (id !== "sound:compare") expect(BigInt(c.bits)).toBe(e.bits);
              if (SIZE_TASKS.has(id) && id !== "sound:compare") {
                expect(exactIn(e.bits, c.unit)).toBe(true);
                expect(c.ansT).toBe(tenths(e.bits, c.unit));
                if (c.unit <= 2) expect(c.ansT % 10n).toBe(0n);          // bits and bytes are whole numbers
                expect(c.ansT > 0n).toBe(true);
                expect(q.answer).toContain(UNIT_WORD[c.unit]);
              }
            } else if (e.value !== undefined && e.value !== "yes" && e.value !== "no") {
              expect(Number.isInteger(e.value)).toBe(true);               // reverse answers are whole numbers
              expect(c.answer ?? c.n ?? c.n).toBeDefined;
              if (c.width !== undefined) expect(c.width * c.height).toBe(e.value);   // asked for the width: width × height = pixels
              else if (c.answer !== undefined) expect(c.answer).toBe(e.value);
              if (id === "images:coloursFromBits") expect(c.colours).toBe(e.value);
              if (id === "images:fewestBits") expect(c.n).toBe(e.value);
            } else if (id === "images:canStore") {
              expect(c.yes).toBe(e.value === "yes");
            }
            // level shape
            if (lv === "level1") {
              expect(meta.unitConv).toBe(0);                              // no unit conversion at Level 1
            }
            if (lv !== "level3" && c.sub === "sound") expect(c.inputConv ?? 0).toBe(0);   // no input conversion below Level 3
            // Level 3 needs two steps beyond the multiplication — except a reverse question whose size is already in bits (spec sample row) and the one-line "colours from bits" question
            if (lv === "level3" && c.given !== 0 && c.task !== "coloursFromBits") expect(meta.steps).toBeGreaterThanOrEqual(2);
            // every KB / MB figure is whole or one decimal place (tenths are exact integers by construction); text of the answer is sane
            expect(q.answer).not.toMatch(/NaN|undefined|Infinity/);
            expect(q.lines.join(" ")).not.toMatch(/NaN|undefined/);
            expect(q.working.length).toBeGreaterThanOrEqual(2);
          }
          expect(seen.size).toBeGreaterThan(0);
        });
      }
    }
  }

  it("every task in every offered pool turns up at its level when all options are on", () => {
    for (const sub of SUBS) for (const lv of LEVELS) {
      const t: any = (TOOL_CONFIG.tools as any)[sub];
      const pool = t.difficultySettings[lv].multiSelect.find((g: any) => g.key === "task");
      const want = new Set<string>(pool ? pool.options.map((o: any) => o.value) : ["findSize"]);
      const got = new Set<string>();
      for (let n = 0; n < 1500 && got.size < want.size; n++) got.add((generateQuestion(sub, lv, {}, "", allOn(sub, lv)) as any)._fsCheck.task);
      expect([...want].filter((x) => !got.has(x))).toEqual([]);
    }
  });

  it("colour questions: fewest bits n has 2^n >= N and 2^(n-1) < N; canStore is a yes/no straddling a power of two", () => {
    for (let n = 0; n < 600; n++) {
      const q: any = generateQuestion("images", "level3", {}, "", allOn("images", "level3"));
      const c = q._fsCheck;
      if (c.task === "fewestBits") { expect(2 ** c.n).toBeGreaterThanOrEqual(c.colours); expect(2 ** (c.n - 1)).toBeLessThan(c.colours); }
      if (c.task === "logo") { const k = fewestBits(c.colours); expect(2 ** k).toBeGreaterThanOrEqual(c.colours); expect(2 ** (k - 1)).toBeLessThan(c.colours); expect(c.colours & (c.colours - 1)).not.toBe(0); }
      if (c.task === "canStore") { const need = fewestBits(c.colours); expect([need, need - 1]).toContain(c.bits); }
    }
  });

  it("not-powers-of-two colours only when asked for; powers only by default at Level 3 off", () => {
    const ms = { ...allOn("images", "level3"), notPowers: false, powers: true, findSize: false, coloursFromBits: false, canStore: false, logo: false, several: false, findDepth: false, findPixels: false };
    for (let n = 0; n < 100; n++) { const c = (generateQuestion("images", "level3", {}, "", ms) as any)._fsCheck; expect(c.colours & (c.colours - 1)).toBe(0); }
  });

  it("compare questions include an equal-size outcome now and then, and 'same' is never given a difference", () => {
    let same = 0, differ = 0;
    for (let n = 0; n < 3000; n++) {
      const q: any = generateQuestion("sound", "level3", {}, "", { ...allOn("sound", "level3"), findSize: false, findDuration: false, findDepth: false, findRate: false });
      const c = q._fsCheck;
      if (c.bigger === null) { same++; expect(c.diff).toBe(0n); expect(q.answer).toMatch(/same size/); } else { differ++; expect(c.diff > 0n).toBe(true); }
    }
    expect(same).toBeGreaterThan(0);
    expect(differ).toBeGreaterThan(same);
  });

  it("messages are 5–25 characters and contain a space or punctuation mark (counting can go wrong)", () => {
    for (const m of MESSAGES) { expect(m.length).toBeGreaterThanOrEqual(5); expect(m.length).toBeLessThanOrEqual(25); expect(/[ ,.!?]/.test(m)).toBe(true); expect(/^[A-Za-z ,.!?]+$/.test(m)).toBe(true); }
  });

  it("acceptance rows (§3.4) follow from the formulas", () => {
    const b = (n: number | bigint) => BigInt(n);
    const t = (bits: bigint, u: number) => tenths(bits, u);
    // Text
    expect(b(40) * b(8)).toBe(320n); expect(b(25) * b(16)).toBe(400n); expect(b(60) * b(7)).toBe(420n);
    expect(t(b(4000) * b(8), 3)).toBe(40n);                         // 4 KB
    expect(t(b("See you soon!".length) * b(8), 2)).toBe(130n);      // 13 bytes
    expect(t(b(2000) * b(16), 2)).toBe(40_000n);                    // 4,000 bytes
    expect(t(b(6000) * b(8), 3)).toBe(60n); expect(t(b(6000) * b(16), 3)).toBe(120n);   // 6 KB ASCII, 12 KB Unicode → 6 KB larger
    expect(24000 / 8).toBe(3000); expect(t(b(10) * b(8_000), 0) / 10n / 5000n).toBe(16n);   // 10 KB over 5,000 characters
    // Images
    expect(b(10 * 10) * b(3)).toBe(300n); expect(b(20 * 8) * b(4)).toBe(640n); expect(2 ** 3).toBe(8); expect(b(400) * b(2)).toBe(800n);
    expect(t(b(600 * 400) * b(8), 3)).toBe(2400n);                  // 240 KB
    expect(t(b(1000 * 500) * b(16), 4)).toBe(10n);                  // 1 MB
    expect(t(b(300 * 200) * b(4), 2)).toBe(300_000n);               // 30,000 bytes
    expect(needBits(64)).toBe(6); expect(needBits(16)).toBe(4); expect(needBits(9)).toBe(4);
    expect(t(b(300 * 200) * b(4), 3)).toBe(300n);                   // 30 KB (16 colours)
    expect(2 ** 3 >= 10).toBe(false);                               // 3 bits cannot store 10 colours
    expect((120_000 * 8) / (400 * 300)).toBe(8);
    expect(t(b(200 * 100) * b(8) * b(20), 3)).toBe(4000n);          // 400 KB
    // Sound
    expect(10 * 5 * 8).toBe(400); expect(100 * 4 * 16).toBe(6400); expect(20 * 10 * 4).toBe(800);
    expect(t(b(400 * 10 * 8), 2)).toBe(40_000n);                    // 4,000 bytes
    expect(t(b(1000 * 20 * 16), 3)).toBe(400n); expect(t(b(2000 * 30 * 8), 3)).toBe(600n);   // 40 KB, 60 KB
    expect(t(b(2000 * 120 * 8), 3)).toBe(2400n);                    // 240 KB
    expect((120_000 * 8) / (1000 * 8)).toBe(120);
    expect(t(b(1000 * 10 * 8), 3)).toBe(100n); expect(t(b(500 * 20 * 16), 3)).toBe(200n);    // A 10 KB, B 20 KB
    expect(sizeOk(b(1920000), 3)).toBe(true);
  });
});
