import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import docs from "../generated/adminDocs.json";
import { TOOLS, type ToolFacts } from "./facts";
import { Blocks, inline, type Section } from "./DevelopmentsPage";

type Block = Section["blocks"][number];
interface Task { status: string; title: string; blocks: Block[] }
interface Pathway { id: string; title: string; status: string; measure: string; updated: string; sections: Section[] }
const TASKS = (docs as { tasks: Task[] }).tasks;
const PATHWAYS = (docs as { pathways: Pathway[] }).pathways;

const text = (blocks: Block[]) => blocks.map(b => b.t === "p" ? b.s : b.t === "ul" ? b.items.join(" ") : "").join(" ");
const matches = (v: unknown, q: string) => !q.trim() || JSON.stringify(v).toLowerCase().includes(q.trim().toLowerCase());

function SearchBox({ q, setQ, label }: { q: string; setQ: (s: string) => void; label: string }) {
  return (
    <div className="relative mb-3 max-w-md">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={label}
        className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm" aria-label={label} />
    </div>
  );
}

const Chevron = ({ open }: { open: boolean }) => open
  ? <ChevronDown size={16} className="mt-1 shrink-0 text-slate-400" />
  : <ChevronRight size={16} className="mt-1 shrink-0 text-slate-400" />;

/* ---------- Tasks ---------- */

const TASK_ORDER = ["In progress", "Open", "Recurring", "Done (recent)"];

export function TasksPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const groups = TASK_ORDER.map(status => ({ status, tasks: TASKS.filter(t => t.status === status && matches(t, q)) })).filter(g => g.tasks.length);
  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">Smaller things to do: checks, consistency fixes and one-off jobs. Larger developments are on Pathways. Edit <code className="rounded bg-slate-100 px-1 text-[0.85em]">docs/TASKS.md</code>.</p>
      <SearchBox q={q} setQ={setQ} label="Search tasks" />
      {groups.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No task matches.</p>}
      {groups.map(({ status, tasks }) => (
        <div key={status} className="mb-5">
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{status} <span className="font-normal text-slate-400">{tasks.length}</span></h2>
          <div className="space-y-2">
            {tasks.map(t => {
              const isOpen = open[t.title] ?? !!q.trim();
              return (
                <section key={t.title} className="rounded-2xl border border-slate-300 bg-white shadow-card">
                  <button onClick={() => setOpen({ ...open, [t.title]: !isOpen })} aria-expanded={isOpen} className="flex w-full items-start gap-2 px-4 py-3 text-left">
                    <Chevron open={isOpen} />
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-900">{t.title}</span>
                      {!isOpen && <span className="block text-sm text-slate-500 line-clamp-2">{inline(text(t.blocks))}</span>}
                    </span>
                  </button>
                  {isOpen && <div className="border-t border-slate-200 px-4 py-3"><Blocks blocks={t.blocks} /></div>}
                </section>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Pathways ---------- */

const ROUTE = ["idea", "building", "rolling out", "done"];
/** Display groups, in order: in progress first, then ideas, done, paused. */
const GROUPS: { label: string; statuses: string[]; startOpen: boolean }[] = [
  { label: "In progress", statuses: ["building", "rolling out"], startOpen: true },
  { label: "Ideas", statuses: ["idea"], startOpen: true },
  { label: "Done", statuses: ["done"], startOpen: false },
  { label: "Paused or not doing", statuses: ["paused", "not doing"], startOpen: true },
];

/** The measure is a tool fact (e.g. "calibrated"): count live teaching tools that have it. */
function rollout(measure: string): { x: number; n: number } | null {
  const key = measure.match(/^[A-Za-z]+/)?.[0] as keyof ToolFacts | undefined;
  if (!key || typeof TOOLS[0]?.[key] !== "boolean") return null;
  const live = TOOLS.filter(t => t.kind === "tool" && t.enabled);
  return { x: live.filter(t => t[key]).length, n: live.length };
}

function RouteSteps({ status }: { status: string }) {
  const at = ROUTE.indexOf(status);
  if (at < 0) return <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 capitalize">{status}</span>;
  return (
    <span className="flex items-center gap-1 text-xs" aria-label={`Stage: ${status}`}>
      {ROUTE.map((r, i) => (
        <span key={r} className={`rounded-full border px-2 py-0.5 font-semibold ${i === at ? "border-blue-900 bg-blue-900 text-white" : i < at ? "border-slate-300 bg-slate-100 text-slate-500" : "border-slate-200 text-slate-400"}`}>{r}</span>
      ))}
    </span>
  );
}

function PathwayCard({ p, open, toggle }: { p: Pathway; open: boolean; toggle: () => void }) {
  const r = p.status === "rolling out" ? rollout(p.measure) : null;
  const intention = p.sections.find(s => s.title === "Intention");
  const first = intention ? text(intention.blocks) : "";
  return (
    <section className="rounded-2xl border border-slate-300 bg-white shadow-card">
      <button onClick={toggle} aria-expanded={open} className="flex w-full items-start gap-2 px-4 py-3 text-left">
        <Chevron open={open} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-slate-900">{p.title}</span>
            <RouteSteps status={p.status} />
          </span>
          {r && (
            <span className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
              <span className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-blue-900" style={{ width: `${(100 * r.x) / Math.max(r.n, 1)}%` }} /></span>
              <span className="font-semibold text-slate-700">{r.x}/{r.n}</span> live tools have it
            </span>
          )}
          {!open && <span className="mt-1 block text-sm text-slate-500 line-clamp-2">{inline(first)}</span>}
        </span>
        {p.updated && <span className="mt-0.5 hidden shrink-0 text-xs text-slate-400 sm:block">{p.updated}</span>}
      </button>
      {open && (
        <div className="space-y-4 border-t border-slate-200 px-4 py-3">
          {p.measure && !r && p.status === "rolling out" && <p className="text-xs text-slate-400">Measure: {p.measure}</p>}
          {p.sections.map(s => (
            <div key={s.title}>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{s.title}</div>
              <Blocks blocks={s.blocks} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function PathwaysPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const groups = useMemo(() => GROUPS.map(g => ({
    ...g,
    items: PATHWAYS.filter(p => g.statuses.includes(p.status) && matches(p, q))
      .sort((a, b) => g.statuses.indexOf(a.status) - g.statuses.indexOf(b.status)),
  })).filter(g => g.items.length), [q]);
  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">Large developments, each with an intention, progress and next steps. A pathway runs idea, building, rolling out, done. Edit the files in <code className="rounded bg-slate-100 px-1 text-[0.85em]">docs/pathways/</code>.</p>
      <SearchBox q={q} setQ={setQ} label="Search pathways" />
      {groups.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No pathway matches.</p>}
      {groups.map(g => (
        <div key={g.label} className="mb-5">
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.label} <span className="font-normal text-slate-400">{g.items.length}</span></h2>
          <div className="space-y-2">
            {g.items.map(p => {
              const isOpen = open[p.id] ?? (!!q.trim());
              return <PathwayCard key={p.id} p={p} open={isOpen} toggle={() => setOpen({ ...open, [p.id]: !isOpen })} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
