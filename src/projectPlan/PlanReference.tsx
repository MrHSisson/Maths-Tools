import { useState } from "react";
import { Blocks, type Section } from "../admin/DevelopmentsPage";
import docs from "../generated/adminDocs.json";

type ReferenceTask = { title: string; status: string; blocks: Section["blocks"] };
type ReferencePathway = { id: string; title: string; sections: Section[] };

const deckTitle = /\bdecks?\b/i;
const summary = "min-h-11 cursor-pointer py-3 text-sm font-medium";

const featureSections = (docs.features as Section[]).filter(section => section.level === 3 && !deckTitle.test(section.title));
const guideSections = (docs.guide as Section[]).filter(section => !deckTitle.test(section.title) && section.blocks.length);
const earlierTasks = (docs.tasks as ReferenceTask[]).filter(task => task.status !== "Done (recent)"
  && !deckTitle.test(task.title) && !/review|prime factorisation lesson/i.test(task.title));
const earlierPathways = (docs.pathways as ReferencePathway[]).filter(pathway => !deckTitle.test(pathway.title));

type ReferenceView = "feature-guide" | "build-guide" | "earlier-tasks" | "earlier-pathways";
export type PlanReferenceView = ReferenceView | `pathway:${string}`;

function PathwayNotes({ sections }: { sections: Section[] }) {
  return <div className="divide-y divide-slate-200">
    {sections.filter(section => section.blocks.length).map(section => (
      <details key={section.title}>
        <summary className={summary}>{section.title}</summary>
        <div className="pb-3"><Blocks blocks={section.blocks} /></div>
      </details>
    ))}
  </div>;
}

export function PlanReference({ view }: { view: PlanReferenceView }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  if (view.startsWith("pathway:")) {
    const pathway = earlierPathways.find(item => `pathway:${item.id}` === view);
    if (!pathway) return null;
    return <section className="space-y-2">
      <h3 className="text-sm font-semibold">{pathway.title}</h3>
      <PathwayNotes sections={pathway.sections} />
    </section>;
  }

  const title = view === "feature-guide" ? "Feature guide"
    : view === "build-guide" ? "How tools are built"
    : view === "earlier-tasks" ? "Earlier tasks" : "Earlier pathways";
  const matches = (name: string) => name.toLowerCase().includes(needle);

  return <section className="min-w-0 space-y-2">
    <h3 className="text-sm font-semibold">{title}</h3>
    <input type="search" aria-label={`Search ${title.toLowerCase()}`} placeholder="Search"
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      value={query} onChange={event => setQuery(event.target.value)} />
    <div className="divide-y divide-slate-200 break-words">
      {view === "earlier-pathways" ? earlierPathways.filter(item => matches(item.title)).map(item => (
        <details key={item.id}>
          <summary className={summary}>{item.title}</summary>
          <div className="pb-2 pl-3"><PathwayNotes sections={item.sections} /></div>
        </details>
      )) : (view === "feature-guide" ? featureSections : view === "build-guide" ? guideSections : earlierTasks)
        .filter(item => matches(item.title)).map(item => (
          <details key={item.title}>
            <summary className={summary}>{item.title}</summary>
            <div className="pb-3"><Blocks blocks={item.blocks} /></div>
          </details>
        ))}
    </div>
  </section>;
}

export function isPlanReference(view: string | null | undefined): view is PlanReferenceView {
  return view === "feature-guide" || view === "build-guide" || view === "earlier-tasks"
    || view === "earlier-pathways" || !!view?.startsWith("pathway:");
}
