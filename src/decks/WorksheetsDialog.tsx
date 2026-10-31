import { useEffect, useState } from "react";
import { FileText, Plus, Printer, RefreshCw, X } from "lucide-react";
import type { PrintMode } from "../shared";
import { Label, Num, input, small } from "./EditorPanels";
import { MAX_PINNED, freezeSheet, isFrozen, pinnedSheets, printSheet, type Sheet } from "./worksheets";
import type { DeckDef, PinnedSheet } from "./types";

// Worksheets pinned to the lesson: the pin controls in the properties panel, and the "Worksheets" window under File that lists
// them with their print buttons. The layout is the tool pages' Worksheet layout; the page is A5 unless the sheet says A4.

const PAPER: PinnedSheet["paper"][] = ["A5", "A4"];
const choice = (on: boolean) => `${small} ${on ? "!bg-slate-800 !text-white" : ""}`;

/** Prints a sheet, and keeps a frozen copy of its questions with the deck if it has none (the print comes first so the browser allows its window). */
function usePrint(onPatch: (id: string, patch: Partial<Sheet>) => void) {
  return (el: Sheet, mode: PrintMode) => {
    void printSheet(el, mode);
    if (!isFrozen(el)) void freezeSheet(el).then((frozen) => onPatch(el.id, { frozen }));
  };
}

/** Pin controls for a book activity: make it a printable worksheet, name it, choose its page, and print it. */
export function SheetProps({ el, set, canPin }: { el: Sheet; set: (patch: Partial<Sheet>) => void; canPin: boolean }) {
  const pin = el.pin;
  const print = usePrint((_, patch) => set(patch));
  const setPin = (p: Partial<PinnedSheet>) => pin && set({ pin: { ...pin, ...p } });
  const newSet = () => { const seed = Math.floor(Math.random() * 1e9); set({ seed, frozen: undefined }); void freezeSheet({ ...el, seed }).then((frozen) => set({ frozen })); };
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 font-semibold text-slate-900"><FileText size={16} />Printable worksheet</div>
      <label className="mt-2 flex min-h-8 items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" className="h-4 w-4 accent-blue-900" checked={!!pin} disabled={!pin && !canPin}
          onChange={(e) => {
            if (e.target.checked) { const next: PinnedSheet = { title: "Worksheet", paper: "A5", layout: "grid", borders: true, fontPx: 16 }; set({ pin: next }); void freezeSheet({ ...el, pin: next }).then((frozen) => set({ frozen })); }
            else set({ pin: undefined, frozen: undefined, view: undefined });
          }} />
        Pin to the lesson {!pin && !canPin && <span className="text-xs text-slate-500">(three are pinned already)</span>}
      </label>
      {pin && (
        <>
          <Label>Title</Label>
          <input className={input} value={pin.title} onChange={(e) => setPin({ title: e.target.value })} aria-label="Worksheet title" />
          <Label>Page</Label>
          <div className="flex gap-1">{PAPER.map((p) => <button key={p} className={choice((pin.paper ?? "A5") === p)} onClick={() => setPin({ paper: p })}>{p}</button>)}</div>
          <Label>Layout</Label>
          <div className="flex gap-1">{(["grid", "list"] as const).map((l) => <button key={l} className={choice((pin.layout ?? "grid") === l)} onClick={() => setPin({ layout: l })}>{l === "grid" ? "Grid" : "List"}</button>)}
            <button className={choice(pin.borders !== false)} onClick={() => setPin({ borders: pin.borders === false })}>Borders</button></div>
          <div className="mt-2"><Num label="Text size (px)" value={pin.fontPx ?? 16} min={9} onChange={(fontPx) => setPin({ fontPx: Math.max(9, Math.min(30, fontPx)) })} /></div>
          <Label>This slide shows</Label>
          <div className="flex gap-1">
            <button className={choice(el.view !== "key")} onClick={() => set({ view: undefined })}>The questions</button>
            <button className={choice(el.view === "key")} onClick={() => set({ view: "key" })}>The answers</button>
          </div>
          <p className="mt-1 text-xs text-slate-500">The answers show when you press A. The questions are the sheet to hand out.</p>
          <div className="mt-3 flex flex-wrap gap-1">
            <button className={small} onClick={() => print(el, "questions")}><Printer size={12} />Print</button>
            <button className={small} onClick={() => print(el, "answers")}><Printer size={12} />Answer sheet</button>
            <button className={small} onClick={newSet}><RefreshCw size={12} />New set</button>
          </div>
        </>
      )}
    </div>
  );
}

/** File → Worksheets: the worksheets pinned to this lesson, with their print buttons. */
export function WorksheetsDialog({ deck, onClose, onPatch, onGo, onAdd }: {
  deck: Pick<DeckDef, "slides">; onClose: () => void; onPatch: (id: string, patch: Partial<Sheet>) => void; onGo: (slideNo: number) => void; onAdd?: () => void;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [onClose]);
  const sheets = pinnedSheets(deck);
  const print = usePrint((id, patch) => { onPatch(id, patch); tick((n) => n + 1); });
  return (
    <div className="fixed inset-0 z-[2600] flex items-center justify-center bg-slate-900/30 p-4" onPointerDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Worksheets" onPointerDown={(e) => e.stopPropagation()} className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-300 bg-white p-5 shadow-lift">
        <div className="mb-1 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Worksheets for this lesson</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><X size={16} /></button></div>
        <p className="mb-3 text-sm text-slate-600">Up to {MAX_PINNED}. Each prints on an A5 page with the same layout as the tool's Worksheet, and has an answer sheet. To get two to an A4 sheet, choose "Pages per sheet: 2" in the print window.</p>
        {sheets.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Nothing pinned yet. Pin one to print it, with its answers.</p>}
        {sheets.map(({ el, slideNo }) => (
          <div key={el.id} className="mb-2 rounded-xl border border-slate-200 p-3">
            <div className="flex items-baseline justify-between gap-2"><div className="font-semibold text-slate-900">{el.pin?.title}</div>
              <button className="text-xs font-semibold text-blue-800 underline" onClick={() => { onGo(slideNo); onClose(); }}>Slide {slideNo}</button></div>
            <div className="mt-0.5 text-xs text-slate-500">{el.count} questions · {el.cols} column{el.cols === 1 ? "" : "s"} · {el.pin?.paper ?? "A5"} · Level {el.preset.level.slice(-1)}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              <button className={small} onClick={() => print(el, "questions")}><Printer size={12} />Print</button>
              <button className={small} onClick={() => print(el, "answers")}><Printer size={12} />Answer sheet</button>
              <button className={small} onClick={() => print(el, "both")}><Printer size={12} />Both</button>
            </div>
          </div>
        ))}
        {onAdd && <button className={`${small} mt-1 min-h-10`} disabled={sheets.length >= MAX_PINNED} onClick={() => { onAdd(); onClose(); }}><Plus size={12} />Pin a new worksheet</button>}
      </div>
    </div>
  );
}
