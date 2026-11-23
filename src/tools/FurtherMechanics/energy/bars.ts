// Energy bars (D14) as the working picture of an energy question: one column for the start and one for the end, each a stack of gravitational, elastic and kinetic energy and
// the work done by a driver (start) or lost to resistance and friction (end), so the two columns are the same height and the equation is seen balancing. The bars replace the
// diagram and appear once the energy equation has been written (the second working step). Read from the question's own inputs, so no builder changes: the tool applies it after
// the builder has run. Plan: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md §2 (D14).
import { buildEnergyBars, radians, sig, stageParts, type BarColumn, type MechProblemData } from "../../../shared/mechanics";
import { maxExtension } from "../elastic/elastic";

const col = (name: string, v: { gpe?: number; epe?: number; ke?: number; work?: number }): BarColumn => ({ name: { text: name }, ...Object.fromEntries(Object.entries(v).map(([k, x]) => [k, Math.max(0, x ?? 0)])) });

/** the two columns of a question, or null when it has no energy equation to show */
function columns(m: MechProblemData): BarColumn[] | null {
  const i = m.inputs as Record<string, number | string | boolean>;
  const n = (k: string): number => Number(i[k]);
  const g = n("g");
  if (m.sub === "conserve") {
    const ke0 = 0.5 * n("m") * n("u") ** 2;
    const byAngle = i.setting === "slope" && n("alpha") > 0 && i.ask !== "stop";
    const drop = byAngle ? n("len") * Math.sin(radians(n("alpha"))) : n("drop");
    if (i.ask === "max" || i.ask === "stop") return [col("Start", { ke: ke0 }), col("Highest point", { gpe: ke0 })];
    const v2 = n("u") ** 2 + 2 * g * drop;
    return [col("Start", { gpe: n("m") * g * Math.max(drop, 0), ke: ke0 }), col("End", { gpe: n("m") * g * Math.max(-drop, 0), ke: 0.5 * n("m") * v2 })];
  }
  if (m.sub === "workenergy" && i.setting === "rough") {
    const mm = n("m"), s = Math.sin(radians(n("alpha"))), c = Math.cos(radians(n("alpha")));
    if (i.ask === "stop") {
      const dist = m.answer.value;
      const ke0 = 0.5 * mm * n("u") ** 2;
      return [col("Start", { ke: ke0 }), col("Stopped", { gpe: mm * g * dist * s, work: n("mu") * mm * g * c * dist })];
    }
    const gpe = mm * g * n("d") * s, ke0 = 0.5 * mm * n("u") ** 2;
    const ke1 = i.ask === "speed" ? 0.5 * mm * (n("u") ** 2 + 2 * g * n("d") * (s - n("mu") * c)) : 0.5 * mm * sig(n("v"), 3) ** 2;
    return [col("Start", { gpe, ke: ke0 }), col("End", { ke: ke1, work: gpe + ke0 - ke1 })];
  }
  if (m.sub === "workenergy" && i.setting === "pulley") {
    const mm = n("m"), gpe = mm * g * n("h");
    const ke = i.ask === "speed" ? n("T") * n("h") - gpe : 0.5 * mm * sig(n("v"), 3) ** 2;
    return [col("Start + work done", { work: gpe + ke }), col("End", { gpe, ke })];
  }
  if (m.sub === "workenergy") {
    const mm = n("m"), ke0 = 0.5 * mm * n("u") ** 2, rise = n("rise");
    const gs = mm * g * Math.max(-rise, 0), ge = mm * g * Math.max(rise, 0);
    const dist = i.ask === "distance" ? m.answer.value : n("d");   // a distance asked for is the answer, not the rounded one the question was built from
    const WD = n("D") * dist, WR = n("R0") * dist;
    let ke1: number, wd = WD, wr = WR;
    if (i.ask === "speed") ke1 = ke0 + WD - WR - mm * g * rise;
    else {
      ke1 = 0.5 * mm * sig(n("v"), 3) ** 2;
      if (i.ask === "work") wd = ke1 + ge + WR - ke0 - gs;
      else wr = ke0 + WD + gs - ke1 - ge;
    }
    return [col("Start + work done", { gpe: gs, ke: ke0, work: wd }), col("End + work lost", { gpe: ge, ke: ke1, work: wr })];
  }
  if (m.sub === "elastic") {
    const mm = n("m"), lam = n("lam"), l = n("l"), E = (x: number): number => (lam * x * x) / (2 * l);
    if (i.setting === "vertical" || i.setting === "slope") {
      const ge = i.setting === "slope" ? g * Math.sin(radians(n("alpha"))) : g;
      const mg = mm * ge;
      if (i.ask === "maxspeed") {
        const e = (mg * l) / lam, total = mg * (l + e);
        return [col("At O", { gpe: total }), col("Greatest speed", { epe: E(e), ke: total - E(e) })];
      }
      const x = maxExtension(mm, ge, l, lam);
      return [col("At O", { gpe: mg * (l + x) }), col("Lowest point", { epe: E(x) })];
    }
    const F = n("F"), x = n("x"), x2 = n("x2"), E0 = E(x);
    if (i.ask === "stop") return [col("Released", { epe: E0 }), col("Stopped", { work: E0 })];
    if (i.ask === "speedAt") return [col("Released", { epe: E0 }), col("At the point", { epe: E(x2), ke: Math.max(0, E0 - E(x2) - F * (x - x2)), work: F * (x - x2) })];
    return [col("Released", { epe: E0 }), col("Natural length", { ke: Math.max(0, E0 - F * x), work: F * x })];
  }
  return null;
}

/** the question with its picture replaced by energy bars (unchanged when it has no energy equation to draw, or no picture at all) */
export function withEnergyBars(m: MechProblemData): MechProblemData {
  if (m.display === "hidden") return m;
  const cols = columns(m);
  if (!cols) return m;
  return { ...m, scene: stageParts(buildEnergyBars({ columns: cols, conserved: m.sub === "conserve" || (m.sub === "elastic" && (m.inputs.setting === "vertical" || m.inputs.setting === "slope")) }), { bars: 2 }) };
}
