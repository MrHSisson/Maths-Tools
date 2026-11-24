import { DecisionShell, mechProblem, solveMech, type DecisionProblem, type GenerateContext, type SolveStep } from "../../shared/decision";
import type { ShellOption } from "../../shared/decision/types";
import { MechCanvas, MECH_STAGE, type DiagramDisplay, type MechProblemData } from "../../shared/mechanics";
import { MC_NOTICE } from "./mcNotice";
import { MC_PRINT } from "./mcPrint";
import { generateKepe } from "./energy/kepe";
import { withEnergyBars } from "./energy/bars";
import { generateWorkEnergy } from "./energy/workenergy";
import { generateConserve } from "./energy/conserve";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════
// Energy — Further Mechanics MC2, MC3 (AQA 7367 and AS 7366), built on DecisionShell like Work Done, with a mechanics diagram and the written working as its picture.
// Brief: specs/further-mechanics-mc.md §5.6–5.8. Three sub-tools, each a single skill (exam-style chains are a later pass, from real past papers):
//   Kinetic and Potential Energy — ½mv² and mgh, a mass, speed or height from the energy, a gain or loss, and (A2) velocity vectors;
//   Work-Energy Principle        — work done by the forces = change in KE, on the level or along a slope, finding a speed, distance, force or work;
//   Conservation of Energy       — GPE + KE constant: falls, projections, the maximum height, a slide, and (A2) a slope given by its angle.
// The maths is in shared/mechanics/core.ts, the builders (question, picture, working and answer from one set of inputs) in ./energy/.
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════

const A2 = { key: "course", values: ["A2"] };

const SUB_TOOLS = [
  { key: "kepe", label: "Kinetic and Potential Energy", levels: 3, blurb: "KE = ½mv² and GPE = mgh" },
  { key: "workenergy", label: "Work-Energy Principle", levels: 3, blurb: "Work done = change in kinetic energy" },
  { key: "conserve", label: "Conservation of Energy", levels: 3, blurb: "GPE + KE stays the same" },
];

const opt = (o: Record<string, string>, key: string, fallback: string): string => (o[key] !== undefined && o[key] !== "" ? o[key] : fallback);

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const sub = ctx?.subTool ?? "kepe";
  const o = ctx?.options ?? {};
  const course = (opt(o, "course", "A2") === "AS" ? "AS" : "A2") as "AS" | "A2";
  const display = opt(o, "diagram", "blurred") as DiagramDisplay;
  const context = opt(o, "context", level === 1 ? "particle" : "story");
  const g = opt(o, "g", "9.8") === "10" ? 10 : 9.8;
  const units = opt(o, "units", level === 1 ? "si" : "conv");
  let m: MechProblemData;
  if (sub === "workenergy") m = generateWorkEnergy(level, { setting: opt(o, "weSetting", "horizontal"), ask: opt(o, "weAsk", "speed"), forces: opt(o, "weForces", "both"), method: opt(o, "weMethod", "work"), units, context, g, display, course });
  else if (sub === "conserve") m = generateConserve(level, { setting: opt(o, "cvSetting", "vertical"), starts: opt(o, "cvStarts", "rest"), ask: opt(o, "cvAsk", "speed"), parts: opt(o, "cvParts", "one"), context, g, display, course });
  else m = generateKepe(level, { energy: opt(o, "keEnergy", "ke,gpe"), ask: opt(o, "keAsk", "energy"), units, format: opt(o, "format", "j"), velocity: opt(o, "keVelocity", "speed"), context, g, display, course });
  if (opt(o, "picture", "diagram") === "bars") m = withEnergyBars(m);
  return mechProblem(m, `energy-${sub}`);
}

const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined) => <MechCanvas data={p.mech!} view={step?.mechView} />;

const lv = (v: Record<number, string>) => (level: number) => v[level] ?? v[1];

const OPTIONS: ShellOption[] = [
  {
    key: "course", label: "Course", info: "AS keeps to energy with no resolving: slopes are given by their length and drop. A2 adds velocity vectors, and slopes given by their angle.",
    defaultFor: () => "A2", choices: [{ value: "A2", label: "A2", sub: "Includes vectors and angled slopes" }, { value: "AS", label: "AS" }],
  },
  {
    key: "diagram", label: "Diagram", info: "Whether a question gives its picture straight away, draws it up part by part as the working goes on, gives it (and the information taken from the question) blurred until you choose Reveal Full or Build Diagram, so students draw it themselves first, or has none.",
    displayOnly: true, tab: "display", defaultFor: () => "blurred",
    choices: [{ value: "blurred", label: "Blurred until revealed" }, { value: "given", label: "With the question" }, { value: "build", label: "Built in the working" }, { value: "hidden", label: "None" }],
  },
  {
    key: "picture", label: "Working Picture", info: "The diagram of the situation, or energy bars: one column for the start and one for the end, each stacked from gravitational, elastic and kinetic energy and work, so the two columns are the same height. The bars appear once the energy equation is written.", forSubTools: ["workenergy", "conserve"],
    displayOnly: true, tab: "display", defaultFor: () => "diagram", choices: [{ value: "diagram", label: "The diagram" }, { value: "bars", label: "Energy bars" }],
  },
  { key: "context", label: "Context", info: "A particle with no story, or a worded situation (a car, a ball, a skier) with realistic sizes.", defaultFor: lv({ 1: "particle", 2: "story" }), choices: [{ value: "particle", label: "Particle", sub: "No story" }, { value: "story", label: "A situation" }] },
  {
    key: "keEnergy", label: "Energy", info: "Kinetic energy, gravitational potential energy, or both mixed.", forSubTools: ["kepe"], multi: true, defaultFor: () => "ke,gpe",
    choices: [{ value: "ke", label: "Kinetic" }, { value: "gpe", label: "Gravitational potential" }],
  },
  {
    key: "keAsk", label: "Ask for", info: "What to find: the energy, or the mass, speed or height from the energy, or the gain or loss between two states.", forSubTools: ["kepe"], multi: true,
    defaultFor: lv({ 1: "energy", 2: "mass,speed,height", 3: "change" }),
    choices: [{ value: "energy", label: "The energy" }, { value: "mass", forLevels: [2, 3], label: "The mass" }, { value: "speed", forLevels: [2, 3], label: "The speed" }, { value: "height", forLevels: [2, 3], label: "The height" }, { value: "change", forLevels: [3], label: "A gain or loss" }],
  },
  {
    key: "keVelocity", label: "Velocity As", info: "For a change in kinetic energy: the speeds are given, or the velocities as vectors in i and j (A2).", forSubTools: ["kepe"], forLevels: [3], when: A2,
    defaultFor: () => "speed", choices: [{ value: "speed", label: "A speed" }, { value: "vector", label: "A vector", sub: "i and j" }],
  },
  {
    key: "weSetting", label: "Setting", info: "Level ground, along a slope given by its length and how far it rises or falls, a load raised by a rope over a pulley, or (A2) a rough slope given by its angle, where friction is μ times the normal reaction.", forSubTools: ["workenergy"],
    defaultFor: (l: number) => (l === 3 ? "slope" : "horizontal"), choices: [{ value: "horizontal", label: "Horizontal" }, { value: "slope", label: "Along a slope" }, { value: "pulley", label: "Raised over a pulley" }, { value: "rough", label: "Rough slope (A2)" }],
  },
  {
    key: "weAsk", label: "Ask for", info: "What to find: the speed at the end, the distance, an unknown braking or resisting force (or the pulling force over a pulley), the work done by the driving force, or on a rough slope the coefficient of friction.", forSubTools: ["workenergy"], multi: true,
    defaultFor: lv({ 1: "speed,distance", 2: "force", 3: "speed,force,work" }),
    choices: [{ value: "speed", label: "The speed" }, { value: "distance", label: "The distance", sub: "Horizontal, or up a rough slope" }, { value: "force", label: "A force" }, { value: "work", forLevels: [2, 3], label: "The work done by the driver" }, { value: "mu", forLevels: [3], label: "The coefficient of friction (A2)" }],
  },
  {
    key: "weForces", label: "Forces", info: "Which forces act along the motion: a driving force only, a resistance only, or both.", forSubTools: ["workenergy"],
    defaultFor: lv({ 1: "drive", 2: "resist", 3: "both" }), choices: [{ value: "drive", label: "Driving force only" }, { value: "resist", label: "Resistance only" }, { value: "both", label: "Both" }],
  },
  {
    key: "weMethod", label: "Method", info: "On a slope, write gravity as a work done (against or by it), or as GPE and KE on each side of the equation.", forSubTools: ["workenergy"], when: { key: "weSetting", values: ["slope"] },
    displayOnly: true, tab: "method", defaultFor: () => "work", choices: [{ value: "work", label: "Work done by gravity" }, { value: "pe", label: "GPE and KE" }],
  },
  {
    key: "cvSetting", label: "Setting", info: "A vertical fall or projection, or a slide down a slope.", forSubTools: ["conserve"],
    defaultFor: (l: number) => (l === 3 ? "slope" : "vertical"), choices: [{ value: "vertical", label: "Vertical" }, { value: "slope", label: "Down a slope" }],
  },
  {
    key: "cvStarts", label: "Starts", info: "Released from rest, projected downwards, or projected upwards (a vertical setting only).", forSubTools: ["conserve"], multi: true,
    defaultFor: lv({ 1: "rest", 2: "down,up", 3: "rest,down" }), choices: [{ value: "rest", label: "From rest" }, { value: "down", label: "Projected down" }, { value: "up", label: "Projected up" }],
  },
  {
    key: "cvAsk", label: "Ask for", info: "What to find: the speed after the drop or rise, the maximum height of a projection up, or (A2) how far up a slope a projection goes.", forSubTools: ["conserve"], multi: true,
    defaultFor: lv({ 1: "speed", 2: "speed,max", 3: "speed" }),
    choices: [{ value: "speed", label: "The speed" }, { value: "max", forLevels: [2, 3], label: "The maximum height" }, { value: "stop", forLevels: [3], label: "Distance up a slope (A2)" }],
  },
  {
    key: "cvParts", label: "Parts Shown", info: "One answer, or the chain of parts a to d: kinetic energy at the start, potential energy lost, kinetic energy at the bottom, then the speed.", forSubTools: ["conserve"], forLevels: [2, 3],
    defaultFor: () => "one", choices: [{ value: "one", label: "One answer" }, { value: "chain", label: "The chain a to d" }],
  },
  {
    key: "units", label: "Units Given", info: "Everything in standard units, or including conversions (km h⁻¹, tonnes, grams).", forSubTools: ["kepe", "workenergy"], tab: "numbers",
    defaultFor: lv({ 1: "si", 2: "conv" }), choices: [{ value: "si", label: "Standard units" }, { value: "conv", label: "With conversions" }],
  },
  {
    key: "format", label: "Answer Format", info: "Whether an energy is asked for in joules or in kilojoules.", forSubTools: ["kepe"], tab: "numbers",
    defaultFor: lv({ 1: "j", 2: "kj" }), choices: [{ value: "j", label: "Joules" }, { value: "kj", label: "Kilojoules" }],
  },
  {
    key: "g", label: "g", info: "The value of g to use: 9.8 m s⁻² or 10 m s⁻².", forSubTools: ["kepe", "workenergy", "conserve"], tab: "numbers",
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
        pageTitle: "Energy",
        purpose: "Find kinetic and potential energy, use the work-energy principle with driving forces, resistances and gravity, and use conservation of energy for falls, projections and slopes.",
        instruction: "Question",
        levels: 3,
        levelInfo: true,
        hideMatrix: true,
        skillSheet: true,
        questionStage: MECH_STAGE,
        skillPrint: MC_PRINT,
        devNotice: MC_NOTICE,
        noSandbox: true,
        levelLabels: {
          kepe: ["Find the kinetic or potential energy", "Find the mass, speed or height; with conversions", "Find a gain or loss between two states"],
          workenergy: ["A driving force on level ground: the speed or the distance", "Braking and resistance: find the force", "With a slope: gravity, driving force and resistance"],
          conserve: ["A drop from rest", "Projected up or down; the maximum height", "A slide down a slope, or how far up one"],
          default: ["One question"],
        },
        subTools: SUB_TOOLS,
        options: OPTIONS,
      }}
    />
  );
}

export const __seed = { generate, subTools: SUB_TOOLS };
