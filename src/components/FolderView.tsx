import { useState, type DragEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Folder as FolderIcon, FolderPlus, Pencil, Trash2, X } from 'lucide-react';
import { UNFILED, pathTo, sendFolderOp, setDeckFolders, useFolderDecks, useReload, useTree, type Folder, type FolderOp, type Tree } from '../decks/folders';
import type { Slide } from '../decks/types';
import { DeckCard, type GalleryDeck } from './DeckGallery';

const dateOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const ROOT_NAME: Record<Tree, string> = { class: 'Classes', topic: 'Topics' };
type Drag = { kind: 'deck' | 'folder'; id: string } | null;
const iconBtn = 'grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30';

/** Decks as a file explorer: a breadcrumb trail, the opened folder's subfolders as tiles, and its decks as the usual preview cards, most recently made first from
 *  the left. Folders go inside folders, and decks in no folder are under **Not filed**. Only the opened folder's decks (and their first slides) are read. With
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
  const decks = useFolderDecks(here, tree, reload, publicMode);
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

  const subtreeDecks = (id: string) => new Set(Object.entries(data.byDeck).filter(([, fs]) => fs.some((f) => inSubtree(f, id))).map(([d]) => d)).size;
  const cards: GalleryDeck[] = (decks ?? []).map((d) => ({
    id: d.id, title: d.title, summary: d.summary, slides: d.slides, preview: d.preview as Slide | undefined,
    badge: d.published ? undefined : 'Not published', notes: [`made ${dateOf(d.madeAt)}`, d.published ? 'published' : 'not published'],
    action: canEdit && here ? (
      <>
        <Link to={`/decks/${d.id}?edit=1`} aria-label={`Edit ${d.title}`} title="Edit this deck" className={iconBtn}><Pencil size={16} /></Link>
        {realHere && <button onClick={() => void unfileDeck(d.id)} aria-label={`Take ${d.title} out of ${byId.get(realHere)?.name}`} title="Take out of this folder" className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}><X size={16} /></button>}
      </>
    ) : undefined,
  }));
  const hereIds = new Set((decks ?? []).map((d) => d.id));
  const addable = data.decks.filter((d) => !hereIds.has(d.id));

  return (
    <div className="mt-6">
      <nav aria-label="Folder path" className="flex flex-wrap items-center gap-1 text-sm">
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
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((f, i) => (
            <Tile key={f.id} f={f} canEdit={canEdit} first={i === 0} last={i === tiles.length - 1} decks={subtreeDecks(f.id)} folders={folders.filter((x) => x.parent === f.id).length}
              moveTargets={folders.filter((x) => !inSubtree(x.id, f.id) && x.id !== f.parent)}
              label={label} lit={lit(f.id)} dropProps={target(f.id)} onOpen={() => go(f.id)} onAct={act}
              onDragStart={() => setDrag({ kind: 'folder', id: f.id })} onDragEnd={() => { setDrag(null); setOver(null); }}
              onDelete={() => { if (window.confirm(`Delete the folder "${f.name}"? Its folders move up one level and its decks go to ${f.parent ? `"${byId.get(f.parent)?.name}"` : 'no folder'}. No deck is deleted.`)) void act({ op: 'delete', id: f.id }); }} />
          ))}
          {!here && (data.unfiled > 0 || canEdit) && (
            <div {...target(UNFILED)} data-folder={UNFILED} className={`rounded-2xl border border-dashed border-slate-300 bg-white p-3 transition-colors ${lit(UNFILED)}`}>
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
      {here && cards.length > 0 && (
        <>
          <h4 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Decks <span className="font-normal normal-case text-slate-400">most recently made first</span></h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((d) => <DeckCard key={d.id} d={d} admin={canEdit} where={here === UNFILED ? 'Not filed' : byId.get(here)?.name} onDragStart={(id) => setDrag({ kind: 'deck', id })} onDragEnd={() => { setDrag(null); setOver(null); }} />)}
          </div>
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
function Tile({ f, canEdit, first, last, decks, folders, moveTargets, label, lit, dropProps, onOpen, onAct, onDragStart, onDragEnd, onDelete }: {
  f: Folder; canEdit: boolean; first: boolean; last: boolean; decks: number; folders: number; moveTargets: Folder[]; label: (f: Folder) => string; lit: string;
  dropProps: Record<string, unknown>; onOpen: () => void; onAct: (op: FolderOp) => Promise<string | null>; onDragStart: () => void; onDragEnd: () => void; onDelete: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const commit = (v: string) => { setRenaming(false); if (v.trim() && v.trim() !== f.name) void onAct({ op: 'rename', id: f.id, name: v }); };
  return (
    <div {...dropProps} draggable={canEdit} onDragStart={canEdit ? (e) => { e.dataTransfer.setData('text/plain', `folder:${f.id}`); e.dataTransfer.effectAllowed = 'move'; onDragStart(); } : undefined} onDragEnd={canEdit ? onDragEnd : undefined}
      data-folder={f.id} className={`rounded-2xl border border-slate-300 bg-white p-3 shadow-card transition-colors ${lit}`}>
      <div className="flex items-center gap-2">
        <FolderIcon size={22} className="shrink-0 text-blue-900" />
        {renaming
          ? <input autoFocus defaultValue={f.name} maxLength={60} aria-label="Folder name" onBlur={(e) => commit(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); if (e.key === 'Escape') setRenaming(false); }} className="min-w-0 flex-1 rounded-lg border border-blue-400 px-2 py-1 text-base font-semibold outline-none" />
          : <button onClick={onOpen} className="min-w-0 flex-1 text-left" aria-label={`Open ${f.name}`}>
              <span className="block truncate text-base font-semibold text-slate-900">{f.name}</span>
              <span className="block text-xs text-slate-500">{[`${decks} deck${decks === 1 ? '' : 's'}`, folders ? `${folders} folder${folders === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ')}</span>
            </button>}
      </div>
      {canEdit && (
        <div className="mt-2 flex flex-wrap items-center gap-0.5 border-t border-slate-200 pt-2">
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
