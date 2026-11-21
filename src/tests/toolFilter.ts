// The checks that run over every tool (generators, seed replay, recent questions…) can be told to run over only some of them: CI sets
// TOOL_FILES to the tool files a change touched (scripts/selectTests.mjs), e.g. TOOL_FILES=src/tools/Algebra/Indices.tsx,src/tools/Number/Rounding.tsx.
// Unset, every tool is checked. The "at least N tools were found" sanity checks apply only when nothing is filtered.
export const filtered = !!process.env.TOOL_FILES;
const wanted = new Set((process.env.TOOL_FILES ?? "").split(",").map((p) => p.trim().replace(/^src\//, "../")).filter(Boolean));
export const pickTools = <T,>(entries: [string, T][]): [string, T][] => (filtered ? entries.filter(([p]) => wanted.has(p)) : entries);
