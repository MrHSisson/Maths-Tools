import { describe, expect, it, vi } from "vitest";
import { __seed as workDone } from "../tools/FurtherMechanics/WorkDone";
import { __seed as power } from "../tools/FurtherMechanics/Power";
import { __seed as energy } from "../tools/FurtherMechanics/Energy";
import { __seed as elastic } from "../tools/FurtherMechanics/Elastic";
import App from "../tools/FurtherMechanics/Power";
import { resolvedOptions } from "../shared/decision/options";
import type { ShellOption } from "../shared/decision/types";

vi.mock("../devMode", () => ({ useDevMode: () => true }));

// The A2 Questions option: off, no question that needs A2 content is drawn, yet no tab or choice is hidden; the A2 ones are only disabled.
const TOOLS = { workDone, power, energy, elastic } as const;

describe("Further Mechanics: leaving out A2 questions", () => {
  for (const [name, t] of Object.entries(TOOLS)) {
    it(`${name}: nothing A2 is generated with A2 Questions left out, at every level of every tab`, () => {
      for (const s of t.subTools) for (const level of [1, 2, 3].slice(0, (s as { levels?: number }).levels ?? 3)) for (let k = 0; k < 40; k++) {
        const m = t.generate(level, { subTool: s.key, options: { a2: "off" } }).mech!;
        // a tab that is only A2 content is disabled, never drawn from in practice, so only the others are held to it
        if ((s as { disabledWhen?: unknown }).disabledWhen) continue;
        expect(m.a2, `${name} ${s.key} L${level}`).toBe(false);
      }
    });
    it(`${name}: with Only A2 every question needs A2 content, at every level of every tab that can have any`, () => {
      for (const s of t.subTools as Array<{ key: string; levels?: number; disabledWhen?: { values: string[] } }>) {
        const none = s.disabledWhen?.values.includes("only");   // a tab with no A2 content is greyed out, not drawn from
        for (const level of [1, 2, 3].slice(0, s.levels ?? 3)) for (let k = 0; k < 40; k++) {
          if (none) continue;
          const m = t.generate(level, { subTool: s.key, options: { a2: "only" } }).mech!;
          expect(m.a2, `${name} ${s.key} L${level}`).toBe(true);
        }
      }
    });
    it(`${name}: A2 tabs and choices stay on show, only disabled`, () => {
      const subs = t.subTools as Array<{ key: string; when?: unknown; disabledWhen?: unknown }>;
      expect(subs.every((s) => !s.when)).toBe(true);
    });
  }
  it("a choice that is switched off is never drawn from, and a pool left empty falls back to a choice still on", () => {
    const groups = App().props.config.options as ShellOption[];
    const fs = resolvedOptions(groups, { a2: "off", fsAsk: "vector" }, 3, "forcespeed");
    expect(fs.fsAsk).not.toContain("vector");
    expect(fs.fsAsk.length).toBeGreaterThan(0);
    expect(resolvedOptions(groups, { a2: "on", fsAsk: "vector" }, 3, "forcespeed").fsAsk).toBe("vector");
    // Only A2 greys the choices with no A2 content, so a pool left with the A2 choice draws only that
    expect(resolvedOptions(groups, { a2: "only", fsAsk: "power,vector" }, 3, "forcespeed").fsAsk).toBe("vector");
  });
});
