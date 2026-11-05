import { useEffect, useState } from "react";
import { History, X } from "lucide-react";
import { fetchHistory, fetchSnapshot, type HistoryEntry } from "./cloud";
import { deckVersions, saveVersion } from "./store";
import type { DeckDef } from "./types";

const small = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50";

/** File → Version history: the shared rollback points of the live copy (kept by the service, the same on every device), then the snapshots kept on this
 *  device, each with a button to put it back (which can itself be undone). */
export function VersionsDialog({ deck, onClose, onRestore }: { deck: DeckDef; onClose: () => void; onRestore: (deck: DeckDef) => void }) {
  const [, tick] = useState(0);
  const [shared, setShared] = useState<HistoryEntry[] | null | undefined>(undefined);       // undefined: loading; null: the service is not reachable
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => { let on = true; void fetchHistory(deck.id).then((h) => { if (on) setShared(h); }); return () => { on = false; }; }, [deck.id]);
  const restoreShared = async (e: HistoryEntry) => {
    setBusy(e.key);
    const old = await fetchSnapshot(deck.id, e.key);
    setBusy(null);
    if (!old) { setShared(null); return; }
    saveVersion(deck, "Before restoring a shared version");
    onRestore(old); onClose();
  };
  const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
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
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Shared history</h3>
        <p className="mb-2 text-sm text-slate-600">Rollback points of the live copy, kept automatically before each spell of editing, the same on every device (the last 40). Restoring one becomes your next save, so it can be undone.</p>
        {shared === undefined && <p className="mb-3 text-sm text-slate-500" role="status">Loading…</p>}
        {shared === null && <p className="mb-3 rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">The shared history can't be reached from here (offline or the local dev server).</p>}
        {shared && shared.length === 0 && <p className="mb-3 rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">No shared versions yet: one is kept the first time this deck is changed after it was first saved.</p>}
        {shared?.map((h) => (
          <div key={h.key} className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
            <div><div className="font-semibold text-slate-900">{when(h.savedAt)}</div>
              <div className="text-xs text-slate-500">{h.title} · {h.slides} slides</div></div>
            <button className={small} disabled={busy !== null} onClick={() => { void restoreShared(h); }}>{busy === h.key ? "Restoring…" : "Restore"}</button>
          </div>
        ))}
        <h3 className="mb-1 mt-4 text-sm font-semibold text-slate-900">On this device</h3>
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
