import { useEffect, useState } from "react";
import { History, X } from "lucide-react";
import { deckVersions, saveVersion } from "./store";
import type { DeckDef } from "./types";

const small = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50";

/** File → Version history: the snapshots kept on this device, with a button to put one back (which can itself be undone). */
export function VersionsDialog({ deck, onClose, onRestore }: { deck: DeckDef; onClose: () => void; onRestore: (deck: DeckDef) => void }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [onClose]);
  const versions = [...deckVersions(deck.id)].reverse();
  return (
    <div className="fixed inset-0 z-[2600] flex items-center justify-center bg-slate-900/30 p-4" onPointerDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Version history" onPointerDown={(e) => e.stopPropagation()} className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-300 bg-white p-5 shadow-lift">
        <div className="mb-1 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><History size={18} />Version history</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><X size={16} /></button></div>
        <p className="mb-3 text-sm text-slate-600">The last few versions of this deck kept on this device: one while you edit (every ten minutes), one before an update from another device replaces it, and any you save. Restoring one can be undone with Undo.</p>
        <button className={`${small} mb-3`} onClick={() => { saveVersion(deck, "Saved by you"); tick((n) => n + 1); }}>Save a version now</button>
        {versions.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No versions yet.</p>}
        {versions.map((v) => (
          <div key={v.at} className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
            <div><div className="font-semibold text-slate-900">{new Date(v.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</div>
              <div className="text-xs text-slate-500">{v.note} · {v.deck.slides.length} slides</div></div>
            <button className={small} onClick={() => { saveVersion(deck, "Before restoring an older version"); onRestore(v.deck); onClose(); }}>Restore</button>
          </div>
        ))}
      </div>
    </div>
  );
}
