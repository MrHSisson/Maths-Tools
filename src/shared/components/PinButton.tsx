import { useEffect, useState } from "react";
import { ChevronDown, Pin, Printer, ShoppingBasket, X } from "lucide-react";
import { MAX_KEPT, type QuestionKeeperMenu } from "../questionKeeper";

/** The saved-questions control (toolbar; phone: the bottom bar). The main half pins / unpins the question on screen (filled while it is
 *  pinned; disabled once five others are). The attached chevron opens one panel: pin, the print basket (where the shell has one), and the
 *  recent and pinned questions to go back to. */
export function PinButton({ keeper, size = "bar" }: { keeper?: QuestionKeeperMenu; size?: "bar" | "phone" }) {
  const [open, setOpen] = useState(false);
  // the panel closes when you press anywhere else
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!(e.target as Element | null)?.closest?.("[data-saved-split]")) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open]);
  if (!keeper) return null;
  const { isPinned, canPin, basket } = keeper;
  const phone = size === "phone";
  const title = isPinned ? "Unpin this question" : canPin ? "Pin this question to come back to it" : `${MAX_KEPT} questions pinned: unpin one first`;
  const tone = isPinned ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-white text-blue-900 hover:bg-slate-50";
  const row = "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40";
  const head = "px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400";
  const go = (id: string) => { keeper.onPick(id); setOpen(false); };
  return (
    <div className="relative shrink-0" data-saved-split>
      <div className={`flex overflow-hidden rounded-xl border border-slate-200 ${phone ? "h-12" : "h-10"}`}>
        <button onClick={keeper.onPin} disabled={!canPin} aria-label={title} aria-pressed={isPinned} title={title}
          className={`flex items-center justify-center disabled:opacity-40 ${tone} ${phone ? "w-11" : "w-9 xl:w-10"}`}>
          <Pin size={phone ? 20 : 18} fill={isPinned ? "currentColor" : "none"} />
        </button>
        <button onClick={() => setOpen((o) => !o)} aria-label="Saved questions" aria-expanded={open} title="Pinned, recent and the print basket"
          className="flex w-6 items-center justify-center border-l border-slate-200 bg-white text-blue-900 hover:bg-slate-50">
          <ChevronDown size={14} style={{ transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
        </button>
      </div>
      {basket && basket.count > 0 && <span className="pointer-events-none absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-emerald-600 px-1 text-[11px] font-bold text-white">{basket.count}</span>}
      {open && (
        <div className={`z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lift ${phone
          // phone-width screens: across the screen just above the bottom bar; wider screens: above the control
          ? "fixed inset-x-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] sm:absolute sm:inset-x-auto sm:bottom-full sm:right-0 sm:mb-1.5 sm:w-80"
          : "absolute right-0 top-full mt-1.5 w-80 max-w-[86vw]"}`}>
          <button className={row} onClick={() => { keeper.onPin(); setOpen(false); }} disabled={!canPin}>
            <Pin size={16} className="shrink-0" fill={isPinned ? "currentColor" : "none"} />{isPinned ? "Unpin this question" : canPin ? "Pin this question" : `Unpin one first (${MAX_KEPT} pinned)`}
          </button>
          {basket && (
            <>
              {basket.canSave && (
                <button className={row} onClick={() => { basket.onToggle(); setOpen(false); }}>
                  <Printer size={16} className="shrink-0" />{basket.inBasket ? "Remove from print basket" : "Add to print basket"}
                </button>
              )}
              <button className={row} onClick={() => { basket.onOpen(); setOpen(false); }}>
                <ShoppingBasket size={16} className="shrink-0" />Open print basket ({basket.count})
              </button>
            </>
          )}
          <div className="border-t border-gray-100">
            <div className={head}>Pinned ({keeper.pins.length}/{MAX_KEPT})</div>
            {keeper.pins.length === 0 && <div className="px-4 pb-2 text-xs text-gray-400">Pin a question to come back to it.</div>}
            {keeper.pins.map((h) => (
              <div key={h.id} className={`flex items-center ${h.id === keeper.currentId ? "bg-blue-50" : ""}`}>
                <button onClick={() => go(h.id)} title={h.label} className="min-w-0 flex-1 truncate px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">{h.label}</button>
                <button onClick={() => keeper.onUnpin(h.id)} aria-label="Unpin" className="flex h-9 w-9 shrink-0 items-center justify-center text-gray-400 hover:text-gray-700"><X size={15} /></button>
              </div>
            ))}
            <div className={head}>Recent</div>
            {keeper.history.length === 0 && <div className="px-4 pb-2 text-xs text-gray-400">Questions you move on from appear here.</div>}
            {keeper.history.map((h) => (
              <button key={h.id} onClick={() => go(h.id)} title={h.label} className="block w-full truncate px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">{h.label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
