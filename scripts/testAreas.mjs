// The plain list of test areas: which test files belong to which area, and which changed paths trigger which area.
import { readFileSync } from "node:fs";
// Used by scripts/selectTests.mjs (CI) and checked by src/tests/testAreas.test.ts. Edit the lists here, nothing else.
//
// Every test file belongs to exactly one area (the first pattern that matches; "tools" is the default for anything unlisted).
// A change runs the areas its paths trigger. Type check, build and lint always run. A path that no rule below matches, or one that
// every area may use (shared code, the registry, config), runs EVERYTHING: when unsure, run all.
//
// Areas (work in seconds on a laptop, 2026-11-20): cpa (Critical Path and levelling, ~220), flow (Network Flows, ~330), graphs (MST, TSP, Route
// Inspection, ~5), mechanics (Dimensional Analysis, Work Done, Energy and the mechanics diagrams, ~10), decision (the checks that span the Decision shell, ~10),
// cross (the checks that run over every tool: generators, seeded replay, recent questions…, ~60), tools (each maths tool's own tests, ~50),
// decks (~40), cs (~5), docs (~5: docs, patch notes and the checks that read every tool's source).

/** Test files by area. Patterns are tested against the file name, e.g. "cpaExam.test.ts". */
export const TEST_AREAS = {
  docs: /^(claudeDocs|glossary|adminNotes|dashboardCounts|toolFactsTruth|registryIds|levelLabels|prompts|aboutTool|patchNotes|testAreas|testShards)\.test\.ts$/,
  cpa: /^(cpa.*|criticalPath(Options|Split)|levelling.*|workerLabels)\.test\.ts$/,
  flow: /^(flow(?!chart).*|superFlow)\.test\.ts$/,
  graphs: /^(mst|routeInspection|tsp.*|graphBank|decisionRandomNetwork|decisionTsp)\.test\.ts$/,
  mechanics: /^(dim|mechanics.*|workDone|energy|power|elastic)\.test\.ts$/,
  decision: /^(decision|decisionOptions|decisionPairings|decisionPairingsTools)\.test\.ts$/,
  decks: /^(deck.*|decks.*|slidePrint|relayout|splitLayout|whiteboardDeck|rectilinear.*|migrateDecks|curatedQuestion.*|flowchart|playerBar|textbookSheet|vennSheet|vennLayout|ratioDeckQuestions|printFrame|printBasket|newerCode)\.test\.ts$/,
  cs: /^(cs-topics|binaryTools|dataUnits|fileSizes.*|placeValueBases|wordsBingo)\.test\.ts$/,
  // the checks that run over every tool
  cross: /^(generators|seedReplay|recentQuestions|organisation|qoTabs|questionExtras|savedQuestions|seededReformat|hookDisables|localExports|depth|redraw)\.test\.ts$/,
  // everything else: each maths tool's own tests and the shell's
  tools: /.*/,
};
export const AREA_ORDER = ["docs", "cpa", "flow", "graphs", "mechanics", "decision", "decks", "cs", "cross", "tools"];   // the first match wins

/** Which area a test file (name only) belongs to. */
export const areaOfTest = (name) => AREA_ORDER.find((a) => TEST_AREAS[a].test(name));

const DECISION_ALL = ["decision", "cpa", "flow", "graphs", "mechanics"];
// a change to one Decision topic runs that topic, the checks that span the shell, and the cross-tool and docs checks
const topic = (area) => [area, "decision", "cross", "docs"];

/** Changed path → the areas it triggers. First matching rule wins. "all" means every area. */
export const PATH_RULES = [
  [/^specs\/.*\.ts$/, ["decks"]],                      // deck build scripts
  [/^(docs\/|specs\/|.*\.md$|src\/generated\/|\.claude\/)/, ["docs"]],
  [/^src\/shared\/decision\/(cpa|CpaTileArt|printCpa)|^src\/tools\/Decision\/(CriticalPath|Cpa)/, topic("cpa")],
  // the graph topics build on two flow files (graphBank uses the flow templates and geometry), so a change to those runs the graph tests too
  [/^src\/shared\/decision\/(flowTemplates|flowGeometry)/, [...topic("flow"), "graphs"]],
  [/^src\/shared\/decision\/(flow|FlowTileArt|cutCurve)|^src\/tools\/Decision\/NetworkFlows/, topic("flow")],
  [/^src\/shared\/decision\/(mst|tsp|routeInspection|graphBank)|^src\/tools\/Decision\/(MinimumSpanningTree|TravellingSalesperson|RouteInspection)/, topic("graphs")],
  [/^src\/shared\/decision\/(dim|DimWorking)|^src\/tools\/FurtherMechanics\/|^src\/shared\/mechanics\//, topic("mechanics")],
  // the Decision shell itself and what every Decision topic uses (the shell, types, options, layout, representations, print, the hub): every Decision topic
  [/^src\/shared\/decision\/|^src\/tools\/Decision\//, [...DECISION_ALL, "cross", "docs"]],
  [/^src\/shared\/cs\/|^src\/tools\/(ComputerScience|Binary)\//, ["cs", "cross", "docs"]],
  [/^(src\/decks\/|api\/|src\/components\/Deck|scripts\/deck)/, ["decks"]],
  [/^src\/tools\//, ["tools", "cross", "docs"]],
  [/^src\/tests\/[^/]+\.test\.ts$/, null],           // a changed test file runs its own area (see areasForChange)
  [/^src\/(shared|admin|components|pages)\/|^src\/[^/]+\.(ts|tsx|css)$|^(package(-lock)?\.json|vite\.config\.ts|tsconfig.*|eslint.*|\.github\/|scripts\/(testAreas|selectTests)|src\/tests\/)/, ["all"]],
];

// Which tools a changed file under src/shared/decision/ can affect (for the cross-tool checks). Checked by reading the imports: no Decision topic imports
// another except the graph topics, which use the flow templates and geometry; the Decision tools reach their topic through the shell, and only
// Dimensional Analysis (mechanics) imports the dim files directly.
const T = "src/tools/Decision/", CPA = T + "CriticalPath.tsx", CPAT = T + "CpaTimes.tsx", FLOW = T + "NetworkFlows.tsx", MST = T + "MinimumSpanningTree.tsx", TSP = T + "TravellingSalesperson.tsx", ROUTE = T + "RouteInspection.tsx", DIM = "src/tools/FurtherMechanics/DimensionalAnalysis.tsx", WORK = "src/tools/FurtherMechanics/WorkDone.tsx", ENERGY = "src/tools/FurtherMechanics/Energy.tsx", POWER = "src/tools/FurtherMechanics/Power.tsx", ELASTIC = "src/tools/FurtherMechanics/Elastic.tsx";
const TOPIC_TOOLS = [
  [/^src\/shared\/decision\/(cpa|CpaTileArt|printCpa)/, [CPA, CPAT]],
  [/^src\/shared\/decision\/(flowTemplates|flowGeometry)/, [FLOW, MST, TSP, ROUTE]],
  [/^src\/shared\/decision\/(flow|FlowTileArt|cutCurve)/, [FLOW]],
  [/^src\/shared\/decision\/mst/, [MST]],
  [/^src\/shared\/decision\/tsp/, [TSP]],
  [/^src\/shared\/decision\/routeInspection/, [ROUTE]],
  [/^src\/shared\/decision\/graphBank/, [MST, TSP, ROUTE]],
  [/^src\/shared\/decision\/(dim|DimWorking)/, [DIM]],
  [/^src\/shared\/decision\/mechSolve/, [WORK, ENERGY, POWER, ELASTIC]],
  [/^src\/shared\/mechanics\//, [WORK, ENERGY, POWER, ELASTIC]],
];

/** The tool file a changed path stands for (the tool itself or its About words), or null for any other file. Read from the generated tool facts. */
const toolFiles = () => new Set(JSON.parse(readFileSync("src/generated/toolFacts.json", "utf8")).tools.map((t) => t.file));
export const toolEntryOf = (file) => { const all = toolFiles(); if (all.has(file)) return file; const own = file.replace(/\.about\.ts$/, ".tsx"); return own !== file && all.has(own) ? own : null; };

/**
 * The checks in the `cross` area run over every tool. When the only things in a change that need them are tool files (a tool, or its About words),
 * they need to run for those tools alone: this returns their paths. It returns null (run them for every tool) when anything else needs them
 * (a shared file outside the Decision folder, a helper in a tool folder, a changed cross-tool test) or when no tool file is involved. A file under
 * src/shared/decision/ maps to the Decision tools it can affect (TOPIC_TOOLS below).
 */
export function toolFilter(changed) {
  const found = new Set();
  for (const f of changed) {
    const rule = PATH_RULES.find(([re]) => re.test(f));
    if (!rule) return null;
    const [, areas] = rule;
    const needsCross = areas === null ? areaOfTest(f.split("/").pop()) === "cross" : areas.includes("all") || areas.includes("cross");
    if (!needsCross) continue;
    const topicTools = TOPIC_TOOLS.find(([re]) => re.test(f))?.[1];
    if (topicTools) { topicTools.forEach((t) => found.add(t)); continue; }
    if (/^src\/shared\/decision\//.test(f)) { [...toolFiles()].filter((t) => /^src\/tools\/(Decision|FurtherMechanics)\//.test(t)).forEach((t) => found.add(t)); continue; }   // the shell itself: every Decision and mechanics tool
    const tool = areas === null ? null : toolEntryOf(f);
    if (!tool) return null;
    found.add(tool);
  }
  return found.size ? [...found].sort() : null;
}

/** The areas to run for a list of changed files, or "all". */
export function areasForChange(files) {
  const out = new Set();
  for (const f of files) {
    const rule = PATH_RULES.find(([re]) => re.test(f));
    if (!rule) return "all";                                  // unknown path: run everything
    const [, areas] = rule;
    if (areas === null) { out.add(areaOfTest(f.split("/").pop())); continue; }
    if (areas.includes("all")) return "all";
    areas.forEach((a) => out.add(a));
  }
  return [...out];
}
