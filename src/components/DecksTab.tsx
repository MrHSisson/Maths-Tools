import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import { useDevMode } from '../devMode';
import { usePhoneDevice } from '../shared/layoutMode';
import { usePublishedIndex } from '../decks/published';
import { deckSummaries, newDeckId, saveDeck, syncAllDecks, syncFromCloud } from '../decks/store';
import { titleSlide } from '../decks/layouts';
import { DeckSections, type GalleryDeck } from './DeckGallery';
import FolderView from './FolderView';

const dateOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
/** How long the signed-in list waits for the shared copies, so a deck's older title or preview is not shown and then swapped. */
const LIVE_WAIT_MS = 4000;

/** The one Decks page's list (/deck-gallery), for everyone. Signed out: the published decks and nothing else, each shown as its first
 *  slide under its category, with no editing controls at all. Signed in (the same password and switch as Developing tools): every deck,
 *  published or not, each with an Edit pencil, plus New deck, the Slide library and a check for decks changed elsewhere. A phone signed in
 *  sees the same list (the unpublished decks too) but only previews a deck, so it never shows the editing controls. */
export default function DecksTab() {
  const unlocked = useDevMode();
  const phone = usePhoneDevice();
  const [view, setView] = useView();
  if (!unlocked) return <PublishedList />;                        // classes are for signed-in use: signed out there is only the published list
  return (
    <>
      <ViewSwitch view={view} onChange={setView} />
      {view === 'class' ? <FolderView tree="class" canEdit={!phone} /> : <EditableList viewOnly={phone} />}
    </>
  );
}

type View = 'topic' | 'class';
const VIEW_KEY = 'mt-decks-view';
/** Which way the Decks page is organised (By class unless By topic was chosen), remembered on this device. */
function useView(): [View, (v: View) => void] {
  const [view, set] = useState<View>(() => { try { return localStorage.getItem(VIEW_KEY) === 'topic' ? 'topic' : 'class'; } catch { return 'class'; } });
  return [view, (v) => { set(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* the choice just is not remembered */ } }];
}
/** By topic (the strands and topics) or By class (a year, then its classes). */
function ViewSwitch({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const tab = (v: View, label: string) => (
    <button key={v} role="tab" aria-selected={view === v} onClick={() => onChange(v)}
      className={`border-b-2 px-1 pb-2 text-sm font-semibold ${view === v ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{label}</button>
  );
  return <div role="tablist" aria-label="Organise decks" className="mt-6 flex gap-6 border-b border-slate-200">{tab('topic', 'By topic')}{tab('class', 'By class')}</div>;
}

/** What anyone sees: the published decks, newest first. */
function PublishedList() {
  const published = usePublishedIndex();
  const pub = published ?? {};
  const decks: GalleryDeck[] = Object.entries(pub).sort((a, b) => b[1].publishedAt.localeCompare(a[1].publishedAt))
    .map(([id, d]) => ({ id, title: d.title, summary: d.summary, strand: d.strand, pitch: d.pitch, slides: d.slides, preview: d.preview, notes: [`published ${dateOf(d.publishedAt)}`] }));
  return (
    <div className="mt-8 mb-8">
      <Heading>Published decks</Heading>
      {published === undefined && <p className="text-slate-500">Loading…</p>}
      {published === null && <p className="text-slate-500">Published decks come from the website, so they can't be listed here.</p>}
      {published && decks.length === 0 && <p className="text-slate-500">Nothing is published yet.</p>}
      {decks.length > 0 && <DeckSections decks={decks} />}
    </div>
  );
}

/** What Harry sees when signed in: every deck, with the editing controls (`viewOnly`, on a phone: the same decks, none of the controls). */
function EditableList({ viewOnly = false }: { viewOnly?: boolean }) {
  const navigate = useNavigate();
  const published = usePublishedIndex();
  const [, refresh] = useState(0);
  // The shared copies are the live ones: wait for them (a moment at most; offline, the device's copies are used).
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    let on = true;
    const done = () => { if (on) { refresh((n) => n + 1); setSynced(true); } };
    const stop = window.setTimeout(done, LIVE_WAIT_MS);
    void syncFromCloud().catch(() => false).then(() => { window.clearTimeout(stop); done(); });
    return () => { on = false; window.clearTimeout(stop); };
  }, []);
  // Nothing checks in the background (it would keep the database awake): this looks for decks changed elsewhere, only when pressed.
  const [checking, setChecking] = useState<string | null>(null);
  const check = async () => {
    setChecking('Checking…');
    const r = await syncAllDecks();
    refresh((n) => n + 1);
    setChecking(r === null ? 'Could not reach the shared copy'
      : r.failed.length ? `Storage full: could not keep ${r.failed.join(', ')} on this device${r.updated.length ? `. Updated: ${r.updated.join(', ')}` : ''}`
      : r.updated.length ? `Updated: ${r.updated.join(', ')}` : 'All decks are up to date');
  };
  const create = () => {
    const id = newDeckId();
    saveDeck({ id, title: 'New deck', summary: '', slides: [titleSlide(`${id}-title`, 'New deck', '')] });
    navigate(`/decks/${id}?edit=1`);
  };
  const decks: GalleryDeck[] = deckSummaries().map((d) => ({
    id: d.id, title: d.title, summary: d.summary, strand: d.strand, pitch: d.pitch, slides: d.slides, preview: d.preview,
    badge: published?.[d.id] ? undefined : 'Not published',
    notes: [published?.[d.id] ? 'published' : 'not published', 'your deck', ...(d.edited ? ['edited on this device'] : [])],
    action: viewOnly ? undefined : <Link to={`/decks/${d.id}?edit=1`} aria-label={`Edit ${d.title}`} title="Edit this deck" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Pencil size={16} /></Link>,
  }));
  const button = 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-card hover:bg-slate-50';
  return (
    <div className="mt-8 mb-8">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Heading inline>Decks</Heading>
        {checking && <span className="ml-auto text-sm text-slate-500" role="status">{checking}</span>}
        <button onClick={() => void check()} disabled={checking === 'Checking…'} title="Look for decks changed on another device or by Claude" className={`${checking ? '' : 'ml-auto '}${button} disabled:opacity-60`}>Check for changes</button>
        {!viewOnly && <Link to="/decks/library" className={button}>Slide library</Link>}
        {!viewOnly && (<button onClick={create} className="inline-flex items-center gap-1 rounded-xl bg-blue-900 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"><Plus size={16} />New deck</button>)}
      </div>
      {!synced ? <p className="py-10 text-center font-medium text-slate-500" role="status">Loading the latest decks…</p> : decks.length === 0 ? <p className="text-slate-500">No decks yet.</p> : <DeckSections decks={decks} admin={!viewOnly} />}
    </div>
  );
}

function Heading({ children, inline }: { children: string; inline?: boolean }) {
  return (
    <h2 className={`flex items-center gap-2.5 text-lg sm:text-xl font-bold text-slate-900 ${inline ? '' : 'mb-4'}`}>
      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />{children}
    </h2>
  );
}
