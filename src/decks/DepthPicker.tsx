import { DepthClaims } from "./DepthArtwork";
import { useEffect, useState } from "react";
import facts from "../generated/toolFacts.json";
import { loadDepthItems } from "./generators";
import { fromDepth } from "./questions";
import { QuestionText } from "./QuestionPresentation";
import type { CuratedQuestion } from "./types";

const input = "min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";
const tools = facts.tools.filter((t) => t.depth && t.shell === "ToolShell");
/** A dedicated Depth-only selector. Ordinary skill authoring never loads the shared library. */
export function DepthPicker({ tool, onPreview, onChoose }: { tool: string; onPreview: (q: CuratedQuestion) => void; onChoose: (q: CuratedQuestion) => void }) {
  const [filter, setFilter] = useState(tool);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [cards, setCards] = useState<CuratedQuestion[]>([]);
  const [state, setState] = useState("Loading Depth cards…");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; setCards([]); setState("Loading Depth cards…");
    void Promise.all(tools.filter((t) => !filter || t.id === filter).map(async (t) => (await loadDepthItems(t.id)).map((i) => fromDepth(t.id, i)))).then((groups) => { if (active) { setCards(groups.flat()); setState(""); } }).catch(() => { if (active) setState("Depth cards could not be loaded. Retry or choose another tool."); });
    return () => { active = false; };
  }, [filter, retry]);
  const shown = cards.filter((q) => (!level || q.level === level) && `${q.title} ${q.question.join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  return <section aria-label="Depth card picker" className="space-y-3"><h3 className="text-lg font-semibold">Choose a Depth card</h3>
    <input className={`${input} w-full`} aria-label="Search Depth cards" placeholder="Search Depth cards…" value={search} onChange={(e) => setSearch(e.target.value)} />
    <div className="flex flex-wrap gap-2"><select aria-label="Depth tool" className={`${input} min-w-0 flex-1`} value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">All tools</option>{!tools.some((t) => t.id === tool) && <option value={tool}>{tool}</option>}{tools.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select><select aria-label="Depth level" className={input} value={level} onChange={(e) => setLevel(e.target.value)}><option value="">All levels</option>{["level1", "level2", "level3"].map((v) => <option key={v} value={v}>Level {v.slice(-1)}</option>)}</select></div>
    {state ? <p role="status">{state}{state.includes("Retry") && <button className={input} onClick={() => setRetry((n) => n + 1)}>Retry</button>}</p> : <p className="text-sm text-slate-500">{shown.length} Depth cards</p>}
    {!state && !shown.length && <p>No Depth cards match. Choose another tool or clear the filters.</p>}
    {shown.map((q) => <article key={`${q.tool}:${q.id}`} className="space-y-3 rounded-2xl border border-slate-300 bg-white p-4 shadow-card"><h4 className="font-semibold">{q.title}</h4><div className="space-y-3 text-sm">{q.format === "claims" && <DepthClaims claims={q.claims} />}<QuestionText lines={q.question} /></div><div className="flex flex-wrap gap-2"><button className={input} onClick={() => onPreview(q)}>Preview card</button><button className={input} onClick={() => onChoose(q)}>Use this card</button></div></article>)}
  </section>;
}
