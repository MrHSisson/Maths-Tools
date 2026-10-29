import { useMemo, useState, type ReactNode } from "react";
import { Drawer, PageHead } from "./ui";
import { Search } from "lucide-react";
import docs from "../generated/adminDocs.json";
import { TOOLS, FEATURES, availabilityOf, type ToolFacts } from "./facts";

type Block =
  | { t: "p"; s: string }
  | { t: "ul"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] };
export interface Section { title: string; level: number; blocks: Block[] }
const GUIDE = docs.guide as Section[];
const FEATURE_DOCS = docs.features as Section[];

/** **bold** and `code`, nothing else. */
export function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, i) =>
    part.startsWith("**") ? <b key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</b>
    : part.startsWith("`") ? <code key={i} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] text-slate-800">{part.slice(1, -1)}</code>
    : <span key={i}>{part}</span>);
}

/** Break a run of prose into bullet-sized pieces: on " · " first, then "; ", then sentence ends. */
function chunk(s: string): string[] {
  const parts = (re: RegExp) => s.split(re).map(x => x.trim()).filter(Boolean);
  for (const re of [/\s·\s/, /;\s+/]) { const p = parts(re); if (p.length > 1) return p; }
  const sentences = parts(/(?<=[.!?:])\s+(?=[A-Z*`(])/);
  return s.length > 110 && sentences.length > 1 ? sentences : [s];
}

function Chunked({ s }: { s: string }) {
  const items = chunk(s);
  return items.length > 1
    ? <ul className="list-disc space-y-1 pl-4">{items.map((x, i) => <li key={i}>{inline(x)}</li>)}</ul>
    : <>{inline(s)}</>;
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
      {blocks.map((b, i) => b.t === "p" ? <div key={i}><Chunked s={b.s} /></div>
        : b.t === "ul" ? <ul key={i} className="list-disc pl-5 space-y-1">{b.items.map((x, j) => <li key={j}><Chunked s={x} /></li>)}</ul>
        : (
          <div key={i}>
            <div className="space-y-2 sm:hidden">
              {b.rows.map((r, j) => (
                <div key={j} className="rounded-xl border border-slate-300 bg-white p-3">
                  <div className="font-semibold text-slate-900">{inline(r[0])}</div>
                  {r.slice(1).map((c, k) => c.trim() && (
                    <div key={k} className="mt-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{b.head[k + 1]}</div>
                      <Chunked s={c} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto rounded-xl border border-slate-300 bg-white sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>{b.head.map((h, j) => <th key={j} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {b.rows.map((r, j) => (
                    <tr key={j} className="border-t border-slate-200 align-top">
                      {r.map((c, k) => <td key={k} className={`px-3 py-2 ${k === 0 ? "font-medium text-slate-900" : ""}`}>{k === 0 ? inline(c) : <Chunked s={c} />}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </div>
  );
}

/** Everything a tool can have beyond the standard: [label, hint, has(tool)]. */
const EXTRAS: { label: string; hint: string; has: (t: ToolFacts) => boolean }[] = [
  ...FEATURES.filter(f => f.key !== "tests" && f.key !== "spec").map(f => ({
    label: f.label, hint: f.hint, has: (t: ToolFacts) => !!t[f.key],
  })),
  { label: "Own reformatter", hint: "Rebuilds its own display when an option changes (every tool also redraws options marked display-only from the saved seed)", has: t => t.reformat },
  { label: "Own print layout", hint: "Prints through a custom handler (diagrams)", has: t => t.customPrint },
  { label: "Skill links", hint: "Working steps link into the skill library", has: t => t.skillLinks },
  { label: "Not on ToolShell", hint: "Built on its own shell or standalone", has: t => t.shell !== "ToolShell" },
];

function ToolLinks({ tools, onOpen }: { tools: ToolFacts[]; onOpen: (id: string) => void }) {
  return (
    <p className="text-sm leading-relaxed">
      {tools.map((t, i) => (
        <span key={t.id}>
          {i > 0 && <span className="text-slate-300"> · </span>}
          <button onClick={() => onOpen(t.id)} title={availabilityOf(t) === "live" ? "Live" : "Not live"}
            className={`hover:underline ${availabilityOf(t) === "live" ? "text-slate-700 hover:text-blue-900" : "text-slate-400 hover:text-blue-900"}`}>{t.name}</button>
        </span>
      ))}
    </p>
  );
}

/** The feature tracker: which tools have each feature beyond the standard. */
export function FeatureTracker({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const tools = useMemo(() => TOOLS.filter(t => t.kind === "tool"), []);
  const reps = useMemo(() => [...new Set(tools.flatMap(t => t.representations))].sort(), [tools]);
  const features = useMemo(() => [
    ...EXTRAS.map(e => ({ label: e.label, hint: e.hint, tools: tools.filter(e.has) })),
    ...reps.map(r => ({ label: `Picture: ${r}`, hint: "Representation used", tools: tools.filter(t => t.representations.includes(r)) })),
  ].map(r => ({ ...r, tools: r.tools.filter(t => !needle || (r.label + " " + t.name + " " + t.category).toLowerCase().includes(needle)) }))
   .filter(r => r.tools.length > 0), [tools, reps, needle]);
  return (
    <div>
      <div className="relative mb-4 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search features and tools"
          className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm" aria-label="Search" />
      </div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">By feature</h2>
      {features.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Nothing matches.</p> : (
        <div className="grid gap-3 md:grid-cols-2">
          {features.map(f => (
            <section key={f.label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{f.label}</h3>
                <span className="text-xs text-slate-400">{f.tools.length}</span>
              </div>
              <p className="mb-2 text-xs text-slate-500">{f.hint}</p>
              <ToolLinks tools={f.tools} onOpen={onOpen} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/** "**For:** … **How it works:** …" → one labelled row each. */
function Labelled({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-700">
      {blocks.map((b, i) => b.t === "p"
        ? b.s.split(/(?=\*\*[A-Z][^*]*:\*\*)/).filter(Boolean).map((part, j) => <p key={`${i}-${j}`}>{inline(part)}</p>)
        : <Blocks key={i} blocks={[b]} />)}
    </div>
  );
}

/** What every feature of the site is, by group: a short list, with the full description in a side panel. */
export function FeaturesPage() {
  const [q, setQ] = useState("");
  const [shown, setShown] = useState<Section | null>(null);
  const needle = q.trim().toLowerCase();
  const groups = useMemo(() => {
    const out: { group: Section; items: Section[] }[] = [];
    for (const s of FEATURE_DOCS) {
      if (s.level === 2) out.push({ group: s, items: [] });
      else if (s.level === 3 && out.length) out[out.length - 1].items.push(s);
    }
    return out.map(g => ({ ...g, items: g.items.filter(s => !needle || JSON.stringify(s).toLowerCase().includes(needle)) })).filter(g => g.items.length);
  }, [needle]);
  const preview = (s: Section) => {
    const p = s.blocks[0]?.t === "p" ? (s.blocks[0] as { s: string }).s.split(/(?=\*\*[A-Z][^*]*:\*\*)/)[0] : "";
    return p.replace(/^\*\*For:\*\*\s*/, "");
  };
  return (
    <div>
      <PageHead title="Features" sub="What the site offers, in plain language." />
      <div>
        <div className="min-w-0">
          <div className="relative mb-4 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search features (e.g. reformat, information, print)"
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm" aria-label="Search the features" />
          </div>
          {groups.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No feature matches.</p>}
          {groups.map(g => (
            <section key={g.group.title} className="mb-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.group.title}</h2>
              <div className="grid gap-2 md:grid-cols-2">
                {g.items.map(s => (
                  <button key={s.title} onClick={() => setShown(s)} className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3.5 text-left hover:border-slate-300">
                    <span className="font-semibold text-slate-900">{s.title}</span>
                    <span className="line-clamp-3 text-sm text-slate-500">{inline(preview(s))}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      {shown && <Drawer title={shown.title} onClose={() => setShown(null)}><Labelled blocks={shown.blocks} /></Drawer>}
    </div>
  );
}

/** How a tool is put together: a contents list beside a reading column. */
export function BuildGuidePage() {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const sections = GUIDE.filter(s => !needle || JSON.stringify(s).toLowerCase().includes(needle));
  return (
    <div>
      <div className="mx-auto max-w-3xl">
        <PageHead title="How a tool is built" sub="How a tool is put together, in plain language." />
        <div className="min-w-0">
          <div className="relative mb-5 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search the guide (e.g. math.ts, registry, tests)"
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm" aria-label="Search the guide" />
          </div>
          {sections.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Nothing matches.</p>}
          {sections.map(s => (
            <section key={s.title} className="mb-8">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">{s.title}</h2>
              <Blocks blocks={s.blocks} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
