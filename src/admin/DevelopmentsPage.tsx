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

/** **bold** and `code`, nothing else. */
function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, i) =>
    part.startsWith("**") ? <b key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</b>
    : part.startsWith("`") ? <code key={i} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] text-slate-800">{part.slice(1, -1)}</code>
    : <span key={i}>{part}</span>);
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
      {blocks.map((b, i) => b.t === "p" ? <p key={i}>{inline(b.s)}</p>
        : b.t === "ul" ? <ul key={i} className="list-disc pl-5 space-y-1">{b.items.map((x, j) => <li key={j}>{inline(x)}</li>)}</ul>
        : (
          <div key={i} className="overflow-x-auto rounded-xl border border-slate-300 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>{b.head.map((h, j) => <th key={j} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody>
                {b.rows.map((r, j) => (
                  <tr key={j} className="border-t border-slate-200 align-top">
                    {r.map((c, k) => <td key={k} className={`px-3 py-2 ${k === 0 ? "font-medium text-slate-900" : ""}`}>{inline(c)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
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

type Sub = "plan" | "differs" | "work";
const SUBS: { key: Sub; label: string; hint: string }[] = [
  { key: "plan", label: "Plan & decisions", hint: "What is loose, and the decision tree — read from docs/TIDY_UP.md" },
  { key: "differs", label: "Differs from the standard", hint: "What departs from, or adds to, the standard tool — and which tools have it (read from the code), then the written notes per tool" },
  { key: "work", label: "In development & to change", hint: "What is being built, what we want to change, and open questions — from the tool notes" },
];

/** Everything a tool can have beyond the standard, read from the code: [label, hint, has(tool)]. */
const EXTRAS: { label: string; hint: string; has: (t: ToolFacts) => boolean }[] = [
  ...FEATURES.filter(f => f.key !== "tests" && f.key !== "spec").map(f => ({
    label: f.label, hint: f.hint, has: (t: ToolFacts) => !!t[f.key],
  })),
  { label: "Instant reformat", hint: "Display options switch without regenerating the question", has: t => t.reformat },
  { label: "Own print layout", hint: "Prints through a custom handler (diagrams)", has: t => t.customPrint },
  { label: "Skill links", hint: "Working steps link into the skill library", has: t => t.skillLinks },
  { label: "Not on ToolShell", hint: "Built on its own shell or standalone", has: t => t.shell !== "ToolShell" },
];

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
      <p className="text-xs text-slate-400">Dashed chips are not live yet. Teaching tools only.</p>
    </div>
  );
}

export function DevelopmentsPage({ store, onOpen }: { store: NoteStore; onOpen: (id: string) => void }) {
  const [sub, setSub] = useState<Sub>("plan");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const tree = PLAN.find(s => s.title.startsWith("J — the decision tree"));
  const rest = PLAN.filter(s => s !== tree);

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
      <div className="mb-3 flex gap-x-5 overflow-x-auto whitespace-nowrap border-b border-slate-300" role="tablist">
        {SUBS.map(s => (
          <button key={s.key} role="tab" aria-selected={sub === s.key} title={s.hint} onClick={() => setSub(s.key)}
            className={`-mb-px pb-2 pt-1 text-sm font-semibold border-b-2 ${sub === s.key ? "border-blue-900 text-blue-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{s.label}</button>
        ))}
      </div>
      <p className="mb-3 text-sm text-slate-500">{SUBS.find(s => s.key === sub)!.hint}.</p>

      {sub === "plan" ? (
        <div className="space-y-4">
          {tree && (
            <div>
              <h2 className="mb-1 text-base font-semibold text-slate-900">Decision tree</h2>
              <p className="mb-2 text-sm text-slate-500">Recorded, not started. Nothing changes in code until a branch is picked and decided.</p>
              <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-card"><Blocks blocks={tree.blocks} /></div>
            </div>
          )}
          <div>
            <h2 className="mb-2 text-base font-semibold text-slate-900">What is loose, by area</h2>
            <Accordion sections={rest} open={open} setOpen={setOpen} />
          </div>
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
      <p className="mb-3 text-sm text-slate-500">How the repo builds a tool, in plain language — read from <code className="rounded bg-slate-100 px-1">docs/HOW_A_TOOL_IS_BUILT.md</code>. The exact rules are in <code className="rounded bg-slate-100 px-1">CLAUDE.md</code>.</p>
      <div className="relative mb-3 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search the guide (e.g. math.ts, registry, tests)"
          className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm" aria-label="Search the guide" />
      </div>
      <Accordion sections={shown} open={open} setOpen={setOpen} flat />
    </div>
  );
}
