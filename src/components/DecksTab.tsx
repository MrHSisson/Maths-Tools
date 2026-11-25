import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useDevMode } from '../devMode';
import { usePhoneDevice } from '../shared/layoutMode';
import { newDeckId, saveDeck, syncAllDecks } from '../decks/store';
import { titleSlide } from '../decks/layouts';
import FolderView from './FolderView';

/** The one Decks page's list (/deck-gallery), for everyone. Signed out: the published decks in the topic folders, read-only, and nothing else. Signed in (the same
 *  password and switch as Developing tools): **By class** (the default) and **By topic**, both file explorers over every deck, plus New deck, the Slide library
 *  and a check for decks changed elsewhere. A phone signed in browses the same folders but only previews a deck, so it never shows the editing controls. */
export default function DecksTab() {
  const unlocked = useDevMode();
  const phone = usePhoneDevice();
  const [view, setView] = useView();
  if (!unlocked) {
    return (
      <div className="mt-8 mb-8">
        <Heading>Published decks</Heading>
        <FolderView tree="topic" canEdit={false} publicMode />
      </div>
    );
  }
  return (
    <>
      <Toolbar viewOnly={phone} />
      <ViewSwitch view={view} onChange={setView} />
      <FolderView key={view} tree={view} canEdit={!phone} />
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
/** By class or By topic: the same explorer over a different set of folders. */
function ViewSwitch({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const tab = (v: View, label: string) => (
    <button key={v} role="tab" aria-selected={view === v} onClick={() => onChange(v)}
      className={`border-b-2 px-1 pb-2 text-sm font-semibold ${view === v ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{label}</button>
  );
  return <div role="tablist" aria-label="Organise decks" className="mt-6 flex gap-6 border-b border-slate-200">{tab('class', 'By class')}{tab('topic', 'By topic')}</div>;
}

/** New deck, the Slide library and a look for decks changed on another device or by Claude (nothing checks in the background: it would keep the database awake). */
function Toolbar({ viewOnly }: { viewOnly: boolean }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState<string | null>(null);
  const check = async () => {
    setChecking('Checking…');
    const r = await syncAllDecks();
    setChecking(r === null ? 'Could not reach the shared copy'
      : r.failed.length ? `Storage full: could not keep ${r.failed.join(', ')} on this device${r.updated.length ? `. Updated: ${r.updated.join(', ')}` : ''}`
      : r.updated.length ? `Updated: ${r.updated.join(', ')}` : 'All decks are up to date');
  };
  const create = () => {
    const id = newDeckId();
    saveDeck({ id, title: 'New deck', summary: '', slides: [titleSlide(`${id}-title`, 'New deck', '')] });
    navigate(`/decks/${id}?edit=1`);
  };
  const button = 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-card hover:bg-slate-50';
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <Heading inline>Decks</Heading>
      {checking && <span className="ml-auto text-sm text-slate-500" role="status">{checking}</span>}
      <button onClick={() => void check()} disabled={checking === 'Checking…'} title="Look for decks changed on another device or by Claude" className={`${checking ? '' : 'ml-auto '}${button} disabled:opacity-60`}>Check for changes</button>
      {!viewOnly && <Link to="/decks/library" className={button}>Slide library</Link>}
      {!viewOnly && (<button onClick={create} className="inline-flex items-center gap-1 rounded-xl bg-blue-900 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"><Plus size={16} />New deck</button>)}
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
