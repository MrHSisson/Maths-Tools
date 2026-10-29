import { Link } from 'react-router-dom';
import { Lock, Pencil } from 'lucide-react';
import { useDevMode } from '../devMode';
import { usePublishedIndex } from '../decks/published';

/** The landing page's Decks tab: the published decks anyone can play, and the way into the deck editor (password needed). */
export default function DecksTab() {
  const published = usePublishedIndex();
  const unlocked = useDevMode();
  const decks = Object.entries(published ?? {}).sort((a, b) => b[1].publishedAt.localeCompare(a[1].publishedAt));
  return (
    <div className="mt-8 mb-8">
      <section className="mb-10 sm:mb-12">
        <h2 className="flex items-center gap-2.5 mb-4 text-lg sm:text-xl font-bold text-slate-900">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />Published decks
        </h2>
        {published === undefined && <p className="text-slate-500">Loading…</p>}
        {published === null && <p className="text-slate-500">Published decks come from the website, so they can't be listed here.</p>}
        {published && decks.length === 0 && <p className="text-slate-500">Nothing is published yet.</p>}
        {decks.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map(([id, d]) => (
              <Link key={id} to={`/decks/${id}`} className="block rounded-2xl border border-slate-300 bg-white p-5 shadow-card hover:shadow-lift transition-shadow">
                <div className="text-lg font-semibold text-slate-900">{d.title}</div>
                {d.summary && <div className="mt-1 text-sm text-slate-500">{d.summary}</div>}
                <div className="mt-3 text-xs text-slate-400">{d.slides} slides · published {new Date(d.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="flex items-center gap-2.5 mb-4 text-lg sm:text-xl font-bold text-slate-900">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />Deck editor
        </h2>
        <Link to="/decks" className="flex max-w-md items-center gap-4 rounded-2xl border border-slate-300 bg-white p-5 shadow-card hover:shadow-lift transition-shadow">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">{unlocked ? <Pencil size={18} /> : <Lock size={18} />}</span>
          <span>
            <span className="block text-lg font-semibold text-slate-900">Build and edit decks</span>
            <span className="block text-sm text-slate-500">{unlocked ? 'Open the deck editor.' : 'Needs the admin password.'}</span>
          </span>
        </Link>
      </section>
    </div>
  );
}
