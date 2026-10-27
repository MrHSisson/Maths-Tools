import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import docs from "../generated/adminDocs.json";
import { TOOLS, FEATURES, availabilityOf, AVAILABILITY_LABEL, type ToolFacts } from "./facts";
import type { Note, NoteStore } from "./notes";

type Block =
  | { t: "p"; s: string }
  | { t: "ul"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] };
interface Section { title: string; level: number; blocks: Block[] }
const GUIDE = docs.guide as Section[];
const PLAN = docs.plan as Section[];
const FEATURE_DOCS = docs.features as Section[];

/** **bold** and `code`, nothing else. */
function inline(s: string): ReactNode[] {
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

function Blocks({ blocks }: { blocks: Block[] }) {
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

function Accordion({ sections, open, setOpen, flat }: { sections: Section[]; open: Record<string, boolean>; setOpen: (o: Record<string, boolean>) => void; flat?: boolean }) {
  return (
    <div className="space-y-2">
      {sections.map(s => {
        const isOpen = open[s.title] ?? !!flat;
        return (
          <section key={s.title} className="rounded-2xl border border-slate-300 bg-white shadow-card">
            <button onClick={() => setOpen({ ...open, [s.title]: !isOpen })} aria-expanded={isOpen}
              className="flex w-full items-center gap-2 px-4 py-3 text-left">
              {isOpen ? <ChevronDown size={16} className="shrink-0 text-slate-400" /> : <ChevronRight size={16} className="shrink-0 text-slate-400" />}
              <span className={`font-semibold ${s.level === 4 ? "text-blue-900" : "text-slate-900"}`}>{s.title}</span>
            </button>
            {isOpen && <div className="border-t border-slate-200 px-4 py-3"><Blocks blocks={s.blocks} /></div>}
          </section>
        );
      })}
    </div>
  );
}

type Sub = "plan" | "settled" | "differs" | "work";
const SUBS: { key: Sub; label: string; hint: string }[] = [
  { key: "plan", label: "To look at", hint: "Everything still loose or undecided, in one list" },
  { key: "settled", label: "Settled decisions", hint: "What has been decided, and what we chose" },
  { key: "differs", label: "Differs from the standard", hint: "Which tools do something beyond the standard, and our notes on each" },
  { key: "work", label: "In development & to change", hint: "What is being built, what we want to change, and open questions" },
];

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

type TableBlock = Extract<Block, { t: "table" }>;
interface Item { num: string; title: string; mark?: string; fields: { label: string; text: string }[] }

/** Every plan item is a numbered section whose bullets read "**Label:** text". */
function buildItems(): Item[] {
  return PLAN.filter(s => /^\d+\. /.test(s.title)).map(s => {
    const fields = s.blocks.flatMap(b => b.t === "ul" ? b.items : [])
      .map(x => x.match(/^\*\*([^*:]+):\*\*\s*(.*)$/)).filter((m): m is RegExpMatchArray => !!m)
      .map(m => ({ label: m[1], text: m[2] }));
    const [num, ...rest] = s.title.split(". ");
    return { num, title: rest.join(". "), mark: fields.find(f => f.label === "Mark")?.text, fields: fields.filter(f => f.label !== "Mark") };
  });
}

const MARK_STYLE: Record<string, string> = {
  Finish: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Fold: "bg-sky-50 text-sky-800 border-sky-200",
  Remove: "bg-slate-100 text-slate-600 border-slate-300",
  Decide: "bg-amber-50 text-amber-800 border-amber-200",
};

function ItemCard({ it, open, toggle }: { it: Item; open: boolean; toggle: () => void }) {
  return (
    <section className="rounded-2xl border border-slate-300 bg-white shadow-card">
      <button onClick={toggle} aria-expanded={open} className="flex w-full items-start gap-3 px-4 py-3 text-left">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{it.num}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-slate-900">{inline(it.title)}</span>
        </span>
        {it.mark && <span className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${MARK_STYLE[it.mark] ?? MARK_STYLE.Decide}`}>{it.mark}</span>}
        {open ? <ChevronDown size={16} className="mt-1 shrink-0 text-slate-400" /> : <ChevronRight size={16} className="mt-1 shrink-0 text-slate-400" />}
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-200 px-4 py-3 text-sm leading-relaxed text-slate-700">
          {it.fields.map(f => (
            <div key={f.label}>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{f.label}</div>
              <Chunked s={f.text} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SettledCard({ title, chose, when }: { title: string; chose: string; when: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border border-slate-300 bg-white shadow-card">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-start gap-2 px-4 py-3 text-left">
        {open ? <ChevronDown size={16} className="mt-1 shrink-0 text-slate-400" /> : <ChevronRight size={16} className="mt-1 shrink-0 text-slate-400" />}
        <span className="min-w-0 flex-1 font-semibold text-slate-900">{inline(title)}</span>
        <span className="mt-0.5 shrink-0 text-xs text-slate-400">{when}</span>
      </button>
      {open && <div className="border-t border-slate-200 px-4 py-3 text-sm leading-relaxed text-slate-700"><Chunked s={chose} /></div>}
    </section>
  );
}

function FeatureIndex({ q, onOpen }: { q: string; onOpen: (id: string) => void }) {
  const tools = TOOLS.filter(t => t.kind === "tool");
  const reps = [...new Set(tools.flatMap(t => t.representations))].sort();
  const rows = [
    ...EXTRAS.map(e => ({ label: e.label, hint: e.hint, tools: tools.filter(e.has) })),
    ...reps.map(r => ({ label: `Picture: ${r}`, hint: "Representation used", tools: tools.filter(t => t.representations.includes(r)) })),
  ].map(r => ({ ...r, tools: r.tools.filter(t => !q.trim() || (r.label + " " + t.name + " " + t.category).toLowerCase().includes(q.trim().toLowerCase())) }))
   .filter(r => r.tools.length > 0);
  if (rows.length === 0) return <p className="py-4 text-center text-sm text-slate-500">Nothing matches.</p>;
  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.label} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-card">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-slate-900">{r.label}</span>
            <span className="text-xs text-slate-400">{r.tools.length} tool{r.tools.length === 1 ? "" : "s"}</span>
          </div>
          <p className="text-xs text-slate-500">{r.hint}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {r.tools.map(t => (
              <button key={t.id} onClick={() => onOpen(t.id)} title={`${t.category} · ${AVAILABILITY_LABEL[availabilityOf(t)]}`}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold hover:border-blue-900 hover:text-blue-900 ${availabilityOf(t) === "live" ? "border-slate-300 bg-white text-slate-700" : "border-dashed border-slate-300 bg-slate-50 text-slate-500"}`}>{t.name}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DevelopmentsPage({ store, onOpen }: { store: NoteStore; onOpen: (id: string) => void }) {
  const [sub, setSub] = useState<Sub>("plan");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const items = useMemo(buildItems, []);
  const settled = PLAN.find(s => s.title === "Settled decisions");
  const needle = q.trim().toLowerCase();
  const shownItems = items.filter(it => !needle || JSON.stringify(it).toLowerCase().includes(needle));

  const byTool = useMemo(() => {
    const out: { t: ToolFacts; n: Note }[] = [];
    for (const t of TOOLS) { const n = store.tools[t.id]; if (n) out.push({ t, n }); }
    return out;
  }, [store]);
  const match = (t: ToolFacts, n: Note) => !q.trim() || [t.name, t.category, n.differsFrom, n.inDevelopment, n.wantsToChange, n.openQuestions].join(" ").toLowerCase().includes(q.trim().toLowerCase());

  const differs = byTool.filter(({ t, n }) => n.differsFrom?.trim() && match(t, n));
  const work = byTool.filter(({ t, n }) => (n.inDevelopment?.trim() || n.wantsToChange?.trim() || n.openQuestions?.trim()) && match(t, n));

  const grouped = (rows: { t: ToolFacts; n: Note }[]) => {
    const m = new Map<string, { t: ToolFacts; n: Note }[]>();
    rows.forEach(r => m.set(r.t.category, [...(m.get(r.t.category) ?? []), r]));
    return [...m.entries()];
  };
  const toolLink = (t: ToolFacts) => (
    <button onClick={() => onOpen(t.id)} className="font-semibold text-blue-900 hover:underline text-left">{t.name}</button>
  );
  const field = (label: string, v?: string) => v?.trim() ? (
    <div className="mt-1.5"><div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div><p className="whitespace-pre-wrap text-sm text-slate-700">{v}</p></div>
  ) : null;

  return (
    <div>
      <select value={sub} onChange={e => setSub(e.target.value as Sub)} aria-label="Developments view"
        className="mb-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 sm:w-auto">
        {SUBS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>

      {sub === "plan" || sub === "settled" ? (
        <div>
          <p className="mb-3 text-sm text-slate-500">{SUBS.find(o => o.key === sub)?.hint}</p>
          {sub === "plan" ? (
            <>
              <div className="relative mb-3 max-w-md">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm" aria-label="Search" />
              </div>
              {shownItems.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Nothing matches.</p> : (
                <div className="space-y-2">
                  {shownItems.map(it => <ItemCard key={it.num} it={it} open={open[it.num] ?? !!needle} toggle={() => setOpen({ ...open, [it.num]: !(open[it.num] ?? !!needle) })} />)}
                </div>
              )}
            </>
          ) : settled ? (
            <div className="space-y-2">
              {((settled.blocks.find(b => b.t === "table") as TableBlock | undefined)?.rows ?? [])
                .map((r, i) => ({ r, i })).sort((x, y) => y.r[2].localeCompare(x.r[2]) || x.i - y.i)
                .map(({ r }) => <SettledCard key={r[0]} title={r[0]} chose={r[1]} when={r[2]} />)}
            </div>
          ) : <p className="py-8 text-center text-sm text-slate-500">Nothing settled yet.</p>}
        </div>
      ) : (
        <>
          <div className="relative mb-3 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tools and notes"
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm" aria-label="Search" />
          </div>
          {sub === "differs" && (
            <div className="mb-6">
              <h2 className="mb-2 text-base font-semibold text-slate-900">By feature</h2>
              <FeatureIndex q={q} onOpen={onOpen} />
              <h2 className="mb-2 mt-6 text-base font-semibold text-slate-900">Written notes by tool</h2>
            </div>
          )}
          {(sub === "differs" ? differs : work).length === 0
            ? <p className="py-8 text-center text-sm text-slate-500">Nothing here yet.</p>
            : grouped(sub === "differs" ? differs : work).map(([strand, rows]) => (
              <div key={strand} className="mb-4">
                <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{strand} <span className="font-normal text-slate-400">{rows.length}</span></h2>
                <div className="space-y-2">
                  {rows.map(({ t, n }) => (
                    <div key={t.id} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-card">
                      {toolLink(t)}
                      {sub === "differs" ? field("Differs from / adds to the standard", n.differsFrom) : <>
                        {field("In development", n.inDevelopment)}{field("What we want to change", n.wantsToChange)}{field("Open questions", n.openQuestions)}
                      </>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}

export function BuildGuidePage() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");
  const shown = GUIDE.filter(s => !q.trim() || JSON.stringify(s).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">How a tool is put together, in plain language.</p>
      <div className="relative mb-3 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search the guide (e.g. math.ts, registry, tests)"
          className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm" aria-label="Search the guide" />
      </div>
      <Accordion sections={shown} open={open} setOpen={setOpen} flat />
    </div>
  );
}

export function FuturePage() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const sections = (docs as { future: Section[] }).future;
  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">Ideas kept so they are not lost. Not scheduled, and not part of the plan.</p>
      <Accordion sections={sections} open={open} setOpen={setOpen} flat />
    </div>
  );
}

/** "**For:** … **How it works:** …" → one labelled row each. */
function Labelled({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-1.5 text-sm text-slate-700 leading-relaxed">
      {blocks.map((b, i) => b.t === "p"
        ? b.s.split(/(?=\*\*[A-Z][^*]*:\*\*)/).filter(Boolean).map((part, j) => <p key={`${i}-${j}`}>{inline(part)}</p>)
        : <Blocks key={i} blocks={[b]} />)}
    </div>
  );
}

export function FeaturesPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const intro = FEATURE_DOCS.find(s => s.level === 1);
  const needle = q.trim().toLowerCase();
  const groups: { group: Section; items: Section[] }[] = [];
  for (const s of FEATURE_DOCS) {
    if (s.level === 2) groups.push({ group: s, items: [] });
    else if (s.level === 3 && groups.length) groups[groups.length - 1].items.push(s);
  }
  const shown = groups.map(g => ({ ...g, items: g.items.filter(s => !needle || JSON.stringify(s).toLowerCase().includes(needle)) })).filter(g => g.items.length);
  return (
    <div>
      {intro && <p className="mb-3 text-sm text-slate-500">{inline(intro.blocks.map(b => (b.t === "p" ? b.s : "")).join(" "))}</p>}
      <div className="relative mb-3 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search features (e.g. reformat, information, print)"
          className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm" aria-label="Search the features" />
      </div>
      {shown.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No feature matches.</p>}
      {shown.map(({ group, items }) => (
        <div key={group.title} className="mb-5">
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.title} <span className="font-normal text-slate-400">{items.length}</span></h2>
          <div className="space-y-2">
            {items.map(s => {
              const isOpen = open[s.title] ?? !!needle;
              const first = s.blocks[0]?.t === "p" ? (s.blocks[0] as { s: string }).s.split(/(?=\*\*[A-Z][^*]*:\*\*)/)[0] : "";
              return (
                <section key={s.title} className="rounded-2xl border border-slate-300 bg-white shadow-card">
                  <button onClick={() => setOpen({ ...open, [s.title]: !isOpen })} aria-expanded={isOpen}
                    className="flex w-full items-start gap-2 px-4 py-3 text-left">
                    {isOpen ? <ChevronDown size={16} className="mt-1 shrink-0 text-slate-400" /> : <ChevronRight size={16} className="mt-1 shrink-0 text-slate-400" />}
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-900">{s.title}</span>
                      {!isOpen && <span className="block text-sm text-slate-500 line-clamp-2">{inline(first.replace(/^\*\*For:\*\*\s*/, ""))}</span>}
                    </span>
                  </button>
                  {isOpen && <div className="border-t border-slate-200 px-4 py-3"><Labelled blocks={s.blocks} /></div>}
                </section>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
