import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, X } from 'lucide-react';
import { CLASS_GROUPS } from '../../api/_classes';
import { useClassCounts, useClassDecks, useReload, setDeckClasses, type ClassDeck } from '../decks/classes';

const dateOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** The other way to find a deck: a heading per year, the classes in it as buttons, and, once a class is clicked, that class's decks most recently
 *  made first. Each class is read on its own and as a plain list (title, slides, when made), so nothing loads a deck's first slide.
 *  `admin` adds the controls that choose which classes a deck is used with; signed out it lists the published decks only. */
export default function ClassView({ admin, canEdit }: { admin: boolean; /** Not on a phone: the Edit pencil is left out there, as on the cards. */ canEdit: boolean }) {
  const [params, setParams] = useSearchParams();
  const selected = params.get('class');
  const [reload, bump] = useReload();
  const counts = useClassCounts(admin, reload);
  const pick = (id: string | null) => setParams((p) => { const n = new URLSearchParams(p); if (id && id !== selected) n.set('class', id); else n.delete('class'); return n; }, { replace: true });
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
            <ClassDecks classId={selected} admin={admin} canEdit={canEdit} reload={reload} onChanged={bump}
              byDeck={counts?.byDeck ?? {}} everyDeck={counts?.decks ?? []} />
          )}
        </section>
      ))}
    </div>
  );
}

function ClassDecks({ classId, admin, canEdit, reload, onChanged, byDeck, everyDeck }: {
  classId: string; admin: boolean; canEdit: boolean; reload: number; onChanged: () => void; byDeck: Record<string, string[]>; everyDeck: { id: string; title: string }[];
}) {
  const decks = useClassDecks(classId, admin, reload);
  const [error, setError] = useState<string | null>(null);
  const change = async (deckId: string, classIds: string[]) => { setError(await setDeckClasses(deckId, classIds)); onChanged(); };
  const here = new Set((decks ?? []).map((d) => d.id));
  const addable = everyDeck.filter((d) => !here.has(d.id));
  return (
    <div className="mt-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h4 className="text-lg font-semibold text-slate-900">{classId}</h4>
        <span className="text-sm text-slate-500">Most recently made first</span>
        {admin && addable.length > 0 && (
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
      {decks && decks.length === 0 && <p className="text-slate-500">{admin ? 'No decks yet: use Add a deck.' : 'Nothing is published for this class yet.'}</p>}
      {decks && decks.length > 0 && (
        <ul className="divide-y divide-slate-200">
          {decks.map((d) => <Row key={d.id} d={d} admin={admin} canEdit={canEdit} onRemove={() => void change(d.id, (byDeck[d.id] ?? []).filter((c) => c !== classId))} />)}
        </ul>
      )}
    </div>
  );
}

function Row({ d, admin, canEdit, onRemove }: { d: ClassDeck; admin: boolean; canEdit: boolean; onRemove: () => void }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <Link to={`/decks/${d.id}`} className="min-w-0 flex-1 rounded-lg hover:bg-slate-50" aria-label={`Play ${d.title}`}>
        <div className="font-semibold leading-tight text-slate-900">{d.title}</div>
        {d.summary && <div className="mt-0.5 line-clamp-2 text-sm text-slate-500">{d.summary}</div>}
        <div className="mt-0.5 text-xs text-slate-400">{[`${d.slides} slides`, `made ${dateOf(d.madeAt)}`, admin && !d.published ? 'not published' : ''].filter(Boolean).join(' · ')}</div>
      </Link>
      {admin && canEdit && <Link to={`/decks/${d.id}?edit=1`} aria-label={`Edit ${d.title}`} title="Edit this deck" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"><Pencil size={16} /></Link>}
      {admin && <button onClick={onRemove} aria-label={`Take ${d.title} out of this class`} title="Take out of this class" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"><X size={16} /></button>}
    </li>
  );
}
