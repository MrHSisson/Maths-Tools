// The plain list of test areas: which test files belong to which area, and which changed paths trigger which area.
// Used by scripts/selectTests.mjs (CI) and checked by src/tests/testAreas.test.ts. Edit the lists here, nothing else.
//
// Every test file belongs to exactly one area (the first pattern that matches; "tools" is the default for anything unlisted).
// A change runs the areas its paths trigger. Type check, build and lint always run. A path that no rule below matches, or one that
// every area may use (shared code, the registry, config), runs EVERYTHING: when unsure, run all.

/** Test files by area. Patterns are tested against the file name, e.g. "cpaExam.test.ts". */
export const TEST_AREAS = {
  decision: /^(decision.*|cpa.*|criticalPathOptions|flow(?!chart).*|superFlow|dim|mst|routeInspection|tsp.*|levellingMethod|workerLabels|graphBank)\.test\.ts$/,
  decks: /^(deck.*|decks.*|slidePrint|relayout|splitLayout|whiteboardDeck|rectilinear.*|migrateDecks|curatedQuestion.*|flowchart|playerBar|textbookSheet|ratioDeckQuestions|printFrame|printBasket|newerCode)\.test\.ts$/,
  cs: /^(cs-topics|binaryTools|dataUnits|fileSizes.*|placeValueBases|wordsBingo)\.test\.ts$/,
  docs: /^(claudeDocs|glossary|adminNotes|dashboardCounts|registryIds|levelLabels|prompts|aboutTool|patchNotes|testAreas)\.test\.ts$/,
  // everything else: question generators, the tool shell, and the checks that look across every tool (generators, seedReplay, organisation…)
  tools: /.*/,
};
export const AREA_ORDER = ["docs", "decision", "decks", "cs", "tools"];   // docs first: its names win over the others

/** Which area a test file (name only) belongs to. */
export const areaOfTest = (name) => AREA_ORDER.find((a) => TEST_AREAS[a].test(name));

/** Changed path → the areas it triggers. First matching rule wins. "all" means every area. */
export const PATH_RULES = [
  [/^specs\/.*\.ts$/, ["decks"]],                      // deck build scripts
  [/^(docs\/|specs\/|.*\.md$|src\/generated\/|\.claude\/)/, ["docs"]],
  // the "docs" area also holds the checks that read every tool's source (option labels, About files, registry ids), so any tool change runs it
  [/^src\/shared\/decision\/|^src\/tools\/Decision\//, ["decision", "tools", "docs"]],
  [/^src\/shared\/cs\/|^src\/tools\/(ComputerScience|Binary)\//, ["cs", "tools", "docs"]],
  [/^(src\/decks\/|api\/|src\/components\/Deck|scripts\/deck)/, ["decks"]],
  [/^src\/tools\//, ["tools", "docs"]],
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
