import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { SlideCanvas } from '../decks/SlideCanvas';
import { CANVAS_W, PITCH_LABEL, type Pitch, type Slide } from '../decks/types';


// The deck card: a deck's first slide, its title and an (i) for the details. The Decks page (components/FolderView.tsx) lays them out in folders.

export interface GalleryDeck {
  id: string; title: string; summary: string; pitch?: Pitch; slides: number; preview?: Slide;
  /** A small grey line under the title, such as the folder a search result is in. */
  sub?: string;
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

/** The cards fill a grid (one to a row on a phone, two on a tablet, four on a laptop), so every card in a row is the same width and the gaps stay even. */
export function DeckCard({ d, admin, where, onDragStart, onDragEnd }: {
  d: GalleryDeck; admin?: boolean; where?: string; onDragStart?: (id: string) => void; onDragEnd?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div draggable={!!admin} data-deck={d.id}
      onDragStart={admin ? (e) => { e.dataTransfer.setData('text/plain', d.id); e.dataTransfer.effectAllowed = 'move'; onDragStart?.(d.id); } : undefined}
      onDragEnd={admin ? () => onDragEnd?.() : undefined}
      className={`w-full min-w-0 rounded-2xl border border-slate-300 bg-white p-3 shadow-card ${admin ? 'cursor-grab active:cursor-grabbing' : ''}`}>
      <div className="relative">
        <Link to={`/decks/${d.id}`} draggable={false} aria-label={`Play ${d.title}`} className="block overflow-hidden rounded-lg border border-slate-200 hover:shadow-lift transition-shadow">
          {d.preview
            ? <FitPreview slide={d.preview} />
            : <span className="flex aspect-video w-full items-center justify-center px-4 text-center text-lg font-semibold text-slate-800">{d.title}</span>}
        </Link>
        {d.badge && <span className="pointer-events-none absolute left-2 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-500 shadow-sm">{d.badge}</span>}
      </div>
      <div className="mt-2 flex min-h-12 items-center gap-1">
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-tight text-slate-900" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.title}</div>
          {d.sub && <div className="mt-0.5 truncate text-xs text-slate-500" title={d.sub}>{d.sub}</div>}
        </div>
        {d.action}
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`About ${d.title}`} title="About this deck"
          className={`-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors ${open ? 'text-blue-900' : 'text-slate-400 hover:text-slate-700'}`}><Info size={18} /></button>
      </div>
      {open && (
        <div className="border-t border-slate-200 pt-2">
          {d.summary && <div className="text-sm text-slate-500">{d.summary}</div>}
          <div className="mt-1 text-xs text-slate-400">{[where, d.pitch && `Pitched at the ${PITCH_LABEL[d.pitch].toLowerCase()}`, `${d.slides} slides`, ...d.notes].filter(Boolean).join(' · ')}</div>
        </div>
      )}
    </div>
  );
}
