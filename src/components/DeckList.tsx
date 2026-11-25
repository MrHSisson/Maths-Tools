import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, CopyPlus, FileText, Pencil, X } from 'lucide-react';
import type { FolderDeck, SortDir, SortKey } from '../decks/folders';
import { PITCH_LABEL, type Pitch } from '../decks/types';

const dateOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const iconBtn = 'grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800';
const BAND_STYLE: Record<Pitch, string> = { upper: 'bg-indigo-50 text-indigo-800 ring-indigo-200', middle: 'bg-sky-50 text-sky-800 ring-sky-200', lower: 'bg-amber-50 text-amber-800 ring-amber-200' };
// Name, band, slides, made, edited, status, actions. Slides and edited drop out on a narrow screen; the band stays.
const COLS = 'grid grid-cols-[minmax(0,1fr)_5.5rem_auto] items-center gap-x-3 md:grid-cols-[minmax(0,1fr)_6.5rem_3.5rem_6.5rem_6.5rem_6.5rem_auto]';

/** The band a lesson is pitched at, as a small labelled tag (the words carry it, colour only helps). */
function BandTag({ pitch }: { pitch?: string }) {
  if (!pitch || !(pitch in PITCH_LABEL)) return <span className="text-slate-300" aria-label="No band set">–</span>;
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${BAND_STYLE[pitch as Pitch]}`}>{PITCH_LABEL[pitch as Pitch]}</span>;
}

/** A folder's decks as a plain list: title (with its summary beneath), band, slides, made, last edited and whether it is published. Click a column to sort. */
export default function DeckList({ decks, canEdit, sortKey, sortDir, onSort, onRemove, onRepeat, onDragStart, onDragEnd, folderName, pathOf }: {
  decks: FolderDeck[]; canEdit: boolean; sortKey: SortKey; sortDir: SortDir; onSort: (k: SortKey) => void;
  /** Takes a deck out of the open folder; left out where there is no folder to take it from (search results, Not filed). */
  onRemove?: (id: string) => void;
  /** Starts putting a deck in a second folder as well (Repeat); left out where that is not offered. */
  onRepeat?: (deck: FolderDeck) => void; onDragStart: (id: string) => void; onDragEnd: () => void; folderName?: string;
  /** Where a deck is filed, shown under its title (for search results). */
  pathOf?: (id: string) => string;
}) {
  const head = (k: SortKey, label: string, cls = '') => (
    <button onClick={() => onSort(k)} aria-label={`Sort by ${label.toLowerCase()}`} aria-pressed={sortKey === k}
      className={`flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-wide ${sortKey === k ? 'text-blue-900' : 'text-slate-500 hover:text-slate-800'} ${cls}`}>
      {label}{sortKey === k && (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
    </button>
  );
  return (
    <div role="table" aria-label="Decks" className="mt-4 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-card">
      <div role="row" className={`${COLS} border-b border-slate-200 bg-slate-50 px-3 py-2`}>
        {head('name', 'Name')}{head('band', 'Band')}{head('slides', 'Slides', 'hidden md:flex')}{head('made', 'Made', 'hidden md:flex')}{head('edited', 'Edited', 'hidden md:flex')}
        <span className="hidden text-xs font-semibold uppercase tracking-wide text-slate-500 md:block">Status</span>
        <span className="w-[6.5rem]" />
      </div>
      {decks.map((d) => (
        <div role="row" key={d.id} data-deck={d.id} draggable={canEdit}
          onDragStart={canEdit ? (e) => { e.dataTransfer.setData('text/plain', d.id); e.dataTransfer.effectAllowed = 'move'; onDragStart(d.id); } : undefined} onDragEnd={canEdit ? onDragEnd : undefined}
          className={`${COLS} border-b border-slate-100 px-3 py-2 last:border-b-0 hover:bg-slate-50 ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''}`}>
          <Link to={`/decks/${d.id}`} draggable={false} aria-label={`Play ${d.title}`} className="flex min-w-0 items-center gap-2.5">
            <FileText size={20} className="shrink-0 text-slate-400" />
            <span className="min-w-0">
              <span className="block truncate font-semibold text-slate-900">{d.title}</span>
              {pathOf && <span className="block truncate text-xs font-medium text-blue-900">{pathOf(d.id)}</span>}
              {d.summary && <span className="block truncate text-xs text-slate-500">{d.summary}</span>}
              <span className="block text-xs text-slate-400 md:hidden">{`${d.slides} slides · made ${dateOf(d.madeAt)}${d.published ? '' : ' · not published'}`}</span>
            </span>
          </Link>
          <span role="cell"><BandTag pitch={d.pitch} /></span>
          <span role="cell" className="hidden text-sm text-slate-600 md:block">{d.slides}</span>
          <span role="cell" className="hidden text-sm text-slate-600 md:block">{dateOf(d.madeAt)}</span>
          <span role="cell" className="hidden text-sm text-slate-600 md:block">{dateOf(d.editedAt)}</span>
          <span role="cell" className={`hidden text-sm md:block ${d.published ? 'text-emerald-700' : 'text-slate-400'}`}>{d.published ? 'Published' : 'Not published'}</span>
          <span className="flex w-[6.5rem] justify-end">
            {canEdit && (
              <>
                <Link to={`/decks/${d.id}?edit=1`} aria-label={`Edit ${d.title}`} title="Edit this deck" className={iconBtn}><Pencil size={15} /></Link>
                {onRepeat && <button onClick={() => onRepeat(d)} aria-label={`Repeat ${d.title} in another folder`} title="Repeat in another folder" className={iconBtn}><CopyPlus size={15} /></button>}
                {onRemove && <button onClick={() => onRemove(d.id)} aria-label={`Take ${d.title} out of ${folderName ?? 'this folder'}`} title="Take out of this folder" className={`${iconBtn} hover:bg-red-50 hover:text-red-600`}><X size={15} /></button>}
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
