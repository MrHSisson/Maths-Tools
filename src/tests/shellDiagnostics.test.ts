import { describe, it, expect, beforeEach, vi } from "vitest";
import { reportShellFault, shellFaults, clearShellFaults, guarded, describeFault } from "../shared/shellDiagnostics";
import { ShellPartBoundary } from "../shared/components/ShellPartBoundary";
import { buildWorksheet } from "../shared/worksheetGenerate";
import type { AnyQuestion } from "../shared/types";

beforeEach(() => { clearShellFaults(); vi.spyOn(console, "error").mockImplementation(() => {}); });

describe("shell failure reporting", () => {
  it("records which part failed, under which setup, and keeps the last 20", () => {
    const f = reportShellFault("Whiteboard", new Error("boom"), { tool: "evaluate", level: "level2", mode: "whiteboard" });
    expect(f).toMatchObject({ part: "Whiteboard", message: "boom", context: { tool: "evaluate", level: "level2" } });
    for (let i = 0; i < 25; i++) reportShellFault("Worksheet", new Error(`e${i}`));
    expect(shellFaults()).toHaveLength(20);
    expect(shellFaults()[19].message).toBe("e24");
  });
  it("copes with things that are not Errors", () => {
    expect(reportShellFault("X", "just a string").message).toBe("just a string");
    expect(reportShellFault("X", undefined).message).toBe("undefined");
  });
  it("guarded returns the value, or undefined after recording the failure", () => {
    expect(guarded("A", {}, () => 7)).toBe(7);
    expect(guarded("A", { tool: "t" }, () => { throw new Error("no"); })).toBeUndefined();
    expect(shellFaults()[shellFaults().length - 1]?.part).toBe("A");
  });
  it("describes a fault in one plain line", () => {
    const f = reportShellFault("Worksheet generation", new Error("bad key"), { tool: "x", level: "level3", mode: "worksheet" });
    expect(describeFault(f)).toBe('Worksheet generation failed (sub-tool "x", level3, worksheet mode): bad key');
  });
});

describe("a failing screen is isolated", () => {
  it("the boundary switches to its fallback, and records the part by name when it catches", () => {
    expect(ShellPartBoundary.getDerivedStateFromError()).toEqual({ failed: true });
    const b = new ShellPartBoundary({ part: "Whiteboard", context: { tool: "t" }, children: null });
    const setState = vi.fn();
    b.setState = setState;
    b.componentDidCatch(new Error("render failed"));
    expect(setState.mock.calls[0][0].fault).toMatchObject({ part: "Whiteboard", message: "render failed" });
    expect(shellFaults()[shellFaults().length - 1]?.part).toBe("Whiteboard");
  });
  it("tries again when its reset key changes", () => {
    const b = new ShellPartBoundary({ part: "Worksheet", resetKey: 1, children: null });
    b.state = { failed: true, fault: null };
    const setState = vi.fn();
    b.setState = setState;
    b.componentDidUpdate({ part: "Worksheet", resetKey: 1, children: null });   // same key: stays failed
    expect(setState).not.toHaveBeenCalled();
    b.componentDidUpdate({ part: "Worksheet", resetKey: 0, children: null });   // key changed: tries again
    expect(setState).toHaveBeenCalledWith({ failed: false, fault: null });
  });
});

describe("worksheet generation lets a failing generator surface", () => {
  it("throws (so the shell can catch it, name it and keep the sheet on screen) rather than returning a half sheet", () => {
    let n = 0;
    const gen = () => { if (++n > 3) throw new Error("generator broke"); return { kind: "simple", display: "q", answer: "a", working: [], key: String(n), difficulty: "level1" } as unknown as AnyQuestion; };
    const run = () => buildWorksheet({
      tool: "t", numQuestions: 8, smartProgressor: false, generateQuestion: gen as never, generateUniqueQ: gen as never,
      blocks: [{ level: "level1", variables: {}, dropdownValue: "", groups: [], multiSelectValues: {}, calibratedMultiSelectValues: {} }],
    });
    expect(run).toThrow("generator broke");
  });
});
