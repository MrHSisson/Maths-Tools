import { DecisionShell, mechProblem, solveMech, type DecisionProblem, type GenerateContext, type SolveStep } from "../../shared/decision";
import type { ShellOption } from "../../shared/decision/types";
import { MechCanvas, type DiagramDisplay, type MechProblemData } from "../../shared/mechanics";
import { generateAvgPower } from "./power/avgpower";
import { generateForceSpeed } from "./power/forcespeed";
import { generatePowerSlope } from "./power/powerslope";
import { generateMotion } from "./power/motion";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════
// Power — Further Mechanics MC7 (AQA 7367 and AS 7366), built on DecisionShell like Work Done and Energy, with a mechanics diagram and the written working as its picture.
// Brief: specs/further-mechanics-mc.md §5.12–5.15. Four sub-tools, each a single skill (exam-style chains are a later pass, from real past papers):
//   Average Power        — power = work done ÷ time: lifting, braking, a pump, accelerating at constant power;
//   Force and Speed      — P = Fv: the driving force, a constant speed, F = ma, a resistance kv or kv²;
//   Power on a Slope (A2) — P = Tv with the weight resolved: steady speeds, the angle, the time from rest, a resistance kv;
//   Power from Motion Data — a displacement function s(t), or a speed-time graph.
// The maths is in the builders in ./power/ (question, picture, working and answer from one set of inputs); the shared pieces are in shared/mechanics.
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════

const A2 = { key: "course", values: ["A2"] };

const SUB_TOOLS = [
  { key: "avgpower", label: "Average Power", levels: 3, blurb: "Power = work done ÷ time" },
  { key: "forcespeed", label: "Force and Speed", levels: 3, blurb: "Power = driving force × speed" },
  { key: "powerslope", label: "Power on a Slope (A2)", levels: 3, blurb: "Power with the weight resolved along a slope", when: [A2] },
  { key: "motion", label: "Power from Motion Data", levels: 2, blurb: "Power from s(t) or a speed-time graph" },
];

const opt = (o: Record<string, string>, key: string, fallback: string): string => (o[key] !== undefined && o[key] !== "" ? o[key] : fallback);

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const sub = ctx?.subTool ?? "avgpower";
  const o = ctx?.options ?? {};
  const course = (opt(o, "course", "A2") === "AS" ? "AS" : "A2") as "AS" | "A2";
  const display = opt(o, "diagram", "given") as DiagramDisplay;
  const context = opt(o, "context", level === 1 ? "particle" : "story");
  const g = opt(o, "g", "9.8") === "10" ? 10 : 9.8;
  const units = opt(o, "units", level === 1 ? "si" : "conv");
  let m: MechProblemData;
  if (sub === "forcespeed") m = generateForceSpeed(level, { ask: opt(o, "fsAsk", "power"), motion: opt(o, "fsMotion", "constant"), resist: opt(o, "fsResist", "const"), units, context, display, course });
  else if (sub === "powerslope") m = generatePowerSlope(level, { ask: opt(o, "psAsk", "speed"), dir: opt(o, "psDir", "up"), resist: opt(o, "psResist", "const"), angleAs: opt(o, "psAngle", "deg"), units, context, g, display, course });
  else if (sub === "motion") m = generateMotion(level, { data: opt(o, "mtData", level === 1 ? "function" : "graph"), phase: opt(o, "mtPhase", "accel,const,decel"), resist: opt(o, "mtResist", "none,const"), context, display, course });
  else m = generateAvgPower(level, { doing: opt(o, "apDoing", "lift"), ask: opt(o, "apAsk", "power"), units, format: opt(o, "format", level === 1 ? "w" : "kw"), context, g, display, course });
  return mechProblem(m, `power-${sub}`);
}

const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined) => <MechCanvas data={p.mech!} view={step?.mechView} />;

const lv = (v: Record<number, string>) => (level: number) => v[level] ?? v[1];

const OPTIONS: ShellOption[] = [
  {
    key: "course", label: "Course", info: "AS keeps to power on level ground. A2 adds Power on a Slope, where the weight has to be resolved along the road.",
    defaultFor: () => "A2", choices: [{ value: "A2", label: "A2", sub: "Includes slopes" }, { value: "AS", label: "AS" }],
  },
  {
    key: "diagram", label: "Diagram", info: "Whether a question gives its picture straight away, draws it up part by part as the working goes on, or has none.",
    displayOnly: true, tab: "display", defaultFor: () => "given",
    choices: [{ value: "given", label: "With the question" }, { value: "build", label: "Built in the working" }, { value: "hidden", label: "None" }],
  },
  { key: "context", label: "Context", info: "A particle or a plain vehicle with no story, or a worded situation (a car, a crane, a cyclist) with realistic sizes.", defaultFor: lv({ 1: "particle", 2: "story" }), choices: [{ value: "particle", label: "Particle", sub: "No story" }, { value: "story", label: "A situation" }] },
  {
    key: "apDoing", label: "Doing the Work", info: "What supplies or removes the energy: a lift raising a load, brakes stopping a vehicle, a pump moving water, or an engine speeding a vehicle up.", forSubTools: ["avgpower"], multi: true,
    defaultFor: lv({ 1: "lift", 2: "lift,brake", 3: "pump,accel" }),
    choices: [{ value: "lift", label: "Lifting" }, { value: "brake", forLevels: [2, 3], label: "Braking" }, { value: "pump", forLevels: [3], label: "Pumping" }, { value: "accel", forLevels: [3], label: "Accelerating" }],
  },
  {
    key: "apAsk", label: "Ask for", info: "What to find: the power, the work done from a power and a time, or the time taken (lifting and accelerating only; braking and pumping ask for the power).", forSubTools: ["avgpower"], multi: true,
    defaultFor: lv({ 1: "power", 2: "power,work", 3: "power,time" }),
    choices: [{ value: "power", label: "The power" }, { value: "work", forLevels: [2, 3], label: "The work done" }, { value: "time", forLevels: [2, 3], label: "The time" }],
  },
  {
    key: "fsAsk", label: "Ask for", info: "What to find: the power, the driving force, the speed, the resistance or the acceleration; the power needed for a higher speed; and with a resistance that depends on speed, k, the maximum speed or the maximum power.", forSubTools: ["forcespeed"], multi: true,
    defaultFor: lv({ 1: "power,force,speed,resist", 2: "acc,resist,speed,newpower", 3: "k,maxpower,acc,maxspeed" }),
    choices: [{ value: "power", label: "The power" }, { value: "force", label: "The driving force" }, { value: "speed", label: "The speed" }, { value: "resist", label: "The resistance" }, { value: "acc", forLevels: [2, 3], label: "The acceleration" }, { value: "newpower", forLevels: [2, 3], label: "Power for a new speed" }, { value: "k", forLevels: [3], label: "The constant k" }, { value: "maxspeed", forLevels: [3], label: "The maximum speed" }, { value: "maxpower", forLevels: [3], label: "The maximum power" }],
  },
  {
    key: "fsMotion", label: "Motion", info: "Whether the vehicle is at constant speed (the resultant force is zero) or accelerating at the instant. It applies to a constant resistance; the acceleration question is always accelerating.", forSubTools: ["forcespeed"],
    defaultFor: lv({ 1: "constant", 2: "accel", 3: "accel" }), choices: [{ value: "constant", label: "Constant speed" }, { value: "accel", label: "Accelerating" }],
  },
  {
    key: "fsResist", label: "Resistance", info: "A constant resistance, or one proportional to the speed (kv) or to its square (kv²), which makes the maximum power depend on the maximum speed.", forSubTools: ["forcespeed"], forLevels: [3],
    defaultFor: lv({ 1: "const", 2: "const", 3: "speed" }), choices: [{ value: "const", label: "Constant" }, { value: "speed", label: "Proportional to speed" }, { value: "speed2", label: "Proportional to speed squared" }],
  },
  {
    key: "psAsk", label: "Ask for", info: "What to find: the steady speed, the power or the resistance; the angle of the slope from an acceleration; or the time to reach a speed from rest.", forSubTools: ["powerslope"], multi: true,
    defaultFor: lv({ 1: "speed,power,resist", 2: "speed,resist,angle", 3: "time" }),
    choices: [{ value: "speed", label: "The steady speed" }, { value: "power", label: "The power" }, { value: "resist", label: "The resistance" }, { value: "angle", forLevels: [2, 3], label: "The angle" }, { value: "time", forLevels: [3], label: "The time" }],
  },
  {
    key: "psDir", label: "Direction", info: "Whether the vehicle goes up or down the slope. Down the slope, gravity helps the engine, so the driving force is smaller. The angle and time questions are always up.", forSubTools: ["powerslope"], multi: true, forLevels: [2, 3],
    defaultFor: lv({ 1: "up", 2: "up,down", 3: "up,down" }), choices: [{ value: "up", label: "Up" }, { value: "down", label: "Down" }],
  },
  {
    key: "psResist", label: "Resistance", info: "A constant resistance, or one proportional to the speed, which makes the steady speed the root of a quadratic.", forSubTools: ["powerslope"], forLevels: [3],
    defaultFor: lv({ 1: "const", 2: "const", 3: "const" }), choices: [{ value: "const", label: "Constant" }, { value: "kv", label: "Proportional to speed" }],
  },
  {
    key: "psAngle", label: "Angle Given As", info: "The slope as an angle in degrees, or by its sine (for example sin α = 1/20), which needs no calculator. The angle question always gives degrees.", forSubTools: ["powerslope"],
    defaultFor: () => "deg", choices: [{ value: "deg", label: "Degrees" }, { value: "sine", label: "Sine", sub: "sin α = 1/n" }],
  },
  {
    key: "mtData", label: "Data", info: "A displacement function s(t) to differentiate, or a speed-time graph of a vehicle to read.", forSubTools: ["motion"],
    defaultFor: lv({ 1: "function", 2: "graph" }), choices: [{ value: "function", label: "A function s(t)" }, { value: "graph", label: "A speed-time graph" }],
  },
  {
    key: "mtPhase", label: "Phase Asked", info: "For a graph: the engine accelerating, the vehicle at constant speed (needs a resistance), or the brakes slowing it down.", forSubTools: ["motion"], multi: true, when: { key: "mtData", values: ["graph"] },
    defaultFor: () => "accel,const,decel", choices: [{ value: "accel", label: "Accelerating" }, { value: "const", label: "Constant speed" }, { value: "decel", label: "Braking" }],
  },
  {
    key: "mtResist", label: "Resistance", info: "Whether there is a constant resistance to the motion as well as the engine or brakes.", forSubTools: ["motion"], multi: true,
    defaultFor: () => "none,const", choices: [{ value: "none", label: "None" }, { value: "const", label: "A constant resistance" }],
  },
  {
    key: "units", label: "Units Given", info: "Everything in standard units, or including conversions (kW, km h⁻¹, tonnes, minutes).", forSubTools: ["avgpower", "forcespeed", "powerslope"], tab: "numbers",
    defaultFor: lv({ 1: "si", 2: "conv" }), choices: [{ value: "si", label: "Standard units" }, { value: "conv", label: "With conversions" }],
  },
  {
    key: "format", label: "Answer Format", info: "Whether a power (or an energy) is asked for in watts (joules) or in kilowatts (kilojoules).", forSubTools: ["avgpower"], tab: "numbers",
    defaultFor: lv({ 1: "w", 2: "kw" }), choices: [{ value: "w", label: "Watts" }, { value: "kw", label: "Kilowatts" }],
  },
  {
    key: "g", label: "g", info: "The value of g to use: 9.8 m s⁻² or 10 m s⁻².", forSubTools: ["avgpower", "powerslope"], tab: "numbers",
    defaultFor: () => "9.8", choices: [{ value: "9.8", label: "9.8" }, { value: "10", label: "10" }],
  },
];

export default function App() {
  return (
    <DecisionShell
      generate={generate}
      solve={solveMech}
      renderCanvas={renderCanvas}
      config={{
        pageTitle: "Power",
        purpose: "Find average power from work done and time, use power = force × speed on level ground and on a slope, and find power from a displacement function or a speed-time graph.",
        instruction: "Question",
        levels: 3,
        levelInfo: true,
        hideMatrix: true,
        noSandbox: true,
        levelLabels: {
          avgpower: ["Lifting a load: the power", "Work from a power and a time; braking", "A pump, or accelerating at constant power"],
          forcespeed: ["Power, driving force, speed, resistance at constant speed", "Acceleration at an instant; a higher speed", "A resistance proportional to the speed"],
          powerslope: ["Constant speed up a slope", "Down a slope; the angle", "The time to reach a speed; a resistance kv"],
          motion: ["A displacement function s(t)", "A speed-time graph"],
          default: ["One question"],
        },
        subTools: SUB_TOOLS,
        options: OPTIONS,
      }}
    />
  );
}

export const __seed = { generate, subTools: SUB_TOOLS };
