import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronDown, Pin, X } from "lucide-react";
import { useDevMode } from "../../devMode";
import type { QuestionKeeperMenu } from "../questionKeeper";
import { MAX_KEPT } from "../questionKeeper";

const CLAMP2 = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" };

export const MenuDropdown = ({
  colorScheme,
  setColorScheme,
  onClose,
  onOpenInfo,
  lessons,
  onStartLesson,
  menuItems,
  keeper,
}: {
  colorScheme: string;
  setColorScheme: (s: string) => void;
  onClose: () => void;
  onOpenInfo: () => void;
  /** Lessons this tool offers (inside the tool, never across tools). Listed above Tool Information. */
  lessons?: { id: string; title: string; summary: string }[];
  onStartLesson?: (id: string) => void;
  /** Extra items a tool adds (printables and the like), listed under Copy Link. */
  menuItems?: { label: string; hint?: string; onClick: () => void }[];
  /** Recent and pinned questions (this visit only). */
  keeper?: QuestionKeeperMenu;
}) => {
  const devMode = useDevMode();   // colour schemes are a dev-gated feature for now
  const [colorOpen, setColorOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [keptOpen, setKeptOpen] = useState(false);   // the recent / pinned questions pop out beside the menu (below it on a phone)
  const ref = useRef<HTMLDivElement>(null);

  // The URL always reflects the current setup (ToolShell keeps it in sync),
  // so copying it gives a link that reopens the tool exactly as configured.
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => { setCopied(false); onClose(); }, 900);
    } catch {
      window.prompt("Copy this link:", window.location.href);
      onClose();
    }
  };
  useEffect(() => {
    const h = (e: MouseEvent) => {
      // a tap on the ink layer must reach the menu item under it (the layer freezes so the second tap is a real click), not close the menu first
      if ((e.target as Element | null)?.closest?.("[data-ink-ui]")) return;
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-lift border border-gray-200 z-50" style={{ minWidth: "200px" }}>
      <div className="py-1">
        {devMode && (<>
        <button
          onClick={() => setColorOpen(!colorOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-gray-400 transition-transform duration-200 ${colorOpen ? "rotate-90" : ""}`}>
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Colour Scheme</span>
          </div>
          <span className="text-xs text-gray-400 font-normal capitalize">{colorScheme}</span>
        </button>
        {colorOpen && (
          <div className="border-t border-gray-100">
            {["default", "blue", "pink", "yellow"].map(s => (
              <button
                key={s}
                onClick={() => { setColorScheme(s); onClose(); }}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold transition-colors capitalize ${colorScheme === s ? "bg-blue-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {s}
                {colorScheme === s && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1" />
        </>)}
        <button
          onClick={copyLink}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-green-600 flex-shrink-0">
              <path d="M2.5 8.5l3.5 3.5L13.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0">
              <path d="M6.5 9.5a3 3 0 004.2.3l2-2a3 3 0 00-4.2-4.2l-1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M9.5 6.5a3 3 0 00-4.2-.3l-2 2a3 3 0 004.2 4.2l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
          {copied ? "Link copied!" : "Copy Link to Setup"}
        </button>
        {menuItems && menuItems.length > 0 && (<>
          <div className="border-t border-gray-100 my-1" />
          {menuItems.map(m => (
            <button
              key={m.label}
              data-trusted-click
              onClick={() => { m.onClick(); onClose(); }}
              title={m.hint}
              className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {m.label}
              {m.hint && <span className="block text-xs font-normal text-gray-400">{m.hint}</span>}
            </button>
          ))}
        </>)}
        {keeper && (<>
          <div className="border-t border-gray-100 my-1" />
          <div className="relative">
            <button onClick={() => setKeptOpen(!keptOpen)} aria-expanded={keptOpen}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors ${keptOpen ? "bg-gray-50" : ""}`}>
              <ChevronLeft size={16} className="hidden sm:block text-gray-400 shrink-0" />
              <ChevronDown size={16} className={`sm:hidden text-gray-400 shrink-0 transition-transform ${keptOpen ? "" : "-rotate-90"}`} />
              <span className="flex-1 text-left">Recent &amp; pinned questions</span>
              {keeper.pins.length > 0 && <span className="text-xs font-normal text-gray-400">{keeper.pins.length} pinned</span>}
            </button>
            {keptOpen && (
              <div className="sm:absolute sm:right-full sm:top-0 sm:mr-2 sm:bg-white sm:rounded-xl sm:shadow-lift sm:border sm:border-gray-200 border-t border-gray-100 bg-gray-50 sm:bg-white py-1" style={{ width: "min(24rem, 86vw)" }}>
                <div className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Recent questions</div>
                {keeper.history.length === 0 && <div className="px-4 pb-2 text-xs text-gray-400">Questions you move on from appear here.</div>}
                {keeper.history.map(h => (
                  <button key={h.id} onClick={() => { keeper.onPick(h.id); onClose(); }} title={h.label}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 sm:hover:bg-gray-50 transition-colors"><span style={CLAMP2}>{h.label}</span></button>
                ))}
                <div className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Pinned ({keeper.pins.length}/{MAX_KEPT})</div>
                {keeper.pins.map(h => (
                  <div key={h.id} className={`flex items-center ${h.id === keeper.currentId ? "bg-blue-50" : ""}`}>
                    <button onClick={() => { keeper.onPick(h.id); onClose(); }} title={h.label}
                      className="flex-1 min-w-0 text-left pl-4 pr-2 py-2 text-sm text-gray-700 hover:bg-gray-100 sm:hover:bg-gray-50 transition-colors"><span style={CLAMP2}>{h.label}</span></button>
                    <button onClick={() => keeper.onUnpin(h.id)} aria-label="Unpin" className="shrink-0 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700"><X size={15} /></button>
                  </div>
                ))}
                <button onClick={keeper.onPin} disabled={!keeper.canPin}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-900 hover:bg-gray-100 sm:hover:bg-gray-50 transition-colors disabled:text-gray-400 disabled:hover:bg-transparent">
                  <Pin size={15} className="shrink-0" />{keeper.isPinned ? "Unpin this question" : keeper.canPin ? "Pin this question" : `Unpin one first (${MAX_KEPT} pinned)`}
                </button>
              </div>
            )}
          </div>
        </>)}
        {lessons && lessons.length > 0 && onStartLesson && (<>
          <div className="border-t border-gray-100 my-1" />
          <div className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Lessons</div>
          {lessons.map(l => (
            <button
              key={l.id}
              onClick={() => { onStartLesson(l.id); onClose(); }}
              title={l.summary}
              className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {l.title}
              <span className="block text-xs font-normal text-gray-400">{l.summary}</span>
            </button>
          ))}
        </>)}
        <div className="border-t border-gray-100 my-1" />
        <button
          onClick={() => { onOpenInfo(); onClose(); }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Tool Information
        </button>
      </div>
    </div>
  );
};
