import { describe, expect, it } from "vitest";
import { generateCpa, referenceCpa } from "../shared/decision/cpa";
import { generateCpaExam } from "../shared/decision/cpaExam";
import { withSeededRandom } from "./seededRandom";

describe("CPA variety", () => {
  it("small networks can have three parallel starters and three immediate predecessors", () => {
    withSeededRandom(901, () => {
      let starters = false, predecessors = false;
      for (let i = 0; i < 70; i++) {
        const { data } = generateCpa(1, "cpaFull");
        expect(data.acts.length).toBeGreaterThanOrEqual(6);
        expect(data.acts.length).toBeLessThanOrEqual(7);
        expect(data.acts.every(a => a.preds.length <= 3)).toBe(true);
        starters ||= data.acts.filter(a => !a.preds.length).length === 3;
        predecessors ||= data.acts.some(a => a.preds.length === 3);
      }
      expect(starters).toBe(true); expect(predecessors).toBe(true);
    });
  });
  it("up-to delays include unchanged and delayed projects with correct worst cases", () => {
    withSeededRandom(902, () => {
      const outcomes = new Set<boolean>();
      for (let i = 0; i < 20; i++) {
        const { data } = generateCpa(1, "cpaReason", { reasonCase: "range" });
        const c = data.extra!.change!;
        const expected = referenceCpa(c.newActs).projectTime;
        expect(expected).toBe(data.times.projectTime + Math.max(0, c.amount - c.float));
        outcomes.add(expected > data.times.projectTime);
      }
      expect(outcomes.size).toBe(2);
    });
  });
  it("named-activity delays allow both unchanged and delayed projects", () => {
    withSeededRandom(904, () => {
      const outcomes = new Set<boolean>();
      for (let i = 0; i < 24; i++) {
        const { data } = generateCpa(2, "cpaChange", { changeCase: "delay", changeAsk: "boxes" });
        const c = data.extra!.change!;
        expect(c.named!.length).toBeGreaterThanOrEqual(2);
        outcomes.add(c.newTimes.projectTime > data.times.projectTime);
      }
      expect(outcomes.size).toBe(2);
    });
  });
  it("Glyn exam claims can be true or false and the model gives the correct verdict", () => {
    withSeededRandom(903, () => {
      const outcomes = new Set<boolean>();
      for (let i = 0; i < 16; i++) {
        const p = generateCpaExam(1, "asClaim");
        const d = p.cpa!, ref = referenceCpa(d.acts);
        const sum = d.acts.filter(a => ref.criticalSet.has(a.id)).reduce((n,a) => n+a.duration, 0);
        const valid = sum === ref.projectTime;
        outcomes.add(valid);
        const answer = p.exam!.parts.find(p => p.label === "(c)(i)")!;
        expect(answer.prompt).not.toContain("Show that");
        expect(answer.model.join(" ")).toContain(valid ? "claim is true" : "claim is false");
        expect(answer.scheme.map(m => m.text).join(" ")).toContain(valid ? "true" : "false");
      }
      expect(outcomes.size).toBe(2);
    });
  });
});
