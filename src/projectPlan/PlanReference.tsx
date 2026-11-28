import { useState } from "react";
import { Blocks, type Section } from "../admin/DevelopmentsPage";
import docs from "../generated/adminDocs.json";

const deckTitle = /\bdecks?\b/i;
const summary = "min-h-11 cursor-pointer py-3 text-sm font-medium";

const featureSections = (docs.features as Section[]).filter(section => section.level === 3 && !deckTitle.test(section.title));
const guideSections = (docs.guide as Section[]).filter(section => !deckTitle.test(section.title) && section.blocks.length);
type PlanReferenceView = "feature-guide" | "build-guide";

export function PlanReference({ view }: { view: PlanReferenceView }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const title = view === "feature-guide" ? "Feature guide" : "How tools are built";
  const matches = (name: string) => name.toLowerCase().includes(needle);

  return <section className="min-w-0 space-y-2">
    <h3 className="text-sm font-semibold">{title}</h3>
    <input type="search" aria-label={`Search ${title.toLowerCase()}`} placeholder="Search"
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      value={query} onChange={event => setQuery(event.target.value)} />
    <div className="divide-y divide-slate-200 break-words">
      {(view === "feature-guide" ? featureSections : guideSections)
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
  return view === "feature-guide" || view === "build-guide";
}
