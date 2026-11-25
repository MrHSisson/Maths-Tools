import { useMemo, useState, type DragEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Folder as FolderIcon, FolderPlus, LayoutGrid, List, Pencil, Search, Trash2, X } from 'lucide-react';
import { FIRST_DIR, UNFILED, pathTo, sendFolderOp, setDeckFolders, sortDecks, useFolderDecks, useReload, useSearch, useTree, type Folder, type FolderDeck, type FolderOp, type SortDir, type SortKey, type Tree } from '../decks/folders';
import type { Pitch, Slide } from '../decks/types';
import { DeckCard, type GalleryDeck } from './DeckGallery';
import DeckList from './DeckList';

const dateOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const ROOT_NAME: Record<Tree, string> = { class: 'Classes', topic: 'Topics' };
type Drag = { kind: 'deck' | 'folder'; id: string } | null;
const iconBtn = 'grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30';

type Layout = 'list' | 'cards';
const LAYOUT_KEY = 'mt-folder-layout';
/** A plain list (title, band, dates) unless the preview cards were chosen, remembered on this device. */
function useLayout(): [Layout, (l: Layout) => void] {
  const [layout, set] = useState<Layout>(() => { try { return localStorage.getItem(LAYOUT_KEY) === 'cards' ? 'cards' : 'list'; } catch { return 'list'; } });
  return [layout, (l) => { set(l); try { localStorage.setItem(LAYOUT_KEY, l); } catch { /* the choice just is not remembered */ } }];
}

/** Decks as a file explorer: a breadcrumb trail, the opened folder's subfolders, and its decks, either as a plain list (name, band, dates, sortable by column; the
 *  default) or as preview cards, most recently made first from the left. A search box looks through every folder. Folders go inside folders, and decks in no folder are under **Not filed**. Only the opened folder's decks (and their first slides) are read. With
 *  `canEdit` (signed in, not on a phone, which only previews) folders can be made, renamed, moved, reordered and deleted, and a card or a folder can be dragged onto
 *  a folder or a breadcrumb. `publicMode` is what anyone sees: the topic tree's published decks only, read-only. */
export default function FolderView({ tree, canEdit: editable, publicMode = false }: { tree: Tree; canEdit: boolean; publicMode?: boolean }) {
  const canEdit = editable && !publicMode;
  const [params, setParams] = useSearchParams();
  const [reload, bump] = useReload();
  const data = useTree(tree, reload, publicMode);
  const [drag, setDrag] = useState<Drag>(null);
  const [over, setOver] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const wanted = params.get('folder');
  const folders = data?.folders ?? [];
  const here = wanted === UNFILED ? UNFILED : wanted && folders.some((f) => f.id === wanted) ? wanted : null;       // an unknown or deleted folder shows the top level
  const realHere = here && here !== UNFILED ? here : null;
  const go = (id: string | null) => setParams((p) => { const n = new URLSearchParams(p); if (id) n.set('folder', id); else n.delete('folder'); return n; }, { replace: true });
  const [query, setQuery] = useState('');
  const q = query.replace(/\s+/g, ' ').trim().slice(0, 80);
  const [layout, setLayout] = useLayout();
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'made', dir: 'desc' });
  const asCards = layout === 'cards';
  const decks = useFolderDecks(here, tree, reload, publicMode, asCards);       // the list needs no pictures, so none are read for it
  const sorted = useMemo(() => (decks ? sortDecks(decks, sort.key, sort.dir) : decks), [decks, sort]);
  const results = useSearch(q, publicMode, asCards);
  const sortedResults = useMemo(() => (results ? sortDecks(results, sort.key, sort.dir) : results), [results, sort]);
  if (data === null) return <p className="mt-8 text-slate-500">Folders come from the website, so they can't be shown here.</p>;
  if (data === undefined) return <p className="mt-8 text-slate-500" role="status">Loading…</p>;

  const byId = new Map(folders.map((f) => [f.id, f]));
  const crumbs = here === UNFILED ? [{ id: UNFILED, name: 'Not filed' }] : here ? pathTo(folders, here) : [];
  const tiles = here === UNFILED ? [] : folders.filter((f) => f.parent === here).sort((a, b) => a.position - b.position);
  const inSubtree = (id: string, root: string): boolean => { for (let f = byId.get(id), n = 0; f && n < 20; f = f.parent ? byId.get(f.parent) : undefined, n++) if (f.id === root) return true; return false; };
  const label = (f: Folder) => pathTo(folders, f.id).map((x) => x.name).join(' › ');
  const act = async (op: FolderOp) => { const e = await sendFolderOp(op); setError(e); bump(); return e; };
  const moveDeck = async (deckId: string, target: string) => {
    if (here === target) return;
    const next = [...new Set([...(data.byDeck[deckId] ?? []).filter((f) => f !== here), target])];
    setError(await setDeckFolders(deckId, tree, next)); bump();
  };
  const drop = (target: string | null) => (e: DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setOver(null);
    const d = drag; setDrag(null);
    if (!d || !canEdit) return;
    if (d.kind === 'folder') { if (target !== UNFILED && d.id !== target && byId.get(d.id)?.parent !== target) void act({ op: 'move', id: d.id, parent: target }); }
    else if (target === UNFILED) { if (realHere) void unfileDeck(d.id); }
    else if (target) void moveDeck(d.id, target);
  };
  const unfileDeck = async (deckId: string) => { setError(await setDeckFolders(deckId, tree, (data.byDeck[deckId] ?? []).filter((f) => f !== realHere))); bump(); };
  const target = (id: string | null) => canEdit && drag ? {
    onDragOver: (e: DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },
    onDragEnter: () => setOver(id ?? '__root'), onDragLeave: () => setOver((o) => (o === (id ?? '__root') ? null : o)), onDrop: drop(id),
  } : {};
  const lit = (id: string | null) => (over === (id ?? '__root') && drag ? 'bg-blue-50 ring-2 ring-blue-400' : '');

  const onSort = (key: SortKey) => setSort((x) => (x.key === key ? { key, dir: x.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: FIRST_DIR[key] }));
  const subtreeDecks = (id: string) => new Set(Object.entries(data.byDeck).filter(([, fs]) => fs.some((f) => inSubtree(f, id))).map(([d]) => d)).size;
  /** Where a deck is in this tree, for a search result ("A-Level › Further Maths", "+1 more" when it is in several, or "Not filed"). */
  const pathText = (deckId: string) => {
    const ids = data.byDeck[deckId] ?? [];
    const first = ids.length ? byId.get(ids[0]) : undefined;
    return first ? `${label(first)}${ids.length > 1 ? ` +${ids.length - 1} more` : ''}` : 'Not filed';
  };
  /** A deck as a card or row. In a folder it can be taken out of that folder; in search results it only has Edit. */
  const toCard = (d: FolderDeck, inFolder: boolean): GalleryDeck => ({
    id: d.id, title: d.title, summary: d.summary, pitch: d.pitch as Pitch | undefined, slides: d.slides, preview: d.preview as Slide | undefined, ...(inFolder ? {} : { sub: pathText(d.id) }),
    badge: d.published ? undefined : 'Not published', notes: [`made ${dateOf(d.madeAt)}`, `edited ${dateOf(d.editedAt)}`, d.published ? 'published' : 'not published'],
    action: canEdit ? (
      <>
        <Link to={`/decks/${d.id}?edit=1`} aria-label={`Edit ${d.title}`} title="Edit this deck" className={iconBtn}><Pencil size={16} /></Link>
        {inFolder && realHere && <button onClick={() => void unfileDeck(d.id)} aria-label={`Take ${d.title} out of ${byId.get(realHere)?.name}`} title="Take out of this folder" className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}><X size={16} /></button>}
      </>
    ) : undefined,
  });
  const cards = (asCards ? sorted ?? [] : []).map((d) => toCard(d, true));
  const dragProps = { onDragStart: (id: string) => setDrag({ kind: 'deck', id }), onDragEnd: () => { setDrag(null); setOver(null); } };
  const cardGrid = (list: GalleryDeck[], where?: string) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{list.map((d) => <DeckCard key={d.id} d={d} admin={canEdit} where={where} {...dragProps} />)}</div>
  );
  const folderMatches = q ? folders.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 12) : [];
  const hereIds = new Set((decks ?? []).map((d) => d.id));
  const addable = data.decks.filter((d) => !hereIds.has(d.id));

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex min-w-[12rem] flex-1 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 sm:max-w-md">
        <Search size={16} className="shrink-0 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }} maxLength={80} placeholder="Search every deck" aria-label="Search decks" className="w-full bg-transparent text-sm outline-none" />
        {query && <button onClick={() => setQuery('')} aria-label="Clear the search" className="text-slate-400 hover:text-slate-700"><X size={14} /></button>}
      </label>
      <span role="group" aria-label="Show decks as" className="inline-flex overflow-hidden rounded-xl border border-slate-300 bg-white shadow-card">
        {([['list', 'List', List], ['cards', 'Previews', LayoutGrid]] as const).map(([l, name, Icon]) => (
          <button key={l} onClick={() => setLayout(l)} aria-pressed={layout === l} title={`${name} view`} aria-label={`${name} view`}
            className={`grid h-9 w-10 place-items-center ${layout === l ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}><Icon size={16} /></button>
        ))}
      </span>
    </div>
  );
  if (q) {
    return (
      <div className="mt-6">
        {controls}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <h4 className="text-lg font-semibold text-slate-900">Results for “{q}”</h4>
          <button onClick={() => setQuery('')} className="text-sm font-semibold text-blue-900 hover:underline">Back to the folders</button>
        </div>
        {folderMatches.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Matching folders">
            {folderMatches.map((f) => <button key={f.id} onClick={() => { setQuery(''); go(f.id); }} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-card hover:bg-slate-50"><FolderIcon size={15} className="text-blue-900" />{label(f)}</button>)}
          </div>
        )}
        {results === undefined && <p className="mt-4 text-slate-500" role="status">Searching…</p>}
        {results === null && <p className="mt-4 text-slate-500">Search comes from the website, so it can't be used here.</p>}
        {results && results.length === 0 && folderMatches.length === 0 && <p className="mt-4 text-slate-500">No decks match.</p>}
        {results && results.length > 0 && (asCards
          ? <div className="mt-4">{cardGrid(results.map((d) => toCard(d, false)))}</div>
          : <DeckList decks={sortedResults ?? []} canEdit={canEdit} sortKey={sort.key} sortDir={sort.dir} onSort={onSort} pathOf={pathText} {...dragProps} />)}
      </div>
    );
  }

  return (
    <div className="mt-6">
      {controls}
      <nav aria-label="Folder path" className="mt-4 flex flex-wrap items-center gap-1 text-sm">
        <Crumb onClick={() => go(null)} current={!here} extra={{ ...target(null), className: lit(null) }}>{ROOT_NAME[tree]}</Crumb>
        {crumbs.map((c, i) => (
          <span key={c.id} className="flex items-center gap-1"><ChevronRight size={14} className="text-slate-400" />
            <Crumb onClick={() => go(c.id)} current={i === crumbs.length - 1} extra={{ ...target(c.id), className: lit(c.id) }}>{c.name}</Crumb></span>
        ))}
        {canEdit && here !== UNFILED && (
          <span className="ml-auto flex flex-wrap items-center gap-2">
            {realHere && addable.length > 0 && (
              <select value="" aria-label={`Add a deck to ${byId.get(realHere)?.name}`} onChange={(e) => { const id = e.target.value; if (id) void (async () => { setError(await setDeckFolders(id, tree, [...(data.byDeck[id] ?? []), realHere])); bump(); })(); }}
                className="max-w-[14rem] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700">
                <option value="">Add a deck…</option>
                {addable.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            )}
            <button onClick={() => setAdding((a) => !a)} aria-expanded={adding} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-card hover:bg-slate-50"><FolderPlus size={15} />New folder</button>
          </span>
        )}
      </nav>
      {canEdit && adding && here !== UNFILED && (
        <form className="mt-3 flex items-center gap-2" onSubmit={async (e) => { e.preventDefault(); const name = ((new FormData(e.currentTarget).get('name') as string) ?? '').trim(); if (name && !(await act({ op: 'add', tree, name, parent: realHere }))) setAdding(false); }}>
          <input name="name" autoFocus maxLength={60} placeholder={realHere ? `A folder inside ${byId.get(realHere)?.name}` : 'A new top-level folder'} aria-label="New folder name" className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm" />
          <button className="rounded-lg bg-blue-900 px-3 py-1.5 text-sm font-semibold text-white">Add</button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}

      {(tiles.length > 0 || (!here && (data.unfiled > 0 || canEdit))) && (
        <div className={asCards ? 'mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4' : 'mt-5 flex flex-col gap-2'}>
          {tiles.map((f, i) => (
            <Tile key={f.id} f={f} row={!asCards} canEdit={canEdit} first={i === 0} last={i === tiles.length - 1} decks={subtreeDecks(f.id)} folders={folders.filter((x) => x.parent === f.id).length}
              moveTargets={folders.filter((x) => !inSubtree(x.id, f.id) && x.id !== f.parent)}
              label={label} lit={lit(f.id)} dropProps={target(f.id)} onOpen={() => go(f.id)} onAct={act}
              onDragStart={() => setDrag({ kind: 'folder', id: f.id })} onDragEnd={() => { setDrag(null); setOver(null); }}
              onDelete={() => { if (window.confirm(`Delete the folder "${f.name}"? Its folders move up one level and its decks go to ${f.parent ? `"${byId.get(f.parent)?.name}"` : 'no folder'}. No deck is deleted.`)) void act({ op: 'delete', id: f.id }); }} />
          ))}
          {!here && (data.unfiled > 0 || canEdit) && (
            <div {...target(UNFILED)} data-folder={UNFILED} className={`border border-dashed border-slate-300 bg-white transition-colors ${asCards ? 'rounded-2xl p-3' : 'rounded-xl px-3 py-2'} ${lit(UNFILED)}`}>
              <button onClick={() => go(UNFILED)} className="flex w-full items-center gap-2 text-left" aria-label="Open Not filed">
                <FolderIcon size={22} className="shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1"><span className="block truncate text-base font-semibold text-slate-700">Not filed</span><span className="block text-xs text-slate-500">{data.unfiled} deck{data.unfiled === 1 ? '' : 's'}</span></span>
              </button>
            </div>
          )}
        </div>
      )}
      {here && tiles.length === 0 && decks && decks.length === 0 && <p className="mt-5 text-slate-500">{canEdit ? 'Empty: drag a deck here, use Add a deck, or make a folder.' : 'Nothing in this folder yet.'}</p>}
      {!here && tiles.length === 0 && data.unfiled === 0 && <p className="mt-5 text-slate-500">{canEdit ? 'No folders yet: make one with New folder.' : 'Nothing is published yet.'}</p>}

      {here && decks === undefined && <p className="mt-5 text-slate-500" role="status">Loading…</p>}
      {here && decks === null && <p className="mt-5 text-slate-500">This folder's decks can't be listed here.</p>}
      {here && !asCards && sorted && sorted.length > 0 && (
        <DeckList decks={sorted} canEdit={canEdit} sortKey={sort.key} sortDir={sort.dir} onSort={onSort} onRemove={realHere ? (id) => void unfileDeck(id) : undefined} folderName={here === UNFILED ? 'Not filed' : byId.get(here)?.name} {...dragProps} />
      )}
      {here && cards.length > 0 && (
        <>
          <h4 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Decks <span className="font-normal normal-case text-slate-400">most recently made first</span></h4>
          {cardGrid(cards, here === UNFILED ? 'Not filed' : byId.get(here)?.name)}
        </>
      )}
    </div>
  );
}

function Crumb({ children, current, onClick, extra }: { children: ReactNode; current: boolean; onClick: () => void; extra: Record<string, unknown> & { className?: string } }) {
  const { className, ...rest } = extra;
  return <button onClick={onClick} aria-current={current ? 'page' : undefined} {...rest} className={`rounded-lg px-2 py-1 font-semibold ${current ? 'text-slate-900' : 'text-blue-900 hover:bg-slate-100'} ${className ?? ''}`}>{children}</button>;
}

/** A folder as a tile: opens on a click; with edit controls it renames, moves, reorders, deletes, and takes a dragged card or folder. */
function Tile({ f, row, canEdit, first, last, decks, folders, moveTargets, label, lit, dropProps, onOpen, onAct, onDragStart, onDragEnd, onDelete }: {
  f: Folder; row?: boolean; canEdit: boolean; first: boolean; last: boolean; decks: number; folders: number; moveTargets: Folder[]; label: (f: Folder) => string; lit: string;
  dropProps: Record<string, unknown>; onOpen: () => void; onAct: (op: FolderOp) => Promise<string | null>; onDragStart: () => void; onDragEnd: () => void; onDelete: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const commit = (v: string) => { setRenaming(false); if (v.trim() && v.trim() !== f.name) void onAct({ op: 'rename', id: f.id, name: v }); };
  return (
    <div {...dropProps} draggable={canEdit} onDragStart={canEdit ? (e) => { e.dataTransfer.setData('text/plain', `folder:${f.id}`); e.dataTransfer.effectAllowed = 'move'; onDragStart(); } : undefined} onDragEnd={canEdit ? onDragEnd : undefined}
      data-folder={f.id} className={`border border-slate-300 bg-white shadow-card transition-colors ${row ? 'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3 py-2' : 'rounded-2xl p-3'} ${lit}`}>
      <div className={`flex items-center gap-2 ${row ? 'min-w-[12rem] flex-1' : ''}`}>
        <FolderIcon size={22} className="shrink-0 text-blue-900" />
        {renaming
          ? <input autoFocus defaultValue={f.name} maxLength={60} aria-label="Folder name" onBlur={(e) => commit(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); if (e.key === 'Escape') setRenaming(false); }} className="min-w-0 flex-1 rounded-lg border border-blue-400 px-2 py-1 text-base font-semibold outline-none" />
          : <button onClick={onOpen} className="min-w-0 flex-1 text-left" aria-label={`Open ${f.name}`}>
              <span className="block truncate text-base font-semibold text-slate-900">{f.name}</span>
              <span className="block text-xs text-slate-500">{[`${decks} deck${decks === 1 ? '' : 's'}`, folders ? `${folders} folder${folders === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ')}</span>
            </button>}
      </div>
      {canEdit && (
        <div className={`flex flex-wrap items-center gap-0.5 ${row ? '' : 'mt-2 border-t border-slate-200 pt-2'}`}>
          <button className={iconBtn} disabled={first} onClick={() => void onAct({ op: 'reorder', id: f.id, direction: 'up' })} aria-label={`Move ${f.name} earlier`} title="Move earlier"><ChevronLeft size={15} /></button>
          <button className={iconBtn} disabled={last} onClick={() => void onAct({ op: 'reorder', id: f.id, direction: 'down' })} aria-label={`Move ${f.name} later`} title="Move later"><ChevronRight size={15} /></button>
          <button className={iconBtn} onClick={() => setRenaming(true)} aria-label={`Rename ${f.name}`} title="Rename"><Pencil size={14} /></button>
          <select value="" aria-label={`Move ${f.name} into another folder`} title="Move into…" onChange={(e) => { const v = e.target.value; if (v) void onAct({ op: 'move', id: f.id, parent: v === '__top' ? null : v }); }}
            className="min-w-0 max-w-[7.5rem] flex-1 rounded-lg border border-slate-300 bg-white px-1 py-1 text-xs text-slate-600">
            <option value="">Move into…</option>
            {f.parent !== null && <option value="__top">Top level</option>}
            {moveTargets.map((t) => <option key={t.id} value={t.id}>{label(t)}</option>)}
          </select>
          <button className={`${iconBtn} hover:bg-red-50 hover:text-red-600`} onClick={onDelete} aria-label={`Delete ${f.name}`} title="Delete the folder"><Trash2 size={14} /></button>
        </div>
      )}
    </div>
  );
}
