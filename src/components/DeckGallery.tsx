import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Info, Plus, Settings2, Trash2 } from 'lucide-react';
import type { CategoryOp } from '../../api/_categories';
import { useCategories } from '../decks/categories';
import { layoutDecks, menuOptions, pathOf, type Category } from '../decks/categoryTree';
import { SlideCanvas } from '../decks/SlideCanvas';
import { CANVAS_W, type Slide } from '../decks/types';


// The one way decks are laid out: a card per deck (its first slide, its title and an (i) for the details), grouped under a heading per
// category. The categories are Harry's to control (a strand, with topics inside it; src/decks/categoryTree.ts), and with Developing tools on he files a
// deck by dragging its card onto a heading, or with the Filed under menu in the card's (i) (a touch screen cannot drag). The Decks page and the deck
// editor's list both draw this, so the two always mirror each other: the page shows the published decks (and, with Developing tools on, the rest),
// the editor shows every deck.

export interface GalleryDeck {
  id: string; title: string; summary: string; strand?: string; slides: number; preview?: Slide;
  /** A small tag beside the title, such as "Not published". */
  badge?: string;
  /** Lines for the (i): "Published 3 Nov 2026", "Your deck" … */
  notes: string[];
  /** A control on the card, such as Edit. */
  action?: ReactNode;
}

/** The preview scales to the width its box is given, so on a phone the card (full width) shows a full-width slide. */
function FitPreview({ slide }: { slide: Slide }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(272);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setW(el.clientWidth || 272);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className="w-full"><SlideCanvas slide={slide} scale={w / CANVAS_W} /></div>;
}

type MenuOption = { id: string; label: string; depth: 0 | 1 };

/** On a tablet or laptop every card is the same fixed width, so a row of them lines up and the gaps stay even; on a phone each is the full width. */
function DeckCard({ d, admin, filedIn, where, options, onDragStart, onDragEnd, onFile }: {
  d: GalleryDeck; admin?: boolean; filedIn?: string | null; where?: string; options?: MenuOption[];
  onDragStart?: (id: string) => void; onDragEnd?: () => void; onFile?: (categoryId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div draggable={!!admin} data-deck={d.id}
      onDragStart={admin ? (e) => { e.dataTransfer.setData('text/plain', d.id); e.dataTransfer.effectAllowed = 'move'; onDragStart?.(d.id); } : undefined}
      onDragEnd={admin ? () => onDragEnd?.() : undefined}
      className={`w-full sm:w-[296px] sm:shrink-0 rounded-2xl border border-slate-300 bg-white p-3 shadow-card ${admin ? 'cursor-grab active:cursor-grabbing' : ''}`}>
      <div className="relative">
        <Link to={`/decks/${d.id}`} draggable={false} aria-label={`Play ${d.title}`} className="block overflow-hidden rounded-lg border border-slate-200 hover:shadow-lift transition-shadow">
          {d.preview
            ? <FitPreview slide={d.preview} />
            : <span className="flex aspect-video w-full items-center justify-center px-4 text-center text-lg font-semibold text-slate-800">{d.title}</span>}
        </Link>
        {d.badge && <span className="pointer-events-none absolute left-2 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-500 shadow-sm">{d.badge}</span>}
      </div>
      <div className="mt-2 flex min-h-12 items-center gap-1">
        <div className="min-w-0 flex-1 font-semibold leading-tight text-slate-900" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.title}</div>
        {d.action}
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`About ${d.title}`} title="About this deck"
          className={`-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors ${open ? 'text-blue-900' : 'text-slate-400 hover:text-slate-700'}`}><Info size={18} /></button>
      </div>
      {open && (
        <div className="border-t border-slate-200 pt-2">
          {d.summary && <div className="text-sm text-slate-500">{d.summary}</div>}
          <div className="mt-1 text-xs text-slate-400">{[where, `${d.slides} slides`, ...d.notes].filter(Boolean).join(' · ')}</div>
          {admin && onFile && options && (
            <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">Filed under
              <select value={filedIn ?? ''} onChange={(e) => onFile(e.target.value || null)} aria-label={`File ${d.title} under`}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-normal text-slate-700">
                <option value="">Not filed</option>
                {options.map((o) => <option key={o.id} value={o.id}>{o.depth ? '   ' : ''}{o.label}</option>)}
              </select>
            </label>
          )}
        </div>
      )}
    </div>
  );
}

/** A place a deck can be dropped (a strand, a topic, Not filed). While a deck is being dragged it shows where it will land; the innermost zone wins. */
function DropZone({ on, dragging, onDrop, className = '', children }: { on: boolean; dragging: boolean; onDrop: () => void; className?: string; children: ReactNode }) {
  const [over, setOver] = useState(0);        // entering a child fires leave then enter, so count them
  const live = on && dragging;
  return (
    <div className={`${className} rounded-2xl transition-colors ${live ? (over > 0 ? 'bg-blue-50 ring-2 ring-blue-400' : 'ring-1 ring-slate-200') : ''}`}
      onDragEnter={live ? (e) => { e.stopPropagation(); setOver((n) => n + 1); } : undefined}
      onDragLeave={live ? (e) => { e.stopPropagation(); setOver((n) => Math.max(0, n - 1)); } : undefined}
      onDragOver={live ? (e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; } : undefined}
      onDrop={live ? (e) => { e.preventDefault(); e.stopPropagation(); setOver(0); onDrop(); } : undefined}>
      {children}
    </div>
  );
}

const small = 'grid h-7 w-7 place-items-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40';

/** A heading. In manage mode it also renames (click the name), reorders, moves, adds a topic and deletes. */
function Heading({ category, level, manage, strands, hasTopics, onOp }: {
  category: Category; level: 1 | 2; manage: boolean; strands: Category[]; hasTopics: boolean; onOp: (op: CategoryOp) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const commit = (value: string) => { setEditing(false); if (value.trim() && value.trim() !== category.name) onOp({ op: 'rename', id: category.id, name: value }); };
  const title = level === 1 ? 'text-sm font-semibold uppercase tracking-wide text-slate-500' : 'text-sm font-semibold text-slate-600';
  const others = strands.filter((x) => x.id !== category.id && x.id !== category.parent);
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {manage && editing
          ? <input autoFocus defaultValue={category.name} maxLength={60} aria-label="Category name" onBlur={(e) => commit(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditing(false); }}
              className="rounded-lg border border-blue-400 bg-white px-2 py-1 text-sm font-semibold text-slate-800 outline-none" />
          : manage
            ? <button onClick={() => setEditing(true)} title="Rename" className={`${title} rounded-md px-1 hover:bg-slate-100`}>{category.name}</button>
            : <h3 className={title}>{category.name}</h3>}
        {manage && (
          <>
            <button className={small} onClick={() => onOp({ op: 'move', id: category.id, direction: 'up' })} aria-label={`Move ${category.name} up`} title="Move up"><ChevronUp size={14} /></button>
            <button className={small} onClick={() => onOp({ op: 'move', id: category.id, direction: 'down' })} aria-label={`Move ${category.name} down`} title="Move down"><ChevronDown size={14} /></button>
            {level === 1 && <button className={small} onClick={() => setAdding((a) => !a)} aria-label={`Add a topic to ${category.name}`} title="Add a topic inside"><Plus size={14} /></button>}
            {(level === 2 || !hasTopics) && (level === 2 || others.length > 0) && (
              <select value="" aria-label={`Move ${category.name}`} title={level === 2 ? 'Move to another strand' : 'Make this a topic of another strand'}
                onChange={(e) => { const v = e.target.value; if (v) onOp({ op: 'setParent', id: category.id, parent: v === '__top' ? null : v }); }}
                className="rounded-lg border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-600">
                <option value="">{level === 2 ? 'Move to…' : 'Make a topic of…'}</option>
                {level === 2 && <option value="__top">Top level (a strand)</option>}
                {others.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            )}
            <button className={`${small} hover:border-red-300 hover:text-red-600`} aria-label={`Delete ${category.name}`} title="Delete"
              onClick={() => { if (window.confirm(`Delete "${category.name}"${hasTopics ? ' and its topics' : ''}? Decks filed in it become not filed.`)) onOp({ op: 'delete', id: category.id }); }}><Trash2 size={14} /></button>
          </>
        )}
      </div>
      {manage && adding && (
        <form className="mt-2 flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); const v = (new FormData(e.currentTarget).get('topic') as string) ?? ''; if (v.trim()) { onOp({ op: 'add', name: v, parent: category.id }); setAdding(false); } }}>
          <input name="topic" autoFocus maxLength={60} placeholder={`A topic inside ${category.name}`} aria-label="New topic name" className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm" />
          <button className="rounded-lg bg-blue-900 px-2.5 py-1 text-sm font-semibold text-white">Add</button>
        </form>
      )}
    </div>
  );
}

/** The decks under the categories Harry set (a heading per strand, topics inside it), then those not filed. With `admin` he can also manage the categories and file decks. */
export function DeckSections({ decks, admin = false }: { decks: GalleryDeck[]; admin?: boolean }) {
  const { data, act } = useCategories(admin);
  const [manage, setManage] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  if (data === undefined) return <p className="text-slate-500">Loading…</p>;
  const canEdit = admin && data !== null;                      // without the sharing service nothing can be filed
  const layout = layoutDecks(decks, data, { showEmpty: admin });
  const options = menuOptions(data);
  const strands = (data ?? { categories: [] }).categories.filter((c) => c.parent === null);
  const byId = new Map(decks.map((d) => [d.id, d]));
  const run = async (op: CategoryOp) => setError(await act(op));
  const file = (deckId: string, categoryId: string | null) => { setDragging(null); void run({ op: 'file', deckId, categoryId }); };
  const cards = (ids: string[], filedIn: string | null) => ids.map((id) => {
    const d = byId.get(id);
    return d ? <DeckCard key={id} d={d} admin={canEdit} filedIn={filedIn} where={pathOf(filedIn, data)} options={options} onDragStart={setDragging} onDragEnd={() => setDragging(null)} onFile={(c) => file(id, c)} /> : null;
  });
  const row = 'flex flex-col gap-4 sm:flex-row sm:flex-wrap';
  const drop = (target: string | null) => () => { if (dragging) file(dragging, target); };

  return (
    <div className="space-y-8">
      {admin && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {canEdit && <button onClick={() => setManage((m) => !m)} aria-pressed={manage} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-semibold shadow-card ${manage ? 'border-blue-400 bg-blue-50 text-blue-900' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}><Settings2 size={14} />Manage categories</button>}
          <span className="text-slate-500">{!canEdit ? "Categories can't be changed here: the sharing service isn't available." : manage ? 'Click a name to rename it. Arrows reorder; + adds a topic.' : 'Drag a deck onto a heading to file it (or use Filed under in its (i)).'}</span>
          {manage && (
            <form className="ml-auto flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { void run({ op: 'add', name }); setName(''); } }}>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="New strand" aria-label="New strand name" className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm" />
              <button className="rounded-lg bg-blue-900 px-2.5 py-1 text-sm font-semibold text-white">Add strand</button>
            </form>
          )}
          {error && <span className="basis-full text-red-600" role="alert">{error}</span>}
        </div>
      )}
      {layout.sections.map((s) => {
        const direct = cards(s.decks, s.category.id);
        const empty = s.decks.length === 0 && s.topics.every((t) => t.decks.length === 0);
        return (
          <DropZone key={s.category.id} on={canEdit} dragging={!!dragging} onDrop={drop(s.category.id)} className="-m-1 p-1">
            <Heading category={s.category} level={1} manage={manage && canEdit} strands={strands} hasTopics={s.topics.length > 0} onOp={(op) => void run(op)} />
            {direct.length > 0 && <div className={row}>{direct}</div>}
            {empty && admin && <p className="text-sm text-slate-400">Nothing here yet{canEdit ? ': drag a deck onto this heading.' : '.'}</p>}
            {s.topics.map((t) => (
              <DropZone key={t.category.id} on={canEdit} dragging={!!dragging} onDrop={drop(t.category.id)} className={`${direct.length > 0 ? 'mt-5' : 'mt-1'} ml-0 p-1 sm:ml-4`}>
                <Heading category={t.category} level={2} manage={manage && canEdit} strands={strands} hasTopics={false} onOp={(op) => void run(op)} />
                {t.decks.length > 0 ? <div className={row}>{cards(t.decks, t.category.id)}</div> : admin && <p className="text-sm text-slate-400">Nothing here yet.</p>}
              </DropZone>
            ))}
          </DropZone>
        );
      })}
      {(layout.unfiled.length > 0 || (canEdit && dragging)) && (
        <DropZone on={canEdit} dragging={!!dragging} onDrop={drop(null)} className="-m-1 p-1">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{admin ? 'Not filed' : 'Other decks'}{admin && dragging ? ' (drop here to unfile)' : ''}</h3>
          <div className={row}>{cards(layout.unfiled, null)}</div>
        </DropZone>
      )}
    </div>
  );
}
