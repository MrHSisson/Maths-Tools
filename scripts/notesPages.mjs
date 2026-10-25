// Builds the text of each tool's planner page blocks (At a glance, What it does, Sub-tools, Levels,
// Question options, Defaults) from src/generated/toolFacts.json + the tools' own TOOL_CONFIGs.
// Used by hand at the end of a session that changed tools (see CLAUDE.md, "Keeping the three sources in step"):
//   1. NOTES_DUMP_DIR=/tmp/maths-tools-notes DUMP_CONFIGS=1 npx vitest run src/tests/dumpToolConfigs.test.ts
//   2. node scripts/notesPages.mjs            -> /tmp/maths-tools-notes/pages.json
//   3. paste the changed pages into the planner (update_block; one edit per block per batch).
// Never writes to the repo or the planner itself.
import fs from "fs";
const S = process.argv[2] || process.env.NOTES_DUMP_DIR || "/tmp/maths-tools-notes";
const facts = JSON.parse(fs.readFileSync("src/generated/toolFacts.json")).tools;
const cfgs = JSON.parse(fs.readFileSync(S + "/configs.json"));
const T = new Date().toISOString().slice(0, 10);
const pageName = { "maths-words-bingo": "Words Bingo", "maths-words-hangman": "Words Hangman", "maths-words-pairs": "Words Pairs", "system architecture": "System Architectures", "cpu-architecture": "CPU Architecture", "cpu-performance": "CPU Performance", perimeter: "Perimeter (DevGated)" };
const state = (t) => t.parked ? "Parked (needs ?parked=1; the route does not exist without it)" : t.hidden ? "Hidden (never listed; the route works by direct link)" : t.enabled ? "Live (on the landing page for everyone)" : "In development (only visible with Developing-tools mode on)";
const lvName = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };
const defaultsLabel = { numQuestions: "starts at {} questions", numColumns: "starts at {} columns", maxColumns: "at most {} columns", fixedColumns: "column count is fixed", hideFontControls: "no text-size buttons (the pictures set their own size)", collapseWorkingByDefault: "the working panel starts collapsed", hideAnswerStep: "no separate answer box in the Worked Example (the last step is the answer)", qoColumns: "Question Options open in two columns", maxColumnsByLevel: "column limit by level: {}", maxColumnsByTool: "column limit by sub-tool: {}", worksheetFontControls: "text-size buttons stay on the worksheet",  workedExampleLayout: "Worked Example layout: {}" };
const rows = {};
const jstr = (x) => JSON.stringify(x);
for (const t of facts) {
  if (t.kind === "workshop") continue;
  const file = t.file.replace("src/tools/", "");
  const cfg = cfgs[file];
  const src = fs.readFileSync(t.file, "utf8");
  const out = {};
  const feats = [];
  if (t.depth) feats.push("Depth (curated diagnose, explain and extend questions)");
  if (t.lessons) feats.push("Lessons (Developing-tools mode)");
  if (t.teach) feats.push("A Teach deck (Developing-tools mode)");
  if (t.workedSplit) feats.push("A developing picture in the Worked Example (one picture that updates as the steps advance)");
  if (t.scaffold) feats.push("A working scaffold (a reference picture in the whiteboard's working box)");
  if (t.calibrated) feats.push("Calibrated Smart Progressor (worksheets spread across eight difficulty bands)");
  else if (t.smartProgressor) feats.push("Smart Progressor (worksheets run easy to hard using option weights)");
  if (t.reformat) feats.push("Instant reformat (switching a display option re-shows the same question)");
  if (t.customPrint) feats.push("A custom print handler for its pictures");
  if (t.skillLinks) feats.push("Skill links in the working (plain text while the Skill Library is parked)");
  for (const r of t.representations || []) feats.push("Picture: " + r);
  const lvl = cfg ? (() => { const s = Object.values(cfg.subs); const ls = [...new Set(s.flatMap((x) => x.levels))].sort(); return ls.map((l) => l.replace("level", "")).join(", "); })() : null;
  out.glance = [
    `- **Status:** ${state(t)}`,
    `- **Route:** \`${t.path}\``,
    `- **File:** \`${file}\``,
    `- **Shell:** ${t.shell}${t.shell === "Standalone" ? " (its own page, not a question-generator shell)" : ""}`,
    `- **Where it sits:** ${t.subject} › ${t.category}`,
    (cfg ? Object.keys(cfg.subs).length : t.subTools) ? `- **Sub-tools:** ${cfg ? Object.keys(cfg.subs).length : t.subTools}` : null,
    lvl ? `- **Levels:** ${lvl.replace(/, /g, ", ")}` : null,
    `- **Has:**${feats.length ? "" : " nothing beyond the standard shell"}`,
    ...feats.map((f) => "  - " + f),
    `- **Checked against the code on ${T}.** The Tools dashboard (/admin) shows the live version of these facts.`,
  ].filter((x) => x !== null).join("\n");
  out.what = t.description;
  if (cfg) {
    out.subs = Object.entries(cfg.subs).map(([k, s]) => `- **${s.name}**${s.instruction ? ` — students see “${s.instruction}”` : ""}${s.levels.length < 3 ? ` (Levels ${s.levels.map((l) => l.replace("level", "")).join(" and ")} only)` : ""}`).join("\n");
    out.levels = Object.entries(cfg.subs).map(([k, s]) => `- **${s.name}:** ${s.levels.length === 3 ? "Levels 1, 2 and 3" : "Levels " + s.levels.map((l) => l.replace("level", "")).join(" and ") + " (the others are hidden)"}`).join("\n");
    const renderLevel = (L) => {
      const lines = [];
      for (const v of L.vars) lines.push(`  - ${v.label} — switch, ${v.on ? "on" : "off"} to start`);
      if (L.dd) lines.push(`  - ${L.dd.label} — choose one: ${L.dd.opts.map((o) => o.l + (o.on ? " (starts here)" : "")).join(" / ")}`);
      for (const g of L.ms) lines.push(`  - ${g.label} — ${g.exclusive ? "choose one" : "pick any"}: ${g.options.map((o) => (o.on ? "✓ " : "") + o.label + (o.req ? " (needs other options)" : "")).join(" / ")}`);
      return lines.length ? lines : ["  - No options"];
    };
    const parts = [];
    for (const [k, s] of Object.entries(cfg.subs)) {
      parts.push(`**${s.name}**`);
      const groups = [];
      for (const l of s.levels) {
        const sig = jstr(s.lv[l]);
        const g = groups.find((x) => x.sig === sig);
        if (g) g.levels.push(l); else groups.push({ sig, levels: [l], L: s.lv[l] });
      }
      for (const g of groups) {
        const nm = g.levels.length === s.levels.length && groups.length === 1 ? "Every level" : g.levels.map((l) => lvName[l]).join(" and ");
        parts.push(`- ${nm}`);
        parts.push(...renderLevel(g.L));
      }
      parts.push("");
    }
    parts.push("A ✓ means the option is on when the tool opens. Options marked * in the tool go beyond standard questioning and start off.");
    out.qo = parts.join("\n");
  }
  const srcNC = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  const m = srcNC.match(/defaults=\{\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\}/);
  if (m) {
    const items = [...m[1].matchAll(/(\w+):\s*(\{[^}]*\}|\[[^\]]*\]|[^,]+)/g)].map(([, k, v]) => [k, v.trim()]);
    out.defaults = items.filter(([k]) => !["displayFontSize","worksheetFontSize"].includes(k)).map(([k, v]) => "- " + (defaultsLabel[k] ? defaultsLabel[k].replace("{}", v.replace(/[{}\s]/g,"").replace(/,/g,", ").replace(/:/g,": ")) : `${k} = ${v}`)).join("\n");
  }
  rows[pageName[t.id] || t.name] = { id: t.id, ...out };
}
fs.writeFileSync(S + "/pages.json", JSON.stringify(rows, null, 1));
console.log("wrote", Object.keys(rows).length, "pages to", S + "/pages.json");
