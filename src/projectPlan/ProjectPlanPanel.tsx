import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowRight, ArrowUp, ChevronDown, ChevronRight, GitFork, Home, ListTodo, Maximize2, Minimize2, Pin, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { routesById, contextualTools } from "./catalogue";
import { descendants, makeNode, type PlanNode, type ProjectPlan } from "../../api/_projectPlan";
import { useProjectPlan } from "./useProjectPlan";

const control = "rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-40";
const input = "min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const iconButton = "inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30";
type Save = (plan: ProjectPlan) => Promise<boolean>;

function progress(nodes: PlanNode[], id: string) {
  const ids = descendants(nodes, id);
  const tasks = nodes.filter(node => node.kind === "task" && ids.has(node.id));
  return { total: tasks.length, done: tasks.filter(node => node.done).length };
}

function PlanProgress({ nodes, id }: { nodes: PlanNode[]; id: string }) {
  const { total, done } = progress(nodes, id);
  if (!total) return null;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs text-slate-600">
      <progress className="h-1.5 w-12 accent-teal-600" value={done} max={total} aria-label="Checklist progress" />
      {done}/{total} done
    </span>
  );
}

function AddItem({ parent, plan, save, branch = false }: { parent: string | null; plan: ProjectPlan; save: Save; branch?: boolean }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<PlanNode["kind"]>(branch ? "branch" : "task");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const node = makeNode(crypto.randomUUID(), parent, title.trim(), kind);
    if (await save({ ...plan, nodes: [...plan.nodes, node] })) setTitle("");
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input className={`${input} flex-1 basis-36`} aria-label={branch ? "New project branch" : "New checklist item"} placeholder={branch ? "New project branch" : "New checklist item"} maxLength={120} value={title} onChange={event => setTitle(event.target.value)} required />
      {!branch && <select className={input} aria-label="Item type" value={kind} onChange={event => setKind(event.target.value as PlanNode["kind"])}>
        <option value="task">Task</option><option value="branch">Heading</option>
      </select>}
      <button className={control} disabled={!title.trim()}>Add</button>
    </form>
  );
}

function MapNode({ node, nodes, select }: { node: PlanNode; nodes: PlanNode[]; select: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const children = nodes.filter(child => child.parent === node.id && (child.kind === "branch" || nodes.some(item => item.parent === child.id)));
  return (
    <li className="relative min-w-0 before:absolute before:-left-3 before:top-5 before:w-3 before:border-t before:border-slate-300">
      <div className="flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white pr-2">
        {children.length > 0 ? (
          <button className={iconButton} aria-label={`${expanded ? "Collapse" : "Expand"} ${node.title}`} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : <span className="ml-4 mr-2 size-1.5 shrink-0 rounded-full bg-slate-300" />}
        <button className="min-w-0 flex-1 py-2 text-left text-sm font-medium hover:underline" onClick={() => select(node.id)}>{node.title}</button>
        <PlanProgress nodes={nodes} id={node.id} />
      </div>
      {expanded && <ul className="ml-4 mt-1 space-y-1 border-l border-slate-300 pl-3">
        {children.map(child => <MapNode key={child.id} node={child} nodes={nodes} select={select} />)}
      </ul>}
    </li>
  );
}

function ProjectMap({ plan, select, save }: { plan: ProjectPlan; select: (id: string) => void; save: Save }) {
  const pinned = plan.nodes.filter(node => node.pinned);
  const dependencies = plan.nodes.flatMap(node => node.needs.map(id => ({ node, prerequisite: plan.nodes.find(candidate => candidate.id === id)! })));
  return (
    <div className="space-y-6">
      {pinned.length > 0 && <section>
        <h3 className="mb-2 text-sm font-semibold">Spearheads</h3>
        <ul className="space-y-2">{pinned.map(node => (
          <li key={node.id}><button onClick={() => select(node.id)} className="w-full rounded-xl border border-teal-200 bg-teal-50 p-3 text-left hover:border-teal-400">
            <span className="flex items-center gap-2 text-sm font-semibold"><Pin size={14} />{node.title}</span>
            {node.overview && <span className="mt-1 block text-sm text-slate-700">{node.overview}</span>}
            <PlanProgress nodes={plan.nodes} id={node.id} />
          </button></li>
        ))}</ul>
      </section>}
      <section>
        <h3 className="mb-2 text-sm font-semibold">Project tree</h3>
        <div className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900">
          <GitFork size={16} aria-hidden /> Maths Tools
        </div>
        <ul className="ml-4 space-y-1 border-l border-slate-300 pb-1 pl-3 pt-2">
          {plan.nodes.filter(node => node.parent === null).map(node => <MapNode key={node.id} node={node} nodes={plan.nodes} select={select} />)}
        </ul>
        <div className="mt-3"><AddItem parent={null} plan={plan} save={save} branch /></div>
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Dependencies</h3>
        {dependencies.length === 0 && <p className="text-sm text-slate-600">Link a prerequisite from a branch or task to see it here.</p>}
        <ul className="space-y-2">{dependencies.map(({ node, prerequisite }) => <li className="flex items-center gap-2 text-sm" key={`${node.id}:${prerequisite.id}`}>
          <button className={control} onClick={() => select(prerequisite.id)}>{prerequisite.title}</button>
          <ArrowRight size={16} className="shrink-0" aria-label="before" />
          <button className={control} onClick={() => select(node.id)}>{node.title}</button>
        </li>)}</ul>
      </section>
    </div>
  );
}

function updateNode(plan: ProjectPlan, id: string, patch: Partial<PlanNode>): ProjectPlan {
  return { ...plan, nodes: plan.nodes.map(node => node.id === id ? { ...node, ...patch } : node) };
}

function Checklist({ parent, plan, save, select }: { parent: string; plan: ProjectPlan; save: Save; select: (id: string) => void }) {
  const children = plan.nodes.filter(node => node.parent === parent);
  const complete = children.filter(node => node.kind === "task" && node.done);
  const open = children.filter(node => !complete.includes(node));
  function row(node: PlanNode) {
    const hasChildren = plan.nodes.some(child => child.parent === node.id);
    return (
      <li key={node.id} className="rounded-lg border border-slate-200 bg-white">
        <div className="flex min-h-10 items-center gap-2 px-2">
          {node.kind === "task" && <label className="grid size-10 shrink-0 cursor-pointer place-items-center">
            <input type="checkbox" className="size-4 accent-teal-700" checked={node.done} aria-label={node.title} onChange={event => void save(updateNode(plan, node.id, { done: event.target.checked }))} />
          </label>}
          <button onClick={() => select(node.id)} className="flex min-h-10 min-w-0 flex-1 items-center justify-between gap-2 text-left text-sm hover:underline">
            <span className="break-words">{node.title}</span><ChevronRight size={16} className="shrink-0" />
          </button>
        </div>
        {hasChildren && <details className="mb-2 ml-4 mr-2 border-l border-slate-200 pl-2">
          <summary className="cursor-pointer py-1 text-xs text-slate-600">Sublist</summary>
          <Checklist parent={node.id} plan={plan} save={save} select={select} />
        </details>}
      </li>
    );
  }
  return <>
    <ul className="space-y-2">{open.map(row)}</ul>
    {complete.length > 0 && <details className="mt-3">
      <summary className="cursor-pointer py-1 text-sm text-slate-600">Completed ({complete.length})</summary>
      <ul className="mt-2 space-y-2">{complete.map(row)}</ul>
    </details>}
  </>;
}

function NodeActions({ node, plan, save }: { node: PlanNode; plan: ProjectPlan; save: Save }) {
  const [parent, setParent] = useState(node.parent ?? "");
  const [prerequisite, setPrerequisite] = useState("");
  const blocked = descendants(plan.nodes, node.id);
  const siblings = plan.nodes.filter(candidate => candidate.parent === node.parent);
  const index = siblings.findIndex(sibling => sibling.id === node.id);

  function moveBy(offset: number) {
    const other = siblings[index + offset];
    if (!other) return;
    const nodes = [...plan.nodes];
    const from = nodes.indexOf(node);
    const to = nodes.indexOf(other);
    [nodes[from], nodes[to]] = [nodes[to], nodes[from]];
    void save({ ...plan, nodes });
  }

  return <details className="rounded-xl border border-slate-300 px-3 py-2">
    <summary className="cursor-pointer text-sm font-medium">Edit, move or link</summary>
    <div className="mt-3 space-y-3">
      <form key={JSON.stringify([node.title, node.overview])} className="grid gap-2" onSubmit={event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const title = String(data.get("title")).trim();
        if (title) void save(updateNode(plan, node.id, { title, overview: String(data.get("overview")).trim() }));
      }}>
        <label className="grid gap-1 text-sm">Name<input className={input} name="title" defaultValue={node.title} required maxLength={120} /></label>
        <label className="grid gap-1 text-sm">Overview or goal<textarea className={input} name="overview" defaultValue={node.overview} rows={2} maxLength={500} /></label>
        <button className={`${control} justify-self-start`}>Save overview</button>
      </form>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
        <button className={iconButton} aria-label="Move earlier" disabled={index <= 0} onClick={() => moveBy(-1)}><ArrowUp size={17} /></button>
        <button className={iconButton} aria-label="Move later" disabled={index === siblings.length - 1} onClick={() => moveBy(1)}><ArrowDown size={17} /></button>
        <select className={`${input} max-w-full flex-1`} aria-label="Move under" value={parent} onChange={event => setParent(event.target.value)}>
          <option value="">Project map</option>
          {plan.nodes.filter(candidate => !blocked.has(candidate.id)).map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}
        </select>
        <button className={control} disabled={(node.parent ?? "") === parent} onClick={() => void save(updateNode(plan, node.id, { parent: parent || null }))}>Move</button>
      </div>
      <div className="border-t border-slate-200 pt-3">
        <p className="mb-2 text-sm font-medium">Depends on</p>
        <ul className="space-y-1">
          {node.needs.map(id => <li key={id} className="flex items-center gap-2 text-sm">
            {plan.nodes.find(candidate => candidate.id === id)?.title}
            <button className={iconButton} aria-label={`Remove dependency on ${plan.nodes.find(candidate => candidate.id === id)?.title}`} onClick={() => void save(updateNode(plan, node.id, { needs: node.needs.filter(value => value !== id) }))}><X size={14} /></button>
          </li>)}
        </ul>
        <div className="flex gap-2">
          <select className={`${input} flex-1`} aria-label="Prerequisite" value={prerequisite} onChange={event => setPrerequisite(event.target.value)}>
            <option value="">Choose an item</option>
            {plan.nodes.filter(candidate => candidate.id !== node.id && !node.needs.includes(candidate.id)).map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}
          </select>
          <button className={control} disabled={!prerequisite} onClick={async () => {
            if (await save(updateNode(plan, node.id, { needs: [...node.needs, prerequisite] }))) setPrerequisite("");
          }}>Link</button>
        </div>
      </div>
    </div>
  </details>;
}

function ReviewForm({ node, plan, save }: { node: PlanNode; plan: ProjectPlan; save: Save }) {
  const existing = plan.reviews.find(review => review.item === node.id);
  return <details className="rounded-xl border border-slate-300 px-3 py-2">
    <summary className="cursor-pointer text-sm font-medium">{existing ? "Review requested" : "Request Harry’s review"}</summary>
    <form key={existing?.prompt ?? ""} className="mt-3 grid gap-2" onSubmit={event => {
      event.preventDefault();
      const prompt = String(new FormData(event.currentTarget).get("prompt")).trim();
      if (!prompt) return;
      const reviews = plan.reviews.filter(review => review.item !== node.id);
      void save({ ...plan, reviews: [...reviews, { item: node.id, prompt }] });
    }}>
      <label className="grid gap-1 text-sm">What should Harry try?
        <textarea className={input} name="prompt" rows={2} maxLength={240} required defaultValue={existing?.prompt} />
      </label>
      <button className={`${control} justify-self-start`}>{existing ? "Update request" : "Request review"}</button>
    </form>
  </details>;
}

function Reviews({ plan, save, select }: { plan: ProjectPlan; save: Save; select: (id: string) => void }) {
  const byId = new Map(plan.nodes.map(node => [node.id, node]));
  return <section className="space-y-3">
    <h3 className="text-sm font-semibold">Harry’s review queue</h3>
    {plan.reviews.length === 0 && <p className="text-sm text-slate-600">No review requests.</p>}
    <ul className="space-y-3">{plan.reviews.map(review => {
      const item = byId.get(review.item)!;
      let ancestor: PlanNode | undefined = item;
      while (ancestor && !routesById.has(ancestor.id)) ancestor = ancestor.parent ? byId.get(ancestor.parent) : undefined;
      const route = ancestor && routesById.get(ancestor.id);
      return <li key={item.id} className="space-y-2 rounded-xl border border-slate-300 bg-white p-3">
        <button className="text-left text-sm font-semibold hover:underline" onClick={() => select(item.id)}>{item.title}</button>
        <p className="break-words text-sm text-slate-700">{review.prompt}</p>
        <div className="flex flex-wrap gap-2">
          {route && <Link className={control} to={route} onClick={() => select(ancestor!.id)}>Open {ancestor!.title}</Link>}
          <button className={control} onClick={() => void save({ ...plan, reviews: plan.reviews.filter(entry => entry.item !== item.id) })}>Mark review complete</button>
        </div>
      </li>;
    })}</ul>
  </section>;
}

function NodeDetail({ node, plan, save, select }: { node: PlanNode; plan: ProjectPlan; save: Save; select: (id: string) => void }) {
  const parents: PlanNode[] = [];
  const byId = new Map(plan.nodes.map(candidate => [candidate.id, candidate]));
  let parent = node.parent ? byId.get(node.parent) : undefined;
  while (parent) {
    parents.unshift(parent);
    parent = parent.parent ? byId.get(parent.parent) : undefined;
  }
  return <section className="space-y-4">
    <nav aria-label="Project branch" className="flex flex-wrap items-center gap-1 text-xs text-slate-600">
      {parents.map(item => <span className="inline-flex items-center gap-1" key={item.id}>
        <button className="py-1 underline-offset-4 hover:underline" onClick={() => select(item.id)}>{item.title}</button>
        <ChevronRight size={12} aria-hidden />
      </span>)}
      <span>{node.title}</span>
    </nav>
    <div className="rounded-xl border border-slate-300 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 break-words text-xl font-semibold">{node.title}</h3>
        <button className={`${iconButton} -mr-2 -mt-2`} aria-label="Pin as a spearhead" aria-pressed={node.pinned} onClick={() => void save(updateNode(plan, node.id, { pinned: !node.pinned }))}><Pin size={17} fill={node.pinned ? "currentColor" : "none"} /></button>
      </div>
      {node.overview && <p className="mt-1 whitespace-pre-line break-words text-sm text-slate-700">{node.overview}</p>}
      <PlanProgress id={node.id} nodes={plan.nodes} />
      {node.kind === "task" && <label className="mt-2 flex min-h-10 items-center gap-2 text-sm">
        <input className="size-4 accent-teal-700" type="checkbox" checked={node.done} onChange={event => void save(updateNode(plan, node.id, { done: event.target.checked }))} /> Complete
      </label>}
    </div>
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Checklist</h4>
      <Checklist parent={node.id} plan={plan} save={save} select={select} />
      <AddItem parent={node.id} plan={plan} save={save} />
    </div>
    <NodeActions node={node} plan={plan} save={save} />
    <ReviewForm node={node} plan={plan} save={save} />
  </section>;
}

interface PanelProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  panelWidth: number;
  wide: boolean;
  toggleWidth: () => void;
}

export default function ProjectPlanPanel({ open, setOpen, panelWidth, wide, toggleWidth }: PanelProps) {
  const { pathname, key: pageKey } = useLocation();
  const tool = contextualTools.find(item => item.path.toLowerCase() === pathname.replace(/\/$/, "").toLowerCase());
  const [selection, setSelection] = useState<{ route: string; id: string | null }>();
  const launcher = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const { plan, saving, error, loadFailed, save, reload, locked, unlock } = useProjectPlan(open);

  const selectedId = selection?.route === pageKey ? selection.id : tool?.id;
  const selected = plan?.nodes.find(node => node.id === selectedId);
  const reviews = selectedId === "review-queue";
  const select = (id: string | null) => setSelection({ route: pageKey, id });

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        setOpen(false);
        requestAnimationFrame(() => launcher.current?.focus());
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, setOpen]);

  return <div className="print:hidden">
    <button type="button" className={`fixed bottom-20 left-3 z-[2010] grid size-11 place-items-center rounded-full border border-slate-300 bg-white text-slate-800 shadow-lift hover:bg-slate-100 sm:left-5 ${open ? "invisible" : ""}`}
      ref={launcher} title="Project plan" aria-label="Open project plan" aria-expanded={open} aria-controls={open ? "project-plan-panel" : undefined} onClick={() => { setSelection(undefined); setOpen(true); }}>
      <GitFork size={19} />
    </button>
    {open && <aside id="project-plan-panel" aria-label="Project plan"
      className={`fixed left-0 z-[2010] flex w-full flex-col ${panelWidth ? "inset-y-4" : "inset-y-0 bg-slate-50 shadow-lift"}`}
      style={panelWidth ? { width: panelWidth } : undefined}>
      <header className={`border-b border-slate-200 px-4 py-3 ${panelWidth ? "" : "bg-white"}`}>
        <div className="flex items-center gap-1">
          <h2 className="mr-auto text-lg font-semibold">Project plan</h2>
          {pathname !== "/" && <Link to="/" className={iconButton} aria-label="Site home"><Home size={17} /></Link>}
          {panelWidth > 0 && <button className={iconButton} aria-label={wide ? "Narrow panel" : "Widen panel"} onClick={toggleWidth}>{wide ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>}
          <button ref={closeButton} className={iconButton} aria-label="Close project plan" onClick={() => {
            setOpen(false);
            requestAnimationFrame(() => launcher.current?.focus());
          }}><X size={19} /></button>
        </div>
        <nav aria-label="Project plan views" className="mt-2 flex flex-wrap gap-2">
          <button className={control} aria-pressed={!selectedId} onClick={() => select(null)}>Project map</button>
          {tool && <button className={control} aria-pressed={selectedId === tool.id} onClick={() => select(tool.id)}>This tool</button>}
          <button className={`${control} inline-flex items-center gap-1.5`} aria-pressed={reviews} onClick={() => select("review-queue")}><ListTodo size={15} /> Review{plan?.reviews.length ? ` (${plan.reviews.length})` : ""}</button>
        </nav>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4" key={pathname}>
        {error && <div role="alert" className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          {error} {!locked && <button className="ml-1 underline" onClick={reload}>Reload plan</button>}
        </div>}
        {locked && <form className="grid gap-3" onSubmit={event => {
          event.preventDefault();
          unlock(String(new FormData(event.currentTarget).get("key")));
        }}>
          <label className="grid gap-1 text-sm">Shared plan access key
            <input className={input} type="password" name="key" autoComplete="current-password" required />
          </label>
          <p className="text-sm text-slate-600">This browser remembers your key.</p>
          <button className={`${control} justify-self-start`}>Unlock project plan</button>
        </form>}
        {!locked && !plan && !error && <p role="status" className="text-sm text-slate-600">Loading project plan…</p>}
        {saving && <p role="status" className="mb-2 text-xs text-slate-600">Saving…</p>}
        {plan && <fieldset disabled={saving || loadFailed} className="min-w-0">
          {reviews ? <Reviews key="reviews" plan={plan} select={select} save={save} />
            : selected ? <NodeDetail key={selected.id} node={selected} plan={plan} save={save} select={select} />
            : <ProjectMap key="map" plan={plan} select={select} save={save} />}
        </fieldset>}
      </div>
    </aside>}
  </div>;
}
