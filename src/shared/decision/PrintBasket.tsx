import { useEffect } from "react";
import { Link2, Printer, Trash2, X } from "lucide-react";
import { BASKET_MAX, type BasketItem } from "./printBasket";

// The print basket page: the questions saved to print later. Opened from the burger menu. Questions are saved as recipes (the tab, level, options
// and seed), so printing rebuilds each one; the link carries the whole basket to another device.

interface Props {
  items: BasketItem[];
  tabLabel: (tab: string) => string;
  busy: string | null;
  note: string | null;
  onRemove: (item: BasketItem) => void;
  onClear: () => void;
  onPrint: (mode: "questions" | "answers" | "both") => void;
  onCopyLink: () => void;
  onClose: () => void;
}

export default function PrintBasket({ items, tabLabel, busy, note, onRemove, onClear, onPrint, onCopyLink, onClose }: Props) {
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
          <div className="text-lg font-semibold text-slate-900">Print basket</div>
          <div className="text-sm text-slate-500">Questions saved to print later ({items.length} of {BASKET_MAX}). They stay on this device until you remove them.</div>
        </div>
        <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"><X size={20} /></button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-300 shadow-card bg-white">
            {empty ? (
              <div className="p-6 text-slate-500 text-sm">Nothing saved yet. On a question you want to print, open the menu and choose <b>Add to print basket</b>.</div>
            ) : (
              <ol className="divide-y divide-slate-200">
                {items.map((it, i) => (
                  <li key={`${it.tab}-${it.level}-${it.seed}-${i}`} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-6 shrink-0 text-sm font-semibold text-slate-400">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900">{tabLabel(it.tab)} · Level {it.level}</div>
                      <div className="text-sm text-slate-500 truncate">{it.preview}</div>
                    </div>
                    <button onClick={() => onRemove(it)} aria-label={`Remove question ${i + 1}`} title="Remove" className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-red-600"><Trash2 size={18} /></button>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => onPrint("questions")} disabled={empty || !!busy} data-trusted-click className={`${btn} bg-blue-900 text-white hover:bg-blue-800`}><Printer size={18} /> Print questions</button>
            <button onClick={() => onPrint("answers")} disabled={empty || !!busy} data-trusted-click className={`${btn} bg-white text-blue-900 border border-slate-300 hover:bg-slate-50`}><Printer size={18} /> Print answers</button>
            <button onClick={() => onPrint("both")} disabled={empty || !!busy} data-trusted-click className={`${btn} bg-white text-blue-900 border border-slate-300 hover:bg-slate-50`}><Printer size={18} /> Print both</button>
            <span className="flex-1" />
            <button onClick={onCopyLink} disabled={empty} className={`${btn} bg-white text-slate-700 border border-slate-300 hover:bg-slate-50`}><Link2 size={18} /> Copy basket link</button>
            <button onClick={onClear} disabled={empty} className={`${btn} bg-white text-red-700 border border-slate-300 hover:bg-red-50`}><Trash2 size={18} /> Clear basket</button>
          </div>
          {busy && <div className="text-sm font-semibold text-blue-900">{busy}</div>}
          {note && !busy && <div className="text-sm text-slate-600">{note}</div>}
          <div className="text-xs text-slate-400">Each question prints on its own A4 page. &ldquo;Both&rdquo; prints every question first, then every answer sheet. The link rebuilds the same questions on any device that opens it.</div>
        </div>
      </div>
    </div>
  );
}
