// Builds docs/PATCH_NOTES.md from docs/patch-notes/: `_base.md` (the introduction and every entry written before this split) plus one file per
// session, `YYYY-MM-DD-<slug>.md`, so two sessions never edit the same file. A session file starts with `Strand: Maths` or
// `Strand: Computer Science`, then a blank line, then the entry (`## YYYY-MM-DD — Title` …, ending with `Agent:` and `Notes:` lines).
// The entries go at the top of their strand, newest first. Run by `npm run facts` and before every build; `--check` fails if the file is stale.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "docs/patch-notes");
const STRANDS = { Maths: "# Maths", "Computer Science": "# Computer Science" };

export function sessionEntries() {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR).filter((f) => f.endsWith(".md") && !f.startsWith("_")).map((file) => {
    const text = readFileSync(join(DIR, file), "utf8").replace(/\r\n/g, "\n");
    const m = text.match(/^Strand: (Maths|Computer Science)\n\n([\s\S]+)$/);
    const date = m?.[2].match(/^## (\d{4}-\d\d-\d\d)/)?.[1];
    return { file, strand: m?.[1], date, body: m?.[2].trim() ?? "", ok: !!m && !!date };
  });
}

export function buildPatchNotes() {
  let out = readFileSync(join(DIR, "_base.md"), "utf8").replace(/\r\n/g, "\n");
  const entries = sessionEntries().filter((e) => e.ok).sort((a, b) => b.date.localeCompare(a.date) || b.file.localeCompare(a.file));
  for (const [strand, heading] of Object.entries(STRANDS)) {
    const mine = entries.filter((e) => e.strand === strand);
    if (!mine.length) continue;
    const at = out.indexOf(`\n${heading}\n`);
    if (at < 0) throw new Error(`docs/patch-notes/_base.md has no "${heading}" heading`);
    const cut = at + heading.length + 2;
    out = out.slice(0, cut) + "\n" + mine.map((e) => e.body).join("\n\n") + "\n\n" + out.slice(cut).replace(/^\n+/, "");
  }
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = join(ROOT, "docs/PATCH_NOTES.md");
  const built = buildPatchNotes();
  if (process.argv.includes("--check")) {
    if (!existsSync(target) || readFileSync(target, "utf8") !== built) { console.error("docs/PATCH_NOTES.md is stale: run `npm run facts` and commit it."); process.exit(1); }
  } else { writeFileSync(target, built); console.log(`PATCH_NOTES.md: base + ${sessionEntries().length} session file(s)`); }
}
