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
  let category = "", subject = "GCSE Maths", inPages = false;
  for (const line of text.split("\n")) {
    // PAGES (the dashboard, the technique previews) are not tools: they have no state of their own and count as not live
    if (/^export const PAGES\b/.test(line)) { inPages = true; category = "Pages"; subject = "GCSE Maths"; continue; }
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
      enabled: !inPages && !/enabled: false/.test(line),
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
  "tool-shell": "workshop", "skills": "workshop", "techniques": "workshop", "further-mechanics": "workshop", "decision-overview": "workshop", "lp-roadmap": "workshop",
  visualiser: "sandbox", "name-wheel": "sandbox", "advent-calendar": "sandbox",
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

/** Number of entries in a Decision tool's `SUB_TOOLS = [ … ]` list (each is `{ key: "…", … }`), or null. */
function decisionSubTools(src) {
  const at = src.search(/\bSUB_TOOLS\b[^=\n]*=\s*\[/);
  if (at < 0) return null;
  let depth = 0, n = 0;
  for (let k = src.indexOf("[", at); k < src.length; k++) {
    const c = src[k];
    if (c === "[") depth++;
    else if (c === "]") { depth--; if (depth === 0) return n || null; }
    else if (c === "{" && depth === 1) { if (/^\{\s*key:/.test(src.slice(k, k + 14))) n++; }
  }
  return null;
}
/** The number of levels a Decision tool offers (`levels: n` in its config), or null. */
function decisionLevels(src) {
  const m = src.match(/config=\{\{[\s\S]*?\blevels:\s*(\d)/);
  return m ? Number(m[1]) : null;
}

function sourceFacts(src, tool, specs, testImports, decks) {
  const shell = /<ToolShell\b/.test(src) ? "ToolShell"
    : /shared\/decision|DecisionShell/.test(src) ? "DecisionShell"
    : /shared\/cs|CSShell/.test(src) ? "CSShell" : "Standalone";
  const has = re => re.test(src);
  const representations = REPS.filter(([re]) => re.test(src)).map(([, n]) => n);
  const calibration = existsSync(join(ROOT, tool.file.replace(/\.tsx$/, ".calibration.ts")));
  return {
    shell,
    subTools: shell === "ToolShell" ? subToolCount(src) : shell === "DecisionShell" ? decisionSubTools(src) : null,
    levels: shell === "DecisionShell" ? decisionLevels(src) : null,
    lines: src.split("\n").length,
    depth: has(/depthItems\s*=/),
    teach: has(/teachingSlides\s*=|teachingLessons\s*=/),
    lessons: has(/\blessons\s*=\s*\{/),
    workedSplit: has(/stepVisualRenderer|diagramStepVisual|withDiagramSteps|graphStepVisual/),
    calibrated: calibration || has(/calibrated:\s*true/) || has(/_rawDifficulty/),
    scaffold: has(/workingScaffold/),
    reformat: has(/reformatQuestion/),
    customPrint: has(/customPrintHandler/),
    printables: has(/printables=\{|printTemplates:\s*true/),
    printBasket: has(/questionSheet:|skillSheet:|examSheet:/),   // saved questions can be printed from the basket (a sheet, a skill worksheet or exam papers)
    // tested: a generator smoke-test export (`__test`, or `__seed` for a Decision tool), or a test file that imports the tool
    tests: has(/export const __test/) || has(/export const __seed/) || testImports.has(tool.file.replace(/^src\/tools\//, "").replace(/\.tsx$/, "")),
    // explains itself: an About file beside the tool, or (a Decision tool) a purpose sentence in its config
    about: existsSync(join(ROOT, tool.file.replace(/\.tsx$/, ".about.ts"))) || has(/\bpurpose:\s*(["'`]|home\.purpose)/),
    // the lesson decks built for this tool
    decks: decks.filter(d => d.tool === tool.id).map(d => d.id),
    skillLinks: has(/\[\[[a-z0-9-]+\|/),
    representations,
    spec: specs.has(tool.id) || specs.has(tool.path.replace(/^\//, "")),
  };
}

function listSpecs() {
  const ids = new Set();
  const walk = (dir, top) => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      if (f.isDirectory()) walk(join(dir, f.name), false);
      else if (f.name.endsWith(".md")) {
        ids.add(f.name.replace(/\.md$/, ""));
        // a brief at the top of specs/ names its tool in its header: `/lp-simplex` or `lp-simplex` in backticks (deck plans, the corpus and the exam notes are not briefs)
        if (top) {
          const head = readFileSync(join(dir, f.name), "utf8").split("\n").slice(0, 10).join("\n");
          for (const m of head.matchAll(/`(\/?[a-z][a-z0-9-]*)`/g)) ids.add(m[1].replace(/^\//, ""));
        }
      }
    }
  };
  walk(join(ROOT, "specs"), true);
  return ids;
}

/** The tool files that the test files import (as `Decision/SimplexAlgorithm`), so a tool tested through its file counts as tested. */
function listTestImports() {
  const out = new Set();
  const dir = join(ROOT, "src/tests");
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    if (!/\.test\.tsx?$/.test(f)) continue;
    const text = readFileSync(join(dir, f), "utf8");
    for (const m of text.matchAll(/from\s+["'][^"']*\/tools\/([^"']+)["']/g)) out.add(m[1].replace(/\.tsx?$/, ""));
  }
  return out;
}

/** The decks in src/decks/data: their id and the tool each is built on. */
function listDecks() {
  const dir = join(ROOT, "src/decks/data");
  if (!existsSync(dir)) return [];
  const out = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    try { const d = JSON.parse(readFileSync(join(dir, f), "utf8")); if (d && d.id) out.push({ id: d.id, tool: d.tool ?? null }); } catch { /* not a deck */ }
  }
  return out;
}

function computeToolFacts() {
  const registry = parseRegistry(readFileSync(join(ROOT, "src/registry.ts"), "utf8"));
  const specs = listSpecs();
  const testImports = listTestImports();
  const decks = listDecks();
  const tools = registry.map(t => {
    const p = join(ROOT, t.file);
    const own = existsSync(p) ? readFileSync(p, "utf8") : "";
    // a Critical Path tool is a few lines that pick its tabs; the tool itself is the shared CpaTool, so read that too and count only this tool's tabs
    const cpaHome = own.match(/CpaTool\b[\s\S]*\bHOME\b/) && own.match(/(?:CPA_SKILL_TOOLS\.find\(\(h\) => h\.id === "([a-z-]+)"\)|CPA_EXAM)/);
    const shared = cpaHome ? readFileSync(join(ROOT, "src/shared/decision/CpaTool.tsx"), "utf8") : "";
    const f = sourceFacts(own + "\n" + shared, t, specs, testImports, decks);
    if (cpaHome) {
      const homes = readFileSync(join(ROOT, "src/shared/decision/cpaHomes.ts"), "utf8");
      const id = cpaHome[1] ?? "cpa-exam";
      const subs = homes.slice(homes.indexOf(`id: "${id}"`)).match(/subs:\s*\[([^\]]*)\]/);
      if (subs) f.subTools = subs[1].split(",").filter((x) => x.trim()).length;
      f.spec = f.spec || specs.has("critical-path");
    }
    return { ...t, kind: kindOf(t), ...f };
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
