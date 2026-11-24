import { DecisionShell, mechProblem, solveMech, type DecisionProblem, type GenerateContext, type SolveStep } from "../../shared/decision";
import type { ShellOption } from "../../shared/decision/types";
import { MechCanvas, MECH_STAGE, type DiagramDisplay, type MechProblemData } from "../../shared/mechanics";
import { MC_NOTICE } from "./mcNotice";
import { MC_PRINT } from "./mcPrint";
import { generateHooke } from "./elastic/hooke";
import { withEnergyBars } from "./energy/bars";
import { generateEpe } from "./elastic/epe";
import { generateElastic } from "./elastic/elastic";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════
// Elastic Strings and Springs — Further Mechanics MC4, MC6 (AQA 7367 and AS 7366), built on DecisionShell like the other Work, Energy and Power tools.
// Brief: specs/further-mechanics-mc.md §5.9–5.11. Three sub-tools, each a single skill (exam-style chains are a later pass, from real past papers):
//   Hooke's Law                — T = λx/l or T = kx: the tension or thrust, the extension, k or λ, a hanging mass, a particle between two strings;
//   Elastic Potential Energy   — λx²/2l, the work between two lengths, and the modulus or length from the energy;
//   Elastic Energy Problems    — energy with an elastic term: a release on a smooth table, a drop on a string, and (A2) a rough table.
// The builders (question, picture, working and answer from one set of inputs) are in ./elastic/.
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════

const SUB_TOOLS = [
  { key: "hooke", label: "Hooke's Law", levels: 3, blurb: "T = λx ÷ l and T = kx" },
  { key: "epe", label: "Elastic Potential Energy", levels: 2, blurb: "Energy stored = λx² ÷ 2l" },
  { key: "elastic", label: "Elastic Energy Problems", levels: 3, blurb: "Conservation of energy with a spring or string" },
];

const opt = (o: Record<string, string>, key: string, fallback: string): string => (o[key] !== undefined && o[key] !== "" ? o[key] : fallback);

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const sub = ctx?.subTool ?? "hooke";
  const o = ctx?.options ?? {};
  const course = (opt(o, "course", "A2") === "AS" ? "AS" : "A2") as "AS" | "A2";
  const display: DiagramDisplay = "blurred";   // the picture always starts blurred: students draw it first, then Reveal Full or Build Diagram
  const g = opt(o, "g", "9.8") === "10" ? 10 : 9.8;
  const units = opt(o, "units", level === 1 ? "si" : "conv");
  const kind = opt(o, "kind", "string,spring");
  let m: MechProblemData;
  if (sub === "epe") m = generateEpe(level, { ask: opt(o, "epAsk", "epe"), givenAs: opt(o, "givenAs", "extension,length"), kind, units, display, course });
  else if (sub === "elastic") m = generateElastic(level, { setting: opt(o, "elSetting", "horizontal"), ask: opt(o, "elAsk", "speedNat"), kind, show: opt(o, "elShow", "off"), g, display, course });
  else m = generateHooke(level, { setting: opt(o, "hkSetting", "horizontal"), ask: opt(o, "hkAsk", "tension"), givenAs: opt(o, "givenAs", "extension,length"), kind, units, g, display, course });
  if (opt(o, "picture", "diagram") === "bars") m = withEnergyBars(m);
  return mechProblem(m, `elastic-${sub}`);
}

const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined) => <MechCanvas data={p.mech!} view={step?.mechView} />;

const lv = (v: Record<number, string>) => (level: number) => v[level] ?? v[1];

const OPTIONS: ShellOption[] = [
  {
    key: "course", label: "Course", info: "AS keeps to smooth surfaces, vertical motion and strings along a line. A2 adds a rough table, a smooth slope, and two strings fixed at two points, which need friction or resolving.",
    defaultFor: () => "A2", choices: [{ value: "A2", label: "A2", sub: "Includes friction" }, { value: "AS", label: "AS" }],
  },
  {
    key: "picture", label: "Working Picture", info: "The diagram of the situation, or energy bars: one column for the start and one for the end, each stacked from gravitational, elastic and kinetic energy and work, so the two columns are the same height. The bars appear once the energy equation is written.", forSubTools: ["elastic"],
    displayOnly: true, tab: "display", defaultFor: () => "diagram", choices: [{ value: "diagram", label: "The diagram" }, { value: "bars", label: "Energy bars" }],
  },
  {
    key: "kind", label: "Spring or String", info: "An elastic string, which can only be stretched, or a spring, which can also be compressed and push back with a thrust.", forSubTools: ["hooke", "epe"], multi: true,
    defaultFor: () => "string,spring", choices: [{ value: "string", label: "String" }, { value: "spring", label: "Spring" }],
  },
  {
    key: "hkSetting", label: "Setting", info: "A spring or string along a table, a mass hanging in equilibrium, a particle held between two vertical strings, or (A2) a particle on two strings fixed at two points on one level, which needs the triangle and resolving.", forSubTools: ["hooke"], multi: true,
    defaultFor: lv({ 1: "horizontal", 2: "horizontal,hanging", 3: "hanging,two" }),
    choices: [{ value: "horizontal", label: "Along a table" }, { value: "hanging", forLevels: [2, 3], label: "Hanging" }, { value: "two", forLevels: [3], label: "Between two strings" }, { value: "points", forLevels: [3], label: "Two fixed points (A2)" }],
  },
  {
    key: "hkAsk", label: "Ask for", info: "What to find: the tension or thrust, the extension (or the length of a hanging string), the stiffness k, the modulus of elasticity, or the mass. Between two strings the extension of the upper one is asked; on two fixed points the modulus of one string and the mass.", forSubTools: ["hooke"], multi: true,
    defaultFor: lv({ 1: "tension", 2: "extension,modulus,k", 3: "extension,length,mass" }),
    choices: [{ value: "tension", label: "The tension" }, { value: "extension", forLevels: [2, 3], label: "The extension" }, { value: "length", forLevels: [3], label: "The length" }, { value: "k", forLevels: [2, 3], label: "The stiffness k" }, { value: "modulus", forLevels: [2, 3], label: "The modulus" }, { value: "mass", forLevels: [3], label: "The mass" }],
  },
  {
    key: "givenAs", label: "Given As", info: "Whether the stretched or squashed spring is described by its new length or by its extension, so the student does or does not take the natural length away first.", forSubTools: ["hooke", "epe"], multi: true,
    defaultFor: lv({ 1: "length", 2: "length,extension" }), choices: [{ value: "length", label: "Length" }, { value: "extension", label: "Extension" }],
  },
  {
    key: "epAsk", label: "Ask for", info: "What to find: the energy stored, the work done stretching between two lengths, the modulus or the length of the string from the energy.", forSubTools: ["epe"], multi: true,
    defaultFor: lv({ 1: "epe", 2: "work,modulus,length" }),
    choices: [{ value: "epe", label: "The energy stored" }, { value: "work", forLevels: [2], label: "The work done" }, { value: "modulus", forLevels: [2], label: "The modulus" }, { value: "length", forLevels: [2], label: "The length" }],
  },
  {
    key: "elSetting", label: "Setting", info: "A particle on a smooth table released from a stretched or compressed spring, a particle dropped from the support of a string, or (A2) a rough table or a smooth slope where the string is fixed at the top.", forSubTools: ["elastic"], multi: true,
    defaultFor: lv({ 1: "horizontal", 2: "vertical", 3: "vertical,rough" }),
    choices: [{ value: "horizontal", label: "Smooth table" }, { value: "vertical", forLevels: [2, 3], label: "Dropped on a string" }, { value: "rough", forLevels: [3], label: "Rough table (A2)" }, { value: "slope", forLevels: [3], label: "Down a slope (A2)" }],
  },
  {
    key: "elAsk", label: "Ask for", info: "What to find: the speed at the natural length or at a given extension, or the distance slid after the string goes slack (a rough table); for a drop, the greatest extension, the distance below the support, the acceleration at the lowest point or the greatest speed.", forSubTools: ["elastic"], multi: true,
    defaultFor: lv({ 1: "speedNat,speedAt", 2: "maxext,acc,maxspeed,rest", 3: "maxext,maxspeed,speedNat,stop" }),
    choices: [{ value: "speedNat", label: "Speed at natural length" }, { value: "speedAt", forLevels: [1, 3], label: "Speed at a given extension" }, { value: "stop", forLevels: [3], label: "Distance slid" }, { value: "maxext", forLevels: [2, 3], label: "The greatest extension" }, { value: "rest", forLevels: [2, 3], label: "Distance below the support" }, { value: "acc", forLevels: [2, 3], label: "The acceleration" }, { value: "maxspeed", forLevels: [2, 3], label: "The greatest speed" }],
  },
  {
    key: "elShow", label: "Show That", info: "The answer is given in the question (greatest extension, distance or greatest speed of a drop) and the working proves it, as in the exam.", forSubTools: ["elastic"], forLevels: [2, 3],
    defaultFor: () => "off", choices: [{ value: "off", label: "Off" }, { value: "on", label: "On" }],
  },
  {
    key: "units", label: "Units Given", info: "Everything in metres, or with some lengths in centimetres.", forSubTools: ["hooke", "epe"], tab: "numbers",
    defaultFor: lv({ 1: "si", 2: "conv" }), choices: [{ value: "si", label: "Metres" }, { value: "conv", label: "With centimetres" }],
  },
  {
    key: "g", label: "g", info: "The value of g to use: 9.8 m s⁻² or 10 m s⁻².", forSubTools: ["hooke", "elastic"], tab: "numbers",
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
        pageTitle: "Elastic Strings and Springs",
        purpose: "Use Hooke's law for springs and elastic strings, find elastic potential energy, and use conservation of energy where a spring or string stores energy.",
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
          hooke: ["Tension or thrust from a length or extension", "The extension, k or the modulus; a hanging mass", "Two strings; a hanging mass"],
          epe: ["Energy stored in a spring or string", "Work between two lengths; the modulus or length from the energy"],
          elastic: ["Released on a smooth table", "A particle dropped on a string", "A rough table (A2); the greatest speed"],
          default: ["One question"],
        },
        subTools: SUB_TOOLS,
        options: OPTIONS,
      }}
    />
  );
}

export const __seed = { generate, subTools: SUB_TOOLS };
