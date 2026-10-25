// Tool facts — everything about each tool that can be read straight from the code, so the admin
// dashboard (/admin) never goes stale. Writes src/generated/toolFacts.json.
//   node scripts/toolFacts.mjs --write   regenerate (also runs before every build)
//   node scripts/toolFacts.mjs --check   exit 1 if the committed file is out of date (CI)
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/generated/toolFacts.json");
const str = "(?:'((?:[^'\\\\]|\\\\.)*)'|\"((?:[^\"\\\\]|\\\\.)*)\")";
const unesc = s => s.replace(/\\'/g, "'");

function parseRegistry(text) {
  const tools = [];
  let category = "", subject = "GCSE Maths";
  for (const line of text.split("\n")) {
    let m = line.match(/^ {4}name: '((?:[^'\\]|\\.)*)',\s*$/);
    if (m) { category = unesc(m[1]); subject = "GCSE Maths"; continue; }
    m = line.match(/^ {4}subject: '((?:[^'\\]|\\.)*)',\s*$/);
    if (m) { subject = unesc(m[1]); continue; }
    if (/^\s*(\/\/|\*)/.test(line)) continue;
    const imp = line.match(/load: \(\) => import\('\.\/(tools\/[^']+)'\)/);
    if (!imp) continue;
    const field = re => { const f = line.match(re); return f ? unesc(f[1] ?? f[2]) : undefined; };
    tools.push({
      id: field(new RegExp(`\\bid: ${str}`)),
      path: field(new RegExp(`\\bpath: ${str}`)),
      name: field(new RegExp(`\\bname: ${str}`)),
      description: field(new RegExp(`\\bdescription: ${str}`)),
      group: field(new RegExp(`\\bgroup: ${str}`)),
      category, subject,
      enabled: !/enabled: false/.test(line),
      hidden: /hidden: true/.test(line),
      parked: /parked: true/.test(line),
      file: `src/${imp[1]}.tsx`,
    });
  }
  return tools;
}

/** Number of top-level keys inside the `tools: { … }` of a ToolShell TOOL_CONFIG, or null. */
function subToolCount(src) {
  const at = src.search(/TOOL_CONFIG[^=]*=\s*\{/);
  if (at < 0) return null;
  const t = src.indexOf("tools:", at);
  if (t < 0) return null;
  let i = src.indexOf("{", t);
  if (i < 0) return null;
  let depth = 0, keys = 0;
  for (let k = i; k < src.length; k++) {
    const c = src[k];
    if (c === "{") { depth++; if (depth === 2) keys++; }
    else if (c === "}") { depth--; if (depth === 0) return keys || null; }
  }
  return null;
}

// What kind of thing a registry entry is, so the dashboard never weighs a technique preview or a
// game the same as a whole teaching tool. Rules first, explicit overrides win.
//   tool       a teaching tool: question generator / revision tool / network-native tool
//   sandbox    open-ended interactive, manipulative or classroom utility
//   game       a vocabulary or practice game
//   generator  a standalone PDF worksheet generator
//   workshop   internal build pages (templates, libraries, technique previews) — not for teachers
const KIND_OVERRIDES = {
  "tool-shell": "workshop", "skill-library": "workshop", "technique-library": "workshop",
  visualiser: "sandbox", "network-sandbox": "sandbox",
};
function kindOf(t) {
  if (KIND_OVERRIDES[t.id]) return KIND_OVERRIDES[t.id];
  if (t.id.startsWith("technique-preview-")) return "workshop";
  if (t.id.startsWith("maths-words-")) return "game";
  if (t.category === "Generators") return "generator";
  if (t.category === "Interactive Tools") return "sandbox";
  return "tool";
}

const REPS = [
  [/ratioTable|RatioTable/, "Ratio table"],
  [/placeValue|PlaceValueTable|pvStep/, "Place value table"],
  [/shared\/counters|Counters\b|countersStep/, "Negative counters"],
  [/BidmasPyramid/, "BIDMAS pyramid"],
  [/SmartGrapher|graphStep|GraphBuildSpec/, "Graph"],
  [/NumberLine|numberLine/, "Number line"],
  [/diagramSplit|withDiagramSteps|handleDiagramPrint/, "SVG diagram"],
  [/AlgebraTiles/, "Algebra tiles"],
  [/\bbars\b.*num|BarModel|barModel/, "Bar model"],
];

function sourceFacts(src, tool, specs) {
  const shell = /<ToolShell\b/.test(src) ? "ToolShell"
    : /shared\/decision|DecisionShell/.test(src) ? "DecisionShell"
    : /shared\/cs|CSShell/.test(src) ? "CSShell" : "Standalone";
  const has = re => re.test(src);
  const representations = REPS.filter(([re]) => re.test(src)).map(([, n]) => n);
  const calibration = existsSync(join(ROOT, tool.file.replace(/\.tsx$/, ".calibration.ts")));
  return {
    shell,
    subTools: shell === "ToolShell" ? subToolCount(src) : null,
    lines: src.split("\n").length,
    depth: has(/depthItems\s*=/),
    teach: has(/teachingSlides\s*=|teachingLessons\s*=/),
    lessons: has(/\blessons\s*=\s*\{/),
    workedSplit: has(/stepVisualRenderer|diagramStepVisual|withDiagramSteps|graphStepVisual/),
    calibrated: calibration || has(/_rawDifficulty/),
    smartProgressor: has(/\bweight:\s*\d/) || has(/_difficultyScore/),
    scaffold: has(/workingScaffold/),
    reformat: has(/reformatQuestion/),
    customPrint: has(/customPrintHandler/),
    tests: has(/export const __test/),
    skillLinks: has(/\[\[[a-z0-9-]+\|/),
    representations,
    spec: specs.has(tool.id) || specs.has(tool.path.replace(/^\//, "")),
  };
}

function listSpecs() {
  const ids = new Set();
  const walk = dir => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      if (f.isDirectory()) walk(join(dir, f.name));
      else if (f.name.endsWith(".md")) ids.add(f.name.replace(/\.md$/, ""));
    }
  };
  walk(join(ROOT, "specs"));
  return ids;
}

function computeToolFacts() {
  const registry = parseRegistry(readFileSync(join(ROOT, "src/registry.ts"), "utf8"));
  const specs = listSpecs();
  const tools = registry.map(t => {
    const p = join(ROOT, t.file);
    const src = existsSync(p) ? readFileSync(p, "utf8") : "";
    return { ...t, kind: kindOf(t), ...sourceFacts(src, t, specs) };
  });
  return { tools };
}

const render = facts => JSON.stringify(facts, null, 1) + "\n";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const next = render(computeToolFacts());
  if (process.argv.includes("--check")) {
    const cur = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
    if (cur !== next) { console.error("src/generated/toolFacts.json is out of date — run: npm run facts"); process.exit(1); }
  } else {
    writeFileSync(OUT, next);
    console.log(`toolFacts.json: ${JSON.parse(next).tools.length} tools`);
  }
}
