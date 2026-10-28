// Reads the written project docs and turns the parts the Tools dashboard shows into src/generated/adminDocs.json,
// so the dashboard never holds a second copy of them:
//   guide — docs/HOW_A_TOOL_IS_BUILT.md (every "## " section)
//   features — docs/FEATURES.md (every "## " group and "### " feature)
//   tasks — docs/TASKS.md (every "### " task under its "## " status heading)
//   pathways — docs/pathways/*.md (status, measure, updated and the "## " sections of each pathway)
// Run: npm run facts (writes) · node scripts/adminDocs.mjs --check (the stale-docs test uses it).
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/generated/adminDocs.json");

const cells = line => line.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());

/** Markdown lines → blocks: paragraphs, bullet lists, pipe tables. */
function toBlocks(lines) {
  const blocks = []; let para = [];
  const flush = () => { if (para.length) { blocks.push({ t: "p", s: para.join(" ") }); para = []; } };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim()) { flush(); continue; }
    if (l.trim().startsWith("|")) {
      flush();
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(cells(lines[i])); i++; }
      i--;
      blocks.push({ t: "table", head: rows[0], rows: rows.slice(2) });
    } else if (/^\s*[-*] /.test(l)) {
      flush();
      const items = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*] /, "").trim()); i++; }
      i--;
      blocks.push({ t: "ul", items });
    } else if (l.startsWith(">")) {
      para.push(l.replace(/^>\s?/, ""));
    } else para.push(l.trim());
  }
  flush();
  return blocks;
}

/** Split lines into sections at headings of the given levels (e.g. ["## "]). */
function sections(lines, marks) {
  const out = []; let cur = null;
  for (const l of lines) {
    const m = marks.find(x => l.startsWith(x));
    if (m) { cur = { title: l.slice(m.length).trim(), level: m.trim().length, lines: [] }; out.push(cur); }
    else if (cur) cur.lines.push(l);
  }
  return out.map(s => ({ title: s.title, level: s.level, blocks: toBlocks(s.lines) }));
}

/** docs/TASKS.md → [{ status, title, blocks }]. */
function readTasks() {
  const out = []; let status = "", cur = null;
  for (const l of readFileSync(join(ROOT, "docs/TASKS.md"), "utf8").split("\n")) {
    if (l.startsWith("## ")) { status = l.slice(3).trim(); cur = null; }
    else if (l.startsWith("### ")) { cur = { status, title: l.slice(4).trim(), lines: [] }; out.push(cur); }
    else if (cur) cur.lines.push(l);
  }
  return out.map(t => ({ status: t.status, title: t.title, blocks: toBlocks(t.lines) }));
}

/** docs/pathways/*.md → [{ id, title, status, measure, updated, sections }]. */
function readPathways() {
  const dir = join(ROOT, "docs/pathways");
  return readdirSync(dir).filter(f => f.endsWith(".md") && f !== "README.md").sort().map(f => {
    const lines = readFileSync(join(dir, f), "utf8").split("\n");
    const head = key => (lines.find(l => l.startsWith(`- **${key}:**`)) ?? "").replace(`- **${key}:**`, "").trim();
    const firstSection = lines.findIndex(l => l.startsWith("## "));
    return {
      id: f.replace(/\.md$/, ""), title: lines[0].replace(/^# /, "").trim(),
      status: head("Status"), measure: head("Measure"), updated: head("Updated"),
      sections: sections(lines.slice(firstSection), ["## "]),
    };
  });
}

function computeAdminDocs() {
  const guideSrc = readFileSync(join(ROOT, "docs/HOW_A_TOOL_IS_BUILT.md"), "utf8").split("\n");
  const guide = sections(guideSrc, ["## "]);
  const featSrc = readFileSync(join(ROOT, "docs/FEATURES.md"), "utf8").split("\n");
  const featIntro = [];
  for (const l of featSrc.slice(1)) { if (l.startsWith("## ")) break; featIntro.push(l); }
  const features = [{ title: "About this page", level: 1, blocks: toBlocks(featIntro) }, ...sections(featSrc, ["## ", "### "])];
  return { guide: tidyGuide(guide), features: tidyFeatures(features), tasks: readTasks(), pathways: readPathways() };
}

/** The dashboard shows content only: no process notes, build instructions or how-to-use-this-page paragraphs. */
const keepTables = s => ({ ...s, blocks: s.blocks.filter(b => b.t === "table") });
const dropLastParagraph = s => ({ ...s, blocks: s.blocks.at(-1)?.t === "p" ? s.blocks.slice(0, -1) : s.blocks });
function tidyGuide(sections) {
  return sections
    .filter(s => !/^(Things to be aware of|Making a new tool)/.test(s.title))
    .map(s => /^(What is inside a tool file|Extra files)/.test(s.title) ? dropLastParagraph(s) : s)
    .map(s => ({ ...s, title: s.title.replace(/ \(do not rebuild it\)$/, "") }));
}
function tidyFeatures(sections) {
  const out = [];
  let skip = false;
  for (const s of sections) {
    if (s.level === 1) continue;
    if (s.level === 2) skip = /^On the dashboard/.test(s.title);
    if (!skip) out.push(s);
  }
  return out;
}

const render = d => JSON.stringify(d, null, 1) + "\n";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const next = render(computeAdminDocs());
  if (process.argv.includes("--check")) {
    const cur = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
    if (cur !== next) { console.error("src/generated/adminDocs.json is out of date — run: npm run facts"); process.exit(1); }
  } else {
    writeFileSync(OUT, next);
    const d = JSON.parse(next);
    console.log(`adminDocs.json: ${d.guide.length} guide sections, ${d.tasks.length} tasks, ${d.pathways.length} pathways, ${d.features.length} feature sections`);
  }
}
