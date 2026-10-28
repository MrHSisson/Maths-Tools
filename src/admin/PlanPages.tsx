import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import docs from "../generated/adminDocs.json";
import { TOOLS, type ToolFacts } from "./facts";
import type { NoteStore } from "./notes";
import { Blocks, FeatureTracker, inline, type Section } from "./DevelopmentsPage";
import { Drawer, PageHead, Status, panel, rowBtn } from "./ui";

type Block = Section["blocks"][number];
interface Task { status: string; title: string; blocks: Block[] }
interface Pathway { id: string; title: string; status: string; measure: string; updated: string; sections: Section[] }
const TASKS = (docs as { tasks: Task[] }).tasks;
const PATHWAYS = (docs as { pathways: Pathway[] }).pathways;

const text = (blocks: Block[]) => blocks.map(b => b.t === "p" ? b.s : b.t === "ul" ? b.items.join(" ") : "").join(" ");
const firstSentence = (s: string) => s.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? s;
const matches = (v: unknown, q: string) => !q.trim() || JSON.stringify(v).toLowerCase().includes(q.trim().toLowerCase());

function SearchBox({ q, setQ, label }: { q: string; setQ: (s: string) => void; label: string }) {
  return (
    <div className="relative mb-4 max-w-md">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={label}
        className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm" aria-label={label} />
    </div>
  );
}

/* ---------- Tasks ---------- */

const TASK_ORDER = ["In progress", "Open", "Recurring", "Done (recent)"];
const TASK_DOT: Record<string, string> = { "In progress": "bg-blue-600", Open: "bg-slate-400", Recurring: "bg-sky-400", "Done (recent)": "bg-emerald-500" };

function TasksView({ onShow }: { onShow: (t: Task) => void }) {
  const [q, setQ] = useState("");
  const groups = TASK_ORDER.map(status => ({ status, tasks: TASKS.filter(t => t.status === status && matches(t, q)) })).filter(g => g.tasks.length);
  return (
    <div>
      <SearchBox q={q} setQ={setQ} label="Search tasks" />
      {groups.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No task matches.</p>}
      {groups.map(({ status, tasks }) => (
        <section key={status} className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{status} <span className="font-normal text-slate-400">{tasks.length}</span></h2>
          <div className={`${panel} divide-y divide-slate-200`}>
            {tasks.map(t => (
              <button key={t.title} onClick={() => onShow(t)} className={rowBtn}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TASK_DOT[status] ?? "bg-slate-400"}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-900">{t.title}</span>
                  <span className="line-clamp-1 text-sm text-slate-500">{inline(text(t.blocks))}</span>
                </span>
                <ChevronRight size={16} className="mt-1 shrink-0 text-slate-300" />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------- Pathways ---------- */

const STAGE: Record<string, { dot: string; label: string }> = {
  idea: { dot: "bg-slate-400", label: "Idea" },
  building: { dot: "bg-blue-600", label: "Building" },
  "rolling out": { dot: "bg-emerald-500", label: "Rolling out" },
  done: { dot: "bg-slate-300", label: "Done" },
  paused: { dot: "bg-amber-500", label: "Paused" },
};
const stageOf = (s: string) => STAGE[s] ?? STAGE.idea;

/** The measure is a tool fact (e.g. "calibrated"): count live teaching tools that have it. */
function rollout(measure: string): { x: number; n: number } | null {
  const key = measure.match(/^[A-Za-z]+/)?.[0] as keyof ToolFacts | undefined;
  if (!key || typeof TOOLS[0]?.[key] !== "boolean") return null;
  const live = TOOLS.filter(t => t.kind === "tool" && t.enabled);
  return { x: live.filter(t => t[key]).length, n: live.length };
}

function RolloutBar({ p }: { p: Pathway }) {
  const r = p.status === "rolling out" ? rollout(p.measure) : null;
  if (!r) return null;
  return (
    <span className="flex items-center gap-2 text-xs text-slate-500">
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-emerald-500" style={{ width: `${(100 * r.x) / Math.max(r.n, 1)}%` }} /></span>
      <span className="font-semibold text-slate-700">{r.x}/{r.n}</span> live tools
    </span>
  );
}

function PathwayCard({ p, onShow }: { p: Pathway; onShow: (p: Pathway) => void }) {
  const st = stageOf(p.status);
  const intention = p.sections.find(s => s.title === "Intention");
  return (
    <button onClick={() => onShow(p)} className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-3.5 text-left hover:border-slate-300">
      <span className="font-semibold text-slate-900">{p.title}</span>
      <Status colour={st.dot} label={st.label} />
      <RolloutBar p={p} />
      {intention && <span className="line-clamp-3 text-sm text-slate-500">{inline(firstSentence(text(intention.blocks)))}</span>}
    </button>
  );
}

function Column({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title} <span className="font-normal text-slate-400">{count}</span></h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Fold({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-6">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800">
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{title} <span className="font-normal text-slate-400">{count}</span>
      </button>
      {open && <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{children}</div>}
    </section>
  );
}

function PathwaysView({ onShow }: { onShow: (p: Pathway) => void }) {
  const [q, setQ] = useState("");
  const by = useMemo(() => {
    const f = (...s: string[]) => PATHWAYS.filter(p => s.includes(p.status) && matches(p, q));
    return { building: f("building"), rolling: f("rolling out"), ideas: f("idea"), done: f("done"), paused: f("paused", "not doing") };
  }, [q]);
  const card = (p: Pathway) => <PathwayCard key={p.id} p={p} onShow={onShow} />;
  const inProgress = by.building.length + by.rolling.length;
  return (
    <div>
      <SearchBox q={q} setQ={setQ} label="Search pathways" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-slate-900">In progress <span className="font-normal text-slate-400">{inProgress}</span></h2>
          {by.building.length > 0 && <Column title="Building" count={by.building.length}><div className="grid gap-2 md:grid-cols-2">{by.building.map(card)}</div></Column>}
          {by.rolling.length > 0 && <Column title="Rolling out" count={by.rolling.length}><div className="grid gap-2 md:grid-cols-2">{by.rolling.map(card)}</div></Column>}
          {inProgress === 0 && <p className="text-sm text-slate-500">Nothing in progress.</p>}
        </div>
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-slate-900">Ideas <span className="font-normal text-slate-400">{by.ideas.length}</span></h2>
          <div className="flex flex-col gap-2">{by.ideas.map(card)}</div>
          {by.ideas.length === 0 && <p className="text-sm text-slate-500">No ideas.</p>}
        </div>
      </div>
      {by.done.length > 0 && <Fold title="Done" count={by.done.length}>{by.done.map(card)}</Fold>}
      {by.paused.length > 0 && <Fold title="Paused or not doing" count={by.paused.length}>{by.paused.map(card)}</Fold>}
    </div>
  );
}

/* ---------- The Developments tab: one place, a drop-down between the three views ---------- */

type View = "tasks" | "pathways" | "features";
const VIEWS: { key: View; label: string; sub: string }[] = [
  { key: "tasks", label: "Tasks", sub: "Smaller to-dos: checks, consistency fixes, one-off jobs." },
  { key: "pathways", label: "Pathways", sub: "Larger developments: intention, progress and next steps." },
  { key: "features", label: "Feature tracker", sub: "Which tools have each feature, and how each differs from the standard." },
];

export function DevelopmentsTab({ store, onOpen }: { store: NoteStore; phone: boolean; onOpen: (id: string) => void }) {
  const [view, setView] = useState<View>("tasks");
  const [task, setTask] = useState<Task | null>(null);
  const [pathway, setPathway] = useState<Pathway | null>(null);
  const v = VIEWS.find(x => x.key === view)!;
  return (
    <div>
      <PageHead title="Developments" sub={v.sub} right={
        <select value={view} onChange={e => setView(e.target.value as View)} aria-label="Developments view"
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
          {VIEWS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      } />
      {view === "tasks" && <TasksView onShow={setTask} />}
      {view === "pathways" && <PathwaysView onShow={setPathway} />}
      {view === "features" && <FeatureTracker store={store} onOpen={onOpen} />}

      {task && <Drawer title={task.title} sub={<Status colour={TASK_DOT[task.status] ?? "bg-slate-400"} label={task.status} />} onClose={() => setTask(null)}><Blocks blocks={task.blocks} /></Drawer>}
      {pathway && (
        <Drawer title={pathway.title} onClose={() => setPathway(null)}
          sub={<><Status colour={stageOf(pathway.status).dot} label={stageOf(pathway.status).label} /><RolloutBar p={pathway} />{pathway.updated && <span>Updated {pathway.updated}</span>}</>}>
          <div className="space-y-5">
            {pathway.sections.map(s => (
              <div key={s.title}>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{s.title}</div>
                <Blocks blocks={s.blocks} />
              </div>
            ))}
          </div>
        </Drawer>
      )}
    </div>
  );
}
