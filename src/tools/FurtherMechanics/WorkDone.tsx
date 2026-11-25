import { DecisionShell, mechProblem, solveMech, type DecisionProblem, type GenerateContext, type SolveStep } from "../../shared/decision";
import type { ShellOption } from "../../shared/decision/types";
import { MechCanvas, MECH_STAGE, pickOne, type MechProblemData, type DiagramDisplay } from "../../shared/mechanics";
import { MC_NOTICE } from "./mcNotice";
import { MC_PRINT } from "./mcPrint";
import { generateFd } from "./workDone/fd";
import { generateGrav } from "./workDone/grav";
import { generateAngle } from "./workDone/angle";
import { generateSeveral } from "./workDone/several";
import { generateVariable } from "./workDone/variable";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════
// Work Done — Further Mechanics MC1 and MC5 (AQA 7367 and AS 7366), built on DecisionShell with a mechanics diagram and the written working as its picture.
// Brief: specs/further-mechanics-mc.md §5.1–5.5. Five sub-tools, each a single skill (exam-style chains are a later pass, from real past papers):
//   Force and Distance — W = F d, in SI or with kN and km;       Work and Gravity — m g h, vertically and (A2) along a slope;
//   Force at an Angle (A2) — W = F d cos θ;                       Several Forces — totals over forces, stages and a journey with a height change;
//   Variable Force — W = ∫ f(x) dx, and a constant driving force against a resistance that varies with distance, then the speed.
// The maths is in shared/mechanics/core.ts, the builders (question, picture, working and answer from one set of inputs) in ./workDone/, the picture in shared/mechanics.
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════


const A2_OFF = { key: "a2", values: ["off"] };
const A2_ONLY = { key: "a2", values: ["only"] };

const SUB_TOOLS = [
  { key: "fd", label: "Force and Distance", levels: 3, blurb: "Work done = force × distance", disabledWhen: A2_ONLY },
  { key: "grav", label: "Work and Gravity", levels: 3, blurb: "Work done by or against gravity, mgh" },
  { key: "angle", label: "Force at an Angle (A2)", levels: 3, blurb: "Work done = F d cos θ", disabledWhen: A2_OFF },
  { key: "several", label: "Several Forces", levels: 3, blurb: "Totals over forces, stages and heights" },
  { key: "variable", label: "Variable Force", levels: 3, blurb: "Work done as an integral", disabledWhen: A2_ONLY },
];

const opt = (o: Record<string, string>, key: string, fallback: string): string => (o[key] !== undefined && o[key] !== "" ? o[key] : fallback);

const A2_FORCED: Record<string, Record<string, string>> = {
  grav: { gravSetting: "slope" },
  several: { sevSituation: "slope" },
};   // Only A2: the choices that carry the content, whichever level

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const sub = ctx?.subTool ?? "fd";
  const a2Only = (ctx?.options ?? {}).a2 === "only";
  const o = a2Only ? { ...(ctx?.options ?? {}), ...(A2_FORCED[sub] ?? {}) } : ctx?.options ?? {};
  const course: "AS" | "A2" = opt(o, "a2", "on") === "off" ? "AS" : "A2";   // A2 questions left out: the generators then draw none
  const display: DiagramDisplay = opt(o, "fullDiagram", "off") === "on" ? "full" : "blurred";   // the picture always starts blurred: students draw it first, then Reveal Full or Build Diagram
  const context = pickOne(opt(o, "context", level === 1 ? "particle" : "story"), "story");
  const g = opt(o, "g", "9.8") === "10" ? 10 : 9.8;
  const units = opt(o, "units", level === 1 ? "si" : "conv");
  let m: MechProblemData;
  if (sub === "grav") m = generateGrav(level, { ask: opt(o, "gravAsk", "work"), setting: pickOne(opt(o, "gravSetting", "vertical"), "vertical"), by: pickOne(opt(o, "gravBy", "against"), "against"), g, units, format: opt(o, "format", "j"), method: opt(o, "gravMethod", "vertical"), context, display, course });
  else if (sub === "angle") m = generateAngle(level, { ask: opt(o, "angleAsk", "work"), format: opt(o, "format", "j"), context, display, course });
  else if (sub === "several") m = generateSeveral(level, { situation: opt(o, "sevSituation", "two"), units, g, context, display, course });
  else if (sub === "variable") m = generateVariable(level, { forms: opt(o, "varForms", "poly,power"), ask: opt(o, "varAsk", "work"), vehicle: opt(o, "varVehicle", "speed,stop"), format: opt(o, "varFormat", "decimal"), display, course });
  else m = generateFd(level, { ask: opt(o, "fdAsk", "work"), units, force: pickOne(opt(o, "fdForce", "with"), "with"), format: opt(o, "format", "j"), context, display, course });
  return mechProblem(m, `work-${sub}`);
}

const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined) => <MechCanvas data={p.mech!} view={step?.mechView} />;

const lv = (v: Record<number, string>) => (level: number) => v[level] ?? v[1];

const OPTIONS: ShellOption[] = [
  {
    key: "fullDiagram", label: "Full Diagram", info: "Show the whole diagram straight away. Off, the diagram and the information taken from the question start blurred, so students draw it first, then choose Reveal Full or Build Diagram.",
    displayOnly: true, tab: "display", defaultFor: () => "off", choices: [{ value: "off", label: "Off" }, { value: "on", label: "On" }],
  },
  {
    key: "a2", label: "A2 Questions", info: "Included, the questions that need A2 content (marked A2) can come up when their choices are ticked. Only A2, every question needs A2 content: the tabs and choices with none are greyed out. Left out, no A2 question is drawn and the A2 tabs and choices are greyed out.",
    shared: true, defaultFor: () => "on", choices: [{ value: "on", label: "Included" }, { value: "only", label: "Only A2" }, { value: "off", label: "Left out" }],
  },
  { key: "context", label: "Context", info: "A particle with no story, or a worded situation (a crate, a car, a climber) with realistic sizes.", multi: true, defaultFor: lv({ 1: "particle", 2: "story" }), choices: [{ value: "particle", label: "Particle", sub: "No story" }, { value: "story", label: "A situation" }] },
  {
    key: "fdAsk", label: "Ask for", info: "What to find: the work done, or the force or the distance from the work done.", forSubTools: ["fd"], multi: true,
    defaultFor: lv({ 1: "work", 2: "work", 3: "force,distance" }),
    choices: [{ value: "work", label: "The work done" }, { value: "force", forLevels: [3], label: "The force" }, { value: "distance", forLevels: [3], label: "The distance" }],
  },
  {
    key: "fdForce", label: "Force Acts", info: "Whether the force acts with the motion, or is a resistance against it (the work done against it is still a positive amount).", forSubTools: ["fd"],
    multi: true,
    defaultFor: () => "with,against", choices: [{ value: "with", label: "With the motion" }, { value: "against", label: "Against the motion" }],
  },
  {
    key: "gravAsk", label: "Ask for", info: "What to find: the work done, or the height or the mass from the work done.", forSubTools: ["grav"], multi: true,
    defaultFor: lv({ 1: "work", 2: "height,mass", 3: "work,height,mass" }),
    choices: [{ value: "work", label: "The work done" }, { value: "height", forLevels: [2, 3], label: "The height" }, { value: "mass", forLevels: [2, 3], label: "The mass" }],
  },
  {
    key: "gravSetting", label: "Setting", info: "Lifting or falling straight up and down, or moving along a slope (A2, where the height gained is d sin α).", forSubTools: ["grav"],
    multi: true,
    defaultFor: () => "vertical", choices: [{ value: "vertical", label: "Vertical", disabledWhen: A2_ONLY }, { value: "slope", label: "Along a slope (A2)", disabledWhen: A2_OFF }],
  },
  {
    key: "gravBy", label: "By or Against", info: "Work done against gravity (lifting, climbing) or by gravity (falling, sliding down).", forSubTools: ["grav"],
    multi: true,
    defaultFor: () => "against,by", choices: [{ value: "against", label: "Against gravity" }, { value: "by", label: "By gravity" }],
  },
  {
    key: "gravMethod", label: "Working Shown", info: "On a slope, the height gained is found with the angle to the vertical (as the textbook does) or as d sin α.", forSubTools: ["grav"], when: { key: "gravSetting", values: ["slope"] },
    displayOnly: true, tab: "method", defaultFor: () => "vertical", choices: [{ value: "vertical", label: "Angle to the vertical" }, { value: "sin", label: "d sin α" }],
  },
  {
    key: "angleAsk", label: "Ask for", info: "What to find: the work done, the force, the distance, the angle, or the work done and then the average power.", forSubTools: ["angle"], multi: true,
    defaultFor: lv({ 1: "work", 2: "force,distance", 3: "angle,power" }),
    choices: [{ value: "work", label: "The work done" }, { value: "force", forLevels: [2, 3], label: "The force" }, { value: "distance", forLevels: [2, 3], label: "The distance" }, { value: "angle", forLevels: [3], label: "The angle" }, { value: "power", forLevels: [3], label: "Work, then power" }],
  },
  {
    key: "sevSituation", label: "Situation", info: "Two forces over one distance; a journey with a height change; the two-step question that finds a distance first; a journey in two stages; or (A2) a road given by its angle, where gravity needs the height gained.", forSubTools: ["several"], multi: true,
    defaultFor: lv({ 1: "two", 2: "journey", 3: "twostep,stages" }),
    choices: [{ value: "two", label: "Two forces", disabledWhen: A2_ONLY }, { value: "journey", label: "A journey with a height change", disabledWhen: A2_ONLY }, { value: "twostep", forLevels: [3], label: "Find a distance first", disabledWhen: A2_ONLY }, { value: "stages", forLevels: [3], label: "Two stages", disabledWhen: A2_ONLY }, { value: "slope", forLevels: [3], label: "Up a slope by its angle (A2)", disabledWhen: A2_OFF }],
  },
  {
    key: "varForms", label: "Force Forms", info: "The kind of force to integrate: a polynomial, kx to a power, a square root, a trigonometric force or a reciprocal.", forSubTools: ["variable"], forLevels: [1, 2], multi: true,
    defaultFor: lv({ 1: "poly,power", 2: "sqrt,trig,recip" }),
    choices: [{ value: "poly", label: "Polynomial" }, { value: "power", label: "kx to a power" }, { value: "sqrt", forLevels: [2], label: "Square root" }, { value: "trig", forLevels: [2], label: "Trigonometric" }, { value: "recip", forLevels: [2], label: "Reciprocal" }],
  },
  {
    key: "varAsk", label: "Ask for", info: "What to find: the work done, the constant k in the force, or the upper limit from the work done.", forSubTools: ["variable"], forLevels: [1, 2], multi: true,
    defaultFor: lv({ 1: "work", 2: "work,k,limit" }),
    choices: [{ value: "work", label: "The work done" }, { value: "k", forLevels: [2], label: "A constant k" }, { value: "limit", forLevels: [2], label: "A limit" }],
  },
  {
    key: "varVehicle", label: "Ask for", info: "What to find for a driving force against a resistance that grows with distance: the speed after a given distance, or the distance travelled before it stops.", forSubTools: ["variable"], forLevels: [3], multi: true,
    defaultFor: () => "speed,stop", choices: [{ value: "speed", label: "The speed" }, { value: "stop", label: "The stopping distance" }],
  },
  {
    key: "varFormat", label: "Answer Format", info: "For a reciprocal force, the work as a decimal or in exact form with ln.", forSubTools: ["variable"], forLevels: [2], tab: "numbers",
    defaultFor: () => "decimal", choices: [{ value: "decimal", label: "Decimal" }, { value: "exact", label: "Exact", sub: "With ln" }],
  },
  {
    key: "units", label: "Units Given", info: "Everything in standard units, or including conversions (kN, km, tonnes, grams).", forSubTools: ["fd", "grav", "several"], tab: "numbers",
    defaultFor: lv({ 1: "si", 2: "conv" }), choices: [{ value: "si", label: "Standard units" }, { value: "conv", label: "With conversions" }],
  },
  {
    key: "format", label: "Answer Format", info: "Whether a work done is asked for in joules or in kilojoules.", forSubTools: ["fd", "grav", "angle"], tab: "numbers",
    defaultFor: lv({ 1: "j", 2: "kj" }), choices: [{ value: "j", label: "Joules" }, { value: "kj", label: "Kilojoules" }],
  },
  {
    key: "g", label: "g", info: "The value of g to use: 9.8 m s⁻² or 10 m s⁻².", forSubTools: ["grav", "several"], tab: "numbers",
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
        pageTitle: "Work Done",
        purpose: "Find the work done by a force: along its line of motion, against resistance, against or by gravity, at an angle (A2), over several stages, and by a force that varies with distance.",
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
          fd: ["Whole numbers in standard units", "Decimals and conversions, answered in kJ", "Find the force or the distance from the work done"],
          grav: ["Find the work done", "Find the height or the mass", "Worded situations, with slopes at A2"],
          angle: ["Find the work done", "Find the force or the distance", "Find the angle, or the work and then the power"],
          several: ["Two forces over one distance", "A journey with a height change", "Find a distance first, or two stages"],
          variable: ["A polynomial or kx to a power", "A root, a trigonometric force, a reciprocal; a constant or a limit", "A driving force against a resistance that varies: the speed, or where it stops"],
          default: ["One question"],
        },
        subTools: SUB_TOOLS,
        options: OPTIONS,
      }}
    />
  );
}

export const __seed = { generate, subTools: SUB_TOOLS };
