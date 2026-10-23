import raw from "../generated/toolFacts.json";

/** What a registry entry is — see `kindOf` in scripts/toolFacts.mjs. */
export type Kind = "tool" | "sandbox" | "game" | "generator" | "workshop";
export const KINDS: { key: Kind; label: string; hint: string }[] = [
  { key: "tool", label: "Tools", hint: "Teaching tools: question generators, revision tools, Decision Maths" },
  { key: "sandbox", label: "Sandboxes", hint: "Open-ended interactives, manipulatives and classroom utilities" },
  { key: "game", label: "Games", hint: "Vocabulary and practice games" },
  { key: "generator", label: "PDF generators", hint: "Standalone worksheet generators" },
  { key: "workshop", label: "Workshop", hint: "Internal build pages — templates, libraries, technique previews. Not for teachers" },
];

export interface ToolFacts {
  id: string; path: string; name: string; description: string; group?: string;
  category: string; subject: string; kind: Kind;
  enabled: boolean; hidden: boolean; parked: boolean;
  file: string; shell: "ToolShell" | "DecisionShell" | "CSShell" | "Standalone";
  subTools: number | null; lines: number;
  depth: boolean; teach: boolean; lessons: boolean; workedSplit: boolean; calibrated: boolean;
  smartProgressor: boolean; scaffold: boolean; reformat: boolean; customPrint: boolean; tests: boolean;
  skillLinks: boolean; spec: boolean; representations: string[];
}

export const TOOLS: ToolFacts[] = (raw as { tools: ToolFacts[] }).tools;

export type Availability = "live" | "dev" | "hidden" | "parked";
export const availabilityOf = (t: ToolFacts): Availability => (t.parked ? "parked" : t.hidden ? "hidden" : !t.enabled ? "dev" : "live");
export const AVAILABILITY_LABEL: Record<Availability, string> = { live: "Live", dev: "In development", hidden: "Hidden", parked: "Parked" };

export type FeatureKey = "depth" | "lessons" | "teach" | "workedSplit" | "calibrated" | "smartProgressor" | "scaffold" | "tests" | "spec";
export const FEATURES: { key: FeatureKey; label: string; hint: string }[] = [
  { key: "depth", label: "Depth", hint: "Has a bank of Depth questions" },
  { key: "lessons", label: "Lessons", hint: "Has lessons (ordered steps)" },
  { key: "teach", label: "Teach deck", hint: "Has a Teach slide deck" },
  { key: "workedSplit", label: "Developing picture", hint: "Worked Example shows a picture that builds up" },
  { key: "calibrated", label: "Calibrated", hint: "Worksheets are spread across measured difficulty bands" },
  { key: "smartProgressor", label: "Smart Progressor", hint: "Orders worksheets easy to hard" },
  { key: "scaffold", label: "Scaffold", hint: "Whiteboard scaffold (e.g. a place value table)" },
  { key: "tests", label: "Smoke tests", hint: "Covered by the generator smoke tests" },
  { key: "spec", label: "Spec", hint: "Has a brief in specs/" },
];
