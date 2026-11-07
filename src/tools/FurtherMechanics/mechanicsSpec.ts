// AQA Further Mathematics Mechanics (MA–ME): the specification as data, for the Further Mechanics space.
// Source of truth for the wording: specs/exam/spec/aqa-mechanics.md (AQA 7367 v1.1 and AS 7366 v1.2).
// This file adds the AS/A2 split, the link back to the legacy AQA M1–M5 papers, and the resources found for each chapter.

import type { SpecChapter, SpecResource } from "../../shared/components/SpecLanding";

const P = "https://pmt.physicsandmathstutor.com/download/Maths/A-level/";
const enc = (path: string) => P + path.split("/").map(encodeURIComponent).join("/");
const aqaFm = (name: string): SpecResource => ({ label: name, from: "AQA Further", url: enc(`Further/Mechanics/AQA/Cheat-Sheets/${name}.pdf`) });
const m1 = (name: string): SpecResource => ({ label: name, from: "AQA legacy", url: enc(`M1/Topic-Qs/AQA/${name}.pdf`) });
const m2 = (name: string): SpecResource => ({ label: name, from: "AQA legacy", url: enc(`M2/Topic-Qs/AQA/${name}.pdf`) });
const edx = (mod: "M1" | "M3" | "M4", name: string): SpecResource => ({ label: name, from: "Edexcel legacy", url: enc(`${mod}/Topic-Qs/Edexcel-Set-1/${name}.pdf`) });

export const CHAPTERS: SpecChapter[] = [
  {
    id: "MA",
    name: "Dimensional analysis",
    tools: [],
    statements: [
      { ref: "MA1", text: "Finding dimensions of quantities; checking for dimensional consistency.", as: true, legacy: ["M3"], status: "supported", note: "AQA M3 papers open with dimensions questions." },
      { ref: "MA2", text: "Prediction of formulae; finding powers in potential formulae.", as: true, legacy: ["M3"], status: "supported", note: "e.g. the period of a pendulum predicted from its dimensions." },
    ],
    resources: [aqaFm("Dimensional Analysis")],
  },
  {
    id: "MB",
    name: "Momentum and collisions",
    tools: [],
    statements: [
      { ref: "MB1", text: "Conservation of momentum for linear motion and cases where velocities are given as one or two dimensional vectors (problems which require resolving).", as: true, asLimit: "resolving not required", legacy: ["M1", "M3"], status: "supported", note: "M1 for straight-line collisions; M3 for two dimensions." },
      { ref: "MB2", text: "Coefficient of restitution and Newton's Experimental Law. Use in direct collisions and impacts with a fixed smooth surface. Problems which require resolving.", as: true, asLimit: "resolving not required", legacy: ["M3"], status: "supported" },
      { ref: "MB3", text: "Impulse and its relation to momentum. Problems which require resolving.", formula: "Ft = mv − mu", as: true, asLimit: "resolving not required (one or two dimensions)", legacy: ["M3"], status: "revised", was: "M1 / M3", note: "Impulse questions are in the M3 papers; the M1 papers have none." },
      { ref: "MB4", text: "Impulse for variable forces. One dimension only.", formula: "I = ∫ F dt", as: true, legacy: ["M3"], status: "revised", was: "M2 / M4", note: "Found once, as a force on a ball during contact with a bat (M3). Thin evidence." },
    ],
    resources: [
      aqaFm("Momentum and Collisions I"), aqaFm("Momentum and Collisions II"),
      m1("M1 Momentum"),
      edx("M1", "M1 Collisions - Direct impact"), edx("M1", "M1 Collisions"),
    ],
  },
  {
    id: "MC",
    name: "Work, energy and power",
    tools: [],
    statements: [
      { ref: "MC1", text: "Work done by a force acting in the direction of motion or directly opposing the motion.", formula: "WD = Fd cos θ", as: true, asLimit: "no Fd cos θ", legacy: ["M2"], status: "supported" },
      { ref: "MC2", text: "Gravitational potential energy. Use in conservation of energy problems.", as: true, legacy: ["M2"], status: "supported" },
      { ref: "MC3", text: "Kinetic energy. Use in conservation of energy problems.", as: true, legacy: ["M2"], status: "supported" },
      { ref: "MC4", text: "Hooke's Law including using modulus of elasticity.", formula: "T = kx  or  T = (λ/l)x", as: true, legacy: ["M2"], status: "supported", note: "The most common legacy M2 topic." },
      { ref: "MC5", text: "Work done by a variable force. Use in conservation of energy problems.", formula: "WD = ∫ F dx", as: true, legacy: ["M2"], status: "revised", was: "M3 / M4", note: "M2 has 'show, by integration, that the work done in stretching the string is …'." },
      { ref: "MC6", text: "Elastic potential energy using modulus of elasticity. Use in conservation of energy problems.", formula: "EPE = kx²/2  and  EPE = λx²/2l", as: true, legacy: ["M2"], status: "revised", was: "M2 / M3" },
      { ref: "MC7", text: "Power.", formula: "P = Fv", as: true, asLimit: "resolving not required", legacy: ["M2"], status: "supported", note: "Missing from the first map." },
    ],
    resources: [
      aqaFm("Work, Energy and Power I"), aqaFm("Work, Energy and Power II"),
      m2("M2 Energy, Work and Power"), m2("M2 Energy, Work and Power MS"),
      edx("M3", "M3 Work and energy - Elastic strings and springs"), edx("M3", "M3 Work and energy - Work done"),
      edx("M3", "M3 Work and energy - Conservation of energy"), edx("M3", "M3 Dynamics - Variable forces"),
    ],
  },
  {
    id: "MD",
    name: "Circular motion",
    tools: [],
    statements: [
      { ref: "MD1", text: "Motion of a particle moving in a circle with constant speed (knowledge of radians assumed).", as: true, legacy: ["M2"], status: "supported" },
      { ref: "MD2", text: "Understand the definition of angular speed. Use both radians and revolutions per unit time.", as: true, legacy: ["M2"], status: "supported" },
      { ref: "MD3", text: "Relationships between speed, angular speed, radius and acceleration.", formula: "v = rω,  a = rω²,  a = v²/r", as: true, legacy: ["M2"], status: "supported" },
      { ref: "MD4", text: "Use position, velocity and acceleration as vectors in the context of circular motion.", as: false, legacy: [], status: "unverified", note: "No legacy AQA paper was found using vectors for circular motion. New to this spec." },
      { ref: "MD5", text: "Conical pendulum, with one or two strings.", as: false, legacy: ["M2"], status: "supported" },
      { ref: "MD6", text: "Circular motion in a vertical plane. Includes conditions to complete vertical circles. Use of conservation of energy in this context.", as: false, legacy: ["M2"], status: "revised", was: "M4", note: "AQA M2 has particles moving in vertical circles." },
    ],
    resources: [
      aqaFm("Circular Motion I"), aqaFm("Circular Motion II"),
      m2("M2 Circular Motion"), m2("M2 Circular Motion MS"),
      edx("M3", "M3 Circular motion - Horizontal circles"), edx("M3", "M3 Circular motion - Vertical circles"), edx("M4", "M4 Circular motion - Vertical circles"),
    ],
  },
  {
    id: "ME",
    name: "Centres of mass and moments",
    tools: [],
    statements: [
      { ref: "ME1", text: "Centre of mass for a system of particles.", as: false, legacy: ["M2"], status: "supported" },
      { ref: "ME2", text: "Centre of mass for a composite body.", as: false, legacy: ["M2"], status: "supported" },
      { ref: "ME3", text: "Centre of mass of a lamina by integration.", as: false, legacy: ["M2"], status: "revised", was: "M4", note: "M2 has many solids and laminas (hemispheres, cones). That they are done by integration is not confirmed." },
      { ref: "ME4", text: "Centres of mass of bodies formed by rotating a region about the x-axis.", as: false, legacy: ["M2"], status: "revised", was: "M4", note: "As ME3." },
      { ref: "ME5", text: "Conditions for sliding and toppling. Problems including suspension and on an inclined plane.", as: false, legacy: ["M2"], status: "supported" },
      { ref: "ME6", text: "Determine the forces acting on a rigid body in equilibrium. Use of moments and couples.", as: false, legacy: ["M2"], status: "supported", note: "Ladders, hinged and suspended bodies." },
    ],
    resources: [
      aqaFm("Centre of Mass and Moments I"), aqaFm("Centre of Mass and Moments II"), aqaFm("Centre of Mass and Moments III"),
      aqaFm("Centre of Mass and Moments IV"), aqaFm("Centre of Mass and Moments V"), aqaFm("Centre of Mass and Moments VI"),
      m2("M2 Centre of Mass"), m2("M2 Centre of Mass MS"), m2("M2 Moments and Equilibrium"), m2("M2 Moments and Equilibrium MS"),
      edx("M3", "M3 Centres of Mass - Planar bodies"), edx("M3", "M3 Centres of Mass - Rigid bodies and composites"), edx("M3", "M3 Centres of Mass - Equilibrium problems"),
    ],
  },
];

/** Whole-qualification resources, not tied to one chapter. */
export const GENERAL_RESOURCES: SpecResource[] = [
  { label: "AQA M1 past papers, combined", from: "AQA legacy", url: enc("M1/Papers-AQA/Combined QP - M1 AQA.pdf") },
  { label: "AQA M2 past papers, combined", from: "AQA legacy", url: enc("M2/Papers-AQA/Combined QP - M2 AQA.pdf") },
  { label: "AQA M3 past papers, combined", from: "AQA legacy", url: enc("M3/Papers-AQA/Combined QP - M3 AQA.pdf") },
  { label: "Mechanics A-level formula sheet (AQA)", from: "AQA Further", url: enc("Further/Mechanics/AQA/Mechanics A-level Formula Sheet.pdf") },
  { label: "Mechanics AS formula sheet (AQA)", from: "AQA Further", url: enc("Further/Mechanics/AQA/Mechanics AS-level Formula Sheet.pdf") },
  { label: "PMT: Further Mechanics hub", from: "Other", url: "https://www.physicsandmathstutor.com/maths-revision/further-mechanics/" },
  { label: "PMT: M1 by topic", from: "Other", url: "https://www.physicsandmathstutor.com/a-level-maths-papers/m1-by-topic/" },
  { label: "PMT: M2 by topic", from: "Other", url: "https://www.physicsandmathstutor.com/a-level-maths-papers/m2-by-topic/" },
  { label: "PMT: M3 by topic (Edexcel)", from: "Other", url: "https://www.physicsandmathstutor.com/a-level-maths-papers/m3-by-topic/" },
  { label: "PMT: M4 by topic (Edexcel)", from: "Other", url: "https://www.physicsandmathstutor.com/a-level-maths-papers/m4-by-topic/" },
  { label: "Madasmaths: mechanics booklets", from: "Other", url: "https://madasmaths.com/archive_maths_booklets_mechanics.html" },
];

/** What the legacy check found, in plain words. Dated, because the evidence is what was on PMT that day. */
export const CHECK_NOTES = {
  date: "2026-11-06",
  method: "Read the AQA legacy M1, M2 and M3 combined past papers on PMT for the topics their questions use, and opened every link in the first (Gemini) map.",
  findings: [
    "M1, M2 and M3 are supported for most statements: MA in M3, straight-line momentum in M1, restitution and impulse in M3, and work, energy, power, Hooke's law, horizontal circles, centres of mass, toppling and equilibrium in M2.",
    "Moved from M4 to M2: vertical circles (MD6), work by a variable force (MC5) and centres of mass of laminas and solids (ME3, ME4). Moved to M3: impulse (MB3) and variable-force impulse (MB4).",
    "AQA M4 and M5 papers are not on PMT at the address used for M1–M3, so nothing assigned to M4 could be checked. PMT's M3 and M4 topic pages hold Edexcel questions only, so they are listed as Edexcel, not as AQA.",
    "Every topic-pack link in the first map was a dead address (they used 'Topic-QPs'; PMT's folder is 'Topic-Qs'), and PMT has no AQA M3 topic packs. The links here were each opened and work.",
    "MC7 (Power) was missing from the first map. MD1–MD4 were one card; MD4 (circular motion as vectors) has no legacy source found.",
    "The first map's weighting chart (10 / 55 / 20 / 15) was not derived from anything and is not reproduced.",
  ],
};
