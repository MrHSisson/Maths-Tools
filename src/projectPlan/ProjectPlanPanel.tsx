import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowRight, ChevronDown, ChevronRight, GitFork, Home, Maximize2, Minimize2, MoreHorizontal, Pin, Plus, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { routesById, contextualTools, treeForRoot, type VisiblePlanTree } from "./catalogue";
import { branchClassifications, deletePlanTask, descendants, makeNode, type BranchClassification, type PlanNode, type ProjectPlan } from "../../api/_projectPlan";
import { useProjectPlan } from "./useProjectPlan";
import { FEATURES, TOOLS } from "../admin/facts";
import { ToolsSection } from "../admin/ToolsSection";
import { emptyStore } from "../admin/notes";
import { PlanReference, isPlanReference } from "./PlanReference";
import { MECHANICS_PAIRINGS } from "../tools/FurtherMechanics/mechanicsSpec";
import docs from "../generated/adminDocs.json";

const control = "rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-40";
const input = "min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const iconButton = "inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30";
const treeTabs = ["site", "developments"] as const;
const treeLabels = { site: "Site", developments: "Pathways" };
const featureViews = [
  { id: "feature-tracker", label: "Tracker" },
  { id: "feature-guide", label: "Guide" },
  { id: "build-guide", label: "Build guide" },
] as const;
const matrixStore = emptyStore();
const viewControl = "min-h-11 shrink-0 whitespace-nowrap border-b-2 border-transparent px-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 aria-pressed:border-teal-700 aria-pressed:font-semibold aria-pressed:text-teal-900";
const menuAction = "flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium hover:bg-slate-100";

type Save = (plan: ProjectPlan) => Promise<boolean>;

function indexPlan(nodes: PlanNode[]) {
  const deckItems = descendants(nodes, "project:decks");
  const children = new Map<string | null, PlanNode[]>();
  const byId = new Map<string, PlanNode>();
  for (const node of nodes) {
    byId.set(node.id, node);
    if (deckItems.has(node.id)) continue;
    const siblings = children.get(node.parent) ?? [];
    siblings.push(node);
    children.set(node.parent, siblings);
  }

  const progress = new Map<string, { total: number; done: number }>();
  function count(node: PlanNode) {
    let total = Number(node.kind === "task");
    let done = Number(node.kind === "task" && node.done);
    for (const child of children.get(node.id) ?? []) {
      const result = count(child);
      total += result.total;
      done += result.done;
    }
    const result = { total, done };
    progress.set(node.id, result);
    return result;
  }
  for (const root of children.get(null) ?? []) count(root);
  return { children, byId, progress, deckItems };
}

type PlanIndex = ReturnType<typeof indexPlan>;

function overviewLines(overview: string) {
  return overview.split(/\r?\n/).map(line => line.trim().replace(/^[-*•]\s+/, "")).filter(Boolean);
}

function Overview({ text }: { text: string }) {
  const lines = overviewLines(text);
  if (!lines.length) return null;
  return <ul className="list-disc space-y-1 break-words pl-4 text-sm text-slate-700">
    {lines.map((line, index) => <li key={index}>{line}</li>)}
  </ul>;
}

function PlanProgress({ index, id }: { index: PlanIndex; id: string }) {
  const result = index.progress.get(id);
  if (!result?.total) return null;
  return <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs tabular-nums text-slate-600">
    <progress className="h-1.5 w-10 accent-teal-600" value={result.done} max={result.total} aria-label="Checklist progress" />
    {result.done}/{result.total} done
  </span>;
}

const classificationLabels: Record<BranchClassification, string> = {
  subtool: "Subtool",
  "planned-feature": "Feature · Planned",
  "live-feature": "Feature · Live",
};

function ClassificationOptions() {
  return <>
    <option value="branch">Branch</option>
    {branchClassifications.map(classification => (
      <option key={classification} value={classification}>{classificationLabels[classification]}</option>
    ))}
  </>;
}

function ItemName({ node }: { node: PlanNode }) {
  return <span className="min-w-0 break-words">
    {node.title}
    {node.classification && <span className="block text-xs font-normal text-slate-600">
      {classificationLabels[node.classification]}
    </span>}
  </span>;
}

function AddItem({ parent, plan, save, branch = false, tree, close }: {
  parent: string | null; plan: ProjectPlan; save: Save; branch?: boolean; tree?: VisiblePlanTree; close?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(!!close);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    const type = new FormData(event.currentTarget).get("type");
    const classification = branchClassifications.find(candidate => candidate === type);
    const node = makeNode(crypto.randomUUID(), parent, title.trim(), branch || classification || type === "branch" ? "branch" : "task");
    if (classification) node.classification = classification;
    if (parent === null && tree) node.tree = tree;
    if (await save({ ...plan, nodes: [...plan.nodes, node] })) {
      setTitle("");
      close?.();
    }
  }
  return <div>
    {!close && <button type="button" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-teal-800 hover:underline"
      aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <Plus size={16} aria-hidden /> {branch ? tree === "developments" ? "Add pathway" : "Add area" : "Add task"}
    </button>}
    {open && <form onSubmit={submit} className="flex flex-wrap items-center gap-2 pb-2">
      <input className={`${input} flex-1 basis-36`} aria-label={branch ? "New project branch" : "New checklist item"} placeholder={branch ? "New project branch" : "New checklist item"} maxLength={120} value={title} onChange={event => setTitle(event.target.value)} required autoFocus />
      {close && <select className={input} aria-label="Item type" name="type" defaultValue="branch">
        <ClassificationOptions />
      </select>}
      <button className={control} disabled={!title.trim()}>Add</button>
      {close && <button type="button" className={control} onClick={close}>Cancel</button>}
    </form>}
  </div>;
}

function MapNode({ node, index, select, expandedIds, toggle, area = false, showSummary = false }: {
  node: PlanNode; index: PlanIndex; select: (id: string) => void;
  expandedIds: ReadonlySet<string>; toggle: (id: string) => void; area?: boolean; showSummary?: boolean;
}) {
  const expanded = expandedIds.has(node.id);
  const children = index.children.get(node.id) ?? [];
  const summary = showSummary ? overviewLines(node.overview)[0] : undefined;
  const rowStyle = area
    ? "rounded-xl border border-slate-200 bg-white hover:border-teal-500 focus-within:border-teal-500"
    : "border-b border-slate-200";
  return <li className="min-w-0">
    <div className={`relative flex min-w-0 items-start gap-1 pr-3 ${rowStyle}`}>
      {children.length ? (
        <button type="button" className={`${iconButton} relative z-[1]`} aria-label={`${expanded ? "Collapse" : "Expand"} ${node.title}`}
          aria-expanded={expanded} onClick={() => toggle(node.id)}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      ) : <span className="mx-4 mt-5 size-1.5 shrink-0 rounded-full bg-slate-400" />}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" className="min-h-11 min-w-0 flex-1 break-words py-2 text-left text-sm font-medium hover:underline after:absolute after:inset-0"
            onClick={() => select(node.id)}>
            <ItemName node={node} />
          </button>
          <PlanProgress index={index} id={node.id} />
        </div>
        {summary && <p className="mb-2 line-clamp-2 break-words text-xs text-slate-600">{summary}</p>}
      </div>
    </div>
    {expanded && <ul className="ml-3 border-l border-slate-300 pl-2 sm:ml-4">
      {children.map(child => <MapNode key={child.id} node={child} index={index} select={select} expandedIds={expandedIds} toggle={toggle} />)}
    </ul>}
  </li>;
}

function ProjectMap({ plan, index, select, save, expandedIds, toggle, tree }: {
  plan: ProjectPlan; index: PlanIndex; select: (id: string) => void; save: Save;
  expandedIds: ReadonlySet<string>; toggle: (id: string) => void; tree: VisiblePlanTree;
}) {
  const roots = (index.children.get(null) ?? []).filter(node => node.kind === "branch" && treeForRoot(node) === tree);
  const heading = tree === "developments" ? "Pathways" : `${treeLabels[tree]} tree`;
  const visible = plan.nodes.filter(node => !index.deckItems.has(node.id));
  const pinned = visible.filter(node => node.pinned);
  const dependencies = visible.flatMap(node => node.needs
    .filter(id => !index.deckItems.has(id)).map(id => ({ node, prerequisite: index.byId.get(id)! })));
  return <section aria-label="Project tree" className="space-y-2">
    <h3 className="border-b border-slate-200 py-2 text-sm font-semibold text-slate-900">{heading}</h3>
    {pinned.length > 0 && <details className="border-b border-slate-200">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">Pinned ({pinned.length})</summary>
      <ul className="divide-y divide-slate-200">{pinned.map(node => <li key={node.id}>
        <button type="button" className="flex min-h-11 w-full items-center gap-2 text-left text-sm text-teal-800 hover:underline"
          onClick={() => select(node.id)}>
          <Pin size={14} className="shrink-0" aria-hidden /> <ItemName node={node} />
        </button>
      </li>)}</ul>
    </details>}
    <ul className="space-y-2">{roots.map(node => (
      <MapNode key={node.id} node={node} index={index} select={select} expandedIds={expandedIds} toggle={toggle}
        area showSummary={tree !== "site"} />
    ))}</ul>
    <AddItem key={tree} parent={null} plan={plan} save={save} branch tree={tree} />
    {dependencies.length > 0 && <details className="border-t border-slate-200 pt-2">
      <summary className="cursor-pointer py-2 text-sm font-medium">Dependencies ({dependencies.length})</summary>
      <ul className="divide-y divide-slate-200">{dependencies.map(({ node, prerequisite }) => (
        <li className="flex flex-wrap items-center gap-x-2 py-2 text-sm" key={`${node.id}:${prerequisite.id}`}>
          <button className="min-w-0 break-words text-left text-teal-800 hover:underline" onClick={() => select(prerequisite.id)}>{prerequisite.title}</button>
          <ArrowRight size={14} className="shrink-0" aria-label="before" />
          <button className="min-w-0 break-words text-left text-teal-800 hover:underline" onClick={() => select(node.id)}><ItemName node={node} /></button>
        </li>
      ))}</ul>
    </details>}
  </section>;

}

function Tasks({ plan, index, save, select }: { plan: ProjectPlan; index: PlanIndex; save: Save; select: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const tasks = plan.nodes.filter(node => {
    if (node.kind !== "task" || index.deckItems.has(node.id)) return false;
    const parent = node.parent ? index.byId.get(node.parent)?.title : undefined;
    return node.title.toLowerCase().includes(needle) || !!parent?.toLowerCase().includes(needle);
  });
  return <section className="space-y-2" aria-label="Tasks">
    <div className="flex flex-wrap items-center justify-between gap-x-2 border-b border-slate-200">
      <h3 className="text-sm font-semibold">Tasks</h3>
      <AddItem parent={null} plan={plan} save={save} tree="developments" />
    </div>
    <input className={`${input} w-full`} aria-label="Search tasks" placeholder="Search tasks"
      value={query} onChange={event => setQuery(event.target.value)} />
    {!tasks.some(node => !node.done) && <p className="py-2 text-sm text-slate-600">{needle ? "No matching open tasks." : "No open tasks."}</p>}
    <Checklist children={tasks} plan={plan} save={save} select={select} context={index.byId} />
  </section>;
}

function updateNode(plan: ProjectPlan, id: string, patch: Partial<PlanNode>): ProjectPlan {
  return { ...plan, nodes: plan.nodes.map(node => node.id === id ? { ...node, ...patch } : node) };
}

function Checklist({ children, plan, save, select, limit, context }: {
  children: PlanNode[]; plan: ProjectPlan; save: Save; select: (id: string) => void;
  limit?: number; context?: ReadonlyMap<string, PlanNode>;
}) {
  const complete = children.filter(node => node.kind === "task" && node.done);
  const open = children.filter(node => node.kind !== "task" || !node.done);
  const visible = limit === undefined ? open : open.slice(0, limit);
  const more = open.slice(visible.length);
  function row(node: PlanNode) {
    const parentTitle = node.parent ? context?.get(node.parent)?.title : undefined;
    return <li key={node.id} className="flex min-w-0 items-center gap-1">
      {node.kind === "task" ? <label className="grid size-11 shrink-0 cursor-pointer place-items-center">
        <input type="checkbox" className="size-4 accent-teal-700" checked={node.done} aria-label={node.title} onChange={event => void save(updateNode(plan, node.id, { done: event.target.checked }))} />
      </label> : <GitFork size={15} className="mx-3.5 shrink-0 text-slate-400" aria-hidden />}
      <button onClick={() => select(node.id)} className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-2 py-1.5 text-left text-sm hover:underline">
        <span className="min-w-0">
          <ItemName node={node} />
          {parentTitle && <span className="block break-words text-xs text-slate-600">{parentTitle}</span>}
        </span>
        <ChevronRight size={16} className="shrink-0 text-slate-500" aria-hidden />
      </button>
    </li>;
  }
  return <>
    {visible.length > 0 && <ul className="divide-y divide-slate-200">{visible.map(row)}</ul>}
    {more.length > 0 && <details className="border-t border-slate-200">
      <summary className="min-h-11 cursor-pointer py-3 text-sm text-slate-600">More items ({more.length})</summary>
      <ul className="divide-y divide-slate-200">{more.map(row)}</ul>
    </details>}
    {complete.length > 0 && <details className="border-t border-slate-200">
      <summary className="min-h-11 cursor-pointer py-3 text-sm text-slate-600">{context ? "Show completed" : "Completed"} ({complete.length})</summary>
      <ul className="divide-y divide-slate-200">{complete.map(row)}</ul>
    </details>}
  </>;
}

function EditItem({ node, plan, index, save, close, organise }: {
  node: PlanNode; plan: ProjectPlan; index: PlanIndex; save: Save; close: () => void; organise: boolean;
}) {
  const [needs, setNeeds] = useState(node.needs);
  const [prerequisite, setPrerequisite] = useState("");
  const shownNeeds = needs.filter(id => !index.deckItems.has(id));
  const blocked = descendants(plan.nodes, node.id);
  const visible = plan.nodes.filter(candidate => !index.deckItems.has(candidate.id));
  const label = "grid gap-1 text-sm";
  const disclosure = "min-h-11 cursor-pointer py-3 text-sm font-medium";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (organise) {
      const classification = branchClassifications.find(candidate => candidate === data.get("type"));
      const location = String(data.get("parent"));
      const newTree = treeTabs.find(tree => location === `tree:${tree}`);
      const parent = newTree ? null : location || null;
      const tree = newTree && (node.parent !== null || newTree !== treeForRoot(node)) ? newTree : node.tree;
      if (await save(updateNode(plan, node.id, { classification, parent, needs, tree }))) close();
      return;
    }
    const title = String(data.get("title")).trim();
    const overview = String(data.get("overview")).trim();
    const lines = overviewLines(overview);
    if (overview !== node.overview && (lines.length > 3 || lines.some(line => line.length > 120))) {
      const field = form.elements.namedItem("overview") as HTMLTextAreaElement;
      field.setCustomValidity("Use up to three lines, 120 characters each.");
      field.reportValidity();
      return;
    }
    if (title && await save(updateNode(plan, node.id, { title, overview }))) close();
  }

  return <form className="grid min-w-0 gap-3 py-2" onSubmit={submit}>
    {!organise ? <>
      <label className={label}>Name
        <input className={input} name="title" defaultValue={node.title} required maxLength={120} autoFocus />
      </label>
      <label className={label}>Overview
        <textarea className={input} name="overview" defaultValue={node.overview} rows={3} maxLength={500} onInput={event => event.currentTarget.setCustomValidity("")} />
        <span className="text-xs text-slate-600">Up to three short lines, one bullet per line.</span>
      </label>
    </> : <>
      {node.kind === "branch" && <label className={label}>Item type
        <select className={input} name="type" defaultValue={node.classification ?? "branch"}>
          <ClassificationOptions />
        </select>
      </label>}
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        <details>
          <summary className={disclosure}>Change location</summary>
          <label className={`${label} pb-3`}>Move under
            <select className={`${input} w-full`} name="parent" defaultValue={node.parent ?? `tree:${treeForRoot(node)}`}>
              {treeTabs.map(tree => <option key={tree} value={`tree:${tree}`}>{treeLabels[tree]} tree</option>)}
              {visible.filter(candidate => !blocked.has(candidate.id)).map(candidate => (
                <option key={candidate.id} value={candidate.id}>{candidate.title}</option>
              ))}
            </select>
          </label>
        </details>
        <details>
          <summary className={disclosure}>Dependencies{shownNeeds.length ? ` (${shownNeeds.length})` : ""}</summary>
          <ul className="divide-y divide-slate-200">
            {shownNeeds.map(id => {
              const dependency = plan.nodes.find(candidate => candidate.id === id);
              return <li key={id} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 break-words">{dependency?.title}</span>
                <button type="button" className={iconButton} aria-label={`Remove dependency on ${dependency?.title}`}
                  onClick={() => setNeeds(current => current.filter(value => value !== id))}><X size={14} /></button>
              </li>;
            })}
          </ul>
          <div className="flex gap-2 pb-3">
            <select className={`${input} flex-1`} aria-label="Prerequisite" value={prerequisite} onChange={event => setPrerequisite(event.target.value)}>
              <option value="">Choose an item</option>
              {visible.filter(candidate => candidate.id !== node.id && !needs.includes(candidate.id)).map(candidate => (
                <option key={candidate.id} value={candidate.id}>{candidate.title}</option>
              ))}
            </select>
            <button type="button" className={control} disabled={!prerequisite} onClick={() => {
              setNeeds(current => [...current, prerequisite]);
              setPrerequisite("");
            }}>Add</button>
          </div>
        </details>
      </div>
    </>}
    <div className="flex items-center gap-2">
      <button type="submit" className="min-h-11 rounded-lg bg-teal-800 px-4 text-sm font-semibold text-white hover:bg-teal-900">Save</button>
      <button type="button" className="min-h-11 px-3 text-sm text-slate-700 hover:underline" onClick={close}>Cancel</button>
    </div>
  </form>;
}

function Reviews({ plan, index, save, select }: { plan: ProjectPlan; index: PlanIndex; save: Save; select: (id: string) => void }) {
  const { byId, deckItems } = index;
  const reviews = plan.reviews.filter(review => !deckItems.has(review.item));
  return <section className="space-y-3">
    <h3 className="text-sm font-semibold">Harry’s review queue</h3>
    {reviews.length === 0 && <p className="text-sm text-slate-600">No review requests.</p>}
    <ul className="space-y-3">{reviews.map(review => {
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

const toolFactsById = new Map(TOOLS.map(tool => [tool.id, tool]));
const mechanicsSubtools = Object.values(MECHANICS_PAIRINGS).flat();
const profileSubtoolsById = new Map(Object.entries(docs.tools).flatMap(([id, profile]) =>
  "subTools" in profile ? [[id, profile.subTools] as const] : []
));

function ToolReferences({ id, close, select }: { id: string; close: () => void; select: (id: string) => void }) {
  const tool = toolFactsById.get(id);
  if (!tool) return null;
  const subtools = [...new Map(mechanicsSubtools.filter(ref => ref.tool === id).map(ref => [ref.sub, ref])).values()];
  const profileSubtools = profileSubtoolsById.get(id) ?? [];
  const features = FEATURES.filter(feature => tool[feature.key] && feature.key !== "spec" && feature.key !== "tests" && feature.key !== "teach");
  const summary = "min-h-11 cursor-pointer py-3 text-sm font-medium";
  const link = "inline-flex min-h-11 items-center break-words text-sm text-teal-800 hover:underline";

  return <div className="mt-2 divide-y divide-slate-200 border-t border-slate-200">
    {subtools.length > 0 && <details>
      <summary className={summary}>Subtools ({subtools.length})</summary>
      <ul className="pl-3">{subtools.map(ref => (
        <li key={ref.sub}><Link className={link} to={{ pathname: tool.path, search: new URLSearchParams({
          tool: ref.sub, ...(ref.practice ? { o_practice: ref.practice } : {}), ...(ref.a2 ? { o_course: "A2" } : {}),
        }).toString() }} onClick={close}>{ref.label}{ref.a2 ? " (A2)" : ""}</Link></li>
      ))}</ul>
    </details>}
    {subtools.length === 0 && profileSubtools.length > 0 && <details>
      <summary className={summary}>Subtools ({profileSubtools.length})</summary>
      <ul className="space-y-2 pb-3 pl-3 text-sm">
        {profileSubtools.map(subtool => <li key={subtool.name}>
          <span className="font-medium">{subtool.name}</span>
          <p className="text-slate-600">{subtool.purpose}</p>
        </li>)}
      </ul>
    </details>}
    <details>
      <summary className={summary}>Tool features</summary>
      {features.length > 0 && <ul className="list-disc space-y-1 pl-6 text-sm text-slate-700">
        {features.map(feature => <li key={feature.key}>{feature.label}</li>)}
      </ul>}
      <button className={`${link} pl-3`} onClick={() => select("feature-guide")}>Feature guide</button>
    </details>
    {contextualTools.some(item => item.id === id && item.hub === "further-mechanics") && (
      <button className={link} onClick={() => select("further-mechanics")}>Further Mechanics checklist</button>
    )}
  </div>;
}

function NodeDetail({ node, index, plan, save, select, back, expandedIds, toggle, close, showReview }: {
  node: PlanNode; index: PlanIndex; plan: ProjectPlan; save: Save; select: (id: string) => void;
  back: () => void; expandedIds: ReadonlySet<string>; toggle: (id: string) => void;
  close: () => void; showReview: () => void;
}) {
  const [showSubtree, setShowSubtree] = useState(false);
  const [action, setAction] = useState<"edit" | "organise" | "add" | "delete">();
  const editButton = useRef<HTMLButtonElement>(null);
  function closeEditor() {
    setAction(undefined);
    requestAnimationFrame(() => editButton.current?.focus());
  }
  const parents: PlanNode[] = [];
  let parent = node.parent ? index.byId.get(node.parent) : undefined;
  while (parent) {
    parents.unshift(parent);
    parent = parent.parent ? index.byId.get(parent.parent) : undefined;
  }
  const children = index.children.get(node.id) ?? [];
  const isTool = toolFactsById.has(node.id);
  const shownNeeds = node.needs.filter(id => !index.deckItems.has(id));
  const checklist = isTool ? [...children.filter(child => child.kind === "task"), ...children.filter(child => child.kind === "branch")] : children;
  return <section className="relative min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
    <nav aria-label="Project branch" className="flex flex-wrap items-center gap-x-2 text-xs text-slate-600">
      <button className="min-h-11 text-teal-800 hover:underline" onClick={back}>Project Plan</button>
      {parents.map(item => <span className="inline-flex min-w-0 items-center gap-1" key={item.id}>
        <ChevronRight className="shrink-0" size={12} aria-hidden />
        <button className="min-h-11 break-words text-left hover:underline" onClick={() => select(item.id)}>{item.title}</button>
      </span>)}
    </nav>
    <div className="flex items-start justify-between gap-2">
      <h3 className="min-w-0 break-words py-2 text-lg font-semibold leading-snug"><ItemName node={node} /></h3>
      {!action && <div className="flex shrink-0 items-center gap-1">
        <button ref={editButton} type="button" className="min-h-11 rounded-lg px-2 text-sm font-medium text-teal-800 hover:bg-teal-50"
          onClick={() => setAction("edit")}>Edit</button>
        <details>
          <summary className={`${iconButton} cursor-pointer list-none [&::-webkit-details-marker]:hidden`} aria-label="Task actions">
            <MoreHorizontal size={20} aria-hidden />
          </summary>
          <div className="absolute right-3 z-10 w-52 max-w-full rounded-xl border border-slate-300 bg-white p-1 shadow-lift">
            <button type="button" className={menuAction} onClick={() => setAction("organise")}>Location and links</button>
            <button type="button" className={menuAction} onClick={() => setAction("add")}>Add branch or feature</button>
            <button className={menuAction} aria-pressed={node.pinned} onClick={() => void save(updateNode(plan, node.id, { pinned: !node.pinned }))}>
              <Pin size={17} fill={node.pinned ? "currentColor" : "none"} aria-hidden /> {node.pinned ? "Unpin" : "Pin"}
            </button>
            {plan.reviews.some(request => !index.deckItems.has(request.item)) && <button type="button"
              className="flex min-h-11 w-full items-center text-left text-sm font-medium text-slate-600 hover:underline"
              onClick={showReview}>View existing review requests</button>}
            {node.kind === "task" && <button type="button" className={`${menuAction} text-red-700`}
              onClick={() => setAction("delete")}>Delete task</button>}
          </div>
        </details>
      </div>}
    </div>
    {action === "add" ? <AddItem parent={node.id} plan={plan} save={save} branch close={closeEditor} />
      : action === "delete" ? <div className="space-y-3 border-t border-slate-200 py-3">
        <p className="text-sm">Delete this task?{children.length > 0 && " Items inside it will move up one level."}</p>
        <div className="flex gap-2">
          <button type="button" className={control} onClick={closeEditor} autoFocus>Cancel</button>
          <button type="button" className="min-h-11 rounded-lg bg-red-700 px-3 text-sm font-semibold text-white hover:bg-red-800"
            onClick={async () => { if (await save(deletePlanTask(plan, node.id))) back(); }}>Delete permanently</button>
        </div>
      </div>
      : action ? <EditItem key={JSON.stringify([node.title, node.overview, node.classification, node.parent, node.needs])}
        node={node} plan={plan} index={index} save={save} close={closeEditor} organise={action === "organise"} /> : <>
      <Overview text={node.overview} />
      <div className="mt-2 flex flex-wrap items-center gap-x-3">
        {node.kind === "task" ? <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input className="size-4 accent-teal-700" type="checkbox" checked={node.done} onChange={event => void save(updateNode(plan, node.id, { done: event.target.checked }))} /> Complete
        </label> : <PlanProgress id={node.id} index={index} />}
      </div>
      {shownNeeds.length > 0 && <div className="mt-2 text-sm">
        <p className="font-medium">Depends on</p>
        <ul className="list-disc pl-5">{shownNeeds.map(id => (
          <li key={id}><button className="min-h-11 break-words text-left text-teal-800 hover:underline" onClick={() => select(id)}>{index.byId.get(id)?.title}</button></li>
        ))}</ul>
      </div>}
      <div className="mt-3 border-t border-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-x-3">
          <AddItem parent={node.id} plan={plan} save={save} />
          {children.some(child => index.children.has(child.id)) && <button
            className="min-h-11 text-sm font-medium text-teal-800 hover:underline"
            aria-pressed={showSubtree} onClick={() => setShowSubtree(value => !value)}
          >{showSubtree ? "Show checklist" : "Show subtree"}</button>}
        </div>
        {showSubtree ? <ul aria-label={`Subtree for ${node.title}`}>
          {children.map(child => <MapNode key={child.id} node={child} index={index} select={select} expandedIds={expandedIds} toggle={toggle} />)}
        </ul> : <Checklist children={checklist} plan={plan} save={save} select={select} limit={isTool ? 3 : undefined} />}
      </div>
      {isTool && <ToolReferences id={node.id} close={close} select={select} />}
    </>}
  </section>;
}

const launcherPositionKey = "mt-project-plan-launcher";
const launcherMargin = 8;
type Position = { x: number; y: number };

function loadLauncherPosition(): Position | undefined {
  try {
    const value = JSON.parse(localStorage.getItem(launcherPositionKey) ?? "null");
    if (value && Number.isFinite(value.x) && Number.isFinite(value.y)) return { x: value.x, y: value.y };
  } catch { /* Storage is unavailable or the saved position is invalid. */ }
}

function clampLauncherPosition(button: HTMLButtonElement, { x, y }: Position): Position {
  const viewport = document.documentElement;
  const clamp = (value: number, limit: number) => Math.max(launcherMargin, Math.min(value, limit - launcherMargin));
  return {
    x: clamp(x, viewport.clientWidth - button.offsetWidth),
    y: clamp(y, viewport.clientHeight - button.offsetHeight),
  };
}

interface PanelProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  panelWidth: number;
  wide: boolean;
  toggleWidth: () => void;
  onMatrixView: (active: boolean) => void;
}

export default function ProjectPlanPanel({ open, setOpen, panelWidth, wide, toggleWidth, onMatrixView }: PanelProps) {
  const { pathname, key: pageKey } = useLocation();
  const tool = contextualTools.find(item => item.path.toLowerCase() === pathname.replace(/\/$/, "").toLowerCase());
  const [selection, setSelection] = useState<{ route: string; id: string | null }>();
  const launcher = useRef<HTMLButtonElement>(null);
  const [launcherPosition, setLauncherPosition] = useState(loadLauncherPosition);
  const drag = useRef<{ id: number; start: Position; origin: Position; previous?: Position; moved: boolean }>();
  const suppressClick = useRef(false);

  function saveLauncherPosition(position: Position) {
    setLauncherPosition(position);
    try { localStorage.setItem(launcherPositionKey, JSON.stringify(position)); } catch { /* Keep it for this visit. */ }
  }

  function moveLauncher(event: ReactPointerEvent<HTMLButtonElement>): Position | undefined {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.start.x;
    const dy = event.clientY - current.start.y;
    if (!current.moved && Math.hypot(dx, dy) < 5) return;
    current.moved = true;
    return clampLauncherPosition(event.currentTarget, { x: current.origin.x + dx, y: current.origin.y + dy });
  }
  const closeButton = useRef<HTMLButtonElement>(null);
  const { plan, saving, error, loadFailed, save, reload } = useProjectPlan(open);

  const index = useMemo(() => indexPlan(plan?.nodes ?? []), [plan?.nodes]);
  const selectedId = selection?.route === pageKey ? selection.id : tool?.id;
  const selected = selectedId ? index.byId.get(selectedId) : undefined;
  const reviews = selectedId === "review-queue";
  const matrix = selectedId === "feature-tracker";
  const features = featureViews.some(view => view.id === selectedId);
  const [tree, setTree] = useState<VisiblePlanTree>("site");
  const [trackerOpened, setTrackerOpened] = useState(false);
  const returnView = useRef<string | null>(null);
  const referenceFrom = useRef<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, number>());
  const viewKey = `${pageKey}:${tree}:${selectedId ?? "overview"}`;
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(() => new Set());

  function toggleBranch(id: string) {
    setExpandedIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function select(id: string | null) {
    if (scroller.current) positions.current.set(viewKey, scroller.current.scrollTop);
    if (isPlanReference(id)) {
      referenceFrom.current = selectedId ?? null;
    } else if (!selected && !isPlanReference(selectedId)) {
      returnView.current = selectedId ?? null;
    }
    if (id === "feature-tracker") setTrackerOpened(true);
    setSelection({ route: pageKey, id });
  }

  function selectTree(next: VisiblePlanTree) {
    setTree(next);
    select(null);
  }

  useLayoutEffect(() => {
    onMatrixView(open && matrix);
  }, [onMatrixView, open, matrix]);

  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollTop = positions.current.get(viewKey) ?? 0;
  }, [viewKey, open]);

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
    <button type="button" className={`fixed bottom-20 left-3 z-[2010] grid size-11 touch-none cursor-grab select-none place-items-center rounded-full border border-slate-300 bg-white text-slate-800 shadow-lift hover:bg-slate-100 active:cursor-grabbing sm:left-5 ${open ? "invisible" : ""}`}
      style={launcherPosition && {
        left: `clamp(${launcherMargin}px, ${launcherPosition.x}px, calc(100% - 2.75rem - ${launcherMargin}px))`,
        top: `clamp(${launcherMargin}px, ${launcherPosition.y}px, calc(100% - 2.75rem - ${launcherMargin}px))`,
        bottom: "auto",
      }}
      ref={launcher} title="Project plan · drag or use arrow keys to move" aria-label="Open project plan"
      aria-expanded={open} aria-controls={open ? "project-plan-panel" : undefined}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        suppressClick.current = false;
        drag.current = { id: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: { x: bounds.left, y: bounds.top }, previous: launcherPosition, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        const position = moveLauncher(event);
        if (position) setLauncherPosition(position);
      }}
      onPointerUp={event => {
        if (drag.current?.id !== event.pointerId) return;
        const position = moveLauncher(event);
        drag.current = undefined;
        if (position) { suppressClick.current = true; saveLauncherPosition(position); }
      }}
      onLostPointerCapture={event => {
        const current = drag.current;
        if (!current || current.id !== event.pointerId) return;
        drag.current = undefined;
        if (current.moved) {
          suppressClick.current = true;
          setLauncherPosition(current.previous);
        }
      }}
      onKeyDown={event => {
        const offsets: Record<string, Position> = { ArrowUp: { x: 0, y: -16 }, ArrowDown: { x: 0, y: 16 }, ArrowLeft: { x: -16, y: 0 }, ArrowRight: { x: 16, y: 0 } };
        const offset = offsets[event.key];
        if (!offset) return;
        event.preventDefault();
        const bounds = event.currentTarget.getBoundingClientRect();
        saveLauncherPosition(clampLauncherPosition(event.currentTarget, { x: bounds.left + offset.x, y: bounds.top + offset.y }));
      }}
      onClick={event => {
        if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; }
        setSelection(undefined);
        setOpen(true);
      }}>
      <GitFork size={19} />
    </button>
    {open && <aside id="project-plan-panel" aria-label="Project plan"
      className={`fixed left-0 z-[2010] flex w-full flex-col bg-slate-50 ${panelWidth ? "inset-y-4" : "inset-y-0 shadow-lift"}`}
      style={panelWidth ? { width: panelWidth } : undefined}>
      <header className="border-b border-slate-200 bg-white px-3 sm:px-4">
        <div className="flex items-center gap-1 pt-1">
          <h2 className="mr-auto text-lg font-semibold">Project plan</h2>
          {pathname !== "/" && <Link to="/" className={iconButton} aria-label="Site home"><Home size={17} /></Link>}
          {panelWidth > 0 && <button className={iconButton} aria-label={wide ? "Narrow panel" : "Widen panel"} onClick={toggleWidth}>{wide ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>}
          <button ref={closeButton} className={iconButton} aria-label="Close project plan" onClick={() => {
            setOpen(false);
            requestAnimationFrame(() => launcher.current?.focus());
          }}><X size={19} /></button>
        </div>
        <nav aria-label="Project plan views" className="flex items-center gap-x-2 overflow-x-auto">
          <button className={viewControl} aria-pressed={!selectedId && tree === "site"} onClick={() => selectTree("site")}>Site</button>
          <button className={viewControl} aria-pressed={selectedId === "all-tasks"} onClick={() => select("all-tasks")}>Tasks</button>
          <button className={viewControl} aria-pressed={!selectedId && tree === "developments"} onClick={() => selectTree("developments")}>Pathways</button>
          <button className={viewControl} aria-pressed={features} onClick={() => select("feature-tracker")}>Features</button>
          {tool && <button className={`${viewControl} ml-auto`} aria-pressed={selectedId === tool.id} onClick={() => select(tool.id)}>This tool</button>}
        </nav>
      </header>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4" key={pathname}>
        {error && <div role="alert" className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          {error} <button className="ml-1 underline" onClick={reload}>Reload plan</button>
        </div>}
        {!plan && !error && <p role="status" className="text-sm text-slate-600">Loading project plan…</p>}
        {saving && <p role="status" className="mb-2 text-xs text-slate-600">Saving…</p>}
        {plan && <fieldset disabled={saving || loadFailed} className="min-w-0">
          {features && <nav aria-label="Feature views" className="mb-3 flex gap-2 border-b border-slate-200">
            {featureViews.map(view => <button key={view.id} type="button" className={viewControl}
              aria-pressed={selectedId === view.id} onClick={() => select(view.id)}>{view.label}</button>)}
          </nav>}
          {trackerOpened && <section hidden={selectedId !== "feature-tracker"} className="space-y-2">
            <h3 className="text-sm font-semibold">Feature tracker</h3>
            <ToolsSection compact store={matrixStore} phone={panelWidth === 0} onOpen={select} />
          </section>}
          {reviews ? <Reviews key="reviews" plan={plan} index={index} select={select} save={save} />
            : selected ? <NodeDetail key={selected.id} node={selected} index={index} plan={plan} save={save} select={select} back={() => select(returnView.current)} expandedIds={expandedIds} toggle={toggleBranch} close={() => setOpen(false)} showReview={() => select("review-queue")} />
            : selectedId === "feature-tracker" ? null
            : isPlanReference(selectedId) ? <>
              {(!features || (referenceFrom.current && index.byId.has(referenceFrom.current))) && <button className="min-h-11 text-sm text-teal-800 hover:underline" onClick={() => select(referenceFrom.current)}>Back</button>}
              <PlanReference key={selectedId} view={selectedId} />
            </>
            : selectedId === "all-tasks" ? <Tasks plan={plan} index={index} save={save} select={select} />
            : <ProjectMap key="map" plan={plan} index={index} select={select} save={save} expandedIds={expandedIds} toggle={toggleBranch} tree={tree} />}
        </fieldset>}
      </div>
    </aside>}
  </div>;
}
