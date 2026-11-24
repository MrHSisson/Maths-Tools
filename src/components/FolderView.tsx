import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, X } from 'lucide-react';
import { pathTo, setDeckFolders, useFolderDecks, useReload, useTree, type Tree } from '../decks/folders';
import type { Slide } from '../decks/types';
import { DeckCard, type GalleryDeck } from './DeckGallery';

/** The folder way to find a deck (signed in only), drawn from a tree of folders: a heading per top-level folder (a year), the folders in it as buttons,
 *  and, once one is opened, its decks as the usual preview cards, most recently made first from the left. Only the opened folder's decks (and their
 *  first slides) are read. `canEdit` adds the controls that choose which folders a deck is in (and the Edit pencil); it is off on a phone, which only previews. */
export default function FolderView({ tree, canEdit }: { tree: Tree; canEdit: boolean }) {
  const [params, setParams] = useSearchParams();
  const selected = params.get('folder');
  const [reload, bump] = useReload();
  const data = useTree(tree, reload);
  const pick = (id: string) => setParams((p) => { const n = new URLSearchParams(p); if (id !== selected) n.set('folder', id); else n.delete('folder'); return n; }, { replace: true });
  if (data === null) return <p className="mt-8 text-slate-500">Folders come from the website, so they can't be shown here.</p>;
  if (data === undefined) return <p className="mt-8 text-slate-500" role="status">Loading…</p>;
  const tops = data.folders.filter((f) => f.parent === null);
  const topOfSelected = selected ? pathTo(data.folders, selected)[0]?.id : undefined;
  return (
    <div className="mt-6 space-y-8">
      {tops.map((top) => {
        const inside = data.folders.filter((f) => f.parent === top.id);
        return (
          <section key={top.id}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{top.name}</h3>
            {inside.length === 0
              ? <p className="text-sm text-slate-400">Nothing here yet.</p>
              : <div className="flex flex-wrap gap-2">
                  {inside.map((f) => {
                    const n = data.counts[f.id];
                    const on = selected === f.id;
                    return (
                      <button key={f.id} onClick={() => pick(f.id)} aria-pressed={on}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-base font-semibold shadow-card ${on ? 'border-blue-900 bg-blue-900 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>
                        {f.name}{n !== undefined && <span className={`rounded-full px-2 text-xs ${on ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{n}</span>}
                      </button>
                    );
                  })}
                </div>}
            {selected && topOfSelected === top.id && selected !== top.id && (
              <FolderDecks tree={tree} folderId={selected} name={data.folders.find((f) => f.id === selected)?.name ?? ''} canEdit={canEdit} reload={reload} onChanged={bump} byDeck={data.byDeck} everyDeck={data.decks} />
            )}
          </section>
        );
      })}
    </div>
  );
}

const dateOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function FolderDecks({ tree, folderId, name, canEdit, reload, onChanged, byDeck, everyDeck }: {
  tree: Tree; folderId: string; name: string; canEdit: boolean; reload: number; onChanged: () => void; byDeck: Record<string, string[]>; everyDeck: { id: string; title: string }[];
}) {
  const decks = useFolderDecks(folderId, reload);
  const [error, setError] = useState<string | null>(null);
  const change = async (deckId: string, folderIds: string[]) => { setError(await setDeckFolders(deckId, tree, folderIds)); onChanged(); };
  const here = new Set((decks ?? []).map((d) => d.id));
  const addable = everyDeck.filter((d) => !here.has(d.id));
  const icon = 'grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800';
  const cards: GalleryDeck[] = (decks ?? []).map((d) => ({
    id: d.id, title: d.title, summary: d.summary, slides: d.slides, preview: d.preview as Slide | undefined,
    badge: d.published ? undefined : 'Not published', notes: [`made ${dateOf(d.madeAt)}`, d.published ? 'published' : 'not published'],
    action: canEdit ? (
      <>
        <Link to={`/decks/${d.id}?edit=1`} aria-label={`Edit ${d.title}`} title="Edit this deck" className={icon}><Pencil size={16} /></Link>
        <button onClick={() => void change(d.id, (byDeck[d.id] ?? []).filter((f) => f !== folderId))} aria-label={`Take ${d.title} out of ${name}`} title={`Take out of ${name}`} className={`${icon} hover:bg-red-50 hover:text-red-600`}><X size={16} /></button>
      </>
    ) : undefined,
  }));
  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h4 className="text-lg font-semibold text-slate-900">{name}</h4>
        <span className="text-sm text-slate-500">Most recently made first</span>
        {canEdit && addable.length > 0 && (
          <select value="" aria-label={`Add a deck to ${name}`} onChange={(e) => { const id = e.target.value; if (id) void change(id, [...(byDeck[id] ?? []), folderId]); }}
            className="ml-auto max-w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700">
            <option value="">Add a deck…</option>
            {addable.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        )}
      </div>
      {error && <p className="mb-2 text-sm text-red-600" role="alert">{error}</p>}
      {decks === undefined && <p className="text-slate-500" role="status">Loading…</p>}
      {decks === null && <p className="text-slate-500">This folder's decks can't be listed here.</p>}
      {decks && decks.length === 0 && <p className="text-slate-500">{canEdit ? 'No decks yet: use Add a deck.' : 'No decks in this folder yet.'}</p>}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((d) => <DeckCard key={d.id} d={d} where={name} />)}
        </div>
      )}
    </div>
  );
}
