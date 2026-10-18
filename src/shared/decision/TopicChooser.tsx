import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ShellChooser, ShellOption, ShellSubTool } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// TopicChooser — everything about WHAT is being practised (course, practice type, topic) in one container at the top of the page.
// Collapsed it is a single row (‹ topic ›  ▾) so it costs almost nothing while practising; opened it expands in place into filters and
// grouped topic tiles. Picking a tile leaves it open; only its own header row collapses it. The toolbar (level, question options, New Question) is not part of it.
// ═══════════════════════════════════════════════════════════════════════════

export default function TopicChooser({ chooser, filters, options, tabs, variants, subTool, onFilter, onTopic, narrow, startOpen, mode }: {
  chooser: ShellChooser;
  filters: ShellOption[];
  options: Record<string, string>;
  tabs: ShellSubTool[];
  /** the tiles on offer for EVERY combination of the filters: the open panel is as tall as the tallest, so choosing a filter never makes the page jump */
  variants?: Array<{ values: Record<string, string>; tabs: ShellSubTool[] }>;
  subTool: string;
  onFilter: (key: string, value: string) => void;
  onTopic: (key: string) => void;
  narrow: boolean;
  startOpen: boolean;
  /** an extra either/or beside the filters (Practice | Worksheet), shown when it applies */
  mode?: { value: string; choices: Array<{ value: string; label: string }>; onChange: (v: string) => void };
}) {
  const [open, setOpen] = useState(startOpen);
  const selectedRef = useRef<HTMLButtonElement | null>(null);
  // opening the chooser brings the current topic's tile into view (it may be in a group further down)
  useEffect(() => { if (open) selectedRef.current?.scrollIntoView({ block: "nearest" }); }, [open]);
  const idx = tabs.findIndex((t) => t.key === subTool);
  const current = tabs[idx];
  const filterText = [...filters.map((o) => o.choices.find((c) => c.value === options[o.key])?.label), mode ? mode.choices.find((c) => c.value === mode.value)?.label : undefined].filter(Boolean).join(" · ");

  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-card min-w-0">
      {/* the label is centred on the card whatever sits either side of it; the ▾ hangs off its right edge */}
      <div className="flex justify-center px-3 py-3 sm:px-5 sm:py-4">
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="relative min-w-0 max-w-full rounded-lg px-9 py-0.5 hover:bg-slate-50 text-center leading-tight">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">{filterText}</span>
          <span className="block text-base font-semibold text-slate-900 truncate">{current?.label ?? "Choose a topic"}</span>
          <ChevronDown size={18} className="absolute right-2 top-1/2 -mt-[9px] text-slate-400 transition-transform" style={{ transform: open ? "rotate(180deg)" : undefined }} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 0.25s ease" }}>
        <div style={{ overflow: "hidden", visibility: open ? "visible" : "hidden", transition: `visibility 0s linear ${open ? 0 : 0.25}s` }} aria-hidden={!open}>
          <div className="border-t border-slate-200 px-3 sm:px-5 py-4 flex flex-col items-center gap-5" style={narrow ? { maxHeight: "68dvh", overflowY: "auto" } : undefined}>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {filters.map((o) => (
                <div key={o.key} className="inline-flex gap-1 rounded-xl bg-slate-200/60 p-1">
                  {o.choices.map((c) => (
                    <button key={c.value} onClick={() => onFilter(o.key, c.value)}
                      className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-colors ${options[o.key] === c.value ? "bg-white text-blue-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>{c.label}</button>
                  ))}
                </div>
              ))}
              {mode && (
                <div className="inline-flex gap-1 rounded-xl bg-slate-200/60 p-1">
                  {mode.choices.map((c) => (
                    <button key={c.value} onClick={() => mode.onChange(c.value)}
                      className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-colors ${mode.value === c.value ? "bg-white text-blue-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>{c.label}</button>
                  ))}
                </div>
              )}
            </div>
            {/* only the tiles for the current filters are shown, so the panel is as tall as what is in it */}
            <div className="w-full" style={{ display: "grid" }}>
              {(variants && variants.length ? variants : [{ values: Object.fromEntries(filters.map((o) => [o.key, options[o.key]])), tabs }]).map((v, vi) => {
                const here = filters.every((o) => v.values[o.key] === options[o.key]);
                return (
                  <div key={vi} style={{ display: here ? "block" : "none" }} aria-hidden={!here}>
                    <div className="flex flex-col items-center gap-5">
            {chooser.groups.map((g) => {
              const items = g.keys.map((k) => v.tabs.find((t) => t.key === k)).filter((t): t is ShellSubTool => !!t);
              if (!items.length) return null;
              return (
                <div key={g.title} className="w-full">
                  <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">{g.title}</div>
                  <div className="flex flex-wrap justify-center gap-2.5">
                    {items.map((t) => {
                      const on = t.key === subTool;
                      return (
                        <button key={t.key} ref={on && here ? selectedRef : undefined} onClick={() => onTopic(t.key)}
                          className={`flex flex-col items-stretch gap-2 rounded-xl border p-2.5 text-center transition-colors ${on ? "border-blue-900 ring-1 ring-blue-900 bg-blue-50" : "border-slate-300 bg-white hover:bg-slate-50"}`}
                          style={{ width: narrow ? "calc(50% - 5px)" : 188 }}>
                          {chooser.art && <span className="block rounded-lg bg-white border border-slate-200 px-2 py-1">{chooser.art(t.key)}</span>}
                          <span className="block font-semibold text-sm leading-snug text-slate-900">{t.label}</span>
                          {t.blurb && <span className="block text-xs leading-snug text-slate-500">{t.blurb}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
