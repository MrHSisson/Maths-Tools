// Critical Path Analysis is being split from one tool (26 sub-tools) into four skill tools by specification statement, with the
// multi-part exam chains opened from the Decision Maths hub (docs/pathways/critical-path-split.md). This is the one map of where each old
// sub-tool lives, and the redirect that keeps every old `/critical-path?tool=…` link (saved lists, printed sheets, the hub) opening the right
// tool and tab. Pure data and functions: no React, so tests and the router can both use it.

export interface CpaHome { id: string; path: string; name: string; spec: string; purpose: string; subs: string[] }

/** The four skill tools, in the order the hub lists them. `subs` are the old sub-tool keys, in tab order. */
export const CPA_SKILL_TOOLS: CpaHome[] = [
  { id: "cpa-networks", path: "/cpa-networks", name: "Activity Networks", spec: "DE1", purpose: "Draw the activity network from a precedence table, and write the table from a network.", subs: ["network", "table"] },
  { id: "cpa-times", path: "/cpa-times", name: "Times, Float and Critical Paths", spec: "DE2, DE3", purpose: "Find the earliest and latest times of a project, its critical activities and paths, and the float of every other activity.", subs: ["forward", "backward", "full", "floatPaths", "unknown"] },
  { id: "cpa-changes", path: "/cpa-changes", name: "Changes and Reasoning", spec: "DE4", purpose: "See what a delay, a quicker or a removed activity does to a project, and explain it.", subs: ["change", "reason", "shorten", "reasonA"] },
  { id: "cpa-charts", path: "/cpa-charts", name: "Cascade Charts and Resources", spec: "DE5, DE6", purpose: "Draw a cascade chart and a resource histogram, then level the resources when the workers are limited.", subs: ["cascade", "histogram", "level", "alloc"] },
];

/** The exam-style chains: opened from the hub on their own page for now, an exam-paper tool later. */
export const CPA_EXAM: CpaHome = {
  id: "cpa-exam", path: "/cpa-exam", name: "Critical Path Exam Questions", spec: "DE", purpose: "Multi-part exam-style questions on critical path analysis.",
  subs: ["exAsAny", "exBuild", "exClaim", "exChange", "exClock", "exAlAny", "exCascade", "exTable", "exHist", "exShorten", "exAlloc"],
};

export const CPA_ALL_HOMES: CpaHome[] = [...CPA_SKILL_TOOLS, CPA_EXAM];

/** The tool an old sub-tool key now lives in (undefined for a key that never existed). */
export const cpaHomeOf = (sub: string): CpaHome | undefined => CPA_ALL_HOMES.find((h) => h.subs.includes(sub));

/**
 * Where an old Critical Path address now goes. `search` is the old query string: `tool` picks the tab (absent or unknown opens the first tab,
 * as the old tool did), `level` and every `o_…` option carry over, and the two switches that no longer exist (`o_course`, `o_practice`) are
 * dropped because the tool now says which course and kind of practice it is. Anything else in the query is kept.
 */
export function cpaRedirect(search: string): { pathname: string; search: string } {
  const q = new URLSearchParams(search);
  const home = cpaHomeOf(q.get("tool") ?? "") ?? CPA_SKILL_TOOLS[0];
  const out = new URLSearchParams();
  q.forEach((v, k) => { if (k !== "o_course" && k !== "o_practice") out.set(k, v); });
  if (!home.subs.includes(out.get("tool") ?? "")) out.delete("tool");
  const s = out.toString();
  return { pathname: home.path, search: s ? `?${s}` : "" };
}

/** The new tools that exist so far. A tab whose new tool is not built yet stays where it is in the old tool, so each chunk of the split switches its own tabs over. */
const CPA_LIVE: string[] = ["cpa-times", "cpa-networks", "cpa-changes", "cpa-charts"];
/** The new tool an old sub-tool has already moved to, if any. */
export const cpaLiveHomeOf = (sub: string): CpaHome | undefined => { const h = cpaHomeOf(sub); return h && CPA_LIVE.includes(h.id) ? h : undefined; };
/** Where an old-tool address goes now: the new tool's address when its tab has moved, otherwise nothing (the old tool still shows it). */
export function cpaMovedTo(search: string): { pathname: string; search: string } | null {
  return cpaLiveHomeOf(new URLSearchParams(search).get("tool") ?? "") ? cpaRedirect(search) : null;
}
