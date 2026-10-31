// Before a deck is built on a tool: is the tool ready to be used in one? Run by `npm run deck -- preflight <tool-id>` at the start of a
// deck, so what is missing is found (and built as part of that deck) rather than discovered in review. Reports in plain words.
import { readFileSync } from "node:fs";
import { GENERATOR_TOOLS, generateFrom, loadConfig, loadDepthItems, offered } from "./generators";
import type { DifficultyLevel } from "../shared";

const LEVELS: DifficultyLevel[] = ["level1", "level2", "level3"];

export async function preflightTool(tool: string): Promise<{ lines: string[]; problems: string[] }> {
  const lines: string[] = [], problems: string[] = [];
  const cfg = await loadConfig(tool);
  if (!cfg || !GENERATOR_TOOLS.some(([id]) => id === tool)) { problems.push(`"${tool}" is not a question tool a deck can run (see the list in src/decks/generators.ts)`); return { lines, problems }; }

  // 1. Every tab and level draws questions without throwing
  const drawn: string[] = [];
  for (const sub of Object.keys(cfg.tools)) for (const level of LEVELS) {
    let made = 0;
    for (let n = 0; n < 20; n++) {
      try { if (await generateFrom(tool, { sub, level }, n + 1)) made++; } catch (e) { problems.push(`${tool} ${sub} ${level}: the generator threw: ${(e as Error).message}`); break; }
    }
    if (made) drawn.push(`${sub} ${level.slice(-1)}`);
  }
  lines.push(`Generator: ${drawn.length} tab and level combinations draw questions (${drawn.join(", ")})`);

  // 2. A mixed set is really mixed: where several options are on at once, no one kind of question should take most of the set
  const skewed: string[] = [];
  for (const sub of Object.keys(cfg.tools)) for (const level of LEVELS) {
    const o = offered(cfg, sub, level);
    if (!o.pools.some((g) => g.options.filter((x) => x.defaultActive).length > 1)) continue;
    const tally = new Map<string, number>(); let total = 0;
    for (let n = 0; n < 300; n++) { try { const q = await generateFrom(tool, { sub, level }); if (q) { const k = q.key.split("-").slice(0, 3).join("-"); tally.set(k, (tally.get(k) ?? 0) + 1); total++; } } catch { break; } }
    const [top, count] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
    if (total && tally.size > 1 && count / total > 0.7) skewed.push(`${sub} ${level.slice(-1)}: ${Math.round((100 * count) / total)}% are "${top}"`);
  }
  lines.push(skewed.length ? `Mixed options: LOOK AT THESE, one kind takes most of the set (${skewed.join("; ")}). A pool that rejects some kinds' numbers more often than others skews the mix: choose the kind once, then retry the numbers.` : "Mixed options: no one kind dominates a mixed set");

  // 3. Depth bank
  const depth = await loadDepthItems(tool);
  lines.push(depth.length
    ? `Depth bank: ${depth.length} items (${LEVELS.map((l) => `L${l.slice(-1)}: ${depth.filter((i) => i.level === l).length}`).join(", ")}), so Depth cards can be used`
    : "Depth bank: NONE, so this deck cannot have Depth cards. If the lesson needs them, write a bank first (docs/design/templates/DEPTH_SPEC_TEMPLATE.md)");

  // 4. Fixed questions with the tool's own working
  const builder = readFileSync("src/decks/builder.ts", "utf8");
  lines.push(builder.includes(`"${tool}"`)
    ? "Fixed questions: a builder with this tool's own working exists (Q.* in src/decks/builder.ts); use it for every authored set"
    : "Fixed questions: NO builder, so authored sets would be hand-typed. Build one as part of this deck: pull the generator's inner function that takes chosen numbers out into its own file (the pattern is src/tools/Proportion/ratioFromFraction.ts), then add a Q.<name> that calls it, verifies the answer and uses fromWorked");
  return { lines, problems };
}
