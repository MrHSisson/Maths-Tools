import { Link } from 'react-router-dom';
import { Lock, Pencil } from 'lucide-react';
import { useDevMode } from '../devMode';
import { SlideCanvas } from '../decks/SlideCanvas';
import { usePublishedIndex } from '../decks/published';

/** The landing page's Decks tab: the published decks anyone can play (each shown as its first slide, as in the deck list),
 *  and a button into the deck editor, which asks for the admin password. */
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
      {decks.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {decks.map(([id, d]) => (
            <Link key={id} to={`/decks/${id}`} className="flex items-center gap-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-card hover:shadow-lift transition-shadow">
              {d.preview && <span className="shrink-0 overflow-hidden rounded-lg border border-slate-200"><SlideCanvas slide={d.preview} scale={0.1} /></span>}
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold text-slate-900">{d.title}</span>
                {d.summary && <span className="mt-0.5 block text-sm text-slate-500">{d.summary}</span>}
                <span className="mt-1 block text-xs text-slate-400">{d.slides} slides · published {new Date(d.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
