import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { SlideCanvas } from '../decks/SlideCanvas';
import { CANVAS_W, DECK_STRANDS, type Slide } from '../decks/types';


// The one way decks are laid out: a card per deck (its first slide, its title and an (i) for the details), grouped under a heading per
// strand. The Decks page and the deck editor's list both draw this, so the two always mirror each other: the page shows the
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

/** The preview scales to the width its box is given, so on a phone the card (full width) shows a full-width slide. */
function FitPreview({ slide }: { slide: Slide }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(272);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setW(el.clientWidth || 272);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className="w-full"><SlideCanvas slide={slide} scale={w / CANVAS_W} /></div>;
}

/** On a tablet or laptop every card is the same fixed width, so a row of them lines up and the gaps stay even; on a phone each is the full width. */
function DeckCard({ d }: { d: GalleryDeck }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full sm:w-[296px] sm:shrink-0 rounded-2xl border border-slate-300 bg-white p-3 shadow-card">
      <div className="relative">
        <Link to={`/decks/${d.id}`} aria-label={`Play ${d.title}`} className="block overflow-hidden rounded-lg border border-slate-200 hover:shadow-lift transition-shadow">
          {d.preview
            ? <FitPreview slide={d.preview} />
            : <span className="flex aspect-video w-full items-center justify-center px-4 text-center text-lg font-semibold text-slate-800">{d.title}</span>}
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
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">{inStrand.map((d) => <DeckCard key={d.id} d={d} />)}</div>
          </section>
        );
      })}
    </div>
  );
}
