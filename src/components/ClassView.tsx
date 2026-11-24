import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, X } from 'lucide-react';
import { CLASS_GROUPS } from '../../api/_classes';
import { useClassCounts, useClassDecks, useReload, setDeckClasses } from '../decks/classes';
import type { Slide } from '../decks/types';
import { DeckCard, type GalleryDeck } from './DeckGallery';

/** The other way to find a deck (signed in only): a heading per year, the classes in it as buttons, and, once a class is clicked, that class's decks as
 *  the usual preview cards, most recently made first from the left. Only the clicked class's decks (and their first slides) are read.
 *  `canEdit` adds the controls that choose which classes a deck is used with (and the Edit pencil); it is off on a phone, which only previews. */
export default function ClassView({ canEdit }: { canEdit: boolean }) {
  const [params, setParams] = useSearchParams();
  const selected = params.get('class');
  const [reload, bump] = useReload();
  const counts = useClassCounts(reload);
  const pick = (id: string) => setParams((p) => { const n = new URLSearchParams(p); if (id !== selected) n.set('class', id); else n.delete('class'); return n; }, { replace: true });
  if (counts === null) return <p className="mt-8 text-slate-500">Classes come from the website, so they can't be shown here.</p>;
  return (
    <div className="mt-6 space-y-8">
      {CLASS_GROUPS.map((g) => (
        <section key={g.year}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{g.year}</h3>
          {g.classes.length === 0
            ? <p className="text-sm text-slate-400">No classes yet.</p>
            : <div className="flex flex-wrap gap-2">
                {g.classes.map((c) => {
                  const n = counts?.counts[c];
                  const on = selected === c;
                  return (
                    <button key={c} onClick={() => pick(c)} aria-pressed={on}
                      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-base font-semibold shadow-card ${on ? 'border-blue-900 bg-blue-900 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>
                      {c}{n !== undefined && <span className={`rounded-full px-2 text-xs ${on ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{n}</span>}
                    </button>
                  );
                })}
              </div>}
          {selected && g.classes.includes(selected) && (
            <ClassDecks classId={selected} canEdit={canEdit} reload={reload} onChanged={bump} byDeck={counts?.byDeck ?? {}} everyDeck={counts?.decks ?? []} />
          )}
        </section>
      ))}
    </div>
  );
}

const dateOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function ClassDecks({ classId, canEdit, reload, onChanged, byDeck, everyDeck }: {
  classId: string; canEdit: boolean; reload: number; onChanged: () => void; byDeck: Record<string, string[]>; everyDeck: { id: string; title: string }[];
}) {
  const decks = useClassDecks(classId, reload);
  const [error, setError] = useState<string | null>(null);
  const change = async (deckId: string, classIds: string[]) => { setError(await setDeckClasses(deckId, classIds)); onChanged(); };
  const here = new Set((decks ?? []).map((d) => d.id));
  const addable = everyDeck.filter((d) => !here.has(d.id));
  const icon = 'grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800';
  const cards: GalleryDeck[] = (decks ?? []).map((d) => ({
    id: d.id, title: d.title, summary: d.summary, slides: d.slides, preview: d.preview as Slide | undefined,
    badge: d.published ? undefined : 'Not published', notes: [`made ${dateOf(d.madeAt)}`, d.published ? 'published' : 'not published'],
    action: canEdit ? (
      <>
        <Link to={`/decks/${d.id}?edit=1`} aria-label={`Edit ${d.title}`} title="Edit this deck" className={icon}><Pencil size={16} /></Link>
        <button onClick={() => void change(d.id, (byDeck[d.id] ?? []).filter((c) => c !== classId))} aria-label={`Take ${d.title} out of ${classId}`} title={`Take out of ${classId}`} className={`${icon} hover:bg-red-50 hover:text-red-600`}><X size={16} /></button>
      </>
    ) : undefined,
  }));
  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h4 className="text-lg font-semibold text-slate-900">{classId}</h4>
        <span className="text-sm text-slate-500">Most recently made first</span>
        {canEdit && addable.length > 0 && (
          <select value="" aria-label={`Add a deck to ${classId}`} onChange={(e) => { const id = e.target.value; if (id) void change(id, [...(byDeck[id] ?? []), classId]); }}
            className="ml-auto max-w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700">
            <option value="">Add a deck…</option>
            {addable.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        )}
      </div>
      {error && <p className="mb-2 text-sm text-red-600" role="alert">{error}</p>}
      {decks === undefined && <p className="text-slate-500" role="status">Loading…</p>}
      {decks === null && <p className="text-slate-500">This class's decks can't be listed here.</p>}
      {decks && decks.length === 0 && <p className="text-slate-500">{canEdit ? 'No decks yet: use Add a deck.' : 'No decks in this class yet.'}</p>}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((d) => <DeckCard key={d.id} d={d} where={classId} />)}
        </div>
      )}
    </div>
  );
}
