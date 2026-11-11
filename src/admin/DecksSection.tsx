import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { allDecks } from "../decks/store";
import { useSyncedDecks } from "../decks/useSyncedDecks";
import { usePublishedIndex } from "../decks/published";
import { DECK_STRANDS, FAMILY_STYLE, type DeckDef, type DeckFamily } from "../decks/types";
import { TOOLS } from "./facts";
import { Drawer, PageHead, Status, panel } from "./ui";

const FAMILIES = Object.keys(FAMILY_STYLE) as DeckFamily[];
const dateOf = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

interface Row { deck: DeckDef; mine: boolean; edited: boolean; publishedAt?: string }

const familyCounts = (d: DeckDef) => FAMILIES.map(f => ({ f, n: d.slides.filter(s => s.family === f).length })).filter(x => x.n > 0);

/** Every deck at a glance: strand, slides by kind, the tool it belongs to and whether it is published. Read from the decks themselves, never typed. */
export function DecksSection() {
  const published = usePublishedIndex();
  const synced = useSyncedDecks();
  const [query, setQuery] = useState("");
  const [strand, setStrand] = useState("all");
  const [state, setState] = useState<"all" | "published" | "not">("all");
  const [open, setOpen] = useState<string | null>(null);

  const rows: Row[] = useMemo(() => allDecks().map(x => ({ ...x, publishedAt: published?.[x.deck.id]?.publishedAt })), [published, synced]); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: synced changes when the shared decks have been read into this device
  const shown = rows.filter(r => {
    if (strand !== "all" && (r.deck.strand ?? "") !== strand) return false;
    if (state === "published" && !r.publishedAt) return false;
    if (state === "not" && r.publishedAt) return false;
    const q = query.trim().toLowerCase();
    return !q || [r.deck.title, r.deck.id, r.deck.summary].some(s => s.toLowerCase().includes(q));
  });
  const sel = rows.find(r => r.deck.id === open);
  const toolName = (id?: string) => (id ? TOOLS.find(t => t.id === id)?.name ?? id : undefined);
  const nPub = rows.filter(r => r.publishedAt).length;
  const field = "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";

  return (
    <div>
      <PageHead title="Decks" sub={published === undefined ? "Loading…" : published === null ? `${rows.length} decks · published list unavailable here` : `${rows.length} decks · ${nPub} published · ${rows.length - nPub} not`} />
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <label className="flex basis-full items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 sm:flex-1 sm:basis-auto sm:min-w-[220px]">
          <Search size={16} className="text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search decks" className="w-full bg-transparent text-sm outline-none" />
        </label>
        <select value={strand} onChange={e => setStrand(e.target.value)} aria-label="Strand" className={field}>
          <option value="all">All strands</option>
          {DECK_STRANDS.map(s => <option key={s} value={s}>{s}</option>)}
          <option value="">No strand</option>
        </select>
        <select value={state} onChange={e => setState(e.target.value as typeof state)} aria-label="Published" className={field}>
          <option value="all">Published or not</option><option value="published">Published</option><option value="not">Not published</option>
        </select>
      </div>

      {shown.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No decks match.</p> : (
        <ul className={`${panel} divide-y divide-slate-200`}>
          {shown.map(r => (
            <li key={r.deck.id}>
              <button onClick={() => setOpen(r.deck.id)} className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">{r.deck.title}</div>
                  <div className="text-xs text-slate-500">{[r.deck.strand ?? "No strand", toolName(r.deck.tool), `${r.deck.slides.length} slides`, r.mine ? "your deck" : undefined].filter(Boolean).join(" · ")}</div>
                </div>
                <Status colour={r.publishedAt ? "bg-emerald-500" : "bg-amber-500"} label={r.publishedAt ? `Published ${dateOf(r.publishedAt)}` : "Not published"} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {sel && (
        <Drawer title={sel.deck.title} onClose={() => setOpen(null)}
          sub={<><Status colour={sel.publishedAt ? "bg-emerald-500" : "bg-amber-500"} label={sel.publishedAt ? `Published ${dateOf(sel.publishedAt)}` : "Not published"} /><span>{sel.deck.strand ?? "No strand"}</span></>}
          footer={<div className="flex gap-2">
            <Link to={`/decks/${sel.deck.id}`} className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white">Play</Link>
            <Link to={`/decks/${sel.deck.id}?edit=1`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit</Link>
          </div>}>
          <div className="space-y-4 text-sm text-slate-700">
            {sel.deck.summary && <p>{sel.deck.summary}</p>}
            <dl className="grid grid-cols-[7rem_1fr] gap-y-1.5">
              <dt className="text-slate-500">Id</dt><dd><code>{sel.deck.id}</code></dd>
              <dt className="text-slate-500">Tool</dt><dd>{toolName(sel.deck.tool) ?? "None"}</dd>
              <dt className="text-slate-500">Slides</dt><dd>{sel.deck.slides.length}</dd>
              <dt className="text-slate-500">Last saved</dt><dd>{sel.deck.updatedAt ? dateOf(sel.deck.updatedAt) : "Built in"}{sel.edited ? " (edited on this device)" : ""}</dd>
            </dl>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Slides by kind</div>
              <ul className="space-y-1">
                {familyCounts(sel.deck).map(({ f, n }) => (
                  <li key={f} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: FAMILY_STYLE[f].colour }} />{FAMILY_STYLE[f].label} <span className="text-slate-400">· {n}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
