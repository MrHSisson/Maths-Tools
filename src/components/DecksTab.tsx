import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, Lock, Pencil } from 'lucide-react';
import { useDevMode } from '../devMode';
import { SlideCanvas } from '../decks/SlideCanvas';
import { usePublishedIndex, type PublishedEntry } from '../decks/published';

/** One published deck: its first slide to play it from, and an (i) beside it that opens everything written about it. */
function DeckCard({ id, d }: { id: string; d: PublishedEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-3 shadow-card">
      <div className="flex items-start gap-2">
        <Link to={`/decks/${id}`} aria-label={`Play ${d.title}`} className="block min-w-0 overflow-hidden rounded-lg border border-slate-200 hover:shadow-lift transition-shadow">
          {d.preview
            ? <SlideCanvas slide={d.preview} scale={0.17} />
            : <span className="flex h-[153px] w-[272px] items-center justify-center px-4 text-center text-lg font-semibold text-slate-800">{d.title}</span>}
        </Link>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`About ${d.title}`} title="About this deck"
          className={`shrink-0 rounded-full p-1 transition-colors ${open ? 'text-blue-900' : 'text-slate-400 hover:text-slate-700'}`}><Info size={18} /></button>
      </div>
      {open && (
        <div className="mt-3 border-t border-slate-200 pt-2">
          <div className="font-semibold text-slate-900">{d.title}</div>
          {d.summary && <div className="mt-0.5 text-sm text-slate-500">{d.summary}</div>}
          <div className="mt-1 text-xs text-slate-400">{d.slides} slides · published {new Date(d.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      )}
    </div>
  );
}

/** The landing page's Decks tab: the published decks anyone can play, each shown as its first slide, and a button into
 *  the deck editor, which asks for the admin password. */
export default function DecksTab() {
  const published = usePublishedIndex();
  const unlocked = useDevMode();
  const decks = Object.entries(published ?? {}).sort((a, b) => b[1].publishedAt.localeCompare(a[1].publishedAt));
  return (
    <div className="mt-8 mb-8">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="flex items-center gap-2.5 text-lg sm:text-xl font-bold text-slate-900">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />Published decks
        </h2>
        <Link to="/decks" title={unlocked ? 'Open the deck editor' : 'Needs the admin password'}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-card hover:bg-slate-50">
          {unlocked ? <Pencil size={14} /> : <Lock size={14} />}Deck editor
        </Link>
      </div>
      {published === undefined && <p className="text-slate-500">Loading…</p>}
      {published === null && <p className="text-slate-500">Published decks come from the website, so they can't be listed here.</p>}
      {published && decks.length === 0 && <p className="text-slate-500">Nothing is published yet.</p>}
      {decks.length > 0 && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{decks.map(([id, d]) => <DeckCard key={id} id={id} d={d} />)}</div>}
    </div>
  );
}
