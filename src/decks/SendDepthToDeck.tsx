import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { ALL_TOOLS } from "../registry";
import type { DepthItem } from "../shared/depth";
import { InlineMath } from "../shared/components/MathRenderer";
import { titleSlide } from "./layouts";
import { editableDepthCopy, materializeDeck } from "./questions";
import { allDecks, bankQuestion, loadDeck, newDeckId, saveDeck } from "./store";
import type { Slide } from "./types";

// "Edit in a deck" from a tool's Depth section (Developing-tools mode): the Depth card on screen becomes a Depth slide in the chosen
// deck (or a new one), as the deck's own copy, ready to open in the editor and tweak. The bank is not touched. Loaded only when opened.
export default function SendDepthToDeck({ path, item, onClose }: { path: string; item: DepthItem; onClose: () => void }) {
  const tool = ALL_TOOLS.find((t) => t.path === path);
  const decks = useMemo(() => allDecks(), []);
  const [target, setTarget] = useState<string>(decks.find((d) => d.deck.tool === tool?.id)?.deck.id ?? decks[0]?.deck.id ?? "new");
  const [done, setDone] = useState<{ id: string; title: string; at: number } | null>(null);
  const add = async () => {
    if (!tool) return;
    let deck = target === "new" ? null : loadDeck(target);
    if (!deck) { const id = newDeckId(); deck = { id, title: `${tool.name} deck`, summary: "", tool: tool.id, toolPath: tool.path, slides: [titleSlide(`${id}-title`, tool.name, "")] }; }
    const sid = `${deck.id}-${Date.now().toString(36)}`;
    const slide: Slide = { id: sid, family: "depth", title: "Depth", els: [{ id: `${sid}-q`, kind: "questions", x: 24, y: 24, w: 1552, h: 852, presentation: "full", visualiser: false, items: [editableDepthCopy(tool.id, item)] }] };
    const next = await materializeDeck({ ...deck, slides: [...deck.slides, slide] }, bankQuestion);
    saveDeck(next);
    setDone({ id: next.id, title: next.title, at: next.slides.length });
  };
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/40 p-4" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-300 bg-white p-5 shadow-lift">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-slate-900">Edit in a deck</h2>
          <button onClick={onClose} className="ml-auto rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>
        {!tool ? <p className="mt-3 text-sm text-slate-600">This page is not a registered tool, so it cannot be sent to a deck.</p> : done ? (
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            <p>Added as slide {done.at} of <b>{done.title}</b>. Double-click it in the editor to change its wording.</p>
            <div className="flex gap-2">
              <a href={`/decks/${done.id}?edit=1&s=${done.at}`} className="rounded-xl bg-blue-900 px-4 py-2 font-semibold text-white hover:bg-blue-800">Open it in the editor</a>
              <button onClick={onClose} className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100">Close</button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-500">Makes a Depth slide that is this deck's own copy of the card, so you can tweak the wording and layout. The tool's bank is not changed.</p>
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-base font-semibold text-slate-800"><InlineMath text={item.title} /></div>
            <label className="mt-3 block text-xs font-semibold text-slate-500">Add to the end of</label>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              {decks.map(({ deck }) => <option key={deck.id} value={deck.id}>{deck.title}</option>)}
              <option value="new">A new deck</option>
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={() => void add()} className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Add slide</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
