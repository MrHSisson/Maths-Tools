import { useEffect } from "react";
import { Link2, Printer, RotateCcw, Trash2, X } from "lucide-react";
import { BASKET_MAX } from "./printBasket";
import type { SavedItem } from "../savedLists";

// The saved-questions print page: the questions saved on this device, printed as questions, answers or both. Opened from the pin control's panel
// or the burger menu. Questions are saved as recipes (the tab, level, options and seed), so printing rebuilds each one; the link carries the
// whole list to another device. Only sub-tools with a print sheet can be printed; the rest can still be reloaded.

interface Props {
  items: SavedItem[];
  /** what a saved question is called in the list: its sub-tool here, its tool's name when it belongs to another tool */
  label: (item: SavedItem) => string;
  /** the saved question can be printed from this page (this tool, and its sub-tool has a print sheet) */
  printable: (item: SavedItem) => boolean;
  /** the saved question belongs to the tool this page is */
  here: (item: SavedItem) => boolean;
  busy: string | null;
  note: string | null;
  onLoad: (item: SavedItem) => void;
  onRemove: (item: SavedItem) => void;
  onClear: () => void;
  onPrint: (mode: "questions" | "answers" | "both") => void;
  onCopyLink: () => void;
  onClose: () => void;
}

export default function PrintBasket({ items, label, printable, here, busy, note, onLoad, onRemove, onClear, onPrint, onCopyLink, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const empty = items.length === 0;
  const btn = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-4 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed";
  return (
    <div className="fixed inset-0 z-[400] flex flex-col" style={{ backgroundColor: "#f8f9fb" }}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <div>
          <div className="text-lg font-semibold text-slate-900">Saved questions</div>
          <div className="text-sm text-slate-500">Saved on this device ({items.length} of {BASKET_MAX}) until you remove them. Print them, or reload one to work through.</div>
        </div>
        <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"><X size={20} /></button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-300 shadow-card bg-white">
            {empty ? (
              <div className="p-6 text-slate-500 text-sm">Nothing saved yet. Press the pin beside New Question to save the question on screen.</div>
            ) : (
              <ol className="divide-y divide-slate-200">
                {items.map((it, i) => (
                  <li key={`${it.tab}-${it.level}-${it.seed}-${i}`} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-6 shrink-0 text-sm font-semibold text-slate-400">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900">{label(it)} · Level {it.level}{!printable(it) && <span className="ml-2 text-xs font-normal text-slate-400">{here(it) ? "no print sheet" : "other tool: reload to open it"}</span>}</div>
                      <div className="text-sm text-slate-500 truncate">{it.preview}</div>
                    </div>
                    <button onClick={() => onLoad(it)} aria-label={`Reload question ${i + 1}`} title="Reload this question" className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-blue-900 hover:bg-slate-50"><RotateCcw size={15} /> Reload</button>
                    <button onClick={() => onRemove(it)} aria-label={`Remove question ${i + 1}`} title="Remove" className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-red-600"><Trash2 size={18} /></button>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => onPrint("questions")} disabled={empty || !!busy || !items.some(printable)} data-trusted-click className={`${btn} bg-blue-900 text-white hover:bg-blue-800`}><Printer size={18} /> Print questions</button>
            <button onClick={() => onPrint("answers")} disabled={empty || !!busy || !items.some(printable)} data-trusted-click className={`${btn} bg-white text-blue-900 border border-slate-300 hover:bg-slate-50`}><Printer size={18} /> Print answers</button>
            <button onClick={() => onPrint("both")} disabled={empty || !!busy || !items.some(printable)} data-trusted-click className={`${btn} bg-white text-blue-900 border border-slate-300 hover:bg-slate-50`}><Printer size={18} /> Print both</button>
            <span className="flex-1" />
            <button onClick={onCopyLink} disabled={empty} className={`${btn} bg-white text-slate-700 border border-slate-300 hover:bg-slate-50`}><Link2 size={18} /> Copy basket link</button>
            <button onClick={onClear} disabled={empty} className={`${btn} bg-white text-red-700 border border-slate-300 hover:bg-red-50`}><Trash2 size={18} /> Clear basket</button>
          </div>
          {busy && <div className="text-sm font-semibold text-blue-900">{busy}</div>}
          {note && !busy && <div className="text-sm text-slate-600">{note}</div>}
          <div className="text-xs text-slate-400">Each question prints on its own A4 page. &ldquo;Both&rdquo; prints every question first, then every answer sheet. Reload brings a question back onto the page to work through. The link rebuilds the same questions on any device that opens it.</div>
        </div>
      </div>
    </div>
  );
}
