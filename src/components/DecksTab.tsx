import { Link } from 'react-router-dom';
import { Lock, Pencil } from 'lucide-react';
import { useDevMode } from '../devMode';
import { usePhoneDevice } from '../shared/layoutMode';
import { usePublishedIndex } from '../decks/published';
import { allDecks } from '../decks/store';
import { useSyncedDecks } from '../decks/useSyncedDecks';
import { DeckSections, type GalleryDeck } from './DeckGallery';

const dateOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** The Decks page's list: the published decks anyone can play, each shown as its first slide under its strand. With Developing tools
 *  on, the decks that are not published yet appear among them too (tagged), as the unfinished tools do. A button goes into the deck
 *  editor, which asks for the admin password. */
export default function DecksTab() {
  const published = usePublishedIndex();
  const unlocked = useDevMode();
  useSyncedDecks(unlocked);   // decks are not bundled: ask the shared copy, then re-render with what this device holds
  const phone = usePhoneDevice();   // a phone only previews a deck: no editor
  const pub = published ?? {};
  const fromPublished: GalleryDeck[] = Object.entries(pub).sort((a, b) => b[1].publishedAt.localeCompare(a[1].publishedAt))
    .map(([id, d]) => ({ id, title: d.title, summary: d.summary, strand: d.strand, slides: d.slides, preview: d.preview, notes: [`published ${dateOf(d.publishedAt)}`] }));
  const unpublished: GalleryDeck[] = unlocked
    ? allDecks().filter(({ deck }) => !pub[deck.id]).map(({ deck, mine }) => ({ id: deck.id, title: deck.title, summary: deck.summary, strand: deck.strand, slides: deck.slides.length, preview: deck.slides[0], badge: 'Not published', notes: ['not published', ...(mine ? ['your deck'] : [])] }))
    : [];
  const decks = [...fromPublished, ...unpublished];
  return (
    <div className="mt-8 mb-8">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="flex items-center gap-2.5 text-lg sm:text-xl font-bold text-slate-900">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />{unlocked ? 'Decks' : 'Published decks'}
        </h2>
        {!phone && <Link to="/decks" title={unlocked ? 'Open the deck editor' : 'Needs the admin password'}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-card hover:bg-slate-50">
          {unlocked ? <Pencil size={14} /> : <Lock size={14} />}Deck editor
        </Link>}
      </div>
      {published === undefined && <p className="text-slate-500">Loading…</p>}
      {published === null && !unlocked && <p className="text-slate-500">Published decks come from the website, so they can't be listed here.</p>}
      {published && decks.length === 0 && <p className="text-slate-500">Nothing is published yet.</p>}
      {decks.length > 0 && <DeckSections decks={decks} />}
    </div>
  );
}
