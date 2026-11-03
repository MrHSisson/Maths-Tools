import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { SlideCanvas } from '../decks/SlideCanvas';
import { DECK_STRANDS, type Slide } from '../decks/types';

// The one way decks are laid out: a card per deck (its first slide, its title and an (i) for the details), grouped under a heading per
// strand. The landing page's Decks tab and the deck editor's list both draw this, so the two always mirror each other: the tab shows the
// published decks (and, with Developing tools on, the rest), the editor shows every deck.

export interface GalleryDeck {
  id: string; title: string; summary: string; strand?: string; slides: number; preview?: Slide;
  /** A small tag beside the title, such as "Not published". */
  badge?: string;
  /** Lines for the (i): "Published 3 Nov 2026", "Your deck" … */
  notes: string[];
  /** A control on the card, such as Edit. */
  action?: ReactNode;
}

/** Every card is the same fixed width, so a row of them lines up and the gaps stay even however many decks there are. */
function DeckCard({ d }: { d: GalleryDeck }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-[296px] max-w-full shrink-0 rounded-2xl border border-slate-300 bg-white p-3 shadow-card">
      <div className="relative">
        <Link to={`/decks/${d.id}`} aria-label={`Play ${d.title}`} className="block overflow-hidden rounded-lg border border-slate-200 hover:shadow-lift transition-shadow">
          {d.preview
            ? <SlideCanvas slide={d.preview} scale={0.17} />
            : <span className="flex h-[153px] w-[272px] items-center justify-center px-4 text-center text-lg font-semibold text-slate-800">{d.title}</span>}
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
          <div className="mt-1 text-xs text-slate-400">{[d.strand, `${d.slides} slides`, ...d.notes].filter(Boolean).join(' · ')}</div>
        </div>
      )}
    </div>
  );
}

const UNFILED = 'Other decks';

/** The decks under a heading per strand (Number, Algebra …), then those with no strand. */
export function DeckSections({ decks }: { decks: GalleryDeck[] }) {
  return (
    <div className="space-y-8">
      {[...DECK_STRANDS, UNFILED].map((strand) => {
        const inStrand = decks.filter((d) => (d.strand && (DECK_STRANDS as readonly string[]).includes(d.strand) ? d.strand : UNFILED) === strand);
        if (inStrand.length === 0) return null;
        return (
          <section key={strand}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{strand}</h3>
            <div className="flex flex-wrap gap-4">{inStrand.map((d) => <DeckCard key={d.id} d={d} />)}</div>
          </section>
        );
      })}
    </div>
  );
}
