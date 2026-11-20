// The plain list of test areas: which test files belong to which area, and which changed paths trigger which area.
// Used by scripts/selectTests.mjs (CI) and checked by src/tests/testAreas.test.ts. Edit the lists here, nothing else.
//
// Every test file belongs to exactly one area (the first pattern that matches; "tools" is the default for anything unlisted).
// A change runs the areas its paths trigger. Type check, build and lint always run. A path that no rule below matches, or one that
// every area may use (shared code, the registry, config), runs EVERYTHING: when unsure, run all.
//
// Areas (work in seconds on a laptop, 2026-11-20): cpa (Critical Path and levelling, ~220), flow (Network Flows, ~330), graphs (MST, TSP, Route
// Inspection, ~5), mechanics (Dimensional Analysis and the mechanics diagrams, ~10), decision (the checks that span the Decision shell, ~10),
// cross (the checks that run over every tool: generators, seeded replay, recent questions…, ~60), tools (each maths tool's own tests, ~50),
// decks (~40), cs (~5), docs (~5: docs, patch notes and the checks that read every tool's source).

/** Test files by area. Patterns are tested against the file name, e.g. "cpaExam.test.ts". */
export const TEST_AREAS = {
  docs: /^(claudeDocs|glossary|adminNotes|dashboardCounts|registryIds|levelLabels|prompts|aboutTool|patchNotes|testAreas)\.test\.ts$/,
  cpa: /^(cpa.*|criticalPathOptions|levellingMethod|workerLabels)\.test\.ts$/,
  flow: /^(flow(?!chart).*|superFlow)\.test\.ts$/,
  graphs: /^(mst|routeInspection|tsp.*|graphBank|decisionRandomNetwork|decisionTsp)\.test\.ts$/,
  mechanics: /^(dim|mechanics.*)\.test\.ts$/,
  decision: /^(decision|decisionOptions|decisionPairings)\.test\.ts$/,
  decks: /^(deck.*|decks.*|slidePrint|relayout|splitLayout|whiteboardDeck|rectilinear.*|migrateDecks|curatedQuestion.*|flowchart|playerBar|textbookSheet|ratioDeckQuestions|printFrame|printBasket|newerCode)\.test\.ts$/,
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
  [/^src\/shared\/decision\/(cpa|CpaTileArt|printCpa)|^src\/tools\/Decision\/CriticalPath/, topic("cpa")],
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
